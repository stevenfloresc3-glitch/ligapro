import React from 'react';
import { Club } from '../types/sports';

interface ClubCrestProps {
  club: Club;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  xs: 20,
  sm: 26,
  md: 36,
  lg: 48,
};

export const ClubCrest: React.FC<ClubCrestProps> = ({
  club,
  size = 'md',
  className = '',
}) => {
  const px = SIZE_MAP[size];
  const uid = `crest-${club.id}-${size}`;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] ${className}`}
      aria-label={`Escudo de ${club.name}`}
    >
      <defs>
        <clipPath id={uid}>
          <path d="M20 2L36 7.5V20.5C36 30.8 29.1 38.7 20 42C10.9 38.7 4 30.8 4 20.5V7.5L20 2Z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid})`}>
        <rect x="4" y="2" width="32" height="40" fill={club.primaryColor} />

        {club.pattern === 'vertical' && (
          <>
            <rect x="11" y="2" width="6" height="40" fill={club.secondaryColor} fillOpacity="0.88" />
            <rect x="23" y="2" width="6" height="40" fill={club.secondaryColor} fillOpacity="0.88" />
          </>
        )}

        {club.pattern === 'diagonal' && (
          <path
            d="M0 36L40 4V14L0 46V36Z"
            fill={club.secondaryColor}
            fillOpacity="0.9"
          />
        )}

        {club.pattern === 'chevron' && (
          <path
            d="M4 16L20 27L36 16V23L20 34L4 23V16Z"
            fill={club.accentColor}
            fillOpacity="0.92"
          />
        )}

        {club.pattern === 'cross' && (
          <>
            <rect x="17" y="2" width="6" height="40" fill={club.secondaryColor} fillOpacity="0.9" />
            <rect x="4" y="16" width="32" height="6" fill={club.secondaryColor} fillOpacity="0.9" />
          </>
        )}

        {club.pattern === 'crown' && (
          <>
            <path
              d="M4 2H36V12H4V2Z"
              fill={club.accentColor}
              fillOpacity="0.92"
            />
            <circle cx="20" cy="24" r="7" fill={club.secondaryColor} fillOpacity="0.18" />
          </>
        )}

        {/* Subtle institutional sheen */}
        <path
          d="M20 2L36 7.5V20.5C36 30.8 29.1 38.7 20 42V2Z"
          fill="#FFFFFF"
          fillOpacity="0.06"
        />
      </g>

      {/* Shield border */}
      <path
        d="M20 2L36 7.5V20.5C36 30.8 29.1 38.7 20 42C10.9 38.7 4 30.8 4 20.5V7.5L20 2Z"
        stroke={club.accentColor}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />

      {/* Crisp inner center monogram for small legibility */}
      <circle
        cx="20"
        cy="23"
        r="7.2"
        fill="#060E1F"
        fillOpacity="0.82"
        stroke={club.accentColor}
        strokeWidth="1"
      />
      <text
        x="20"
        y="25.6"
        textAnchor="middle"
        fill="#F8FAFC"
        fontSize="7.5"
        fontWeight="700"
        fontFamily="Outfit, sans-serif"
        letterSpacing="0.04em"
      >
        {club.code.slice(0, 2)}
      </text>
    </svg>
  );
};
