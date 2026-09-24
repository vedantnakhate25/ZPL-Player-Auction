import { useState } from 'react';
import { db, doc, setDoc, handleFirestoreError, OperationType } from '../lib/firebase';
import type { Auction, AuctionState } from '../types/auction';
import {
  Calendar,
  Clock,
  Play,
  CalendarCheck,
  AlertCircle,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

interface AdminCreateAuctionProps {
  adminUid: string;
  adminEmail: string;
  onSuccess: (auctionId: string) => void;
  onCancel: () => void;
}

export function AdminCreateAuction({
  adminUid,
  adminEmail,
  onSuccess,
  onCancel
}: AdminCreateAuctionProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('19:00');
  const [mode, setMode] = useState<'immediate' | 'schedule'>('immediate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an auction name.');
      return;
    }
    if (!date || !time) {
      setError('Please specify both date and time.');
      return;
    }

    setLoading(true);
    setError(null);

    const auctionId = `auction-${Date.now()}`;
    const now = new Date().toISOString();
    const scheduledStatus = mode === 'immediate' ? 'live' : 'scheduled';

    try {
      // 1. Create Auction Doc
      const newAuction: Auction = {
        id: auctionId,
        name: name.trim(),
        date,
        time,
        status: scheduledStatus,
        adminUid,
        adminEmail,
        scheduledStartTime: `${date}T${time}:00`,
        round: 'regular',
        createdAt: now,
        updatedAt: now
      };
      await setDoc(doc(db, 'auctions', auctionId), newAuction);

      // 2. Initialize AuctionState Doc
      const initialState: AuctionState = {
        id: auctionId,
        auctionId,
        auctionName: name.trim(),
        status: scheduledStatus,
        round: 'regular',
        currentPlayerId: null,
        playerStatus: 'idle',
        currentBidPoints: 0,
        winningTeamId: null,
        winningTeamName: null,
        winningTeamLogo: null,
        winningTeamRemainingPurse: null,
        updatedAt: now
      };
      await setDoc(doc(db, 'auctionState', auctionId), initialState);

      onSuccess(auctionId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `auctions/${auctionId}`);
      setError(err instanceof Error ? err.message : 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 flex items-center justify-center selection:bg-amber-400 selection:text-black">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2.5 rounded-xl bg-zinc-950 border border-amber-500/30 hover:bg-zinc-900 text-amber-400 hover:text-amber-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Create New Cricket Auction
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Configure auction schedule and starting parameters.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Auction Name:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ZPL 2027 - Zhep Premier League Player Auction"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-black border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Auction Date:
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black border border-zinc-800 text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Auction Time:
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black border border-zinc-800 text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* TWO OPTIONS: START IMMEDIATELY OR SCHEDULE */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                Launch Option:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('immediate')}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    mode === 'immediate'
                      ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 text-white'
                      : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Play
                      className={`w-4 h-4 ${
                        mode === 'immediate' ? 'text-amber-400' : 'text-zinc-500'
                      }`}
                    />
                    <span className="font-black text-sm uppercase">
                      Start Immediately
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    Live broadcast begins immediately upon team & player setup.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('schedule')}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    mode === 'schedule'
                      ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 text-white'
                      : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarCheck
                      className={`w-4 h-4 ${
                        mode === 'schedule' ? 'text-amber-400' : 'text-zinc-500'
                      }`}
                    />
                    <span className="font-black text-sm uppercase">
                      Schedule Auction
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    Set countdown date/time. Admin can also manually start early.
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {loading ? 'Creating...' : 'Create Auction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
