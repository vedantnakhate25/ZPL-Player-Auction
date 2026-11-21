import { useState, useEffect } from 'react';
import { db, collection, onSnapshot } from '../lib/firebase';
import type { Auction } from '../types/auction';
import { Calendar, Clock, ArrowRight, Shield, Trophy } from 'lucide-react';
import { SocialFollowStrip } from '../components/SocialFollowStrip';
import { ZPLAuctionStageHero } from '../components/ZPLAuctionStageHero';

interface PublicAuctionListProps {
  onSelectAuction: (auctionId: string) => void;
  onNavigateAdmin: () => void;
}

export function PublicAuctionList({
  onSelectAuction,
  onNavigateAdmin
}: PublicAuctionListProps) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 6000);

    const unsub = onSnapshot(
      collection(db, 'auctions'),
      (snap) => {
        const list: Auction[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Auction));
        const orderWeight: Record<string, number> = {
          live: 0,
          paused: 1,
          scheduled: 2,
          completed: 3
        };
        list.sort((a, b) => {
          const wA = orderWeight[a.status] ?? 4;
          const wB = orderWeight[b.status] ?? 4;
          if (wA !== wB) return wA - wB;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setAuctions(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Auctions live list notice:', err);
        setLoading(false);
      }
    );
    return () => {
      window.clearTimeout(timer);
      unsub();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#060c16] text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between selection:bg-[#f5d77f] selection:text-[#060c16]">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <ZPLAuctionStageHero
          auctions={auctions}
          onSelectAuction={onSelectAuction}
          onNavigateAdmin={onNavigateAdmin}
        />

        {/* AUCTIONS LIST */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#162b4a] pb-3">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              Auctions ({auctions.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-14 text-center">
              <div className="w-10 h-10 border-4 border-[#f5d77f] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[#a1b3cb] text-sm font-medium">Loading live auctions...</p>
            </div>
          ) : auctions.length === 0 ? (
            <div className="rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#060c16] border border-[#f5d77f]/35 flex items-center justify-center mx-auto text-[#f5d77f]">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white">No Auctions Hosted Yet</h3>
              <p className="text-[#a1b3cb] text-sm max-w-md mx-auto">
                No active or scheduled auctions are available right now. Officials can sign into the Admin Desk to create an auction.
              </p>
              <button
                onClick={onNavigateAdmin}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#fae29c] via-[#f5d77f] to-[#e0bc50] text-[#060c16] font-black text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Desk</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auctions.map((auc) => (
                <button
                  key={auc.id}
                  type="button"
                  onClick={() => onSelectAuction(auc.id)}
                  className="group text-left cursor-pointer rounded-2xl bg-[#0a1526] hover:bg-[#0e1f38] border border-[#f5d77f]/25 hover:border-[#f5d77f]/65 p-5 sm:p-6 transition-colors flex flex-col justify-between gap-4 text-white"
                >
                  <div className="space-y-2.5 w-full">
                    <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider">
                      <span
                        className={
                          auc.status === 'live'
                            ? 'text-red-400 font-black'
                            : auc.status === 'paused'
                            ? 'text-[#f5d77f] font-black'
                            : auc.status === 'completed'
                            ? 'text-emerald-400 font-black'
                            : 'text-[#a1b3cb]'
                        }
                      >
                        {auc.status === 'live' ? '● Live Now' : auc.status}
                      </span>
                      {auc.round === 'unsold' && (
                        <span className="text-rose-400 font-bold">Unsold Round</span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-[#f5d77f] transition-colors leading-snug">
                      {auc.name}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-[#a1b3cb] font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#f5d77f]" />
                        {auc.date}
                      </span>
                      <span aria-hidden="true">&middot;</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#f5d77f]" />
                        {auc.time}
                      </span>
                    </div>
                  </div>

                  <div className="w-full pt-3 border-t border-[#162b4a] flex items-center justify-between text-xs text-[#f5d77f] font-black">
                    <span>Open Live Screen</span>
                    <ArrowRight className="w-4 h-4 text-[#f5d77f] group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <SocialFollowStrip variant="dark" />
      </div>

      <footer className="max-w-6xl mx-auto w-full pt-6 mt-10 border-t border-[#162b4a] flex items-center justify-center gap-2 text-xs text-[#a1b3cb]">
        <Trophy className="w-4 h-4 text-[#f5d77f]" />
        <span className="font-bold text-white">ZPL &middot; Zhep Premier League (Zhep Krida Mandal)</span>
      </footer>
    </div>
  );
}

export default PublicAuctionList;
