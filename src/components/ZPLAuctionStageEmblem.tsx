import React, { memo } from 'react';

interface ZPLAuctionStageEmblemProps {
  className?: string;
  size?: number;
}

export const ZPLAuctionStageEmblem = memo(function ZPLAuctionStageEmblem({
  className = '',
  size = 520,
}: ZPLAuctionStageEmblemProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none group ${className}`}
      style={{ maxWidth: size, width: '100%' }}
    >
      {/* Ambient luxury light gold & midnight navy radial aura */}
      <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#0a2540]/60 via-[#f5d77f]/20 to-[#d4af37]/15 blur-2xl pointer-events-none group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 rounded-full bg-radial from-[#f5d77f]/10 via-[#0a1b2e]/40 to-transparent blur-xl pointer-events-none" />

      {/* Official ZPL Auction Championship Crest Image */}
      <div className="relative z-10 w-full aspect-square rounded-full overflow-hidden p-1 flex items-center justify-center shadow-[0_20px_50px_rgba(4,9,18,0.9)] ring-1 ring-[#f5d77f]/30">
        <img
          src="/assets/aistudio/file_00000000661882118ee895643705c2c1_2d4830dd.png"
          alt="ZPL Auction Official Championship Crest"
          className="w-full h-full object-contain filter contrast-[1.03] brightness-[1.02] drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] group-hover:scale-[1.02] transition-transform duration-500"
          loading="eager"
        />
      </div>
    </div>
  );
});

export default ZPLAuctionStageEmblem;
