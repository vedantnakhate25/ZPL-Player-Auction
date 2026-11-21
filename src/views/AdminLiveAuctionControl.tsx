import { useState, useEffect, useMemo, useRef } from 'react';
import {
  db,
  doc,
  collection,
  onSnapshot,
  updateDoc,
  writeBatch,
  query,
  where
} from '../lib/firebase';
import type { Auction, AuctionState, Team, Player } from '../types/auction';
import { CelebrationConfetti } from '../components/CelebrationConfetti';
import { PlayerDecisionPopup } from '../components/PlayerDecisionPopup';
import { UnsoldRoundBanner } from '../components/UnsoldRoundBanner';
import { AdminPreAuctionPhotoManager } from '../components/AdminPreAuctionPhotoManager';
import { useLiveViewers, formatViewerCount } from '../lib/useLiveViewers';
import { exportAuctionResultsToExcel } from '../lib/exportAuctionExcel';
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
  Users,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Zap,
  Image as ImageIcon,
  Gavel,
  FileSpreadsheet
} from 'lucide-react';

interface AdminLiveAuctionControlProps {
  auctionId: string;
  onBack: () => void;
  onViewResults: () => void;
}

const AUTO_NEXT_AFTER_DECISION_MS = 7000;
const UNSOLD_ROUND_BANNER_MS = 20000;

