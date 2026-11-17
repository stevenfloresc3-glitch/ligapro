export interface SupabaseTeam {
  id: string;
  name: string;
  serie: string;
  city: string;
  logo_url: string | null;
}

export interface SupabaseMatch {
  id: string;
  phase: string;
  home_team_id: string;
  visitor_team_id: string;
  home_goals: number;
  visitor_goals: number;
  match_date: string;
  status: 'upcoming' | 'live' | 'finished' | 'suspended';
}

export interface SupabaseStanding {
  id: string;
  team_id: string;
  phase: string;
  matches_played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

export interface SupabasePlayer {
  id: string;
  team_id: string;
  full_name: string;
  position: 'Arquero' | 'Defensa' | 'Mediocampista' | 'Delantero' | string;
  number: number;
  yellow_cards: number;
  red_cards: number;
}

