import React, { useState } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  Clock,
  FileSpreadsheet,
  Shield,
  Users,
} from 'lucide-react';
import { CLUBS } from '../data/sportsData';
import { Match, MatchEventType } from '../types/sports';
import { ClubCrest } from './ClubCrest';

interface MatchInspectorProps {
  match: Match | null;
  onSelectClub?: (clubId: string) => void;
  onOpenEventModal?: () => void;
}

type InspectorTab = 'events' | 'stats' | 'lineups';

function renderEventBadge(type: MatchEventType) {
  switch (type) {
    case 'goal':
      return (
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40"
          title="Gol"
        >
          G
        </span>
      );
    case 'yellow':
      return (
        <span
          className="inline-block w-3 h-4 rounded-[2px] bg-amber-400 shadow-sm"
          title="Tarjeta amarilla"
        />
      );
    case 'red':
      return (
        <span
          className="inline-block w-3 h-4 rounded-[2px] bg-red-500 shadow-sm"
          title="Tarjeta roja"
        />
      );
    case 'sub':
      return (
        <ArrowLeftRight className="w-4 h-4 text-sky-300" aria-label="Sustitución" />
      );
  }
}

export const MatchInspector: React.FC<MatchInspectorProps> = ({
  match,
  onSelectClub,
  onOpenEventModal,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('events');

  if (!match) {
    return (
      <div className="glass-surface rounded-2xl p-6 text-center text-slate-400">
        Selecciona un partido para inspeccionar estadísticas, eventos y alineaciones.
      </div>
    );
  }

  const homeClub = CLUBS[match.homeClubId];
  const awayClub = CLUBS[match.awayClubId];

  if (!homeClub || !awayClub) return null;

  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';

  const sortedEvents = [...match.events].sort((a, b) => b.minute - a.minute);

  return (
    <aside className="glass-surface rounded-2xl overflow-hidden flex flex-col">
      {/* Match Hero Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
          <span>
            Jornada {match.matchday} · {match.stadium}
          </span>
          <span className="font-mono tabular-nums">
            {isLive ? (
              <span className="text-amber-300 font-semibold">
                En vivo · {match.minute}&apos;
              </span>
            ) : isUpcoming ? (
              <span className="text-sky-300 font-medium">{match.dateLabel}</span>
            ) : (
              <span>Finalizado</span>
            )}
          </span>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <button
            type="button"
            onClick={() => onSelectClub?.(homeClub.id)}
            className="flex flex-col items-center text-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1"
          >
            <ClubCrest club={homeClub} size="lg" />
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                {homeClub.shortName}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {match.homeFormation}
              </div>
            </div>
          </button>

          <div className="text-center px-2">
            <div className="font-mono tabular-nums text-3xl font-bold tracking-tight text-white">
              {isUpcoming ? (
                <span className="text-xl text-sky-300">{match.kickoffTime}</span>
              ) : (
                <>
                  <span>{match.homeScore}</span>
                  <span className="text-slate-500 mx-2">:</span>
                  <span>{match.awayScore}</span>
                </>
              )}
            </div>
            {match.homeHalfTime !== undefined && !isUpcoming && (
              <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-1">
                MT {match.homeHalfTime} - {match.awayHalfTime}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectClub?.(awayClub.id)}
            className="flex flex-col items-center text-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1"
          >
            <ClubCrest club={awayClub} size="lg" />
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                {awayClub.shortName}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {match.awayFormation}
              </div>
            </div>
          </button>
        </div>

        {/* Venue & Official Footer */}
        <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between text-xs text-slate-400">
          <span>Árbitro: {match.referee}</span>
          {match.attendance && (
            <span className="font-mono tabular-nums">
              Asistencia: {match.attendance}
            </span>
          )}
        </div>
      </div>

      {/* Inspector Tabs & Official Match Record Button */}
      <div className="px-5 pt-3 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'events'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Eventos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'stats'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Estadísticas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lineups')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'lineups'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Alineaciones
          </button>
        </div>

        {onOpenEventModal && (
          <button
            type="button"
            onClick={onOpenEventModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-1 rounded-md text-[11px] font-semibold bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 transition-colors whitespace-nowrap shrink-0"
            title="Abrir acta arbitral para registrar goles, tarjetas y cambios en Supabase"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Acta / Incidencias
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="p-5 flex-1">
        {activeTab === 'events' && (
          <div>
            {sortedEvents.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                {isUpcoming
                  ? 'El partido aún no comienza. Los eventos aparecerán en tiempo real tras el pitazo inicial.'
                  : 'Sin incidencias destacadas registradas en este encuentro.'}
              </div>
            ) : (
              <ul className="divide-y divide-white/8">
                {sortedEvents.map((ev) => {
                  const isHome = ev.teamSide === 'home';
                  const club = isHome ? homeClub : awayClub;
                  return (
                    <li
                      key={ev.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono tabular-nums text-xs font-semibold text-amber-300 w-8 shrink-0">
                          {ev.minute}&apos;
                        </span>
                        <div className="w-6 flex justify-center shrink-0">
                          {renderEventBadge(ev.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-100 truncate">
                            {ev.player}
                          </div>
                          {ev.detail && (
                            <div className="text-xs text-slate-400 truncate">
                              {ev.detail}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400 shrink-0">
                        {club.code}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            {match.stats.map((stat) => (
              <div key={stat.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono tabular-nums font-semibold text-white">
                    {stat.homeValue}
                  </span>
                  <span className="text-slate-300 font-medium">
                    {stat.label}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    {stat.awayValue}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden flex gap-0.5">
                  <div
                    className="h-full bg-amber-400 rounded-l-full transition-all duration-300"
                    style={{ width: `${stat.homePct}%` }}
                  />
                  <div
                    className="h-full bg-sky-400 rounded-r-full transition-all duration-300"
                    style={{ width: `${100 - stat.homePct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'lineups' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/10">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-white truncate">
                  {homeClub.shortName}
                </span>
                <span className="text-[11px] font-mono text-slate-400 ml-auto">
                  {match.homeFormation}
                </span>
              </div>
              <ol className="space-y-1.5 text-xs text-slate-300">
                {match.homeLineup.map((player, idx) => (
                  <li key={player} className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-slate-500 w-4 text-right">
                      {idx + 1}
                    </span>
                    <span className="truncate">{player}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/10">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs font-semibold text-white truncate">
                  {awayClub.shortName}
                </span>
                <span className="text-[11px] font-mono text-slate-400 ml-auto">
                  {match.awayFormation}
                </span>
              </div>
              <ol className="space-y-1.5 text-xs text-slate-300">
                {match.awayLineup.map((player, idx) => (
                  <li key={player} className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-slate-500 w-4 text-right">
                      {idx + 1}
                    </span>
                    <span className="truncate">{player}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
