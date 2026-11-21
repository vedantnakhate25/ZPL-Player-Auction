import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { onSnapshot, doc, collection, query, where, db } from '../lib/firebase';
import type { Auction, AuctionState, Team, Player } from '../types/auction';
import { TeamPurseBoard } from '../components/TeamPurseBoard';
import { PreAuctionSlideshow } from '../components/PreAuctionSlideshow';
import { CelebrationConfetti } from '../components/CelebrationConfetti';
import { PlayerDecisionPopup } from '../components/PlayerDecisionPopup';
import { UnsoldRoundBanner } from '../components/UnsoldRoundBanner';
import { SocialFollowStrip } from '../components/SocialFollowStrip';
import { ZPLBroadcastPlayerStage } from '../components/ZPLBroadcastPlayerStage';
import {
  Radio,
  Maximize2,
  Minimize2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Share2,
  Eye,
  ArrowLeft,
  FileSpreadsheet
} from 'lucide-react';
import { useLiveViewers, formatViewerCount } from '../lib/useLiveViewers';
import { exportAuctionResultsToExcel } from '../lib/exportAuctionExcel';

interface LiveAuctionViewerProps {
  auctionId: string;
  onNavigateHome?: () => void;
}

// Global singleton AudioContext to prevent hardware/memory leaks across rapid bids
let globalAudioCtx: AudioContext | null = null;
function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
    try {
      globalAudioCtx = new AudioContextClass();
    } catch {
      return null;
    }
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

