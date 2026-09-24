import React from 'react';

interface FooterCopyrightProps {
  className?: string;
}

export function FooterCopyright({ className = '' }: FooterCopyrightProps) {
  return (
    <div
      className={`w-full py-2 px-3 text-center pointer-events-none select-none ${className}`}
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-[10px] sm:text-[11px] leading-tight text-zinc-400 font-medium tracking-wide space-y-0.5">
        <span>All Rights reserved by Zhep Krida Mandal [Est 1981]</span>
        <span className="font-bold text-zinc-300 tracking-wider">MoJituu Boyzz</span>
      </div>
    </div>
  );
}
