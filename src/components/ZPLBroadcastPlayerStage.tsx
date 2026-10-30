import React, { useState, useMemo } from 'react';
import type { Auction, AuctionState, Team, Player } from '../types/auction';
import { Trophy, Shield, Target, Zap, Award, Sparkles, Check, X } from 'lucide-react';

interface ZPLBroadcastPlayerStageProps {
  auction: Auction;
  auctionState?: AuctionState | null;
  teams: Team[];
  players?: Player[];
  isProjectorMode?: boolean;
}

function ZPLBroadcastPlayerStageComponent({
  auction,
  auctionState,
  teams,
  players = [],
  isProjectorMode = false,
}: ZPLBroadcastPlayerStageProps) {
  const [photoError, setPhotoError] = useState(false);
  const [teamLogoError, setTeamLogoError] = useState(false);

  // Current player details
  const playerName = String(auctionState?.currentPlayerName || 'Player on Floor').toUpperCase();
  const playerRole = auctionState?.currentPlayerRole || 'All-Rounder';
  const playerPhoto = auctionState?.currentPlayerPhoto || '';
  const basePoints = auctionState?.currentPlayerBasePoints ?? 50;
  const currentBid = auctionState?.currentBidPoints ?? basePoints;
  const isBiddingActive = (auctionState?.currentBidPoints ?? 0) > basePoints;
  const isSold = auctionState?.playerStatus === 'sold';
  const isUnsold = auctionState?.playerStatus === 'unsold';

  // Current team holding the highest bid (memoized)
  const holdingTeam = useMemo(() => {
    if (!Array.isArray(teams)) return null;
    const winningName = typeof auctionState?.winningTeamName === 'string' ? auctionState.winningTeamName.toLowerCase().trim() : '';
    return teams.find(
      (t) => (t && t.id && auctionState?.winningTeamId && t.id === auctionState.winningTeamId) ||
             (winningName && t && typeof t.name === 'string' && t.name.toLowerCase().trim() === winningName)
    ) || (auctionState?.winningTeamName ? {
      id: auctionState.winningTeamId || 'bid-team',
      name: auctionState.winningTeamName,
      logoUrl: auctionState.winningTeamLogo || '',
      purse: 1000,
      remainingPurse: 1000,
      purchasedPlayerCount: 0,
      totalSpent: 0,
      auctionId: auction.id,
      createdAt: ''
    } as Team : null);
  }, [teams, auctionState?.winningTeamId, auctionState?.winningTeamName, auctionState?.winningTeamLogo, auction.id]);

  const holdingTeamLogo = holdingTeam?.logoUrl || auctionState?.winningTeamLogo || '';

  // Tournament / Auction Title
  const tournamentTitle = auction.name || 'ZPL AUCTION 2027';
  const organizationTitle = 'ZHEP KRIDA MANDAL';

  // Role icon helper
  const getRoleIcon = () => {
    switch (playerRole) {
      case 'Batsman':
        return <Shield className="w-3.5 h-3.5 text-amber-400" />;
      case 'Bowler':
        return <Target className="w-3.5 h-3.5 text-amber-300" />;
      case 'All-Rounder':
        return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Wicket-Keeper':
        return <Award className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div
      className={`relative w-full max-w-6xl mx-auto rounded-3xl bg-black border border-amber-500/40 shadow-2xl shadow-black overflow-hidden flex flex-col justify-between selection:bg-amber-400 selection:text-black ${
        isProjectorMode ? 'h-full flex-1 min-h-0' : ''
      }`}
    >
      {/* 1. TOP STEPPED GEOMETRIC ARENA ARCH (BIGGER & HIGH VISIBILITY) */}
      <div className={`relative w-full ${isProjectorMode ? 'pt-1.5 pb-1' : 'pt-3 sm:pt-5 pb-2'} px-3 sm:px-8 flex flex-col items-center shrink-0`}>
        <div className={`relative w-full max-w-5xl flex items-center justify-center ${isProjectorMode ? 'py-0.5' : 'py-1 sm:py-2'}`}>
          <svg
            className={`w-full h-auto ${isProjectorMode ? 'max-h-16 sm:max-h-20 md:max-h-24' : 'max-h-22 sm:max-h-28 md:max-h-32'}`}
            viewBox="0 0 1000 145"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Crisp Metallic Gold Gradient for Arch */}
              <linearGradient id="goldArchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="20%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="80%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>

              {/* Razor-Sharp Championship Gold Gradient for Text */}
              <linearGradient id="goldTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="22%" stopColor="#fffbeb" />
                <stop offset="50%" stopColor="#fde047" />
                <stop offset="78%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>

              {/* Crisp Drop Shadow Filter (sharp edge, no blurry halo) */}
              <filter id="crispHeaderShadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="2.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.95" />
              </filter>
            </defs>

            {/* Stepped Geometric Circuit Arch Path (Clean, Crisp & Sharp) */}
            <path
              d="M 20 128 L 80 128 L 80 82 L 140 82 L 140 14 L 860 14 L 860 82 L 920 82 L 920 128 L 980 128"
              stroke="url(#goldArchGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Corner Node Rivets (Crisp Dual-Tone Pins) */}
            <circle cx="140" cy="14" r="5" fill="#fef08a" stroke="#78350f" strokeWidth="2" />
            <circle cx="140" cy="14" r="2" fill="#ffffff" />
            <circle cx="860" cy="14" r="5" fill="#fef08a" stroke="#78350f" strokeWidth="2" />
            <circle cx="860" cy="14" r="2" fill="#ffffff" />

            <circle cx="140" cy="82" r="4.5" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
            <circle cx="860" cy="82" r="4.5" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
            <circle cx="80" cy="82" r="4.5" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
            <circle cx="920" cy="82" r="4.5" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
            <circle cx="80" cy="128" r="4" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
            <circle cx="920" cy="128" r="4" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
            <circle cx="20" cy="128" r="3.5" fill="#d97706" />
            <circle cx="980" cy="128" r="3.5" fill="#d97706" />

            {/* Main Tournament / League Title (Razor-Sharp, Bold & Crisp Contrast) */}
            <text
              x="500"
              y="74"
              textAnchor="middle"
              fill="url(#goldTextGrad)"
              stroke="#000000"
              strokeWidth="2"
              paintOrder="stroke fill"
              fontSize="54"
              fontWeight="900"
              letterSpacing="6"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Segoe UI', Roboto, 'Arial Black', sans-serif"
              filter="url(#crispHeaderShadow)"
            >
              {tournamentTitle}
            </text>

            {/* Organization Subtitle (Clean, Crisp & High Contrast) */}
            <text
              x="500"
              y="112"
              textAnchor="middle"
              fill="#fef08a"
              stroke="#000000"
              strokeWidth="1"
              paintOrder="stroke fill"
              fontSize="18"
              fontWeight="900"
              letterSpacing="7"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              {organizationTitle}
            </text>
          </svg>
        </div>
      </div>

      {/* 2. MAIN BROADCAST SCREEN ARENA */}
      <div className={`relative px-2 sm:px-4 md:px-6 ${isProjectorMode ? 'py-1 gap-1.5 flex-1 min-h-0 justify-between' : 'py-3 sm:py-4 gap-3 sm:gap-4'} flex flex-col w-full max-w-5xl mx-auto`}>
        
        {/* ======================================================== */}
        {/* TOP SECTION: PLAYER PROFILE BROADCAST CARD (BIG & PROMINENT) */}
        {/* ======================================================== */}
        <div className={`w-full ${isProjectorMode ? 'flex-[1.5] min-h-0 flex flex-col' : ''}`}>
          <div className={`relative w-full rounded-2xl bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black border-2 border-cyan-500/50 shadow-2xl overflow-hidden backdrop-blur-md ${isProjectorMode ? 'h-full flex flex-col justify-between' : ''}`}>
            
            {/* Top Header Bar */}
            <div className={`px-3 sm:px-4 ${isProjectorMode ? 'py-1 sm:py-1.5' : 'py-2 sm:py-2.5'} bg-gradient-to-r from-cyan-950 via-zinc-900 to-cyan-950 border-b border-cyan-500/40 flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-2">
                <div className={`${isProjectorMode ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]'} rounded-md bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-black shadow-xs`}>
                  ZPL
                </div>
                <div className="leading-tight">
                  <span className={`${isProjectorMode ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} font-black tracking-wider uppercase text-white block`}>
                    {tournamentTitle}
                  </span>
                  <span className={`${isProjectorMode ? 'text-[9px]' : 'text-[10px] sm:text-xs'} font-bold text-cyan-400 uppercase tracking-widest`}>
                    PLAYER PROFILE
                  </span>
                </div>
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-1.5">
                {auctionState?.status === 'paused' ? (
                  <span className={`${isProjectorMode ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-full bg-amber-400 text-black font-black uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-sm`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-black" />
                    PAUSED
                  </span>
                ) : isSold ? (
                  <span className={`${isProjectorMode ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-full bg-emerald-500 text-black font-black uppercase tracking-wider flex items-center gap-1 shadow-sm`}>
                    <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                    SOLD
                  </span>
                ) : isUnsold ? (
                  <span className={`${isProjectorMode ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-full bg-rose-600 text-white font-black uppercase tracking-wider flex items-center gap-1 shadow-sm`}>
                    <X className="w-3.5 h-3.5 stroke-[3.5]" />
                    UNSOLD
                  </span>
                ) : (
                  <span className={`${isProjectorMode ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-full bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    IN AUCTION
                  </span>
                )}
              </div>
            </div>

            {/* Main Player Body: Photo strictly on Left, ALL Details strictly on Right */}
            <div className={`p-3 sm:p-4 md:p-5 ${isProjectorMode ? 'py-2 gap-3 sm:gap-4 flex-1 min-h-0' : 'gap-3 sm:gap-5 md:gap-6'} flex flex-row items-center`}>
              
              {/* Photo on Left Side (Bigger, Prominent & Framed with Glowing Rivets) */}
              <div className="shrink-0 flex items-center justify-center">
                <div className={`relative ${
                  isProjectorMode
                    ? 'w-36 h-36 xs:w-40 xs:h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-60 lg:h-60 xl:w-64 xl:h-64'
                    : 'w-36 h-36 xs:w-44 xs:h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80'
                } rounded-2xl bg-gradient-to-b from-cyan-400 via-amber-400 to-cyan-500 p-[3px] shadow-2xl shadow-cyan-500/25`}>
                  <div className="w-full h-full rounded-[13px] bg-black overflow-hidden flex items-center justify-center">
                    {playerPhoto && !photoError ? (
                      <img
                        src={playerPhoto}
                        alt={playerName}
                        onError={() => setPhotoError(true)}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 p-2 text-center">
                        <Trophy className={`${isProjectorMode ? 'w-10 h-10' : 'w-14 h-14'} text-amber-400/60 mb-1`} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          ZPL CRICKET
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Crisp Corner Rivets (High-contrast, clean & sharp) */}
                  <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-cyan-400 border-2 border-black shadow-sm" />
                  <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-cyan-400 border-2 border-black shadow-sm" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 border-2 border-black shadow-sm" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 border-2 border-black shadow-sm" />
                </div>
              </div>

              {/* ALL Details on Right Side */}
              <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1.5 sm:space-y-2.5 text-left">
                {/* 1. Name & Role */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                    <h2 className={`${
                      isProjectorMode
                        ? 'text-lg sm:text-2xl md:text-3xl'
                        : 'text-xl sm:text-3xl md:text-4xl'
                    } font-black text-white uppercase tracking-tight break-words leading-none`}>
                      {playerName}
                    </h2>
                    <span className={`${
                      isProjectorMode
                        ? 'text-[10px] sm:text-xs px-2 py-0.5'
                        : 'text-xs sm:text-sm px-2.5 sm:px-3 py-1'
                    } font-black text-amber-300 uppercase tracking-wider inline-flex items-center gap-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 shrink-0`}>
                      {getRoleIcon()}
                      {playerRole}
                    </span>
                  </div>
                  
                  {/* Subtitle / Organization */}
                  <div className="flex items-center gap-1.5 mt-0.5 text-[9px] sm:text-xs text-cyan-300 font-bold uppercase tracking-wider">
                    <span>{organizationTitle}</span>
                    <span>&bull;</span>
                    <span className="text-zinc-300">
                      {auctionState?.round === 'unsold' ? 'Unsold Round' : 'Regular Pool'}
                    </span>
                  </div>
                </div>

                {/* 2. Broadcast Metrics Row (Base Price | Pool / Slot | Current/Final Price) */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 rounded-xl bg-zinc-950/95 border border-zinc-800 p-2 sm:p-2.5 text-center shadow-md">
                  <div className="border-r border-zinc-800/80 pr-1">
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                      Base Price
                    </span>
                    <span className={`${isProjectorMode ? 'text-xs sm:text-sm md:text-base' : 'text-sm sm:text-base md:text-lg lg:text-xl'} font-black text-white tracking-tight`}>
                      {basePoints} <span className="text-[9px] sm:text-xs text-zinc-400 font-bold">PTS</span>
                    </span>
                  </div>

                  <div className="border-r border-zinc-800/80 pr-1">
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                      Pool / Slot
                    </span>
                    <span className={`${isProjectorMode ? 'text-xs sm:text-sm md:text-base' : 'text-sm sm:text-base md:text-lg lg:text-xl'} font-black text-cyan-400 truncate block tracking-tight`}>
                      {auctionState?.round === 'unsold'
                        ? 'Unsold'
                        : auctionState?.currentPlayerSlotName ||
                          (auctionState?.currentPlayerSlotNumber ? `Slot ${auctionState.currentPlayerSlotNumber}` : 'Slot 1')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                      {isSold ? 'Final Price' : isBiddingActive ? 'Current Bid' : 'Starting Bid'}
                    </span>
                    <span className={`${
                      isProjectorMode ? 'text-xs sm:text-sm md:text-base' : 'text-sm sm:text-base md:text-lg lg:text-xl'
                    } font-black tracking-tight ${isSold ? 'text-emerald-400' : isUnsold ? 'text-rose-400' : 'text-amber-400'}`}>
                      ₹ {currentBid} <span className="text-[9px] sm:text-xs font-bold uppercase">PTS</span>
                    </span>
                  </div>
                </div>

                {/* 3. Live Sale / Bid Outcome Strip */}
                {isSold ? (
                  <div className="rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/25 to-emerald-500/15 border border-emerald-500/40 px-3 py-1.5 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Sold To: <strong className="text-white font-black">{holdingTeam?.name || 'Winning Franchise'}</strong>
                    </span>
                    <span className="text-xs sm:text-sm md:text-base font-black text-emerald-400 uppercase tracking-wide">
                      ₹ {currentBid} PTS
                    </span>
                  </div>
                ) : isUnsold ? (
                  <div className="rounded-xl bg-rose-500/15 border border-rose-500/40 px-3 py-1.5 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] sm:text-xs md:text-sm font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Status: Player Unsold
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase">
                      Unsold Pool
                    </span>
                  </div>
                ) : isBiddingActive ? (
                  <div className="rounded-xl bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] sm:text-xs md:text-sm font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5 truncate mr-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      Top Bidder: <strong className="text-white font-black truncate">{holdingTeam?.name || 'Holding Team'}</strong>
                    </span>
                    <span className="text-xs sm:text-sm md:text-base font-black text-amber-300 uppercase shrink-0">
                      ₹ {currentBid} PTS
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 px-3 py-1.5 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-wider">
                      Ready For Bidding
                    </span>
                    <span className="text-xs sm:text-sm font-black text-amber-400 uppercase">
                      Base: {basePoints} PTS
                    </span>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER STAGE CONNECTOR (SLEEK, CLEAN & PROPORTIONAL) */}
        {/* ======================================================== */}
        <div className={`w-full flex items-center justify-center relative shrink-0 ${isProjectorMode ? 'my-0' : 'my-0.5'}`}>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-amber-500/70" />
          <div className={`mx-2 sm:mx-3 flex items-center gap-1.5 ${isProjectorMode ? 'px-2 py-0.5 text-[8px]' : 'px-3 py-0.5 sm:py-1 text-[9px] sm:text-[11px]'} rounded-full bg-zinc-950 border border-amber-500/40 text-amber-300 font-black uppercase tracking-widest shadow-md shrink-0`}>
            <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
            <span>{isSold ? 'OFFICIAL ACQUISITION' : 'FRANCHISE ARENA'}</span>
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-amber-500/30 to-amber-500/70" />
        </div>

        {/* ======================================================== */}
        {/* BOTTOM SECTION: TEAM DETAILS (LITTLE SMALL & COMPACT) */}
        {/* ======================================================== */}
        <div className={`w-full ${isProjectorMode ? 'flex-[0.9] min-h-0 flex flex-col' : ''}`}>
          <div className={`relative w-full rounded-2xl bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black border-2 border-amber-500/40 shadow-xl overflow-hidden backdrop-blur-md ${isProjectorMode ? 'h-full flex flex-col justify-between' : ''}`}>
            
            {/* Top Header Bar (Slimmer) */}
            <div className={`px-3 sm:px-4 ${isProjectorMode ? 'py-0.5 sm:py-1' : 'py-1.5 sm:py-2'} bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/80 border-b border-amber-500/40 flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-2">
                <div className={`${isProjectorMode ? 'w-4 h-4 text-[8px]' : 'w-5 h-5 text-[9px]'} rounded-md bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-black shadow-xs`}>
                  ZPL
                </div>
                <div className="leading-tight">
                  <span className={`${isProjectorMode ? 'text-[10px]' : 'text-[11px] sm:text-xs'} font-black tracking-wider uppercase text-white block`}>
                    {tournamentTitle}
                  </span>
                  <span className={`${isProjectorMode ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'} font-bold text-amber-400 uppercase tracking-widest`}>
                    {isSold ? 'WINNING TEAM' : 'CURRENT HIGHEST BIDDER'}
                  </span>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-1.5">
                {isSold ? (
                  <span className={`${isProjectorMode ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px] sm:text-xs'} rounded-full bg-emerald-500 text-black font-black uppercase tracking-wider flex items-center gap-1 shadow-sm`}>
                    <Check className="w-3 h-3 stroke-[3.5]" />
                    ACQUIRED
                  </span>
                ) : isBiddingActive ? (
                  <span className={`${isProjectorMode ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px] sm:text-xs'} rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-300 font-black uppercase tracking-wider flex items-center gap-1 animate-pulse shadow-sm`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    HOLDING BID
                  </span>
                ) : (
                  <span className={`${isProjectorMode ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px] sm:text-xs'} rounded-full bg-zinc-800 text-zinc-400 font-bold uppercase tracking-wider`}>
                    WAITING FOR BID
                  </span>
                )}
              </div>
            </div>

            {/* Main Content: Photo strictly on Left, ALL Details strictly on Right (Compact & Balanced) */}
            {holdingTeam ? (
              <div className={`p-2.5 sm:p-3 md:p-3.5 ${isProjectorMode ? 'py-1.5 gap-2.5 sm:gap-3 flex-1 min-h-0' : 'gap-3 sm:gap-4'} flex flex-row items-center`}>
                
                {/* Team Logo on Left Side (Smaller, Compact & Framed) */}
                <div className="shrink-0 flex items-center justify-center">
                  <div className={`relative ${
                    isProjectorMode
                      ? 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20'
                      : 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24'
                  } rounded-2xl p-[2px] bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 shadow-lg flex items-center justify-center`}>
                    <div className="w-full h-full rounded-[14px] bg-black overflow-hidden flex items-center justify-center">
                      {holdingTeamLogo && !teamLogoError ? (
                        <img
                          src={holdingTeamLogo}
                          alt={holdingTeam.name}
                          onError={() => setTeamLogoError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-black text-amber-400 p-1 text-center">
                          <Shield className={`${isProjectorMode ? 'w-6 h-6' : 'w-8 h-8'} text-amber-400 mb-0.5`} />
                          <span className="text-[8px] font-black uppercase tracking-wider">
                            {holdingTeam.name.slice(0, 4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ALL Team Details on Right Side */}
                <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1 sm:space-y-1.5 text-left">
                  
                  {/* Team Title & Award Status */}
                  <div>
                    <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase text-amber-400 inline-flex items-center gap-1">
                      <Trophy className="w-2.5 h-2.5 text-amber-400" />
                      {isSold ? 'Player Awarded To' : 'Leading Franchise'}
                    </span>
                    <h3 className={`${
                      isProjectorMode
                        ? 'text-sm sm:text-lg md:text-xl'
                        : 'text-base sm:text-xl md:text-2xl'
                    } font-black text-white uppercase tracking-tight break-words leading-tight`}>
                      {holdingTeam.name}
                    </h3>
                    <p className="text-[8px] sm:text-[10px] text-zinc-400 font-bold">
                      Official ZPL Franchise
                    </p>
                  </div>

                  {/* Single-Row Strip: 3 Metrics + Final Bid Plaque (Larger Numbers) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 md:gap-2.5 items-stretch">
                    
                    {/* Remaining Purse */}
                    <div className="rounded-xl bg-zinc-950/95 border border-zinc-800/90 p-1.5 sm:p-2 md:p-2.5 text-center shadow-sm">
                      <span className="text-[8px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider text-zinc-400 block mb-0.5">
                        Purse Left
                      </span>
                      <span className={`${isProjectorMode ? 'text-sm sm:text-base md:text-lg' : 'text-base sm:text-lg md:text-xl lg:text-2xl'} font-black text-emerald-400 block tracking-tight`}>
                        ₹ {holdingTeam.remainingPurse?.toLocaleString() ?? 0}
                      </span>
                    </div>

                    {/* Squad Size */}
                    <div className="rounded-xl bg-zinc-950/95 border border-zinc-800/90 p-1.5 sm:p-2 md:p-2.5 text-center shadow-sm">
                      <span className="text-[8px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider text-zinc-400 block mb-0.5">
                        Squad
                      </span>
                      <span className={`${isProjectorMode ? 'text-sm sm:text-base md:text-lg' : 'text-base sm:text-lg md:text-xl lg:text-2xl'} font-black text-white block tracking-tight`}>
                        {holdingTeam.purchasedPlayerCount ?? 0} / 15
                      </span>
                    </div>

                    {/* Total Spent */}
                    <div className="rounded-xl bg-zinc-950/95 border border-zinc-800/90 p-1.5 sm:p-2 md:p-2.5 text-center shadow-sm">
                      <span className="text-[8px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider text-zinc-400 block mb-0.5">
                        Spent
                      </span>
                      <span className={`${isProjectorMode ? 'text-sm sm:text-base md:text-lg' : 'text-base sm:text-lg md:text-xl lg:text-2xl'} font-black text-amber-300 block tracking-tight`}>
                        ₹ {(holdingTeam.totalSpent ?? 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Final Purchase / Bid badge */}
                    <div className="rounded-xl bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 border border-amber-500/70 p-1.5 sm:p-2 md:p-2.5 text-center flex flex-col justify-center shadow-md">
                      <span className="text-[8px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider text-amber-400 block mb-0.5">
                        {isSold ? 'Purchase Bid' : 'Active Bid'}
                      </span>
                      <span className={`${isProjectorMode ? 'text-sm sm:text-base md:text-lg' : 'text-base sm:text-lg md:text-xl lg:text-2xl'} font-black text-white block tracking-tight`}>
                        <span className="text-amber-400 mr-0.5">₹</span>
                        {currentBid} <span className="text-[9px] sm:text-[11px] md:text-xs text-amber-400 font-black uppercase ml-0.5">PTS</span>
                      </span>
                    </div>

                  </div>

                </div>

              </div>
            ) : (
              /* State when no team has placed a bid yet */
              <div className={`p-3 text-center flex flex-col items-center justify-center space-y-1 ${isProjectorMode ? 'min-h-[70px]' : 'min-h-[100px]'}`}>
                <div className={`${isProjectorMode ? 'w-6 h-6' : 'w-9 h-9'} rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner`}>
                  <Shield className={`${isProjectorMode ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-amber-500/50`} />
                </div>
                <div>
                  <h4 className={`${isProjectorMode ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} font-black text-white uppercase tracking-wider`}>
                    Bidding Open
                  </h4>
                  <p className="text-[9px] sm:text-[10px] text-zinc-400 max-w-sm">
                    Waiting for opening bid at base price of <span className="text-amber-400 font-bold">{basePoints} PTS</span>.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}

export const ZPLBroadcastPlayerStage = React.memo(ZPLBroadcastPlayerStageComponent);