function shufflePlayersWithinSlots(list: Player[]): Player[] {
  const bySlot = new Map<number, Player[]>();
  for (const p of list) {
    const slot = p.slotNumber || 1;
    const bucket = bySlot.get(slot);
    if (bucket) bucket.push(p);
    else bySlot.set(slot, [p]);
  }
  const sortedSlotNumbers = Array.from(bySlot.keys()).sort((a, b) => a - b);
  const result: Player[] = [];
  for (const slot of sortedSlotNumbers) {
    const bucket = [...(bySlot.get(slot) || [])];
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }
    bucket.forEach((p, idx) => {
      result.push({
        ...p,
        order: slot * 10000 + (idx + 1)
      });
    });
  }
  return result;
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

  const liveViewerCount = useLiveViewers(auctionId, false);

  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [bidPoints, setBidPoints] = useState<number>(50);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPreAuctionPhotoManager, setShowPreAuctionPhotoManager] = useState(false);
  const [mobileTab, setMobileTab] = useState<'desk' | 'teams' | 'queue'>('desk');
  const [showManualAdjuster, setShowManualAdjuster] = useState(false);

  // Refs for zero-lag rapid-fire bidding and clean toast timers
  const latestBidRef = useRef<{ points: number; teamId: string | null }>({
    points: 50,
    teamId: null
  });
  const successTimerRef = useRef<number | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);

  const flashSuccess = (msg: string) => {
    setActionSuccess(msg);
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    successTimerRef.current = window.setTimeout(() => setActionSuccess(null), 3000);
  };

  const autoNextTimerRef = useRef<number | null>(null);
  const handleNextPlayerRef = useRef<(() => Promise<void>) | null>(null);

  const clearAutoNextTimer = () => {
    if (autoNextTimerRef.current) {
      window.clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
      if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
      clearAutoNextTimer();
    };
  }, []);

  // 1. Subscribe to Auction
  useEffect(() => {
    if (!auctionId) return;
    const timer = window.setTimeout(() => setLoading(false), 1200);

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
      window.clearTimeout(timer);
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
          const pts = state.currentBidPoints ?? state.currentPlayerBasePoints ?? 50;
          setBidPoints(pts);
          setSelectedTeamId(state.winningTeamId || '');
          latestBidRef.current = {
            points: pts,
            teamId: state.winningTeamId || null
          };
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
        list.sort((a, b) => (a.slotNumber || 1) - (b.slotNumber || 1) || (a.order ?? 0) - (b.order ?? 0));
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

  // Memoized player groups (zero re-filtering lag during rapid bids)
  const { currentPlayer, upcomingPlayers, unsoldPlayers } = useMemo(() => {
    let current: Player | undefined;
    const upcoming: Player[] = [];
    const unsold: Player[] = [];
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.id === auctionState?.currentPlayerId) current = p;
      if (p.status === 'upcoming') upcoming.push(p);
      else if (p.status === 'unsold') unsold.push(p);
    }
    return { currentPlayer: current, upcomingPlayers: upcoming, unsoldPlayers: unsold };
  }, [players, auctionState?.currentPlayerId]);

  // Start Auction (auto-jumbles players inside each slot + single atomic batch commit)
  const handleStartAuction = async () => {
    if (!auction) return;
    clearAutoNextTimer();
    setSubmitting(true);
    setActionError(null);

    try {
      const now = new Date().toISOString();
      const eligibleUpcoming = players.filter((p) => p.status === 'upcoming');
      const existingCurrent = players.find((p) => p.status === 'current');

      // Automatically jumble all upcoming players within each slot before starting
      const jumbledUpcoming = shufflePlayersWithinSlots(eligibleUpcoming);
      const firstPlayer = existingCurrent || jumbledUpcoming[0] || players[0];

      if (!firstPlayer) {
        setActionError('Please add players to this auction before starting.');
        setSubmitting(false);
        return;
      }

      const batch = writeBatch(db);

      // Persist the jumbled slot orders for all upcoming players
      for (const p of jumbledUpcoming) {
        if (p.id === firstPlayer.id) {
          batch.update(doc(db, 'players', p.id), {
            status: 'current',
            order: p.order,
            updatedAt: now
          });
        } else {
          batch.update(doc(db, 'players', p.id), {
            order: p.order,
            updatedAt: now
          });
        }
      }

      // If firstPlayer wasn't in jumbledUpcoming (e.g. already current or fallback)
      if (!jumbledUpcoming.some((p) => p.id === firstPlayer.id)) {
        batch.update(doc(db, 'players', firstPlayer.id), {
          status: 'current',
          updatedAt: now
        });
      }

      batch.set(doc(db, 'auctionState', auctionId), {
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
        unsoldRoundStartedAt: null,
        unsoldRoundBannerUntil: null,
        updatedAt: now
      });

      batch.update(doc(db, 'auctions', auctionId), {
        status: 'live',
        round: 'regular',
        updatedAt: now
      });

      await batch.commit();

      setBidPoints(firstPlayer.basePoints);
      setSelectedTeamId('');
      latestBidRef.current = { points: firstPlayer.basePoints, teamId: null };
      flashSuccess('Auction is now LIVE. Players jumbled inside each slot.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to start auction');
    } finally {
      setSubmitting(false);
    }
  };

  // Manual bid update (optimistic + instant Firestore write)
  const handleUpdateBid = async (newPoints: number, teamId: string) => {
    if (!auctionState || !auctionState.currentPlayerId) return;

    if (auctionState.status === 'paused') {
      setActionError('Auction is paused. Click Resume Auction before placing bids.');
      return;
    }

    const sanitizedPoints = Math.max(0, Number(newPoints) || 0);
    const team = teams.find((t) => t.id === teamId);
    const now = new Date().toISOString();

    // Optimistic local state update for zero-lag response
    setBidPoints(sanitizedPoints);
    setSelectedTeamId(teamId);
    latestBidRef.current = { points: sanitizedPoints, teamId: team ? team.id : null };
    setAuctionState((prev) =>
      prev
        ? {
            ...prev,
            currentBidPoints: sanitizedPoints,
            winningTeamId: team ? team.id : null,
            winningTeamName: team ? team.name : null,
            winningTeamLogo: team ? team.logoUrl : null,
            winningTeamRemainingPurse: team ? team.remainingPurse : null,
            playerStatus: 'bidding',
            updatedAt: now
          }
        : prev
    );

    try {
      await updateDoc(doc(db, 'auctionState', auctionId), {
        currentBidPoints: sanitizedPoints,
        winningTeamId: team ? team.id : null,
        winningTeamName: team ? team.name : null,
        winningTeamLogo: team ? team.logoUrl : null,
        winningTeamRemainingPurse: team ? team.remainingPurse : null,
        playerStatus: 'bidding',
        updatedAt: now
      });
    } catch (err) {
      console.error('Bid update failed:', err);
      setActionError('Failed to sync bid. Please retry.');
    }
  };

  // Direct 1-Click Team Bidding (+5 PTS or Base) — Optimistic for 0ms lag during rapid bidding wars
  const handleDirectTeamBid = async (team: Team, explicitPoints?: number) => {
    if (!currentPlayer || !auctionState || !auctionState.currentPlayerId) return;

    if (auctionState.status === 'paused') {
      setActionError('Auction is paused. Click Resume Auction before placing bids.');
      return;
    }

    const basePrice = currentPlayer.basePoints || 50;
    const hasExistingBidder = Boolean(latestBidRef.current.teamId || auctionState.winningTeamId);
    const latestPrice = hasExistingBidder
      ? Math.max(latestBidRef.current.points, auctionState.currentBidPoints || basePrice)
      : basePrice;

    const newBid =
      explicitPoints !== undefined
        ? explicitPoints
        : hasExistingBidder
        ? latestPrice + 5
        : basePrice;

    if (team.remainingPurse < newBid) {
      setActionError(
        `Insufficient purse: ${team.name} has ₹ ${team.remainingPurse} PTS left (bid requires ₹ ${newBid} PTS).`
      );
      return;
    }

    const now = new Date().toISOString();

    // Instant optimistic update so rapid clicks never collide or feel laggy
    latestBidRef.current = { points: newBid, teamId: team.id };
    setBidPoints(newBid);
    setSelectedTeamId(team.id);
    setActionError(null);
    setAuctionState((prev) =>
      prev
        ? {
            ...prev,
            currentBidPoints: newBid,
            winningTeamId: team.id,
            winningTeamName: team.name,
            winningTeamLogo: team.logoUrl,
            winningTeamRemainingPurse: team.remainingPurse,
            playerStatus: 'bidding',
            updatedAt: now
          }
        : prev
    );

    try {
      await updateDoc(doc(db, 'auctionState', auctionId), {
        currentBidPoints: Number(newBid),
        winningTeamId: team.id,
        winningTeamName: team.name,
        winningTeamLogo: team.logoUrl,
        winningTeamRemainingPurse: team.remainingPurse,
        playerStatus: 'bidding',
        updatedAt: now
      });
      flashSuccess(`${team.name} leads at ₹ ${newBid} PTS`);
    } catch (err) {
      console.error('Direct team bid failed:', err);
      setActionError('Failed to record bid. Please try again.');
    }
  };

  // Mark SOLD (single atomic Firestore batch commit)
  const handleMarkSold = async () => {
    if (!currentPlayer || !auctionState) return;
    setActionError(null);

    if (auctionState.status === 'paused') {
      setActionError('Auction is paused. Resume before marking player SOLD.');
      return;
    }

    const winningId = selectedTeamId || latestBidRef.current.teamId;
    if (!winningId) {
      setActionError('Select a bidding team before marking player as SOLD.');
      return;
    }

    const winningTeam = teams.find((t) => t.id === winningId);
    if (!winningTeam) {
      setActionError('Invalid winning team selected.');
      return;
    }

    const finalPoints = bidPoints || latestBidRef.current.points;
    if (finalPoints > winningTeam.remainingPurse) {
      setActionError(
        `Bid of ₹ ${finalPoints} PTS exceeds ${winningTeam.name}'s remaining purse (₹ ${winningTeam.remainingPurse} PTS).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const newRemainingPurse = winningTeam.remainingPurse - finalPoints;
      const newTotalSpent = (winningTeam.totalSpent || 0) + finalPoints;
      const newCount = (winningTeam.purchasedPlayerCount || 0) + 1;

      const batch = writeBatch(db);

      batch.update(doc(db, 'teams', winningTeam.id), {
        remainingPurse: newRemainingPurse,
        totalSpent: newTotalSpent,
        purchasedPlayerCount: newCount,
        updatedAt: now
      });

      batch.update(doc(db, 'players', currentPlayer.id), {
        status: 'sold',
        soldPoints: finalPoints,
        soldToTeamId: winningTeam.id,
        soldToTeamName: winningTeam.name,
        soldToTeamLogo: winningTeam.logoUrl,
        updatedAt: now
      });

      batch.update(doc(db, 'auctionState', auctionId), {
        playerStatus: 'sold',
        currentBidPoints: finalPoints,
        winningTeamId: winningTeam.id,
        winningTeamName: winningTeam.name,
        winningTeamLogo: winningTeam.logoUrl,
        winningTeamRemainingPurse: newRemainingPurse,
        lastSoldPlayerName: currentPlayer.name,
        lastSoldPlayerPhoto: currentPlayer.photoUrl,
        lastSoldPoints: finalPoints,
        lastSoldTeamName: winningTeam.name,
        lastSoldTeamLogo: winningTeam.logoUrl,
        updatedAt: now
      });

      await batch.commit();

      setShowCelebration(true);
      if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = window.setTimeout(() => setShowCelebration(false), 3800);
      flashSuccess(`${currentPlayer.name} SOLD to ${winningTeam.name} for ₹ ${finalPoints} PTS. Next player arriving automatically...`);

      // Automatically bring the next player on stage right after the 7s Sold popup completes
      clearAutoNextTimer();
      autoNextTimerRef.current = window.setTimeout(() => {
        autoNextTimerRef.current = null;
        handleNextPlayerRef.current?.();
      }, AUTO_NEXT_AFTER_DECISION_MS);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark player sold');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark UNSOLD (single atomic batch commit)
  const handleMarkUnsold = async () => {
    if (!currentPlayer || !auctionState) return;

    if (auctionState.status === 'paused') {
      setActionError('Auction is paused. Resume before marking player UNSOLD.');
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const now = new Date().toISOString();
      const batch = writeBatch(db);

      batch.update(doc(db, 'players', currentPlayer.id), {
        status: 'unsold',
        soldPoints: 0,
        soldToTeamId: null,
        soldToTeamName: null,
        updatedAt: now
      });

      batch.update(doc(db, 'auctionState', auctionId), {
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

      await batch.commit();
      flashSuccess(`${currentPlayer.name} marked UNSOLD. Next player arriving automatically...`);

      // Automatically bring the next player on stage right after the 7s Unsold popup completes
      clearAutoNextTimer();
      autoNextTimerRef.current = window.setTimeout(() => {
        autoNextTimerRef.current = null;
        handleNextPlayerRef.current?.();
      }, AUTO_NEXT_AFTER_DECISION_MS);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark player unsold');
    } finally {
      setSubmitting(false);
    }
  };

  // Advance to Next Player (single atomic batch commit)
  const handleNextPlayer = async () => {
    clearAutoNextTimer();

    if (auctionState?.status === 'paused' || auctionState?.status === 'completed') {
      if (auctionState?.status === 'paused') {
        setActionError('Auction is paused. Resume before advancing to next player.');
      }
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const now = new Date().toISOString();
      const currentRound = auctionState?.round || 'regular';
      const batch = writeBatch(db);

      if (currentRound === 'regular') {
        const nextPlayer = players.find((p) => p.status === 'upcoming');

        if (nextPlayer) {
          batch.update(doc(db, 'players', nextPlayer.id), {
            status: 'current',
            updatedAt: now
          });

          batch.update(doc(db, 'auctionState', auctionId), {
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

          await batch.commit();
          setBidPoints(nextPlayer.basePoints);
          setSelectedTeamId('');
          latestBidRef.current = { points: nextPlayer.basePoints, teamId: null };
        } else {
          const freshUnsold = players.filter((p) => p.status === 'unsold');
          if (freshUnsold.length > 0) {
            // Jumble unsold players within each slot before starting Unsold Round
            const jumbledUnsold = shufflePlayersWithinSlots(freshUnsold);
            const firstUnsold = jumbledUnsold[0];
            const bannerUntil = new Date(Date.now() + UNSOLD_ROUND_BANNER_MS).toISOString();

            for (const up of jumbledUnsold) {
              if (up.id === firstUnsold.id) {
                batch.update(doc(db, 'players', up.id), {
                  status: 'current',
                  round: 'unsold',
                  order: up.order,
                  updatedAt: now
                });
              } else {
                batch.update(doc(db, 'players', up.id), {
                  round: 'unsold',
                  order: up.order,
                  updatedAt: now
                });
              }
            }

            batch.update(doc(db, 'auctionState', auctionId), {
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
              unsoldRoundStartedAt: now,
              unsoldRoundBannerUntil: bannerUntil,
              unsoldRoundPlayerCount: jumbledUnsold.length,
              updatedAt: now
            });

            batch.update(doc(db, 'auctions', auctionId), {
              round: 'unsold',
              updatedAt: now
            });

            await batch.commit();
            setBidPoints(firstUnsold.basePoints);
            setSelectedTeamId('');
            latestBidRef.current = { points: firstUnsold.basePoints, teamId: null };
            flashSuccess('Unsold Player Round Starts! Announcement live for 20 seconds.');
          } else {
            await handleFinishAuction();
          }
        }
      } else {
        const currentIdx = players.findIndex((p) => p.id === auctionState?.currentPlayerId);
        const remainingUnsold = players.filter(
          (p, idx) =>
            p.status === 'unsold' &&
            p.id !== auctionState?.currentPlayerId &&
            (currentIdx === -1 || idx > currentIdx)
        );

        if (remainingUnsold.length > 0) {
          const nextUnsold = remainingUnsold[0];
          batch.update(doc(db, 'players', nextUnsold.id), {
            status: 'current',
            round: 'unsold',
            updatedAt: now
          });

          batch.update(doc(db, 'auctionState', auctionId), {
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

          await batch.commit();
          setBidPoints(nextUnsold.basePoints);
          setSelectedTeamId('');
          latestBidRef.current = { points: nextUnsold.basePoints, teamId: null };
        } else {
          flashSuccess('All players in the unsold pool have been processed.');
        }
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to advance to next player');
    } finally {
      setSubmitting(false);
    }
  };

  // Always keep ref pointing to freshest handleNextPlayer closure for auto-advance timer
  handleNextPlayerRef.current = handleNextPlayer;

  // Pause / Resume (atomic batch)
  const handleTogglePause = async () => {
    if (!auctionState) return;
    clearAutoNextTimer();
    const newStatus = auctionState.status === 'live' ? 'paused' : 'live';
    const now = new Date().toISOString();
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'auctionState', auctionId), { status: newStatus, updatedAt: now });
      batch.update(doc(db, 'auctions', auctionId), { status: newStatus, updatedAt: now });
      await batch.commit();
    } catch (err) {
      console.error('Pause toggle failed:', err);
    }
  };

  // Finish Auction (atomic batch)
  const handleFinishAuction = async () => {
    clearAutoNextTimer();
    try {
      const now = new Date().toISOString();
      const batch = writeBatch(db);
      batch.update(doc(db, 'auctionState', auctionId), { status: 'completed', updatedAt: now });
      batch.update(doc(db, 'auctions', auctionId), { status: 'completed', updatedAt: now });
      await batch.commit();
      flashSuccess('Auction has been officially completed.');
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
  const activeHoldingTeam = teams.find(
    (t) => t.id === (auctionState?.winningTeamId || selectedTeamId)
  );
  const currentLiveBidPoints =
    auctionState?.currentBidPoints || bidPoints || currentPlayer?.basePoints || 50;

  return (
    <div className="min-h-screen bg-[#060c16] text-white p-4 sm:p-6 lg:p-8 selection:bg-[#f5d77f] selection:text-[#060c16]">
      <CelebrationConfetti active={showCelebration} />
      <PlayerDecisionPopup auctionState={auctionState} teams={teams} />
      <UnsoldRoundBanner auctionState={auctionState} />

      {/* TOP HEADER */}
      <header className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#162b4a]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="h-10 w-10 rounded-xl bg-[#0a1526] border border-[#162b4a] hover:border-[#f5d77f]/50 text-[#c5d3e8] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Back to Admin Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="w-11 h-11 rounded-full bg-[#0a1526] border border-[#f5d77f]/55 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/assets/aistudio/file_00000000661882118ee895643705c2c1_2d4830dd.png"
              alt="ZPL Official Crest"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#f5d77f]">
              <span>Admin Control Desk</span>
              {auctionState?.round === 'unsold' && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span className="text-rose-400">Unsold Round</span>
                </>
              )}
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
              {auction?.name || 'Live Auction Control'}
            </h1>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="h-10 inline-flex items-center gap-2 px-3 rounded-xl bg-[#0a1526] border border-[#162b4a] text-xs font-bold text-white tabular-nums"
            title="Real-time viewers watching live"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>{formatViewerCount(liveViewerCount)}</span>
            <span className="text-[#a1b3cb] hidden sm:inline">Live</span>
          </div>

          <button
            onClick={() => setShowPreAuctionPhotoManager(true)}
            className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-[#0a1526] hover:bg-[#10223d] border border-[#f5d77f]/35 text-xs font-bold text-[#f5d77f] transition-colors cursor-pointer whitespace-nowrap"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photos ({auction?.preAuctionPhotos?.length || 0})</span>
          </button>

          <a
            href={`?auction=${auctionId}`}
            target="_blank"
            rel="noreferrer"
            className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-gradient-to-r from-[#fff4c2] via-[#f5d77f] to-[#e0bc50] hover:from-white hover:to-[#f5d77f] text-xs font-black text-[#060c16] transition-colors cursor-pointer whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Public Screen</span>
          </a>

          <button
            onClick={onViewResults}
            className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-[#0a1526] hover:bg-[#10223d] border border-[#162b4a] text-xs font-bold text-[#c5d3e8] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <Shield className="w-4 h-4 text-[#f5d77f]" />
            <span>Results</span>
          </button>

          <button
            type="button"
            onClick={() => exportAuctionResultsToExcel(auction, teams, players)}
            title="Download full auction results and team squads as Excel (.xlsx)"
            className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/45 text-xs font-bold text-emerald-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          {auctionState?.status === 'live' && (
            <button
              onClick={handleTogglePause}
              className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-[#f5d77f]/15 hover:bg-[#f5d77f]/25 border border-[#f5d77f]/50 text-[#f5d77f] font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          {auctionState?.status === 'paused' && (
            <button
              onClick={handleTogglePause}
              className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              <span>Resume</span>
            </button>
          )}

          {auctionState?.status !== 'completed' && (
            <button
              onClick={handleFinishAuction}
              className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <StopCircle className="w-4 h-4" />
              <span>Finish</span>
            </button>
          )}
        </div>
      </header>

      {/* FEEDBACK MESSAGES */}
      {(actionError || actionSuccess) && (
        <div className="max-w-7xl mx-auto my-4 space-y-2">
          {actionError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/85 border border-rose-500/70 text-rose-100 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="font-semibold">{actionError}</span>
            </div>
          )}
          {actionSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/85 border border-emerald-500/70 text-emerald-100 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-semibold">{actionSuccess}</span>
            </div>
          )}
        </div>
      )}

      {/* MOBILE TAB SWITCHER */}
      <div className="max-w-7xl mx-auto lg:hidden mt-4 mb-4">
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#0a1526] border border-[#162b4a]">
          <button
            type="button"
            onClick={() => setMobileTab('desk')}
            className={`min-h-[42px] py-2 px-2 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'desk'
                ? 'bg-[#f5d77f] text-[#060c16]'
                : 'text-[#a1b3cb] hover:text-white'
            }`}
          >
            <Gavel className="w-3.5 h-3.5 shrink-0" />
            <span>Bidding</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('teams')}
            className={`min-h-[42px] py-2 px-2 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'teams'
                ? 'bg-[#f5d77f] text-[#060c16]'
                : 'text-[#a1b3cb] hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Purses ({teams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('queue')}
            className={`min-h-[42px] py-2 px-2 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'queue'
                ? 'bg-[#f5d77f] text-[#060c16]'
                : 'text-[#a1b3cb] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Queue ({upcomingPlayers.length})</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTROL DESK */}
      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: ACTIVE PLAYER & LIVE BID CONTROLS */}
        <div className={`lg:col-span-8 space-y-5 ${mobileTab === 'desk' ? 'block' : 'hidden lg:block'}`}>
          {auctionState?.status === 'draft' ||
          auctionState?.status === 'scheduled' ||
          !auctionState?.currentPlayerId ? (
            <div className="rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-8 sm:p-12 text-center space-y-6 shadow-xl">
              <Play className="w-14 h-14 text-[#f5d77f] mx-auto" />
              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Ready to Start Auction
                </h2>
                <p className="text-[#a1b3cb] text-sm">
                  Starting presents the first player to all connected public screens and projector displays in real time.
                </p>
              </div>

              <div className="pt-2 space-y-4">
                <button
                  onClick={handleStartAuction}
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#fff4c2] via-[#f5d77f] to-[#e0bc50] hover:from-white hover:to-[#f5d77f] text-[#060c16] text-base font-black transition-transform active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Auction Now</span>
                </button>

                <div className="pt-4 border-t border-[#162b4a] flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowPreAuctionPhotoManager(true)}
                    className="px-4 py-2 rounded-xl bg-[#060c16] hover:bg-[#10223d] border border-[#f5d77f]/35 text-[#f5d77f] font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Manage Pre-Auction Slides ({auction?.preAuctionPhotos?.length || 0})</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-5 sm:p-6 shadow-xl space-y-5">
              {/* CURRENT PLAYER STATUS BAR */}
              <div className="flex items-center justify-between border-b border-[#162b4a] pb-3.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="uppercase font-bold tracking-wider text-[#a1b3cb]">
                    On Stage
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-black uppercase ${
                      auctionState.playerStatus === 'sold'
                        ? 'bg-emerald-500 text-[#060c16]'
                        : auctionState.playerStatus === 'unsold'
                        ? 'bg-rose-600 text-white'
                        : 'bg-[#f5d77f] text-[#060c16]'
                    }`}
                  >
                    {auctionState.playerStatus}
                  </span>
                </div>

                <span className="text-[#a1b3cb] font-semibold">
                  {auctionState.round === 'unsold' ? 'Unsold Round' : 'Regular Round'}
                </span>
              </div>

              {/* SOLD / UNSOLD CONFIRMATION STRIP */}
              {auctionState.playerStatus === 'sold' && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/75 border border-emerald-500/60 text-center">
                  <p className="text-sm sm:text-base font-black text-white uppercase">
                    {(currentPlayer?.name || auctionState.currentPlayerName)?.toUpperCase()} SOLD TO{' '}
                    <span className="text-emerald-300">
                      {(auctionState.winningTeamName || 'Winning Team')?.toUpperCase()}
                    </span>{' '}
                    &middot;{' '}
                    <span className="text-[#f5d77f] tabular-nums">
                      ₹ {auctionState.currentBidPoints} PTS
                    </span>
                  </p>
                </div>
              )}

              {auctionState.playerStatus === 'unsold' && (
                <div className="p-3.5 rounded-2xl bg-rose-950/75 border border-rose-500/60 text-center">
                  <p className="text-sm sm:text-base font-black text-white uppercase">
                    {(currentPlayer?.name || auctionState.currentPlayerName)?.toUpperCase()} &middot; UNSOLD
                  </p>
                </div>
              )}

              {/* CURRENT PLAYER ROW */}
              {currentPlayer && (
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#060c16] border border-[#162b4a]">
                  <img
                    src={currentPlayer.photoUrl}
                    alt={currentPlayer.name}
                    referrerPolicy="no-referrer"
                    className="w-22 h-22 sm:w-24 sm:h-24 rounded-2xl object-cover object-top border-2 border-[#f5d77f]/50 bg-[#0a1526] shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#f5d77f]">
                      {currentPlayer.role}
                      {(currentPlayer.slotNumber || currentPlayer.slotName) && (
                        <>
                          {' · '}Slot {currentPlayer.slotNumber || 1}
                          {currentPlayer.slotName ? ` (${currentPlayer.slotName})` : ''}
                        </>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                      {currentPlayer.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#c5d3e8] tabular-nums">
                      Base Price:{' '}
                      <strong className="text-[#f5d77f] font-black">
                        ₹ {currentPlayer.basePoints} PTS
                      </strong>
                    </p>
                  </div>
                </div>
              )}

              {/* PAUSED WARNING */}
              {auctionState.status === 'paused' && (
                <div className="p-4 rounded-2xl bg-[#f5d77f]/10 border border-[#f5d77f]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-black text-[#f5d77f] uppercase">Auction Paused</p>
                    <p className="text-xs text-[#c5d3e8]">
                      Resume the auction to continue placing live bids.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#060c16] font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume Auction</span>
                  </button>
                </div>
              )}

              {/* LIVE HIGHEST BIDDER BANNER */}
              <div
                className={`p-4 sm:p-5 rounded-2xl bg-[#060c16] border-2 transition-colors ${
                  activeHoldingTeam ? 'border-[#f5d77f]' : 'border-[#162b4a]'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 w-full sm:w-auto min-w-0">
                    {activeHoldingTeam ? (
                      <>
                        <img
                          src={activeHoldingTeam.logoUrl}
                          alt={activeHoldingTeam.name}
                          referrerPolicy="no-referrer"
                          className="w-13 h-13 rounded-2xl object-cover border-2 border-[#f5d77f] bg-[#0a1526] shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[11px] font-black uppercase tracking-wider text-[#f5d77f] block">
                            Highest Bidder
                          </span>
                          <h3 className="text-lg sm:text-2xl font-black text-white truncate">
                            {activeHoldingTeam.name}
                          </h3>
                          <p className="text-xs text-[#a1b3cb] tabular-nums">
                            Purse Left:{' '}
                            <strong className="text-emerald-400">
                              ₹ {activeHoldingTeam.remainingPurse}
                            </strong>{' '}
                            &middot; Squad: {activeHoldingTeam.purchasedPlayerCount || 0}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#0a1526] border border-[#162b4a] flex items-center justify-center text-[#f5d77f] shrink-0">
                          <Coins className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#a1b3cb] block">
                            Waiting for Opening Bid
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-white">
                            Tap any team below to place bid
                          </h3>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-full sm:w-auto text-center sm:text-right shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#a1b3cb] block">
                      {activeHoldingTeam ? 'Current Bid' : 'Base Price'}
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-[#fff4c2] tracking-tight tabular-nums">
                      ₹ {currentLiveBidPoints}{' '}
                      <span className="text-sm font-bold text-[#f5d77f]">PTS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DIRECT 1-CLICK TEAM BIDDING GRID */}
              <div className={auctionState.status === 'paused' ? 'opacity-50 pointer-events-none' : ''}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#f5d77f] inline-flex items-center gap-1.5">
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Direct Team Bid (+5 PTS)</span>
                  </h4>
                  <span className="text-[11px] text-[#a1b3cb]">Instant Real-Time Sync</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teams.map((t) => {
                    const isLeading = t.id === auctionState.winningTeamId;
                    const basePrice = currentPlayer?.basePoints || 50;
                    const hasBidder = Boolean(auctionState.winningTeamId);
                    const nextBidForTeam = hasBidder ? currentLiveBidPoints + 5 : basePrice + 5;
                    const hasEnoughPurseForNext = t.remainingPurse >= nextBidForTeam;
                    const hasEnoughPurseForBase = t.remainingPurse >= basePrice;
                    const isPaused = auctionState.status === 'paused';

                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-2xl border transition-colors flex flex-col justify-between gap-2.5 ${
                          isLeading
                            ? 'bg-[#0e1e36] border-2 border-[#f5d77f]'
                            : hasEnoughPurseForNext
                            ? 'bg-[#060c16] border-[#162b4a] hover:border-[#f5d77f]/50'
                            : 'bg-[#060c16]/60 border-[#162b4a]/60 opacity-45'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={t.logoUrl}
                              alt={t.name}
                              referrerPolicy="no-referrer"
                              className={`w-9 h-9 rounded-full object-cover border bg-[#0a1526] shrink-0 ${
                                isLeading ? 'border-[#f5d77f]' : 'border-[#224270]'
                              }`}
                            />
                            <div className="min-w-0">
                              <h5 className="text-sm font-black text-white truncate">{t.name}</h5>
                              <p
                                className={`text-[11px] font-bold tabular-nums ${
                                  t.remainingPurse < nextBidForTeam
                                    ? 'text-rose-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                Purse: ₹ {t.remainingPurse} PTS
                              </p>
                            </div>
                          </div>

                          {isLeading && (
                            <span className="text-xs font-black text-[#f5d77f] tabular-nums shrink-0">
                              ₹ {currentLiveBidPoints}
                            </span>
                          )}
                        </div>

                        {!hasBidder ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={isPaused || !hasEnoughPurseForBase}
                              onClick={() => handleDirectTeamBid(t, basePrice)}
                              className="min-h-[42px] px-3 py-2 rounded-xl bg-[#0a1526] hover:bg-[#10223d] active:scale-[0.98] disabled:opacity-40 border border-[#f5d77f]/40 text-[#f5d77f] font-black text-xs transition-transform cursor-pointer tabular-nums"
                            >
                              Base ₹ {basePrice}
                            </button>

                            <button
                              type="button"
                              disabled={isPaused || !hasEnoughPurseForNext}
                              onClick={() => handleDirectTeamBid(t, nextBidForTeam)}
                              className="min-h-[42px] px-3 py-2 rounded-xl bg-gradient-to-r from-[#fff4c2] via-[#f5d77f] to-[#e0bc50] hover:from-white hover:to-[#f5d77f] active:scale-[0.98] disabled:opacity-40 text-[#060c16] font-black text-xs transition-transform cursor-pointer tabular-nums"
                            >
                              +5 (₹ {nextBidForTeam})
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isPaused || !hasEnoughPurseForNext}
                            onClick={() => handleDirectTeamBid(t, nextBidForTeam)}
                            className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-between transition-transform active:scale-[0.98] cursor-pointer ${
                              !hasEnoughPurseForNext
                                ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#fff4c2] via-[#f5d77f] to-[#e0bc50] hover:from-white hover:to-[#f5d77f] text-[#060c16]'
                            }`}
                          >
                            <span className="truncate">{t.name}</span>
                            <span className="px-2 py-0.5 rounded-lg bg-[#060c16] text-[#f5d77f] text-xs font-black shrink-0 ml-2 tabular-nums">
                              +5 &rarr; ₹ {nextBidForTeam}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COLLAPSIBLE MANUAL BID ADJUSTER */}
              <div className="pt-2 border-t border-[#162b4a]">
                <button
                  type="button"
                  onClick={() => setShowManualAdjuster((v) => !v)}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#060c16] hover:bg-[#0d1c31] border border-[#162b4a] text-[#c5d3e8] hover:text-white text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#f5d77f]" />
                    <span>Manual Bid Adjuster</span>
                  </span>
                  {showManualAdjuster ? (
                    <ChevronUp className="w-4 h-4 text-[#a1b3cb]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#a1b3cb]" />
                  )}
                </button>

                {showManualAdjuster && (
                  <div className="mt-3 p-4 rounded-2xl bg-[#060c16] border border-[#162b4a] space-y-4">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={auctionState.status === 'paused'}
                        onClick={() =>
                          handleUpdateBid(
                            Math.max(currentPlayer?.basePoints || 5, bidPoints - 5),
                            selectedTeamId
                          )
                        }
                        className="h-12 w-12 rounded-xl bg-[#0a1526] hover:bg-[#10223d] border border-[#162b4a] font-black text-[#f5d77f] text-base cursor-pointer shrink-0"
                      >
                        -5
                      </button>

                      <input
                        type="number"
                        disabled={auctionState.status === 'paused'}
                        value={bidPoints}
                        onChange={(e) => handleUpdateBid(Number(e.target.value), selectedTeamId)}
                        min={currentPlayer?.basePoints || 0}
                        className="w-full h-12 px-4 rounded-xl bg-[#0a1526] border-2 border-[#f5d77f] text-[#fff4c2] font-black text-2xl text-center focus:outline-none tabular-nums"
                      />

                      <button
                        type="button"
                        disabled={auctionState.status === 'paused'}
                        onClick={() => handleUpdateBid(bidPoints + 5, selectedTeamId)}
                        className="h-12 w-12 rounded-xl bg-[#0a1526] hover:bg-[#10223d] border border-[#162b4a] font-black text-[#f5d77f] text-base cursor-pointer shrink-0"
                      >
                        +5
                      </button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {[-10, -5, 5, 10, 25, 50, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          disabled={auctionState.status === 'paused'}
                          onClick={() =>
                            handleUpdateBid(
                              Math.max(currentPlayer?.basePoints || 0, bidPoints + val),
                              selectedTeamId
                            )
                          }
                          className="h-10 rounded-xl bg-[#0a1526] hover:bg-[#f5d77f] hover:text-[#060c16] border border-[#162b4a] font-black text-xs text-[#c5d3e8] transition-colors cursor-pointer tabular-nums"
                        >
                          {val > 0 ? `+${val}` : val}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!selectedTeamId}
                      onClick={() => {
                        if (!selectedTeamId) return;
                        handleUpdateBid(bidPoints, selectedTeamId);
                        flashSuccess(
                          `Updated bid to ₹ ${bidPoints} PTS for ${selectedWinningTeam?.name || 'Team'}`
                        );
                      }}
                      className="w-full h-11 rounded-xl bg-[#0e1f38] hover:bg-[#152e52] disabled:opacity-40 text-[#f5d77f] font-bold text-xs uppercase tracking-wider border border-[#f5d77f]/35 cursor-pointer"
                    >
                      {selectedWinningTeam
                        ? `Sync ₹ ${bidPoints} PTS for ${selectedWinningTeam.name}`
                        : 'Select a Team First'}
                    </button>
                  </div>
                )}
              </div>

              {/* PRIMARY DECISIONS: MARK SOLD / MARK UNSOLD / NEXT PLAYER */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleMarkSold}
                  disabled={
                    submitting ||
                    auctionState.status === 'paused' ||
                    auctionState.playerStatus === 'sold'
                  }
                  className="min-h-[52px] py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>MARK SOLD</span>
                </button>

                <button
                  type="button"
                  onClick={handleMarkUnsold}
                  disabled={
                    submitting ||
                    auctionState.status === 'paused' ||
                    auctionState.playerStatus === 'unsold'
                  }
                  className="min-h-[52px] py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[3]" />
                  <span>MARK UNSOLD</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextPlayer}
                  disabled={submitting || auctionState.status === 'paused'}
                  className="min-h-[52px] py-3 px-4 rounded-2xl bg-gradient-to-r from-[#fff4c2] via-[#f5d77f] to-[#e0bc50] hover:from-white hover:to-[#f5d77f] active:scale-[0.98] text-[#060c16] font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>NEXT PLAYER</span>
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE PURSES & QUEUES */}
        <div
          className={`lg:col-span-4 space-y-5 ${
            mobileTab !== 'desk' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* TEAM PURSES */}
          <div className="rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#162b4a]">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#f5d77f] inline-flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Team Purses</span>
              </h3>
              <span className="text-xs text-[#a1b3cb] font-semibold tabular-nums">
                {teams.length} Teams
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                    t.id === selectedTeamId
                      ? 'bg-[#f5d77f] text-[#060c16] border-[#fff4c2] font-bold'
                      : 'bg-[#060c16] border-[#162b4a] text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={t.logoUrl}
                      alt={t.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-[#f5d77f]/35 bg-[#0a1526] shrink-0"
                    />
                    <span className="font-bold truncate">{t.name}</span>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <span
                      className={`font-black ${
                        t.id === selectedTeamId
                          ? 'text-[#060c16]'
                          : t.remainingPurse < 100
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      ₹ {t.remainingPurse}
                    </span>
                    <span
                      className={`block text-[10px] ${
                        t.id === selectedTeamId ? 'text-[#060c16]/75 font-bold' : 'text-[#a1b3cb]'
                      }`}
                    >
                      {t.purchasedPlayerCount || 0} players
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UNSOLD POOL */}
          <div className="rounded-3xl bg-[#0a1526] border border-[#162b4a] p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#162b4a]">
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 inline-flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Unsold Pool ({unsoldPlayers.length})</span>
              </h3>
            </div>

            {unsoldPlayers.length === 0 ? (
              <p className="text-xs text-[#a1b3cb] py-3 text-center">No unsold players yet.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {unsoldPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#060c16] border border-rose-500/25 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-cover object-top border border-rose-500/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-white truncate block">{p.name}</span>
                        <span className="text-[10px] text-[#a1b3cb]">{p.role}</span>
                      </div>
                    </div>
                    <span className="text-rose-400 font-black shrink-0 tabular-nums">
                      ₹ {p.basePoints}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UPCOMING QUEUE */}
          <div className="rounded-3xl bg-[#0a1526] border border-[#162b4a] p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#162b4a]">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Up Next ({upcomingPlayers.length})
              </h3>
            </div>

            {upcomingPlayers.length === 0 ? (
              <p className="text-xs text-[#a1b3cb] py-3 text-center">
                All regular roster players presented.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {upcomingPlayers.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#060c16] border border-[#162b4a] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-cover object-top border border-[#224270] shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-white truncate block">{p.name}</span>
                        <span className="text-[10px] text-[#a1b3cb]">{p.role}</span>
                      </div>
                    </div>
                    <span className="text-[#f5d77f] font-bold shrink-0 tabular-nums">
                      ₹ {p.basePoints}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRE-AUCTION SLIDESHOW PHOTOS MODAL */}
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
