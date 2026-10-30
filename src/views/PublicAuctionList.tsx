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
    // Fail-safe timer in case snapshot query is slow
    const timer = setTimeout(() => {
      setLoading(false);
    }, 6000);

    const unsub = onSnapshot(
      collection(db, 'auctions'),
      (snap) => {
        const list: Auction[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Auction));
        // Sort: Live first, then scheduled, then completed
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
      clearTimeout(timer);
      unsub();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#060c16] text-white p-3 sm:p-6 lg:p-8 flex flex-col justify-between selection:bg-[#f5d77f] selection:text-[#060c16]">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        {/* ZPL BROADCAST STAGE HERO WITH NEW OFFICIAL CREST */}
        <ZPLAuctionStageHero
          auctions={auctions}
          onSelectAuction={onSelectAuction}
          onNavigateAdmin={onNavigateAdmin}
        />

        {/* AUCTIONS GRID */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f5d77f] animate-pulse shadow-[0_0_8px_#f5d77f]" />
              Available ZPL Auctions ({auctions.length})
            </h3>
            <span className="text-xs text-[#f5d77f] font-bold px-3 py-1 rounded-full bg-[#0a1526] border border-[#f5d77f]/30">
              Live Real-Time Sync
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-[#f5d77f] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[#a1b3cb] text-sm font-medium">Connecting to live auction stream...</p>
            </div>
          ) : auctions.length === 0 ? (
            <div className="rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-10 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-[#060c16] border border-[#f5d77f]/40 flex items-center justify-center mx-auto text-[#f5d77f]">
                <Trophy className="w-8 h-8 text-[#f5d77f]" />
              </div>
              <h4 className="text-xl font-black text-white">No Auctions Hosted Yet</h4>
              <p className="text-[#a1b3cb] text-sm max-w-md mx-auto">
                No active or scheduled cricket auctions are available at this moment. Officials can log into the admin desk to seed or launch a ZPL auction.
              </p>
              <button
                onClick={onNavigateAdmin}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#fae29c] via-[#f5d77f] to-[#e0bc50] hover:from-[#fff0b8] hover:to-[#ebc860] text-[#060c16] font-black text-sm inline-flex items-center gap-2 shadow-lg shadow-amber-900/30 transition-all cursor-pointer active:scale-98"
              >
                <Shield className="w-4 h-4 text-[#060c16]" />
                <span>Admin Login &bull; Control Desk</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auctions.map((auc) => (
                <div
                  key={auc.id}
                  onClick={() => onSelectAuction(auc.id)}
                  className="group cursor-pointer rounded-3xl bg-[#0a1526] hover:bg-[#0e1f38] border border-[#f5d77f]/20 hover:border-[#f5d77f]/60 p-6 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between space-y-4 text-white"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs ${
                          auc.status === 'live'
                            ? 'bg-red-600 text-white animate-pulse'
                            : auc.status === 'paused'
                            ? 'bg-[#f5d77f] text-[#060c16] font-black'
                            : auc.status === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#0f1f35] text-[#c5d3e8] border border-[#1b3459]'
                        }`}
                      >
                        {auc.status}
                      </span>
                      {auc.round === 'unsold' && (
                        <span className="text-xs text-rose-300 font-bold bg-rose-950/80 px-2.5 py-0.5 rounded-md border border-rose-800">
                          Unsold Round
                        </span>
                      )}
                    </div>

                    <h4 className="text-xl font-black text-white group-hover:text-[#f5d77f] transition-colors">
                      {auc.name}
                    </h4>

                    <div className="flex items-center gap-4 text-xs text-[#a1b3cb] font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#f5d77f]" />
                        {auc.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#f5d77f]" />
                        {auc.time}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#13243f] flex items-center justify-between text-xs text-[#f5d77f] font-black group-hover:translate-x-1 transition-transform">
                    <span>Watch Live Screen</span>
                    <ArrowRight className="w-4 h-4 text-[#f5d77f]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SOCIAL MEDIA STRIP */}
        <SocialFollowStrip variant="dark" className="mt-8" />
      </div>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto w-full pt-8 mt-12 border-t border-[#13243f] flex items-center justify-center gap-2 text-xs text-[#a1b3cb]">
        <Trophy className="w-4 h-4 text-[#f5d77f]" />
        <span className="font-bold text-white">ZPL &bull; ZHEP PREMIER LEAGUE (ZHEP KRIDA MANDAL)</span>
      </footer>
    </div>
  );
}

export default PublicAuctionList;
