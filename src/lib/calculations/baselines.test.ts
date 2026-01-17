import { describe, it, expect } from 'vitest';
import { getEffectiveRate, buildPlayerBaselines } from './baselines';
import { MIN_MINUTES_THRESHOLD, POSITION_FALLBACK_RATES, POSITION_MAIN_FALLBACKS } from './constants';
import { mockPlayers } from './__fixtures__';

describe('getEffectiveRate', () => {
	describe('threshold boundary', () => {
		it('should use player rate when minutes >= threshold', () => {
			const playerRate = 0.2;
			const playerMinutes = MIN_MINUTES_THRESHOLD; // Exactly at threshold
			const position = 2; // DEF

			const result = getEffectiveRate(playerRate, playerMinutes, position, 'yellowsPerGame');

			expect(result).toBe(playerRate);
		});

		it('should use player rate when minutes > threshold', () => {
			const playerRate = 0.15;
			const playerMinutes = MIN_MINUTES_THRESHOLD + 1;
			const position = 3; // MID

			const result = getEffectiveRate(playerRate, playerMinutes, position, 'yellowsPerGame');

			expect(result).toBe(playerRate);
		});

		it('should use fallback rate when minutes < threshold', () => {
			const playerRate = 0.5; // High rate that should be ignored
			const playerMinutes = MIN_MINUTES_THRESHOLD - 1; // Just below threshold (899)
			const position = 2; // DEF

			const result = getEffectiveRate(playerRate, playerMinutes, position, 'yellowsPerGame');

			expect(result).toBe(POSITION_FALLBACK_RATES.yellowsPerGame[position]);
		});
	});

	describe('position fallbacks', () => {
		it('should return GK fallback rate for position 1', () => {
			const result = getEffectiveRate(0, 0, 1, 'yellowsPerGame');
			expect(result).toBe(POSITION_FALLBACK_RATES.yellowsPerGame[1]);
		});

		it('should return DEF fallback rate for position 2', () => {
			const result = getEffectiveRate(0, 0, 2, 'redsPerGame');
			expect(result).toBe(POSITION_FALLBACK_RATES.redsPerGame[2]);
		});

		it('should return MID fallback rate for position 3', () => {
			const result = getEffectiveRate(0, 0, 3, 'ownGoalsPerGame');
			expect(result).toBe(POSITION_FALLBACK_RATES.ownGoalsPerGame[3]);
		});

		it('should return FWD fallback rate for position 4', () => {
			const result = getEffectiveRate(0, 0, 4, 'penaltiesMissedPerGame');
			expect(result).toBe(POSITION_FALLBACK_RATES.penaltiesMissedPerGame[4]);
		});

		it('should return 0 for non-GK penalty saves', () => {
			const result = getEffectiveRate(0, 0, 3, 'penaltiesSavedPerGame');
			expect(result).toBe(0);
		});
	});

	describe('edge cases', () => {
		it('should return 0 for invalid position', () => {
			const result = getEffectiveRate(0, 0, 99, 'yellowsPerGame');
			expect(result).toBe(0);
		});

		it('should use fallback for 0 minutes', () => {
			const result = getEffectiveRate(0.1, 0, 2, 'yellowsPerGame');
			expect(result).toBe(POSITION_FALLBACK_RATES.yellowsPerGame[2]);
		});
	});
});

