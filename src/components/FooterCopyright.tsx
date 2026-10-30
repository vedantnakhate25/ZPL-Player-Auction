import React from 'react';

interface FooterCopyrightProps {
  className?: string;
}

export function FooterCopyright({ className = '' }: FooterCopyrightProps) {
  return (
    <div
      className={`w-full py-2.5 px-3 text-center pointer-events-none select-none border-t border-[#13243f]/60 bg-[#060c16] ${className}`}
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-[10px] sm:text-[11px] leading-tight text-[#a1b3cb] font-medium tracking-wide space-y-0.5">
        <span>All Rights reserved by Zhep Krida Mandal [Est 1981]</span>
        <span className="font-bold text-[#f5d77f] tracking-wider">MoJituu Boyzz</span>
      </div>
    </div>
  );
}

export default FooterCopyright;
