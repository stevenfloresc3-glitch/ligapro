export type CrestPattern = 'vertical' | 'diagonal' | 'chevron' | 'cross' | 'crown';

export interface Club {
  id: string;
  name: string;
  shortName: string;
  code: string;
  city: string;
  stadium: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pattern: CrestPattern;
  manager: string;
  founded: number;
}

export type FormResult = 'V' | 'E' | 'D';

export interface FormMatch {
  result: FormResult;
  opponentCode: string;
  score: string;
  isHome: boolean;
}

export interface SplitStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface BaseTeamStanding {
  clubId: string;
  home: SplitStats;
  away: SplitStats;
  form: FormMatch[];
  cleanSheets: number;
  avgPossession: number;
  expectedGoalsFor: number;
}

export interface ComputedStandingRow {
  position: number;
  livePositionDelta: number; // positive = moved up in live mode, negative = moved down
  club: Club;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  pointsPerGame: number;
  form: FormMatch[];
  isPlayingLive: boolean;
  liveOpponentCode?: string;
  liveScoreText?: string;
  zone: 'international' | 'playoff' | 'midtable' | 'relegation';
  cleanSheets: number;
  avgPossession: number;
}

export type MatchStatus = 'live' | 'finished' | 'upcoming';

export type MatchEventType = 'goal' | 'yellow' | 'red' | 'sub';

export interface MatchEvent {
  id: string;
  minute: number;
  teamSide: 'home' | 'away';
  type: MatchEventType;
  player: string;
  detail?: string;
}

export interface MatchStatComparison {
  label: string;
  homeValue: number | string;
  awayValue: number | string;
  homePct: number;
}

export interface Match {
  id: string;
  leagueId: string;
  matchday: number;
  status: MatchStatus;
  minute?: number;
  kickoffTime: string;
  dateLabel: string;
  stadium: string;
  referee: string;
  attendance?: string;
  homeClubId: string;
  awayClubId: string;
  homeScore: number;
  awayScore: number;
  homeHalfTime?: number;
  awayHalfTime?: number;
  homeFormation: string;
  awayFormation: string;
  events: MatchEvent[];
  stats: MatchStatComparison[];
  homeLineup: string[];
  awayLineup: string[];
}

export interface PlayerStatLeader {
  id: string;
  name: string;
  clubId: string;
  position: string;
  goals: number;
  assists: number;
  matches: number;
  rating: number;
}

export interface LeagueConfig {
  id: string;
  name: string;
  season: string;
  currentMatchday: number;
  totalMatchdays: number;
  internationalSlots: number;
  playoffSlots: number;
  relegationStart: number;
}
