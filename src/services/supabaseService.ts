import { supabase } from '../lib/supabase';
import {
  SupabaseMatch,
  SupabasePlayer,
  SupabaseStanding,
  SupabaseTeam,
} from '../types/supabase';
import { CLUBS, INITIAL_MATCHES, BASE_STANDINGS, LEAGUES } from '../data/sportsData';

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  fromSupabase: boolean;
}

// -------------------------------------------------------------
// 1. GESTIÓN DE EQUIPOS (teams)
// -------------------------------------------------------------
export async function getTeams(): Promise<ServiceResponse<SupabaseTeam[]>> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) throw error;

    if (data && data.length > 0) {
      return { data, error: null, fromSupabase: true };
    }

    // Si la tabla está vacía en Supabase, retornamos el dataset local
    const fallbackTeams: SupabaseTeam[] = Object.values(CLUBS).map((c) => ({
      id: c.id,
      name: c.name,
      serie: 'A',
      city: c.city,
      logo_url: null,
    }));

    return { data: fallbackTeams, error: null, fromSupabase: false };
  } catch (err: any) {
    console.warn('[Supabase] Error al consultar teams, usando datos locales:', err.message);
    const fallbackTeams: SupabaseTeam[] = Object.values(CLUBS).map((c) => ({
      id: c.id,
      name: c.name,
      serie: 'A',
      city: c.city,
      logo_url: null,
    }));
    return { data: fallbackTeams, error: err.message, fromSupabase: false };
  }
}

export async function upsertTeam(team: SupabaseTeam): Promise<boolean> {
  try {
    const { error } = await supabase.from('teams').upsert(team);
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('[Supabase] Error al guardar equipo:', err.message);
    return false;
  }
}

// -------------------------------------------------------------
// 2. GESTIÓN DE PARTIDOS (matches)
// -------------------------------------------------------------
export async function getMatches(phase?: string): Promise<ServiceResponse<SupabaseMatch[]>> {
  try {
    let query = supabase.from('matches').select('*').order('match_date', { ascending: true });
    if (phase) {
      query = query.eq('phase', phase);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      return { data, error: null, fromSupabase: true };
    }

    // Fallback con los partidos iniciales del fixture
    const fallbackMatches: SupabaseMatch[] = INITIAL_MATCHES.map((m) => ({
      id: m.id,
      phase: `Jornada ${m.matchday}`,
      home_team_id: m.homeClubId,
      visitor_team_id: m.awayClubId,
      home_goals: m.homeScore,
      visitor_goals: m.awayScore,
      match_date: m.kickoffTime || '2026-11-16 19:00',
      status: m.status,
    }));

    return { data: fallbackMatches, error: null, fromSupabase: false };
  } catch (err: any) {
    console.warn('[Supabase] Error al consultar matches, usando fallback:', err.message);
    const fallbackMatches: SupabaseMatch[] = INITIAL_MATCHES.map((m) => ({
      id: m.id,
      phase: `Jornada ${m.matchday}`,
      home_team_id: m.homeClubId,
      visitor_team_id: m.awayClubId,
      home_goals: m.homeScore,
      visitor_goals: m.awayScore,
      match_date: m.kickoffTime || '2026-11-16 19:00',
      status: m.status,
    }));
    return { data: fallbackMatches, error: err.message, fromSupabase: false };
  }
}

export async function updateMatchRecord(match: Partial<SupabaseMatch> & { id: string }): Promise<boolean> {
  try {
    const { error } = await supabase.from('matches').upsert(match);
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('[Supabase] Error al actualizar match:', err.message);
    return false;
  }
}

