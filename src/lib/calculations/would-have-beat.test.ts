import { describe, it, expect } from 'vitest';
import { calculateWouldHaveBeat } from './would-have-beat';
import type { DetailedEntry, LeagueDetails, Match } from '$lib/types/fpl';

// Create mock detailed entries
const createMockEntry = (
	id: number,
	entryId: number,
	firstName: string,
	lastName: string,
	history: { event: number; points: number }[]
): DetailedEntry => ({
	id,
	entry_id: entryId,
	entry_name: `Team ${firstName}`,
	player_first_name: firstName,
	player_last_name: lastName,
	short_name: firstName[0] + lastName[0],
	waiver_pick: id,
	joined_time: '2024-08-01T00:00:00Z',
	history: history.map((h) => ({
		id: h.event,
		points: h.points,
		total_points: h.points * h.event,
		rank: null,
		rank_sort: null,
		event_transfers: 0,
		points_on_bench: 0,
		entry: entryId,
		event: h.event
	})),
	recentPicks: [],
	stats: {
		form: [],
		averagePoints: 0,
		totalBenchPoints: 0,
		benchPointsByGameweek: [],
		squadStrength: { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0 },
		totalSquadPoints: 0,
		transferValue: 0,
		gw1SquadTotal: 0,
		transfers: []
	}
});

// Mock entries with different scores
const mockEntries: DetailedEntry[] = [
	createMockEntry(1, 101, 'John', 'Smith', [
		{ event: 1, points: 60 }, // 1st place
		{ event: 2, points: 45 }, // 3rd place
		{ event: 3, points: 70 } // 1st place
	]),
	createMockEntry(2, 102, 'Jane', 'Doe', [
		{ event: 1, points: 55 }, // 2nd place
		{ event: 2, points: 50 }, // 2nd place
		{ event: 3, points: 40 } // 4th place
	]),
	createMockEntry(3, 103, 'Bob', 'Wilson', [
		{ event: 1, points: 50 }, // 3rd place
		{ event: 2, points: 55 }, // 1st place
		{ event: 3, points: 65 } // 2nd place
	]),
	createMockEntry(4, 104, 'Alice', 'Brown', [
		{ event: 1, points: 45 }, // 4th place
		{ event: 2, points: 40 }, // 4th place
		{ event: 3, points: 50 } // 3rd place
	])
];

// Mock matches - some unlucky draws (good score but lost)
const mockMatches: Match[] = [
	// GW1: John (60) vs Jane (55) - John wins
	{
		event: 1,
		finished: true,
		league_entry_1: 1,
		league_entry_1_points: 60,
		league_entry_2: 2,
		league_entry_2_points: 55,
		started: true,
		winning_league_entry: 1,
		winning_method: 'points'
	},
	// GW1: Bob (50) vs Alice (45) - Bob wins
	{
		event: 1,
		finished: true,
		league_entry_1: 3,
		league_entry_1_points: 50,
		league_entry_2: 4,
		league_entry_2_points: 45,
		started: true,
		winning_league_entry: 3,
		winning_method: 'points'
	},
	// GW2: John (45) vs Bob (55) - Bob wins, John UNLUCKY (3rd but beat 1)
	{
		event: 2,
		finished: true,
		league_entry_1: 1,
		league_entry_1_points: 45,
		league_entry_2: 3,
		league_entry_2_points: 55,
		started: true,
		winning_league_entry: 3,
		winning_method: 'points'
	},
	// GW2: Jane (50) vs Alice (40) - Jane wins
	{
		event: 2,
		finished: true,
		league_entry_1: 2,
		league_entry_1_points: 50,
		league_entry_2: 4,
		league_entry_2_points: 40,
		started: true,
		winning_league_entry: 2,
		winning_method: 'points'
	},
	// GW3: John (70) vs Alice (50) - John wins
	{
		event: 3,
		finished: true,
		league_entry_1: 1,
		league_entry_1_points: 70,
		league_entry_2: 4,
		league_entry_2_points: 50,
		started: true,
		winning_league_entry: 1,
		winning_method: 'points'
	},
	// GW3: Jane (40) vs Bob (65) - Bob wins, Jane UNLUCKY (4th but lost to 2nd)
	{
		event: 3,
		finished: true,
		league_entry_1: 2,
		league_entry_1_points: 40,
		league_entry_2: 3,
		league_entry_2_points: 65,
		started: true,
		winning_league_entry: 3,
		winning_method: 'points'
	}
];

const completedGameweeks = [1, 2, 3];

