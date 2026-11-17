import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Search,
  Plus,
  RotateCcw,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { CLUBS, PLAYER_LEADERS } from '../data/sportsData';
import { ComputedStandingRow } from '../types/sports';
import { ClubCrest } from './ClubCrest';
import { SupabasePlayer } from '../types/supabase';
import { getPlayers, updatePlayerCards } from '../services/supabaseService';

interface LeagueStatsViewProps {
  standings: ComputedStandingRow[];
  onSelectClub: (clubId: string) => void;
  playersList?: SupabasePlayer[];
  onUpdatePlayerCards?: (playerId: string, yellows: number, reds: number) => void;
}

type LeaderSort = 'goals' | 'assists' | 'rating';
type DisciplinaryFilter = 'all' | 'suspended' | 'warning' | 'clean';

export const LeagueStatsView: React.FC<LeagueStatsViewProps> = ({
  standings,
  onSelectClub,
  playersList: externalPlayers,
  onUpdatePlayerCards,
}) => {
  const [leaderSort, setLeaderSort] = useState<LeaderSort>('goals');
  const [activeTab, setActiveTab] = useState<'performance' | 'discipline'>('performance');

  // Disciplinary state
  const [players, setPlayers] = useState<SupabasePlayer[]>(externalPlayers || []);
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('all');
  const [disciplinaryFilter, setDisciplinaryFilter] = useState<DisciplinaryFilter>('all');
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [isUpdatingCard, setIsUpdatingCard] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Sync with external players if provided
  useEffect(() => {
    if (externalPlayers && externalPlayers.length > 0) {
      setPlayers(externalPlayers);
    } else {
      // Load from Supabase service
      getPlayers().then((res) => {
        if (res.data) setPlayers(res.data);
      });
    }
  }, [externalPlayers]);

  const sortedLeaders = [...PLAYER_LEADERS].sort((a, b) => {
    if (leaderSort === 'goals') return b.goals - a.goals;
    if (leaderSort === 'assists') return b.assists - a.assists;
    return b.rating - a.rating;
  });

  const bestAttack = [...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const bestDefense = [...standings].sort(
    (a, b) => a.goalsAgainst - b.goalsAgainst
  )[0];
  const highestPossession = [...standings].sort(
    (a, b) => b.avgPossession - a.avgPossession
  )[0];

  // Disciplinary calculation & filtering
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (selectedClubFilter !== 'all' && p.team_id !== selectedClubFilter) {
        return false;
      }
      if (playerSearch.trim()) {
        const q = playerSearch.toLowerCase().trim();
        const club = CLUBS[p.team_id];
        const matchName = p.full_name.toLowerCase().includes(q);
        const matchClub = club ? club.name.toLowerCase().includes(q) : false;
        if (!matchName && !matchClub) return false;
      }
      const isSuspended = p.yellow_cards >= 5 || p.red_cards > 0;
      const isWarning = p.yellow_cards === 4 && p.red_cards === 0;

      if (disciplinaryFilter === 'suspended' && !isSuspended) return false;
      if (disciplinaryFilter === 'warning' && !isWarning) return false;
      if (disciplinaryFilter === 'clean' && (isSuspended || isWarning)) return false;

      return true;
    });
  }, [players, selectedClubFilter, disciplinaryFilter, playerSearch]);

  const handleCardChange = async (playerId: string, deltaYellow: number, deltaRed: number) => {
    const target = players.find((p) => p.id === playerId);
    if (!target) return;

    const nextYellow = Math.max(0, target.yellow_cards + deltaYellow);
    const nextRed = Math.max(0, target.red_cards + deltaRed);

    setIsUpdatingCard(playerId);
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? { ...p, yellow_cards: nextYellow, red_cards: nextRed }
          : p
      )
    );

    if (onUpdatePlayerCards) {
      onUpdatePlayerCards(playerId, nextYellow, nextRed);
    }

    const ok = await updatePlayerCards(playerId, nextYellow, nextRed);
    setIsUpdatingCard(null);

    if (nextYellow >= 5) {
      setNoticeMessage(`⚠️ ${target.full_name} acumuló ${nextYellow} amarillas. Sanción: 1 fecha de suspensión (Art. 91).`);
    } else if (nextRed > 0) {
      setNoticeMessage(`🟥 ${target.full_name} registra expulsión. Sanción disciplinaria aplicada.`);
    } else {
      setNoticeMessage(ok ? `Tarjetas actualizadas en Supabase (players).` : `Actualizado localmente.`);
    }
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const handleResetCards = async (playerId: string) => {
    setIsUpdatingCard(playerId);
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, yellow_cards: 0, red_cards: 0 } : p
      )
    );

    if (onUpdatePlayerCards) {
      onUpdatePlayerCards(playerId, 0, 0);
    }

    await updatePlayerCards(playerId, 0, 0);
    setIsUpdatingCard(null);
    setNoticeMessage(`Sanciones y tarjetas restablecidas para el jugador.`);
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  const totalSuspended = players.filter((p) => p.yellow_cards >= 5 || p.red_cards > 0).length;
  const totalWarning = players.filter((p) => p.yellow_cards === 4 && p.red_cards === 0).length;

  return (
    <div className="space-y-6">
      {/* View Switcher: Rendimiento vs Control Disciplinario */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-surface rounded-2xl border border-white/10">
        <div>
          <h2 className="font-display text-lg font-bold text-white">
            Panel de Estadísticas y Normativa de Competición
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Líderes de temporada, rendimiento colectivo y control disciplinario oficial (Art. 91)
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-lg bg-[#060F24]/90 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'performance'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rendimiento & Líderes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discipline')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'discipline'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Control Disciplinario ({totalSuspended})</span>
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-3 rounded-xl bg-amber-400/15 border border-amber-400/35 text-amber-200 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* TAB 1: RENDIMIENTO COLECTIVO E INDIVIDUAL */}
      {activeTab === 'performance' && (
        <>
          {/* Club Highlights Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bestAttack && (
              <button
                type="button"
                onClick={() => onSelectClub(bestAttack.club.id)}
                className="glass-card rounded-xl p-5 text-left hover:border-amber-400/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span>Mayor Poder Ofensivo</span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-center gap-3">
                  <ClubCrest club={bestAttack.club} size="md" />
                  <div>
                    <div className="font-display font-bold text-white text-base">
                      {bestAttack.club.name}
                    </div>
                    <div className="font-mono tabular-nums text-xs text-amber-300 mt-0.5">
                      {bestAttack.goalsFor} goles en {bestAttack.played} partidos
                    </div>
                  </div>
                </div>
              </button>
            )}

            {bestDefense && (
              <button
                type="button"
                onClick={() => onSelectClub(bestDefense.club.id)}
                className="glass-card rounded-xl p-5 text-left hover:border-amber-400/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span>Defensa Más Sólida</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center gap-3">
                  <ClubCrest club={bestDefense.club} size="md" />
                  <div>
                    <div className="font-display font-bold text-white text-base">
                      {bestDefense.club.name}
                    </div>
                    <div className="font-mono tabular-nums text-xs text-emerald-300 mt-0.5">
                      {bestDefense.goalsAgainst} goles recibidos ·{' '}
                      {bestDefense.cleanSheets} vallas invictas
                    </div>
                  </div>
                </div>
              </button>
            )}

            {highestPossession && (
              <button
                type="button"
                onClick={() => onSelectClub(highestPossession.club.id)}
                className="glass-card rounded-xl p-5 text-left hover:border-amber-400/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span>Control de Posesión</span>
                  <Award className="w-4 h-4 text-sky-400" />
                </div>
                <div className="flex items-center gap-3">
                  <ClubCrest club={highestPossession.club} size="md" />
                  <div>
                    <div className="font-display font-bold text-white text-base">
                      {highestPossession.club.name}
                    </div>
                    <div className="font-mono tabular-nums text-xs text-sky-300 mt-0.5">
                      {highestPossession.avgPossession.toFixed(1)}% posesión media
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Player Leaders Table */}
          <section className="glass-surface rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Líderes Individuales de la Temporada
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rendimiento acumulado de futbolistas destacados
                </p>
              </div>

              <div className="inline-flex items-center p-1 rounded-lg bg-[#060F24]/90 border border-white/10">
                {(
                  [
                    { id: 'goals', label: 'Goleadores' },
                    { id: 'assists', label: 'Asistencias' },
                    { id: 'rating', label: 'Valoración' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLeaderSort(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      leaderSort === tab.id
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#060F24]/60 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 pl-5 pr-2 w-12">#</th>
                    <th className="py-2.5 px-2">Jugador</th>
                    <th className="py-2.5 px-2">Club</th>
                    <th className="py-2.5 px-2 text-right">PJ</th>
                    <th className="py-2.5 px-2 text-right">Goles</th>
                    <th className="py-2.5 px-2 text-right">Asist.</th>
                    <th className="py-2.5 pl-2 pr-5 text-right">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-sm">
                  {sortedLeaders.map((p, idx) => {
                    const club = CLUBS[p.clubId];
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-white/[0.04] transition-colors"
                      >
                        <td className="py-3 pl-5 pr-2 font-mono tabular-nums text-xs text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-semibold text-white">{p.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {p.position}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {club && (
                            <div className="flex items-center gap-2">
                              <ClubCrest club={club} size="xs" />
                              <span className="text-xs text-slate-200">
                                {club.shortName}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-xs text-slate-300">
                          {p.matches}
                        </td>
                        <td
                          className={`py-3 px-2 text-right font-mono tabular-nums text-sm font-bold ${
                            leaderSort === 'goals'
                              ? 'text-amber-300'
                              : 'text-slate-200'
                          }`}
                        >
                          {p.goals}
                        </td>
                        <td
                          className={`py-3 px-2 text-right font-mono tabular-nums text-sm font-bold ${
                            leaderSort === 'assists'
                              ? 'text-amber-300'
                              : 'text-slate-200'
                          }`}
                        >
                          {p.assists}
                        </td>
                        <td className="py-3 pl-2 pr-5 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono tabular-nums text-xs font-bold ${
                              p.rating >= 7.7
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-sky-500/20 text-sky-300'
                            }`}
                          >
                            {p.rating.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* TAB 2: CONTROL DISCIPLINARIO Y SANCIONES (SUPABASE 'players' TABLE) */}
      {activeTab === 'discipline' && (
        <section className="glass-surface rounded-2xl overflow-hidden border border-white/10">
          <div className="p-5 border-b border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Régimen Disciplinario Oficial (Reglamento de Competición Art. 91)
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Registro de amonestaciones y expulsiones sincronizado con Supabase PostgreSQL (<code className="text-amber-300">players</code>). 
                  Normativa: La acumulación de <strong>cinco (5) tarjetas amarillas</strong> causa automáticamente <strong>un (1) partido de suspensión</strong>. 
                  La tarjeta roja directa genera suspensión inmediata sujeta al informe arbitral.
                </p>
              </div>

              {/* Summary KPIs */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/35 text-center">
                  <div className="font-mono tabular-nums font-bold text-red-300 text-sm">
                    {totalSuspended}
                  </div>
                  <div className="text-[10px] text-red-200 uppercase tracking-wider font-semibold">
                    Suspendidos
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/35 text-center">
                  <div className="font-mono tabular-nums font-bold text-amber-300 text-sm">
                    {totalWarning}
                  </div>
                  <div className="text-[10px] text-amber-200 uppercase tracking-wider font-semibold">
                    En Capilla (4/5)
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative min-w-[200px] max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Buscar futbolista o club..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#060F24]/85 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
                  />
                </div>

                {/* Club Filter */}
                <select
                  value={selectedClubFilter}
                  onChange={(e) => setSelectedClubFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[#060F24]/85 border border-white/10 text-slate-200 focus:outline-none focus:border-amber-400/60"
                >
                  <option value="all">Todos los Clubes</option>
                  {Object.values(CLUBS).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Segmented Filter */}
              <div className="inline-flex items-center p-1 rounded-lg bg-[#060F24]/90 border border-white/10">
                {(
                  [
                    { id: 'all', label: 'Todos' },
                    { id: 'suspended', label: 'Suspendidos' },
                    { id: 'warning', label: 'Alerta (4)' },
                    { id: 'clean', label: 'Habilitados' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setDisciplinaryFilter(f.id)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                      disciplinaryFilter === f.id
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Players Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#060F24]/60 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 pl-5 pr-2 w-10">Dorsal</th>
                  <th className="py-2.5 px-3">Futbolista</th>
                  <th className="py-2.5 px-3">Club</th>
                  <th className="py-2.5 px-3">Posición</th>
                  <th className="py-2.5 px-3 text-center">Amarillas</th>
                  <th className="py-2.5 px-3 text-center">Rojas</th>
                  <th className="py-2.5 px-3">Estado Disciplinario</th>
                  <th className="py-2.5 pl-2 pr-5 text-right">Gestión de Tarjetas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-sm">
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No se encontraron futbolistas con el criterio seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((player) => {
                    const club = CLUBS[player.team_id];
                    const isSuspended5Y = player.yellow_cards >= 5;
                    const isSuspendedRed = player.red_cards > 0;
                    const isSuspended = isSuspended5Y || isSuspendedRed;
                    const isWarning = player.yellow_cards === 4 && !isSuspendedRed;
                    const isBusy = isUpdatingCard === player.id;

                    return (
                      <tr key={player.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 pl-5 pr-2 font-mono tabular-nums text-xs font-bold text-slate-400">
                          #{player.number}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{player.full_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            ID: {player.id}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {club ? (
                            <div className="flex items-center gap-2">
                              <ClubCrest club={club} size="xs" />
                              <span className="text-xs text-slate-200">{club.shortName}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">{player.team_id}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-300">
                          {player.position}
                        </td>

                        {/* Yellow cards */}
                        <td className="py-3 px-3 text-center font-mono tabular-nums">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/30">
                            <span className="w-2.5 h-3.5 rounded-[1px] bg-amber-400 inline-block shadow-sm" />
                            <span className="text-xs font-bold text-amber-300">
                              {player.yellow_cards}
                            </span>
                          </div>
                        </td>

                        {/* Red cards */}
                        <td className="py-3 px-3 text-center font-mono tabular-nums">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30">
                            <span className="w-2.5 h-3.5 rounded-[1px] bg-red-500 inline-block shadow-sm" />
                            <span className="text-xs font-bold text-red-300">
                              {player.red_cards}
                            </span>
                          </div>
                        </td>

                        {/* Sanction status badge */}
                        <td className="py-3 px-3">
                          {isSuspendedRed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-600/25 text-red-300 border border-red-500/50">
                              <ShieldAlert className="w-3 h-3 text-red-400" />
                              EXPULSIÓN DIRECTA
                            </span>
                          ) : isSuspended5Y ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              SUSPENDIDO 1 FECHA (5A)
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              ALERTA AMARILLA (4/5)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Habilitado
                            </span>
                          )}
                        </td>

                        {/* Actions (Write to Supabase) */}
                        <td className="py-3 pl-2 pr-5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCardChange(player.id, 1, 0)}
                              disabled={isBusy}
                              className="px-2 py-1 rounded text-xs font-semibold bg-amber-400/20 hover:bg-amber-400/35 text-amber-300 border border-amber-400/40 transition-colors disabled:opacity-40"
                              title="Registrar 1 tarjeta amarilla"
                            >
                              +1 Amarilla
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCardChange(player.id, 0, 1)}
                              disabled={isBusy}
                              className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 hover:bg-red-500/35 text-red-300 border border-red-500/40 transition-colors disabled:opacity-40"
                              title="Registrar 1 tarjeta roja"
                            >
                              +1 Roja
                            </button>
                            {(player.yellow_cards > 0 || player.red_cards > 0) && (
                              <button
                                type="button"
                                onClick={() => handleResetCards(player.id)}
                                disabled={isBusy}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Limpiar sanciones (Cumplió fecha)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
