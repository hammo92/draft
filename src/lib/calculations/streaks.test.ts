import { describe, it, expect } from 'vitest';
import { calculateStreaks } from './streaks';
import type { LeagueDetails, Match } from '$lib/types/fpl';

// Create mock entries
const mockEntries: LeagueDetails['league_entries'] = [
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
	}
];

// Create matches for testing streaks
// John's results: W, W, L, W, W, W (current 3W streak, longest 3W)
// Jane's results: L, L, W, L, L, L (current 3L streak, longest 3L)
const mockMatchesForStreaks: Match[] = [
	{
		event: 1,
		finished: true,
		league_entry_1: 1,
		league_entry_1_points: 60,
		league_entry_2: 2,
		league_entry_2_points: 50,
		started: true,
		winning_league_entry: 1,
		winning_method: 'points'
	},
	{
		event: 2,
		finished: true,
		league_entry_1: 1,
		league_entry_1_points: 55,
		league_entry_2: 2,
		league_entry_2_points: 45,
		started: true,
		winning_league_entry: 1,
		winning_method: 'points'
	},
	{
		event: 3,
		finished: true,
		league_entry_1: 1,
		league_entry_1_points: 40,
		league_entry_2: 2,
		league_entry_2_points: 65,
		started: true,
		winning_league_entry: 2,
		winning_method: 'points'
	},
	{
		event: 4,
		finished: true,
		league_entry_1: 1,
		league_entry_1_points: 70,
		league_entry_2: 2,
		league_entry_2_points: 55,
		started: true,
		winning_league_entry: 1,
		winning_method: 'points'
	},
	{
		event: 5,
		finished: true,
		league_entry_1: 1,
		league_entry_1_points: 65,
		league_entry_2: 2,
		league_entry_2_points: 50,
		started: true,
		winning_league_entry: 1,
		winning_method: 'points'
	},
	{
		event: 6,
		finished: true,
		league_entry_1: 1,
		league_entry_1_points: 58,
		league_entry_2: 2,
		league_entry_2_points: 48,
		started: true,
		winning_league_entry: 1,
		winning_method: 'points'
	}
];

