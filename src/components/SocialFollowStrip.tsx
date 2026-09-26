import { Instagram, Facebook } from 'lucide-react';

interface SocialFollowStripProps {
  variant?: 'dark' | 'light' | 'card' | 'compact';
  className?: string;
}

export function SocialFollowStrip({
  variant = 'dark',
  className = ''
}: SocialFollowStripProps) {
  const isLight = variant === 'light';
  const isCompact = variant === 'compact';

  return (
    <div
      className={`w-full flex flex-wrap items-center justify-center gap-2 sm:gap-4 py-2 px-3 rounded-2xl transition-all ${
        isLight
          ? 'bg-zinc-900/90 border border-zinc-800 text-zinc-200 shadow-xs'
          : 'bg-black/90 border border-zinc-800 text-white shadow-inner'
      } ${className}`}
    >
      {/* INSTAGRAM LINK */}
      <a
        href="https://www.instagram.com/zhep_krida_mandal?stkn=NjZpMXY0d25rb2t1"
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-1.5 font-bold transition-all hover:scale-105 active:scale-95 text-zinc-300 hover:text-white ${
          isCompact ? 'text-[11px]' : 'text-xs sm:text-sm'
        }`}
        title="Follow Zhep Krida Mandal on Instagram"
      >
        <span className="p-1 rounded-lg bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-black shadow-xs shrink-0 flex items-center justify-center">
          <Instagram className="w-3.5 h-3.5" />
        </span>
        <span className="whitespace-nowrap">
          Follow us on IG{' '}
          <strong className="text-amber-400 underline underline-offset-2">
            @zhep_krida_mandal
          </strong>
        </span>
      </a>

      {/* DIVIDER */}
      <span className="text-zinc-700 hidden sm:inline">
        •
      </span>

      {/* FACEBOOK LINK */}
      <a
        href="https://www.facebook.com/zhepkrida.mandal"
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-1.5 font-bold transition-all hover:scale-105 active:scale-95 text-zinc-300 hover:text-white ${
          isCompact ? 'text-[11px]' : 'text-xs sm:text-sm'
        }`}
        title="Follow Zhep Krida Mandal on Facebook"
      >
        <span className="p-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-xs shrink-0 flex items-center justify-center">
          <Facebook className="w-3.5 h-3.5 fill-current" />
        </span>
        <span className="whitespace-nowrap">
          Follow us on Facebook{' '}
          <strong className="text-amber-400 underline underline-offset-2">
            Zhep Krida mandal
          </strong>
        </span>
      </a>
    </div>
  );
}
