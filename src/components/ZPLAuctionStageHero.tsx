import React from 'react';
import { ZPLAuctionStageEmblem } from './ZPLAuctionStageEmblem';
import { Radio, Shield, Sparkles, Trophy } from 'lucide-react';
import type { Auction } from '../types/auction';

interface ZPLAuctionStageHeroProps {
  auctions: Auction[];
  onSelectAuction?: (auctionId: string) => void;
  onNavigateAdmin: () => void;
}

export function ZPLAuctionStageHero({
  auctions,
  onSelectAuction,
  onNavigateAdmin,
}: ZPLAuctionStageHeroProps) {
  const liveAuction = auctions.find((a) => a.status === 'live');

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-amber-500/40 bg-black text-white shadow-2xl shadow-black/90">
      {/* 1. STAGE BROADCAST LIGHTING & ATMOSPHERE */}
      {/* Top Spotlights */}
      <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-gradient-to-b from-amber-400/20 via-amber-500/5 to-transparent blur-3xl pointer-events-none transform -rotate-12" />
      <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-gradient-to-b from-amber-400/20 via-amber-500/5 to-transparent blur-3xl pointer-events-none transform rotate-12" />
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/90 to-transparent z-10 pointer-events-none" />

      {/* TOP HEADER STRIP */}
      <div className="relative z-20 px-4 sm:px-8 pt-5 sm:pt-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-950 border border-amber-500/40 text-amber-400 shadow-md">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                Official Cricket Auction Broadcast
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
              ZHEP PREMIER LEAGUE &bull; ZPL
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {liveAuction && (
            <button
              onClick={() => onSelectAuction && onSelectAuction(liveAuction.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider animate-pulse shadow-md transition-all cursor-pointer"
              title="Click to view live auction"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Auction Live Now</span>
            </button>
          )}
          <button
            onClick={onNavigateAdmin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors shadow-xs cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Desk</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN STAGE PODIUM VIEW */}
      <div className="relative px-4 sm:px-8 pt-8 pb-12 sm:pb-16 flex flex-col items-center justify-center text-center">
        {/* The Grand Glowing ZPL Emblem */}
        <div className="relative my-2 sm:my-4 transition-transform duration-500 hover:scale-102">
          <ZPLAuctionStageEmblem size={480} />
        </div>

        {/* 3. BROADCAST LOWER-THIRD TITLE (MATCHING USER REFERENCE IMAGE) */}
        <div className="relative z-20 mt-4 max-w-3xl w-full px-2 space-y-4">
          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-950/90 border border-amber-500/40 text-amber-400 text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ZHEP PREMIER LEAGUE &bull; OFFICIAL AUCTION</span>
          </div>

          {/* Main Title */}
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] leading-tight pb-2">
            ZPL 2027 Player Auction
          </h2>
        </div>
      </div>
    </div>
  );
}
