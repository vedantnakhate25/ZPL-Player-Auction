import { useState, useEffect } from 'react';
import {
  db,
  doc,
  collection,
  query,
  where,
  onSnapshot
} from '../lib/firebase';
import type { Auction, Team, Player } from '../types/auction';
import { SocialFollowStrip } from '../components/SocialFollowStrip';
import {
  Users,
  Coins,
  Shield,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Share2,
  ExternalLink,
  Trophy
} from 'lucide-react';

interface AdminAuctionResultsProps {
  auctionId: string;
  onBack: () => void;
}

export function AdminAuctionResults({ auctionId, onBack }: AdminAuctionResultsProps) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auctionId) return;

    // Fail-safe timer so loading never hangs
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Auction
    const unsubAuction = onSnapshot(
      doc(db, 'auctions', auctionId),
      (snap) => {
        if (snap.exists()) setAuction({ id: snap.id, ...snap.data() } as Auction);
        setLoading(false);
      },
      (err) => {
        console.warn('Auction report fetch notice:', err);
        setLoading(false);
      }
    );

    // Teams
    const qTeams = query(collection(db, 'teams'), where('auctionId', '==', auctionId));
    const unsubTeams = onSnapshot(
      qTeams,
      (snap) => {
        const list: Team[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Team));
        list.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
        setTeams(list);
      },
      (err) => console.warn('Report teams notice:', err)
    );

    // Players
    const qPlayers = query(collection(db, 'players'), where('auctionId', '==', auctionId));
    const unsubPlayers = onSnapshot(
      qPlayers,
      (snap) => {
        const list: Player[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Player));
        setPlayers(list);
      },
      (err) => console.warn('Report players notice:', err)
    );

    return () => {
      clearTimeout(timer);
      unsubAuction();
      unsubTeams();
      unsubPlayers();
    };
  }, [auctionId]);

  const soldPlayers = players.filter((p) => p.status === 'sold');
  const unsoldPlayers = players.filter((p) => p.status === 'unsold');
  const totalSpentAcrossAllTeams = teams.reduce((acc, t) => acc + (t.totalSpent || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 selection:bg-amber-400 selection:text-black">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-200 hover:text-white transition-colors shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="p-2.5 rounded-2xl bg-zinc-950 border border-amber-500/30 text-amber-400 shadow-md">
              <Trophy className="w-6 h-6 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </div>
            <div>
              <span className="text-xs uppercase font-black tracking-wider text-amber-400 block">
                Official Report
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {auction?.name || 'Auction'} Results & Rosters
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`?auction=${auctionId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-amber-500/30 text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Public Screen</span>
            </a>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1 shadow-xs">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Total Players
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {players.length}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-1 shadow-xs">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block">
              Players Sold
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {soldPlayers.length}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/40 border border-rose-800/60 space-y-1 shadow-xs">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider block">
              Players Unsold
            </span>
            <span className="text-2xl sm:text-3xl font-black text-rose-400">
              {unsoldPlayers.length}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1 shadow-xs">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
              Total Points Spent
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {totalSpentAcrossAllTeams} <span className="text-sm font-normal text-zinc-400">PTS</span>
            </span>
          </div>
        </div>

        {/* TEAM ROSTERS BREAKDOWN */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>Team Rosters & Purchases</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.map((team) => {
              const teamPlayers = players.filter((p) => p.soldToTeamId === team.id);

              return (
                <div
                  key={team.id}
                  className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 sm:p-6 space-y-4 shadow-sm"
                >
                  {/* Team Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md bg-black"
                      />
                      <div>
                        <h3 className="font-black text-white text-lg">
                          {team.name}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Purchased: <strong className="text-amber-400">{teamPlayers.length}</strong> players
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-zinc-400 block">
                        Remaining Purse
                      </span>
                      <span className="text-lg font-black text-emerald-400">
                        {team.remainingPurse} PTS
                      </span>
                      <span className="block text-[11px] text-zinc-500">
                        Spent: {team.totalSpent || 0} PTS
                      </span>
                    </div>
                  </div>

                  {/* Team Players List */}
                  {teamPlayers.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center italic">
                      No players acquired by this team yet.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {teamPlayers.map((tp) => (
                        <div
                          key={tp.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-black border border-zinc-800 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={tp.photoUrl}
                              alt={tp.name}
                              className="w-9 h-9 rounded-lg object-cover object-top border border-zinc-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-black text-white truncate">
                                {tp.name}
                              </p>
                              <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                                {tp.role}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-black text-emerald-400">
                              {tp.soldPoints} PTS
                            </span>
                            <span className="block text-[10px] text-zinc-500">
                              Base: {tp.basePoints}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* UNSOLD PLAYERS SECTION */}
        {unsoldPlayers.length > 0 && (
          <div className="rounded-3xl bg-zinc-950 border border-rose-900/60 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-rose-900/40">
              <h2 className="text-xl font-black text-rose-400 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Unsold Players ({unsoldPlayers.length})</span>
              </h2>
              <span className="text-xs text-zinc-400">
                Remained unpurchased at conclusion
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {unsoldPlayers.map((up) => (
                <div
                  key={up.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-black border border-rose-900/40 text-xs"
                >
                  <img
                    src={up.photoUrl}
                    alt={up.name}
                    className="w-10 h-10 rounded-lg object-cover object-top border border-rose-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-white truncate block">
                      {up.name}
                    </span>
                    <span className="text-[10px] text-zinc-400">{up.role}</span>
                    <span className="block text-[10px] text-rose-300 font-bold mt-0.5">
                      Base: {up.basePoints} PTS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOCIAL STRIP */}
        <SocialFollowStrip variant="dark" className="mt-8" />
      </div>
    </div>
  );
}
