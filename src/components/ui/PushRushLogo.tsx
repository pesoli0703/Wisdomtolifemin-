import React from 'react';

interface PushRushLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export function PushRushLogo({
  size = 'md',
  showTagline = false,
  className = '',
}: PushRushLogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-3xl sm:text-4xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative ${iconSizes[size]} shrink-0`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(0,229,255,0.55)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="prRim" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="52%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#FF7A00" />
            </linearGradient>
            <linearGradient id="prBolt" x1="32" y1="14" x2="32" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#FF7A00" />
            </linearGradient>
          </defs>
          {/* Stopwatch crown */}
          <rect x="26" y="2" width="12" height="5" rx="2.5" fill="#00E5FF" />
          <path d="M49 11L54 7" stroke="#A855F7" strokeWidth="3.5" strokeLinecap="round" />
          {/* Outer futuristic bevel ring */}
          <circle
            cx="32"
            cy="34"
            r="26"
            fill="#070C24"
            stroke="url(#prRim)"
            strokeWidth="4"
          />
          {/* Illuminated mini pads */}
          <circle cx="20" cy="24" r="3.5" fill="#22C55E" />
          <circle cx="44" cy="24" r="3.5" fill="#00E5FF" />
          <circle cx="18" cy="40" r="3.5" fill="#A855F7" />
          <circle cx="46" cy="40" r="3.5" fill="#EF4444" />
          {/* Electric lightning bolt */}
          <path
            d="M35.5 16L22.5 35.5H31.5L28.5 52L42.5 31.5H33L35.5 16Z"
            fill="url(#prBolt)"
            stroke="#050816"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <div className={`font-display font-black italic tracking-wider ${textSizes[size]} flex items-center gap-1`}>
          <span className="bg-gradient-to-b from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,229,255,0.35)] dark:from-white dark:via-cyan-100 dark:to-cyan-400">
            PUSH
          </span>
          <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,122,0,0.4)]">
            RUSH
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-cyan-400/90 mt-0.5">
            Think Fast. Tap Faster.
          </span>
        )}
      </div>
    </div>
  );
}
