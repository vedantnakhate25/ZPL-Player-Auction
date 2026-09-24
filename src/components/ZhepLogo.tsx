import React from 'react';

interface ZhepLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withBorder?: boolean;
}

export const ZhepLogo: React.FC<ZhepLogoProps> = ({
  className = 'w-8 h-8',
  size,
  withBorder = false,
}) => {
  let sizeClass = className;
  if (size === 'sm') sizeClass = 'w-5 h-5';
  if (size === 'md') sizeClass = 'w-8 h-8';
  if (size === 'lg') sizeClass = 'w-12 h-12';
  if (size === 'xl') sizeClass = 'w-16 h-16';

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-white shadow-sm select-none ${
        withBorder ? 'border-2 border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : ''
      } ${sizeClass}`}
      title="Zhep Krida Mandal"
    >
      <img
        src="/zhep-logo.svg"
        alt="Zhep Krida Mandal Logo"
        className="w-full h-full object-contain p-0.5"
        loading="eager"
      />
    </div>
  );
};

export default ZhepLogo;
