import React, { useState, useEffect, useMemo } from 'react';
import type { Team, Player } from '../types/auction';
import {
  Coins,
  Users,
  X,
  Wallet,
  ChevronRight,
  UserCheck,
  Award,
  Shield
} from 'lucide-react';
import { SocialFollowStrip } from './SocialFollowStrip';

interface TeamPurseBoardProps {
  teams: Team[];
  players?: Player[];
  activeWinningTeamId?: string | null;
  isProjectorMode?: boolean;
}

function TeamPurseBoardComponent({
  teams,
  players = [],
  activeWinningTeamId,
  isProjectorMode = false
}: TeamPurseBoardProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Close modal on Escape key and prevent background scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTeam(null);
      }
    };
    if (selectedTeam) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedTeam]);

  if (teams.length === 0) {
    return (
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 text-center text-zinc-400">
        <p>No teams registered yet.</p>
      </div>
    );
  }

  // Precompute team bought player count map with useMemo for O(1) lookups without render lag
  const teamBoughtCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!Array.isArray(players)) return map;
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p && p.status === 'sold') {
        if (p.soldToTeamId) {
          map[p.soldToTeamId] = (map[p.soldToTeamId] || 0) + 1;
        }
        if (typeof p.soldToTeamName === 'string' && p.soldToTeamName.trim()) {
          const key = p.soldToTeamName.trim().toLowerCase();
          map[key] = (map[key] || 0) + 1;
        }
      }
    }
    return map;
  }, [players]);

  // Calculate players bought for the selected team (memoized)
  const selectedTeamPlayers = useMemo(() => {
    if (!selectedTeam) return [];
    return players.filter(
      (p) =>
        p.status === 'sold' &&
        (p.soldToTeamId === selectedTeam.id || p.soldToTeamName === selectedTeam.name)
    );
  }, [selectedTeam, players]);

  // Sort bought players by soldPoints descending (memoized)
  const sortedBoughtPlayers = useMemo(() => {
    return [...selectedTeamPlayers].sort(
      (a, b) => (b.soldPoints ?? b.basePoints) - (a.soldPoints ?? a.basePoints)
    );
  }, [selectedTeamPlayers]);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3
            className={`font-black uppercase tracking-wider text-white ${
              isProjectorMode ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
            }`}
          >
            Team Purses & Squads
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 hidden sm:inline-block font-medium">
            Click team to view squad
          </span>
          <span className="text-xs text-amber-400 font-bold px-2.5 py-0.5 rounded-full bg-zinc-950 border border-zinc-800">
            {teams.length} Teams
          </span>
        </div>
      </div>

      <div
        className={`grid gap-2.5 ${
          isProjectorMode
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2.5 max-h-[46vh] overflow-y-auto pr-1'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'
        }`}
      >
        {teams.map((team) => {
          const isWinning = team && team.id === activeWinningTeamId;
          const remainingPurse = typeof team?.remainingPurse === 'number' ? team.remainingPurse : (team?.purse || 0);
          const totalPurse = typeof team?.purse === 'number' && team.purse > 0 ? team.purse : 1000;
          const pursePercent = Math.max(
            0,
            Math.min(100, Math.round((remainingPurse / totalPurse) * 100))
          ) || 0;

          const teamNameKey = typeof team?.name === 'string' ? team.name.trim().toLowerCase() : '';
          const teamBoughtCount = players.length > 0
            ? (teamBoughtCountMap[team.id] ?? (teamNameKey ? teamBoughtCountMap[teamNameKey] : 0) ?? 0)
            : (team.purchasedPlayerCount || 0);

          return (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              type="button"
              className={`group text-left w-full relative overflow-hidden rounded-2xl border transition-all duration-200 p-3.5 sm:p-4 cursor-pointer focus:outline-none hover:scale-[1.01] active:scale-[0.99] ${
                isWinning
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black border-amber-300 ring-2 ring-amber-400/80 shadow-xl'
                  : 'bg-zinc-950 border-zinc-800 hover:border-amber-400/60 hover:bg-zinc-900 shadow-md text-white'
              }`}
              title={`Click to view players bought by ${team.name}`}
            >
              {/* Top indicator if active highest bidder */}
              {isWinning && (
                <div className="absolute top-0 right-0 px-3 py-0.5 bg-black text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-bl-xl shadow-sm border-b border-l border-amber-400/40">
                  Highest Bidder
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Team Logo */}
                <div className="relative shrink-0">
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className={`rounded-full object-cover border-2 shadow-sm bg-black transition-transform group-hover:scale-105 ${
                      isWinning ? 'border-black ring-2 ring-black' : 'border-amber-500/40'
                    } ${isProjectorMode ? 'w-14 h-14' : 'w-11 h-11 sm:w-12 sm:h-12'}`}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`font-black truncate transition-colors uppercase ${
                        isWinning
                          ? 'text-black'
                          : 'text-white group-hover:text-amber-400'
                      } ${
                        isProjectorMode
                          ? 'text-lg sm:text-xl'
                          : 'text-sm sm:text-base'
                      }`}
                    >
                      {team.name}
                    </h4>
                    <div className="text-right shrink-0">
                      <span
                        className={`font-black ${
                          isWinning
                            ? 'text-black'
                            : remainingPurse < 150
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        } ${isProjectorMode ? 'text-lg sm:text-xl' : 'text-base'}`}
                      >
                        {remainingPurse}{' '}
                        <span className={`text-[10px] font-bold ${isWinning ? 'text-black/80' : 'text-zinc-400'}`}>
                          PTS
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Purse Progress Bar */}
                  <div className={`w-full h-2 rounded-full overflow-hidden mt-2 border ${
                    isWinning ? 'bg-amber-600/50 border-amber-700/60' : 'bg-black border-zinc-800'
                  }`}>
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isWinning
                          ? 'bg-black'
                          : pursePercent < 20
                          ? 'bg-rose-500'
                          : pursePercent < 50
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${pursePercent}%` }}
                    />
                  </div>

                  {/* Bottom Stats & Click Hint */}
                  <div className={`flex items-center justify-between text-[11px] mt-2 font-medium ${
                    isWinning ? 'text-black font-bold' : 'text-zinc-400'
                  }`}>
                    <span className="flex items-center gap-1">
                      <Coins className={`w-3 h-3 ${isWinning ? 'text-black' : 'text-amber-400'}`} />
                      Purse: {team.purse}
                    </span>
                    <span className={`flex items-center gap-1 font-bold ${
                      isWinning ? 'text-black' : 'text-zinc-300 group-hover:text-white'
                    }`}>
                      <Users className="w-3.5 h-3.5" />
                      Bought: {teamBoughtCount}
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* SOCIAL MEDIA FOOTER STRIP AT BOTTOM OF TEAMS PURSE PANEL */}
      <SocialFollowStrip variant="dark" className="mt-4" />

      {/* TEAM SQUAD & REMAINING PURSE DETAILS MODAL */}
      {selectedTeam && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedTeam(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="relative p-5 sm:p-6 bg-black border-b border-zinc-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={selectedTeam.logoUrl}
                  alt={selectedTeam.name}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-amber-500/40 bg-black shadow-md shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider mb-1 shadow-xs">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Team Details</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white truncate uppercase">
                    {selectedTeam.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Squad Roster & Points Summary
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedTeam(null)}
                className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors shrink-0 shadow-xs cursor-pointer border border-zinc-700"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KEY METRICS SUMMARY ROW */}
            <div className="p-4 sm:p-5 bg-black/70 border-b border-zinc-800 grid grid-cols-2 gap-3">
              {/* Remaining Purse Points */}
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 sm:p-4 text-center space-y-1 shadow-xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Wallet className="w-3.5 h-3.5 text-amber-400" />
                  <span>Remaining Purse</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {selectedTeam.remainingPurse}{' '}
                  <span className="text-xs font-bold text-amber-400">PTS</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  out of {selectedTeam.purse} total PTS
                </p>
              </div>

              {/* Players Bought */}
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 sm:p-4 text-center space-y-1 shadow-xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Players Bought</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {sortedBoughtPlayers.length > 0
                    ? sortedBoughtPlayers.length
                    : (selectedTeam.purchasedPlayerCount || 0)}{' '}
                  <span className="text-xs font-bold text-zinc-400">
                    {sortedBoughtPlayers.length === 1 ? 'Player' : 'Players'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Spent:{' '}
                  <strong className="text-amber-400 font-bold">
                    {(selectedTeam.purse || 0) - (selectedTeam.remainingPurse || 0)} PTS
                  </strong>
                </p>
              </div>
            </div>

            {/* SQUAD / PLAYERS BOUGHT SECTION */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-zinc-950">
              <div className="flex items-center justify-between pb-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>
                    Purchased Players ({sortedBoughtPlayers.length})
                  </span>
                </h4>
                {sortedBoughtPlayers.length > 0 && (
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Sorted by Bid Price
                  </span>
                )}
              </div>

              {sortedBoughtPlayers.length === 0 ? (
                <div className="rounded-2xl bg-black border border-zinc-800 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto text-amber-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h5 className="text-base font-bold text-white">
                    No Players Bought Yet
                  </h5>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    This team has not acquired any players so far in this auction. Full purse of{' '}
                    <strong className="text-amber-400">{selectedTeam.purse} PTS</strong> is currently available.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedBoughtPlayers.map((player) => {
                    const roleColor =
                      player.role === 'Batsman'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                        : player.role === 'Bowler'
                        ? 'bg-zinc-900 text-amber-300 border-zinc-700'
                        : player.role === 'All-Rounder'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                        : 'bg-zinc-900 text-amber-400 border-amber-500/40';

                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-black border border-zinc-800 hover:border-amber-400/40 transition-colors shadow-xs"
                      >
                        {/* Player Photo & Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={player.photoUrl}
                            alt={player.name}
                            className="w-11 h-11 rounded-xl object-cover border border-zinc-800 bg-zinc-900 shrink-0 shadow-xs"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <h5 className="text-sm font-black text-white truncate uppercase">
                              {player.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleColor}`}
                              >
                                {player.role}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                Base: {player.basePoints} PTS
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Sold Price */}
                        <div className="text-right shrink-0">
                          <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs sm:text-sm shadow-xs">
                            {player.soldPoints ?? player.basePoints} PTS
                          </div>
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block mt-0.5">
                            Purchased
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-black border-t border-zinc-800 flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                Purse Remaining:{' '}
                <strong className="text-amber-400 font-bold">
                  {selectedTeam.remainingPurse} / {selectedTeam.purse} PTS
                </strong>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 font-black text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const TeamPurseBoard = React.memo(TeamPurseBoardComponent);
