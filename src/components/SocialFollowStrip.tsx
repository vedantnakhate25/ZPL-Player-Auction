import { Instagram, Facebook } from 'lucide-react';

interface SocialFollowStripProps {
  variant?: 'dark' | 'light' | 'card' | 'compact';
  className?: string;
}

export function SocialFollowStrip({
  variant = 'dark',
  className = ''
}: SocialFollowStripProps) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={`w-full flex flex-wrap items-center justify-center gap-3 sm:gap-5 py-2.5 px-4 rounded-2xl bg-[#0a1526] border border-[#f5d77f]/20 text-white ${className}`}
    >
      <a
        href="https://www.instagram.com/zhep_krida_mandal?stkn=NjZpMXY0d25rb2t1"
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-2 font-semibold transition-colors text-[#c5d3e8] hover:text-white ${
          isCompact ? 'text-[11px]' : 'text-xs sm:text-sm'
        }`}
        title="Follow Zhep Krida Mandal on Instagram"
      >
        <span className="p-1 rounded-lg bg-gradient-to-tr from-[#d4af37] to-[#fff4c2] text-[#060c16] shrink-0 flex items-center justify-center">
          <Instagram className="w-3.5 h-3.5" />
        </span>
        <span className="whitespace-nowrap">
          Instagram{' '}
          <strong className="text-[#f5d77f] font-bold">@zhep_krida_mandal</strong>
        </span>
      </a>

      <span className="text-[#224270] hidden sm:inline" aria-hidden="true">
        &middot;
      </span>

      <a
        href="https://www.facebook.com/zhepkrida.mandal"
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-2 font-semibold transition-colors text-[#c5d3e8] hover:text-white ${
          isCompact ? 'text-[11px]' : 'text-xs sm:text-sm'
        }`}
        title="Follow Zhep Krida Mandal on Facebook"
      >
        <span className="p-1 rounded-lg bg-gradient-to-tr from-[#d4af37] to-[#fff4c2] text-[#060c16] shrink-0 flex items-center justify-center">
          <Facebook className="w-3.5 h-3.5 fill-current" />
        </span>
        <span className="whitespace-nowrap">
          Facebook{' '}
          <strong className="text-[#f5d77f] font-bold">Zhep Krida Mandal</strong>
        </span>
      </a>
    </div>
  );
}
