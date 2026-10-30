import { useState, useEffect } from 'react';
import {
  db,
  doc,
  collection,
  onSnapshot,
  updateDoc,
  setDoc,
  query,
  where,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import type { Auction, AuctionState, Team, Player, PlayerRole } from '../types/auction';
import { CelebrationConfetti } from '../components/CelebrationConfetti';
import { PlayerDecisionPopup } from '../components/PlayerDecisionPopup';
import { AdminPreAuctionPhotoManager } from '../components/AdminPreAuctionPhotoManager';
import { useLiveViewers, formatViewerCount } from '../lib/useLiveViewers';
import {
  Play,
  Pause,
  SkipForward,
  Check,
  X,
  StopCircle,
  ExternalLink,
  Coins,
  Shield,
  AlertCircle,
  Sparkles,
  Users,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Zap,
  Image as ImageIcon,
  Gavel
} from 'lucide-react';

interface AdminLiveAuctionControlProps {
  auctionId: string;
  onBack: () => void;
  onViewResults: () => void;
}

export function AdminLiveAuctionControl({
  auctionId,
  onBack,
  onViewResults
}: AdminLiveAuctionControlProps) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time live viewer count watching this auction
  const liveViewerCount = useLiveViewers(auctionId, false);

  // Form states for bidding
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [bidPoints, setBidPoints] = useState<number>(50);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPreAuctionPhotoManager, setShowPreAuctionPhotoManager] = useState(false);
  const [mobileTab, setMobileTab] = useState<'desk' | 'teams' | 'queue'>('desk');
  const [showManualAdjuster, setShowManualAdjuster] = useState(false);

  // 1. Subscribe to Auction
  useEffect(() => {
    if (!auctionId) return;

    // Fail-safe timer to prevent loading hang
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    const unsub = onSnapshot(
      doc(db, 'auctions', auctionId),
      (snap) => {
        if (snap.exists()) {
          setAuction({ id: snap.id, ...snap.data() } as Auction);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Auction live subscription notice:', err);
        setLoading(false);
      }
    );
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [auctionId]);

  // 2. Subscribe to AuctionState
  useEffect(() => {
    if (!auctionId) return;
    const unsub = onSnapshot(
      doc(db, 'auctionState', auctionId),
      (snap) => {
        if (snap.exists()) {
          const state = { id: snap.id, ...snap.data() } as AuctionState;
          setAuctionState(state);
          if (state.currentBidPoints) {
            setBidPoints(state.currentBidPoints);
          }
          if (state.winningTeamId) {
            setSelectedTeamId(state.winningTeamId);
          }
        }
      },
      (err) => {
        console.warn('AuctionState live subscription notice:', err);
      }
    );
    return () => unsub();
  }, [auctionId]);

  // 3. Subscribe to Teams
  useEffect(() => {
    if (!auctionId) return;
    const q = query(collection(db, 'teams'), where('auctionId', '==', auctionId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Team[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Team));
        list.sort((a, b) => b.remainingPurse - a.remainingPurse);
        setTeams(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Teams live query notice:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [auctionId]);

  // 4. Subscribe to Players
  useEffect(() => {
    if (!auctionId) return;
    const q = query(collection(db, 'players'), where('auctionId', '==', auctionId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Player[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Player));
        list.sort((a, b) => a.order - b.order);
        setPlayers(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Players live query notice:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [auctionId]);

  // Filter player groups
  const currentPlayer = players.find((p) => p.id === auctionState?.currentPlayerId);
  const upcomingPlayers = players.filter((p) => p.status === 'upcoming');
  const soldPlayers = players.filter((p) => p.status === 'sold');
  const unsoldPlayers = players.filter((p) => p.status === 'unsold');

  // Handle Starting Auction
  const handleStartAuction = async () => {
    if (!auction) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const now = new Date().toISOString();
      const firstPlayer = players.find((p) => p.status === 'upcoming' || p.status === 'current') || players[0];

      if (!firstPlayer) {
        setActionError('Please add players to this auction before starting.');
        setSubmitting(false);
        return;
      }

      // Update player to current
      await updateDoc(doc(db, 'players', firstPlayer.id), {
        status: 'current',
        updatedAt: now
      });

      // Update Auction state
      const stateRef = doc(db, 'auctionState', auctionId);
      await setDoc(stateRef, {
        id: auctionId,
        auctionId,
        auctionName: auction.name,
        status: 'live',
        round: 'regular',
        currentPlayerId: firstPlayer.id,
        currentPlayerName: firstPlayer.name,
        currentPlayerRole: firstPlayer.role,
        currentPlayerPhoto: firstPlayer.photoUrl,
        currentPlayerBasePoints: firstPlayer.basePoints,
        currentPlayerSlotNumber: firstPlayer.slotNumber || 1,
        currentPlayerSlotName: firstPlayer.slotName || '',
        playerStatus: 'bidding',
        currentBidPoints: firstPlayer.basePoints,
        winningTeamId: null,
        winningTeamName: null,
        winningTeamLogo: null,
        winningTeamRemainingPurse: null,
        updatedAt: now
      });

      // Update auction status
      await updateDoc(doc(db, 'auctions', auctionId), {
        status: 'live',
        round: 'regular',
        updatedAt: now
      });

      setBidPoints(firstPlayer.basePoints);
      setSelectedTeamId('');
      setActionSuccess('Auction is now LIVE!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to start auction');
    } finally {
      setSubmitting(false);
    }
  };

  // Update live bid
  const handleUpdateBid = async (newPoints: number, teamId: string) => {
    if (!auctionState || !auctionState.currentPlayerId) return;

    if (auctionState.status === 'paused') {
      setActionError('Auction is currently PAUSED! You must RESUME the auction before placing or updating bids.');
      return;
    }

    setBidPoints(newPoints);
    setSelectedTeamId(teamId);

    const team = teams.find((t) => t.id === teamId);

    try {
      await updateDoc(doc(db, 'auctionState', auctionId), {
        currentBidPoints: Number(newPoints),
        winningTeamId: team ? team.id : null,
        winningTeamName: team ? team.name : null,
        winningTeamLogo: team ? team.logoUrl : null,
        winningTeamRemainingPurse: team ? team.remainingPurse : null,
        playerStatus: 'bidding',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Bid update failed:', err);
    }
  };

  // Direct 1-Click Team Bidding: Hit particular team button to immediately apply +5 pts (or target points)
  const handleDirectTeamBid = async (team: Team, targetPoints?: number) => {
    if (!currentPlayer || !auctionState || !auctionState.currentPlayerId) return;

    if (auctionState.status === 'paused') {
      setActionError('Auction is currently PAUSED! Please click RESUME AUCTION first before placing bids.');
      return;
    }

    const basePrice = currentPlayer.basePoints || 50;
    const currentPrice = auctionState.currentBidPoints && auctionState.winningTeamId
      ? auctionState.currentBidPoints
      : basePrice;

    const newBid = targetPoints !== undefined
      ? targetPoints
      : (auctionState.winningTeamId ? currentPrice + 5 : basePrice);

    if (team.remainingPurse < newBid) {
      setActionError(
        `Cannot bid! ${team.name} only has ${team.remainingPurse} PTS remaining in purse (Bid requires ${newBid} PTS).`
      );
      return;
    }

    setBidPoints(newBid);
    setSelectedTeamId(team.id);
    setActionError(null);

    try {
      await updateDoc(doc(db, 'auctionState', auctionId), {
        currentBidPoints: Number(newBid),
        winningTeamId: team.id,
        winningTeamName: team.name,
        winningTeamLogo: team.logoUrl,
        winningTeamRemainingPurse: team.remainingPurse,
        playerStatus: 'bidding',
        updatedAt: new Date().toISOString()
      });
      setActionSuccess(`Bid placed: ${team.name} holds highest bid at ₹ ${newBid} PTS`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Direct team bid failed:', err);
      setActionError('Failed to record bid. Please try again.');
    }
  };

  // Handle Mark SOLD
  const handleMarkSold = async () => {
    if (!currentPlayer || !auctionState) return;
    setActionError(null);

    if (auctionState.status === 'paused') {
      setActionError('Auction is currently PAUSED! Please RESUME the auction first before marking player as SOLD.');
      return;
    }

    if (!selectedTeamId) {
      setActionError('Please select the winning team before marking player as SOLD.');
      return;
    }

    const winningTeam = teams.find((t) => t.id === selectedTeamId);
    if (!winningTeam) {
      setActionError('Invalid winning team selected.');
      return;
    }

    if (bidPoints > winningTeam.remainingPurse) {
      setActionError(
        `Cannot sell! Bid of ${bidPoints} PTS exceeds ${winningTeam.name}'s remaining purse of ${winningTeam.remainingPurse} PTS.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const newRemainingPurse = winningTeam.remainingPurse - bidPoints;
      const newTotalSpent = (winningTeam.totalSpent || 0) + bidPoints;
      const newCount = (winningTeam.purchasedPlayerCount || 0) + 1;

      // 1. Update Team Doc
      await updateDoc(doc(db, 'teams', winningTeam.id), {
        remainingPurse: newRemainingPurse,
        totalSpent: newTotalSpent,
        purchasedPlayerCount: newCount,
        updatedAt: now
      });

      // 2. Update Player Doc
      await updateDoc(doc(db, 'players', currentPlayer.id), {
        status: 'sold',
        soldPoints: bidPoints,
        soldToTeamId: winningTeam.id,
        soldToTeamName: winningTeam.name,
        soldToTeamLogo: winningTeam.logoUrl,
        updatedAt: now
      });

      // 3. Update AuctionState with SOLD broadcast
      await updateDoc(doc(db, 'auctionState', auctionId), {
        playerStatus: 'sold',
        currentBidPoints: bidPoints,
        winningTeamId: winningTeam.id,
        winningTeamName: winningTeam.name,
        winningTeamLogo: winningTeam.logoUrl,
        winningTeamRemainingPurse: newRemainingPurse,
        lastSoldPlayerName: currentPlayer.name,
        lastSoldPlayerPhoto: currentPlayer.photoUrl,
        lastSoldPoints: bidPoints,
        lastSoldTeamName: winningTeam.name,
        lastSoldTeamLogo: winningTeam.logoUrl,
        updatedAt: now
      });

      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
      setActionSuccess(`Player ${currentPlayer.name} successfully SOLD to ${winningTeam.name} for ${bidPoints} PTS!`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark player sold');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Mark UNSOLD
  const handleMarkUnsold = async () => {
    if (!currentPlayer || !auctionState) return;

    if (auctionState.status === 'paused') {
      setActionError('Auction is currently PAUSED! Please RESUME the auction first.');
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const now = new Date().toISOString();

      // 1. Update Player Doc status to unsold
      await updateDoc(doc(db, 'players', currentPlayer.id), {
        status: 'unsold',
        soldPoints: 0,
        soldToTeamId: null,
        soldToTeamName: null,
        updatedAt: now
      });

      // 2. Broadcast UNSOLD on state
      await updateDoc(doc(db, 'auctionState', auctionId), {
        playerStatus: 'unsold',
        winningTeamId: null,
        winningTeamName: null,
        winningTeamLogo: null,
        lastUnsoldPlayerName: currentPlayer.name,
        lastUnsoldPlayerPhoto: currentPlayer.photoUrl,
        lastUnsoldPlayerRole: currentPlayer.role,
        lastUnsoldBasePoints: currentPlayer.basePoints,
        updatedAt: now
      });

      setActionSuccess(`Player ${currentPlayer.name} marked as UNSOLD and added to the Unsold Pool.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark player unsold');
    } finally {
      setSubmitting(false);
    }
  };

  // Next Player
  const handleNextPlayer = async () => {
    if (auctionState?.status === 'paused') {
      setActionError('Auction is currently PAUSED! Please RESUME the auction first before advancing to next player.');
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const now = new Date().toISOString();
      const currentRound = auctionState?.round || 'regular';

      if (currentRound === 'regular') {
        // Find next upcoming player in regular roster
        const nextPlayer = players.find((p) => p.status === 'upcoming');

        if (nextPlayer) {
          // Advance to next regular player
          await updateDoc(doc(db, 'players', nextPlayer.id), {
            status: 'current',
            updatedAt: now
          });

          await updateDoc(doc(db, 'auctionState', auctionId), {
            currentPlayerId: nextPlayer.id,
            currentPlayerName: nextPlayer.name,
            currentPlayerRole: nextPlayer.role,
            currentPlayerPhoto: nextPlayer.photoUrl,
            currentPlayerBasePoints: nextPlayer.basePoints,
            currentPlayerSlotNumber: nextPlayer.slotNumber || 1,
            currentPlayerSlotName: nextPlayer.slotName || '',
            playerStatus: 'bidding',
            currentBidPoints: nextPlayer.basePoints,
            winningTeamId: null,
            winningTeamName: null,
            winningTeamLogo: null,
            winningTeamRemainingPurse: null,
            updatedAt: now
          });

          setBidPoints(nextPlayer.basePoints);
          setSelectedTeamId('');
        } else {
          // Regular roster complete! Check if any unsold players exist
          const freshUnsold = players.filter((p) => p.status === 'unsold');
          if (freshUnsold.length > 0) {
            // Trigger UNSOLD PLAYER ROUND
            const firstUnsold = freshUnsold[0];
            await updateDoc(doc(db, 'players', firstUnsold.id), {
              status: 'current',
              round: 'unsold',
              updatedAt: now
            });

            await updateDoc(doc(db, 'auctionState', auctionId), {
              round: 'unsold',
              currentPlayerId: firstUnsold.id,
              currentPlayerName: firstUnsold.name,
              currentPlayerRole: firstUnsold.role,
              currentPlayerPhoto: firstUnsold.photoUrl,
              currentPlayerBasePoints: firstUnsold.basePoints,
              currentPlayerSlotNumber: firstUnsold.slotNumber || 1,
              currentPlayerSlotName: firstUnsold.slotName || 'Unsold Recall',
              playerStatus: 'bidding',
              currentBidPoints: firstUnsold.basePoints,
              winningTeamId: null,
              winningTeamName: null,
              winningTeamLogo: null,
              winningTeamRemainingPurse: null,
              updatedAt: now
            });

            await updateDoc(doc(db, 'auctions', auctionId), {
              round: 'unsold',
              updatedAt: now
            });

            setBidPoints(firstUnsold.basePoints);
            setSelectedTeamId('');
            setActionSuccess('Regular round complete! Commencing the UNSOLD PLAYER ROUND.');
          } else {
            // Auction Complete
            await handleFinishAuction();
          }
        }
      } else {
        // In Unsold Round: pick next unsold player
        const remainingUnsold = players.filter(
          (p) => p.status === 'unsold' && p.id !== auctionState?.currentPlayerId
        );

        if (remainingUnsold.length > 0) {
          const nextUnsold = remainingUnsold[0];
          await updateDoc(doc(db, 'players', nextUnsold.id), {
            status: 'current',
            round: 'unsold',
            updatedAt: now
          });

          await updateDoc(doc(db, 'auctionState', auctionId), {
            round: 'unsold',
            currentPlayerId: nextUnsold.id,
            currentPlayerName: nextUnsold.name,
            currentPlayerRole: nextUnsold.role,
            currentPlayerPhoto: nextUnsold.photoUrl,
            currentPlayerBasePoints: nextUnsold.basePoints,
            currentPlayerSlotNumber: nextUnsold.slotNumber || 1,
            currentPlayerSlotName: nextUnsold.slotName || 'Unsold Recall',
            playerStatus: 'bidding',
            currentBidPoints: nextUnsold.basePoints,
            winningTeamId: null,
            winningTeamName: null,
            winningTeamLogo: null,
            winningTeamRemainingPurse: null,
            updatedAt: now
          });

          setBidPoints(nextUnsold.basePoints);
          setSelectedTeamId('');
        } else {
          // No more unsold players or round finished
          setActionSuccess('All players in the unsold pool have been processed.');
        }
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to advance to next player');
    } finally {
      setSubmitting(false);
    }
  };

  // Pause / Resume
  const handleTogglePause = async () => {
    if (!auctionState) return;
    const newStatus = auctionState.status === 'live' ? 'paused' : 'live';
    try {
      await updateDoc(doc(db, 'auctionState', auctionId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'auctions', auctionId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Pause toggle failed:', err);
    }
  };

  // Finish Auction
  const handleFinishAuction = async () => {
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'auctionState', auctionId), {
        status: 'completed',
        updatedAt: now
      });
      await updateDoc(doc(db, 'auctions', auctionId), {
        status: 'completed',
        updatedAt: now
      });
      setActionSuccess('Auction has been officially COMPLETED!');
    } catch (err) {
      console.error('Finish auction failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060c16] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#f5d77f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedWinningTeam = teams.find((t) => t.id === selectedTeamId);
  const activeHoldingTeam = teams.find((t) => t.id === (auctionState?.winningTeamId || selectedTeamId));
  const currentLiveBidPoints = auctionState?.currentBidPoints || bidPoints || currentPlayer?.basePoints || 50;

  return (
    <div className="min-h-screen bg-[#060c16] text-white p-4 sm:p-6 lg:p-8 selection:bg-[#f5d77f] selection:text-[#060c16]">
      <CelebrationConfetti active={showCelebration} />
      <PlayerDecisionPopup auctionState={auctionState} teams={teams} />

      {/* TOP HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#13243f]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-[#0a1526] border border-[#13243f] hover:bg-[#0e1f38] text-[#c5d3e8] hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {/* Official ZPL Tournament Crest Logo */}
          <div className="w-12 h-12 rounded-full bg-[#081220] border-2 border-[#f5d77f]/60 p-0.5 flex items-center justify-center shadow-lg ring-1 ring-[#f5d77f]/30 shrink-0 overflow-hidden">
            <img
              src="/assets/aistudio/file_00000000661882118ee895643705c2c1_2d4830dd.png"
              alt="ZPL Official Logo"
              className="w-full h-full object-contain filter contrast-105"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0a1526] text-[#f5d77f] border border-[#f5d77f]/30 text-xs font-black uppercase tracking-wider shadow-sm">
                Admin Control Room
              </span>
              {auctionState?.round === 'unsold' && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-wider animate-pulse shadow-sm">
                  Unsold Player Round
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              {auction?.name || 'Live Auction Control'}
            </h1>
          </div>
        </div>

        {/* ACTION BUTTONS & PUBLIC VIEWER LINK */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* REAL-TIME LIVE VIEWERS WATCHING BADGE */}
          <div
            className="min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-950 border border-emerald-500/50 text-white shadow-sm"
            title="Real-time count of viewers currently watching the auction"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-black text-white">
              {formatViewerCount(liveViewerCount)} <span className="font-bold text-zinc-400 hidden sm:inline">Watching Live</span>
            </span>
          </div>

          <button
            onClick={() => setShowPreAuctionPhotoManager(true)}
            className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-amber-500/30 text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors shadow-sm active:scale-98 cursor-pointer"
            title="Manage Pre-Auction Photos (Last Year Champions & Teams Logo)"
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Photos ({auction?.preAuctionPhotos?.length || 0})</span>
          </button>

          <a
            href={`?auction=${auctionId}`}
            target="_blank"
            rel="noreferrer"
            className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-xs sm:text-sm font-black text-black transition-colors shadow-sm active:scale-98 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Public Screen</span>
          </a>

          <button
            onClick={onViewResults}
            className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs sm:text-sm font-bold text-zinc-200 hover:text-white transition-colors shadow-sm active:scale-98 cursor-pointer"
          >
            <Shield className="w-4 h-4 mr-0.5 text-amber-400" />
            <span>Results</span>
          </button>

          {auctionState?.status === 'live' && (
            <button
              onClick={handleTogglePause}
              className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs sm:text-sm transition-colors shadow-sm active:scale-98 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          {auctionState?.status === 'paused' && (
            <button
              onClick={handleTogglePause}
              className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition-colors shadow-sm active:scale-98 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Resume</span>
            </button>
          )}

          {auctionState?.status !== 'completed' && (
            <button
              onClick={handleFinishAuction}
              className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 font-black text-xs sm:text-sm transition-colors shadow-sm active:scale-98 cursor-pointer"
            >
              <StopCircle className="w-4 h-4" />
              <span>Finish</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK MESSAGES */}
      <div className="max-w-7xl mx-auto my-4 space-y-2">
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500 text-rose-100 text-sm flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-semibold">{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-100 text-sm flex items-start gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* MOBILE & TABLET PORTAL TAB SWITCHER (visible on mobile/tablet, hidden on desktop lg:) */}
      <div className="max-w-7xl mx-auto lg:hidden mb-4">
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-md">
          <button
            type="button"
            onClick={() => setMobileTab('desk')}
            className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'desk'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Gavel className="w-3.5 h-3.5 shrink-0" />
            <span>Bidding</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('teams')}
            className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'teams'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Purses ({teams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('queue')}
            className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'queue'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Queue ({upcomingPlayers.length})</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTROL DESK */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* LEFT COLUMN: ACTIVE PLAYER & BID CONTROLS */}
        <div className={`lg:col-span-8 space-y-6 ${mobileTab === 'desk' ? 'block' : 'hidden lg:block'}`}>
          {auctionState?.status === 'draft' || auctionState?.status === 'scheduled' || !auctionState?.currentPlayerId ? (
            <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
              <Play className="w-16 h-16 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] mx-auto animate-pulse" />
              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Ready to Start Auction?
                </h2>
                <p className="text-zinc-400 text-sm">
                  Starting the auction will automatically present the first player to all connected public screens and projector displays in real time.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={handleStartAuction}
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-base sm:text-lg font-black transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Auction Now</span>
                </button>

                <div className="pt-3 border-t border-zinc-800 flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreAuctionPhotoManager(true)}
                    className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-amber-500/30 text-amber-400 hover:text-amber-300 font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 mr-0.5 text-amber-400" />
                    <span>Manage Champions & Team Logos ({auction?.preAuctionPhotos?.length || 0})</span>
                  </button>
                  <span className="text-[11px] text-zinc-400">
                    Photos rotate continuously (5-6s each) on viewer screens until live bidding starts
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 sm:p-7 shadow-2xl space-y-6">
              {/* CURRENT PLAYER HEADER & STATUS */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">
                    Live On Screen
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                      auctionState.playerStatus === 'sold'
                        ? 'bg-emerald-500 text-black'
                        : auctionState.playerStatus === 'unsold'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-400 text-black'
                    }`}
                  >
                    {auctionState.playerStatus}
                  </span>
                </div>

                <span className="text-xs text-zinc-400 font-semibold">
                  Round: {auctionState.round === 'unsold' ? 'Unsold Round' : 'Regular'}
                </span>
              </div>

              {/* LIVE SOLD / UNSOLD STATUS BANNER */}
              {auctionState.playerStatus === 'sold' && (
                <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 text-center shadow-lg">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">
                    OFFICIAL STATUS: SOLD
                  </span>
                  <p className="text-lg sm:text-xl font-black text-white uppercase">
                    {(currentPlayer?.name || auctionState.currentPlayerName)?.toUpperCase()} SOLD TO{' '}
                    <span className="text-emerald-300 underline underline-offset-2">
                      {(auctionState.winningTeamName || 'Winning Team')?.toUpperCase()}
                    </span>{' '}
                    FOR{' '}
                    <span className="text-emerald-300">
                      {auctionState.currentBidPoints} PTS
                    </span>
                  </p>
                </div>
              )}

              {auctionState.playerStatus === 'unsold' && (
                <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-center shadow-lg">
                  <span className="text-xs font-black uppercase tracking-widest text-rose-400 block mb-1">
                    OFFICIAL STATUS: UNSOLD
                  </span>
                  <p className="text-lg sm:text-xl font-black text-white uppercase">
                    {(currentPlayer?.name || auctionState.currentPlayerName)?.toUpperCase()} UNSOLD
                  </p>
                </div>
              )}

              {/* CURRENT PLAYER DETAILS ROW */}
              {currentPlayer && (
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-black border border-zinc-800">
                  <img
                    src={currentPlayer.photoUrl}
                    alt={currentPlayer.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover object-top border-2 border-amber-500/40 shadow-md bg-zinc-950 shrink-0"
                  />
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      {(currentPlayer.slotNumber || currentPlayer.slotName) && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-500/40 text-amber-300 font-black text-xs uppercase tracking-wide">
                          Slot {currentPlayer.slotNumber || 1}{currentPlayer.slotName ? ` • ${currentPlayer.slotName}` : ''}
                        </span>
                      )}
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-black text-xs uppercase tracking-wide">
                        {currentPlayer.role}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white">
                      {currentPlayer.name}
                    </h3>
                    <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-zinc-300 pt-1">
                      <span>
                        Base Points:{' '}
                        <strong className="text-amber-400 font-black">
                          {currentPlayer.basePoints} PTS
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Status:{' '}
                        <strong
                          className={
                            currentPlayer.status === 'sold'
                              ? 'text-emerald-400 font-black'
                              : currentPlayer.status === 'unsold'
                              ? 'text-rose-400 font-black'
                              : 'text-amber-400 font-black'
                          }
                        >
                          {currentPlayer.status.toUpperCase()}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* BIDDING CONTROL BOX */}
              <div className="p-5 rounded-2xl bg-black border border-zinc-800 space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    Live Bid Controller
                  </h4>
                  {auctionState.status === 'paused' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                      <Pause className="w-3 h-3 fill-current" />
                      PAUSED
                    </span>
                  )}
                </div>

                {/* AUCTION PAUSED ALERT BANNER WITH INSTANT RESUME BUTTON */}
                {auctionState.status === 'paused' && (
                  <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg shadow-amber-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center shrink-0 shadow-md">
                        <Pause className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="text-sm font-black text-amber-300 uppercase tracking-wide">
                            Auction is Currently Paused
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 font-medium mt-0.5">
                          Bids cannot be placed while the auction is paused. First click <strong>Resume Auction</strong>, then place the bid.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTogglePause}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Resume Auction</span>
                    </button>
                  </div>
                )}

                {/* PROMINENT LIVE BID STATUS: TEAM NAME & BID POINT VISIBLE TOGETHER */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-2 ${activeHoldingTeam ? 'border-amber-400 shadow-amber-500/15 shadow-xl' : 'border-zinc-800'} transition-all`}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Left: Active Bidder Team Details */}
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      {activeHoldingTeam ? (
                        <>
                          <div className="relative shrink-0">
                            <img
                              src={activeHoldingTeam.logoUrl}
                              alt={activeHoldingTeam.name}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 bg-black shadow-md"
                            />
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] font-black shadow">
                              👑
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400">
                                Current Highest Bidder
                              </span>
                            </div>
                            <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate max-w-[220px] sm:max-w-xs">
                              {activeHoldingTeam.name}
                            </h3>
                            <p className="text-xs font-bold text-zinc-400 mt-0.5">
                              Purse Left: <strong className="text-emerald-400 font-black">{activeHoldingTeam.remainingPurse} PTS</strong>
                              <span className="mx-1.5">•</span>
                              <span>Squad: <strong>{activeHoldingTeam.purchasedPlayerCount || 0}</strong></span>
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400/70 font-black shrink-0">
                            <Coins className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-400">
                              Current Bidding Status
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-zinc-200">
                              No Bids Placed Yet
                            </h3>
                            <p className="text-xs text-zinc-400">
                              Base: <strong className="text-amber-400">{currentPlayer?.basePoints || 50} PTS</strong>. Hit any team's <strong className="text-amber-400">+5 PTS</strong> button below!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Big Bold Bid Point Display */}
                    <div className="w-full sm:w-auto text-center sm:text-right bg-black/60 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-zinc-800/80 sm:border-0">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                        {activeHoldingTeam ? 'Holding Bid Points' : 'Base Starting Price'}
                      </span>
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-400 tracking-tight drop-shadow-md">
                        ₹ {currentLiveBidPoints}{' '}
                        <span className="text-xs sm:text-sm font-bold text-zinc-300 uppercase">
                          PTS
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 block mt-0.5">
                        {activeHoldingTeam
                          ? `Next +5 Hit: ₹ ${currentLiveBidPoints + 5} PTS`
                          : `First +5 Hit: ₹ ${(currentPlayer?.basePoints || 50) + 5} PTS`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DIRECT TEAM BID BUTTONS: HIT TO BID +5 PTS WITH TEAM NAME & BID VISIBLE TOGETHER */}
                <div className={auctionState.status === 'paused' ? 'opacity-60' : ''}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400 fill-current" />
                        <span>Direct Team Bidding (+5 PTS Quick Hit):</span>
                      </label>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        Hit any team's button to immediately register their bid, advance points by +5, and sync live.
                      </span>
                    </div>
                    {auctionState.status === 'paused' && (
                      <span className="text-[11px] font-bold text-amber-400 shrink-0">
                        Paused
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {teams.map((t) => {
                      const isLeading = t.id === auctionState.winningTeamId;
                      const basePrice = currentPlayer?.basePoints || 50;
                      const hasBidder = Boolean(auctionState.winningTeamId);
                      
                      // Next bid points for this team
                      const nextBidForTeam = hasBidder
                        ? currentLiveBidPoints + 5
                        : basePrice + 5;
                      
                      const hasEnoughPurseForNext = t.remainingPurse >= nextBidForTeam;
                      const hasEnoughPurseForBase = t.remainingPurse >= basePrice;
                      const isPaused = auctionState.status === 'paused';

                      return (
                        <div
                          key={t.id}
                          className={`relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                            isPaused
                              ? 'bg-zinc-950/60 border-zinc-800/80 opacity-60'
                              : isLeading
                              ? 'bg-gradient-to-r from-amber-950/40 via-zinc-950 to-amber-950/40 border-2 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                              : hasEnoughPurseForNext
                              ? 'bg-zinc-950 border-zinc-800 hover:border-amber-400/50 hover:bg-zinc-900/60'
                              : 'bg-zinc-950/40 border-zinc-800/40 opacity-40'
                          }`}
                        >
                          {/* Team Info Header */}
                          <div className="flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={t.logoUrl}
                                alt={t.name}
                                className={`w-9 h-9 rounded-full object-cover border bg-black shrink-0 ${
                                  isLeading ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-zinc-700'
                                }`}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h5 className="text-xs sm:text-sm font-black text-white truncate">
                                    {t.name}
                                  </h5>
                                  {isLeading && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider shrink-0">
                                      Leader
                                    </span>
                                  )}
                                </div>
                                <p className={`text-[11px] font-bold ${
                                  t.remainingPurse < nextBidForTeam ? 'text-rose-400' : 'text-emerald-400'
                                }`}>
                                  Purse: {t.remainingPurse} PTS
                                </p>
                              </div>
                            </div>

                            {/* Leading badge or quick bid point display */}
                            {isLeading && (
                              <div className="text-right shrink-0">
                                <span className="text-[9px] uppercase font-bold text-amber-400 block">
                                  Holds Bid
                                </span>
                                <span className="text-sm font-black text-amber-300">
                                  ₹ {currentLiveBidPoints} PTS
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: Direct Hit +5 PTS Button (and Base Price if no bid placed yet) */}
                          <div className="grid grid-cols-1 gap-2 pt-1">
                            {!hasBidder ? (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  disabled={isPaused || !hasEnoughPurseForBase}
                                  onClick={() => handleDirectTeamBid(t, basePrice)}
                                  className="min-h-[44px] px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
                                  title={`Open at Base Price (${basePrice} PTS)`}
                                >
                                  <span>Base: ₹ {basePrice}</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isPaused || !hasEnoughPurseForNext}
                                  onClick={() => handleDirectTeamBid(t, nextBidForTeam)}
                                  className="min-h-[44px] px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                                  title={`Hit to place +5 bid (${nextBidForTeam} PTS)`}
                                >
                                  <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                                  <span>+5 PTS (₹ {nextBidForTeam})</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isPaused || !hasEnoughPurseForNext}
                                onClick={() => handleDirectTeamBid(t, nextBidForTeam)}
                                className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-between transition-all shadow-md active:scale-98 cursor-pointer ${
                                  isPaused
                                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : !hasEnoughPurseForNext
                                    ? 'bg-rose-950/40 border border-rose-800 text-rose-300 cursor-not-allowed opacity-60'
                                    : isLeading
                                    ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black hover:from-amber-300 hover:to-amber-200 border-2 border-amber-300 shadow-amber-500/25'
                                    : 'bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:from-amber-300 hover:to-amber-400 border border-amber-400 shadow-amber-500/20'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <Zap className="w-4 h-4 fill-current shrink-0" />
                                  <span className="truncate">{t.name}</span>
                                </span>
                                <span className="font-black px-2 py-0.5 rounded-lg bg-black text-amber-300 border border-amber-400/50 text-xs shrink-0 ml-2">
                                  +5 PTS ➔ ₹ {nextBidForTeam}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* OPTIONAL / COLLAPSIBLE MANUAL ADJUSTER FOR CUSTOM OVERRIDES */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setShowManualAdjuster(!showManualAdjuster)}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                      <span>Custom / Manual Bid Adjuster (Type Custom PTS, Steppers &amp; Quick Chips)</span>
                    </span>
                    {showManualAdjuster ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>

                  {showManualAdjuster && (
                    <div className="mt-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                      {/* Large Input with Steppers */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          type="button"
                          disabled={auctionState.status === 'paused'}
                          onClick={() => {
                            if (auctionState.status === 'paused') {
                              setActionError('Auction is currently PAUSED! Please click RESUME AUCTION first.');
                              return;
                            }
                            handleUpdateBid(
                              Math.max(
                                currentPlayer?.basePoints || 5,
                                bidPoints - 5
                              ),
                              selectedTeamId
                            );
                          }}
                          className="min-h-[48px] min-w-[48px] sm:min-h-[52px] sm:min-w-[52px] rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700 font-black text-amber-400 text-lg flex items-center justify-center transition-all cursor-pointer shadow-md"
                          title="Step down 5"
                        >
                          -5
                        </button>

                        <div className="relative flex-1">
                          <input
                            type="number"
                            disabled={auctionState.status === 'paused'}
                            value={bidPoints}
                            onChange={(e) => {
                              if (auctionState.status === 'paused') {
                                setActionError('Auction is currently PAUSED! Please click RESUME AUCTION first.');
                                return;
                              }
                              handleUpdateBid(Number(e.target.value), selectedTeamId);
                            }}
                            min={currentPlayer?.basePoints || 0}
                            className="w-full min-h-[48px] sm:min-h-[52px] px-4 rounded-2xl bg-black border-2 border-amber-400 disabled:border-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-amber-400 font-black text-2xl sm:text-3xl text-center focus:outline-none focus:ring-2 focus:ring-amber-400/30 shadow-inner"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-500 pointer-events-none hidden sm:inline">
                            PTS
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={auctionState.status === 'paused'}
                          onClick={() => {
                            if (auctionState.status === 'paused') {
                              setActionError('Auction is currently PAUSED! Please click RESUME AUCTION first.');
                              return;
                            }
                            handleUpdateBid(bidPoints + 5, selectedTeamId);
                          }}
                          className="min-h-[48px] min-w-[48px] sm:min-h-[52px] sm:min-w-[52px] rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700 font-black text-amber-400 text-lg flex items-center justify-center transition-all cursor-pointer shadow-md"
                          title="Step up 5"
                        >
                          +5
                        </button>
                      </div>

                      {/* Fast Tap Increment Chips Bar */}
                      <div>
                        <span className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wide">
                          Quick Tap Adjustments:
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
                          {[
                            { label: '-10', val: -10 },
                            { label: '-5', val: -5 },
                            { label: '+5', val: 5 },
                            { label: '+10', val: 10 },
                            { label: '+25', val: 25 },
                            { label: '+50', val: 50 },
                            { label: '+100', val: 100 }
                          ].map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              disabled={auctionState.status === 'paused'}
                              onClick={() => {
                                if (auctionState.status === 'paused') {
                                  setActionError('Auction is currently PAUSED! Please click RESUME AUCTION first.');
                                  return;
                                }
                                handleUpdateBid(
                                  Math.max(
                                    currentPlayer?.basePoints || 0,
                                    bidPoints + item.val
                                  ),
                                  selectedTeamId
                                );
                              }}
                              className="min-h-[44px] rounded-xl bg-zinc-900 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 hover:text-black active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700 font-black text-xs sm:text-sm text-zinc-200 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Manual Submit Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!selectedTeamId) {
                              setActionError('Please select a team before manually applying this bid.');
                              return;
                            }
                            handleUpdateBid(bidPoints, selectedTeamId);
                            setActionSuccess(`Bid placed: ${bidPoints} PTS for ${selectedWinningTeam?.name || 'Selected Team'}`);
                            setTimeout(() => setActionSuccess(null), 3000);
                          }}
                          disabled={!selectedTeamId}
                          className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-600 transition-all cursor-pointer active:scale-98"
                        >
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>
                            {selectedWinningTeam
                              ? `Apply Manual Bid: ₹ ${bidPoints} PTS for ${selectedWinningTeam.name}`
                              : 'Select Team to Apply Manual Bid'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS (MARK SOLD / MARK UNSOLD / NEXT PLAYER) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleMarkSold}
                  disabled={submitting || auctionState.status === 'paused' || auctionState.playerStatus === 'sold'}
                  className="min-h-[52px] py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title={auctionState.status === 'paused' ? 'Auction is paused. Resume to sell player.' : undefined}
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>MARK SOLD</span>
                </button>

                <button
                  type="button"
                  onClick={handleMarkUnsold}
                  disabled={submitting || auctionState.status === 'paused' || auctionState.playerStatus === 'unsold'}
                  className="min-h-[52px] py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title={auctionState.status === 'paused' ? 'Auction is paused. Resume first.' : undefined}
                >
                  <X className="w-5 h-5 stroke-[3]" />
                  <span>MARK UNSOLD</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextPlayer}
                  disabled={submitting || auctionState.status === 'paused'}
                  className="min-h-[52px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] text-black font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title={auctionState.status === 'paused' ? 'Auction is paused. Resume first.' : undefined}
                >
                  <span>NEXT PLAYER</span>
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TEAMS PURSE & UPCOMING / UNSOLD POOL */}
        <div className={`lg:col-span-4 space-y-6 ${mobileTab !== 'desk' ? 'block' : 'hidden lg:block'}`}>
          {/* TEAMS STATUS OVERVIEW */}
          <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Shield className="w-4 h-4 mr-0.5 text-amber-400" />
                Live Team Purses
              </h3>
              <span className="text-xs text-zinc-400 font-bold">{teams.length} Teams</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs ${
                    t.id === selectedTeamId
                      ? 'bg-amber-400 text-black border-amber-400 font-bold'
                      : 'bg-black border-zinc-800 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <img
                      src={t.logoUrl}
                      alt={t.name}
                      className="w-6 h-6 rounded-full object-cover border border-amber-500/30 bg-zinc-900 shrink-0"
                    />
                    <span className="font-bold truncate">{t.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-black ${
                        t.id === selectedTeamId
                          ? 'text-black'
                          : t.remainingPurse < 100
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {t.remainingPurse} PTS
                    </span>
                    <span className={`block text-[10px] ${t.id === selectedTeamId ? 'text-black/80 font-bold' : 'text-zinc-400'}`}>
                      {t.purchasedPlayerCount || 0} players
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UNSOLD POOL */}
          <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-400" />
                Unsold Players ({unsoldPlayers.length})
              </h3>
              {unsoldPlayers.length > 0 && auctionState?.round !== 'unsold' && (
                <span className="text-[10px] text-amber-400 font-bold">
                  Will repeat in Unsold Round
                </span>
              )}
            </div>

            {unsoldPlayers.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                No unsold players yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {unsoldPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-black border border-rose-900/40 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        className="w-7 h-7 rounded-lg object-cover object-top border border-rose-500/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-white truncate block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {p.role}
                        </span>
                      </div>
                    </div>
                    <span className="text-rose-400 font-black shrink-0">
                      {p.basePoints} PTS
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UPCOMING QUEUE */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Upcoming Queue ({upcomingPlayers.length})
              </h3>
            </div>

            {upcomingPlayers.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                Queue empty! All original players presented.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {upcomingPlayers.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-black border border-zinc-800 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        className="w-7 h-7 rounded-lg object-cover object-top border border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-white truncate block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {p.role}
                        </span>
                      </div>
                    </div>
                    <span className="text-amber-400 font-bold shrink-0">
                      Base: {p.basePoints} PTS
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRE-AUCTION SLIDESHOW PHOTOS MODAL (LIGHT ORANGE & WHITE) */}
      {auction && (
        <AdminPreAuctionPhotoManager
          auction={auction}
          teams={teams}
          isOpen={showPreAuctionPhotoManager}
          onClose={() => setShowPreAuctionPhotoManager(false)}
        />
      )}
    </div>
  );
}
