import { describe, it, expect } from 'vitest';
import {
	buildPlayerBaselines,
	getPlayerFDR,
	getCSProbability,
	calculatePlayerGameweekLuck
} from './index';
import type { PlayerBaseline, GWStats, FixtureData } from './types';
import type { EnrichedPlayer } from '$lib/types/fpl';

// Create comprehensive mock data for integration testing
const createMockPlayer = (
	id: number,
	name: string,
	position: 1 | 2 | 3 | 4,
	teamId: number,
	totalMinutes: number,
	stats: Partial<{
		goals: number;
		assists: number;
		cleanSheets: number;
		goalsConceded: number;
		saves: number;
		bonus: number;
	}> = {}
): EnrichedPlayer => ({
	id,
	web_name: name,
	element_type: position,
	team: teamId,
	total_points: 0,
	now_cost: 50,
	selected_by_percent: '5.0',
	minutes: totalMinutes,
	goals_scored: stats.goals ?? 0,
	assists: stats.assists ?? 0,
	clean_sheets: stats.cleanSheets ?? 0,
	goals_conceded: stats.goalsConceded ?? 0,
	saves: stats.saves ?? 0,
	bonus: stats.bonus ?? 0,
	yellow_cards: 0,
	red_cards: 0,
	own_goals: 0,
	penalties_missed: 0,
	penalties_saved: 0,
	first_name: name,
	second_name: 'Test',
	team_code: teamId,
	status: 'a',
	code: id,
	squad_number: null,
	news: '',
	news_added: null,
	chance_of_playing_this_round: null,
	chance_of_playing_next_round: null,
	value_form: '0.0',
	value_season: '0.0',
	cost_change_start: 0,
	cost_change_event: 0,
	cost_change_start_fall: 0,
	cost_change_event_fall: 0,
	in_dreamteam: false,
	dreamteam_count: 0,
	form: '0.0',
	points_per_game: '0.0',
	ep_this: null,
	ep_next: null,
	special: false,
	transfers_out: 0,
	transfers_in: 0,
	transfers_out_event: 0,
	transfers_in_event: 0,
	loans_in: 0,
	loans_out: 0,
	loaned_in: 0,
	loaned_out: 0,
	ict_index: '0.0',
	ict_index_rank: null,
	ict_index_rank_type: null,
	corners_and_indirect_freekicks_order: null,
	corners_and_indirect_freekicks_text: '',
	direct_freekicks_order: null,
	direct_freekicks_text: '',
	penalties_order: null,
	penalties_text: '',
	expected_goals: '0.00',
	expected_assists: '0.00',
	expected_goal_involvements: '0.00',
	expected_goals_conceded: '0.00',
	influence: '0.0',
	creativity: '0.0',
	threat: '0.0',
	influence_rank: null,
	influence_rank_type: null,
	creativity_rank: null,
	creativity_rank_type: null,
	threat_rank: null,
	threat_rank_type: null,
	starts: 0,
	expected_goals_per_90: 0,
	saves_per_90: 0,
	expected_assists_per_90: 0,
	expected_goal_involvements_per_90: 0,
	expected_goals_conceded_per_90: 0,
	goals_conceded_per_90: 0,
	now_cost_rank: null,
	now_cost_rank_type: null,
	form_rank: null,
	form_rank_type: null,
	points_per_game_rank: null,
	points_per_game_rank_type: null,
	selected_rank: null,
	selected_rank_type: null,
	starts_per_90: 0,
	clean_sheets_per_90: 0,
	photo: '',
	teamName: 'Test FC',
	positionName: position === 1 ? 'Goalkeeper' : position === 2 ? 'Defender' : position === 3 ? 'Midfielder' : 'Forward'
});

// Convert array to Record for buildPlayerBaselines
const playersToRecord = (players: EnrichedPlayer[]): Record<number, EnrichedPlayer> => {
	const record: Record<number, EnrichedPlayer> = {};
	for (const player of players) {
		record[player.id] = player;
	}
	return record;
};

// Create fixture map for FDR functions
const createFixtureMap = (): Map<number, FixtureData[]> => {
	const map = new Map<number, FixtureData[]>();

	// GW1 fixtures
	map.set(1, [
		// City (1) vs Newcastle (4) - easy home for City
		{ id: 1, event: 1, team_h: 1, team_a: 4, team_h_difficulty: 2, team_a_difficulty: 5 },
		// Arsenal (2) @ Liverpool (3) - hard away for Arsenal
		{ id: 2, event: 1, team_h: 3, team_a: 2, team_h_difficulty: 4, team_a_difficulty: 4 }
	]);

	// GW2 fixtures (DGW for Liverpool - 2 fixtures)
	map.set(2, [
		{ id: 3, event: 2, team_h: 3, team_a: 4, team_h_difficulty: 3, team_a_difficulty: 4 },
		{ id: 4, event: 2, team_h: 2, team_a: 3, team_h_difficulty: 4, team_a_difficulty: 3 } // Liverpool away
	]);

	return map;
};

