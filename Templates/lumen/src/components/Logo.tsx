import React from 'react';
import { CLINIC_TEXTS } from '../config/texts';

interface LogoProps {
  variant?: 'light' | 'dark' | 'plum';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'dark',
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const isLight = variant === 'light';
  const isPlum = variant === 'plum';

  const textColor = isLight
    ? 'text-[#F7F3EE]'
    : isPlum
    ? 'text-[#D8B6BE]'
    : 'text-[#332635]';

  const subtextColor = isLight
    ? 'text-[#D8B6BE]'
    : isPlum
    ? 'text-[#F7F3EE]/70'
    : 'text-[#777176]';

  const emblemStroke = isLight
    ? '#F7F3EE'
    : isPlum
    ? '#D8B6BE'
    : '#332635';

  const emblemAccent = isLight
    ? '#D8B6BE'
    : '#9B7B8D';

  const sizeStyles = {
    sm: { emblem: 26, title: 'text-lg', sub: 'text-[9px]' },
    md: { emblem: 34, title: 'text-xl sm:text-2xl', sub: 'text-[10px]' },
    lg: { emblem: 44, title: 'text-3xl sm:text-4xl', sub: 'text-xs' },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`} dir="rtl">
      {/* Bespoke Geometric Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={sizeStyles.emblem}
          height={sizeStyles.emblem}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-500 ease-out group-hover:rotate-45"
          aria-hidden="true"
        >
          {/* Outer refined diamond octagram */}
          <rect
            x="24"
            y="4"
            width="28.28"
            height="28.28"
            transform="rotate(45 24 4)"
            stroke={emblemStroke}
            strokeWidth="1.2"
            strokeOpacity="0.3"
          />
          <circle
            cx="24"
            cy="24"
            r="16"
            stroke={emblemStroke}
            strokeWidth="1.2"
            strokeDasharray="2 3"
            strokeOpacity="0.4"
          />
          {/* Central 4-point radiant star */}
          <path
            d="M24 8 C24 18 18 24 8 24 C18 24 24 30 24 40 C24 30 30 24 40 24 C30 24 24 18 24 8 Z"
            fill={emblemAccent}
            fillOpacity="0.85"
          />
          {/* Central core luminous pip */}
          <circle cx="24" cy="24" r="2.5" fill={isLight ? '#332635' : '#F7F3EE'} />
        </svg>
      </div>

      {/* Typography Block */}
      <div className="flex flex-col text-right">
        <div className="flex items-baseline gap-2">
          <span className={`font-['Cinzel'] font-bold tracking-[0.25em] ${sizeStyles.title} ${textColor} leading-none`}>
            {CLINIC_TEXTS.BRAND_NAME_EN}
          </span>
          <span className={`font-['Vazirmatn'] font-semibold text-sm sm:text-base ${textColor} opacity-90 leading-none`}>
            {CLINIC_TEXTS.BRAND_SHORT_FA}
          </span>
        </div>
        {showTagline && (
          <span className={`font-['Vazirmatn'] ${sizeStyles.sub} ${subtextColor} font-light tracking-wider mt-1`}>
            {CLINIC_TEXTS.BRAND_SUBTITLE}
          </span>
        )}
      </div>
    </div>
  );
};
