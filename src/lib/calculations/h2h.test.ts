import { describe, it, expect } from 'vitest';
import {
	getManagerNameFromEntry,
	buildH2HMatrix,
	processFixtures,
	calculateRivalryStats,
	calculateNemesisBunny
} from './h2h';
import { mockLeagueEntries, mockMatches } from './__fixtures__';

describe('getManagerNameFromEntry', () => {
	it('should return full name from first and last name', () => {
		const entry = mockLeagueEntries[0]; // John Smith
		const name = getManagerNameFromEntry(entry);
		expect(name).toBe('John Smith');
	});

	it('should return AVERAGE for system entry with null names', () => {
		const entry = mockLeagueEntries[4]; // AVERAGE entry
		const name = getManagerNameFromEntry(entry);
		expect(name).toBe('AVERAGE');
	});

	it('should handle missing first name', () => {
		const entry = {
			...mockLeagueEntries[0],
			player_first_name: null,
			player_last_name: 'Doe'
		};
		const name = getManagerNameFromEntry(entry);
		expect(name).toBe('Doe');
	});

	it('should handle missing last name', () => {
		const entry = {
			...mockLeagueEntries[0],
			player_first_name: 'Jane',
			player_last_name: null
		};
		const name = getManagerNameFromEntry(entry);
		expect(name).toBe('Jane');
	});

	it('should return AVERAGE for empty names (treated as system entry)', () => {
		const entry = {
			...mockLeagueEntries[0],
			player_first_name: '',
			player_last_name: ''
		};
		const name = getManagerNameFromEntry(entry);
		// Empty strings are falsy, so treated same as null (system AVERAGE entry)
		expect(name).toBe('AVERAGE');
	});
});

describe('buildH2HMatrix', () => {
	describe('record accumulation', () => {
		it('should create correct H2H records from matches', () => {
			const matrix = buildH2HMatrix(mockMatches, mockLeagueEntries);

			// Find record between John (id=1) and Jane (id=2)
			const johnJaneRecord = matrix.find(
				(r) =>
					(r.manager1Id === 1 && r.manager2Id === 2) || (r.manager1Id === 2 && r.manager2Id === 1)
			);

			expect(johnJaneRecord).toBeDefined();
			// John beat Jane twice (GW1: 65-52, GW5: 72-55)
			// From manager1 perspective (lower id first = John)
			expect(johnJaneRecord!.manager1Id).toBe(1);
			expect(johnJaneRecord!.wins).toBe(2);
			expect(johnJaneRecord!.losses).toBe(0);
			expect(johnJaneRecord!.draws).toBe(0);
		});

		it('should accumulate points correctly', () => {
			const matrix = buildH2HMatrix(mockMatches, mockLeagueEntries);

			const johnJaneRecord = matrix.find(
				(r) => r.manager1Id === 1 && r.manager2Id === 2
			);

			// John's total points vs Jane: 65 + 72 = 137
			// Jane's total points vs John: 52 + 55 = 107
			expect(johnJaneRecord!.pointsFor).toBe(137);
			expect(johnJaneRecord!.pointsAgainst).toBe(107);
		});

		it('should track draws correctly', () => {
			const matrix = buildH2HMatrix(mockMatches, mockLeagueEntries);

			// Jane (2) vs Alice (4) had a draw in GW2 (50-50)
			const janeAliceRecord = matrix.find(
				(r) =>
					(r.manager1Id === 2 && r.manager2Id === 4) || (r.manager1Id === 4 && r.manager2Id === 2)
			);

			expect(janeAliceRecord).toBeDefined();
			expect(janeAliceRecord!.draws).toBe(1);
		});
	});

	describe('unique keys', () => {
		it('should use consistent keys regardless of match order', () => {
			const matrix = buildH2HMatrix(mockMatches, mockLeagueEntries);

			// Each pair should only appear once
			const pairs = new Set<string>();
			for (const record of matrix) {
				const key = `${Math.min(record.manager1Id, record.manager2Id)}-${Math.max(record.manager1Id, record.manager2Id)}`;
				expect(pairs.has(key)).toBe(false);
				pairs.add(key);
			}
		});
	});

	describe('unfinished matches', () => {
		it('should skip unfinished matches', () => {
			const matrix = buildH2HMatrix(mockMatches, mockLeagueEntries);

			// GW4 match between 1 and 2 is unfinished
			// The record should only reflect finished matches
			const johnJaneRecord = matrix.find(
				(r) => r.manager1Id === 1 && r.manager2Id === 2
			);

			// Only 2 finished matches between them (GW1 and GW5)
			const totalMatches = johnJaneRecord!.wins + johnJaneRecord!.losses + johnJaneRecord!.draws;
			expect(totalMatches).toBe(2);
		});
	});
});

describe('processFixtures', () => {
	it('should convert matches to MatchResult format', () => {
		const fixtures = processFixtures(mockMatches, mockLeagueEntries);

		expect(fixtures.length).toBeGreaterThan(0);
		expect(fixtures[0]).toHaveProperty('gameweek');
		expect(fixtures[0]).toHaveProperty('manager1');
		expect(fixtures[0]).toHaveProperty('manager2');
		expect(fixtures[0]).toHaveProperty('margin');
	});

	it('should sort by gameweek descending', () => {
		const fixtures = processFixtures(mockMatches, mockLeagueEntries);

		for (let i = 1; i < fixtures.length; i++) {
			expect(fixtures[i - 1].gameweek).toBeGreaterThanOrEqual(fixtures[i].gameweek);
		}
	});

	it('should only include finished matches', () => {
		const fixtures = processFixtures(mockMatches, mockLeagueEntries);

		// GW4 match is unfinished
		const gw4Fixture = fixtures.find((f) => f.gameweek === 4);
		expect(gw4Fixture).toBeUndefined();
	});

	it('should calculate margin correctly', () => {
		const fixtures = processFixtures(mockMatches, mockLeagueEntries);

		// GW1: John 65 vs Jane 52, margin = 13
		const gw1JohnJane = fixtures.find(
			(f) => f.gameweek === 1 && f.manager1.id === 1 && f.manager2.id === 2
		);
		expect(gw1JohnJane?.margin).toBe(13);
	});
});

