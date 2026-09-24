import { useState, useEffect, useCallback } from 'react';
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
import { SocialFollowStrip } from './SocialFollowStrip';

interface PreAuctionSlideshowProps {
  auction: Auction;
  teams: Team[];
  isProjectorMode?: boolean;
}

export function PreAuctionSlideshow({
  auction,
  teams,
  isProjectorMode = false
}: PreAuctionSlideshowProps) {
  const slides: PreAuctionPhoto[] = (() => {
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
  })();

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
      {/* TOP COUNTDOWN / PRE-AUCTION HEADER (BLACK & GOLD THEME) */}
      {!isProjectorMode && (
        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-black border border-amber-500/40 shadow-xs">
              <Trophy className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>Pre-Auction Broadcast</span>
                </span>
                <span className="text-xs font-bold text-amber-400">
                  Starts Soon
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {auction.name}
              </h2>
            </div>
          </div>

          {/* SCHEDULE BADGE */}
          <div className="flex items-center gap-3 bg-black border border-zinc-800 px-4 py-2 rounded-2xl shadow-sm self-start sm:self-auto">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="text-zinc-400 font-semibold block">
                Scheduled Live Time
              </span>
              <span className="font-black text-white">
                {auction.date} &bull; {auction.time}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CAROUSEL SHOWCASE (BLACK & GOLD THEME) */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-950 via-black to-zinc-950 border border-zinc-800 shadow-2xl ${
          isProjectorMode
            ? 'w-full flex-1 min-h-0 h-full flex flex-col'
            : 'h-[520px] sm:h-[590px] md:h-[640px]'
        }`}
      >
        {/* SLIDE WITH SMOOTH MOTION TRANSITION */}
        {currentSlide && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id + '-' + currentIndex}
              initial={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute inset-0 flex flex-col items-center justify-between min-h-0 overflow-hidden ${
                isProjectorMode ? 'p-2 sm:p-3 md:p-4' : 'p-4 sm:p-6 md:p-8'
              }`}
            >
              {/* TOP ROW: CATEGORY PILL & LIVE STATUS */}
              <div className="w-full flex items-center justify-between z-20 shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${
                    isSocialSlide
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black'
                      : currentSlide.category === 'champion'
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black'
                      : currentSlide.category === 'team_logo'
                      ? 'bg-zinc-950 text-amber-400 border border-amber-500/40'
                      : 'bg-zinc-950 text-white border border-zinc-800'
                  }`}
                >
                  {isSocialSlide ? (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Official Social Channels</span>
                    </>
                  ) : currentSlide.category === 'champion' ? (
                    <>
                      <Trophy className="w-3.5 h-3.5 text-black mr-0.5" />
                      <span>Last Year Champion</span>
                    </>
                  ) : currentSlide.category === 'team_logo' ? (
                    <>
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Official Team Logo</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Auction Highlight</span>
                    </>
                  )}
                </span>

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Arena Armed</span>
                </div>
              </div>

              {/* MAIN CONTENT: PHOTO vs SOCIAL MEDIA FINALE SLIDE */}
              {isSocialSlide ? (
                <div className="w-full flex-1 flex flex-col items-center justify-center my-1 sm:my-2 min-h-0 z-20 overflow-y-auto">
                  <div className={`w-full max-w-2xl bg-zinc-950 backdrop-blur-md rounded-3xl border border-zinc-800 shadow-2xl text-center ${
                    isProjectorMode ? 'p-4 sm:p-5 space-y-3' : 'p-6 sm:p-8 space-y-6'
                  }`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Connect With Us &bull; Stay Connected</span>
                    </div>

                    <div className="space-y-1">
                      <h3 className={`font-black text-white tracking-tight ${
                        isProjectorMode ? 'text-xl sm:text-2xl md:text-3xl' : 'text-2xl sm:text-3xl md:text-4xl'
                      }`}>
                        Follow Zhep Krida Mandal
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 font-medium max-w-lg mx-auto">
                        Get live auction bids, auction video recaps, team rosters, and championship photos directly on your feed!
                      </p>
                    </div>

                    {/* SOCIAL CARDS GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      {/* INSTAGRAM CARD */}
                      <a
                        href="https://instagram.com/zhepkridamandal"
                        target="_blank"
                        rel="noreferrer"
                        className="group p-3 sm:p-4 rounded-2xl bg-black border border-zinc-800 hover:border-amber-400/60 transition-all shadow-md hover:shadow-xl active:scale-98 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-black shadow-md">
                            <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <span className="p-1 rounded-full bg-zinc-900 text-amber-400 group-hover:bg-amber-400 group-hover:text-black transition-colors border border-zinc-700">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                            Instagram
                          </span>
                          <p className="text-xs font-bold text-zinc-300">
                            Follow us on IG
                          </p>
                          <p className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                            @zhepkridamandal
                          </p>
                          <span className="text-[10px] text-zinc-500 font-medium block pt-0.5">
                            Stories &bull; Highlights &bull; Reels
                          </span>
                        </div>
                      </a>

                      {/* FACEBOOK CARD */}
                      <a
                        href="https://www.facebook.com/search/top?q=Zhep%20Krida%20mandal"
                        target="_blank"
                        rel="noreferrer"
                        className="group p-3 sm:p-4 rounded-2xl bg-black border border-zinc-800 hover:border-amber-400/60 transition-all shadow-md hover:shadow-xl active:scale-98 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md">
                            <Facebook className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                          </div>
                          <span className="p-1 rounded-full bg-zinc-900 text-amber-400 group-hover:bg-amber-400 group-hover:text-black transition-colors border border-zinc-700">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                            Facebook
                          </span>
                          <p className="text-xs font-bold text-zinc-300">
                            Follow us on Facebook
                          </p>
                          <p className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                            Zhep Krida mandal
                          </p>
                          <span className="text-[10px] text-zinc-500 font-medium block pt-0.5">
                            Full Albums &bull; Live Streams &bull; Updates
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                /* BIG HERO PHOTO CONTAINER - FITS 100% IN FRAME WITHOUT CUTTING */
                <div className="w-full flex-1 min-h-0 flex items-center justify-center my-1 sm:my-2 relative overflow-hidden">
                  <div className="relative h-full max-h-full max-w-full flex items-center justify-center p-2 rounded-2xl bg-black shadow-xl border border-zinc-800 backdrop-blur-xs">
                    <img
                      src={currentSlide.url}
                      alt={currentSlide.title}
                      className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl select-none transition-all duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* CLEAN TITLE & CAPTION */}
              <div className="w-full text-center space-y-0.5 z-20 max-w-2xl px-4 py-2 bg-zinc-950 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-lg shrink-0">
                <h3
                  className={`font-black text-white tracking-tight leading-tight ${
                    isProjectorMode ? 'text-lg sm:text-2xl md:text-3xl' : 'text-xl sm:text-2xl md:text-3xl'
                  }`}
                >
                  {currentSlide.title}
                </h3>
                {currentSlide.caption && (
                  <p className="text-xs sm:text-sm text-zinc-400 font-medium line-clamp-1 sm:line-clamp-2">
                    {currentSlide.caption}
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* PERSISTENT SOCIAL STRIP AT BOTTOM OF PRE-AUCTION SHOWCASE PANEL */}
      {!isProjectorMode && (
        <SocialFollowStrip variant="dark" />
      )}
    </div>
  );
}
