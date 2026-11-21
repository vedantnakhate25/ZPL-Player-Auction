import React from 'react';
import { ZPLAuctionStageEmblem } from './ZPLAuctionStageEmblem';
import { Shield, ArrowRight } from 'lucide-react';
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
    <section
      className="relative w-full rounded-3xl overflow-hidden border border-[#f5d77f]/30 text-white shadow-2xl"
      style={{
        background:
          'radial-gradient(ellipse 80% 55% at 50% 28%, rgba(22,47,84,0.75) 0%, rgba(10,21,38,0.96) 58%, #060c16 100%)'
      }}
    >
      {/* CLEAN TOP BAR */}
      <div className="relative z-20 px-5 sm:px-8 py-4 flex items-center justify-between gap-4 border-b border-[#f5d77f]/15">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#060c16] border border-[#f5d77f]/55 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/assets/aistudio/file_00000000661882118ee895643705c2c1_2d4830dd.png"
              alt="ZPL Official Crest"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-sm sm:text-base font-black text-white tracking-wider uppercase truncate">
            Zhep Premier League
          </span>
        </div>

        <button
          onClick={onNavigateAdmin}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d1c31] hover:bg-[#142b4d] border border-[#f5d77f]/40 text-xs font-bold text-[#f5d77f] hover:text-[#fff6c7] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Shield className="w-3.5 h-3.5 text-[#f5d77f]" />
          <span>Admin Desk</span>
        </button>
      </div>

      {/* MAIN STAGE CENTERPIECE */}
      <div className="relative px-5 sm:px-8 pt-6 pb-10 sm:pb-12 flex flex-col items-center justify-center text-center">
        <div
          onClick={() => activeAuction && onSelectAuction && onSelectAuction(activeAuction.id)}
          className={`relative my-2 ${activeAuction ? 'cursor-pointer' : ''}`}
        >
          <ZPLAuctionStageEmblem size={380} />
        </div>

        <div className="relative z-20 mt-4 max-w-2xl w-full space-y-3">
          <h1
            onClick={() => activeAuction && onSelectAuction && onSelectAuction(activeAuction.id)}
            className={`text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#fff4c2] to-[#f5d77f] tracking-tight leading-tight text-balance ${
              activeAuction ? 'cursor-pointer' : ''
            }`}
          >
            ZPL 2027 Player Auction
          </h1>
          <p className="text-xs sm:text-sm text-[#c5d3e8] font-medium max-w-md mx-auto">
            Live real-time franchise bidding, instant purse tracking, and official squad rosters.
          </p>

          {activeAuction && onSelectAuction && (
            <div className="pt-2">
              <button
                onClick={() => onSelectAuction(activeAuction.id)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#fff4c2] via-[#f5d77f] to-[#e0bc50] hover:from-white hover:to-[#f5d77f] text-[#060c16] font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <span>
                  {activeAuction.status === 'live' ? 'Watch Live Auction' : 'Open Auction Stage'}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ZPLAuctionStageHero;
