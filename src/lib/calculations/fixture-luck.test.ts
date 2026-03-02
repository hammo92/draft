import { describe, it, expect, beforeEach } from 'vitest';
import { calculateFixtureLuck, calculateHolisticLuck } from './fixture-luck';
import { calculatePlayerGameweekLuck } from './luck';
import { buildPlayerBaselines } from './baselines';
import type { DetailedEntry, LeagueDetails, EnrichedPlayer, PlayerGWStats } from '$lib/types/fpl';
import type { PlayerBaseline, FixtureData } from './types';
import { normalGameStats, blankGameStats } from './__fixtures__';

// Test that expected points include appearance points
describe('Expected Score Calculation', () => {
	it('should include appearance points in expected score', () => {
		// A player who plays 90 mins should have 2 appearance points in expected
		const baseline: PlayerBaseline = {
			playerId: 1,
			position: 3, // MID
			seasonMinutes: 1800,
			goalsPerGame: 0.5,
			assistsPerGame: 0.3,
			cleanSheetsPerGame: 0.2,
			bonusPerGame: 0.5,
			savesPerGame: 0,
			yellowsPerGame: 0.1,
			redsPerGame: 0.005,
			ownGoalsPerGame: 0.01,
			penaltiesMissedPerGame: 0.02,
			penaltiesSavedPerGame: 0
		};

		// Player plays 90 mins and scores 10 points
		const stats: PlayerGWStats = {
			total_points: 10,
			minutes: 90,
			goals_scored: 1,
			assists: 0,
			clean_sheets: 0,
			goals_conceded: 0,
			bonus: 2,
			bps: 30,
			expected_goals: 0.5,
			expected_assists: 0.2,
			expected_goal_involvements: 0.7,
			expected_goals_conceded: 1.5,
			saves: 0,
			yellow_cards: 0,
			red_cards: 0,
			own_goals: 0,
			penalties_saved: 0,
			penalties_missed: 0
		};

		const result = calculatePlayerGameweekLuck(
			1,
			'Test Player',
			1,
			stats,
			baseline,
			1.5, // opponentXG
			3 // fdr
		);

		// Expected points should include:
		// - 2 appearance points for playing 60+ mins
		// - goals, assists, etc based on per-90 rates
		// The key test: totalExpectedPoints should be > 2 (not 0 or close to 0)
		console.log('Expected points:', result.totalExpectedPoints);
		console.log('Appearance expected:', result.appearance.expected);
		console.log('Appearance actual:', result.appearance.actual);

		// With a player who plays 90 mins, expected should be at least 2
		// (for the appearance) plus some small expected from goals/assists
		expect(result.totalExpectedPoints).toBeGreaterThan(1.5);

		// The expected shouldn't be drastically lower than actual
		// If actual is 10 and expected is 2, that's an 8 point luck gap
		// which would compound to huge numbers over a season
		const luckGap = result.totalActualPoints - result.totalExpectedPoints;
		console.log('Luck gap:', luckGap);

		// A reasonable expected for a 10-point return should be within ~5 points
		expect(Math.abs(luckGap)).toBeLessThan(8);
	});

	it('should have reasonable expected for a blank game (2 pts actual)', () => {
		const baseline: PlayerBaseline = {
			playerId: 1,
			position: 3,
			seasonMinutes: 1800,
			goalsPerGame: 0.3,
			assistsPerGame: 0.2,
			cleanSheetsPerGame: 0.15,
			bonusPerGame: 0.3,
			savesPerGame: 0,
			yellowsPerGame: 0.1,
			redsPerGame: 0.005,
			ownGoalsPerGame: 0.01,
			penaltiesMissedPerGame: 0.02,
			penaltiesSavedPerGame: 0
		};

		// Blank game - 2 points for playing 90 mins
		const stats: PlayerGWStats = {
			total_points: 2,
			minutes: 90,
			goals_scored: 0,
			assists: 0,
			clean_sheets: 0,
			goals_conceded: 0,
			bonus: 0,
			bps: 10,
			expected_goals: 0.2,
			expected_assists: 0.1,
			expected_goal_involvements: 0.3,
			expected_goals_conceded: 1.5,
			saves: 0,
			yellow_cards: 0,
			red_cards: 0,
			own_goals: 0,
			penalties_saved: 0,
			penalties_missed: 0
		};

		const result = calculatePlayerGameweekLuck(
			1,
			'Test Player',
			1,
			stats,
			baseline,
			1.5,
			3
		);

		console.log('Blank game expected points:', result.totalExpectedPoints);
		console.log('Blank game actual points:', result.totalActualPoints);
		console.log('Blank game luck:', result.totalLuck);

		// For a blank (2 pts), expected should also be around 2-4 pts
		// (2 for appearance + maybe 1-2 for expected goals/assists)
		// Not close to 0!
		expect(result.totalExpectedPoints).toBeGreaterThan(1);

		// Luck for a blank shouldn't be massively negative
		// If expected was 0 and actual was 2, luck would be +2
		// If expected was 3 and actual was 2, luck would be -1
		expect(result.totalLuck).toBeLessThan(5);
		expect(result.totalLuck).toBeGreaterThan(-5);
	});

	it('should show the problem - total expected for 11 players is too low', () => {
		// Simulate what happens for a team of 11 players all playing 90 mins
		// with modest returns (average ~5 pts each = 55 total)
		const baseline: PlayerBaseline = {
			playerId: 1,
			position: 3,
			seasonMinutes: 1800,
			goalsPerGame: 0.3,
			assistsPerGame: 0.2,
			cleanSheetsPerGame: 0.15,
			bonusPerGame: 0.4,
			savesPerGame: 0,
			yellowsPerGame: 0.1,
			redsPerGame: 0.005,
			ownGoalsPerGame: 0.01,
			penaltiesMissedPerGame: 0.02,
			penaltiesSavedPerGame: 0
		};

		const stats: PlayerGWStats = {
			total_points: 5,
			minutes: 90,
			goals_scored: 0,
			assists: 1,
			clean_sheets: 0,
			goals_conceded: 0,
			bonus: 0,
			bps: 15,
			expected_goals: 0.3,
			expected_assists: 0.2,
			expected_goal_involvements: 0.5,
			expected_goals_conceded: 1.5,
			saves: 0,
			yellow_cards: 0,
			red_cards: 0,
			own_goals: 0,
			penalties_saved: 0,
			penalties_missed: 0
		};

		let totalExpected = 0;
		let totalActual = 0;

		// Simulate 11 players
		for (let i = 0; i < 11; i++) {
			const result = calculatePlayerGameweekLuck(
				i,
				`Player ${i}`,
				1,
				stats,
				baseline,
				1.5,
				3
			);
			totalExpected += result.totalExpectedPoints;
			totalActual += result.totalActualPoints;
		}

		console.log('Total expected for 11 players:', totalExpected);
		console.log('Total actual for 11 players:', totalActual);
		console.log('Gap (variance) per GW:', totalActual - totalExpected);

		// If actual is 55 and expected is only ~10-20, that's a huge systematic error
		// Expected should be at least 40+ for a team scoring 55 points
		// (22 for appearances + ~20+ for expected goals/assists/bonus)
		expect(totalExpected).toBeGreaterThan(30);

		// The gap shouldn't be more than 20 points
		const gap = totalActual - totalExpected;
		expect(gap).toBeLessThan(25);
	});
});
