import type { FixtureData } from '../types';
import type { LeagueDetails, Match, H2HRecord, MatchResult } from '$lib/types/fpl';

// Mock FDR fixtures for testing
export const mockFixtures: FixtureData[] = [
	// GW1 - Normal fixtures
	{
		id: 1,
		event: 1,
		team_h: 14, // Liverpool home
		team_a: 1, // Arsenal away
		team_h_difficulty: 3, // Neutral for Liverpool at home
		team_a_difficulty: 4 // Harder for Arsenal away
	},
	{
		id: 2,
		event: 1,
		team_h: 13, // Man City home
		team_a: 6, // Chelsea away
		team_h_difficulty: 2, // Easy for City at home
		team_a_difficulty: 5 // Very hard for Chelsea
	},
	// GW2 - Different fixtures
	{
		id: 3,
		event: 2,
		team_h: 1, // Arsenal home
		team_a: 14, // Liverpool away
		team_h_difficulty: 4, // Tough for Arsenal at home vs Liverpool
		team_a_difficulty: 3 // Neutral for Liverpool away
	},
	{
		id: 4,
		event: 2,
		team_h: 6, // Chelsea home
		team_a: 13, // Man City away
		team_h_difficulty: 5, // Very hard for Chelsea
		team_a_difficulty: 2 // Easy for City away
	},
	// GW3 - DGW for team 14 (Liverpool has 2 fixtures)
	{
		id: 5,
		event: 3,
		team_h: 14, // Liverpool home
		team_a: 11, // Newcastle away
		team_h_difficulty: 2, // Easy for Liverpool
		team_a_difficulty: 4 // Hard for Newcastle
	},
	{
		id: 6,
		event: 3,
		team_h: 20, // West Ham home
		team_a: 14, // Liverpool away
		team_h_difficulty: 4, // Hard for West Ham
		team_a_difficulty: 2 // Easy for Liverpool
	},
	// GW4 - Easy fixture
	{
		id: 7,
		event: 4,
		team_h: 14,
		team_a: 15, // Bottom team
		team_h_difficulty: 1, // Easiest
		team_a_difficulty: 5
	},
	// GW5 - Hard fixture
	{
		id: 8,
		event: 5,
		team_h: 13, // Man City
		team_a: 14, // Liverpool
		team_h_difficulty: 4,
		team_a_difficulty: 5 // Hardest
	}
];

// Map fixtures by gameweek for easier testing
export function createFixturesByGw(fixtures: FixtureData[]): Map<number, FixtureData[]> {
	const fixturesByGw = new Map<number, FixtureData[]>();
	for (const f of fixtures) {
		if (!fixturesByGw.has(f.event)) {
			fixturesByGw.set(f.event, []);
		}
		fixturesByGw.get(f.event)!.push(f);
	}
	return fixturesByGw;
}

export const mockFixturesByGw = createFixturesByGw(mockFixtures);

// Mock league entries for H2H testing
export const mockLeagueEntries: LeagueDetails['league_entries'] = [
	{
		id: 1,
		entry_id: 101,
		entry_name: 'Team Alpha',
		player_first_name: 'John',
		player_last_name: 'Smith',
		short_name: 'JS',
		waiver_pick: 1,
		joined_time: '2024-08-01T00:00:00Z'
	},
	{
		id: 2,
		entry_id: 102,
		entry_name: 'Team Beta',
		player_first_name: 'Jane',
		player_last_name: 'Doe',
		short_name: 'JD',
		waiver_pick: 2,
		joined_time: '2024-08-01T00:00:00Z'
	},
	{
		id: 3,
		entry_id: 103,
		entry_name: 'Team Gamma',
		player_first_name: 'Bob',
		player_last_name: 'Wilson',
		short_name: 'BW',
		waiver_pick: 3,
		joined_time: '2024-08-01T00:00:00Z'
	},
	{
		id: 4,
		entry_id: 104,
		entry_name: 'Team Delta',
		player_first_name: 'Alice',
		player_last_name: 'Brown',
		short_name: 'AB',
		waiver_pick: 4,
		joined_time: '2024-08-01T00:00:00Z'
	},
	// AVERAGE entry (special system entry)
	{
		id: 5,
		entry_id: null,
		entry_name: null,
		player_first_name: null,
		player_last_name: null,
		short_name: 'AVG',
		waiver_pick: null,
		joined_time: '2024-08-01T00:00:00Z'
	}
];