// -------------------------------------------------------------
// 3. GESTIÓN DE TABLA DE POSICIONES (standings)
// -------------------------------------------------------------
export async function getStandings(phase?: string): Promise<ServiceResponse<SupabaseStanding[]>> {
  try {
    let query = supabase.from('standings').select('*').order('points', { ascending: false });
    if (phase) {
      query = query.eq('phase', phase);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      return { data, error: null, fromSupabase: true };
    }

    // Fallback inicial
    const baseList = BASE_STANDINGS['primera'] || [];
    const fallbackStandings: SupabaseStanding[] = baseList.map((entry, idx) => {
      const won = entry.home.won + entry.away.won;
      const drawn = entry.home.drawn + entry.away.drawn;
      const lost = entry.home.lost + entry.away.lost;
      const gf = entry.home.goalsFor + entry.away.goalsFor;
      const ga = entry.home.goalsAgainst + entry.away.goalsAgainst;
      return {
        id: `st-${entry.clubId}-${idx}`,
        team_id: entry.clubId,
        phase: 'Fase Uno',
        matches_played: entry.home.played + entry.away.played,
        won,
        drawn,
        lost,
        goals_for: gf,
        goals_against: ga,
        points: won * 3 + drawn,
      };
    });

    return { data: fallbackStandings, error: null, fromSupabase: false };
  } catch (err: any) {
    console.warn('[Supabase] Error al consultar standings, usando fallback:', err.message);
    return { data: null, error: err.message, fromSupabase: false };
  }
}

export async function saveStandingsBatch(standings: SupabaseStanding[]): Promise<boolean> {
  try {
    const { error } = await supabase.from('standings').upsert(standings);
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('[Supabase] Error al sincronizar standings:', err.message);
    return false;
  }
}

// -------------------------------------------------------------
// 4. GESTIÓN DE JUGADORES Y SANCIONES (players)
// -------------------------------------------------------------
export async function getPlayers(teamId?: string): Promise<ServiceResponse<SupabasePlayer[]>> {
  try {
    let query = supabase.from('players').select('*').order('number');
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      return { data, error: null, fromSupabase: true };
    }

    // Fallback data de jugadores
    const fallbackPlayers = generateFallbackPlayers(teamId);
    return { data: fallbackPlayers, error: null, fromSupabase: false };
  } catch (err: any) {
    console.warn('[Supabase] Error al consultar players:', err.message);
    const fallbackPlayers = generateFallbackPlayers(teamId);
    return { data: fallbackPlayers, error: err.message, fromSupabase: false };
  }
}

export async function updatePlayerCards(
  playerId: string,
  yellowCards: number,
  redCards: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('players')
      .update({ yellow_cards: yellowCards, red_cards: redCards })
      .eq('id', playerId);

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('[Supabase] Error al actualizar tarjetas de jugador:', err.message);
    return false;
  }
}

export async function upsertPlayer(player: SupabasePlayer): Promise<boolean> {
  try {
    const { error } = await supabase.from('players').upsert(player);
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('[Supabase] Error al guardar jugador:', err.message);
    return false;
  }
}

