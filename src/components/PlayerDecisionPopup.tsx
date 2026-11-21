import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { AuctionState, Team } from '../types/auction';
import { Trophy, Check, X, Shield, Zap } from 'lucide-react';

interface PlayerDecisionPopupProps {
  auctionState?: AuctionState | null;
  teams: Team[];
  onClose?: () => void;
}

const AUTO_DISMISS_MS = 7000;

function PlayerDecisionPopupComponent({
  auctionState,
  teams,
  onClose
}: PlayerDecisionPopupProps) {
  const [photoError, setPhotoError] = useState(false);
  const [teamLogoError, setTeamLogoError] = useState(false);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const status = auctionState?.playerStatus;
  const isSold = status === 'sold';
  const isUnsold = status === 'unsold';

  // Unique key per sold/unsold decision event
  const currentEventKey =
    auctionState && (isSold || isUnsold)
      ? `${status}_${auctionState.currentPlayerId || auctionState.lastSoldPlayerName || auctionState.lastUnsoldPlayerName || 'player'}_${auctionState.updatedAt || ''}`
      : null;

  // Reset image fallbacks whenever a new decision arrives
  useEffect(() => {
    setPhotoError(false);
    setTeamLogoError(false);
  }, [currentEventKey]);

  const isVisible = Boolean(
    (isSold || isUnsold) &&
    currentEventKey &&
    currentEventKey !== dismissedKey
  );

  // Strictly auto-dismiss after 7 seconds with no manual Continue button
  useEffect(() => {
    if (!isVisible || !currentEventKey) return;
    const timer = window.setTimeout(() => {
      setDismissedKey(currentEventKey);
      onCloseRef.current?.();
    }, AUTO_DISMISS_MS);

    return () => window.clearTimeout(timer);
  }, [isVisible, currentEventKey]);

  if (!isVisible) return null;

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

  const points = isSold
    ? (auctionState?.currentBidPoints || auctionState?.lastSoldPoints || 0)
    : (auctionState?.currentPlayerBasePoints || auctionState?.lastUnsoldBasePoints || 50);

  const winningTeamId = auctionState?.winningTeamId;
  const winningTeamName =
    auctionState?.winningTeamName ||
    auctionState?.lastSoldTeamName ||
    'Winning Franchise';

  const matchedTeam = teams.find(
    (t) =>
      (winningTeamId && t.id === winningTeamId) ||
      (t.name &&
        winningTeamName &&
        t.name.toLowerCase().trim() === winningTeamName.toLowerCase().trim())
  );

  const teamLogo =
    matchedTeam?.logoUrl ||
    auctionState?.winningTeamLogo ||
    auctionState?.lastSoldTeamLogo ||
    '';

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isSold ? `${playerName} Sold` : `${playerName} Unsold`}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#040811]/90 select-none"
      >
        <motion.div
          key={currentEventKey}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-3xl mx-auto rounded-3xl bg-gradient-to-b from-[#0e1e36] via-[#0a1526] to-[#060c16] p-5 sm:p-8 shadow-2xl border-2 overflow-hidden ${
            isSold
              ? 'border-[#f5d77f] shadow-[0_24px_70px_rgba(0,0,0,0.75)]'
              : 'border-rose-500 shadow-[0_24px_70px_rgba(0,0,0,0.75)]'
          }`}
        >
          {/* Top Accent Line */}
          <div
            className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent ${
              isSold ? 'via-[#f5d77f]' : 'via-rose-500'
            } to-transparent`}
          />

          {/* HEADER */}
          <div className="flex flex-col items-center justify-center text-center space-y-2.5 mb-5 sm:mb-6">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#fff4c2]/75">
              {auctionState?.auctionName || 'ZPL AUCTION'}
            </span>

            {isSold ? (
              <div className="inline-flex items-center gap-2 px-7 sm:px-10 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#fff4c2] via-[#f5d77f] to-[#e0bc50] text-[#060c16] shadow-lg border border-[#fff4c2]">
                <Check className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3.5]" />
                <span className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
                  SOLD
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-7 sm:px-10 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 text-white shadow-lg">
                <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3.5]" />
                <span className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
                  UNSOLD
                </span>
              </div>
            )}
          </div>

          {/* BODY */}
          {isSold ? (
            <div className="space-y-5">
              {/* Two Perfectly Aligned Equal-Height Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 items-stretch">
                {/* 1. ACQUIRED PLAYER CARD */}
                <div className="rounded-2xl bg-[#07101f] border border-[#f5d77f]/35 p-5 flex flex-col items-center justify-between text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f5d77f] inline-flex items-center gap-1.5 mb-4">
                    <Trophy className="w-3.5 h-3.5 text-[#f5d77f]" />
                    Acquired Player
                  </span>

                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl p-[2.5px] bg-gradient-to-tr from-[#d4af37] via-[#fff4c2] to-[#f5d77f] shadow-xl shrink-0">
                    <div className="w-full h-full rounded-[14px] bg-[#060c16] overflow-hidden flex items-center justify-center">
                      {playerPhoto && !photoError ? (
                        <img
                          src={playerPhoto}
                          alt={playerName}
                          referrerPolicy="no-referrer"
                          onError={() => setPhotoError(true)}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#060c16] text-[#f5d77f]/70 p-2">
                          <Trophy className="w-12 h-12 text-[#f5d77f] mb-1" />
                          <span className="text-[10px] font-black uppercase text-[#fff4c2]">
                            ZPL Player
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 w-full space-y-1">
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide leading-tight text-balance break-words">
                      {playerName}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#f5d77f]">
                      {playerRole}
                    </p>
                  </div>
                </div>

                {/* 2. WINNING FRANCHISE CARD */}
                <div className="rounded-2xl bg-[#07101f] border border-[#f5d77f]/35 p-5 flex flex-col items-center justify-between text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f5d77f] inline-flex items-center gap-1.5 mb-4">
                    <Shield className="w-3.5 h-3.5 text-[#f5d77f]" />
                    Winning Franchise
                  </span>

                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl p-[2.5px] bg-gradient-to-tr from-[#c59f33] via-[#fff4c2] to-[#f5d77f] shadow-xl shrink-0">
                    <div className="w-full h-full rounded-[14px] bg-[#060c16] overflow-hidden flex items-center justify-center">
                      {teamLogo && !teamLogoError ? (
                        <img
                          src={teamLogo}
                          alt={winningTeamName}
                          referrerPolicy="no-referrer"
                          onError={() => setTeamLogoError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#060c16] text-[#f5d77f] p-2">
                          <Shield className="w-12 h-12 text-[#f5d77f] mb-1" />
                          <span className="text-xs font-black uppercase">
                            {winningTeamName.slice(0, 3)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 w-full space-y-1">
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide leading-tight text-balance break-words">
                      {winningTeamName}
                    </h3>
                    <p className="text-xs text-[#c5d3e8] font-semibold">
                      Official ZPL Franchise
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. FINAL SALE PRICE BAR */}
              <div className="w-full rounded-2xl bg-gradient-to-r from-[#0a1526] via-[#112442] to-[#0a1526] border border-[#f5d77f]/80 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#e0bc50] to-[#fff4c2] text-[#060c16] flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 fill-[#060c16]" />
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#f5d77f] block">
                      Final Purchase Bid
                    </span>
                    <span className="text-sm font-semibold text-white/90">
                      Awarded to <strong className="text-[#fff4c2] uppercase">{winningTeamName}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-center sm:text-right shrink-0">
                  <div className="text-3xl sm:text-4xl font-black text-[#fff4c2] tracking-tight tabular-nums">
                    <span className="text-[#f5d77f] mr-1">₹</span>
                    {points}{' '}
                    <span className="text-base sm:text-lg text-[#f5d77f] font-black uppercase">
                      PTS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="rounded-2xl bg-[#07101f] border border-rose-500/45 p-5 sm:p-6 flex flex-col items-center text-center">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl p-[2.5px] bg-gradient-to-tr from-rose-600 via-red-400 to-rose-500 shadow-xl shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-[#060c16] overflow-hidden flex items-center justify-center">
                    {playerPhoto && !photoError ? (
                      <img
                        src={playerPhoto}
                        alt={playerName}
                        referrerPolicy="no-referrer"
                        onError={() => setPhotoError(true)}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#060c16] text-white/50 p-2">
                        <Trophy className="w-12 h-12 text-white/50 mb-1" />
                        <span className="text-xs font-black uppercase text-white/80">
                          ZPL Player
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 w-full space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide leading-tight text-balance break-words">
                    {playerName}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-rose-300">
                    {playerRole} &middot; Base ₹ {points} PTS
                  </p>
                </div>
              </div>

              <p className="text-center text-xs sm:text-sm text-[#c5d3e8] font-medium px-2">
                No bids received during this round. Player moves to the Unsold Pool.
              </p>
            </div>
          )}

          {/* Smooth 7-Second GPU Auto-Dismiss Progress Bar */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-[#060c16]">
            <div
              className={`h-full w-full animate-decision-countdown ${
                isSold
                  ? 'bg-gradient-to-r from-[#d4af37] via-[#f5d77f] to-[#fff4c2]'
                  : 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-400'
              }`}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export const PlayerDecisionPopup = React.memo(PlayerDecisionPopupComponent);
export default PlayerDecisionPopup;