// Mock matches for H2H testing
export const mockMatches: Match[] = [
	// GW1 matches
	{
		event: 1,
		finished: true,
		league_entry_1: 1, // John wins
		league_entry_1_points: 65,
		league_entry_2: 2, // Jane loses
		league_entry_2_points: 52,
		started: true,
		winning_league_entry: 1,
		winning_method: 'points'
	},
	{
		event: 1,
		finished: true,
		league_entry_1: 3, // Bob
		league_entry_1_points: 48,
		league_entry_2: 4, // Alice wins
		league_entry_2_points: 55,
		started: true,
		winning_league_entry: 4,
		winning_method: 'points'
	},
	// GW2 matches
	{
		event: 2,
		finished: true,
		league_entry_1: 1, // John loses
		league_entry_1_points: 40,
		league_entry_2: 3, // Bob wins
		league_entry_2_points: 58,
		started: true,
		winning_league_entry: 3,
		winning_method: 'points'
	},
	{
		event: 2,
		finished: true,
		league_entry_1: 2, // Jane draw
		league_entry_1_points: 50,
		league_entry_2: 4, // Alice draw
		league_entry_2_points: 50,
		started: true,
		winning_league_entry: null,
		winning_method: null
	},
	// GW3 matches
	{
		event: 3,
		finished: true,
		league_entry_1: 1, // John wins
		league_entry_1_points: 70,
		league_entry_2: 4, // Alice loses
		league_entry_2_points: 45,
		started: true,
		winning_league_entry: 1,
		winning_method: 'points'
	},
	{
		event: 3,
		finished: true,
		league_entry_1: 2, // Jane wins
		league_entry_1_points: 62,
		league_entry_2: 3, // Bob loses
		league_entry_2_points: 38,
		started: true,
		winning_league_entry: 2,
		winning_method: 'points'
	},
	// GW4 matches - unfinished
	{
		event: 4,
		finished: false,
		league_entry_1: 1,
		league_entry_1_points: 0,
		league_entry_2: 2,
		league_entry_2_points: 0,
		started: false,
		winning_league_entry: null,
		winning_method: null
	},
	// More matches to create varied records
	{
		event: 5,
		finished: true,
		league_entry_1: 1, // John vs Jane rematch - John wins again
		league_entry_1_points: 72,
		league_entry_2: 2,
		league_entry_2_points: 55,
		started: true,
		winning_league_entry: 1,
		winning_method: 'points'
	},
	{
		event: 6,
		finished: true,
		league_entry_1: 1, // John vs Bob - Bob wins (John's nemesis?)
		league_entry_1_points: 45,
		league_entry_2: 3,
		league_entry_2_points: 60,
		started: true,
		winning_league_entry: 3,
		winning_method: 'points'
	}
];

// Expected H2H records for testing
export const expectedH2HRecord_1_2: Partial<H2HRecord> = {
	manager1Id: 1,
	manager2Id: 2,
	wins: 2, // John beat Jane twice
	draws: 0,
	losses: 0,
	pointsFor: 65 + 72, // John's points in both matches
	pointsAgainst: 52 + 55 // Jane's points in both matches
};

// Expected match results for rivalry stats testing
export const expectedMatchResults: Partial<MatchResult>[] = [
	{
		gameweek: 1,
		margin: 13 // 65-52
	},
	{
		gameweek: 3,
		margin: 25 // 70-45 - biggest win
	},
	{
		gameweek: 2,
		margin: 0 // Draw
	}
];
