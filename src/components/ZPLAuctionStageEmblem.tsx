import React from 'react';

interface ZPLAuctionStageEmblemProps {
  className?: string;
  size?: number;
}

export function ZPLAuctionStageEmblem({ className = '', size = 520 }: ZPLAuctionStageEmblemProps) {
  // 16 radial angles for the golden gavels surrounding the octagon
  const gavelAngles = Array.from({ length: 16 }, (_, i) => i * 22.5);

  // Bead points for the outer perimeter halo
  const beadCount = 64;
  const beadAngles = Array.from({ length: beadCount }, (_, i) => (i * 360) / beadCount);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Ambient background glow behind the emblem */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-transparent blur-3xl pointer-events-none scale-110" />

      <svg
        viewBox="0 0 600 600"
        width={size}
        height={size}
        className="w-full max-w-[540px] h-auto drop-shadow-[0_0_35px_rgba(245,158,11,0.35)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Metallic Gold Gradients */}
          <linearGradient id="goldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="75%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          <linearGradient id="goldGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="30%" stopColor="#fbbf24" />
            <stop offset="60%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>

          <linearGradient id="goldRim" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="35%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Radial Gold Flare */}
          <radialGradient id="centerPlateGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1f1807" />
            <stop offset="70%" stopColor="#0d0b05" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>

          {/* Radiant ZPL Highlight Gradients */}
          <linearGradient id="zplGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="15%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#fbbf24" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="90%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          <radialGradient id="zplAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
            <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#d97706" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <filter id="intenseGoldGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="16" result="blur2" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.98   0 1 0 0 0.75   0 0 1 0 0.15   0 0 0 1.2 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glow Filters */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="goldShine" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.96   0 1 0 0 0.7   0 0 1 0 0.1   0 0 0 1 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. OUTER CIRCLE BEAD RING (STADIUM BULBS / LIGHTS) */}
        <g opacity="0.85">
          {beadAngles.map((ang, i) => {
            const rad = (ang * Math.PI) / 180;
            const r = 282;
            const cx = 300 + r * Math.cos(rad);
            const cy = 300 + r * Math.sin(rad);
            const isMajor = i % 4 === 0;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={isMajor ? 3.5 : 2}
                fill={isMajor ? '#fef08a' : '#f59e0b'}
                className={isMajor ? 'animate-pulse' : ''}
              />
            );
          })}
        </g>

        {/* 2. OUTER OCTAGON RIM (POLYGON) */}
        {/* Points for an octagon centered at (300, 300) with radius 268 */}
        <polygon
          points="
            380,38 485,82 562,187 562,313 485,418 380,462 220,462 115,418 38,313 38,187 115,82 220,38
          "
          transform="translate(300, 300) scale(0.96) translate(-300, -250)"
          fill="none"
          stroke="url(#goldGrad1)"
          strokeWidth="6"
          strokeLinejoin="round"
          filter="url(#softGlow)"
        />

        {/* Outer decorative octagonal groove */}
        <polygon
          points="
            380,38 485,82 562,187 562,313 485,418 380,462 220,462 115,418 38,313 38,187 115,82 220,38
          "
          transform="translate(300, 300) scale(0.93) translate(-300, -250)"
          fill="none"
          stroke="url(#goldGrad2)"
          strokeWidth="2"
          strokeDasharray="8 6"
        />

        {/* 3. 16 RADIAL GOLDEN AUCTION GAVELS (HAMMERS) */}
        <g id="gavels-group">
          {gavelAngles.map((angle) => (
            <g key={angle} transform={`rotate(${angle} 300 300)`}>
              {/* Outer Gavel Head (Hammer) */}
              <g transform="translate(300, 52)">
                {/* Gavel Hammer Head */}
                <rect
                  x="-14"
                  y="-8"
                  width="28"
                  height="16"
                  rx="3"
                  fill="url(#goldGrad1)"
                  stroke="#78350f"
                  strokeWidth="1"
                />
                {/* Metallic Highlights on Hammer Bevels */}
                <rect x="-13" y="-7" width="4" height="14" rx="1" fill="#fef08a" />
                <rect x="9" y="-7" width="4" height="14" rx="1" fill="#fef08a" />
                <rect x="-6" y="-7" width="12" height="2" fill="#fffbeb" opacity="0.8" />

                {/* Gavel Handle Shaft */}
                <path
                  d="M -3 8 L -3 36 L -5 38 L -5 44 L -2 46 L -2 74 L 2 74 L 2 46 L 5 44 L 5 38 L 3 36 L 3 8 Z"
                  fill="url(#goldGrad2)"
                  stroke="#78350f"
                  strokeWidth="0.8"
                />

                {/* Ornate diamond / joint ring */}
                <polygon
                  points="0,48 5,55 0,62 -5,55"
                  fill="url(#goldRim)"
                  stroke="#92400e"
                  strokeWidth="0.6"
                />
              </g>

              {/* Inner Inward Accent Spike / Dot */}
              <circle cx="300" cy="158" r="2.5" fill="#fef08a" />
            </g>
          ))}
        </g>

        {/* 4. INNER BEVELED OCTAGON PLATE */}
        <g id="inner-octagon">
          {/* Main Octagon Body */}
          <polygon
            points="
              245,170 355,170 430,245 430,355 355,430 245,430 170,355 170,245
            "
            fill="url(#centerPlateGlow)"
            stroke="url(#goldGrad1)"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Inner Inset Octagon Border */}
          <polygon
            points="
              249,176 351,176 424,249 424,351 351,424 249,424 176,351 176,249
            "
            fill="none"
            stroke="url(#goldGrad2)"
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />

          {/* Corner gold studs */}
          {[
            [245, 170],
            [355, 170],
            [430, 245],
            [430, 355],
            [355, 430],
            [245, 430],
            [170, 355],
            [170, 245],
          ].map(([x, y], idx) => (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="3.5"
              fill="url(#goldRim)"
              stroke="#78350f"
              strokeWidth="0.8"
            />
          ))}
        </g>

        {/* 5. CENTER EMBLEM: HIGHLIGHTED ZPL / ZHEP PREMIER LEAGUE */}
        <g id="zpl-center-crest">
          {/* Center: RADIANT HIGHLIGHTED ZPL */}
          <g id="zpl-highlight-block">
            {/* Ambient Warm Golden Aura Spotlight */}
            <ellipse cx="300" cy="275" rx="105" ry="42" fill="url(#zplAura)" />

            {/* Radiant Glow Layer */}
            <text
              x="300"
              y="292"
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="68"
              fontWeight="950"
              letterSpacing="4"
              fontFamily="Impact, Arial Black, sans-serif"
              filter="url(#intenseGoldGlow)"
              opacity="0.95"
            >
              ZPL
            </text>

            {/* Deep 3D Extrusion Layer */}
            <text
              x="300"
              y="296"
              textAnchor="middle"
              fill="#3b1d06"
              stroke="#291404"
              strokeWidth="6"
              fontSize="68"
              fontWeight="950"
              letterSpacing="4"
              fontFamily="Impact, Arial Black, sans-serif"
            >
              ZPL
            </text>

            {/* Crisp Metallic Gold Face */}
            <text
              x="300"
              y="292"
              textAnchor="middle"
              fill="url(#zplGrad)"
              stroke="#78350f"
              strokeWidth="1.8"
              fontSize="68"
              fontWeight="950"
              letterSpacing="4"
              fontFamily="Impact, Arial Black, sans-serif"
              filter="url(#goldShine)"
            >
              ZPL
            </text>

            {/* Top Specular Rim Shine */}
            <text
              x="300"
              y="291"
              textAnchor="middle"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeOpacity="0.85"
              fontSize="68"
              fontWeight="950"
              letterSpacing="4"
              fontFamily="Impact, Arial Black, sans-serif"
            >
              ZPL
            </text>
          </g>

          {/* Bottom Line: Zhep Premier League */}
          <g id="crest-subtitle">
            <text
              x="300"
              y="327"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="13"
              fontWeight="800"
              letterSpacing="3"
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            >
              Zhep Premier League
            </text>

            {/* Subtle Gold Accent Underline */}
            <line
              x1="215"
              y1="337"
              x2="385"
              y2="337"
              stroke="url(#goldGrad1)"
              strokeWidth="1.2"
              strokeOpacity="0.85"
            />
          </g>
        </g>

        {/* 6. ORNATE GOLDEN AUCTION BANNER CARTOUCHE */}
        <g id="auction-banner" transform="translate(190, 360)">
          {/* Banner Shadow */}
          <path
            d="M 12 18 L 208 18 L 220 38 L 208 58 L 12 58 L 0 38 Z"
            fill="#000000"
            opacity="0.6"
          />

          {/* Banner Plate with Beveled Ends */}
          <path
            d="M 15 15 L 205 15 L 218 35 L 205 55 L 15 55 L 2 35 Z"
            fill="url(#goldGrad1)"
            stroke="#78350f"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Inner Inset Plaque */}
          <path
            d="M 22 20 L 198 20 L 208 35 L 198 50 L 22 50 L 12 35 Z"
            fill="#090703"
            stroke="url(#goldGrad2)"
            strokeWidth="1"
          />

          {/* Left Mini Gavel Icon */}
          <g transform="translate(24, 30) scale(0.6)">
            <rect x="0" y="0" width="10" height="5" rx="1" fill="#fef08a" />
            <line x1="5" y1="5" x2="5" y2="15" stroke="#fef08a" strokeWidth="2" />
          </g>

          {/* "AUCTION" Lettering */}
          <text
            x="110"
            y="39"
            textAnchor="middle"
            fill="url(#goldRim)"
            fontSize="18"
            fontWeight="950"
            letterSpacing="5"
            fontFamily="Arial Black, Impact, sans-serif"
            filter="url(#softGlow)"
          >
            AUCTION
          </text>

          {/* Right Mini Gavel Icon */}
          <g transform="translate(190, 30) scale(0.6) scale(-1, 1)">
            <rect x="0" y="0" width="10" height="5" rx="1" fill="#fef08a" />
            <line x1="5" y1="5" x2="5" y2="15" stroke="#fef08a" strokeWidth="2" />
          </g>
        </g>
      </svg>
    </div>
  );
}
