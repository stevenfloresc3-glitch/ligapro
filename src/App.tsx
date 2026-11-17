import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  GitCompareArrows,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  Trophy,
} from 'lucide-react';
import { LeagueStatsView } from './components/LeagueStatsView';
import { MatchCard } from './components/MatchCard';
import { MatchInspector } from './components/MatchInspector';
import { StandingsTable } from './components/StandingsTable';
import { TeamComparisonModal } from './components/TeamComparisonModal';
import { MatchEventModal } from './components/MatchEventModal';
import { SupabaseSyncBanner } from './components/SupabaseSyncBanner';
import {
  BASE_STANDINGS,
  CLUBS,
  INITIAL_MATCHES,
  LEAGUES,
  SCORING_CANDIDATE_NAMES,
} from './data/sportsData';
import { Match, MatchStatus } from './types/sports';
import { SupabasePlayer } from './types/supabase';
import {
  getMatches,
  getPlayers,
  subscribeToMatchesRealtime,
} from './services/supabaseService';
import {
  computeStandings,
  StandingsViewMode,
} from './utils/standingsCalculator';

type NavSection = 'resumen' | 'partidos' | 'posiciones' | 'estadisticas';
type MatchFilter = 'all' | MatchStatus;

const BACKDROP_URL =
  '/src/assets/images/stadium_twilight_backdrop_1794888716117.jpg';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('resumen');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('primera');
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('m1');
  const [standingsMode, setStandingsMode] =
    useState<StandingsViewMode>('live');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [compareInitialClubId, setCompareInitialClubId] = useState<
    string | null
  >(null);
  const [backdropFailed, setBackdropFailed] = useState<boolean>(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(false);
  const [players, setPlayers] = useState<SupabasePlayer[]>([]);

  const handleRefreshFromSupabase = React.useCallback(async () => {
    try {
      const [matchesRes, playersRes] = await Promise.all([
        getMatches(),
        getPlayers(),
      ]);

      if (matchesRes.fromSupabase && matchesRes.data && matchesRes.data.length > 0) {
        setIsSupabaseLive(true);
        setMatches((prev) =>
          prev.map((pm) => {
            const remote = matchesRes.data?.find((rm) => rm.id === pm.id);
            if (remote) {
              return {
                ...pm,
                homeScore: remote.home_goals,
                awayScore: remote.visitor_goals,
                status: remote.status,
              };
            }
            return pm;
          })
        );
      }

      if (playersRes.data && playersRes.data.length > 0) {
        setPlayers(playersRes.data);
      }
    } catch (e) {
      console.warn('[Tribuna Central] Conexión local/híbrida activa:', e);
    }
  }, []);

  useEffect(() => {
    handleRefreshFromSupabase();

    const unsub = subscribeToMatchesRealtime((updatedRemote) => {
      setIsSupabaseLive(true);
      setMatches((prev) =>
        prev.map((pm) => {
          if (pm.id === updatedRemote.id) {
            return {
              ...pm,
              homeScore: updatedRemote.home_goals,
              awayScore: updatedRemote.visitor_goals,
              status: updatedRemote.status,
            };
          }
          return pm;
        })
      );
    });

    return () => {
      unsub();
    };
  }, [handleRefreshFromSupabase]);

  const activeLeague = useMemo(
    () => LEAGUES.find((l) => l.id === selectedLeagueId) ?? LEAGUES[0],
    [selectedLeagueId]
  );

  const leagueMatches = useMemo(
    () => matches.filter((m) => m.leagueId === activeLeague.id),
    [matches, activeLeague.id]
  );

  const filteredMatches = useMemo(() => {
    if (matchFilter === 'all') return leagueMatches;
    return leagueMatches.filter((m) => m.status === matchFilter);
  }, [leagueMatches, matchFilter]);

  // Keep selectedMatchId valid when switching leagues
  useEffect(() => {
    const existsInLeague = leagueMatches.some((m) => m.id === selectedMatchId);
    if (!existsInLeague && leagueMatches.length > 0) {
      setSelectedMatchId(leagueMatches[0].id);
    }
  }, [leagueMatches, selectedMatchId]);

  const selectedMatch = useMemo(
    () => leagueMatches.find((m) => m.id === selectedMatchId) ?? leagueMatches[0] ?? null,
    [leagueMatches, selectedMatchId]
  );

  const standings = useMemo(() => {
    const base = BASE_STANDINGS[activeLeague.id] ?? [];
    return computeStandings(base, matches, activeLeague, standingsMode);
  }, [activeLeague, matches, standingsMode]);

  const liveMatchCount = useMemo(
    () => leagueMatches.filter((m) => m.status === 'live').length,
    [leagueMatches]
  );

  const advanceLiveMinute = React.useCallback(() => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.status !== 'live') return m;
        const currentMin = m.minute ?? 45;
        const nextMin = currentMin + 1;

        if (nextMin >= 90) {
          return {
            ...m,
            minute: 90,
            status: 'finished',
            dateLabel: 'Finalizado',
          };
        }

        // Deterministic-feeling probabilistic event trigger (~10% chance per minute tick)
        const roll = Math.random();
        let nextHomeScore = m.homeScore;
        let nextAwayScore = m.awayScore;
        let nextEvents = m.events;
        let nextStats = m.stats;

        if (roll < 0.09) {
          const homeScores = Math.random() < 0.52;
          const scoringClubId = homeScores ? m.homeClubId : m.awayClubId;
          const pool = SCORING_CANDIDATE_NAMES[scoringClubId] ?? ['Jugador'];
          const scorer = pool[Math.floor(Math.random() * pool.length)];

          if (homeScores) nextHomeScore += 1;
          else nextAwayScore += 1;

          nextEvents = [
            ...m.events,
            {
              id: `sim-${m.id}-${nextMin}-${Math.floor(roll * 1000)}`,
              minute: nextMin,
              teamSide: homeScores ? 'home' : 'away',
              type: 'goal',
              player: scorer,
              detail: 'Gol en jugada abierta',
            },
          ];

          nextStats = m.stats.map((st) => {
            if (st.label === 'Remates totales' || st.label === 'Remates al arco') {
              const hv = Number(st.homeValue) + (homeScores ? 1 : 0);
              const av = Number(st.awayValue) + (!homeScores ? 1 : 0);
              const pct = hv + av > 0 ? Math.round((hv / (hv + av)) * 100) : 50;
              return { ...st, homeValue: hv, awayValue: av, homePct: pct };
            }
            if (st.label === 'Goles esperados (xG)') {
              const hv = parseFloat(String(st.homeValue)) + (homeScores ? 0.34 : 0);
              const av = parseFloat(String(st.awayValue)) + (!homeScores ? 0.34 : 0);
              const pct = hv + av > 0 ? Math.round((hv / (hv + av)) * 100) : 50;
              return {
                ...st,
                homeValue: hv.toFixed(2),
                awayValue: av.toFixed(2),
                homePct: pct,
              };
            }
            return st;
          });
        }

        return {
          ...m,
          minute: nextMin,
          homeScore: nextHomeScore,
          awayScore: nextAwayScore,
          events: nextEvents,
          stats: nextStats,
        };
      })
    );
  }, []);

  useEffect(() => {
    if (!isAutoSimulating) return;
    const timer = window.setInterval(() => {
      advanceLiveMinute();
    }, 1800);
    return () => window.clearInterval(timer);
  }, [isAutoSimulating, advanceLiveMinute]);

  // Stop auto simulation automatically when no live matches remain
  useEffect(() => {
    const anyLive = matches.some((m) => m.status === 'live');
    if (!anyLive && isAutoSimulating) {
      setIsAutoSimulating(false);
    }
  }, [matches, isAutoSimulating]);

  const handleResetSimulation = () => {
    setIsAutoSimulating(false);
    setMatches(INITIAL_MATCHES);
  };

  const handleJumpToClubMatch = (clubId: string) => {
    const found = leagueMatches.find(
      (m) => m.homeClubId === clubId || m.awayClubId === clubId
    );
    if (found) {
      setSelectedMatchId(found.id);
      if (activeNav === 'posiciones' || activeNav === 'estadisticas') {
        setActiveNav('resumen');
      }
    }
  };

  const handleOpenCompare = (clubId?: string | null) => {
    setCompareInitialClubId(clubId ?? null);
    setIsCompareOpen(true);
  };

  const leaderClub = standings[0]?.club;

  return (
    <div className="min-h-screen flex flex-col bg-[#050C1A] text-slate-100">
      {/* Top Bar: Strict 3-zone contract */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050C1A]/85 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Mark */}
          <button
            type="button"
            onClick={() => setActiveNav('resumen')}
            className="inline-flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
              aria-hidden="true"
            >
              <path
                d="M16 2L28 6.5V16C28 23.4 22.9 28.9 16 31C9.1 28.9 4 23.4 4 16V6.5L16 2Z"
                fill="#0F2552"
                stroke="#EAB308"
                strokeWidth="2"
              />
              <path
                d="M11 11H21M16 11V23"
                stroke="#F8FAFC"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Tribuna Central
            </span>
          </button>

          {/* Zone 2: 4 single-line Navigation Links */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-7"
          >
            {(
              [
                { id: 'resumen', label: 'Resumen' },
                { id: 'partidos', label: 'Partidos' },
                { id: 'posiciones', label: 'Posiciones' },
                { id: 'estadisticas', label: 'Estadísticas' },
              ] as const
            ).map((item) => {
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`py-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${active
                      ? 'border-amber-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-100'
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Supabase Sync Status & Primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <SupabaseSyncBanner
              isSupabaseLive={isSupabaseLive}
              onRefreshAll={handleRefreshFromSupabase}
            />
            <button
              type="button"
              onClick={() => handleOpenCompare(selectedClubId)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              Comparar Clubes
            </button>
          </div>
        </div>

        {/* Mobile Nav Row (keeps desktop strictly single-row) */}
        <nav
          aria-label="Navegación móvil"
          className="md:hidden flex items-center justify-around border-t border-white/8 px-2 py-1.5"
        >
          {(
            [
              { id: 'resumen', label: 'Resumen' },
              { id: 'partidos', label: 'Partidos' },
              { id: 'posiciones', label: 'Posiciones' },
              { id: 'estadisticas', label: 'Estadísticas' },
            ] as const
          ).map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${active
                    ? 'text-amber-300 bg-white/8'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1">
        {/* Atmospheric Stadium Backdrop Hero + Glassmorphism Matchday Strip */}
        <section className="relative overflow-hidden border-b border-white/10">
          {/* Stadium Backdrop Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {!backdropFailed ? (
              <img
                src={BACKDROP_URL}
                alt="Estadio iluminado al anochecer"
                referrerPolicy="no-referrer"
                onError={() => setBackdropFailed(true)}
                className="w-full h-full object-cover object-center opacity-45 scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0A1D44] via-[#071229] to-[#050C1A]" />
            )}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(5,12,26,0.72) 0%, rgba(7,18,41,0.82) 52%, rgba(5,12,26,1) 100%)',
              }}
            />
          </div>

          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-9 space-y-6">
            {/* Competition Header & Workspace Controls */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300/95 font-medium">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>{activeLeague.name}</span>
                  <span aria-hidden="true" className="text-slate-500">
                    ·
                  </span>
                  <span className="text-slate-300">
                    Temporada {activeLeague.season}
                  </span>
                  <span aria-hidden="true" className="text-slate-500">
                    ·
                  </span>
                  <span className="text-slate-300 font-mono tabular-nums">
                    Jornada {activeLeague.currentMatchday}
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
                  Centro de Resultados y Clasificación en Vivo
                </h1>

                {leaderClub && (
                  <p className="text-sm text-slate-300">
                    Líder actual:{' '}
                    <span className="font-semibold text-white">
                      {leaderClub.name}
                    </span>{' '}
                    con{' '}
                    <span className="font-mono tabular-nums text-amber-300 font-semibold">
                      {standings[0].points} pts
                    </span>
                    <span className="mx-2 text-slate-500" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {liveMatchCount}{' '}
                      {liveMatchCount === 1
                        ? 'encuentro en curso'
                        : 'encuentros en curso'}
                    </span>
                  </p>
                )}
              </div>

              {/* Workspace Toolbar: League Switcher & Live Simulation Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Competition Selector */}
                <div className="inline-flex items-center p-1 rounded-lg bg-[#050C1A]/85 backdrop-blur-md border border-white/12">
                  {LEAGUES.map((lg) => (
                    <button
                      key={lg.id}
                      type="button"
                      onClick={() => {
                        setSelectedLeagueId(lg.id);
                        setSelectedClubId(null);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${selectedLeagueId === lg.id
                          ? 'bg-white/15 text-white'
                          : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      {lg.id === 'primera' ? 'Primera División' : 'Copa de Honor'}
                    </button>
                  ))}
                </div>

                {/* Live Match Simulator Controls */}
                <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#050C1A]/85 backdrop-blur-md border border-white/12">
                  <button
                    type="button"
                    onClick={() => setIsAutoSimulating((v) => !v)}
                    disabled={liveMatchCount === 0}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 ${isAutoSimulating
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/10 text-white hover:bg-white/18'
                      }`}
                  >
                    {isAutoSimulating ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        Pausar en vivo
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Simular en vivo
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={advanceLiveMinute}
                    disabled={liveMatchCount === 0}
                    title="Avanzar 1 minuto en partidos en vivo"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40"
                  >
                    <StepForward className="w-3.5 h-3.5" />
                    +1&apos;
                  </button>

                  <button
                    type="button"
                    onClick={handleResetSimulation}
                    title="Restablecer marcadores iniciales"
                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Restablecer jornada"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Matchday Filter & Glassmorphism Match Cards */}
            {(activeNav === 'resumen' || activeNav === 'partidos') && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CalendarDays className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-white">
                      Cartelera de la Jornada {activeLeague.currentMatchday}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#050C1A]/80 backdrop-blur-md border border-white/10">
                    {(
                      [
                        { id: 'all', label: 'Todos' },
                        { id: 'live', label: 'En Vivo' },
                        { id: 'finished', label: 'Finalizados' },
                        { id: 'upcoming', label: 'Próximos' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setMatchFilter(f.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${matchFilter === f.id
                            ? 'bg-amber-400 text-slate-950 font-semibold'
                            : 'text-slate-400 hover:text-white'
                          }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredMatches.length === 0 ? (
                  <div className="glass-surface rounded-xl p-8 text-center text-sm text-slate-400">
                    No hay encuentros bajo este filtro en la jornada actual.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        isSelected={selectedMatch?.id === match.id}
                        onSelect={(id) => setSelectedMatchId(id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Primary Workspace Grid */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeNav === 'resumen' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                <StandingsTable
                  rows={standings}
                  league={activeLeague}
                  viewMode={standingsMode}
                  onChangeViewMode={setStandingsMode}
                  selectedClubId={selectedClubId}
                  onSelectClub={setSelectedClubId}
                  onCompareClub={(id) => handleOpenCompare(id)}
                  onJumpToClubMatch={handleJumpToClubMatch}
                />
              </div>

              <div className="lg:col-span-4 lg:sticky lg:top-22">
                <MatchInspector
                  match={selectedMatch}
                  onSelectClub={(id) => setSelectedClubId(id)}
                  onOpenEventModal={() => setIsEventModalOpen(true)}
                />
              </div>
            </div>
          )}

          {activeNav === 'partidos' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4">
                <div className="glass-surface rounded-2xl p-5">
                  <h2 className="font-display text-lg font-bold text-white mb-1">
                    Resumen de Encuentros
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    Selecciona cualquier partido en las tarjetas superiores para
                    desglosar incidencias, métricas y alineaciones oficiales.
                  </p>
                  <div className="divide-y divide-white/8">
                    {leagueMatches.map((m) => {
                      const home = CLUBS[m.homeClubId];
                      const away = CLUBS[m.awayClubId];
                      if (!home || !away) return null;
                      const isSel = selectedMatch?.id === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMatchId(m.id)}
                          className={`w-full py-3 px-3 flex items-center justify-between gap-4 text-left rounded-lg transition-colors ${isSel ? 'bg-amber-400/12' : 'hover:bg-white/[0.04]'
                            }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                              {home.name} vs {away.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {m.stadium} · Árbitro: {m.referee}
                            </div>
                          </div>
                          <div className="shrink-0 text-right font-mono tabular-nums">
                            <div className="text-sm font-bold text-white">
                              {m.status === 'upcoming'
                                ? m.kickoffTime
                                : `${m.homeScore} - ${m.awayScore}`}
                            </div>
                            <div className="text-[11px] text-amber-300">
                              {m.status === 'live'
                                ? `${m.minute}'`
                                : m.status === 'finished'
                                  ? 'Final'
                                  : 'Programado'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <MatchInspector
                  match={selectedMatch}
                  onSelectClub={(id) => {
                    setSelectedClubId(id);
                    setActiveNav('posiciones');
                  }}
                  onOpenEventModal={() => setIsEventModalOpen(true)}
                />
              </div>
            </div>
          )}

          {activeNav === 'posiciones' && (
            <StandingsTable
              rows={standings}
              league={activeLeague}
              viewMode={standingsMode}
              onChangeViewMode={setStandingsMode}
              selectedClubId={selectedClubId}
              onSelectClub={setSelectedClubId}
              onCompareClub={(id) => handleOpenCompare(id)}
              onJumpToClubMatch={handleJumpToClubMatch}
            />
          )}

          {activeNav === 'estadisticas' && (
            <LeagueStatsView
              standings={standings}
              onSelectClub={(id) => {
                setSelectedClubId(id);
                setActiveNav('posiciones');
              }}
              playersList={players}
              onUpdatePlayerCards={(id, y, r) =>
                setPlayers((prev) =>
                  prev.map((p) =>
                    p.id === id ? { ...p, yellow_cards: y, red_cards: r } : p
                  )
                )
              }
            />
          )}
        </div>
      </main>

      {/* Clean Institutional Footer */}
      <footer className="border-t border-white/10 bg-[#040A16] py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>
            Tribuna Central · {activeLeague.name} · Temporada{' '}
            {activeLeague.season}
          </span>
          <span>
            Datos oficiales de competición y clasificación en tiempo real
          </span>
        </div>
      </footer>

      {/* Club Head-to-Head Comparison Modal */}
      <TeamComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        standings={standings}
        initialClubAId={compareInitialClubId}
      />

      {/* Official Match Event & Scorecard Recorder Modal */}
      <MatchEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        match={selectedMatch}
        onMatchUpdated={(updated) => {
          setMatches((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }}
      />
    </div>
  );
}
