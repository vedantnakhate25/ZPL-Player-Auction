import React, { useState, useMemo } from 'react';
import type { Auction, AuctionState, Team, Player } from '../types/auction';
import { ZPLAuctionStageEmblem } from './ZPLAuctionStageEmblem';
import { Trophy, Shield, Target, Zap, Award, Sparkles, Check, X, Radio } from 'lucide-react';

interface ZPLBroadcastPlayerStageProps {
  auction: Auction;
  auctionState: AuctionState;
  teams: Team[];
  players?: Player[];
  isProjectorMode?: boolean;
}

export function ZPLBroadcastPlayerStage({
  auction,
  auctionState,
  teams,
  players = [],
  isProjectorMode = false,
}: ZPLBroadcastPlayerStageProps) {
  const [photoError, setPhotoError] = useState(false);

  // Current player details
  const playerName = (auctionState.currentPlayerName || 'Player on Floor').toUpperCase();
  const playerRole = auctionState.currentPlayerRole || 'All-Rounder';
  const playerPhoto = auctionState.currentPlayerPhoto || '';
  const basePoints = auctionState.currentPlayerBasePoints ?? 50;
  const currentBid = auctionState.currentBidPoints ?? basePoints;
  const isBiddingActive = (auctionState.currentBidPoints ?? 0) > basePoints;
  const isSold = auctionState.playerStatus === 'sold';
  const isUnsold = auctionState.playerStatus === 'unsold';

  // Current team holding the highest bid (memoized)
  const holdingTeam = useMemo(() => {
    return teams.find(
      (t) => t.id === auctionState.winningTeamId || (auctionState.winningTeamName && t.name.toLowerCase() === auctionState.winningTeamName.toLowerCase())
    ) || (auctionState.winningTeamName ? {
      id: auctionState.winningTeamId || 'bid-team',
      name: auctionState.winningTeamName,
      logoUrl: auctionState.winningTeamLogo,
      purse: 1000,
      remainingPurse: 1000,
      purchasedPlayerCount: 0,
      totalSpent: 0,
      auctionId: auction.id,
      createdAt: ''
    } as Team : null);
  }, [teams, auctionState.winningTeamId, auctionState.winningTeamName, auctionState.winningTeamLogo, auction.id]);

  const holdingTeamLogo = holdingTeam?.logoUrl || auctionState.winningTeamLogo || '';

  // Total points spent across all teams (memoized)
  const totalPointsSpent = useMemo(() => {
    return teams.reduce((sum, team) => {
      const spent = team.totalSpent ?? Math.max(0, (team.purse || 0) - (team.remainingPurse || 0));
      return sum + spent;
    }, 0);
  }, [teams]);

  // Tournament / Auction Title
  const tournamentTitle = 'ZPL AUCTION 2027';
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
    <div className="relative w-full max-w-7xl mx-auto rounded-3xl bg-black border border-amber-500/40 shadow-2xl shadow-black overflow-hidden flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      {/* 1. TOP STEPPED GEOMETRIC ARENA ARCH (EXACT MATCH TO REFERENCE IMAGE) */}
      <div className="relative w-full pt-3 sm:pt-5 pb-1 px-2 sm:px-6 flex flex-col items-center">
        {/* Decorative Arena Stage Stepped Header Border */}
        <div className="relative w-full max-w-4xl flex items-center justify-center py-2">
          {/* Stepped Geometric Double-Line Arch with Mathematically Locked Typography */}
          <svg
            className="w-full h-auto max-h-32 sm:max-h-36 drop-shadow-[0_0_16px_rgba(251,191,36,0.35)]"
            viewBox="0 0 1000 135"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="goldArchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="20%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="80%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>

              {/* High-shine gold text fill */}
              <linearGradient id="goldTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#fef08a" />
                <stop offset="65%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>

              {/* Glowing filter */}
              <filter id="goldHeaderGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Central Warm Ambient Aura */}
              <radialGradient id="headerCenterAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#d97706" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Ambient Background Aura behind Title */}
            <ellipse cx="500" cy="70" rx="360" ry="46" fill="url(#headerCenterAura)" />

            {/* Outer Stepped Frame: Clean horizontal ceiling spanning over title with ample gap */}
            <path
              d="M 30 118 L 90 118 L 90 76 L 150 76 L 150 16 L 850 16 L 850 76 L 910 76 L 910 118 L 970 118"
              stroke="url(#goldArchGrad)"
              strokeWidth="3.2"
              strokeLinecap="square"
            />

            {/* Symmetrically Aligned Gold Corner Rivets / Illuminated Bulbs */}
            {/* Top Ceiling Corners */}
            <circle cx="150" cy="16" r="3.5" fill="#fef08a" stroke="#d97706" strokeWidth="1" filter="url(#goldHeaderGlow)" />
            <circle cx="850" cy="16" r="3.5" fill="#fef08a" stroke="#d97706" strokeWidth="1" filter="url(#goldHeaderGlow)" />

            {/* Upper Step Corners */}
            <circle cx="150" cy="76" r="3" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
            <circle cx="850" cy="76" r="3" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />

            {/* Middle Step Corners */}
            <circle cx="90" cy="76" r="3" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
            <circle cx="910" cy="76" r="3" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />

            {/* Lower Step Corners */}
            <circle cx="90" cy="118" r="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
            <circle cx="910" cy="118" r="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />

            {/* Terminal Base End Points */}
            <circle cx="30" cy="118" r="3" fill="#d97706" />
            <circle cx="970" cy="118" r="3" fill="#d97706" />

            {/* MAIN TOURNAMENT TITLE: ZPL AUCTION 2027 (Generous top clearance) */}
            <text
              x="500"
              y="74"
              textAnchor="middle"
              fill="url(#goldTextGrad)"
              fontSize="38"
              fontWeight="900"
              letterSpacing="5"
              fontFamily="Georgia, Cambria, 'Times New Roman', Times, serif"
              filter="url(#goldHeaderGlow)"
            >
              {tournamentTitle}
            </text>

            {/* SUBTITLE: ZHEP KRIDA MANDAL (Spaced comfortably below the title) */}
            <text
              x="500"
              y="106"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="13"
              fontWeight="900"
              letterSpacing="6"
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
              opacity="0.95"
            >
              {organizationTitle}
            </text>
          </svg>
        </div>

        {/* Ambient Top Light Beam Glows */}
        <div className="absolute top-0 left-1/4 w-72 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* 2. MAIN BROADCAST SCREEN ARENA (LEFT: PLAYER PROFILE | CENTER: STAGE EMBLEM & PODIUM | RIGHT: PURSE REMAINING) */}
      <div className="relative px-2 sm:px-6 py-2 sm:py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: PLAYER PROFILE BROADCAST CARD */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 w-full flex flex-col justify-center">
          <div className="relative w-full rounded-2xl bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/30 overflow-hidden backdrop-blur-md">
            
            {/* Top Cyan / Gold Header Bar */}
            <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-950 via-zinc-900 to-cyan-950 border-b border-cyan-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-[9px] text-black shadow-xs">
                  ZPL
                </div>
                <div className="leading-tight">
                  <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-white block">
                    {tournamentTitle}
                  </span>
                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">
                    PLAYER PROFILE
                  </span>
                </div>
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-1">
                {auctionState.status === 'paused' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-black" />
                    PAUSED
                  </span>
                ) : isSold ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider animate-pulse">
                    SOLD
                  </span>
                ) : isUnsold ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                    UNSOLD
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    IN AUCTION
                  </span>
                )}
              </div>
            </div>

            {/* Player Name & Nationality / League Bar */}
            <div className="px-4 pt-3 pb-2 bg-gradient-to-r from-cyan-900/30 via-zinc-900 to-cyan-900/30 border-b border-zinc-800">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wide truncate drop-shadow-md">
                  {playerName}
                </h2>
                <span className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  {getRoleIcon()}
                  {playerRole}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-[11px] text-cyan-300 font-bold uppercase tracking-wider">
                <span>{organizationTitle}</span>
                <span>&bull;</span>
                <span>{auctionState.round === 'unsold' ? 'Unsold Round' : 'Regular Pool'}</span>
              </div>
            </div>

            {/* Profile Center Body: Octagonal Photo on Left + Stats Table on Right */}
            <div className="p-3 sm:p-4 grid grid-cols-12 gap-3 sm:gap-4 items-center">
              {/* Octagonal Glowing Player Frame */}
              <div className="col-span-5 sm:col-span-5 flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
                  {/* Glowing Outer Hexagon / Bezel */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan-400 via-amber-400 to-cyan-500 p-[2.5px] shadow-lg shadow-cyan-500/20 transform rotate-1">
                    <div className="w-full h-full rounded-2xl bg-black overflow-hidden flex items-center justify-center">
                      {playerPhoto && !photoError ? (
                        <img
                          src={playerPhoto}
                          alt={playerName}
                          onError={() => setPhotoError(true)}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 p-2 text-center">
                          <Trophy className="w-8 h-8 text-amber-400/60 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            ZPL CRICKET
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Corner Accent Dots */}
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                  <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                  <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                </div>
              </div>

              {/* Broadcast Stats Grid (Matching IPL TV Screen) */}
              <div className="col-span-7 sm:col-span-7 flex flex-col justify-center space-y-2">
                <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950/80 text-xs">
                  {/* Row 1: League & Role */}
                  <div className="grid grid-cols-3 bg-zinc-900/90 border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-400 text-center py-1">
                    <span>LEAGUE</span>
                    <span className="border-x border-zinc-800">ROLE</span>
                    <span>POOL</span>
                  </div>
                  <div className="grid grid-cols-3 text-[11px] font-bold text-white text-center py-1.5 bg-black/60">
                    <span className="text-amber-400 font-black">ZPL</span>
                    <span className="border-x border-zinc-800 text-zinc-200 truncate px-1">
                      {playerRole}
                    </span>
                    <span className="text-zinc-300 truncate px-1">
                      {auctionState.round === 'unsold'
                        ? 'Unsold'
                        : auctionState.currentPlayerSlotName
                        ? auctionState.currentPlayerSlotName
                        : auctionState.currentPlayerSlotNumber
                        ? `Slot ${auctionState.currentPlayerSlotNumber}`
                        : 'Slot 1'}
                    </span>
                  </div>

                  {/* Row 2: Base Points & Current Leader */}
                  <div className="grid grid-cols-2 bg-zinc-900/90 border-t border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-400 text-center py-1">
                    <span>BASE PRICE</span>
                    <span className="border-l border-zinc-800">STATUS</span>
                  </div>
                  <div className="grid grid-cols-2 text-[11px] font-bold text-center py-1.5 bg-black/60">
                    <span className="text-white font-black">{basePoints} PTS</span>
                    <span
                      className={`border-l border-zinc-800 font-black ${
                        isSold
                          ? 'text-emerald-400'
                          : isUnsold
                          ? 'text-rose-400'
                          : isBiddingActive
                          ? 'text-amber-400'
                          : 'text-cyan-400'
                      }`}
                    >
                      {isSold
                        ? 'SOLD'
                        : isUnsold
                        ? 'UNSOLD'
                        : isBiddingActive
                        ? 'BIDDING'
                        : 'ON FLOOR'}
                    </span>
                  </div>
                </div>

                {/* Highest Bidder Indicator (if any) */}
                {auctionState.winningTeamName && (
                  <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-bold uppercase text-[9px]">
                      {isSold ? 'Sold To:' : 'Leading Bid:'}
                    </span>
                    <span className="font-black text-amber-300 truncate max-w-[130px] uppercase">
                      {auctionState.winningTeamName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Metallic Beveled Price Plaque (Exact Match to Broadcast Lower Plaque) */}
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1">
              <div className="w-full rounded-xl bg-gradient-to-r from-zinc-200 via-white to-zinc-200 p-[2px] shadow-xl">
                <div className="w-full rounded-[10px] bg-gradient-to-r from-zinc-950 via-black to-zinc-950 flex items-stretch overflow-hidden">
                  {/* Left Box: Currency & Points */}
                  <div className="px-4 py-2 sm:py-2.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-black flex items-center gap-1.5 shadow-md">
                    <span className="text-base sm:text-xl font-serif">₹</span>
                    <span className="text-lg sm:text-2xl font-black tracking-tight">
                      {currentBid} <span className="text-xs sm:text-sm font-bold uppercase">PTS</span>
                    </span>
                  </div>

                  {/* Right Box: Base Price / Current Bid Label */}
                  <div className="flex-1 px-3 sm:px-4 py-2 flex items-center justify-between bg-zinc-900/90 text-white">
                    <div>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-300 block">
                        {isSold
                          ? 'FINAL SALE PRICE'
                          : isBiddingActive
                          ? 'CURRENT HIGHEST BID'
                          : 'BASE PRICE'}
                      </span>
                      {auctionState.winningTeamName && (
                        <span className="text-[10px] font-bold text-amber-400 truncate block uppercase">
                          Team: {auctionState.winningTeamName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isSold ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : isUnsold ? (
                        <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-black">
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER COLUMN: STAGE EMBLEM BACKDROP + PODIUM & LOWER-THIRD TICKER */}
        {/* ======================================================== */}
        <div className="lg:col-span-2 hidden lg:flex flex-col items-center justify-center text-center relative">
          {/* Glowing Gavel Wheel Emblem in Center Backdrop */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 transform scale-90 sm:scale-100 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            <ZPLAuctionStageEmblem size={190} />
          </div>

          {/* Auctioneer Trophy Cup */}
          <div className="relative -mt-4 flex flex-col items-center drop-shadow-2xl">
            <div className="p-2 rounded-xl bg-gradient-to-t from-amber-600 to-yellow-300 text-black shadow-lg shadow-amber-500/40 ring-1 ring-white/50">
              <Trophy className="w-5 h-5 text-black" />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: CURRENT LEADING BID TEAM CARD (LOGO, NAME, HIGHEST BID) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 w-full flex flex-col justify-center">
          <div className="relative w-full rounded-2xl bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black border-2 border-amber-500/50 shadow-2xl shadow-amber-950/30 overflow-hidden backdrop-blur-md">
            
            {/* Top Gold / Amber Header Bar */}
            <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/80 border-b border-amber-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-[9px] text-black shadow-xs">
                  ZPL
                </div>
                <div className="leading-tight">
                  <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-white block">
                    {tournamentTitle}
                  </span>
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">
                    {isSold ? 'WINNING TEAM' : 'CURRENT HIGHEST BIDDER'}
                  </span>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-1.5">
                {isSold ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    ACQUIRED
                  </span>
                ) : isBiddingActive ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    HOLDING BID
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                    WAITING FOR BID
                  </span>
                )}
              </div>
            </div>

            {/* Main Content: Current Holding Team Card */}
            {holdingTeam ? (
              <div className="p-4 sm:p-5 flex flex-col justify-between space-y-4">
                {/* Team Hero Display: Large Logo & Name */}
                <div className="flex items-center gap-4">
                  {/* Glowing Team Logo Emblem */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-[2.5px] bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 shadow-xl shadow-amber-500/25 flex items-center justify-center">
                      <div className="w-full h-full rounded-[14px] bg-black overflow-hidden flex items-center justify-center">
                        {holdingTeamLogo ? (
                          <img
                            src={holdingTeamLogo}
                            alt={holdingTeam.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-black text-amber-400 p-2">
                            <Shield className="w-8 h-8 text-amber-400 mb-0.5" />
                            <span className="text-[10px] font-black uppercase">
                              {holdingTeam.name.slice(0, 3)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Active pulse ring */}
                    <div className="absolute -inset-1 rounded-2xl border border-amber-400/40 animate-pulse pointer-events-none" />
                  </div>

                  {/* Team Titles & Status */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-amber-400 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      {isSold ? 'Player Awarded To' : 'Current Top Bidder'}
                    </span>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight truncate drop-shadow-md">
                      {holdingTeam.name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold mt-0.5 truncate">
                      Official ZPL Franchise
                    </p>
                  </div>
                </div>

                {/* Team Financial & Squad Metrics */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-950/80 border border-zinc-800 p-2.5 text-center">
                  <div className="border-r border-zinc-800">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                      Remaining Purse
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-400">
                      ₹ {holdingTeam.remainingPurse?.toLocaleString() ?? 0}
                    </span>
                  </div>
                  <div className="border-r border-zinc-800">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                      Squad Size
                    </span>
                    <span className="text-sm sm:text-base font-black text-white">
                      {holdingTeam.purchasedPlayerCount ?? 0} / 15
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                      Total Spent
                    </span>
                    <span className="text-sm sm:text-base font-black text-amber-300">
                      ₹ {(holdingTeam.totalSpent ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Big Golden Bid Callout Plaque */}
                <div className="rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-2 border-amber-500/50 p-3 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500 text-black">
                      <Zap className="w-5 h-5 fill-black" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                        {isSold ? 'Final Purchase Bid' : 'Active Holding Bid'}
                      </span>
                      <span className="text-xs text-zinc-300 font-medium">
                        For {playerName}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      <span className="text-amber-400 font-serif mr-1">₹</span>
                      {currentBid} <span className="text-xs sm:text-sm text-amber-400 font-bold uppercase">PTS</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* State when no team has placed a bid yet */
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-3 min-h-[260px]">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner">
                  <Shield className="w-8 h-8 text-amber-500/50" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-wider">
                    No Active Bidder
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs mt-1">
                    Opening bid at base price of <span className="text-amber-400 font-bold">{basePoints} PTS</span>. Teams may place bids via the auctioneer desk.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Bidding Open
                </div>
              </div>
            )}

            {/* Bottom Sub-Strip */}
            <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>{teams.length} PARTICIPATING FRANCHISES</span>
              <span>ZPL OFFICIAL AUCTION</span>
            </div>

          </div>
        </div>

      </div>

      {/* 3. CENTER LOWER-THIRD NEWS TICKER (SMALL, SLEEK & REFINED) */}
      <div className="relative px-3 sm:px-6 py-2 pb-3 w-full max-w-3xl mx-auto">
        <div className="rounded-full bg-white/95 text-black px-3.5 py-1.5 border border-zinc-300 shadow-xl flex items-center justify-center text-center">
          <p className="text-[11px] sm:text-xs font-bold text-zinc-900 leading-snug flex items-center justify-center flex-wrap gap-1.5">
            {auctionState.status === 'paused' ? (
              <>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[9px] uppercase tracking-wider shadow-xs animate-pulse">
                  AUCTION PAUSED
                </span>
                <span>
                  The auction is currently on pause by the admin. Bidding will resume shortly.
                </span>
              </>
            ) : isSold ? (
              <>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                  OFFICIAL NOTICE
                </span>
                <span>
                  <strong className="uppercase font-black text-black">{playerName}</strong> has been SOLD to{' '}
                  <strong className="text-amber-800 uppercase font-black">{auctionState.winningTeamName}</strong>{' '}
                  for {currentBid} PTS in the {tournamentTitle}.
                </span>
              </>
            ) : isUnsold ? (
              <>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                  OFFICIAL NOTICE
                </span>
                <span>
                  <strong className="uppercase font-black text-black">{playerName}</strong> remains UNSOLD at base price of {basePoints} PTS and will be recalled in the Unsold Round.
                </span>
              </>
            ) : isBiddingActive ? (
              <>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[9px] uppercase tracking-wider shadow-xs">
                  LIVE BID
                </span>
                <span>
                  Current highest bid for <strong className="uppercase font-black text-black">{playerName}</strong> is {currentBid} PTS by{' '}
                  <strong className="text-black uppercase font-black">{auctionState.winningTeamName}</strong>.
                </span>
              </>
            ) : (
              <>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 font-black text-[9px] uppercase tracking-wider shadow-xs">
                  ZPL STATUS
                </span>
                <span>
                  A total of{' '}
                  <strong className="text-black font-black">
                    {totalPointsSpent.toLocaleString()} PTS
                  </strong>{' '}
                  has been spent so far in the {tournamentTitle}.
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
