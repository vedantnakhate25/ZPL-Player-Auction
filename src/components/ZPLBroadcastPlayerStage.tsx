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

  useEffect(() => {
    setPhotoError(false);
  }, [playerPhoto, auctionState?.currentPlayerId]);

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

  const tournamentTitle = (auction.name || 'ZPL AUCTION 2027').trim();
  const organizationTitle = 'ZHEP KRIDA MANDAL';

  const slotLabel =
    auctionState?.round === 'unsold'
      ? 'Unsold'
      : auctionState?.currentPlayerSlotName ||
        (auctionState?.currentPlayerSlotNumber ? `Slot ${auctionState.currentPlayerSlotNumber}` : 'Slot 1');

  const titleSizeClass = useMemo(() => {
    const len = tournamentTitle.length;
    if (isProjectorMode) {
      if (len > 32) return 'text-base sm:text-xl md:text-2xl tracking-wide';
      if (len > 20) return 'text-lg sm:text-2xl md:text-3xl tracking-wider';
      return 'text-xl sm:text-3xl md:text-4xl tracking-[0.14em]';
    }
    if (len > 32) return 'text-sm sm:text-xl md:text-2xl lg:text-3xl tracking-wide';
    if (len > 20) return 'text-base sm:text-2xl md:text-3xl lg:text-4xl tracking-wider';
    return 'text-xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0.12em]';
  }, [tournamentTitle, isProjectorMode]);

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
      className={`relative w-full max-w-6xl mx-auto rounded-2xl sm:rounded-3xl bg-[#060c16] border border-[#f5d77f]/35 shadow-2xl overflow-hidden flex flex-col justify-between selection:bg-[#f5d77f] selection:text-[#060c16] ${
        isProjectorMode ? 'h-full flex-1 min-h-0' : ''
      }`}
    >
      {/* 1. TOP STEPPED GEOMETRIC ARENA ARCH */}
      <div
        className={`relative w-full ${
          isProjectorMode ? 'pt-2 pb-1' : 'pt-3 sm:pt-5 pb-2'
        } px-2.5 sm:px-6 md:px-8 shrink-0`}
      >
        <div className="relative w-full max-w-5xl mx-auto">
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

            <path
              d="M 10 110 L 52 110 L 52 66 L 96 66 L 96 10 L 904 10 L 904 66 L 948 66 L 948 110 L 990 110"
              stroke="url(#goldArchGrad)"
              strokeWidth="2.75"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span
            aria-hidden="true"
            className="hidden sm:block absolute left-[9.6%] top-[8.3%] -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#fff4c2] border border-[#8c6e18] pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="hidden sm:block absolute right-[9.6%] top-[8.3%] translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#fff4c2] border border-[#8c6e18] pointer-events-none"
          />

          <div
            className={`relative z-10 flex flex-col items-center justify-center text-center px-7 sm:px-20 md:px-28 ${
              isProjectorMode ? 'pt-3 pb-2' : 'pt-3.5 sm:pt-5 pb-2.5 sm:pb-3'
            }`}
          >
            <h2
              className={`${titleSizeClass} font-black uppercase leading-tight text-balance bg-gradient-to-b from-white via-[#fff4c2] to-[#e0bc50] bg-clip-text text-transparent`}
            >
              {tournamentTitle}
            </h2>
            <p
              className={`${
                isProjectorMode ? 'text-[10px] sm:text-xs mt-0.5' : 'text-[10px] sm:text-xs md:text-sm mt-1'
              } font-extrabold text-[#f5d77f]/90 uppercase tracking-[0.22em] sm:tracking-[0.3em]`}
            >
              {organizationTitle}
            </p>
          </div>
        </div>
      </div>

      {/* 2. MAIN BROADCAST STAGE */}
      <div
        className={`relative px-2.5 sm:px-5 md:px-6 ${
          isProjectorMode
            ? 'py-1.5 gap-2.5 flex-1 min-h-0 justify-between'
            : 'pt-1.5 pb-4 sm:pb-6 gap-3.5 sm:gap-4'
        } flex flex-col w-full max-w-5xl mx-auto`}
      >
        {/* TOP CARD: ACTIVE PLAYER PROFILE */}
        <div className={`w-full ${isProjectorMode ? 'flex-[1.5] min-h-0 flex flex-col' : ''}`}>
          <div
            className={`relative w-full rounded-2xl bg-gradient-to-b from-[#0b172a] via-[#081220] to-[#060d18] border border-[#f5d77f]/35 shadow-xl overflow-hidden ${
              isProjectorMode ? 'h-full flex flex-col' : ''
            }`}
          >
            {/* Card Header Bar */}
            <div
              className={`px-3.5 sm:px-4 ${
                isProjectorMode ? 'py-1.5' : 'py-2 sm:py-2.5'
              } bg-[#0c1a30] border-b border-[#f5d77f]/20 flex items-center justify-between shrink-0`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#060c16] border border-[#f5d77f]/50 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="/assets/aistudio/file_00000000661882118ee895643705c2c1_2d4830dd.png"
                    alt="ZPL Crest"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[11px] sm:text-xs font-black tracking-[0.14em] uppercase text-[#f5d77f]">
                  Player Profile
                </span>
              </div>

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

            {/* Player Body: Stacks vertically below md (768px) so details always have full width; side-by-side on md+ */}
            <div
              className={`p-3.5 sm:p-5 ${
                isProjectorMode
                  ? 'py-3 gap-4 md:gap-5 flex-1 min-h-0 flex-col md:flex-row items-center justify-center'
                  : 'gap-4 md:gap-6 flex-col md:flex-row items-center'
              } flex`}
            >
              {/* Player Photo Frame */}
              <div className="shrink-0 flex items-center justify-center">
                <div
                  className={`relative ${
                    isProjectorMode
                      ? 'w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-60 lg:h-60'
                      : 'w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 lg:w-64 lg:h-64'
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
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#fff2a8] border-2 border-[#060c16]" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#fff2a8] border-2 border-[#060c16]" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#f5d77f] border-2 border-[#060c16]" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#f5d77f] border-2 border-[#060c16]" />
                </div>
              </div>

              {/* Player Info & Live Bid Metrics */}
              <div className="w-full flex-1 min-w-0 flex flex-col justify-center space-y-3 sm:space-y-3.5 text-center md:text-left">
                <div>
                  <div className="flex flex-wrap items-center justify-center md:justify-between gap-2">
                    <h3
                      className={`${
                        isProjectorMode
                          ? 'text-xl sm:text-2xl md:text-3xl'
                          : 'text-2xl sm:text-3xl md:text-4xl'
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
                    {slotLabel}
                  </p>
                </div>

                {/* Broadcast Metrics Row — Equal-Height Cells, Zero Overlap, Aligned Baselines */}
                <div className="grid grid-cols-3 items-stretch rounded-xl bg-[#060d17] border border-[#162b4a] divide-x divide-[#162b4a] overflow-hidden">
                  <div className="flex flex-col items-center justify-center gap-1.5 px-1.5 py-2.5 sm:px-3 sm:py-3.5 min-w-0 overflow-hidden text-center">
                    <span className="text-[9px] min-[380px]:text-[10px] sm:text-xs font-bold uppercase tracking-wide text-[#a1b3cb] leading-tight truncate max-w-full">
                      Base Price
                    </span>
                    <span
                      className={`${
                        isProjectorMode
                          ? 'text-sm sm:text-base md:text-lg'
                          : 'text-sm min-[380px]:text-base sm:text-lg md:text-xl'
                      } font-black text-white tracking-tight leading-none tabular-nums whitespace-nowrap`}
                    >
                      ₹ {basePoints}{' '}
                      <span className="text-[9px] sm:text-xs text-[#a1b3cb] font-bold">PTS</span>
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-1.5 px-1.5 py-2.5 sm:px-3 sm:py-3.5 min-w-0 overflow-hidden text-center">
                    <span className="text-[9px] min-[380px]:text-[10px] sm:text-xs font-bold uppercase tracking-wide text-[#a1b3cb] leading-tight truncate max-w-full">
                      Pool / Slot
                    </span>
                    <span
                      className={`${
                        isProjectorMode
                          ? 'text-sm sm:text-base md:text-lg'
                          : 'text-sm min-[380px]:text-base sm:text-lg md:text-xl'
                      } font-black text-[#f5d77f] tracking-tight leading-none truncate max-w-full`}
                      title={slotLabel}
                    >
                      {slotLabel}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-1.5 px-1.5 py-2.5 sm:px-3 sm:py-3.5 min-w-0 overflow-hidden text-center">
                    <span className="text-[9px] min-[380px]:text-[10px] sm:text-xs font-bold uppercase tracking-wide text-[#a1b3cb] leading-tight truncate max-w-full">
                      {isSold ? 'Final Price' : isBiddingActive ? 'Current Bid' : 'Opening Bid'}
                    </span>
                    <span
                      className={`${
                        isProjectorMode
                          ? 'text-sm sm:text-base md:text-lg'
                          : 'text-sm min-[380px]:text-base sm:text-lg md:text-xl'
                      } font-black tracking-tight leading-none tabular-nums whitespace-nowrap ${
                        isSold ? 'text-emerald-400' : isUnsold ? 'text-rose-400' : 'text-[#fff4c2]'
                      }`}
                    >
                      ₹ {currentBid}{' '}
                      <span className="text-[9px] sm:text-xs font-bold text-[#f5d77f] uppercase">
                        PTS
                      </span>
                    </span>
                  </div>
                </div>

                {/* Live Bid Status Bar — Clean Horizontal Alignment, Never Stacks Word-by-Word */}
                {isSold ? (
                  <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/45 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-left">
                    <span className="text-xs sm:text-sm font-bold text-emerald-200 uppercase tracking-wide leading-snug min-w-0">
                      Sold To:{' '}
                      <strong className="text-white font-black">
                        {holdingTeam?.name || 'Winning Franchise'}
                      </strong>
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-400 uppercase tabular-nums whitespace-nowrap shrink-0">
                      ₹ {currentBid} PTS
                    </span>
                  </div>
                ) : isUnsold ? (
                  <div className="rounded-xl bg-rose-500/15 border border-rose-500/45 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-left">
                    <span className="text-xs sm:text-sm font-bold text-rose-300 uppercase tracking-wide whitespace-nowrap">
                      Status: Unsold
                    </span>
                    <span className="text-xs font-bold text-[#a1b3cb] uppercase whitespace-nowrap">
                      Unsold Pool
                    </span>
                  </div>
                ) : isBiddingActive && holdingTeam ? (
                  <div className="rounded-xl bg-[#f5d77f]/12 border border-[#f5d77f]/45 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-left">
                    <span className="text-xs sm:text-sm font-bold text-[#fff2a8] uppercase tracking-wide leading-snug min-w-0">
                      Leading:{' '}
                      <strong className="text-white font-black">{holdingTeam.name}</strong>
                    </span>
                    <span className="text-sm sm:text-base font-black text-[#f5d77f] uppercase tabular-nums whitespace-nowrap shrink-0">
                      ₹ {currentBid} PTS
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#060d17] border border-[#162b4a] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-left">
                    <span className="text-[11px] sm:text-xs md:text-sm font-bold text-[#a1b3cb] uppercase tracking-wide whitespace-nowrap">
                      Ready For Opening Bid
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#f5d77f] uppercase tabular-nums whitespace-nowrap shrink-0">
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
              isProjectorMode ? 'h-full flex flex-col' : 'flex flex-col'
            }`}
          >
            <div
              className={`px-3.5 sm:px-4 ${
                isProjectorMode ? 'py-1.5' : 'py-2'
              } bg-[#0c1a30] border-b border-[#f5d77f]/20 flex items-center justify-between shrink-0`}
            >
              <span className="text-[11px] sm:text-xs font-black tracking-[0.14em] uppercase text-[#f5d77f] inline-flex items-center gap-2">
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
                ) : isUnsold ? (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                    Unsold
                  </span>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#a1b3cb]">
                    No Bids Yet
                  </span>
                )}
              </div>
            </div>

            {holdingTeam ? (
              <div
                className={`p-3.5 sm:p-4 flex-1 ${
                  isProjectorMode
                    ? 'py-2.5 gap-3.5 min-h-0 flex-col md:flex-row md:items-center justify-center'
                    : 'gap-3 md:gap-4 flex-col md:flex-row md:items-center'
                } flex`}
              >
                {/* Team Identity Row below md; Standalone Logo on md+ */}
                <div className="flex items-center gap-3 md:block shrink-0">
                  <div
                    className={`${
                      isProjectorMode
                        ? 'w-14 h-14 md:w-20 md:h-20'
                        : 'w-14 h-14 md:w-22 md:h-22'
                    } rounded-xl sm:rounded-2xl p-[2px] bg-gradient-to-br from-[#f5d77f] via-[#c59f33] to-[#8c6e18] shadow-md shrink-0`}
                  >
                    <div className="w-full h-full rounded-[10px] sm:rounded-[14px] bg-[#060c16] overflow-hidden flex items-center justify-center">
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
                          <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-[#f5d77f] mb-0.5" />
                          <span className="text-[9px] font-black uppercase">
                            {holdingTeam.name.slice(0, 3)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compact team title beside logo on mobile/tablet so metrics below get full 100% width */}
                  <div className="md:hidden min-w-0 text-left">
                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-tight break-words">
                      {holdingTeam.name}
                    </h3>
                    <p className="text-xs text-[#a1b3cb] font-semibold">
                      Official ZPL Franchise
                    </p>
                  </div>
                </div>

                {/* Team Name (md+) & Full-Width Stats Strip */}
                <div className="w-full flex-1 min-w-0 flex flex-col justify-center space-y-2 text-left">
                  <h3 className="hidden md:block text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight break-words">
                    {holdingTeam.name}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-stretch">
                    <div className="rounded-xl bg-[#060d17] border border-[#162b4a] p-2.5 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#a1b3cb] block mb-0.5 whitespace-nowrap">
                        Purse Left
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-black text-emerald-400 block leading-tight tabular-nums whitespace-nowrap">
                        ₹ {holdingTeam.remainingPurse?.toLocaleString() ?? 0}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#060d17] border border-[#162b4a] p-2.5 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#a1b3cb] block mb-0.5 whitespace-nowrap">
                        Squad
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-black text-white block leading-tight tabular-nums whitespace-nowrap">
                        {holdingTeam.purchasedPlayerCount ?? 0} / 15
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#060d17] border border-[#162b4a] p-2.5 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#a1b3cb] block mb-0.5 whitespace-nowrap">
                        Spent
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-black text-[#f5d77f] block leading-tight tabular-nums whitespace-nowrap">
                        ₹ {(holdingTeam.totalSpent ?? 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#f5d77f]/15 border border-[#f5d77f]/70 p-2.5 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-black uppercase tracking-wide text-[#f5d77f] block mb-0.5 whitespace-nowrap">
                        {isSold ? 'Final Bid' : 'Active Bid'}
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-black text-white block leading-tight tabular-nums whitespace-nowrap">
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
                className={`flex-1 px-4 py-5 sm:py-6 text-center flex flex-col items-center justify-center gap-1.5 ${
                  isProjectorMode ? 'min-h-[84px]' : 'min-h-[104px]'
                }`}
              >
                <p className="text-sm sm:text-base md:text-lg font-black text-white tracking-wide leading-snug text-balance">
                  No Bids Came for{' '}
                  <span className="text-[#f5d77f] uppercase">{playerName}</span>
                </p>
                <p className="text-xs sm:text-sm text-[#a1b3cb] font-medium">
                  Base Price:{' '}
                  <span className="text-[#fff4c2] font-bold tabular-nums">₹ {basePoints} PTS</span>
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
