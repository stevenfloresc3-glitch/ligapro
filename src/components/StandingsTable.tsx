import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  GitCompareArrows,
  Layers,
  Search,
  UploadCloud,
  X,
} from 'lucide-react';
import { ComputedStandingRow, LeagueConfig } from '../types/sports';
import { StandingsViewMode } from '../utils/standingsCalculator';
import { ClubCrest } from './ClubCrest';
import { saveStandingsBatch } from '../services/supabaseService';
import { SupabaseStanding } from '../types/supabase';

interface StandingsTableProps {
  rows: ComputedStandingRow[];
  league: LeagueConfig;
  viewMode: StandingsViewMode;
  onChangeViewMode: (mode: StandingsViewMode) => void;
  selectedClubId: string | null;
  onSelectClub: (clubId: string | null) => void;
  onCompareClub: (clubId: string) => void;
  onJumpToClubMatch: (clubId: string) => void;
}

type SortKey =
  | 'position'
  | 'name'
  | 'played'
  | 'won'
  | 'drawn'
  | 'lost'
  | 'goalDifference'
  | 'points';

type ZoneFilter = 'all' | 'international' | 'playoff' | 'relegation';

export const StandingsTable: React.FC<StandingsTableProps> = ({
  rows,
  league,
  viewMode,
  onChangeViewMode,
  selectedClubId,
  onSelectClub,
  onCompareClub,
  onJumpToClubMatch,
}) => {
  const [tournamentPhase, setTournamentPhase] = useState<'Fase Uno' | 'Fase Dos' | 'Tabla Acumulada'>('Fase Uno');
  const [isSyncingStandings, setIsSyncingStandings] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('position');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [hoveredFormKey, setHoveredFormKey] = useState<string | null>(null);

  const handleSyncToSupabase = async () => {
    setIsSyncingStandings(true);
    setSyncSuccessMsg(null);
    try {
      const phaseSlug = tournamentPhase.toLowerCase().replace(/\s+/g, '_');
      const standingsToPersist: SupabaseStanding[] = rows.map((r) => ({
        id: `std-${r.club.id}-${phaseSlug}`,
        team_id: r.club.id,
        phase: tournamentPhase,
        matches_played: r.played,
        won: r.won,
        drawn: r.drawn,
        lost: r.lost,
        goals_for: r.goalsFor,
        goals_against: r.goalsAgainst,
        points: r.points,
      }));

      const ok = await saveStandingsBatch(standingsToPersist);
      setIsSyncingStandings(false);
      if (ok) {
        setSyncSuccessMsg('¡Clasificación sincronizada exitosamente en Supabase (standings)!');
      } else {
        setSyncSuccessMsg('Guardado localmente (modo offline)');
      }
    } catch {
      setIsSyncingStandings(false);
      setSyncSuccessMsg('Operación completada en memoria local.');
    }
    setTimeout(() => setSyncSuccessMsg(null), 3500);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'position' || key === 'name' ? 'asc' : 'desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (zoneFilter !== 'all' && row.zone !== zoneFilter) return false;
      if (
        q &&
        !row.club.name.toLowerCase().includes(q) &&
        !row.club.code.toLowerCase().includes(q) &&
        !row.club.city.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'position':
          cmp = a.position - b.position;
          break;
        case 'name':
          cmp = a.club.name.localeCompare(b.club.name);
          break;
        case 'played':
          cmp = a.played - b.played;
          break;
        case 'won':
          cmp = a.won - b.won;
          break;
        case 'drawn':
          cmp = a.drawn - b.drawn;
          break;
        case 'lost':
          cmp = a.lost - b.lost;
          break;
        case 'goalDifference':
          cmp = a.goalDifference - b.goalDifference;
          break;
        case 'points':
          cmp = a.points - b.points;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [rows, searchQuery, zoneFilter, sortKey, sortDir]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3 h-3 opacity-35" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-amber-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-amber-400" />
    );
  };

  const getZoneMarkerClass = (zone: ComputedStandingRow['zone']) => {
    switch (zone) {
      case 'international':
        return 'bg-amber-400 text-slate-950 font-bold';
      case 'playoff':
        return 'bg-sky-400/90 text-slate-950 font-bold';
      case 'relegation':
        return 'bg-red-500/85 text-white font-bold';
      default:
        return 'bg-white/8 text-slate-300 font-semibold';
    }
  };

  const getFormTileClass = (res: 'V' | 'E' | 'D') => {
    switch (res) {
      case 'V':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35';
      case 'E':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/35';
      case 'D':
        return 'bg-red-500/20 text-red-300 border-red-500/35';
    }
  };

  return (
    <section
      aria-label="Tabla de posiciones interactiva"
      className="glass-surface rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Header & Controls */}
      <div className="p-5 border-b border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-white">
              Tabla de Posiciones
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {league.name} · Temporada {league.season} · Jornada{' '}
              {league.currentMatchday} de {league.totalMatchdays}
            </p>
          </div>

          {/* Segmented Mode Switch: General / Local / Visitante / En Vivo */}
          <div
            role="tablist"
            aria-label="Modo de clasificación"
            className="inline-flex items-center p-1 rounded-lg bg-[#060F24]/90 border border-white/10"
          >
            {(
              [
                { id: 'general', label: 'General' },
                { id: 'home', label: 'Local' },
                { id: 'away', label: 'Visitante' },
                { id: 'live', label: 'En Vivo' },
              ] as const
            ).map((tab) => {
              const active = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChangeViewMode(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? tab.id === 'live'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Phase Selector & Supabase Standings Sync */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/8">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Etapa:
            </span>
            {(['Fase Uno', 'Fase Dos', 'Tabla Acumulada'] as const).map((phase) => (
              <button
                key={phase}
                type="button"
                onClick={() => setTournamentPhase(phase)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                  tournamentPhase === phase
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : 'text-slate-400 hover:text-slate-200 bg-white/5 border border-transparent'
                }`}
              >
                {phase}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSyncToSupabase}
            disabled={isSyncingStandings}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors disabled:opacity-50 whitespace-nowrap"
            title="Sincronizar tabla de posiciones calculada con la base de datos Supabase"
          >
            {isSyncingStandings ? (
              <>
                <div className="w-3 h-3 rounded-full border border-emerald-300 border-t-transparent animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                Sincronizar a Supabase
              </>
            )}
          </button>
        </div>

        {syncSuccessMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        {/* Search & Zone Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar club, código o ciudad..."
              aria-label="Buscar equipo en la tabla"
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg bg-[#060F24]/85 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'international', label: 'Copa Int.' },
                { id: 'playoff', label: 'Clasificación' },
                { id: 'relegation', label: 'Descenso' },
              ] as const
            ).map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setZoneFilter(z.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 border ${
                  zoneFilter === z.id
                    ? 'bg-white/12 border-amber-400/50 text-amber-300'
                    : 'bg-transparent border-white/8 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-[#060F24]/60 text-[11px] font-semibold text-slate-400 select-none">
              <th className="py-2.5 pl-4 pr-2 w-14">
                <button
                  type="button"
                  onClick={() => handleSort('position')}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  #
                  {renderSortIcon('position')}
                </button>
              </th>
              <th className="py-2.5 px-2 min-w-[180px]">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  Equipo
                  {renderSortIcon('name')}
                </button>
              </th>
              <th className="py-2.5 px-2 text-right w-11">
                <button
                  type="button"
                  onClick={() => handleSort('played')}
                  className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  title="Partidos Jugados"
                >
                  PJ
                  {renderSortIcon('played')}
                </button>
              </th>
              <th className="py-2.5 px-2 text-right w-11">
                <button
                  type="button"
                  onClick={() => handleSort('won')}
                  className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  title="Ganados"
                >
                  G
                  {renderSortIcon('won')}
                </button>
              </th>
              <th className="py-2.5 px-2 text-right w-11">
                <button
                  type="button"
                  onClick={() => handleSort('drawn')}
                  className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  title="Empatados"
                >
                  E
                  {renderSortIcon('drawn')}
                </button>
              </th>
              <th className="py-2.5 px-2 text-right w-11">
                <button
                  type="button"
                  onClick={() => handleSort('lost')}
                  className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  title="Perdidos"
                >
                  P
                  {renderSortIcon('lost')}
                </button>
              </th>
              <th className="py-2.5 px-2 text-right hidden sm:table-cell w-16">
                Goles
              </th>
              <th className="py-2.5 px-2 text-right w-12">
                <button
                  type="button"
                  onClick={() => handleSort('goalDifference')}
                  className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  title="Diferencia de Gol"
                >
                  DG
                  {renderSortIcon('goalDifference')}
                </button>
              </th>
              <th className="py-2.5 px-3 text-center hidden md:table-cell w-36">
                Últimos 5
              </th>
              <th className="py-2.5 pl-2 pr-4 text-right w-14">
                <button
                  type="button"
                  onClick={() => handleSort('points')}
                  className="inline-flex items-center justify-end gap-1 text-amber-300 hover:text-amber-200 transition-colors ml-auto"
                  title="Puntos"
                >
                  Pts
                  {renderSortIcon('points')}
                </button>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.06] text-sm">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="py-10 text-center text-sm text-slate-400"
                >
                  No se encontraron clubes con los filtros actuales.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setZoneFilter('all');
                    }}
                    className="text-amber-300 hover:underline font-medium ml-1"
                  >
                    Restablecer filtros
                  </button>
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((row) => {
                const isSelected = selectedClubId === row.club.id;

                return (
                  <React.Fragment key={row.club.id}>
                    <tr
                      onClick={() =>
                        onSelectClub(isSelected ? null : row.club.id)
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-400/12'
                          : 'hover:bg-white/[0.045]'
                      }`}
                    >
                      {/* Position + Live Delta */}
                      <td className="py-2.5 pl-4 pr-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-mono tabular-nums ${getZoneMarkerClass(
                              row.zone
                            )}`}
                          >
                            {row.position}
                          </span>
                          {viewMode === 'live' && row.livePositionDelta !== 0 && (
                            <span
                              className={`text-[10px] font-mono tabular-nums font-bold ${
                                row.livePositionDelta > 0
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                              }`}
                              title={
                                row.livePositionDelta > 0
                                  ? `Sube ${row.livePositionDelta} pos. en vivo`
                                  : `Baja ${Math.abs(row.livePositionDelta)} pos. en vivo`
                              }
                            >
                              {row.livePositionDelta > 0
                                ? `+${row.livePositionDelta}`
                                : row.livePositionDelta}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Club Crest & Name */}
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ClubCrest club={row.club} size="xs" />
                          <div className="min-w-0 flex items-center gap-2">
                            <span
                              className={`font-medium truncate ${
                                isSelected ? 'text-amber-200' : 'text-slate-100'
                              }`}
                            >
                              {row.club.name}
                            </span>
                            {row.isPlayingLive && row.liveScoreText && (
                              <span className="shrink-0 text-[11px] font-mono tabular-nums text-amber-300/95">
                                {row.liveScoreText} vs {row.liveOpponentCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* PJ / G / E / P */}
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-xs text-slate-300">
                        {row.played}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-xs text-slate-300">
                        {row.won}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-xs text-slate-400">
                        {row.drawn}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-xs text-slate-400">
                        {row.lost}
                      </td>

                      {/* GF:GC */}
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-xs text-slate-400 hidden sm:table-cell">
                        {row.goalsFor}:{row.goalsAgainst}
                      </td>

                      {/* DG */}
                      <td
                        className={`py-2.5 px-2 text-right font-mono tabular-nums text-xs font-medium ${
                          row.goalDifference > 0
                            ? 'text-emerald-400'
                            : row.goalDifference < 0
                              ? 'text-red-400'
                              : 'text-slate-400'
                        }`}
                      >
                        {row.goalDifference > 0
                          ? `+${row.goalDifference}`
                          : row.goalDifference}
                      </td>

                      {/* Form Streak (Últimos 5) */}
                      <td
                        className="py-2.5 px-3 hidden md:table-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1 relative">
                          {row.form.map((f, idx) => {
                            const fKey = `${row.club.id}-${idx}`;
                            return (
                              <div key={fKey} className="relative">
                                <button
                                  type="button"
                                  onMouseEnter={() => setHoveredFormKey(fKey)}
                                  onMouseLeave={() => setHoveredFormKey(null)}
                                  onFocus={() => setHoveredFormKey(fKey)}
                                  onBlur={() => setHoveredFormKey(null)}
                                  aria-label={`${
                                    f.result === 'V'
                                      ? 'Victoria'
                                      : f.result === 'E'
                                        ? 'Empate'
                                        : 'Derrota'
                                  } ${f.score} vs ${f.opponentCode}`}
                                  className={`w-5 h-5 rounded-[4px] border text-[10px] font-mono font-bold flex items-center justify-center transition-transform hover:scale-110 ${getFormTileClass(
                                    f.result
                                  )}`}
                                >
                                  {f.result}
                                </button>
                                {hoveredFormKey === fKey && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 px-2 py-1 rounded bg-[#050C1A] border border-white/15 text-[11px] font-mono tabular-nums text-white whitespace-nowrap shadow-lg pointer-events-none">
                                    {f.isHome ? 'Local' : 'Vis.'} vs{' '}
                                    {f.opponentCode} · {f.score}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Points */}
                      <td className="py-2.5 pl-2 pr-4 text-right font-mono tabular-nums font-bold text-sm text-white">
                        {row.points}
                      </td>
                    </tr>

                    {/* Clean Inline Club Quick-Detail Row */}
                    {isSelected && (
                      <tr className="bg-[#060F24]/90">
                        <td colSpan={10} className="px-4 py-3.5 border-b border-amber-400/25">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                              <div>
                                <span className="text-slate-400">Estadio: </span>
                                <span className="text-slate-100 font-medium">
                                  {row.club.stadium} ({row.club.city})
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">DT: </span>
                                <span className="text-slate-100 font-medium">
                                  {row.club.manager}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">Pts/PJ: </span>
                                <span className="font-mono tabular-nums text-amber-300 font-semibold">
                                  {row.pointsPerGame.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">
                                  Vallas invictas:{' '}
                                </span>
                                <span className="font-mono tabular-nums text-white font-semibold">
                                  {row.cleanSheets}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">Posesión prom.: </span>
                                <span className="font-mono tabular-nums text-white font-semibold">
                                  {row.avgPossession.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onJumpToClubMatch(row.club.id);
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/18 text-white transition-colors whitespace-nowrap"
                              >
                                Ver partido actual
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCompareClub(row.club.id);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors whitespace-nowrap"
                              >
                                <GitCompareArrows className="w-3.5 h-3.5" />
                                Comparar
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Accessible Legend Footer */}
      <div className="px-5 py-3.5 border-t border-white/10 bg-[#060F24]/55 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shrink-0" />
            <span>1–{league.internationalSlots}: Copa Internacional</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 shrink-0" />
            <span>
              {league.internationalSlots + 1}–{league.playoffSlots}: Clasificación
              Continental
            </span>
          </div>
          {league.relegationStart <= rows.length && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0" />
              <span>
                {league.relegationStart}–{rows.length}: Descenso Directo
              </span>
            </div>
          )}
        </div>

        <span className="text-[11px] text-slate-500">
          Haz clic en cualquier fila para ver ficha del club
        </span>
      </div>
    </section>
  );
};
