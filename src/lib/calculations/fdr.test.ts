import { describe, it, expect } from 'vitest';
import { getPlayerFDR, getCSProbability } from './fdr';
import { DEFENSIVE_FDR_MULTIPLIERS } from './constants';
import { mockFixturesByGw } from './__fixtures__';

describe('getPlayerFDR', () => {
	describe('home/away lookup', () => {
		it('should return home team FDR when team is home', () => {
			// GW1: Liverpool (14) is home vs Arsenal (1), Liverpool's FDR = 3
			const fdr = getPlayerFDR(14, 1, mockFixturesByGw);
			expect(fdr).toBe(3);
		});

		it('should return away team FDR when team is away', () => {
			// GW1: Arsenal (1) is away vs Liverpool (14), Arsenal's FDR = 4
			const fdr = getPlayerFDR(1, 1, mockFixturesByGw);
			expect(fdr).toBe(4);
		});

		it('should return correct FDR for different fixtures', () => {
			// GW1: Man City (13) home vs Chelsea, City's FDR = 2
			const cityFdr = getPlayerFDR(13, 1, mockFixturesByGw);
			expect(cityFdr).toBe(2);

			// GW1: Chelsea (6) away vs City, Chelsea's FDR = 5
			const chelseaFdr = getPlayerFDR(6, 1, mockFixturesByGw);
			expect(chelseaFdr).toBe(5);
		});
	});

	describe('DGW averaging', () => {
		it('should return average FDR for double gameweek', () => {
			// GW3: Liverpool (14) has 2 fixtures
			// Home vs Newcastle: FDR = 2
			// Away vs West Ham: FDR = 2
			// Average = (2 + 2) / 2 = 2
			const fdr = getPlayerFDR(14, 3, mockFixturesByGw);
			expect(fdr).toBe(2);
		});
	});

	describe('missing fixture handling', () => {
		it('should return default neutral (3) when no team specified', () => {
			const fdr = getPlayerFDR(undefined, 1, mockFixturesByGw);
			expect(fdr).toBe(3);
		});

		it('should return default neutral (3) when team has no fixture in GW', () => {
			// Team 99 doesn't exist in any fixtures
			const fdr = getPlayerFDR(99, 1, mockFixturesByGw);
			expect(fdr).toBe(3);
		});

		it('should return default neutral (3) for non-existent gameweek', () => {
			const fdr = getPlayerFDR(14, 999, mockFixturesByGw);
			expect(fdr).toBe(3);
		});

		it('should return default neutral (3) for empty fixture map', () => {
			const emptyMap = new Map();
			const fdr = getPlayerFDR(14, 1, emptyMap);
			expect(fdr).toBe(3);
		});
	});

	describe('FDR range', () => {
		it('should return easiest FDR (1)', () => {
			// GW4: Liverpool (14) home vs bottom team, FDR = 1
			const fdr = getPlayerFDR(14, 4, mockFixturesByGw);
			expect(fdr).toBe(1);
		});

		it('should return hardest FDR (5)', () => {
			// GW5: Liverpool (14) away vs Man City, FDR = 5
			const fdr = getPlayerFDR(14, 5, mockFixturesByGw);
			expect(fdr).toBe(5);
		});
	});
});

describe('getCSProbability', () => {
	describe('Poisson formula', () => {
		it('should return correct probability for 0 xG (100% CS chance)', () => {
			// P(0 goals) = e^(-0) = 1
			const prob = getCSProbability(0, 3); // Neutral FDR
			expect(prob).toBeCloseTo(1.0, 5);
		});

		it('should return ~37% for 1.0 xG (neutral FDR)', () => {
			// P(0 goals) = e^(-1) ≈ 0.368
			const prob = getCSProbability(1.0, 3);
			expect(prob).toBeCloseTo(Math.exp(-1), 5);
		});

		it('should return ~13.5% for 2.0 xG (neutral FDR)', () => {
			// P(0 goals) = e^(-2) ≈ 0.135
			const prob = getCSProbability(2.0, 3);
			expect(prob).toBeCloseTo(Math.exp(-2), 5);
		});
	});

	describe('FDR adjustment', () => {
		it('should increase CS probability for easy fixtures (FDR 1)', () => {
			// Easy fixture = opponent xG reduced
			const xG = 1.5;
			const adjustedXG = xG * DEFENSIVE_FDR_MULTIPLIERS[1]; // 1.5 * 0.85 = 1.275
			const prob = getCSProbability(xG, 1);
			expect(prob).toBeCloseTo(Math.exp(-adjustedXG), 5);
		});

		it('should decrease CS probability for hard fixtures (FDR 5)', () => {
			// Hard fixture = opponent xG increased
			const xG = 1.5;
			const adjustedXG = xG * DEFENSIVE_FDR_MULTIPLIERS[5]; // 1.5 * 1.15 = 1.725
			const prob = getCSProbability(xG, 5);
			expect(prob).toBeCloseTo(Math.exp(-adjustedXG), 5);
		});

		it('should not adjust xG for neutral FDR (3)', () => {
			const xG = 1.5;
			const prob = getCSProbability(xG, 3);
			expect(prob).toBeCloseTo(Math.exp(-xG), 5);
		});

		it('should handle FDR 2 correctly', () => {
			const xG = 1.0;
			const adjustedXG = xG * DEFENSIVE_FDR_MULTIPLIERS[2]; // 1.0 * 0.92
			const prob = getCSProbability(xG, 2);
			expect(prob).toBeCloseTo(Math.exp(-adjustedXG), 5);
		});

		it('should handle FDR 4 correctly', () => {
			const xG = 1.0;
			const adjustedXG = xG * DEFENSIVE_FDR_MULTIPLIERS[4]; // 1.0 * 1.08
			const prob = getCSProbability(xG, 4);
			expect(prob).toBeCloseTo(Math.exp(-adjustedXG), 5);
		});
	});

	describe('edge cases', () => {
		it('should return 1.0 for 0 xG regardless of FDR', () => {
			expect(getCSProbability(0, 1)).toBe(1.0);
			expect(getCSProbability(0, 5)).toBe(1.0);
		});

		it('should approach 0 for very high xG', () => {
			const prob = getCSProbability(5.0, 3); // Very high xG
			expect(prob).toBeLessThan(0.01);
		});

		it('should handle invalid FDR gracefully (use multiplier of 1)', () => {
			// Invalid FDR should use default multiplier of 1
			const xG = 1.5;
			const prob = getCSProbability(xG, 99);
			expect(prob).toBeCloseTo(Math.exp(-xG), 5);
		});
	});
});
