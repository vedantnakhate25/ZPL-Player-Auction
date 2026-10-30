import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { AuctionState, Team } from '../types/auction';
import {
  Trophy,
  Check,
  X,
  Shield,
  Zap,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PlayerDecisionPopupProps {
  auctionState?: AuctionState | null;
  teams: Team[];
  onClose?: () => void;
}

export function PlayerDecisionPopup({
  auctionState,
  teams,
  onClose
}: PlayerDecisionPopupProps) {
  const [photoError, setPhotoError] = useState(false);
  const [teamLogoError, setTeamLogoError] = useState(false);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const status = auctionState?.playerStatus;
  const isSold = status === 'sold';
  const isUnsold = status === 'unsold';

  // Construct a unique key for the current outcome event
  const currentEventKey =
    auctionState && (isSold || isUnsold)
      ? `${status}_${auctionState.currentPlayerId || auctionState.lastSoldPlayerName || auctionState.lastUnsoldPlayerName || 'player'}_${auctionState.updatedAt || ''}`
      : null;

  // Reset image error states when the event key changes
  useEffect(() => {
    setPhotoError(false);
    setTeamLogoError(false);
  }, [currentEventKey]);

  // Determine if popup should be visible
  const isVisible = Boolean(
    (isSold || isUnsold) &&
    currentEventKey &&
    currentEventKey !== dismissedKey
  );

  // Auto-dismiss after 14 seconds so live broadcast keeps moving
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      if (currentEventKey) {
        setDismissedKey(currentEventKey);
      }
      onClose?.();
    }, 14000);

    return () => clearTimeout(timer);
  }, [isVisible, currentEventKey, onClose]);

  const handleDismiss = () => {
    if (currentEventKey) {
      setDismissedKey(currentEventKey);
    }
    onClose?.();
  };

  if (!isVisible) return null;

  // Extract Player Details
  const playerName = (
    auctionState?.currentPlayerName ||
    (isSold ? auctionState?.lastSoldPlayerName : auctionState?.lastUnsoldPlayerName) ||
    'Player'
  ).toUpperCase();

  const playerRole =
    auctionState?.currentPlayerRole ||
    (isUnsold ? auctionState?.lastUnsoldPlayerRole : undefined) ||
    'Player';

  const playerPhoto =
    auctionState?.currentPlayerPhoto ||
    (isSold ? auctionState?.lastSoldPlayerPhoto : auctionState?.lastUnsoldPlayerPhoto) ||
    '';

  const points =
    isSold
      ? (auctionState?.currentBidPoints || auctionState?.lastSoldPoints || 0)
      : (auctionState?.currentPlayerBasePoints || auctionState?.lastUnsoldBasePoints || 50);

  // Extract Winning Team Details for SOLD
  const winningTeamId = auctionState?.winningTeamId;
  const winningTeamName =
    auctionState?.winningTeamName ||
    auctionState?.lastSoldTeamName ||
    'Winning Team';

  const matchedTeam = teams.find(
    (t) =>
      (winningTeamId && t.id === winningTeamId) ||
      (t.name && winningTeamName && t.name.toLowerCase().trim() === winningTeamName.toLowerCase().trim())
  );

  const teamLogo =
    matchedTeam?.logoUrl ||
    auctionState?.winningTeamLogo ||
    auctionState?.lastSoldTeamLogo ||
    '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl select-none">
        {/* Glow ambient background aura */}
        <div
          className={`absolute inset-0 pointer-events-none opacity-40 blur-3xl transition-colors duration-700 ${
            isSold ? 'bg-gradient-to-tr from-emerald-600/30 via-amber-500/20 to-emerald-400/30' : 'bg-gradient-to-tr from-rose-700/30 via-red-500/20 to-rose-600/30'
          }`}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-4xl mx-auto rounded-3xl bg-gradient-to-b from-[#0e1e36] via-[#0a1526] to-[#060c16] p-4 sm:p-8 shadow-2xl border-2 overflow-hidden ${
            isSold
              ? 'border-[#f5d77f] shadow-[0_0_80px_rgba(245,215,127,0.35)]'
              : 'border-rose-500 shadow-[0_0_80px_rgba(244,63,94,0.35)]'
          }`}
        >
          {/* Top Decorative Header Accent */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-transparent via-[#f5d77f] to-transparent" />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-10 h-10 rounded-full bg-[#0a1526]/90 hover:bg-[#0f1d33] text-[#fff4c2] hover:text-white border border-[#f5d77f]/40 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* HEADER BADGE */}
          <div className="flex flex-col items-center justify-center text-center space-y-2 mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${isSold ? 'text-[#f5d77f] animate-spin' : 'text-rose-400'}`} />
              <span className="text-[11px] sm:text-xs font-black tracking-widest uppercase text-[#fff4c2]/80">
                {auctionState?.auctionName || 'ZPL AUCTION'} &bull; OFFICIAL BROADCAST NOTICE
              </span>
              <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${isSold ? 'text-[#f5d77f] animate-spin' : 'text-rose-400'}`} />
            </div>

            {/* BIG STATUS PILL */}
            {isSold ? (
              <div className="inline-flex items-center gap-2 px-6 sm:px-10 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#fff4c2] via-[#f5d77f] to-[#e0bc50] text-[#060c16] shadow-xl shadow-[#f5d77f]/25 border border-[#fff4c2]">
                <Check className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3.5]" />
                <span className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider font-heading">
                  SOLD!
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-6 sm:px-10 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 text-white shadow-xl shadow-rose-600/30">
                <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3.5]" />
                <span className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider font-heading">
                  UNSOLD
                </span>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* BODY: IF SOLD (PLAYER + WINNING TEAM + BID POINTS) */}
          {/* ======================================================== */}
          {isSold ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
                
                {/* 1. PLAYER HERO CARD */}
                <div className="rounded-2xl bg-[#0a1526]/90 border-2 border-[#f5d77f]/40 p-4 sm:p-5 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-2 left-3 text-[10px] font-black uppercase tracking-wider text-[#f5d77f] flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-[#f5d77f]" />
                    ACQUIRED PLAYER
                  </div>

                  {/* Player Photo (Bigger, High-Contrast Bezel) */}
                  <div className="mt-5 relative w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 lg:w-60 lg:h-60 rounded-2xl p-[3px] bg-gradient-to-tr from-[#f5d77f] via-[#fff4c2] to-[#d4af37] shadow-2xl shadow-[#f5d77f]/20">
                    <div className="w-full h-full rounded-[13px] bg-[#060c16] overflow-hidden flex items-center justify-center">
                      {playerPhoto && !photoError ? (
                        <img
                          src={playerPhoto}
                          alt={playerName}
                          onError={() => setPhotoError(true)}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#060c16] text-[#f5d77f]/70 p-2">
                          <Trophy className="w-14 h-14 text-[#f5d77f] mb-1" />
                          <span className="text-[10px] font-black uppercase text-[#fff4c2]">
                            ZPL PLAYER
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Player Name & Role */}
                  <div className="mt-3 w-full">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-wide truncate drop-shadow-md">
                      {playerName}
                    </h3>
                    <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[#f5d77f]/15 border border-[#f5d77f]/40 text-[#f5d77f] text-xs sm:text-sm font-black uppercase tracking-wider">
                      {playerRole}
                    </div>
                  </div>
                </div>

                {/* 2. WINNING TEAM HERO CARD */}
                <div className="rounded-2xl bg-[#0a1526]/90 border-2 border-[#f5d77f]/50 p-4 sm:p-5 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-2 left-3 text-[10px] font-black uppercase tracking-wider text-[#f5d77f] flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-[#f5d77f]" />
                    NEW HOME FRANCHISE
                  </div>

                  {/* Team Logo (Bigger, Glowing Gold Frame) */}
                  <div className="mt-5 relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-2xl p-[3px] bg-gradient-to-tr from-[#fff4c2] via-[#f5d77f] to-[#c59f33] shadow-2xl shadow-[#f5d77f]/25">
                    <div className="w-full h-full rounded-[13px] bg-[#060c16] overflow-hidden flex items-center justify-center">
                      {teamLogo && !teamLogoError ? (
                        <img
                          src={teamLogo}
                          alt={winningTeamName}
                          onError={() => setTeamLogoError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#060c16] text-[#f5d77f] p-2">
                          <Shield className="w-14 h-14 text-[#f5d77f] mb-1" />
                          <span className="text-xs font-black uppercase">
                            {winningTeamName.slice(0, 3)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Name */}
                  <div className="mt-3 w-full">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-wide truncate drop-shadow-md">
                      {winningTeamName}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#fff4c2]/80 font-bold mt-1">
                      Official ZPL Franchise
                    </p>
                  </div>
                </div>

              </div>

              {/* 3. FINAL SALE PRICE PLAQUE */}
              <div className="w-full rounded-2xl bg-gradient-to-r from-[#0a1526] via-[#102340] to-[#0a1526] border-2 border-[#f5d77f] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#f5d77f] to-[#fff4c2] text-[#060c16] flex items-center justify-center font-black shadow-md">
                    <Zap className="w-7 h-7 fill-[#060c16]" />
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#f5d77f] block">
                      FINAL PURCHASE BID
                    </span>
                    <span className="text-sm sm:text-base font-bold text-white">
                      Player awarded to <strong className="text-[#fff4c2] uppercase">{winningTeamName}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-black text-[#fff4c2] tracking-tight drop-shadow-lg">
                    <span className="text-[#f5d77f] font-serif mr-1">₹</span>
                    {points} <span className="text-base sm:text-xl text-[#f5d77f] font-black uppercase">PTS</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* BODY: IF UNSOLD (PLAYER PHOTO + NAME + UNSOLD NOTICE) */
            /* ======================================================== */
            <div className="space-y-6 max-w-lg mx-auto">
              {/* Player Hero Card */}
              <div className="rounded-2xl bg-[#0a1526]/90 border-2 border-rose-500/50 p-6 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-2xl p-[3px] bg-gradient-to-tr from-rose-500 via-red-400 to-rose-600 shadow-2xl shadow-rose-600/30">
                  <div className="w-full h-full rounded-[13px] bg-[#060c16] overflow-hidden flex items-center justify-center">
                    {playerPhoto && !photoError ? (
                      <img
                        src={playerPhoto}
                        alt={playerName}
                        onError={() => setPhotoError(true)}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#060c16] text-white/50 p-2">
                        <Trophy className="w-12 h-12 text-white/50 mb-1" />
                        <span className="text-xs font-black uppercase text-white/80">
                          ZPL PLAYER
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 w-full">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-wide truncate drop-shadow-md">
                    {playerName}
                  </h3>
                  <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs sm:text-sm font-black uppercase tracking-wider">
                    {playerRole}
                  </div>
                </div>
              </div>

              {/* Unsold Notice Banner */}
              <div className="rounded-2xl bg-[#0a1526] border border-[#f5d77f]/20 p-4 text-center space-y-1.5 shadow-lg">
                <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-400">
                  BASE PRICE: ₹ {points} PTS
                </p>
                <p className="text-xs sm:text-sm text-white/80 font-medium">
                  No bids were received for <strong className="text-white uppercase">{playerName}</strong> during this round. The player will return to the floor in the Unsold Round.
                </p>
              </div>
            </div>
          )}

          {/* BOTTOM ACTIONS */}
          <div className="mt-6 pt-4 border-t border-[#f5d77f]/20 flex items-center justify-center">
            <button
              onClick={handleDismiss}
              className={`px-6 sm:px-8 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                isSold
                  ? 'bg-gradient-to-r from-[#fff4c2] via-[#f5d77f] to-[#e0bc50] hover:from-[#fff] hover:to-[#f5d77f] text-[#060c16] shadow-[#f5d77f]/20'
                  : 'bg-[#0a1526] hover:bg-[#0f1d33] text-white border border-[#f5d77f]/30'
              }`}
            >
              <span>Continue Auction</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
