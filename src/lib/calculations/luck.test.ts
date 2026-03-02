import { describe, it, expect } from 'vitest';
import { calculatePlayerGameweekLuck } from './luck';
import { GOAL_POINTS, CS_POINTS, FDR_MULTIPLIERS } from './constants';
import type { PlayerBaseline, GWStats } from './types';
import {
	normalGameStats,
	haulGameStats,
	blankGameStats,
	gkCleanSheetStats,
	redCardStats,
	ownGoalStats,
	penaltyMissStats,
	cameoStats,
	didNotPlayStats,
	defCleanSheetGoalStats
} from './__fixtures__';

// Create baseline helpers for testing
const createBaseline = (
	position: 1 | 2 | 3 | 4,
	overrides: Partial<PlayerBaseline> = {}
): PlayerBaseline => ({
	playerId: 1,
	position,
	seasonMinutes: 1800,
	goalsPerGame: position === 4 ? 1.5 : position === 3 ? 1.0 : 0.1,
	assistsPerGame: 0.3,
	cleanSheetsPerGame: position <= 2 ? 0.4 : 0.1,
	bonusPerGame: 0.5, // Realistic average (~0.2-0.5 for most players)
	savesPerGame: position === 1 ? 3.0 : 0,
	yellowsPerGame: 0.1,
	redsPerGame: 0.005,
	ownGoalsPerGame: 0.01,
	penaltiesMissedPerGame: 0.02,
	penaltiesSavedPerGame: position === 1 ? 0.02 : 0,
	...overrides
});

