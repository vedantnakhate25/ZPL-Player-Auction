import React from 'react';
import { ZPLAuctionStageEmblem } from './ZPLAuctionStageEmblem';
import { Shield, Sparkles } from 'lucide-react';
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
  const activeAuction =
    auctions.find((a) => a.status === 'live') ||
    auctions.find((a) => a.status === 'paused') ||
    auctions[0];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#f5d77f]/30 bg-gradient-to-b from-[#0a1526] via-[#08101e] to-[#050a12] text-white shadow-2xl shadow-[#040811]/90">
      {/* 1. BROADCAST LIGHTING & LUXURY NAVY-GOLD ATMOSPHERE */}
      <div className="absolute inset-0 bg-radial from-[#12243d]/70 via-[#0a1526]/90 to-[#040811] pointer-events-none" />

      {/* Top Ambient Gold & Royal Navy Spotlights */}
      <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-gradient-to-b from-[#f5d77f]/15 via-[#d4af37]/10 to-transparent blur-3xl pointer-events-none transform -rotate-12" />
      <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-gradient-to-b from-[#38bdf8]/15 via-[#f5d77f]/10 to-transparent blur-3xl pointer-events-none transform rotate-12" />
      
      {/* Subtle bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#050a12] via-[#050a12]/80 to-transparent z-10 pointer-events-none" />

      {/* TOP HEADER STRIP */}
      <div className="relative z-20 px-4 sm:px-8 pt-5 sm:pt-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#f5d77f]/15">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#081220] border-2 border-[#f5d77f]/60 p-0.5 flex items-center justify-center shadow-lg ring-2 ring-[#f5d77f]/20 shrink-0 overflow-hidden">
            <img
              src="/assets/aistudio/file_00000000661882118ee895643705c2c1_2d4830dd.png"
              alt="ZPL Official Tournament Crest"
              className="w-full h-full object-contain filter contrast-105"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f5d77f] animate-pulse shadow-[0_0_8px_#f5d77f]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#f5d77f]">
                Official Cricket Auction Broadcast
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
              ZHEP PREMIER LEAGUE &bull; ZPL
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateAdmin}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d1c31] hover:bg-[#132948] border border-[#f5d77f]/40 hover:border-[#f5d77f] text-xs font-bold text-[#f5d77f] hover:text-[#fff6c7] transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Shield className="w-3.5 h-3.5 text-[#f5d77f]" />
            <span>Admin Desk</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN STAGE PODIUM VIEW */}
      <div className="relative px-4 sm:px-8 pt-6 pb-12 sm:pb-16 flex flex-col items-center justify-center text-center">
        {/* The Grand Glowing ZPL Crest Emblem */}
        <div
          onClick={() => activeAuction && onSelectAuction && onSelectAuction(activeAuction.id)}
          className={`relative my-2 sm:my-3 transition-transform duration-500 hover:scale-[1.02] ${
            activeAuction ? 'cursor-pointer active:scale-98' : ''
          }`}
        >
          <ZPLAuctionStageEmblem size={480} />
        </div>

        {/* 3. BROADCAST LOWER-THIRD TITLE */}
        <div className="relative z-20 mt-3 max-w-3xl w-full px-2 space-y-3.5">
          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#081220]/95 border border-[#f5d77f]/40 text-[#f5d77f] text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#f5d77f]" />
            <span>ZHEP PREMIER LEAGUE &bull; OFFICIAL AUCTION</span>
          </div>

          {/* Main Title */}
          <h2
            onClick={() => activeAuction && onSelectAuction && onSelectAuction(activeAuction.id)}
            className={`text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#fff4c2] to-[#f5d77f] tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] leading-tight pb-1 ${
              activeAuction ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
            }`}
          >
            ZPL 2027 Player Auction
          </h2>
          <p className="text-xs sm:text-sm text-[#c5d3e8] font-medium max-w-lg mx-auto">
            Experience real-time live franchise bidding, purse updates, and player squad acquisitions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ZPLAuctionStageHero;