describe('calculateStreaks', () => {
	describe('current streak', () => {
		it('should identify current win streak', () => {
			const streaks = calculateStreaks(mockMatchesForStreaks, mockEntries);

			const johnStreak = streaks.find((s) => s.managerId === 101);
			expect(johnStreak).toBeDefined();
			// John's last 3 results are W, W, W (GW4, GW5, GW6)
			expect(johnStreak?.currentStreak.type).toBe('W');
			expect(johnStreak?.currentStreak.count).toBe(3);
		});

		it('should identify current loss streak', () => {
			const streaks = calculateStreaks(mockMatchesForStreaks, mockEntries);

			const janeStreak = streaks.find((s) => s.managerId === 102);
			expect(janeStreak).toBeDefined();
			// Jane's last 3 results are L, L, L (GW4, GW5, GW6)
			expect(janeStreak?.currentStreak.type).toBe('L');
			expect(janeStreak?.currentStreak.count).toBe(3);
		});

		it('should handle draw streaks', () => {
			const drawMatches: Match[] = [
				{
					event: 1,
					finished: true,
					league_entry_1: 1,
					league_entry_1_points: 50,
					league_entry_2: 2,
					league_entry_2_points: 50,
					started: true,
					winning_league_entry: null,
					winning_method: null
				},
				{
					event: 2,
					finished: true,
					league_entry_1: 1,
					league_entry_1_points: 45,
					league_entry_2: 2,
					league_entry_2_points: 45,
					started: true,
					winning_league_entry: null,
					winning_method: null
				}
			];

			const streaks = calculateStreaks(drawMatches, mockEntries);
			const johnStreak = streaks.find((s) => s.managerId === 101);

			expect(johnStreak?.currentStreak.type).toBe('D');
			expect(johnStreak?.currentStreak.count).toBe(2);
		});
	});

	describe('longest win streak', () => {
		it('should track longest win streak', () => {
			const streaks = calculateStreaks(mockMatchesForStreaks, mockEntries);

			const johnStreak = streaks.find((s) => s.managerId === 101);
			// John's results: W, W, L, W, W, W
			// Longest win streak is 3 (GW4-GW6)
			expect(johnStreak?.longestWinStreak).toBe(3);
		});

		it('should handle zero wins', () => {
			const noWinsMatches: Match[] = [
				{
					event: 1,
					finished: true,
					league_entry_1: 1,
					league_entry_1_points: 40,
					league_entry_2: 2,
					league_entry_2_points: 50,
					started: true,
					winning_league_entry: 2,
					winning_method: 'points'
				}
			];

			const entries: LeagueDetails['league_entries'] = [mockEntries[0]];
			const streaks = calculateStreaks(noWinsMatches, entries);

			expect(streaks[0]?.longestWinStreak).toBe(0);
		});
	});

	describe('longest loss streak', () => {
		it('should track longest loss streak', () => {
			const streaks = calculateStreaks(mockMatchesForStreaks, mockEntries);

			const janeStreak = streaks.find((s) => s.managerId === 102);
			// Jane's results: L, L, W, L, L, L
			// Longest loss streak is 3 (GW4-GW6)
			expect(janeStreak?.longestLossStreak).toBe(3);
		});
	});

	describe('last 5 form', () => {
		it('should return last 5 results', () => {
			const streaks = calculateStreaks(mockMatchesForStreaks, mockEntries);

			const johnStreak = streaks.find((s) => s.managerId === 101);
			// John's results: W, W, L, W, W, W - last 5 are: W, L, W, W, W
			expect(johnStreak?.currentForm).toHaveLength(5);
			expect(johnStreak?.currentForm).toEqual(['W', 'L', 'W', 'W', 'W']);
		});

		it('should return all results if fewer than 5 games', () => {
			const fewMatches = mockMatchesForStreaks.slice(0, 3);
			const streaks = calculateStreaks(fewMatches, mockEntries);

			const johnStreak = streaks.find((s) => s.managerId === 101);
			expect(johnStreak?.currentForm).toHaveLength(3);
			expect(johnStreak?.currentForm).toEqual(['W', 'W', 'L']);
		});
	});

	describe('unfinished matches', () => {
		it('should exclude unfinished matches from streak calculation', () => {
			const matchesWithUnfinished: Match[] = [
				...mockMatchesForStreaks.slice(0, 3),
				{
					event: 4,
					finished: false, // Unfinished
					league_entry_1: 1,
					league_entry_1_points: 0,
					league_entry_2: 2,
					league_entry_2_points: 0,
					started: false,
					winning_league_entry: null,
					winning_method: null
				}
			];

			const streaks = calculateStreaks(matchesWithUnfinished, mockEntries);
			const johnStreak = streaks.find((s) => s.managerId === 101);

			// Only finished matches should count
			expect(johnStreak?.currentForm).toHaveLength(3);
		});
	});

	describe('draw breaking streaks', () => {
		it('should reset streaks on draws', () => {
			const matchesWithDraw: Match[] = [
				{
					event: 1,
					finished: true,
					league_entry_1: 1,
					league_entry_1_points: 60,
					league_entry_2: 2,
					league_entry_2_points: 50,
					started: true,
					winning_league_entry: 1,
					winning_method: 'points'
				},
				{
					event: 2,
					finished: true,
					league_entry_1: 1,
					league_entry_1_points: 50,
					league_entry_2: 2,
					league_entry_2_points: 50,
					started: true,
					winning_league_entry: null,
					winning_method: null
				},
				{
					event: 3,
					finished: true,
					league_entry_1: 1,
					league_entry_1_points: 65,
					league_entry_2: 2,
					league_entry_2_points: 55,
					started: true,
					winning_league_entry: 1,
					winning_method: 'points'
				}
			];

			const streaks = calculateStreaks(matchesWithDraw, mockEntries);
			const johnStreak = streaks.find((s) => s.managerId === 101);

			// Draw in GW2 resets the streak, so longest win streak is 1
			expect(johnStreak?.longestWinStreak).toBe(1);
		});
	});

	describe('entries without entry_id', () => {
		it('should skip entries with null entry_id', () => {
			const entriesWithNull: LeagueDetails['league_entries'] = [
				...mockEntries,
				{
					id: 3,
					entry_id: null, // AVERAGE entry
					entry_name: null,
					player_first_name: null,
					player_last_name: null,
					short_name: 'AVG',
					waiver_pick: null,
					joined_time: '2024-08-01T00:00:00Z'
				}
			];

			const streaks = calculateStreaks(mockMatchesForStreaks, entriesWithNull);

			// Should only have 2 entries (not the AVERAGE)
			expect(streaks.length).toBe(2);
		});
	});
});
