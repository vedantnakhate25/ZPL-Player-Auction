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
import { exportAuctionResultsToExcel } from '../lib/exportAuctionExcel';
import {
  Shield,
  XCircle,
  ChevronLeft,
  ExternalLink,
  FileSpreadsheet
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
      <div className="min-h-screen bg-[#060c16] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#f5d77f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060c16] text-white p-4 sm:p-6 lg:p-8 selection:bg-[#f5d77f] selection:text-[#060c16]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f5d77f]/20">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-[#0a1526] border border-[#f5d77f]/30 hover:bg-[#0f1d33] text-[#fff4c2] hover:text-white transition-colors shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-[#0a1526] border border-[#f5d77f]/40 p-1 flex items-center justify-center shadow-lg ring-1 ring-[#f5d77f]/30 shrink-0 overflow-hidden">
              <img
                src="/assets/aistudio/file_00000000661882118ee895643705c2c1_2d4830dd.png"
                alt="ZPL Official Tournament Crest"
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(245,215,127,0.3)]"
              />
            </div>
            <div>
              <span className="text-xs uppercase font-black tracking-wider text-[#f5d77f] block">
                Official Report
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {auction?.name || 'Auction'} Results &amp; Rosters
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => exportAuctionResultsToExcel(auction, teams, players)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#fff4c2] via-[#f5d77f] to-[#e0bc50] hover:from-white hover:to-[#f5d77f] text-[#060c16] text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg transition-transform active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 stroke-[2.2]" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <a
              href={`?auction=${auctionId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0a1526] hover:bg-[#0f1d33] border border-[#f5d77f]/40 text-xs sm:text-sm font-bold text-[#f5d77f] hover:text-white transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4 text-[#f5d77f]" />
              <span>Public Screen</span>
            </a>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0a1526] border border-[#f5d77f]/25 space-y-1 shadow-sm">
            <span className="text-xs font-semibold text-[#f5d77f]/80 uppercase tracking-wider block">
              Total Players
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {players.length}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#0a2318] border border-emerald-500/40 space-y-1 shadow-sm">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block">
              Players Sold
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {soldPlayers.length}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#250d18] border border-rose-500/40 space-y-1 shadow-sm">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider block">
              Players Unsold
            </span>
            <span className="text-2xl sm:text-3xl font-black text-rose-400">
              {unsoldPlayers.length}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#0a1526] border border-[#f5d77f]/40 space-y-1 shadow-sm">
            <span className="text-xs font-semibold text-[#f5d77f] uppercase tracking-wider block">
              Total Points Spent
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#f5d77f]">
              {totalSpentAcrossAllTeams} <span className="text-sm font-normal text-white/70">PTS</span>
            </span>
          </div>
        </div>

        {/* TEAM ROSTERS BREAKDOWN */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[#f5d77f]" />
            <span>Team Rosters &amp; Purchases</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.map((team) => {
              const teamPlayers = players.filter((p) => p.soldToTeamId === team.id);

              return (
                <div
                  key={team.id}
                  className="rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-5 sm:p-6 space-y-4 shadow-md"
                >
                  {/* Team Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#f5d77f]/15">
                    <div className="flex items-center gap-3">
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#f5d77f] shadow-md bg-[#060c16]"
                      />
                      <div>
                        <h3 className="font-black text-white text-lg">
                          {team.name}
                        </h3>
                        <p className="text-xs text-white/70">
                          Purchased: <strong className="text-[#f5d77f]">{teamPlayers.length}</strong> players
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-[#f5d77f]/80 block">
                        Remaining Purse
                      </span>
                      <span className="text-lg font-black text-emerald-400">
                        {team.remainingPurse} PTS
                      </span>
                      <span className="block text-[11px] text-white/60">
                        Spent: {team.totalSpent || 0} PTS
                      </span>
                    </div>
                  </div>

                  {/* Team Players List */}
                  {teamPlayers.length === 0 ? (
                    <p className="text-xs text-white/50 py-4 text-center italic">
                      No players acquired by this team yet.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {teamPlayers.map((tp) => (
                        <div
                          key={tp.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#060c16] border border-[#f5d77f]/20 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={tp.photoUrl}
                              alt={tp.name}
                              className="w-9 h-9 rounded-lg object-cover object-top border border-[#f5d77f]/30 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-black text-white truncate">
                                {tp.name}
                              </p>
                              <span className="text-[10px] text-[#f5d77f]/80 font-semibold uppercase">
                                {tp.role}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-black text-emerald-400">
                              {tp.soldPoints} PTS
                            </span>
                            <span className="block text-[10px] text-white/50">
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
          <div className="rounded-3xl bg-[#0a1526] border border-rose-500/40 p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
              <h2 className="text-xl font-black text-rose-400 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Unsold Players ({unsoldPlayers.length})</span>
              </h2>
              <span className="text-xs text-white/60">
                Remained unpurchased at conclusion
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {unsoldPlayers.map((up) => (
                <div
                  key={up.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#060c16] border border-rose-500/30 text-xs"
                >
                  <img
                    src={up.photoUrl}
                    alt={up.name}
                    className="w-10 h-10 rounded-lg object-cover object-top border border-rose-500/50 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-white truncate block">
                      {up.name}
                    </span>
                    <span className="text-[10px] text-white/60">{up.role}</span>
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
