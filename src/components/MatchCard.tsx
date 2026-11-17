import React from 'react';
import { ChevronRight } from 'lucide-react';
import { CLUBS } from '../data/sportsData';
import { Match } from '../types/sports';
import { ClubCrest } from './ClubCrest';

interface MatchCardProps {
  match: Match;
  isSelected: boolean;
  onSelect: (matchId: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isSelected,
  onSelect,
}) => {
  const homeClub = CLUBS[match.homeClubId];
  const awayClub = CLUBS[match.awayClubId];

  if (!homeClub || !awayClub) return null;

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isUpcoming = match.status === 'upcoming';

  const possessionStat = match.stats.find((s) =>
    s.label.toLowerCase().includes('posesión')
  );

  const homeLeading =
    (isLive || isFinished) && match.homeScore > match.awayScore;
  const awayLeading =
    (isLive || isFinished) && match.awayScore > match.homeScore;

  return (
    <button
      type="button"
      onClick={() => onSelect(match.id)}
      className={`group w-full text-left rounded-xl p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 ${
        isSelected
          ? 'glass-card-active'
          : 'glass-card hover:border-white/25 hover:-translate-y-0.5'
      }`}
    >
      {/* Unboxed Header Metadata */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs text-slate-300/90 min-w-0">
          <span className="truncate font-medium text-slate-200">
            Jornada {match.matchday}
          </span>
          <span aria-hidden="true" className="text-slate-500">
            ·
          </span>
          <span className="truncate text-slate-400">{match.stadium}</span>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-xs font-mono tabular-nums">
          {isLive && (
            <span className="font-semibold text-amber-400 tracking-wide">
              En vivo {match.minute}&apos;
            </span>
          )}
          {isFinished && (
            <span className="font-medium text-slate-400">Final</span>
          )}
          {isUpcoming && (
            <span className="font-medium text-sky-300">{match.kickoffTime}</span>
          )}
        </div>
      </div>

      {/* Teams & Scoreline */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ClubCrest club={homeClub} size="sm" />
            <span
              className={`text-sm font-semibold truncate ${
                homeLeading
                  ? 'text-white'
                  : isUpcoming
                    ? 'text-slate-100'
                    : 'text-slate-300'
              }`}
            >
              {homeClub.shortName}
            </span>
          </div>
          <span
            className={`font-mono tabular-nums text-lg font-bold min-w-[1.5rem] text-right ${
              isUpcoming
                ? 'text-slate-500'
                : homeLeading
                  ? 'text-amber-300'
                  : 'text-white'
            }`}
          >
            {isUpcoming ? '—' : match.homeScore}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ClubCrest club={awayClub} size="sm" />
            <span
              className={`text-sm font-semibold truncate ${
                awayLeading
                  ? 'text-white'
                  : isUpcoming
                    ? 'text-slate-100'
                    : 'text-slate-300'
              }`}
            >
              {awayClub.shortName}
            </span>
          </div>
          <span
            className={`font-mono tabular-nums text-lg font-bold min-w-[1.5rem] text-right ${
              isUpcoming
                ? 'text-slate-500'
                : awayLeading
                  ? 'text-amber-300'
                  : 'text-white'
            }`}
          >
            {isUpcoming ? '—' : match.awayScore}
          </span>
        </div>
      </div>

      {/* Footer Micro-Telemetry */}
      <div className="mt-3.5 pt-2.5 border-t border-white/8 flex items-center justify-between gap-3">
        {possessionStat ? (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono tabular-nums">
              <span>{possessionStat.homeValue}</span>
              <span className="text-slate-500 font-sans">Posesión</span>
              <span>{possessionStat.awayValue}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden flex">
              <div
                className="h-full bg-amber-400/90 transition-all duration-300"
                style={{ width: `${possessionStat.homePct}%` }}
              />
              <div
                className="h-full bg-sky-400/75 transition-all duration-300"
                style={{ width: `${100 - possessionStat.homePct}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400 truncate">
            Árbitro: {match.referee}
          </span>
        )}

        <span
          className={`shrink-0 inline-flex items-center gap-0.5 text-xs font-medium transition-colors ${
            isSelected
              ? 'text-amber-300'
              : 'text-slate-400 group-hover:text-white'
          }`}
        >
          Detalle
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  );
};