describe('calculatePlayerGameweekLuck', () => {
	describe('goals component', () => {
		it('should calculate expected goals based on baseline x mins/90 x FDR', () => {
			const baseline = createBaseline(3, { goalsPerGame: 1.0 });
			const stats: GWStats = { ...normalGameStats, goals_scored: 1, minutes: 90 };

			const result = calculatePlayerGameweekLuck(1, 'Test Player', 1, stats, baseline, 1.5, 3);

			// Expected = 1.0 * (90/90) * 1.0 (FDR 3) = 1.0
			expect(result.goals.expected).toBeCloseTo(1.0, 5);
			expect(result.goals.actual).toBe(1);
			expect(result.goals.luck).toBeCloseTo(0, 5); // 1 - 1 = 0
		});

		it('should apply FDR multiplier to expected goals', () => {
			const baseline = createBaseline(3, { goalsPerGame: 1.0 });
			const stats: GWStats = { ...normalGameStats, goals_scored: 1, minutes: 90 };

			// Easy fixture (FDR 1) = expect more goals
			const easyResult = calculatePlayerGameweekLuck(1, 'Test', 1, stats, baseline, 1.5, 1);
			expect(easyResult.goals.expected).toBeCloseTo(1.0 * FDR_MULTIPLIERS[1], 5);

			// Hard fixture (FDR 5) = expect fewer goals
			const hardResult = calculatePlayerGameweekLuck(1, 'Test', 1, stats, baseline, 1.5, 5);
			expect(hardResult.goals.expected).toBeCloseTo(1.0 * FDR_MULTIPLIERS[5], 5);
		});

		it('should calculate correct luck points for goals', () => {
			const baseline = createBaseline(3, { goalsPerGame: 0.5 }); // MID
			const stats: GWStats = { ...haulGameStats, goals_scored: 3, minutes: 90 };

			const result = calculatePlayerGameweekLuck(1, 'Test', 1, stats, baseline, 1.5, 3);

			// Actual: 3, Expected: 0.5, Luck: 2.5 goals
			// MID goal = 5 pts, so luck points = 2.5 * 5 = 12.5
			const expectedLuckGoals = 3 - 0.5;
			expect(result.goals.luck).toBeCloseTo(expectedLuckGoals, 5);
			expect(result.goals.points).toBeCloseTo(expectedLuckGoals * GOAL_POINTS[3], 5);
		});

		it('should use position-specific goal points', () => {
			// DEF goal = 6 pts
			const defBaseline = createBaseline(2, { goalsPerGame: 0.1 });
			const defStats: GWStats = { ...defCleanSheetGoalStats };
			const defResult = calculatePlayerGameweekLuck(1, 'Def', 1, defStats, defBaseline, 1.0, 3);
			expect(defResult.goals.pointsPerUnit).toBe(GOAL_POINTS[2]); // 6

			// FWD goal = 4 pts
			const fwdBaseline = createBaseline(4, { goalsPerGame: 1.5 });
			const fwdStats: GWStats = { ...normalGameStats, goals_scored: 2 };
			const fwdResult = calculatePlayerGameweekLuck(1, 'Fwd', 1, fwdStats, fwdBaseline, 1.5, 3);
			expect(fwdResult.goals.pointsPerUnit).toBe(GOAL_POINTS[4]); // 4
		});
	});

	describe('assists component', () => {
		it('should calculate expected assists based on baseline x FDR', () => {
			const baseline = createBaseline(3, { assistsPerGame: 0.5 });
			const stats: GWStats = { ...normalGameStats, assists: 1 };

			const result = calculatePlayerGameweekLuck(1, 'Test', 1, stats, baseline, 1.5, 3);

			expect(result.assists.expected).toBeCloseTo(0.5, 5);
			expect(result.assists.actual).toBe(1);
			expect(result.assists.luck).toBeCloseTo(0.5, 5);
			expect(result.assists.pointsPerUnit).toBe(3); // Always 3 pts for assist
		});
	});

	describe('clean sheet component', () => {
		it('should use Poisson probability for expected CS', () => {
			const baseline = createBaseline(2, { cleanSheetsPerGame: 0.4 });
			const stats: GWStats = { ...gkCleanSheetStats, clean_sheets: 1 };

			// opponentXG = 1.5, FDR = 3 (neutral)
			// P(CS) = e^(-1.5) ≈ 0.223
			const result = calculatePlayerGameweekLuck(1, 'Def', 1, stats, baseline, 1.5, 3);

			expect(result.cleanSheet.expected).toBeCloseTo(Math.exp(-1.5), 5);
			expect(result.cleanSheet.actual).toBe(1);
		});

		it('should only count CS for 60+ minutes played', () => {
			const baseline = createBaseline(2);
			const cameoWithCS: GWStats = { ...cameoStats, clean_sheets: 1 };

			const result = calculatePlayerGameweekLuck(1, 'Sub', 1, cameoWithCS, baseline, 1.5, 3);

			// < 60 mins, so expected CS should be 0
			expect(result.cleanSheet.expected).toBe(0);
		});

		it('should use position-specific CS points', () => {
			// GK/DEF = 4 pts
			const gkBaseline = createBaseline(1);
			const gkResult = calculatePlayerGameweekLuck(1, 'GK', 1, gkCleanSheetStats, gkBaseline, 1.0, 3);
			expect(gkResult.cleanSheet.pointsPerUnit).toBe(CS_POINTS[1]); // 4

			// MID = 1 pt
			const midBaseline = createBaseline(3);
			const midResult = calculatePlayerGameweekLuck(1, 'Mid', 1, normalGameStats, midBaseline, 1.0, 3);
			expect(midResult.cleanSheet.pointsPerUnit).toBe(CS_POINTS[3]); // 1

			// FWD = 0 pts
			const fwdBaseline = createBaseline(4);
			const fwdResult = calculatePlayerGameweekLuck(1, 'Fwd', 1, normalGameStats, fwdBaseline, 1.0, 3);
			expect(fwdResult.cleanSheet.pointsPerUnit).toBe(CS_POINTS[4]); // 0
		});
	});

	describe('goals conceded component', () => {
		it('should only apply to GK/DEF', () => {
			const gkBaseline = createBaseline(1);
			const defBaseline = createBaseline(2);
			const midBaseline = createBaseline(3);

			const stats: GWStats = { ...blankGameStats, goals_conceded: 3 };

			const gkResult = calculatePlayerGameweekLuck(1, 'GK', 1, stats, gkBaseline, 1.5, 3);
			const defResult = calculatePlayerGameweekLuck(1, 'Def', 1, stats, defBaseline, 1.5, 3);
			const midResult = calculatePlayerGameweekLuck(1, 'Mid', 1, stats, midBaseline, 1.5, 3);

			expect(gkResult.goalsConceded.actual).toBe(3);
			expect(defResult.goalsConceded.actual).toBe(3);
			expect(midResult.goalsConceded.actual).toBe(0); // MID doesn't track GC
		});

		it('should apply defensive FDR multiplier to expected GC', () => {
			const baseline = createBaseline(2);
			const stats: GWStats = { ...blankGameStats, goals_conceded: 2 };
			const opponentXG = 1.5;

			// Hard fixture (FDR 5) = opponent scores MORE
			const result = calculatePlayerGameweekLuck(1, 'Def', 1, stats, baseline, opponentXG, 5);

			// Expected GC = 1.5 * 1.15 (defensive mult for FDR 5) = 1.725
			expect(result.goalsConceded.expected).toBeCloseTo(1.5 * 1.15, 5);
		});

		it('should use -0.5 points per goal conceded', () => {
			const baseline = createBaseline(1);
			const stats: GWStats = { ...blankGameStats, goals_conceded: 4 };

			const result = calculatePlayerGameweekLuck(1, 'GK', 1, stats, baseline, 1.5, 3);

			expect(result.goalsConceded.pointsPerUnit).toBe(-0.5);
		});
	});

	describe('bonus component', () => {
		it('should NOT apply FDR adjustment to bonus', () => {
			const baseline = createBaseline(3, { bonusPerGame: 0.8 });
			const stats: GWStats = { ...normalGameStats, bonus: 3 };

			const easyResult = calculatePlayerGameweekLuck(1, 'Test', 1, stats, baseline, 1.5, 1);
			const hardResult = calculatePlayerGameweekLuck(1, 'Test', 1, stats, baseline, 1.5, 5);

			// Both should have same expected bonus (no FDR adjustment)
			expect(easyResult.bonus.expected).toBe(hardResult.bonus.expected);
			expect(easyResult.bonus.expected).toBeCloseTo(0.8, 5);
		});

		it('should cap expected bonus at 1.0 per 90', () => {
			const baseline = createBaseline(3, { bonusPerGame: 2.5 }); // High bonus rate
			const stats: GWStats = { ...normalGameStats, bonus: 3, minutes: 90 };

			const result = calculatePlayerGameweekLuck(1, 'Test', 1, stats, baseline, 1.5, 3);

			// Expected should be capped at 1.0, not 2.5
			expect(result.bonus.expected).toBeCloseTo(1.0, 5);
		});

		it('should use reduced weight (0.5) for bonus luck', () => {
			const baseline = createBaseline(3, { bonusPerGame: 0.5 });
			const stats: GWStats = { ...normalGameStats, bonus: 3, minutes: 90 };

			const result = calculatePlayerGameweekLuck(1, 'Test', 1, stats, baseline, 1.5, 3);

			// Luck = 3 - 0.5 = 2.5, points = 2.5 * 0.5 = 1.25
			expect(result.bonus.pointsPerUnit).toBe(0.5);
			expect(result.bonus.points).toBeCloseTo(2.5 * 0.5, 5);
		});
	});

	describe('saves component', () => {
		it('should only apply to GK', () => {
			const gkBaseline = createBaseline(1, { savesPerGame: 3.0 });
			const defBaseline = createBaseline(2);

			const stats: GWStats = { ...gkCleanSheetStats, saves: 5 };

			const gkResult = calculatePlayerGameweekLuck(1, 'GK', 1, stats, gkBaseline, 1.5, 3);
			const defResult = calculatePlayerGameweekLuck(1, 'Def', 1, stats, defBaseline, 1.5, 3);

			expect(gkResult.saves.actual).toBe(5);
			expect(defResult.saves.actual).toBe(0);
			expect(defResult.saves.expected).toBe(0);
		});

		it('should use 1/3 points per save', () => {
			const baseline = createBaseline(1, { savesPerGame: 3.0 });
			const stats: GWStats = { ...gkCleanSheetStats, saves: 6 };

			const result = calculatePlayerGameweekLuck(1, 'GK', 1, stats, baseline, 1.5, 3);

			expect(result.saves.pointsPerUnit).toBeCloseTo(1 / 3, 5);
		});
	});

	describe('rare events', () => {
		describe('yellow cards', () => {
			it('should use -1 point per yellow card', () => {
				const baseline = createBaseline(2, { yellowsPerGame: 0.1 });
				const stats: GWStats = { ...ownGoalStats, yellow_cards: 1 };

				const result = calculatePlayerGameweekLuck(1, 'Def', 1, stats, baseline, 1.5, 3);

				expect(result.yellowCards.actual).toBe(1);
				expect(result.yellowCards.pointsPerUnit).toBe(-1);
			});
		});

		describe('red cards', () => {
			it('should use -3 points per red card', () => {
				const baseline = createBaseline(2, { redsPerGame: 0.005 });
				const stats = redCardStats;

				const result = calculatePlayerGameweekLuck(1, 'Def', 1, stats, baseline, 1.5, 3);

				expect(result.redCards.actual).toBe(1);
				expect(result.redCards.pointsPerUnit).toBe(-3);
			});
		});

		describe('own goals', () => {
			it('should use -2 points per own goal', () => {
				const baseline = createBaseline(2, { ownGoalsPerGame: 0.01 });
				const stats = ownGoalStats;

				const result = calculatePlayerGameweekLuck(1, 'Def', 1, stats, baseline, 1.5, 3);

				expect(result.ownGoals.actual).toBe(1);
				expect(result.ownGoals.pointsPerUnit).toBe(-2);
			});
		});

		describe('penalties missed', () => {
			it('should use -2 points per penalty missed', () => {
				const baseline = createBaseline(3, { penaltiesMissedPerGame: 0.02 });
				const stats = penaltyMissStats;

				const result = calculatePlayerGameweekLuck(1, 'Mid', 1, stats, baseline, 1.5, 3);

				expect(result.penaltiesMissed.actual).toBe(1);
				expect(result.penaltiesMissed.pointsPerUnit).toBe(-2);
			});
		});

		describe('penalties saved', () => {
			it('should use +5 points per penalty saved (GK only)', () => {
				const baseline = createBaseline(1, { penaltiesSavedPerGame: 0.02 });
				const stats: GWStats = { ...gkCleanSheetStats, penalties_saved: 1 };

				const result = calculatePlayerGameweekLuck(1, 'GK', 1, stats, baseline, 1.5, 3);

				expect(result.penaltiesSaved.actual).toBe(1);
				expect(result.penaltiesSaved.pointsPerUnit).toBe(5);
			});
		});
	});

	describe('total calculations', () => {
		it('should sum all component luck points correctly', () => {
			const baseline = createBaseline(3, {
				goalsPerGame: 0.5,
				assistsPerGame: 0.3,
				bonusPerGame: 1.5
			});
			const stats: GWStats = {
				total_points: 15,
				minutes: 90,
				goals_scored: 2,
				assists: 1,
				clean_sheets: 0,
				goals_conceded: 0,
				bonus: 3,
				expected_goals_conceded: 1.5
			};

			const result = calculatePlayerGameweekLuck(1, 'Mid', 1, stats, baseline, 1.5, 3);

			// Total luck should be sum of all component luck points
			const expectedTotalLuck =
				result.goals.points +
				result.assists.points +
				result.cleanSheet.points +
				result.goalsConceded.points +
				result.bonus.points +
				result.saves.points +
				result.yellowCards.points +
				result.redCards.points +
				result.ownGoals.points +
				result.penaltiesMissed.points +
				result.penaltiesSaved.points;

			expect(result.totalLuck).toBeCloseTo(expectedTotalLuck, 5);
		});

		it('should exclude appearance from luck calculation', () => {
			const baseline = createBaseline(3);
			const stats90min: GWStats = { ...normalGameStats, minutes: 90 };

			const result = calculatePlayerGameweekLuck(1, 'Mid', 1, stats90min, baseline, 1.5, 3);

			// Appearance luck should always be 0 (expected = actual)
			expect(result.appearance.luck).toBe(0);
			expect(result.appearance.points).toBe(0);
		});
	});

	describe('edge cases', () => {
		it('should handle 0 minutes correctly', () => {
			const baseline = createBaseline(3);

			const result = calculatePlayerGameweekLuck(
				1,
				'DNP',
				1,
				didNotPlayStats,
				baseline,
				1.5,
				3
			);

			expect(result.minutesPlayed).toBe(0);
			expect(result.goals.expected).toBe(0);
			expect(result.assists.expected).toBe(0);
			expect(result.bonus.expected).toBe(0);
		});

		it('should handle cameo appearance (1-59 mins)', () => {
			const baseline = createBaseline(3);

			const result = calculatePlayerGameweekLuck(1, 'Sub', 1, cameoStats, baseline, 1.5, 3);

			expect(result.appearance.actual).toBe(1); // 1 pt for < 60 mins
			// Expected values should be scaled by minutes fraction
			expect(result.goals.expected).toBeLessThan(baseline.goalsPerGame);
		});
	});
});