export function LiveAuctionViewer({
  auctionId,
  onNavigateHome
}: LiveAuctionViewerProps) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isNotFoundConfirmed, setIsNotFoundConfirmed] = useState(false);
  const [connectionSlow, setConnectionSlow] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [projectorPreView, setProjectorPreView] = useState<'slideshow' | 'teams'>('slideshow');

  // Refs prevent stale closures inside Firestore listeners and avoid duplicate sound/confetti fires
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const lastEventKeyRef = useRef<string | null>(null);
  const lastBidKeyRef = useRef<string | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);

  // Real-time live viewer counter and heartbeat beacon
  const liveViewerCount = useLiveViewers(auctionId, true);

  // Summary counts (memoized for smooth rendering)
  const totalPlayers = players.length;
  const { soldCount, unsoldCount } = useMemo(() => {
    let sold = 0;
    let unsold = 0;
    for (let i = 0; i < players.length; i++) {
      if (players[i]?.status === 'sold') sold++;
      else if (players[i]?.status === 'unsold') unsold++;
    }
    return { soldCount: sold, unsoldCount: unsold };
  }, [players]);

  const playSoundEffect = useCallback((type: 'sold' | 'unsold' | 'bid') => {
    if (!soundEnabledRef.current) return;
    try {
      const ctx = getSharedAudioContext();
      if (!ctx) return;

      if (type === 'sold') {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.14, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.6);
        });
      } else if (type === 'unsold') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.42);
      } else if (type === 'bid') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.07);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.13);
      }
    } catch {
      // AudioContext muted/unsupported in restricted environments
    }
  }, []);

  // 1. Real-time Subscription to Auction Doc
  useEffect(() => {
    if (!auctionId || typeof auctionId !== 'string') {
      setIsConnecting(false);
      setIsNotFoundConfirmed(true);
      return;
    }

    setIsConnecting(true);
    setIsNotFoundConfirmed(false);
    setConnectionSlow(false);

    const slowTimer = window.setTimeout(() => {
      setConnectionSlow(true);
    }, 6000);

    const unsubAuction = onSnapshot(
      doc(db, 'auctions', auctionId),
      (snap) => {
        if (snap.exists()) {
          setAuction({ id: snap.id, ...snap.data() } as Auction);
          setIsNotFoundConfirmed(false);
        } else {
          setAuction(null);
          setIsNotFoundConfirmed(true);
        }
        setIsConnecting(false);
      },
      (error) => {
        console.warn('Auction live subscription notice:', error);
        setIsConnecting(false);
      }
    );

    return () => {
      window.clearTimeout(slowTimer);
      unsubAuction();
    };
  }, [auctionId]);

  // 2. Real-time Subscription to AuctionState Doc
  useEffect(() => {
    if (!auctionId || typeof auctionId !== 'string') return;
    lastEventKeyRef.current = null;
    lastBidKeyRef.current = null;

    const unsubState = onSnapshot(
      doc(db, 'auctionState', auctionId),
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as AuctionState;
          setAuctionState(data);

          if (data.playerStatus === 'sold' || data.playerStatus === 'unsold') {
            const eventKey = `${data.playerStatus}_${data.currentPlayerId}_${data.updatedAt || ''}`;
            if (lastEventKeyRef.current !== eventKey) {
              lastEventKeyRef.current = eventKey;
              if (data.playerStatus === 'sold') {
                setShowCelebration(true);
                playSoundEffect('sold');
                if (celebrationTimerRef.current) {
                  window.clearTimeout(celebrationTimerRef.current);
                }
                celebrationTimerRef.current = window.setTimeout(() => {
                  setShowCelebration(false);
                }, 4000);
              } else {
                playSoundEffect('unsold');
              }
            }
          } else if (data.playerStatus === 'bidding' && data.winningTeamId) {
            const bidKey = `${data.currentPlayerId}_${data.winningTeamId}_${data.currentBidPoints}`;
            if (lastBidKeyRef.current && lastBidKeyRef.current !== bidKey) {
              playSoundEffect('bid');
            }
            lastBidKeyRef.current = bidKey;
          }
        }
      },
      (error) => {
        console.warn('Auction state live notice:', error);
      }
    );

    return () => {
      unsubState();
      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current);
      }
    };
  }, [auctionId, playSoundEffect]);

  // 3. Real-time Subscription to Teams
  useEffect(() => {
    if (!auctionId || typeof auctionId !== 'string') return;
    const teamsQuery = query(collection(db, 'teams'), where('auctionId', '==', auctionId));
    const unsubTeams = onSnapshot(
      teamsQuery,
      (snap) => {
        const teamList: Team[] = [];
        snap.forEach((d) => {
          teamList.push({ id: d.id, ...d.data() } as Team);
        });
        teamList.sort((a, b) => b.remainingPurse - a.remainingPurse);
        setTeams(teamList);
      },
      (error) => {
        console.warn('Teams live viewer notice:', error);
      }
    );

    return () => unsubTeams();
  }, [auctionId]);

  // 4. Real-time Subscription to Players
  useEffect(() => {
    if (!auctionId || typeof auctionId !== 'string') return;
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

  const toggleProjectorMode = () => {
    setIsProjectorMode((prev) => {
      const next = !prev;
      if (!document.fullscreenElement && next) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.fullscreenElement && !next) {
        document.exitFullscreen().catch(() => {});
      }
      return next;
    });
  };

  const copyViewerLink = async () => {
    const url = window.location.origin + '?auction=' + auctionId;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: auction ? `${auction.name} - Live Cricket Auction` : 'ZPL Live Cricket Auction',
          text: `Watch the official live player auction stream for ${auction?.name || 'ZPL'}!`,
          url
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  if (isConnecting && !auction) {
    return (
      <div className="min-h-screen bg-[#060c16] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-11 h-11 border-4 border-[#f5d77f] border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-xl font-black text-white tracking-wide">
          Connecting to Live Auction...
        </h3>
        <p className="text-[#a1b3cb] text-xs sm:text-sm mt-1 max-w-sm mx-auto">
          Synchronizing real-time bids, team purses, and player stage.
        </p>
        {connectionSlow && (
          <div className="mt-5 flex items-center justify-center gap-2.5">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#fae29c] via-[#f5d77f] to-[#e0bc50] text-[#060c16] text-xs font-black cursor-pointer"
            >
              Refresh Stream
            </button>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="px-4 py-2 rounded-xl bg-[#0a1526] border border-[#162b4a] text-[#c5d3e8] text-xs font-bold hover:text-white cursor-pointer"
              >
                Back to Auctions
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!auction && isNotFoundConfirmed) {
    return (
      <div className="min-h-screen bg-[#060c16] flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertTriangle className="w-14 h-14 text-[#f5d77f] mb-4" />
        <h2 className="text-2xl font-bold mb-2">Auction Not Found</h2>
        <p className="text-[#a1b3cb] max-w-md mb-6 text-sm">
          The requested auction does not exist or may have been removed.
        </p>
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#fae29c] via-[#f5d77f] to-[#e0bc50] text-[#060c16] font-black text-sm cursor-pointer"
          >
            Go to Auction Home
          </button>
        )}
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-[#060c16] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-11 h-11 border-4 border-[#f5d77f] border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-xl font-black text-white">Reconnecting to Auction...</h3>
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#fae29c] via-[#f5d77f] to-[#e0bc50] text-[#060c16] font-black text-xs cursor-pointer"
          >
            Retry Connection
          </button>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 rounded-xl bg-[#0a1526] border border-[#162b4a] text-[#c5d3e8] text-xs font-bold hover:text-white cursor-pointer"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-[#060c16] text-white selection:bg-[#f5d77f] selection:text-[#060c16] flex flex-col justify-between ${
        isProjectorMode
          ? 'h-screen max-h-screen w-screen overflow-hidden p-2 select-none'
          : 'min-h-screen p-4 sm:p-6 lg:p-8'
      }`}
    >
      <CelebrationConfetti active={showCelebration} />
      <PlayerDecisionPopup auctionState={auctionState} teams={teams} />
      <UnsoldRoundBanner auctionState={auctionState} />

      {/* TOP BAR / HEADER */}
      <header
        className={`w-full max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-4 border-b border-[#162b4a] shrink-0 ${
          isProjectorMode ? 'pb-1.5 mb-1.5' : 'pb-3.5 sm:pb-4 mb-5 sm:mb-6'
        }`}
      >
        {/* Row 1 (Mobile) / Left Column (Desktop): Back + Title (+ Date/Time on md+) + Mobile Icon Buttons */}
        <div className="flex items-center justify-between gap-2.5 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="h-9 flex items-center justify-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-[#0a1526] hover:bg-[#10223d] border border-[#f5d77f]/35 text-[#f5d77f] font-bold text-xs sm:text-sm transition-colors shrink-0 cursor-pointer whitespace-nowrap"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            <div className="min-w-0 flex-1">
              <h1
                className={`font-black text-white truncate tracking-tight leading-tight ${
                  isProjectorMode ? 'text-base sm:text-xl' : 'text-base sm:text-xl md:text-2xl'
                }`}
              >
                {auction.name}
              </h1>
              {/* Desktop inline date/time */}
              <div className="hidden md:flex items-center gap-2 text-xs text-[#a1b3cb] mt-0.5">
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <Calendar className="w-3 h-3 text-[#f5d77f]" />
                  {auction.date}
                </span>
                <span aria-hidden="true">&middot;</span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <Clock className="w-3 h-3 text-[#f5d77f]" />
                  {auction.time}
                </span>
                {auctionState?.round === 'unsold' && (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span className="text-rose-400 font-bold uppercase whitespace-nowrap">
                      Unsold Round
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-1.5 md:hidden shrink-0">
            <button
              onClick={() => setSoundEnabled((s) => !s)}
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              className="h-9 w-9 rounded-xl bg-[#0a1526] border border-[#162b4a] text-[#c5d3e8] flex items-center justify-center cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#f5d77f]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#60738e]" />
              )}
            </button>
            <button
              onClick={copyViewerLink}
              title="Share Live Link"
              className="h-9 w-9 rounded-xl bg-[#0a1526] border border-[#162b4a] text-white flex items-center justify-center cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#f5d77f]" />
            </button>
            <button
              onClick={toggleProjectorMode}
              title="Toggle Projector Mode"
              className={`h-9 w-9 rounded-xl flex items-center justify-center cursor-pointer ${
                isProjectorMode
                  ? 'bg-[#f5d77f] text-[#060c16]'
                  : 'bg-[#0a1526] text-[#f5d77f] border border-[#f5d77f]/35'
              }`}
            >
              {isProjectorMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Row 2 (Mobile) / Right Column (Desktop): Status, Viewers, Date/Time (Mobile) & Desktop Controls */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-x-3 gap-y-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
            {auctionState?.status === 'completed' || auction.status === 'completed' ? (
              <span className="px-2.5 py-1 rounded-lg bg-[#0a1526] border border-[#162b4a] text-[#c5d3e8] font-bold tracking-wider uppercase whitespace-nowrap">
                COMPLETED
              </span>
            ) : auctionState?.status === 'paused' || auction.status === 'paused' ? (
              <span className="px-2.5 py-1 rounded-lg bg-[#f5d77f] text-[#060c16] font-black tracking-wider uppercase whitespace-nowrap">
                PAUSED
              </span>
            ) : auctionState?.status === 'live' && auction.status === 'live' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white font-black tracking-wider uppercase whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-white" />
                LIVE
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-[#0a1526] border border-[#f5d77f]/35 text-[#f5d77f] font-bold tracking-wider uppercase whitespace-nowrap">
                SCHEDULED
              </span>
            )}

            {auctionState?.round === 'unsold' && (
              <span className="md:hidden px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/45 text-rose-300 text-[10px] font-black tracking-wider uppercase whitespace-nowrap">
                Unsold Round
              </span>
            )}

            <div
              className="inline-flex items-center gap-1.5 text-[#c5d3e8] font-semibold whitespace-nowrap tabular-nums"
              title="Active viewers watching live"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-white">{formatViewerCount(liveViewerCount)}</span>
              <span className="text-[#a1b3cb]">watching</span>
            </div>
          </div>

          {/* Mobile Date & Time — Cleanly aligned on its own side with zero icon overlap */}
          <div className="flex md:hidden items-center gap-1.5 text-[11px] text-[#a1b3cb] whitespace-nowrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#f5d77f]" />
              {auction.date}
            </span>
            <span aria-hidden="true">&middot;</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#f5d77f]" />
              {auction.time}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isProjectorMode && (!auctionState?.currentPlayerId || auctionState?.status !== 'live') && (
              <div className="inline-flex p-0.5 rounded-xl bg-[#0a1526] border border-[#162b4a] text-xs font-bold">
                <button
                  onClick={() => setProjectorPreView('slideshow')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    projectorPreView === 'slideshow'
                      ? 'bg-[#f5d77f] text-[#060c16]'
                      : 'text-[#c5d3e8] hover:text-white'
                  }`}
                >
                  Slideshow
                </button>
                <button
                  onClick={() => setProjectorPreView('teams')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    projectorPreView === 'teams'
                      ? 'bg-[#f5d77f] text-[#060c16]'
                      : 'text-[#c5d3e8] hover:text-white'
                  }`}
                >
                  Teams
                </button>
              </div>
            )}

            <button
              onClick={() => setSoundEnabled((s) => !s)}
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              className="h-9 w-9 rounded-xl bg-[#0a1526] border border-[#162b4a] hover:border-[#f5d77f]/40 flex items-center justify-center transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#f5d77f]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#60738e]" />
              )}
            </button>

            <button
              onClick={copyViewerLink}
              title="Copy Live Viewer Link"
              className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-[#0a1526] border border-[#162b4a] hover:border-[#f5d77f]/40 text-xs font-bold text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5 text-[#f5d77f]" />
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={toggleProjectorMode}
              className={`h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl font-black text-xs transition-colors cursor-pointer whitespace-nowrap ${
                isProjectorMode
                  ? 'bg-gradient-to-r from-[#fae29c] via-[#f5d77f] to-[#e0bc50] text-[#060c16]'
                  : 'bg-[#0a1526] hover:bg-[#10223d] text-[#f5d77f] border border-[#f5d77f]/35'
              }`}
            >
              {isProjectorMode ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#f5d77f]" />
                  <span>Projector Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main
        className={`w-full max-w-7xl mx-auto flex-1 min-h-0 flex flex-col justify-center ${
          isProjectorMode ? 'overflow-y-auto md:overflow-hidden' : ''
        }`}
      >
        {auctionState?.status === 'completed' || auction.status === 'completed' ? (
          <div
            className={`w-full text-center ${
              isProjectorMode
                ? 'h-full flex-1 min-h-0 flex flex-col justify-between overflow-y-auto'
                : 'max-w-4xl mx-auto py-8 px-6 rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 shadow-xl space-y-5'
            }`}
          >
            <div className="shrink-0 space-y-2.5">
              <CheckCircle2 className="w-14 h-14 text-[#f5d77f] mx-auto" />
              <h2 className="text-2xl sm:text-3xl font-black text-white">Auction Completed</h2>
              <p className="text-[#c5d3e8] text-sm sm:text-base tabular-nums">
                Players sold: <strong className="text-[#f5d77f] font-black">{soldCount}</strong> /{' '}
                {totalPlayers}
              </p>
              {!isProjectorMode && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => exportAuctionResultsToExcel(auction, teams, players)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#fff4c2] via-[#f5d77f] to-[#e0bc50] hover:from-white hover:to-[#f5d77f] text-[#060c16] text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg transition-transform active:scale-[0.98] cursor-pointer whitespace-nowrap"
                  >
                    <FileSpreadsheet className="w-4 h-4 stroke-[2.2]" />
                    <span>Download Excel Results (.xlsx)</span>
                  </button>
                </div>
              )}
            </div>
            <div className={`w-full ${isProjectorMode ? 'flex-1 min-h-0 pt-2 overflow-y-auto' : 'pt-2'}`}>
              <TeamPurseBoard teams={teams} players={players} isProjectorMode={isProjectorMode} />
            </div>
          </div>
        ) : auctionState?.status === 'scheduled' ||
          auction.status === 'scheduled' ||
          auctionState?.status === 'draft' ||
          auction.status === 'draft' ||
          ((auctionState?.status === 'paused' || auction.status === 'paused') && !auctionState?.currentPlayerId) ||
          ((auctionState?.status !== 'live' || auction.status !== 'live') && !auctionState?.currentPlayerId) ||
          (!auctionState?.currentPlayerId &&
            soldCount === 0 &&
            unsoldCount === 0 &&
            !auctionState?.lastSoldPlayerName &&
            !auctionState?.lastUnsoldPlayerName) ? (
          isProjectorMode ? (
            <div className="w-full h-full flex-1 min-h-0 flex flex-col justify-center overflow-hidden">
              {projectorPreView === 'slideshow' ? (
                <PreAuctionSlideshow auction={auction} teams={teams} isProjectorMode={true} />
              ) : (
                <div className="w-full h-full flex-1 min-h-0 rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-4 sm:p-5 overflow-y-auto">
                  <TeamPurseBoard teams={teams} players={players} isProjectorMode={true} />
                </div>
              )}
            </div>
          ) : (
            <div className="w-full space-y-6">
              <PreAuctionSlideshow auction={auction} teams={teams} isProjectorMode={false} />
              <div className="rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-4 sm:p-6 shadow-xl">
                <TeamPurseBoard teams={teams} players={players} isProjectorMode={false} />
              </div>
            </div>
          )
        ) : !auctionState?.currentPlayerId ? (
          isProjectorMode ? (
            <div className="w-full h-full flex-1 min-h-0 flex flex-col justify-between gap-3 overflow-y-auto md:overflow-hidden">
              <div className="shrink-0 py-2 px-4 rounded-xl bg-[#0a1526] border border-[#f5d77f]/35 flex items-center justify-center gap-2 text-xs text-[#f5d77f] font-bold max-w-sm mx-auto">
                <Radio className="w-3.5 h-3.5" />
                <span>Waiting for Next Player</span>
              </div>
              <div className="w-full flex-1 min-h-0 rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-4 sm:p-5 overflow-y-auto">
                <TeamPurseBoard teams={teams} players={players} isProjectorMode={true} />
              </div>
            </div>
          ) : (
            <div className="w-full space-y-6">
              <div className="w-full max-w-2xl mx-auto text-center py-8 px-6 rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 shadow-xl space-y-2.5">
                <Radio className="w-10 h-10 text-[#f5d77f] mx-auto" />
                <h2 className="text-2xl font-black text-white">Waiting for Next Player</h2>
                <p className="text-[#c5d3e8] text-sm">
                  The auction is live. The next player will appear on stage momentarily.
                </p>
              </div>
              <div className="rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-4 sm:p-6 shadow-xl">
                <TeamPurseBoard teams={teams} players={players} isProjectorMode={false} />
              </div>
            </div>
          )
        ) : (
          /* LIVE BROADCAST STAGE */
          <div
            className={`w-full flex-1 flex flex-col justify-center min-h-0 ${
              isProjectorMode ? 'py-0 h-full overflow-y-auto md:overflow-hidden' : 'py-1 space-y-6'
            }`}
          >
            <ZPLBroadcastPlayerStage
              auction={auction}
              auctionState={auctionState}
              teams={teams}
              players={players}
              isProjectorMode={isProjectorMode}
            />
            {!isProjectorMode && (
              <div className="rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-4 sm:p-6 shadow-xl">
                <TeamPurseBoard
                  teams={teams}
                  players={players}
                  activeWinningTeamId={auctionState?.winningTeamId || undefined}
                  isProjectorMode={false}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* CLEAN FOOTER */}
      {!isProjectorMode && (
        <footer className="w-full max-w-7xl mx-auto shrink-0 pt-6 mt-8 border-t border-[#162b4a] space-y-3">
          <SocialFollowStrip variant="dark" />
          <p className="text-center text-xs text-[#a1b3cb] font-medium">
            ZPL &middot; Zhep Premier League (Zhep Krida Mandal)
          </p>
        </footer>
      )}
    </div>
  );
}
