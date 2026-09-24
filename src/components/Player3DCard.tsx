import { useState } from 'react';
import type { PlayerRole } from '../types/auction';
import { Shield, Target, Zap, Award, Sparkles, Users } from 'lucide-react';
import { SocialFollowStrip } from './SocialFollowStrip';

interface Player3DCardProps {
  name: string;
  role: PlayerRole;
  photoUrl: string;
  basePoints: number;
  currentPoints?: number;
  status: 'idle' | 'bidding' | 'sold' | 'unsold';
  winningTeamName?: string | null;
  winningTeamLogo?: string | null;
  round?: 'regular' | 'unsold';
  isProjectorMode?: boolean;
}

export function Player3DCard({
  name,
  role,
  photoUrl,
  basePoints,
  currentPoints,
  status,
  winningTeamName,
  winningTeamLogo,
  round,
  isProjectorMode = false,
}: Player3DCardProps) {
  const [imageError, setImageError] = useState(false);

  // Role icon helper
  const getRoleIcon = (roleName: PlayerRole) => {
    switch (roleName) {
      case 'Batsman':
        return <Shield className="w-5 h-5 text-amber-500" />;
      case 'Bowler':
        return <Target className="w-5 h-5 text-amber-400" />;
      case 'All-Rounder':
        return <Zap className="w-5 h-5 text-emerald-500" />;
      case 'Wicket-Keeper':
        return <Award className="w-5 h-5 text-purple-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-orange-500" />;
    }
  };

  // Border glow and accent based on status
  const getCardStatusBorder = () => {
    if (status === 'sold') {
      return 'border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/60';
    }
    if (status === 'unsold') {
      return 'border-2 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.35)] ring-2 ring-red-500/60';
    }
    return 'border border-zinc-800 shadow-2xl shadow-black/90 hover:border-amber-400/60';
  };

  return (
    <div
      className={`relative w-full transition-all duration-700 ease-out perspective-1000 ${
        isProjectorMode ? 'max-w-2xl mx-auto' : 'max-w-xl mx-auto'
      }`}
    >
      {/* 3D Dynamic Card Container (Black & Gold Theme) */}
      <div
        className={`relative w-full rounded-3xl bg-gradient-to-b from-zinc-950 via-black to-zinc-950 backdrop-blur-xl transition-transform duration-500 preserve-3d animate-float-card ${
          isProjectorMode ? 'p-3 sm:p-4 md:p-5' : 'p-5 sm:p-7 md:p-8'
        } ${getCardStatusBorder()}`}
      >
        {/* Top Crisp Glowing Highlight */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-90 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />

        {/* Round Badge (Regular vs Unsold Round) */}
        {round === 'unsold' && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-white/50 z-20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            Unsold Player Round
          </div>
        )}

        {/* Player Image Showcase */}
        <div className={`relative w-full flex justify-center ${isProjectorMode ? 'mb-2 sm:mb-3' : 'mb-6'}`}>
          <div
            className={`relative rounded-2xl overflow-hidden shadow-xl bg-black border-2 ${
              status === 'sold'
                ? 'border-emerald-500 shadow-emerald-950/40'
                : status === 'unsold'
                ? 'border-red-500 shadow-red-950/40'
                : 'border-zinc-800 shadow-black/80 hover:border-amber-400/50'
            } ${
              isProjectorMode
                ? 'h-40 sm:h-48 md:h-56 lg:h-64 max-h-[30vh] aspect-square'
                : 'w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72'
            }`}
          >
            {!imageError ? (
              <img
                src={photoUrl}
                alt={name}
                onError={() => setImageError(true)}
                className="w-full h-full object-contain object-top select-none transition-transform duration-700 hover:scale-105"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black text-zinc-400 p-4 text-center">
                <Shield className="w-16 h-16 text-amber-400 mb-2 opacity-60 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                <span className="text-sm font-semibold text-zinc-300">{name}</span>
              </div>
            )}

            {/* Gradient shadow overlay at bottom of photo */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Role tag over photo */}
            <div className="absolute top-2.5 right-2.5 px-3 py-1 rounded-xl bg-black/95 border border-amber-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-md">
              {getRoleIcon(role)}
              <span className="text-xs font-black tracking-wide text-amber-400">
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* Player Identity & Base Points */}
        <div className={`text-center ${isProjectorMode ? 'space-y-1.5' : 'space-y-3'}`}>
          <h2
            className={`font-black tracking-tight text-white drop-shadow-md leading-tight uppercase ${
              isProjectorMode
                ? 'text-2xl sm:text-3xl md:text-4xl'
                : 'text-2xl sm:text-3xl md:text-4xl'
            }`}
          >
            {name}
          </h2>

          {/* Base Points & Current Bid Points Row */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 pt-0.5 flex-wrap">
            <div className={`rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center shadow-xs ${
              isProjectorMode ? 'px-3.5 py-1.5 min-w-[100px]' : 'px-5 py-2.5 min-w-[130px]'
            }`}>
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-zinc-400">
                Base Points
              </span>
              <span className={`font-black text-amber-400 ${isProjectorMode ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
                {basePoints}
              </span>
            </div>

            <div className={`rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-black border border-amber-300/70 flex flex-col items-center shadow-lg shadow-amber-500/20 ${
              isProjectorMode ? 'px-3.5 py-1.5 min-w-[120px]' : 'px-5 py-2.5 min-w-[150px]'
            }`}>
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-black text-black">
                {status === 'sold' ? 'Highest Bid' : 'Current Points'}
              </span>
              <span
                className={`font-black text-black ${isProjectorMode ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}
              >
                {currentPoints !== undefined ? currentPoints : basePoints}{' '}
                <span className="text-xs font-bold text-black/80">PTS</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Status Presentation */}
        <div className={`border-t border-zinc-800 ${isProjectorMode ? 'mt-3 pt-2' : 'mt-6 pt-4'}`}>
          {status === 'sold' && (
            <div className={`animate-pulse-sold rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-center shadow-xl ${
              isProjectorMode ? 'p-3 space-y-2' : 'p-5 sm:p-7 space-y-4'
            }`}>
              <div className={`inline-block rounded-full bg-emerald-600 text-white font-black tracking-widest uppercase shadow-md shadow-emerald-950/50 ${
                isProjectorMode ? 'px-5 py-1 text-lg sm:text-xl' : 'px-8 py-2 text-2xl sm:text-3xl md:text-4xl'
              }`}>
                SOLD
              </div>
              <div className="space-y-1">
                <p className={`font-black text-white tracking-wide uppercase ${isProjectorMode ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl md:text-3xl'}`}>
                  {name} SOLD TO <span className="text-emerald-300">{winningTeamName || 'WINNING TEAM'}</span>
                </p>
                <div className="flex items-center justify-center gap-2 pt-0.5">
                  {winningTeamLogo && (
                    <img
                      src={winningTeamLogo}
                      alt={winningTeamName || 'Team'}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-emerald-400 shadow-sm bg-black"
                    />
                  )}
                  <span className={`font-black text-emerald-400 ${isProjectorMode ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'}`}>
                    Highest Bid: {currentPoints ?? basePoints} PTS
                  </span>
                </div>
              </div>
            </div>
          )}

          {status === 'unsold' && (
            <div className={`animate-pulse-unsold rounded-2xl bg-rose-950/80 border-2 border-red-500 text-center shadow-xl ${
              isProjectorMode ? 'p-3 space-y-1.5' : 'p-5 sm:p-7 space-y-3'
            }`}>
              <div className={`inline-block rounded-full bg-red-600 text-white font-black tracking-widest uppercase shadow-md shadow-red-950/50 ${
                isProjectorMode ? 'px-5 py-1 text-lg sm:text-xl' : 'px-8 py-2 text-2xl sm:text-3xl md:text-4xl'
              }`}>
                UNSOLD
              </div>
              <p className={`font-black text-white tracking-wide uppercase ${isProjectorMode ? 'text-base sm:text-xl' : 'text-xl sm:text-2xl md:text-3xl'}`}>
                {name} UNSOLD
              </p>
              <p className="text-[11px] sm:text-xs font-semibold text-rose-300">
                Player will enter the Unsold Player Round after regular bidding completes.
              </p>
            </div>
          )}

          {status === 'bidding' && (
            <div className={`rounded-2xl bg-zinc-950 border border-zinc-800 text-center shadow-xs ${
              isProjectorMode ? 'p-2.5 sm:p-3' : 'p-4 sm:p-5'
            }`}>
              {winningTeamName ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-white text-sm sm:text-base">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs">
                    Highest Bidder:
                  </span>
                  <span className="font-black text-amber-400 text-base sm:text-lg">
                    {winningTeamName}
                  </span>
                  <span className="text-emerald-400 font-black text-base sm:text-lg">
                    ({currentPoints} PTS)
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-zinc-300 text-xs sm:text-sm font-bold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                  </span>
                  Bidding in progress &bull; Base Price {basePoints} PTS
                </div>
              )}
            </div>
          )}

          {status === 'idle' && (
            <div className="text-center py-1 text-zinc-400 text-xs sm:text-sm font-medium">
              Waiting for bidding to open...
            </div>
          )}

          {/* SOCIAL MEDIA FOOTER STRIP IN AUCTION CARD */}
          <SocialFollowStrip variant="dark" className={isProjectorMode ? 'mt-2' : 'mt-4'} />
        </div>
      </div>
    </div>
  );
}