describe('Integration Tests', () => {
	describe('Full Pipeline: Baselines → FDR → Luck', () => {
		it('should calculate luck correctly for a forward with a haul', () => {
			// Step 1: Create player with season stats
			const player = createMockPlayer(100, 'Haaland', 4, 1, 2700, {
				goals: 20,
				assists: 5,
				bonus: 30
			});

			// Step 2: Build baselines
			const playersRecord = playersToRecord([player]);
			const baselines = buildPlayerBaselines(playersRecord);
			const baseline = baselines.get(100);

			expect(baseline).toBeDefined();
			// Per-90 goal rate: 20 goals / (2700/90) = 20/30 = 0.667
			expect(baseline!.goalsPerGame).toBeCloseTo(0.667, 2);
			// Per-90 assist rate: 5 / 30 = 0.167
			expect(baseline!.assistsPerGame).toBeCloseTo(0.167, 2);

			// Step 3: Get FDR for GW1 (City at home vs Newcastle, difficulty 2)
			const fixtureMap = createFixtureMap();
			const fdr = getPlayerFDR(1, 1, fixtureMap);
			expect(fdr).toBe(2); // Easy home fixture

			// Step 4: Calculate luck for a GW where player scored 2 goals, 1 assist
			const gwStats: GWStats = {
				total_points: 20,
				minutes: 90,
				goals_scored: 2,
				assists: 1,
				clean_sheets: 0,
				goals_conceded: 1,
				bonus: 3,
				expected_goals_conceded: 1.2
			};

			const opponentXG = 1.2; // Newcastle's xG against City
			const luckResult = calculatePlayerGameweekLuck(
				100,
				'Haaland',
				1,
				gwStats,
				baseline!,
				opponentXG,
				fdr
			);

			expect(luckResult).toBeDefined();
			// Player scored 2 goals when expected ~0.8-1.0 based on baseline
			// This should show positive goal luck
			expect(luckResult.goals.luck).toBeGreaterThan(0);
			// Total luck should reflect the overperformance
			expect(luckResult.totalLuck).not.toBe(0);
		});

		it('should calculate luck for a goalkeeper with clean sheet', () => {
			const gk = createMockPlayer(200, 'Ederson', 1, 1, 2700, {
				cleanSheets: 15,
				goalsConceded: 20,
				saves: 80
			});

			const playersRecord = playersToRecord([gk]);
			const baselines = buildPlayerBaselines(playersRecord);
			const baseline = baselines.get(200);

			expect(baseline).toBeDefined();
			// CS per 90: 15 / 30 = 0.5
			expect(baseline!.cleanSheetsPerGame).toBeCloseTo(0.5, 2);
			// Saves per 90: 80 / 30 = 2.67
			expect(baseline!.savesPerGame).toBeCloseTo(2.67, 1);

			const gwStats: GWStats = {
				total_points: 9,
				minutes: 90,
				goals_scored: 0,
				assists: 0,
				clean_sheets: 1,
				goals_conceded: 0,
				bonus: 2,
				expected_goals_conceded: 0.8,
				saves: 5
			};

			const fixtureMap = createFixtureMap();
			const fdr = getPlayerFDR(1, 1, fixtureMap);
			const opponentXG = 0.8;

			const luckResult = calculatePlayerGameweekLuck(
				200,
				'Ederson',
				1,
				gwStats,
				baseline!,
				opponentXG,
				fdr
			);

			expect(luckResult).toBeDefined();
			// GK got CS with low xGC - somewhat expected
			// CS probability should be reasonable with 0.8 xGC
			const csProb = getCSProbability(0.8, 2); // FDR 2 (easy)
			expect(csProb).toBeGreaterThan(0.3); // Low xGC + easy fixture = decent CS chance

			// Saves component should exist for GK
			expect(luckResult.saves).toBeDefined();
			expect(luckResult.saves.actual).toBe(5);
		});

		it('should handle player with low minutes using fallback rates', () => {
			// Player with only 450 minutes (below 900 threshold)
			const newSigning = createMockPlayer(300, 'NewPlayer', 3, 2, 450, {
				goals: 2,
				assists: 1
			});

			const playersRecord = playersToRecord([newSigning]);
			const baselines = buildPlayerBaselines(playersRecord);
			const baseline = baselines.get(300);

			expect(baseline).toBeDefined();
			// Should use position fallback rates since minutes < 900
			// Midfielder fallback: 0.15 goals per 90, 0.15 assists per 90
			expect(baseline!.goalsPerGame).toBeCloseTo(0.15, 2);
			expect(baseline!.assistsPerGame).toBeCloseTo(0.15, 2);
		});
	});

	describe('DGW Handling', () => {
		it('should average FDR for double gameweek fixtures', () => {
			const fixtureMap = createFixtureMap();
			// Liverpool (team 3) has DGW in GW2 with two fixtures
			// Home vs Newcastle (difficulty 3) + Away vs Arsenal (difficulty 3)
			const dgwFdr = getPlayerFDR(3, 2, fixtureMap);
			expect(dgwFdr).toBe(3); // Average of 3 and 3
		});

		it('should calculate luck correctly for DGW player', () => {
			const player = createMockPlayer(400, 'Salah', 3, 3, 2700, {
				goals: 15,
				assists: 10
			});

			const playersRecord = playersToRecord([player]);
			const baselines = buildPlayerBaselines(playersRecord);
			const baseline = baselines.get(400)!;

			const fixtureMap = createFixtureMap();
			const fdr = getPlayerFDR(3, 2, fixtureMap);

			// DGW stats - played 180 minutes across 2 games
			const dgwStats: GWStats = {
				total_points: 25,
				minutes: 180,
				goals_scored: 3, // Haul across both games
				assists: 2,
				clean_sheets: 1,
				goals_conceded: 2,
				bonus: 5,
				expected_goals_conceded: 1.8
			};

			const opponentXG = 1.8; // Combined xG from both opponents

			const luckResult = calculatePlayerGameweekLuck(
				400,
				'Salah',
				2,
				dgwStats,
				baseline,
				opponentXG,
				fdr
			);

			expect(luckResult).toBeDefined();
			// Scored 3 goals over 180 mins - significant output
			expect(luckResult.goals.actual).toBe(3);
			// Minutes used should be 180
			expect(luckResult.minutesPlayed).toBe(180);
		});
	});

	describe('Team Luck Aggregation', () => {
		it('should aggregate luck across multiple players', () => {
			const players = [
				createMockPlayer(500, 'Player1', 4, 1, 2700, { goals: 15 }),
				createMockPlayer(501, 'Player2', 3, 1, 2700, { goals: 8, assists: 10 }),
				createMockPlayer(502, 'Player3', 2, 1, 2700, { cleanSheets: 20 })
			];

			const playersRecord = playersToRecord(players);
			const baselines = buildPlayerBaselines(playersRecord);
			const fixtureMap = createFixtureMap();
			const fdr = getPlayerFDR(1, 1, fixtureMap);

			// Each player's GW stats
			const statsData = [
				{
					playerId: 500,
					name: 'Player1',
					stats: {
						total_points: 15,
						minutes: 90,
						goals_scored: 2,
						assists: 0,
						clean_sheets: 1,
						goals_conceded: 0,
						bonus: 3,
						expected_goals_conceded: 0.8
					} as GWStats
				},
				{
					playerId: 501,
					name: 'Player2',
					stats: {
						total_points: 10,
						minutes: 90,
						goals_scored: 0,
						assists: 2,
						clean_sheets: 1,
						goals_conceded: 0,
						bonus: 1,
						expected_goals_conceded: 0.8
					} as GWStats
				},
				{
					playerId: 502,
					name: 'Player3',
					stats: {
						total_points: 8,
						minutes: 90,
						goals_scored: 0,
						assists: 0,
						clean_sheets: 1,
						goals_conceded: 0,
						bonus: 1,
						expected_goals_conceded: 0.8
					} as GWStats
				}
			];

			let totalTeamLuck = 0;
			const opponentXG = 0.8;

			for (const { playerId, name, stats: gwStats } of statsData) {
				const baseline = baselines.get(playerId)!;

				const luckResult = calculatePlayerGameweekLuck(
					playerId,
					name,
					1,
					gwStats,
					baseline,
					opponentXG,
					fdr
				);

				totalTeamLuck += luckResult.totalLuck;
			}

			// Total team luck should be the sum of individual luck values
			expect(typeof totalTeamLuck).toBe('number');
			expect(isFinite(totalTeamLuck)).toBe(true);
		});
	});

	describe('Edge Cases', () => {
		it('should handle player with 0 minutes in GW', () => {
			const player = createMockPlayer(600, 'BenchWarmer', 4, 1, 900);

			const playersRecord = playersToRecord([player]);
			const baselines = buildPlayerBaselines(playersRecord);
			const baseline = baselines.get(600)!;

			const gwStats: GWStats = {
				total_points: 0,
				minutes: 0,
				goals_scored: 0,
				assists: 0,
				clean_sheets: 0,
				goals_conceded: 0,
				bonus: 0,
				expected_goals_conceded: 0
			};

			const luckResult = calculatePlayerGameweekLuck(
				600,
				'BenchWarmer',
				1,
				gwStats,
				baseline,
				0,
				3
			);

			// Should still calculate but with 0 expected outputs
			expect(luckResult).toBeDefined();
			expect(luckResult.minutesPlayed).toBe(0);
			expect(luckResult.goals.expected).toBe(0);
		});

		it('should handle missing fixture data with default FDR of 3', () => {
			const fixtureMap = createFixtureMap();
			const unknownTeamId = 99;
			const fdr = getPlayerFDR(unknownTeamId, 1, fixtureMap);
			expect(fdr).toBe(3); // Default FDR
		});

		it('should handle rare events (red card, own goal)', () => {
			const player = createMockPlayer(700, 'UnluckyDef', 2, 1, 2700, {
				cleanSheets: 15
			});

			const playersRecord = playersToRecord([player]);
			const baselines = buildPlayerBaselines(playersRecord);
			const baseline = baselines.get(700)!;

			const gwStats: GWStats = {
				total_points: -2,
				minutes: 45, // Sent off at half time
				goals_scored: 0,
				assists: 0,
				clean_sheets: 0,
				goals_conceded: 2,
				bonus: 0,
				expected_goals_conceded: 1.5,
				own_goals: 1,
				red_cards: 1
			};

			const opponentXG = 1.5;

			const luckResult = calculatePlayerGameweekLuck(
				700,
				'UnluckyDef',
				1,
				gwStats,
				baseline,
				opponentXG,
				3
			);

			expect(luckResult).toBeDefined();
			// Red card and OG should contribute negative luck
			expect(luckResult.redCards).toBeDefined();
			expect(luckResult.ownGoals).toBeDefined();
			expect(luckResult.redCards.actual).toBe(1);
			expect(luckResult.ownGoals.actual).toBe(1);
			// Overall luck should be negative (red card and OG are bad luck)
			expect(luckResult.redCards.points).toBeLessThan(0);
			expect(luckResult.ownGoals.points).toBeLessThan(0);
		});

		it('should handle CS probability edge cases', () => {
			// Very low xG should give high CS probability
			const lowXgProb = getCSProbability(0.1, 2);
			expect(lowXgProb).toBeGreaterThan(0.8);

			// Very high xG should give low CS probability
			const highXgProb = getCSProbability(3.0, 4);
			expect(highXgProb).toBeLessThan(0.1);

			// Zero xG should give probability of 1
			const zeroXgProb = getCSProbability(0, 3);
			expect(zeroXgProb).toBeCloseTo(1, 5);
		});
	});

	describe('FDR Multiplier Effects', () => {
		it('should show increased expected output vs easy fixtures', () => {
			const player = createMockPlayer(800, 'Striker', 4, 1, 2700, { goals: 15 });
			const playersRecord = playersToRecord([player]);
			const baselines = buildPlayerBaselines(playersRecord);
			const baseline = baselines.get(800)!;

			const fixtureMap = createFixtureMap();

			// Easy fixture (FDR 2) vs hard fixture (FDR 4)
			const easyFdr = getPlayerFDR(1, 1, fixtureMap); // City at home
			expect(easyFdr).toBe(2);

			const hardFdr = 5; // Simulate hard away fixture

			// Same GW stats for both scenarios
			const gwStats: GWStats = {
				total_points: 8,
				minutes: 90,
				goals_scored: 1,
				assists: 0,
				clean_sheets: 0,
				goals_conceded: 1,
				bonus: 2,
				expected_goals_conceded: 1.0
			};

			const opponentXG = 1.0;

			// Luck calculation uses FDR multipliers
			// With same actual output, expected output differs by FDR
			// So luck values should differ
			const easyFixtureLuck = calculatePlayerGameweekLuck(
				800,
				'Striker',
				1,
				gwStats,
				baseline,
				opponentXG,
				easyFdr
			);

			const hardFixtureLuck = calculatePlayerGameweekLuck(
				800,
				'Striker',
				1,
				gwStats,
				baseline,
				opponentXG,
				hardFdr
			);

			expect(easyFixtureLuck).toBeDefined();
			expect(hardFixtureLuck).toBeDefined();

			// Scoring 1 goal in an easy fixture = less lucky (higher expected)
			// Scoring 1 goal in a hard fixture = more lucky (lower expected)
			expect(hardFixtureLuck.goals.luck).toBeGreaterThan(easyFixtureLuck.goals.luck);
		});
	});
});
