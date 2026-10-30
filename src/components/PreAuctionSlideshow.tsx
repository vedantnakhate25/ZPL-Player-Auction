import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Auction, Team, PreAuctionPhoto } from '../types/auction';
import {
  Shield,
  Sparkles,
  Calendar,
  Instagram,
  Facebook,
  ExternalLink,
  Share2,
  Trophy
} from 'lucide-react';

interface PreAuctionSlideshowProps {
  auction: Auction;
  teams: Team[];
  isProjectorMode?: boolean;
}

function PreAuctionSlideshowComponent({
  auction,
  teams,
  isProjectorMode = false
}: PreAuctionSlideshowProps) {
  const slides: PreAuctionPhoto[] = useMemo(() => {
    const adminPhotos = auction.preAuctionPhotos || [];
    const list: PreAuctionPhoto[] = [];

    if (adminPhotos.length > 0) {
      list.push(...adminPhotos);
    } else {
      list.push({
        id: 'default-champion-1',
        title: 'Last Year Defending Champions 🏆',
        category: 'champion',
        url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
        caption: 'Honoring the reigning champions of Zhep Krida Mandal Cricket League'
      });

      teams.forEach((team) => {
        list.push({
          id: `team-logo-${team.id}`,
          title: team.name,
          category: 'team_logo',
          url: team.logoUrl,
          caption: `This Year's Contender • Starting Purse: ${team.purse} PTS`
        });
      });
    }

    // CONCLUDING SOCIAL MEDIA SHOWCASE SLIDE
    list.push({
      id: 'social-follow-finale-slide',
      title: 'Follow Zhep Krida Mandal on Social Media',
      category: 'custom',
      url: 'social-slide',
      caption: 'Official Instagram & Facebook Channels • Live Auction Scores, Roster Announcements & Photos'
    });

    return list;
  }, [auction.preAuctionPhotos, teams]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, slides.length));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5500);

    return () => {
      clearInterval(interval);
    };
  }, [slides.length, nextSlide]);

  const currentSlide = slides[currentIndex] || slides[0];
  const isSocialSlide = currentSlide?.url === 'social-slide' || currentSlide?.id === 'social-follow-finale-slide';

  return (
    <div
      className={`w-full ${
        isProjectorMode
          ? 'h-full flex-1 min-h-0 flex flex-col justify-between'
          : 'max-w-5xl mx-auto space-y-4'
      } animate-in fade-in duration-300`}
    >
      {/* TOP COUNTDOWN / PRE-AUCTION HEADER */}
      {!isProjectorMode && (
        <div className="rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#060c16] border border-[#f5d77f]/40 shadow-xs">
              <Trophy className="w-6 h-6 text-[#f5d77f] drop-shadow-[0_0_8px_rgba(245,215,127,0.5)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#fae29c] via-[#f5d77f] to-[#e0bc50] text-[#060c16] text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-[#060c16]" />
                  <span>Pre-Auction Broadcast</span>
                </span>
                <span className="text-xs font-bold text-[#f5d77f]">
                  Starts Soon
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {auction.name}
              </h2>
            </div>
          </div>

          {/* SCHEDULE BADGE */}
          <div className="flex items-center gap-3 bg-[#060c16] border border-[#13243f] px-4 py-2 rounded-2xl shadow-sm self-start sm:self-auto">
            <Calendar className="w-4 h-4 text-[#f5d77f] shrink-0" />
            <div className="text-xs">
              <span className="text-[#a1b3cb] font-semibold block">
                Scheduled Live Time
              </span>
              <span className="font-black text-white">
                {auction.date} &bull; {auction.time}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CAROUSEL SHOWCASE */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0a1526] via-[#060c16] to-[#0a1526] border border-[#f5d77f]/25 shadow-2xl ${
          isProjectorMode
            ? 'w-full flex-1 min-h-0 h-full flex flex-col'
            : 'h-[520px] sm:h-[590px] md:h-[640px]'
        }`}
      >
        {/* SLIDE WITH SMOOTH GPU-ACCELERATED TRANSITION */}
        {currentSlide && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id + '-' + currentIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{ willChange: 'opacity, transform' }}
              className={`absolute inset-0 flex flex-col items-center justify-between min-h-0 overflow-hidden ${
                isProjectorMode ? 'p-2 sm:p-3 md:p-4' : 'p-4 sm:p-6 md:p-8'
              }`}
            >
              {/* TOP ROW: CATEGORY PILL & LIVE STATUS */}
              <div className="w-full flex items-center justify-between z-20 shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${
                    isSocialSlide
                      ? 'bg-gradient-to-r from-[#fae29c] via-[#f5d77f] to-[#e0bc50] text-[#060c16]'
                      : currentSlide.category === 'champion'
                      ? 'bg-gradient-to-r from-[#fae29c] via-[#f5d77f] to-[#e0bc50] text-[#060c16] font-black'
                      : currentSlide.category === 'team_logo'
                      ? 'bg-[#081220] text-[#f5d77f] border border-[#f5d77f]/40'
                      : 'bg-[#081220] text-white border border-[#13243f]'
                  }`}
                >
                  {isSocialSlide ? (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[#060c16]" />
                      <span>Official Social Channels</span>
                    </>
                  ) : currentSlide.category === 'champion' ? (
                    <>
                      <Trophy className="w-3.5 h-3.5 text-[#060c16] mr-0.5" />
                      <span>Last Year Champion</span>
                    </>
                  ) : currentSlide.category === 'team_logo' ? (
                    <>
                      <Shield className="w-3.5 h-3.5 text-[#f5d77f]" />
                      <span>Official Team Logo</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#f5d77f]" />
                      <span>Auction Highlight</span>
                    </>
                  )}
                </span>

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#081220] border border-[#13243f] text-[#c5d3e8] text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Arena Armed</span>
                </div>
              </div>

              {/* MAIN CONTENT: PHOTO vs SOCIAL MEDIA FINALE SLIDE */}
              {isSocialSlide ? (
                <div className="w-full flex-1 flex flex-col items-center justify-center my-1 sm:my-2 min-h-0 z-20 overflow-y-auto">
                  <div className={`w-full max-w-2xl bg-[#081220] backdrop-blur-md rounded-3xl border border-[#f5d77f]/30 shadow-2xl text-center ${
                    isProjectorMode ? 'p-4 sm:p-5 space-y-3' : 'p-6 sm:p-8 space-y-6'
                  }`}>
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#060c16] border border-[#f5d77f]/40 flex items-center justify-center shadow-lg">
                        <Trophy className="w-6 h-6 text-[#f5d77f]" />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#f5d77f] block">
                          Zhep Krida Mandal
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                          Connect With Us
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#c5d3e8] max-w-lg mx-auto">
                      Follow our official pages for real-time bid updates, player interviews, squad photos, and tournament highlights.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-1">
                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white font-black text-xs sm:text-sm shadow-lg hover:opacity-95 transition-all"
                      >
                        <Instagram className="w-4 h-4" />
                        <span>Instagram Channel</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                      </a>
                      <a
                        href="https://facebook.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-blue-600 text-white font-black text-xs sm:text-sm shadow-lg hover:bg-blue-500 transition-all"
                      >
                        <Facebook className="w-4 h-4" />
                        <span>Facebook Page</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full flex-1 flex items-center justify-center min-h-0 my-2 sm:my-3 z-10">
                  <div className="relative max-h-full max-w-full rounded-2xl overflow-hidden border border-[#f5d77f]/30 shadow-2xl bg-[#060c16]">
                    <img
                      src={currentSlide.url}
                      alt={currentSlide.title}
                      className="max-h-[340px] sm:max-h-[420px] md:max-h-[460px] w-auto object-contain rounded-2xl"
                    />
                  </div>
                </div>
              )}

              {/* BOTTOM CAPTION */}
              <div className="w-full z-20 shrink-0 text-center">
                <div className="max-w-xl mx-auto px-4 py-2 rounded-2xl bg-[#060c16]/90 border border-[#13243f] backdrop-blur-md shadow-lg">
                  <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate">
                    {currentSlide.title}
                  </h4>
                  {currentSlide.caption && (
                    <p className="text-[11px] sm:text-xs text-[#a1b3cb] truncate">
                      {currentSlide.caption}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export const PreAuctionSlideshow = React.memo(PreAuctionSlideshowComponent);
export default PreAuctionSlideshow;