// -------------------------------------------------------------
// 5. SEMBRADOR COMPLETO (SEEDER) A SUPABASE
// -------------------------------------------------------------
export async function seedSupabaseDatabase(onProgress?: (msg: string) => void): Promise<{ success: boolean; message: string }> {
  try {
    onProgress?.('Iniciando sincronización con Supabase...');

    // A. Insertar Equipos
    onProgress?.('Registrando clubes oficiales (teams)...');
    const teamsToInsert: SupabaseTeam[] = Object.values(CLUBS).map((c) => ({
      id: c.id,
      name: c.name,
      serie: 'A',
      city: c.city,
      logo_url: null,
    }));

    const { error: errTeams } = await supabase.from('teams').upsert(teamsToInsert);
    if (errTeams) {
      console.warn('Teams insert warning:', errTeams);
    }

    // B. Insertar Partidos
    onProgress?.('Insertando fixture y cartelera oficial (matches)...');
    const matchesToInsert: SupabaseMatch[] = INITIAL_MATCHES.map((m) => ({
      id: m.id,
      phase: 'Fase Uno',
      home_team_id: m.homeClubId,
      visitor_team_id: m.awayClubId,
      home_goals: m.homeScore,
      visitor_goals: m.awayScore,
      match_date: m.kickoffTime ? `2026-11-16 ${m.kickoffTime}` : '2026-11-16 19:00',
      status: m.status,
    }));

    const { error: errMatches } = await supabase.from('matches').upsert(matchesToInsert);
    if (errMatches) {
      console.warn('Matches insert warning:', errMatches);
    }

    // C. Insertar Tabla de Posiciones
    onProgress?.('Calculando y guardando tabla de posiciones (standings)...');
    const baseList = BASE_STANDINGS['primera'] || [];
    const standingsToInsert: SupabaseStanding[] = baseList.map((entry, idx) => {
      const won = entry.home.won + entry.away.won;
      const drawn = entry.home.drawn + entry.away.drawn;
      const lost = entry.home.lost + entry.away.lost;
      const gf = entry.home.goalsFor + entry.away.goalsFor;
      const ga = entry.home.goalsAgainst + entry.away.goalsAgainst;
      return {
        id: `stand-${entry.clubId}-fase1`,
        team_id: entry.clubId,
        phase: 'Fase Uno',
        matches_played: entry.home.played + entry.away.played,
        won,
        drawn,
        lost,
        goals_for: gf,
        goals_against: ga,
        points: won * 3 + drawn,
      };
    });

    const { error: errStandings } = await supabase.from('standings').upsert(standingsToInsert);
    if (errStandings) {
      console.warn('Standings insert warning:', errStandings);
    }

    // D. Insertar Plantillas de Jugadores
    onProgress?.('Insertando plantillas de jugadores y sanciones (players)...');
    const playersToInsert = generateFallbackPlayers();
    const { error: errPlayers } = await supabase.from('players').upsert(playersToInsert);
    if (errPlayers) {
      console.warn('Players insert warning:', errPlayers);
    }

    onProgress?.('¡Base de datos en Supabase poblada con éxito!');
    return {
      success: true,
      message: 'Tablas teams, matches, standings y players sincronizadas correctamente en Supabase.',
    };
  } catch (err: any) {
    console.error('Error durante el seed de Supabase:', err);
    return {
      success: false,
      message: err.message || 'Error al conectar o escribir en Supabase.',
    };
  }
}

// -------------------------------------------------------------
// 6. SUSCRIPCIONES EN TIEMPO REAL (REALTIME)
// -------------------------------------------------------------
export function subscribeToMatchesRealtime(onChange: (match: SupabaseMatch) => void) {
  const channel = supabase
    .channel('public:matches')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matches' },
      (payload) => {
        if (payload.new) {
          onChange(payload.new as SupabaseMatch);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToStandingsRealtime(onChange: () => void) {
  const channel = supabase
    .channel('public:standings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'standings' },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// -------------------------------------------------------------
// HELPER: Generador de plantilla de jugadores representativos
// -------------------------------------------------------------
function generateFallbackPlayers(specificTeamId?: string): SupabasePlayer[] {
  const targetClubIds = specificTeamId ? [specificTeamId] : Object.keys(CLUBS);
  const playersList: SupabasePlayer[] = [];

  const basePositions: Array<SupabasePlayer['position']> = [
    'Arquero',
    'Defensa',
    'Defensa',
    'Defensa',
    'Defensa',
    'Mediocampista',
    'Mediocampista',
    'Mediocampista',
    'Delantero',
    'Delantero',
    'Delantero',
  ];

  const surnames = [
    'Mendoza', 'Santamaría', 'Benítez', 'Bustamante', 'Riquelme', 'Vera',
    'Correa', 'Ocampo', 'Alarcón', 'Valdivia', 'Salgado', 'Montalvo',
    'Paredes', 'Quiñónez', 'Cevallos', 'Caicedo', 'Castillo', 'Guerrero'
  ];

  targetClubIds.forEach((clubId) => {
    basePositions.forEach((pos, idx) => {
      const num = idx + 1;
      const surname = surnames[(num * 3 + clubId.length) % surnames.length];
      const initial = String.fromCharCode(65 + ((num + clubId.length) % 26));

      // Simular tarjetas acumuladas reales para probar normativas de suspensión (Art. 91)
      let yellowCards = (idx * 2 + clubId.length) % 6; // Algunos tendrán 5 para testear suspensión
      let redCards = (idx === 4 && clubId === 'atletico_dorado') ? 1 : 0;

      playersList.push({
        id: `pl-${clubId}-${num}`,
        team_id: clubId,
        full_name: `${initial}. ${surname}`,
        position: pos,
        number: num,
        yellow_cards: yellowCards,
        red_cards: redCards,
      });
    });
  });

  return playersList;
}

