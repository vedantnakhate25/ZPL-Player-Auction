import React, { useState, useMemo, useEffect } from 'react';
import type { Auction, AuctionState, Team, Player } from '../types/auction';
import { Trophy, Shield, Target, Zap, Award, Check, X } from 'lucide-react';

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
  const isBiddingActive = Boolean(auctionState?.winningTeamId) || (auctionState?.currentBidPoints ?? 0) > basePoints;
  const isSold = auctionState?.playerStatus === 'sold';
  const isUnsold = auctionState?.playerStatus === 'unsold';

  // Reset error states whenever active player or leading team changes
  useEffect(() => {
    setPhotoError(false);
  }, [playerPhoto, auctionState?.currentPlayerId]);

  // Current team holding the highest bid (memoized)
  const holdingTeam = useMemo(() => {
    if (!Array.isArray(teams)) return null;
    const winningName =
      typeof auctionState?.winningTeamName === 'string'
        ? auctionState.winningTeamName.toLowerCase().trim()
        : '';
    return (
      teams.find(
        (t) =>
          (t && t.id && auctionState?.winningTeamId && t.id === auctionState.winningTeamId) ||
          (winningName && t && typeof t.name === 'string' && t.name.toLowerCase().trim() === winningName)
      ) ||
      (auctionState?.winningTeamName
        ? ({
            id: auctionState.winningTeamId || 'bid-team',
            name: auctionState.winningTeamName,
            logoUrl: auctionState.winningTeamLogo || '',
            purse: 1000,
            remainingPurse: auctionState.winningTeamRemainingPurse ?? 1000,
            purchasedPlayerCount: 0,
            totalSpent: 0,
            auctionId: auction.id,
            createdAt: ''
          } as Team)
        : null)
    );
  }, [
    teams,
    auctionState?.winningTeamId,
    auctionState?.winningTeamName,
    auctionState?.winningTeamLogo,
    auctionState?.winningTeamRemainingPurse,
    auction.id
  ]);

  const holdingTeamLogo = holdingTeam?.logoUrl || auctionState?.winningTeamLogo || '';

  useEffect(() => {
    setTeamLogoError(false);
  }, [holdingTeamLogo, holdingTeam?.id]);

  // Tournament / Auction Title
  const tournamentTitle = (auction.name || 'ZPL AUCTION 2027').trim();
  const organizationTitle = 'ZHEP KRIDA MANDAL';

  // Adaptive title sizing so any auction name fits cleanly inside the stepped gold arch without clipping
  const titleSizeClass = useMemo(() => {
    const len = tournamentTitle.length;
    if (isProjectorMode) {
      if (len > 32) return 'text-base sm:text-xl md:text-2xl tracking-wide';
      if (len > 20) return 'text-lg sm:text-2xl md:text-3xl tracking-wider';
      return 'text-xl sm:text-3xl md:text-4xl tracking-[0.14em]';
    }
    if (len > 32) return 'text-base sm:text-xl md:text-2xl lg:text-3xl tracking-wide';
    if (len > 20) return 'text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-wider';
    return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0.14em]';
  }, [tournamentTitle, isProjectorMode]);

  // Role icon helper
  const getRoleIcon = () => {
    switch (playerRole) {
      case 'Batsman':
        return <Shield className="w-3.5 h-3.5 text-[#f5d77f]" />;
      case 'Bowler':
        return <Target className="w-3.5 h-3.5 text-[#fde047]" />;
      case 'All-Rounder':
        return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Wicket-Keeper':
        return <Award className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Trophy className="w-3.5 h-3.5 text-[#f5d77f]" />;
    }
  };

  return (
    <div
      className={`relative w-full max-w-6xl mx-auto rounded-3xl bg-[#060c16] border border-[#f5d77f]/35 shadow-2xl overflow-hidden flex flex-col justify-between selection:bg-[#f5d77f] selection:text-[#060c16] ${
        isProjectorMode ? 'h-full flex-1 min-h-0' : ''
      }`}
    >
      {/* 1. TOP STEPPED GEOMETRIC ARENA ARCH — PERFECTLY ALIGNED FOR ANY TITLE LENGTH */}
      <div
        className={`relative w-full ${
          isProjectorMode ? 'pt-2 pb-1' : 'pt-4 sm:pt-5 pb-2'
        } px-3 sm:px-6 md:px-8 shrink-0`}
      >
        <div className="relative w-full max-w-5xl mx-auto">
          {/* Stepped Gold Circuit Frame SVG (Background Framing Only — Never Collides with Text) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            viewBox="0 0 1000 120"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="goldArchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c59f33" />
                <stop offset="25%" stopColor="#fff2a8" />
                <stop offset="50%" stopColor="#f5d77f" />
                <stop offset="75%" stopColor="#fff2a8" />
                <stop offset="100%" stopColor="#c59f33" />
              </linearGradient>
            </defs>

            {/* Clean Stepped Arch Border Framing Outer Left, Top, and Outer Right */}
            <path
              d="M 10 110 L 52 110 L 52 66 L 96 66 L 96 10 L 904 10 L 904 66 L 948 66 L 948 110 L 990 110"
              stroke="url(#goldArchGrad)"
              strokeWidth="2.75"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Corner Accent Nodes (Crisp HTML pins so they stay perfectly round at any aspect ratio) */}
          <span
            aria-hidden="true"
            className="hidden sm:block absolute left-[9.6%] top-[8.3%] -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#fff4c2] border border-[#8c6e18] pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="hidden sm:block absolute right-[9.6%] top-[8.3%] translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#fff4c2] border border-[#8c6e18] pointer-events-none"
          />

          {/* Centered Title & Organization Safely Contained Inside the Arch */}
          <div
            className={`relative z-10 flex flex-col items-center justify-center text-center px-8 sm:px-20 md:px-28 ${
              isProjectorMode ? 'pt-3 pb-2' : 'pt-4 sm:pt-5 pb-3'
            }`}
          >
            <h2
              className={`${titleSizeClass} font-black uppercase leading-tight text-balance bg-gradient-to-b from-white via-[#fff4c2] to-[#e0bc50] bg-clip-text text-transparent`}
            >
              {tournamentTitle}
            </h2>
            <p
              className={`${
                isProjectorMode ? 'text-[10px] sm:text-xs mt-0.5' : 'text-[11px] sm:text-xs md:text-sm mt-1'
              } font-extrabold text-[#f5d77f]/90 uppercase tracking-[0.3em]`}
            >
              {organizationTitle}
            </p>
          </div>
        </div>
      </div>

      {/* 2. MAIN BROADCAST STAGE */}
      <div
        className={`relative px-3 sm:px-5 md:px-6 ${
          isProjectorMode
            ? 'py-1.5 gap-2.5 flex-1 min-h-0 justify-between'
            : 'pt-2 pb-4 sm:pb-6 gap-4'
        } flex flex-col w-full max-w-5xl mx-auto`}
      >
        {/* TOP CARD: ACTIVE PLAYER PROFILE */}
        <div className={`w-full ${isProjectorMode ? 'flex-[1.5] min-h-0 flex flex-col' : ''}`}>
          <div
            className={`relative w-full rounded-2xl bg-gradient-to-b from-[#0b172a] via-[#081220] to-[#060d18] border border-[#f5d77f]/35 shadow-xl overflow-hidden ${
              isProjectorMode ? 'h-full flex flex-col justify-between' : ''
            }`}
          >
            {/* Card Header Bar */}
            <div
              className={`px-4 ${
                isProjectorMode ? 'py-1.5' : 'py-2.5'
              } bg-[#0c1a30] border-b border-[#f5d77f]/20 flex items-center justify-between shrink-0`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-[#060c16] border border-[#f5d77f]/50 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="/assets/aistudio/file_00000000661882118ee895643705c2c1_2d4830dd.png"
                    alt="ZPL Crest"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[11px] sm:text-xs font-black tracking-[0.16em] uppercase text-[#f5d77f]">
                  Player Profile
                </span>
              </div>

              {/* Clean Status Indicator */}
              <div className="flex items-center">
                {auctionState?.status === 'paused' ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#f5d77f] text-[#060c16] text-[10px] sm:text-xs font-black uppercase tracking-wider">
                    Paused
                  </span>
                ) : isSold ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-[#060c16] text-[10px] sm:text-xs font-black uppercase tracking-wider inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Sold
                  </span>
                ) : isUnsold ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider inline-flex items-center gap-1">
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                    Unsold
                  </span>
                ) : (
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    On Floor
                  </span>
                )}
              </div>
            </div>

            {/* Player Body: Framed Photo Left + Details Right */}
            <div
              className={`p-3.5 sm:p-5 ${
                isProjectorMode ? 'py-2.5 gap-4 flex-1 min-h-0' : 'gap-4 sm:gap-6'
              } flex flex-row items-center`}
            >
              {/* Player Photo Frame */}
              <div className="shrink-0 flex items-center justify-center">
                <div
                  className={`relative ${
                    isProjectorMode
                      ? 'w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-60 lg:h-60'
                      : 'w-32 h-32 xs:w-40 xs:h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-68 lg:h-68'
                  } rounded-2xl bg-gradient-to-b from-[#f5d77f] via-[#224270] to-[#f5d77f] p-[2.5px] shadow-xl`}
                >
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
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a1526] text-[#c5d3e8] p-2 text-center">
                        <Trophy
                          className={`${isProjectorMode ? 'w-10 h-10' : 'w-12 h-12'} text-[#f5d77f]/70 mb-1`}
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#a1b3cb]">
                          ZPL Player
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Subtle Gold Corner Rivets */}
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#fff2a8] border-2 border-[#060c16]" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#fff2a8] border-2 border-[#060c16]" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#f5d77f] border-2 border-[#060c16]" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#f5d77f] border-2 border-[#060c16]" />
                </div>
              </div>

              {/* Player Info & Live Bid Metrics */}
              <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2.5 sm:space-y-3.5 text-left">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3
                      className={`${
                        isProjectorMode
                          ? 'text-xl sm:text-2xl md:text-3xl'
                          : 'text-xl sm:text-3xl md:text-4xl'
                      } font-black text-white uppercase tracking-tight leading-tight break-words`}
                    >
                      {playerName}
                    </h3>
                    <span className="text-xs sm:text-sm font-bold text-[#f5d77f] uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0">
                      {getRoleIcon()}
                      {playerRole}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] sm:text-xs text-[#a1b3cb] font-semibold uppercase tracking-wider">
                    {auctionState?.round === 'unsold' ? 'Unsold Recall Round' : 'Regular Player Pool'}
                    {' · '}
                    {auctionState?.round === 'unsold'
                      ? 'Unsold Pool'
                      : auctionState?.currentPlayerSlotName ||
                        (auctionState?.currentPlayerSlotNumber
                          ? `Slot ${auctionState.currentPlayerSlotNumber}`
                          : 'Slot 1')}
                  </p>
                </div>

                {/* Broadcast Metrics Row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-xl bg-[#060d17] border border-[#162b4a] p-2.5 sm:p-3.5 text-center">
                  <div className="border-r border-[#162b4a] pr-2">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#a1b3cb] block mb-0.5">
                      Base Price
                    </span>
                    <span
                      className={`${
                        isProjectorMode ? 'text-sm sm:text-lg' : 'text-sm sm:text-lg md:text-xl'
                      } font-black text-white tracking-tight tabular-nums`}
                    >
                      ₹ {basePoints}{' '}
                      <span className="text-[10px] sm:text-xs text-[#a1b3cb] font-bold">PTS</span>
                    </span>
                  </div>

                  <div className="border-r border-[#162b4a] pr-2">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#a1b3cb] block mb-0.5">
                      Pool / Slot
                    </span>
                    <span
                      className={`${
                        isProjectorMode ? 'text-sm sm:text-lg' : 'text-sm sm:text-lg md:text-xl'
                      } font-black text-[#f5d77f] truncate block tracking-tight`}
                    >
                      {auctionState?.round === 'unsold'
                        ? 'Unsold'
                        : auctionState?.currentPlayerSlotName ||
                          (auctionState?.currentPlayerSlotNumber
                            ? `Slot ${auctionState.currentPlayerSlotNumber}`
                            : 'Slot 1')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#a1b3cb] block mb-0.5">
                      {isSold ? 'Final Price' : isBiddingActive ? 'Current Bid' : 'Opening Bid'}
                    </span>
                    <span
                      className={`${
                        isProjectorMode ? 'text-sm sm:text-lg' : 'text-sm sm:text-lg md:text-xl'
                      } font-black tracking-tight tabular-nums ${
                        isSold ? 'text-emerald-400' : isUnsold ? 'text-rose-400' : 'text-[#fff4c2]'
                      }`}
                    >
                      ₹ {currentBid}{' '}
                      <span className="text-[10px] sm:text-xs font-bold text-[#f5d77f] uppercase">
                        PTS
                      </span>
                    </span>
                  </div>
                </div>

                {/* Live Bid Status Bar */}
                {isSold ? (
                  <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/45 px-3.5 py-2 flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-emerald-200 uppercase tracking-wider truncate">
                      Sold To:{' '}
                      <strong className="text-white font-black">
                        {holdingTeam?.name || 'Winning Franchise'}
                      </strong>
                    </span>
                    <span className="text-xs sm:text-base font-black text-emerald-400 uppercase tabular-nums shrink-0">
                      ₹ {currentBid} PTS
                    </span>
                  </div>
                ) : isUnsold ? (
                  <div className="rounded-xl bg-rose-500/15 border border-rose-500/45 px-3.5 py-2 flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-rose-300 uppercase tracking-wider">
                      Status: Unsold
                    </span>
                    <span className="text-xs font-bold text-[#a1b3cb] uppercase">Unsold Pool</span>
                  </div>
                ) : isBiddingActive && holdingTeam ? (
                  <div className="rounded-xl bg-[#f5d77f]/12 border border-[#f5d77f]/45 px-3.5 py-2 flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#fff2a8] uppercase tracking-wider truncate">
                      Leading:{' '}
                      <strong className="text-white font-black">{holdingTeam.name}</strong>
                    </span>
                    <span className="text-xs sm:text-base font-black text-[#f5d77f] uppercase tabular-nums shrink-0">
                      ₹ {currentBid} PTS
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#060d17] border border-[#162b4a] px-3.5 py-2 flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#a1b3cb] uppercase tracking-wider">
                      Ready For Opening Bid
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#f5d77f] uppercase tabular-nums">
                      Base: ₹ {basePoints} PTS
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CARD: CURRENT HIGHEST BIDDER / WINNING TEAM */}
        <div className={`w-full ${isProjectorMode ? 'flex-[0.95] min-h-0 flex flex-col' : ''}`}>
          <div
            className={`relative w-full rounded-2xl bg-gradient-to-b from-[#0b172a] via-[#081220] to-[#060d18] border border-[#f5d77f]/35 shadow-xl overflow-hidden ${
              isProjectorMode ? 'h-full flex flex-col justify-between' : ''
            }`}
          >
            {/* Card Header Bar */}
            <div
              className={`px-4 ${
                isProjectorMode ? 'py-1.5' : 'py-2'
              } bg-[#0c1a30] border-b border-[#f5d77f]/20 flex items-center justify-between shrink-0`}
            >
              <span className="text-[11px] sm:text-xs font-black tracking-[0.16em] uppercase text-[#f5d77f] inline-flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#f5d77f]" />
                {isSold ? 'Winning Franchise' : 'Current Highest Bidder'}
              </span>

              <div className="flex items-center">
                {isSold ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-[#060c16] text-[10px] sm:text-xs font-black uppercase tracking-wider inline-flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Acquired
                  </span>
                ) : isBiddingActive && holdingTeam ? (
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#f5d77f]">
                    Holding Bid
                  </span>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#a1b3cb]">
                    Awaiting Bid
                  </span>
                )}
              </div>
            </div>

            {holdingTeam ? (
              <div
                className={`p-3.5 sm:p-4 ${
                  isProjectorMode ? 'py-2 gap-3.5 flex-1 min-h-0' : 'gap-4'
                } flex flex-row items-center`}
              >
                {/* Team Logo */}
                <div className="shrink-0 flex items-center justify-center">
                  <div
                    className={`${
                      isProjectorMode
                        ? 'w-16 h-16 sm:w-20 sm:h-20'
                        : 'w-16 h-16 sm:w-22 sm:h-22 md:w-24 md:h-24'
                    } rounded-2xl p-[2px] bg-gradient-to-br from-[#f5d77f] via-[#c59f33] to-[#8c6e18] shadow-md`}
                  >
                    <div className="w-full h-full rounded-[14px] bg-[#060c16] overflow-hidden flex items-center justify-center">
                      {holdingTeamLogo && !teamLogoError ? (
                        <img
                          src={holdingTeamLogo}
                          alt={holdingTeam.name}
                          referrerPolicy="no-referrer"
                          onError={() => setTeamLogoError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a1526] text-[#f5d77f] p-1 text-center">
                          <Shield className="w-7 h-7 text-[#f5d77f] mb-0.5" />
                          <span className="text-[9px] font-black uppercase">
                            {holdingTeam.name.slice(0, 3)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Name & Stats Strip */}
                <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2 text-left">
                  <h3
                    className={`${
                      isProjectorMode
                        ? 'text-base sm:text-xl md:text-2xl'
                        : 'text-lg sm:text-xl md:text-2xl'
                    } font-black text-white uppercase tracking-tight leading-tight break-words`}
                  >
                    {holdingTeam.name}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-stretch">
                    <div className="rounded-xl bg-[#060d17] border border-[#162b4a] p-2 text-center">
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#a1b3cb] block mb-0.5">
                        Purse Left
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-black text-emerald-400 block tabular-nums">
                        ₹ {holdingTeam.remainingPurse?.toLocaleString() ?? 0}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#060d17] border border-[#162b4a] p-2 text-center">
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#a1b3cb] block mb-0.5">
                        Squad
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-black text-white block tabular-nums">
                        {holdingTeam.purchasedPlayerCount ?? 0} / 15
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#060d17] border border-[#162b4a] p-2 text-center">
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#a1b3cb] block mb-0.5">
                        Spent
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-black text-[#f5d77f] block tabular-nums">
                        ₹ {(holdingTeam.totalSpent ?? 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#f5d77f]/15 border border-[#f5d77f]/70 p-2 text-center flex flex-col justify-center">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#f5d77f] block mb-0.5">
                        {isSold ? 'Final Bid' : 'Active Bid'}
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-black text-white block tabular-nums">
                        <span className="text-[#f5d77f] mr-0.5">₹</span>
                        {currentBid}{' '}
                        <span className="text-[10px] text-[#f5d77f] font-black uppercase">PTS</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`p-4 text-center flex flex-col items-center justify-center space-y-1 ${
                  isProjectorMode ? 'min-h-[72px]' : 'min-h-[96px]'
                }`}
              >
                <p className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Bidding Open
                </p>
                <p className="text-xs text-[#a1b3cb]">
                  Awaiting opening bid at base price of{' '}
                  <span className="text-[#f5d77f] font-bold tabular-nums">₹ {basePoints} PTS</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ZPLBroadcastPlayerStage = React.memo(ZPLBroadcastPlayerStageComponent);
export default ZPLBroadcastPlayerStage;
