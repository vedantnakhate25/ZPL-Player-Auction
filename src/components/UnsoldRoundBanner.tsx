import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { AuctionState } from '../types/auction';
import { Gavel, RotateCcw, Clock } from 'lucide-react';

interface UnsoldRoundBannerProps {
  auctionState?: AuctionState | null;
}

const BANNER_DURATION_MS = 20000;

function UnsoldRoundBannerComponent({ auctionState }: UnsoldRoundBannerProps) {
  const startedAt = auctionState?.unsoldRoundStartedAt || null;
  const bannerUntil = auctionState?.unsoldRoundBannerUntil || null;
  const isUnsoldRound = auctionState?.round === 'unsold' && auctionState?.status === 'live';

  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(0);

  useEffect(() => {
    if (!isUnsoldRound || !startedAt || startedAt === dismissedKey) {
      setRemainingMs(0);
      return;
    }

    const computeRemaining = (): number => {
      if (bannerUntil) {
        const untilTime = Date.parse(bannerUntil);
        if (!Number.isNaN(untilTime)) {
          const diff = untilTime - Date.now();
          // Guard against minor client/server clock skew while never exceeding 20s
          if (diff > 0) return Math.min(diff, BANNER_DURATION_MS);
          return 0;
        }
      }
      const startTime = Date.parse(startedAt);
      if (!Number.isNaN(startTime)) {
        const elapsed = Date.now() - startTime;
        return Math.max(0, Math.min(BANNER_DURATION_MS - elapsed, BANNER_DURATION_MS));
      }
      return BANNER_DURATION_MS;
    };

    const initialRemaining = computeRemaining();
    if (initialRemaining <= 0) {
      setRemainingMs(0);
      setDismissedKey(startedAt);
      return;
    }

    setRemainingMs(initialRemaining);

    const endTimestamp = Date.now() + initialRemaining;

    const interval = window.setInterval(() => {
      const left = Math.max(0, endTimestamp - Date.now());
      setRemainingMs(left);
      if (left <= 0) {
        window.clearInterval(interval);
        setDismissedKey(startedAt);
      }
    }, 200);

    return () => window.clearInterval(interval);
  }, [isUnsoldRound, startedAt, bannerUntil, dismissedKey]);

  const isVisible = Boolean(
    isUnsoldRound && startedAt && startedAt !== dismissedKey && remainingMs > 0
  );

  if (!isVisible) return null;

  const secondsLeft = Math.max(1, Math.ceil(remainingMs / 1000));
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / BANNER_DURATION_MS) * 100));
  const playerCount = auctionState?.unsoldRoundPlayerCount;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Unsold Player Round Starts"
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-[#040811]/95 select-none"
      >
        <motion.div
          key={startedAt}
          initial={{ opacity: 0, scale: 0.92, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl mx-auto rounded-3xl bg-gradient-to-b from-[#102342] via-[#0a1526] to-[#060c16] border-2 border-[#f5d77f] p-6 sm:p-10 md:p-12 text-center shadow-[0_28px_90px_rgba(0,0,0,0.85)] overflow-hidden"
        >
          {/* Top Gold Highlight Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#f5d77f] to-transparent" />

          {/* Official ZPL Crest */}
          <div className="flex flex-col items-center space-y-5 sm:space-y-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#060c16] border-2 border-[#f5d77f] p-1.5 flex items-center justify-center shadow-xl">
              <img
                src="/assets/aistudio/file_00000000661882118ee895643705c2c1_2d4830dd.png"
                alt="ZPL Official Crest"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f5d77f]/15 border border-[#f5d77f]/60 text-[#f5d77f] text-xs sm:text-sm font-black uppercase tracking-[0.2em]">
              <RotateCcw className="w-4 h-4 text-[#f5d77f]" />
              <span>{auctionState?.auctionName || 'ZPL AUCTION'} &middot; RECALL ROUND</span>
            </div>

            {/* BIG HEADLINE MESSAGE */}
            <div className="space-y-2.5 sm:space-y-3">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[1.08] bg-gradient-to-b from-white via-[#fff4c2] to-[#e0bc50] bg-clip-text text-transparent text-balance">
                Unsold Player Round Starts
              </h2>
              <p className="text-sm sm:text-lg text-[#c5d3e8] font-semibold max-w-xl mx-auto">
                {playerCount && playerCount > 0
                  ? `${playerCount} unsold ${playerCount === 1 ? 'player is' : 'players are'} returning to the auction stage for bidding.`
                  : 'Unsold players are returning to the auction stage for a fresh round of bidding.'}
              </p>
            </div>

            {/* COUNTDOWN PLAQUE */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#060c16] border border-[#f5d77f]/55 shadow-lg">
              <Gavel className="w-5 h-5 sm:w-6 sm:h-6 text-[#f5d77f]" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#a1b3cb]">
                First Unsold Player On Stage In
              </span>
              <span className="inline-flex items-center gap-1 text-xl sm:text-2xl font-black text-[#fff4c2] tabular-nums">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#f5d77f]" />
                {secondsLeft}s
              </span>
            </div>
          </div>

          {/* 20-Second Progress Bar */}
          <div className="absolute bottom-0 inset-x-0 h-2 bg-[#060c16]">
            <div
              className="h-full bg-gradient-to-r from-[#d4af37] via-[#f5d77f] to-[#fff4c2] transition-[width] duration-200 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export const UnsoldRoundBanner = React.memo(UnsoldRoundBannerComponent);
export default UnsoldRoundBanner;
