import { CLUBS } from '../data/sportsData';
import {
  BaseTeamStanding,
  ComputedStandingRow,
  LeagueConfig,
  Match,
} from '../types/sports';

export type StandingsViewMode = 'general' | 'home' | 'away' | 'live';

function sortStandingRows(a: Omit<ComputedStandingRow, 'position' | 'livePositionDelta' | 'zone'>, b: Omit<ComputedStandingRow, 'position' | 'livePositionDelta' | 'zone'>) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.club.name.localeCompare(b.club.name);
}

function getZone(position: number, league: LeagueConfig): ComputedStandingRow['zone'] {
  if (position <= league.internationalSlots) return 'international';
  if (position <= league.playoffSlots) return 'playoff';
  if (position >= league.relegationStart) return 'relegation';
  return 'midtable';
}

export function computeStandings(
  baseList: BaseTeamStanding[],
  matches: Match[],
  league: LeagueConfig,
  mode: StandingsViewMode
): ComputedStandingRow[] {
  const leagueMatches = matches.filter((m) => m.leagueId === league.id);

  // First compute baseline "general" order so we know live position deltas
  const baselineOrder = new Map<string, number>();
  const baselineRows = baseList
    .map((entry) => {
      const club = CLUBS[entry.clubId];
      const played = entry.home.played + entry.away.played;
      const won = entry.home.won + entry.away.won;
      const drawn = entry.home.drawn + entry.away.drawn;
      const lost = entry.home.lost + entry.away.lost;
      const goalsFor = entry.home.goalsFor + entry.away.goalsFor;
      const goalsAgainst = entry.home.goalsAgainst + entry.away.goalsAgainst;
      const points = won * 3 + drawn;
      return {
        club,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
        pointsPerGame: played > 0 ? points / played : 0,
        form: entry.form,
        isPlayingLive: false,
        cleanSheets: entry.cleanSheets,
        avgPossession: entry.avgPossession,
      };
    })
    .sort(sortStandingRows);

  baselineRows.forEach((row, index) => {
    baselineOrder.set(row.club.id, index + 1);
  });

  const computed = baseList.map((entry) => {
    const club = CLUBS[entry.clubId];
    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    if (mode === 'home') {
      played = entry.home.played;
      won = entry.home.won;
      drawn = entry.home.drawn;
      lost = entry.home.lost;
      goalsFor = entry.home.goalsFor;
      goalsAgainst = entry.home.goalsAgainst;
    } else if (mode === 'away') {
      played = entry.away.played;
      won = entry.away.won;
      drawn = entry.away.drawn;
      lost = entry.away.lost;
      goalsFor = entry.away.goalsFor;
      goalsAgainst = entry.away.goalsAgainst;
    } else {
      played = entry.home.played + entry.away.played;
      won = entry.home.won + entry.away.won;
      drawn = entry.home.drawn + entry.away.drawn;
      lost = entry.home.lost + entry.away.lost;
      goalsFor = entry.home.goalsFor + entry.away.goalsFor;
      goalsAgainst = entry.home.goalsAgainst + entry.away.goalsAgainst;
    }

    // Check if team has an active live match in this league
    const liveMatch = leagueMatches.find(
      (m) => m.status === 'live' && (m.homeClubId === club.id || m.awayClubId === club.id)
    );

    let liveOpponentCode: string | undefined;
    let liveScoreText: string | undefined;

    if (liveMatch) {
      const isHome = liveMatch.homeClubId === club.id;
      const oppId = isHome ? liveMatch.awayClubId : liveMatch.homeClubId;
      liveOpponentCode = CLUBS[oppId]?.code;
      liveScoreText = isHome
        ? `${liveMatch.homeScore}-${liveMatch.awayScore}`
        : `${liveMatch.awayScore}-${liveMatch.homeScore}`;

      if (mode === 'live') {
        const gf = isHome ? liveMatch.homeScore : liveMatch.awayScore;
        const ga = isHome ? liveMatch.awayScore : liveMatch.homeScore;
        played += 1;
        goalsFor += gf;
        goalsAgainst += ga;
        if (gf > ga) won += 1;
        else if (gf === ga) drawn += 1;
        else lost += 1;
      }
    }

    const points = won * 3 + drawn;
    const goalDifference = goalsFor - goalsAgainst;

    return {
      club,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
      pointsPerGame: played > 0 ? points / played : 0,
      form: entry.form,
      isPlayingLive: Boolean(liveMatch),
      liveOpponentCode,
      liveScoreText,
      cleanSheets: entry.cleanSheets,
      avgPossession: entry.avgPossession,
    };
  });

  computed.sort(sortStandingRows);

  return computed.map((row, idx) => {
    const position = idx + 1;
    const basePos = baselineOrder.get(row.club.id) ?? position;
    const livePositionDelta = mode === 'live' ? basePos - position : 0;
    return {
      ...row,
      position,
      livePositionDelta,
      zone: getZone(position, league),
    };
  });
}