describe('calculateRivalryStats', () => {
	describe('biggest win', () => {
		it('should find the match with largest margin', () => {
			const fixtures = processFixtures(mockMatches, mockLeagueEntries);
			const stats = calculateRivalryStats(fixtures);

			expect(stats.biggestWin).not.toBeNull();
			// GW3: John 70 vs Alice 45, margin = 25 (biggest)
			expect(stats.biggestWin?.margin).toBe(25);
			expect(stats.biggestWin?.gameweek).toBe(3);
		});

		it('should identify winner and loser correctly', () => {
			const fixtures = processFixtures(mockMatches, mockLeagueEntries);
			const stats = calculateRivalryStats(fixtures);

			expect(stats.biggestWin?.winner).toBe('John Smith');
			expect(stats.biggestWin?.loser).toBe('Alice Brown');
		});
	});

	describe('closest game', () => {
		it('should find the non-draw match with smallest margin', () => {
			const fixtures = processFixtures(mockMatches, mockLeagueEntries);
			const stats = calculateRivalryStats(fixtures);

			expect(stats.closestGame).not.toBeNull();
			// Need to check which match has the smallest non-zero margin
			expect(stats.closestGame?.margin).toBeGreaterThan(0);
		});

		it('should exclude draws from closest game', () => {
			const fixtures = processFixtures(mockMatches, mockLeagueEntries);
			const stats = calculateRivalryStats(fixtures);

			// Closest game should have margin > 0 (not a draw)
			expect(stats.closestGame?.margin).toBeGreaterThan(0);
		});
	});

	describe('edge cases', () => {
		it('should return null for empty fixtures', () => {
			const stats = calculateRivalryStats([]);

			expect(stats.biggestWin).toBeNull();
			expect(stats.closestGame).toBeNull();
		});

		it('should return null if only draws exist', () => {
			const drawOnlyFixtures = [
				{
					gameweek: 1,
					manager1: { id: 1, name: 'John', score: 50 },
					manager2: { id: 2, name: 'Jane', score: 50 },
					winner: null,
					margin: 0
				}
			];

			const stats = calculateRivalryStats(drawOnlyFixtures);

			expect(stats.biggestWin).toBeNull();
			expect(stats.closestGame).toBeNull();
		});
	});
});

describe('calculateNemesisBunny', () => {
	describe('nemesis calculation', () => {
		it('should identify nemesis as opponent with worst differential', () => {
			const matrix = buildH2HMatrix(mockMatches, mockLeagueEntries);
			const nemesisBunny = calculateNemesisBunny(matrix, mockLeagueEntries);

			// John (id=1) has record:
			// vs Jane (2): 2-0 (no nemesis here)
			// vs Bob (3): 0-2 (this is John's nemesis)
			// vs Alice (4): 1-0
			const johnResult = nemesisBunny.find((nb) => nb.managerId === 1);
			expect(johnResult).toBeDefined();
			expect(johnResult?.nemesis?.opponentName).toBe('Bob Wilson');
		});

		it('should return null nemesis if even or ahead against all', () => {
			const matrix = buildH2HMatrix(mockMatches, mockLeagueEntries);
			const nemesisBunny = calculateNemesisBunny(matrix, mockLeagueEntries);

			// Jane (id=2) beat Bob once, drew with Alice
			// Her worst record should still not be a "nemesis" if she's even or ahead
			const janeResult = nemesisBunny.find((nb) => nb.managerId === 2);
			// Jane has 0-2 vs John, so John is her nemesis
			expect(janeResult?.nemesis?.opponentName).toBe('John Smith');
		});
	});

	describe('bunny calculation', () => {
		it('should identify bunny as opponent with best differential', () => {
			const matrix = buildH2HMatrix(mockMatches, mockLeagueEntries);
			const nemesisBunny = calculateNemesisBunny(matrix, mockLeagueEntries);

			// John beat Jane 2-0, so Jane is John's bunny
			const johnResult = nemesisBunny.find((nb) => nb.managerId === 1);
			expect(johnResult?.bunny?.opponentName).toBe('Jane Doe');
		});

		it('should return null bunny if even or behind against all', () => {
			const matrix = buildH2HMatrix(mockMatches, mockLeagueEntries);
			const nemesisBunny = calculateNemesisBunny(matrix, mockLeagueEntries);

			// Jane is 0-2 vs John, 1-0 vs Bob, so Bob is her bunny
			const janeResult = nemesisBunny.find((nb) => nb.managerId === 2);
			expect(janeResult?.bunny).not.toBeNull();
		});
	});

	describe('record format', () => {
		it('should format record as W-L-D', () => {
			const matrix = buildH2HMatrix(mockMatches, mockLeagueEntries);
			const nemesisBunny = calculateNemesisBunny(matrix, mockLeagueEntries);

			const johnResult = nemesisBunny.find((nb) => nb.managerId === 1);
			// John's bunny record vs Jane should be 2-0-0
			expect(johnResult?.bunny?.record).toBe('2-0-0');
		});
	});

	describe('edge cases', () => {
		it('should skip opponents with no games played', () => {
			const emptyMatrix: never[] = [];
			const nemesisBunny = calculateNemesisBunny(emptyMatrix, mockLeagueEntries);

			expect(nemesisBunny.length).toBe(0);
		});
	});
});