describe('buildPlayerBaselines', () => {
	describe('per-90 calculation', () => {
		it('should calculate correct per-90 rates for players with sufficient minutes', () => {
			const baselines = buildPlayerBaselines(mockPlayers);

			// Salah (id=3): 20 goals in 1800 mins = 20/1800*90 = 1.0 per 90
			const salahBaseline = baselines.get(3);
			expect(salahBaseline).toBeDefined();
			expect(salahBaseline!.goalsPerGame).toBeCloseTo(1.0, 5);
			expect(salahBaseline!.assistsPerGame).toBeCloseTo(0.5, 5); // 10/1800*90
			expect(salahBaseline!.position).toBe(3);
			expect(salahBaseline!.seasonMinutes).toBe(1800);
		});

		it('should calculate correct GK stats', () => {
			const baselines = buildPlayerBaselines(mockPlayers);

			// Alisson (id=1): 60 saves in 1800 mins = 3.0 per 90
			const gkBaseline = baselines.get(1);
			expect(gkBaseline).toBeDefined();
			expect(gkBaseline!.savesPerGame).toBeCloseTo(3.0, 5);
			expect(gkBaseline!.cleanSheetsPerGame).toBeCloseTo(0.5, 5); // 10/1800*90
			expect(gkBaseline!.position).toBe(1);
		});

		it('should calculate correct FWD stats', () => {
			const baselines = buildPlayerBaselines(mockPlayers);

			// Haaland (id=4): 30 goals in 1800 mins = 1.5 per 90
			const fwdBaseline = baselines.get(4);
			expect(fwdBaseline).toBeDefined();
			expect(fwdBaseline!.goalsPerGame).toBeCloseTo(1.5, 5);
			expect(fwdBaseline!.cleanSheetsPerGame).toBe(0); // FWD doesn't track CS
		});
	});

	describe('fallback for insufficient minutes', () => {
		it('should use position fallbacks for players below threshold', () => {
			const baselines = buildPlayerBaselines(mockPlayers);

			// Youngster (id=5): 450 mins < 900 threshold
			const youngsterBaseline = baselines.get(5);
			expect(youngsterBaseline).toBeDefined();
			expect(youngsterBaseline!.goalsPerGame).toBe(POSITION_MAIN_FALLBACKS.goalsPerGame[3]);
			expect(youngsterBaseline!.assistsPerGame).toBe(POSITION_MAIN_FALLBACKS.assistsPerGame[3]);
			expect(youngsterBaseline!.bonusPerGame).toBe(POSITION_MAIN_FALLBACKS.bonusPerGame[3]);
		});

		it('should still calculate raw rates for rare events even below threshold', () => {
			const baselines = buildPlayerBaselines(mockPlayers);

			// Youngster (id=5): 1 yellow in 450 mins
			const youngsterBaseline = baselines.get(5);
			expect(youngsterBaseline!.yellowsPerGame).toBeCloseTo((1 / 450) * 90, 5);
		});
	});

	describe('zero minutes edge case', () => {
		it('should use position fallbacks for players with 0 minutes', () => {
			const baselines = buildPlayerBaselines(mockPlayers);

			// Injured player (id=6): 0 mins
			const injuredBaseline = baselines.get(6);
			expect(injuredBaseline).toBeDefined();
			expect(injuredBaseline!.goalsPerGame).toBe(POSITION_MAIN_FALLBACKS.goalsPerGame[2]); // DEF position
			expect(injuredBaseline!.seasonMinutes).toBe(0);
		});

		it('should have 0 per-90 rates for rare events with 0 minutes', () => {
			const baselines = buildPlayerBaselines(mockPlayers);

			const injuredBaseline = baselines.get(6);
			expect(injuredBaseline!.yellowsPerGame).toBe(0);
			expect(injuredBaseline!.redsPerGame).toBe(0);
		});
	});

	describe('all positions covered', () => {
		it('should create baselines for all players', () => {
			const baselines = buildPlayerBaselines(mockPlayers);

			expect(baselines.size).toBe(Object.keys(mockPlayers).length);
		});

		it('should correctly assign position types', () => {
			const baselines = buildPlayerBaselines(mockPlayers);

			expect(baselines.get(1)?.position).toBe(1); // GK
			expect(baselines.get(2)?.position).toBe(2); // DEF
			expect(baselines.get(3)?.position).toBe(3); // MID
			expect(baselines.get(4)?.position).toBe(4); // FWD
		});
	});
});
