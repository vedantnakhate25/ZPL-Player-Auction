import { useState, useEffect } from 'react';
import { onSnapshot, doc, collection, query, where, db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { Auction, AuctionState, Team, Player } from '../types/auction';
import { Player3DCard } from '../components/Player3DCard';
import { TeamPurseBoard } from '../components/TeamPurseBoard';
import { PreAuctionSlideshow } from '../components/PreAuctionSlideshow';
import { CelebrationConfetti } from '../components/CelebrationConfetti';
import { SocialFollowStrip } from '../components/SocialFollowStrip';
import { ZPLBroadcastPlayerStage } from '../components/ZPLBroadcastPlayerStage';
import { FooterCopyright } from '../components/FooterCopyright';
import {
  Radio,
  Maximize2,
  Minimize2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Share2,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { useLiveViewers } from '../lib/useLiveViewers';

interface LiveAuctionViewerProps {
  auctionId: string;
  onNavigateHome?: () => void;
}

export function LiveAuctionViewer({
  auctionId,
  onNavigateHome
}: LiveAuctionViewerProps) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [projectorPreView, setProjectorPreView] = useState<'slideshow' | 'teams'>('slideshow');

  // Real-time live viewer counter and heartbeat beacon
  const liveViewerCount = useLiveViewers(auctionId, true);

  // Sound beep / celebration chime (Web Audio API - clean, self-contained, no external mp3 files)
  const playSoundEffect = (type: 'sold' | 'unsold' | 'bid') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (type === 'sold') {
        // High celebratory fan-fare chord
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.65);
        });
      } else if (type === 'unsold') {
        // Low double descending buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch {
      // AudioContext muted/unsupported in some iframe policies
    }
  };

  // 1. Real-time Subscription to Auction Doc
  useEffect(() => {
    if (!auctionId) return;

    // Fail-safe timer to prevent loading hang
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    const unsubAuction = onSnapshot(
      doc(db, 'auctions', auctionId),
      (snap) => {
        if (snap.exists()) {
          setAuction({ id: snap.id, ...snap.data() } as Auction);
        } else {
          setAuction(null);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Auction live subscription notice:', error);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsubAuction();
    };
  }, [auctionId]);

  // 2. Real-time Subscription to AuctionState Doc
  useEffect(() => {
    if (!auctionId) return;
    const unsubState = onSnapshot(
      doc(db, 'auctionState', auctionId),
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as AuctionState;
          setAuctionState(data);

          if (data.playerStatus === 'sold') {
            setShowCelebration(true);
            playSoundEffect('sold');
            const timer = setTimeout(() => setShowCelebration(false), 5000);
            return () => clearTimeout(timer);
          } else if (data.playerStatus === 'unsold') {
            playSoundEffect('unsold');
          }
        }
      },
      (error) => {
        console.warn('Auction state live notice:', error);
      }
    );

    return () => unsubState();
  }, [auctionId]);

  // 3. Real-time Subscription to Teams
  useEffect(() => {
    if (!auctionId) return;
    const teamsQuery = query(collection(db, 'teams'), where('auctionId', '==', auctionId));
    const unsubTeams = onSnapshot(
      teamsQuery,
      (snap) => {
        const teamList: Team[] = [];
        snap.forEach((d) => {
          teamList.push({ id: d.id, ...d.data() } as Team);
        });
        // Sort alphabetically or by remaining purse
        teamList.sort((a, b) => b.remainingPurse - a.remainingPurse);
        setTeams(teamList);
        setLoading(false);
      },
      (error) => {
        console.warn('Teams live viewer notice:', error);
        setLoading(false);
      }
    );

    return () => unsubTeams();
  }, [auctionId]);

  // 4. Real-time Subscription to Players
  useEffect(() => {
    if (!auctionId) return;
    const playersQuery = query(collection(db, 'players'), where('auctionId', '==', auctionId));
    const unsubPlayers = onSnapshot(
      playersQuery,
      (snap) => {
        const playerList: Player[] = [];
        snap.forEach((d) => {
          playerList.push({ id: d.id, ...d.data() } as Player);
        });
        playerList.sort((a, b) => a.order - b.order);
        setPlayers(playerList);
      },
      (error) => {
        console.warn('Players live viewer notice:', error);
      }
    );

    return () => unsubPlayers();
  }, [auctionId]);

  // Full Screen API trigger
  const toggleProjectorMode = () => {
    setIsProjectorMode(!isProjectorMode);
    if (!document.fullscreenElement && !isProjectorMode) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fallback inside restricted iframe
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const copyViewerLink = () => {
    const url = window.location.origin + '?auction=' + auctionId;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  if (loading && !auction) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-300 text-lg font-semibold tracking-wide">
          Connecting to Live Auction Stream...
        </p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Auction Not Found</h2>
        <p className="text-zinc-400 max-w-md mb-6">
          The auction ID "{auctionId}" does not exist or may have been deleted.
        </p>
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold transition-colors shadow-md hover:from-amber-300 hover:to-amber-400 cursor-pointer"
          >
            Go to Auction Home
          </button>
        )}
      </div>
    );
  }

  // Summary counts
  const totalPlayers = players.length;
  const soldPlayers = players.filter((p) => p.status === 'sold');
  const unsoldPlayers = players.filter((p) => p.status === 'unsold');
  const upcomingPlayers = players.filter((p) => p.status === 'upcoming');

  return (
    <div
      className={`bg-black text-white selection:bg-amber-400 selection:text-black flex flex-col justify-between ${
        isProjectorMode
          ? 'h-screen max-h-screen w-screen overflow-hidden p-2 sm:p-3 md:p-4 select-none'
          : 'min-h-screen p-4 sm:p-6 lg:p-8'
      }`}
    >
      <CelebrationConfetti active={showCelebration} />

      {/* TOP BAR / HEADER */}
      <header
        className={`w-full max-w-7xl mx-auto flex items-center justify-between gap-3 border-b border-zinc-800 shrink-0 ${
          isProjectorMode ? 'pb-2 mb-2' : 'pb-4 mb-6'
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* BACK TO HOME OPTION AT LEFT TOP */}
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-amber-500/40 hover:border-amber-400 text-amber-400 hover:text-amber-300 font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
              title="Back to Home Screen"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Back to Home</span>
            </button>
          )}

          {/* LIVE BEACON */}
          {auctionState?.status === 'live' ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-600 border border-red-400/50 text-white shadow-lg shadow-red-950/50 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span className="text-[11px] sm:text-xs font-black tracking-widest uppercase">
                LIVE
              </span>
            </div>
          ) : auctionState?.status === 'paused' ? (
            <div className="px-2.5 py-1 rounded-full bg-amber-500 text-black text-[11px] sm:text-xs font-black tracking-widest uppercase shrink-0">
              PAUSED
            </div>
          ) : auctionState?.status === 'completed' ? (
            <div className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] sm:text-xs font-black tracking-widest uppercase shrink-0">
              COMPLETED
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-full bg-zinc-900 border border-amber-500/40 text-amber-400 text-[11px] sm:text-xs font-black tracking-widest uppercase shrink-0">
              SCHEDULED
            </div>
          )}

          {/* REAL-TIME LIVE VIEWERS WATCHING BADGE */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950 border border-amber-500/30 text-white shadow-sm shrink-0"
            title="Active viewers watching this auction in real time"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] sm:text-xs font-black">
              {liveViewerCount} <span className="font-semibold text-zinc-400 hidden md:inline">watching</span>
            </span>
          </div>

          <div className="min-w-0">
            <h1
              className={`font-black text-white truncate tracking-tight ${
                isProjectorMode
                  ? 'text-base sm:text-xl md:text-2xl'
                  : 'text-lg sm:text-2xl md:text-3xl'
              }`}
            >
              {auction.name}
            </h1>
            <div className="flex items-center gap-2.5 text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                {auction.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {auction.time}
              </span>
              {auctionState?.round === 'unsold' && (
                <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-black text-[10px] uppercase shadow-sm">
                  Unsold Round
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CONTROLS (PROJECTOR, AUDIO, SHARE, SLIDESHOW TOGGLE) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* PROJECTOR PRE-AUCTION SWITCHER (ONLY IN PROJECTOR MODE WHEN NO ACTIVE PLAYER) */}
          {isProjectorMode && (!auctionState?.currentPlayerId || auctionState?.status !== 'live') && (
            <div className="inline-flex p-0.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-white shadow-xs">
              <button
                onClick={() => setProjectorPreView('slideshow')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                  projectorPreView === 'slideshow'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                Slideshow
              </button>
              <button
                onClick={() => setProjectorPreView('teams')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                  projectorPreView === 'teams'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                Teams
              </button>
            </div>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Sounds' : 'Enable Audio Chimes'}
            className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-amber-400/40 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            )}
          </button>

          <button
            onClick={copyViewerLink}
            title="Copy Public Viewer Link"
            className="flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-zinc-950 border border-zinc-800 text-xs sm:text-sm font-bold text-white hover:border-amber-400/40 transition-colors shadow-sm cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden sm:inline">
              {copiedLink ? 'Link Copied!' : 'Share Live'}
            </span>
          </button>

          <button
            onClick={toggleProjectorMode}
            className={`flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
              isProjectorMode
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black border border-amber-400 ring-2 ring-amber-400/60'
                : 'bg-zinc-950 hover:bg-zinc-900 text-amber-400 border border-amber-500/40'
            }`}
          >
            {isProjectorMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Exit Full Screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>Projector Mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ANNOUNCEMENT BANNER FOR SOLD / UNSOLD STATUS */}
      {auctionState?.currentPlayerId && (auctionState.playerStatus === 'sold' || auctionState.playerStatus === 'unsold') && (
        <div className="w-full max-w-7xl mx-auto mb-4">
          {auctionState.playerStatus === 'sold' ? (
            <div className="w-full rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-pulse-sold">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1 rounded-full bg-emerald-500 text-black font-black text-sm uppercase tracking-wider">
                  SOLD
                </span>
                <span className="text-lg sm:text-2xl font-black text-white uppercase">
                  {auctionState.currentPlayerName} SOLD TO {auctionState.winningTeamName || 'WINNING TEAM'} FOR {auctionState.currentBidPoints ?? auctionState.currentPlayerBasePoints} PTS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase text-emerald-300">Highest Bid:</span>
                <span className="text-2xl font-black text-white bg-emerald-800/80 px-4 py-1 rounded-xl border border-emerald-400">
                  {auctionState.currentBidPoints ?? auctionState.currentPlayerBasePoints} PTS
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-2xl bg-red-950/90 border-2 border-red-500 p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xl animate-pulse-unsold">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1 rounded-full bg-red-600 text-white font-black text-sm uppercase tracking-wider">
                  UNSOLD
                </span>
                <span className="text-lg sm:text-2xl font-black text-white uppercase">
                  {auctionState.currentPlayerName} UNSOLD
                </span>
              </div>
              <span className="hidden md:inline text-xs font-semibold text-rose-200">
                Moves to Unsold Player Round
              </span>
            </div>
          )}
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main
        className={`w-full max-w-7xl mx-auto flex-1 min-h-0 flex flex-col justify-center ${
          isProjectorMode ? 'overflow-hidden' : ''
        }`}
      >
        {/* AUCTION STATUS OVERLAYS */}
        {auctionState?.status === 'completed' ? (
          <div
            className={`w-full text-center ${
              isProjectorMode
                ? 'h-full flex-1 min-h-0 flex flex-col justify-between overflow-y-auto'
                : 'max-w-2xl mx-auto py-12 px-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-4'
            }`}
          >
            <div className="shrink-0 space-y-2">
              <CheckCircle2 className="w-16 h-16 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] mx-auto" />
              <h2 className={`font-black text-white ${isProjectorMode ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
                Auction Completed!
              </h2>
              <p className="text-zinc-300 text-sm sm:text-base">
                All players and unsold rounds have concluded. Total players sold:{' '}
                <strong className="text-amber-400 font-black">{soldPlayers.length}</strong> /{' '}
                {totalPlayers}.
              </p>
              <div className="pt-1">
                <SocialFollowStrip variant="dark" />
              </div>
            </div>
            <div className={`w-full ${isProjectorMode ? 'flex-1 min-h-0 pt-2 overflow-y-auto' : 'pt-4'}`}>
              <TeamPurseBoard teams={teams} players={players} isProjectorMode={isProjectorMode} />
            </div>
          </div>
        ) : auctionState?.status === 'scheduled' || auction.status === 'scheduled' || auctionState?.status === 'draft' || (auctionState?.status !== 'live' && !auctionState?.currentPlayerId) ? (
          isProjectorMode ? (
            /* PROJECTOR MODE: 100% SINGLE FRAME VIEW - NO SCROLLING, PICTURES FULLY FITTED */
            <div className="w-full h-full flex-1 min-h-0 flex flex-col justify-center overflow-hidden">
              {projectorPreView === 'slideshow' ? (
                <PreAuctionSlideshow
                  auction={auction}
                  teams={teams}
                  isProjectorMode={true}
                />
              ) : (
                <div className="w-full h-full flex-1 min-h-0 rounded-3xl bg-zinc-950 border border-zinc-800 p-3 sm:p-5 backdrop-blur-md shadow-xl overflow-y-auto">
                  <TeamPurseBoard
                    teams={teams}
                    players={players}
                    isProjectorMode={true}
                  />
                </div>
              )}
            </div>
          ) : (
            /* STANDARD VIEWER: VERTICALLY SCROLLABLE SHOWCASE + TEAMS */
            <div className="w-full space-y-6">
              <PreAuctionSlideshow
                auction={auction}
                teams={teams}
                isProjectorMode={false}
              />
              <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-4 sm:p-6 backdrop-blur-md shadow-xl">
                <TeamPurseBoard
                  teams={teams}
                  players={players}
                  isProjectorMode={false}
                />
              </div>
            </div>
          )
        ) : !auctionState?.currentPlayerId ? (
          /* LIVE AUCTION, WAITING FOR NEXT PLAYER */
          isProjectorMode ? (
            <div className="w-full h-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
              <div className="shrink-0 mb-1 py-1 px-4 rounded-full bg-zinc-950 border border-amber-500/40 flex items-center justify-between text-xs text-white max-w-md mx-auto shadow-md">
                <span className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  Waiting for Next Player
                </span>
                <span className="text-zinc-400">Live Auction In Progress</span>
              </div>
              <div className="w-full flex-1 min-h-0">
                <PreAuctionSlideshow
                  auction={auction}
                  teams={teams}
                  isProjectorMode={true}
                />
              </div>
            </div>
          ) : (
            <div className="w-full space-y-6">
              <div className="w-full max-w-2xl mx-auto text-center py-10 px-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-3">
                <Radio className="w-12 h-12 text-amber-400 mx-auto animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Waiting for Next Player
                </h2>
                <p className="text-zinc-300 text-sm sm:text-base">
                  The auction is currently live! The next player will be presented on screen momentarily.
                </p>
                <div className="pt-2">
                  <SocialFollowStrip variant="dark" />
                </div>
              </div>

              <PreAuctionSlideshow
                auction={auction}
                teams={teams}
                isProjectorMode={false}
              />

              <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-4 sm:p-6 backdrop-blur-md shadow-xl">
                <TeamPurseBoard
                  teams={teams}
                  players={players}
                  isProjectorMode={false}
                />
              </div>
            </div>
          )
        ) : (
          /* LIVE BROADCAST ARENA STAGE (MATCHING OFFICIAL TV AUCTION BROADCAST) */
          <div className="w-full flex-1 flex flex-col justify-center min-h-0 py-1">
            <ZPLBroadcastPlayerStage
              auction={auction}
              auctionState={auctionState}
              teams={teams}
              players={players}
              isProjectorMode={isProjectorMode}
            />
          </div>
        )}
      </main>

      {/* SOCIAL MEDIA & FOOTER TICKER */}
      <footer className={`w-full max-w-7xl mx-auto shrink-0 ${
        isProjectorMode ? 'pt-1.5 mt-2 border-t border-zinc-800' : 'pt-6 mt-8 border-t border-zinc-800 space-y-4'
      }`}>
        {/* VISIBLE SOCIAL MEDIA FOOTER STRIP IN EVERY AUCTION VIEWER STATE */}
        <SocialFollowStrip variant="dark" />

        {!isProjectorMode && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60 font-medium">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
              <span className="font-bold text-white tracking-wide">
                ZHEP KRIDA MANDAL (PLAYER AUCTION) &bull; Official Live Broadcast
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>Projector (1080p / 4K) & Mobile Ready</span>
              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="hover:text-amber-400 transition-colors underline font-semibold cursor-pointer"
                >
                  Auctions Home
                </button>
              )}
            </div>
          </div>
        )}

        {/* UNIVERSAL FOOTER COPYRIGHT */}
        <FooterCopyright className="pt-2" />
      </footer>
    </div>
  );
}