describe('calculateWouldHaveBeat', () => {
	describe('rank calculation', () => {
		it('should calculate correct weekly rank', () => {
			const results = calculateWouldHaveBeat(mockEntries, mockMatches, completedGameweeks);

			const johnResult = results.find((r) => r.managerId === 101);
			expect(johnResult).toBeDefined();

			// GW1: John scored 60, ranked 1st (beat 3)
			const gw1 = johnResult?.gameweeks.find((g) => g.gameweek === 1);
			expect(gw1?.wouldHaveBeaten).toBe(3); // Beat all 3 others

			// GW2: John scored 45, ranked 3rd (beat 1)
			const gw2 = johnResult?.gameweeks.find((g) => g.gameweek === 2);
			expect(gw2?.wouldHaveBeaten).toBe(1); // Only beat Alice (40)
		});

		it('should calculate average rank correctly', () => {
			const results = calculateWouldHaveBeat(mockEntries, mockMatches, completedGameweeks);

			const johnResult = results.find((r) => r.managerId === 101);
			// John's ranks: GW1=1, GW2=3, GW3=1
			// Average = (1+3+1)/3 = 1.67
			expect(johnResult?.averageRank).toBeCloseTo(1.7, 1);
		});
	});

	describe('unlucky week detection', () => {
		it('should detect unlucky week when beat most but still lost', () => {
			// Create a specific unlucky scenario
			const unluckyEntries: DetailedEntry[] = [
				createMockEntry(1, 101, 'Unlucky', 'Player', [{ event: 1, points: 65 }]), // 2nd highest
				createMockEntry(2, 102, 'Opponent', 'One', [{ event: 1, points: 70 }]), // Highest - plays unlucky
				createMockEntry(3, 103, 'Loser', 'One', [{ event: 1, points: 40 }]),
				createMockEntry(4, 104, 'Loser', 'Two', [{ event: 1, points: 35 }])
			];

			const unluckyMatches: Match[] = [
				{
					event: 1,
					finished: true,
					league_entry_1: 1,
					league_entry_1_points: 65,
					league_entry_2: 2,
					league_entry_2_points: 70,
					started: true,
					winning_league_entry: 2,
					winning_method: 'points'
				}
			];

			const results = calculateWouldHaveBeat(unluckyEntries, unluckyMatches, [1]);

			const unluckyResult = results.find((r) => r.managerId === 101);
			// Unlucky beat 2 out of 3 others (50%+) but lost
			expect(unluckyResult?.totalUnluckyWeeks).toBe(1);
		});

		it('should not flag as unlucky if legitimately lost', () => {
			// Player in last place who lost
			const results = calculateWouldHaveBeat(mockEntries, mockMatches, completedGameweeks);

			const aliceResult = results.find((r) => r.managerId === 104);
			// Alice was often in last place when she lost
			// Her unlucky weeks should be 0 or very low
			expect(aliceResult?.totalUnluckyWeeks).toBe(0);
		});
	});

	describe('actual result tracking', () => {
		it('should track actual H2H result correctly', () => {
			const results = calculateWouldHaveBeat(mockEntries, mockMatches, completedGameweeks);

			const johnResult = results.find((r) => r.managerId === 101);

			// GW1: John beat Jane
			const gw1 = johnResult?.gameweeks.find((g) => g.gameweek === 1);
			expect(gw1?.actualResult).toBe('W');
			expect(gw1?.actualOpponent).toBe('Jane Doe');

			// GW2: John lost to Bob
			const gw2 = johnResult?.gameweeks.find((g) => g.gameweek === 2);
			expect(gw2?.actualResult).toBe('L');
			expect(gw2?.actualOpponent).toBe('Bob Wilson');
		});
	});

	describe('sorting', () => {
		it('should sort results by most unlucky weeks descending', () => {
			const results = calculateWouldHaveBeat(mockEntries, mockMatches, completedGameweeks);

			// Results should be sorted by totalUnluckyWeeks descending
			for (let i = 1; i < results.length; i++) {
				expect(results[i - 1].totalUnluckyWeeks).toBeGreaterThanOrEqual(
					results[i].totalUnluckyWeeks
				);
			}
		});

		it('should sort gameweeks by gameweek descending', () => {
			const results = calculateWouldHaveBeat(mockEntries, mockMatches, completedGameweeks);

			const johnResult = results.find((r) => r.managerId === 101);
			const gws = johnResult?.gameweeks || [];

			for (let i = 1; i < gws.length; i++) {
				expect(gws[i - 1].gameweek).toBeGreaterThan(gws[i].gameweek);
			}
		});
	});

	describe('edge cases', () => {
		it('should handle entry with no history for a gameweek', () => {
			const entriesWithMissingGW: DetailedEntry[] = [
				createMockEntry(1, 101, 'John', 'Smith', [
					{ event: 1, points: 60 }
					// Missing GW2
				])
			];

			const results = calculateWouldHaveBeat(entriesWithMissingGW, mockMatches, [1, 2]);

			const johnResult = results.find((r) => r.managerId === 101);
			// Should only have 1 gameweek (GW1)
			expect(johnResult?.gameweeks.length).toBe(1);
		});

		it('should skip entries without entry_id', () => {
			const entriesWithNull: DetailedEntry[] = [
				...mockEntries,
				{
					...mockEntries[0],
					id: 5,
					entry_id: null as unknown as number, // AVERAGE entry simulation
					player_first_name: null,
					player_last_name: null
				}
			];

			const results = calculateWouldHaveBeat(
				entriesWithNull as DetailedEntry[],
				mockMatches,
				completedGameweeks
			);

			// Should not include the null entry_id entry
			const nullResult = results.find((r) => r.managerId === 0 || r.managerId === null);
			expect(nullResult).toBeUndefined();
		});

		it('should handle empty gameweeks array', () => {
			const results = calculateWouldHaveBeat(mockEntries, mockMatches, []);

			// All managers should have empty gameweeks
			for (const result of results) {
				expect(result.gameweeks.length).toBe(0);
				expect(result.totalUnluckyWeeks).toBe(0);
			}
		});
	});
});
