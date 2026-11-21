import React, { memo } from 'react';

interface ZPLAuctionStageEmblemProps {
  className?: string;
  size?: number;
}

export const ZPLAuctionStageEmblem = memo(function ZPLAuctionStageEmblem({
  className = '',
  size = 440,
}: ZPLAuctionStageEmblemProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none group ${className}`}
      style={{ maxWidth: size, width: '100%' }}
    >
      {/* Zero-lag CSS radial aura (replaces heavy GPU blur-2xl layers) */}
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-full pointer-events-none opacity-80"
        style={{
          background:
            'radial-gradient(circle, rgba(245,215,127,0.18) 0%, rgba(16,38,70,0.22) 48%, rgba(6,12,22,0) 72%)'
        }}
      />

      {/* Official ZPL Auction Championship Crest */}
      <div className="relative z-10 w-full aspect-square rounded-full overflow-hidden p-1 flex items-center justify-center shadow-[0_18px_44px_rgba(4,9,18,0.85)] ring-1 ring-[#f5d77f]/35">
        <img
          src="/assets/aistudio/file_00000000661882118ee895643705c2c1_2d4830dd.png"
          alt="ZPL Auction Official Championship Crest"
          className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
});

export default ZPLAuctionStageEmblem;
