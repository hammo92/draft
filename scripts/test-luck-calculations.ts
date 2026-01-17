/**
 * Comprehensive test script to validate luck calculations against live FPL data
 * Run with: npx tsx scripts/test-luck-calculations.ts
 */

// Constants matching the implementation
const FDR_MULTIPLIERS: Record<number, number> = {
	1: 1.15,
	2: 1.08,
	3: 1.00,
	4: 0.93,
	5: 0.85
};

const DEFENSIVE_FDR_MULTIPLIERS: Record<number, number> = {
	1: 0.85,
	2: 0.92,
	3: 1.00,
	4: 1.08,
	5: 1.15
};

const GOAL_POINTS: Record<number, number> = { 1: 6, 2: 6, 3: 5, 4: 4 };
const CS_POINTS: Record<number, number> = { 1: 4, 2: 4, 3: 1, 4: 0 };
const ASSIST_POINTS = 3;

const POSITION_FALLBACK_RATES = {
	yellowsPerGame: { 1: 0.05, 2: 0.12, 3: 0.10, 4: 0.08 } as Record<number, number>,
	redsPerGame: { 1: 0.002, 2: 0.004, 3: 0.003, 4: 0.003 } as Record<number, number>,
	ownGoalsPerGame: { 1: 0.002, 2: 0.008, 3: 0.003, 4: 0.002 } as Record<number, number>,
	penaltiesMissedPerGame: { 1: 0.001, 2: 0.002, 3: 0.008, 4: 0.012 } as Record<number, number>,
	penaltiesSavedPerGame: { 1: 0.015, 2: 0, 3: 0, 4: 0 } as Record<number, number>,
};

const MIN_MINUTES_THRESHOLD = 900;

// Types
interface PlayerBaseline {
	playerId: number;
	position: 1 | 2 | 3 | 4;
	seasonMinutes: number;
	goalsPerGame: number;
	assistsPerGame: number;
	cleanSheetsPerGame: number;
	bonusPerGame: number;
	savesPerGame: number;
	yellowsPerGame: number;
	redsPerGame: number;
	ownGoalsPerGame: number;
	penaltiesMissedPerGame: number;
	penaltiesSavedPerGame: number;
}

interface LuckComponent {
	actual: number;
	expected: number;
	luck: number;
	pointsPerUnit: number;
	points: number;
}

interface PlayerGameweekLuck {
	playerId: number;
	playerName: string;
	gameweek: number;
	position: number;
	minutesPlayed: number;
	appearance: LuckComponent;
	goals: LuckComponent;
	assists: LuckComponent;
	cleanSheet: LuckComponent;
	goalsConceded: LuckComponent;
	bonus: LuckComponent;
	saves: LuckComponent;
	yellowCards: LuckComponent;
	redCards: LuckComponent;
	ownGoals: LuckComponent;
	penaltiesMissed: LuckComponent;
	penaltiesSaved: LuckComponent;
	totalExpectedPoints: number;
	totalActualPoints: number;
	totalLuck: number;
}

interface Player {
	id: number;
	web_name: string;
	element_type: number;
	team: number;
	minutes: number;
	goals_scored: number;
	assists: number;
	clean_sheets: number;
	bonus: number;
	saves: number;
	yellow_cards: number;
	red_cards: number;
	own_goals: number;
	penalties_missed: number;
	penalties_saved: number;
}

interface PlayerGWStats {
	total_points: number;
	minutes: number;
	goals_scored: number;
	assists: number;
	clean_sheets: number;
	goals_conceded: number;
	bonus: number;
	expected_goals_conceded: number;
	saves?: number;
	yellow_cards?: number;
	red_cards?: number;
	own_goals?: number;
	penalties_saved?: number;
	penalties_missed?: number;
}

interface FixtureData {
	event: number;
	team_h: number;
	team_a: number;
	team_h_difficulty: number;
	team_a_difficulty: number;
}

// Test tracking
let testsPassed = 0;
let testsFailed = 0;
const failedTests: string[] = [];

function assert(condition: boolean, testName: string, details?: string) {
	if (condition) {
		testsPassed++;
		console.log(`   ✓ ${testName}`);
	} else {
		testsFailed++;
		failedTests.push(testName);
		console.log(`   ✗ ${testName}${details ? ` - ${details}` : ''}`);
	}
}

function assertApprox(actual: number, expected: number, tolerance: number, testName: string) {
	const diff = Math.abs(actual - expected);
	assert(diff <= tolerance, testName, `expected ${expected.toFixed(3)}, got ${actual.toFixed(3)}, diff ${diff.toFixed(3)}`);
}

// Helper functions
function getEffectiveRate(
	playerRate: number,
	playerMinutes: number,
	position: number,
	rateType: keyof typeof POSITION_FALLBACK_RATES
): number {
	if (playerMinutes >= MIN_MINUTES_THRESHOLD) {
		return playerRate;
	}
	return POSITION_FALLBACK_RATES[rateType][position] || 0;
}

function getCSProbability(opponentXG: number, fdr: number): number {
	const adjustedXG = opponentXG * (DEFENSIVE_FDR_MULTIPLIERS[fdr] || 1);
	return Math.exp(-adjustedXG);
}

function getPlayerFDR(
	playerTeam: number | undefined,
	gameweek: number,
	fixturesByGw: Map<number, FixtureData[]>
): number {
	if (!playerTeam) return 3;
	const gwFixtures = fixturesByGw.get(gameweek) || [];
	const fixture = gwFixtures.find(f => f.team_h === playerTeam || f.team_a === playerTeam);
	if (!fixture) return 3;
	const isHome = fixture.team_h === playerTeam;
	return isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
}

function buildPlayerBaseline(player: Player): PlayerBaseline {
	const seasonMinutes = player.minutes || 0;
	const position = player.element_type as 1 | 2 | 3 | 4;
	const per90 = (stat: number) => seasonMinutes > 0 ? (stat / seasonMinutes) * 90 : 0;

	return {
		playerId: player.id,
		position,
		seasonMinutes,
		goalsPerGame: per90(player.goals_scored || 0),
		assistsPerGame: per90(player.assists || 0),
		cleanSheetsPerGame: per90(player.clean_sheets || 0),
		bonusPerGame: per90(player.bonus || 0),
		savesPerGame: per90(player.saves || 0),
		yellowsPerGame: per90(player.yellow_cards || 0),
		redsPerGame: per90(player.red_cards || 0),
		ownGoalsPerGame: per90(player.own_goals || 0),
		penaltiesMissedPerGame: per90(player.penalties_missed || 0),
		penaltiesSavedPerGame: per90(player.penalties_saved || 0),
	};
}

function calculatePlayerGameweekLuck(
	playerId: number,
	playerName: string,
	gameweek: number,
	gwStats: PlayerGWStats,
	baseline: PlayerBaseline,
	opponentXG: number,
	fdr: number
): PlayerGameweekLuck {
	const minutes = gwStats.minutes || 0;
	const minutesFraction = minutes / 90;
	const position = baseline.position;
	const fdrMult = FDR_MULTIPLIERS[fdr] || 1;
	const defFdrMult = DEFENSIVE_FDR_MULTIPLIERS[fdr] || 1;

	const createComponent = (
		actual: number,
		expected: number,
		pointsPerUnit: number
	): LuckComponent => {
		const luck = actual - expected;
		return { actual, expected, luck, pointsPerUnit, points: luck * pointsPerUnit };
	};

	// Appearance: 0 mins = 0 pts, 1-59 mins = 1 pt, 60+ mins = 2 pts
	// Excluded from luck - playing time is availability, not performance
	const actualAppearance = minutes >= 60 ? 2 : minutes > 0 ? 1 : 0;
	const expectedAppearance = actualAppearance; // No luck component
	const appearance = createComponent(actualAppearance, expectedAppearance, 1);

	// Goals
	const expectedGoals = baseline.goalsPerGame * minutesFraction * fdrMult;
	const goals = createComponent(gwStats.goals_scored, expectedGoals, GOAL_POINTS[position]);

	// Assists
	const expectedAssists = baseline.assistsPerGame * minutesFraction * fdrMult;
	const assists = createComponent(gwStats.assists, expectedAssists, ASSIST_POINTS);

	// Clean Sheet
	const played60Plus = minutes >= 60 ? 1 : 0;
	const csProbability = getCSProbability(opponentXG, fdr);
	const expectedCS = csProbability * played60Plus;
	const cleanSheet = createComponent(gwStats.clean_sheets, expectedCS, CS_POINTS[position]);

	// Goals Conceded
	const expectedGC = position <= 2 ? opponentXG * defFdrMult * played60Plus : 0;
	const actualGC = position <= 2 ? gwStats.goals_conceded : 0;
	const goalsConceded = createComponent(actualGC, expectedGC, -0.5);

	// Bonus
	const expectedBonus = baseline.bonusPerGame * minutesFraction;
	const bonus = createComponent(gwStats.bonus, expectedBonus, 1);

	// Saves
	const expectedSaves = position === 1 ? baseline.savesPerGame * minutesFraction * defFdrMult : 0;
	const actualSaves = position === 1 ? (gwStats.saves || 0) : 0;
	const saves = createComponent(actualSaves, expectedSaves, 1/3);

	// Yellow Cards
	const effectiveYellowRate = getEffectiveRate(baseline.yellowsPerGame, baseline.seasonMinutes, position, 'yellowsPerGame');
	const expectedYellows = effectiveYellowRate * minutesFraction;
	const yellowCards = createComponent(gwStats.yellow_cards || 0, expectedYellows, -1);

	// Red Cards
	const effectiveRedRate = getEffectiveRate(baseline.redsPerGame, baseline.seasonMinutes, position, 'redsPerGame');
	const expectedReds = effectiveRedRate * minutesFraction;
	const redCards = createComponent(gwStats.red_cards || 0, expectedReds, -3);

	// Own Goals
	const effectiveOGRate = getEffectiveRate(baseline.ownGoalsPerGame, baseline.seasonMinutes, position, 'ownGoalsPerGame');
	const expectedOGs = effectiveOGRate * minutesFraction;
	const ownGoals = createComponent(gwStats.own_goals || 0, expectedOGs, -2);

	// Penalties Missed
	const effectivePenMissedRate = getEffectiveRate(baseline.penaltiesMissedPerGame, baseline.seasonMinutes, position, 'penaltiesMissedPerGame');
	const expectedPensMissed = effectivePenMissedRate * minutesFraction;
	const penaltiesMissed = createComponent(gwStats.penalties_missed || 0, expectedPensMissed, -2);

	// Penalties Saved
	const effectivePenSavedRate = position === 1 ? getEffectiveRate(baseline.penaltiesSavedPerGame, baseline.seasonMinutes, position, 'penaltiesSavedPerGame') : 0;
	const expectedPensSaved = effectivePenSavedRate * minutesFraction * defFdrMult;
	const penaltiesSaved = createComponent(gwStats.penalties_saved || 0, expectedPensSaved, 5);

	// Appearance excluded from luck calculation (it's availability, not performance)
	const allComponents = [goals, assists, cleanSheet, goalsConceded, bonus, saves, yellowCards, redCards, ownGoals, penaltiesMissed, penaltiesSaved];
	const totalExpectedPoints = allComponents.reduce((sum, c) => sum + (c.expected * c.pointsPerUnit), 0);
	const totalActualPoints = gwStats.total_points;
	const totalLuck = allComponents.reduce((sum, c) => sum + c.points, 0);

	return {
		playerId, playerName, gameweek, position, minutesPlayed: minutes,
		appearance, goals, assists, cleanSheet, goalsConceded, bonus, saves,
		yellowCards, redCards, ownGoals, penaltiesMissed, penaltiesSaved,
		totalExpectedPoints, totalActualPoints, totalLuck
	};
}

// Test runner
async function runTests() {
	console.log('🧪 Comprehensive FPL Luck Calculation Tests\n');
	console.log('='.repeat(70));

	// Fetch bootstrap data
	console.log('\n📡 Fetching FPL data...');
	const bootstrapRes = await fetch('https://draft.premierleague.com/api/bootstrap-static');
	const bootstrap = await bootstrapRes.json();
	const players: Player[] = bootstrap.elements;

	// Get current gameweek from game endpoint
	const gameRes = await fetch('https://draft.premierleague.com/api/game');
	const game = await gameRes.json();
	const currentGw = game.current_event || 17;
	console.log(`   Current gameweek: ${currentGw}`);

	// Fetch live data for current GW
	const liveRes = await fetch(`https://draft.premierleague.com/api/event/${currentGw}/live`);
	const liveData = await liveRes.json();

	// Fetch fixtures
	const fixturesRes = await fetch('https://fantasy.premierleague.com/api/fixtures/');
	const fixtures: FixtureData[] = await fixturesRes.json();
	const fixturesByGw = new Map<number, FixtureData[]>();
	fixtures.forEach(f => {
		if (!fixturesByGw.has(f.event)) fixturesByGw.set(f.event, []);
		fixturesByGw.get(f.event)!.push(f);
	});

	// Build baselines
	const baselines = new Map<number, PlayerBaseline>();
	for (const player of players) {
		baselines.set(player.id, buildPlayerBaseline(player));
	}

	console.log(`   Loaded ${players.length} players`);
	console.log(`   Built ${baselines.size} baselines`);
	console.log(`   Loaded ${fixtures.length} fixtures`);

	// ========== TEST 1: Mathematical Consistency ==========
	console.log('\n' + '='.repeat(70));
	console.log('TEST 1: Mathematical Consistency');
	console.log('='.repeat(70));

	// Test that component points sum to totalLuck
	const testPlayer = players.find(p => p.web_name === 'Salah' && p.minutes > 0);
	if (testPlayer) {
		const element = liveData.elements[testPlayer.id];
		if (element?.stats) {
			const baseline = baselines.get(testPlayer.id)!;
			const gwStats: PlayerGWStats = {
				total_points: element.stats.total_points,
				minutes: element.stats.minutes,
				goals_scored: element.stats.goals_scored,
				assists: element.stats.assists,
				clean_sheets: element.stats.clean_sheets,
				goals_conceded: element.stats.goals_conceded,
				bonus: element.stats.bonus,
				expected_goals_conceded: parseFloat(element.stats.expected_goals_conceded) || 1.5,
				saves: element.stats.saves,
				yellow_cards: element.stats.yellow_cards,
				red_cards: element.stats.red_cards,
				own_goals: element.stats.own_goals,
				penalties_saved: element.stats.penalties_saved,
				penalties_missed: element.stats.penalties_missed,
			};

			const luck = calculatePlayerGameweekLuck(
				testPlayer.id, testPlayer.web_name, currentGw, gwStats, baseline,
				gwStats.expected_goals_conceded, 3
			);

			// Sum all component points
			const componentSum = [
				luck.appearance, luck.goals, luck.assists, luck.cleanSheet,
				luck.goalsConceded, luck.bonus, luck.saves, luck.yellowCards,
				luck.redCards, luck.ownGoals, luck.penaltiesMissed, luck.penaltiesSaved
			].reduce((sum, c) => sum + c.points, 0);

			assertApprox(componentSum, luck.totalLuck, 0.001,
				`Component points sum equals totalLuck (${testPlayer.web_name})`);

			// Verify luck = actual - expected for each component
			assert(Math.abs(luck.goals.luck - (luck.goals.actual - luck.goals.expected)) < 0.001,
				`Goals luck = actual - expected`);
			assert(Math.abs(luck.goals.points - (luck.goals.luck * luck.goals.pointsPerUnit)) < 0.001,
				`Goals points = luck × pointsPerUnit`);
		}
	}

	// ========== TEST 2: Appearance Points ==========
	console.log('\n' + '='.repeat(70));
	console.log('TEST 2: Appearance Points');
	console.log('='.repeat(70));

	// Find player who played 90 mins
	let fullGamePlayer: { player: Player; stats: any } | null = null;
	let partGamePlayer: { player: Player; stats: any } | null = null;
	let noGamePlayer: { player: Player; stats: any } | null = null;

	for (const player of players) {
		const element = liveData.elements[player.id];
		if (!element?.stats) continue;

		if (element.stats.minutes >= 60 && !fullGamePlayer) {
			fullGamePlayer = { player, stats: element.stats };
		} else if (element.stats.minutes > 0 && element.stats.minutes < 60 && !partGamePlayer) {
			partGamePlayer = { player, stats: element.stats };
		} else if (element.stats.minutes === 0 && !noGamePlayer) {
			noGamePlayer = { player, stats: element.stats };
		}

		if (fullGamePlayer && partGamePlayer && noGamePlayer) break;
	}

	if (fullGamePlayer) {
		const baseline = baselines.get(fullGamePlayer.player.id)!;
		const gwStats: PlayerGWStats = {
			total_points: fullGamePlayer.stats.total_points,
			minutes: fullGamePlayer.stats.minutes,
			goals_scored: fullGamePlayer.stats.goals_scored,
			assists: fullGamePlayer.stats.assists,
			clean_sheets: fullGamePlayer.stats.clean_sheets,
			goals_conceded: fullGamePlayer.stats.goals_conceded,
			bonus: fullGamePlayer.stats.bonus,
			expected_goals_conceded: parseFloat(fullGamePlayer.stats.expected_goals_conceded) || 1.5,
		};
		const luck = calculatePlayerGameweekLuck(
			fullGamePlayer.player.id, fullGamePlayer.player.web_name, currentGw, gwStats, baseline, 1.5, 3
		);
		assert(luck.appearance.actual === 2, `60+ min player gets 2 appearance pts (${fullGamePlayer.player.web_name}: ${fullGamePlayer.stats.minutes} mins)`);
		assert(luck.appearance.expected === 2, `Expected appearance matches actual (no luck component)`);
		assert(luck.appearance.points === 0, `60+ min player has 0 appearance luck`);
	}

	if (partGamePlayer) {
		const baseline = baselines.get(partGamePlayer.player.id)!;
		const gwStats: PlayerGWStats = {
			total_points: partGamePlayer.stats.total_points,
			minutes: partGamePlayer.stats.minutes,
			goals_scored: partGamePlayer.stats.goals_scored,
			assists: partGamePlayer.stats.assists,
			clean_sheets: partGamePlayer.stats.clean_sheets,
			goals_conceded: partGamePlayer.stats.goals_conceded,
			bonus: partGamePlayer.stats.bonus,
			expected_goals_conceded: parseFloat(partGamePlayer.stats.expected_goals_conceded) || 1.5,
		};
		const luck = calculatePlayerGameweekLuck(
			partGamePlayer.player.id, partGamePlayer.player.web_name, currentGw, gwStats, baseline, 1.5, 3
		);
		assert(luck.appearance.actual === 1, `1-59 min player gets 1 appearance pt (${partGamePlayer.player.web_name}: ${partGamePlayer.stats.minutes} mins)`);
		assert(luck.appearance.points === 0, `1-59 min player has 0 appearance luck (excluded from luck calc)`);
	}

	if (noGamePlayer) {
		const baseline = baselines.get(noGamePlayer.player.id)!;
		const gwStats: PlayerGWStats = {
			total_points: 0, minutes: 0, goals_scored: 0, assists: 0,
			clean_sheets: 0, goals_conceded: 0, bonus: 0, expected_goals_conceded: 1.5,
		};
		const luck = calculatePlayerGameweekLuck(
			noGamePlayer.player.id, noGamePlayer.player.web_name, currentGw, gwStats, baseline, 1.5, 3
		);
		assert(luck.appearance.actual === 0, `0 min player gets 0 appearance pts`);
		assert(luck.appearance.points === 0, `0 min player has 0 appearance luck (excluded from luck calc)`);
	}

	// ========== TEST 3: FDR Application ==========
	console.log('\n' + '='.repeat(70));
	console.log('TEST 3: FDR Application');
	console.log('='.repeat(70));

	// Test that FDR affects expectations correctly
	const midfielder = players.find(p => p.element_type === 3 && p.minutes > 900);
	if (midfielder) {
		const baseline = baselines.get(midfielder.id)!;
		const baseGwStats: PlayerGWStats = {
			total_points: 6, minutes: 90, goals_scored: 1, assists: 0,
			clean_sheets: 0, goals_conceded: 0, bonus: 1, expected_goals_conceded: 1.5,
		};

		const luckEasy = calculatePlayerGameweekLuck(midfielder.id, midfielder.web_name, currentGw, baseGwStats, baseline, 1.5, 1);
		const luckHard = calculatePlayerGameweekLuck(midfielder.id, midfielder.web_name, currentGw, baseGwStats, baseline, 1.5, 5);

		// Easy fixture should have HIGHER expected goals (more attacking output)
		assert(luckEasy.goals.expected > luckHard.goals.expected,
			`Easy fixture has higher expected goals (${luckEasy.goals.expected.toFixed(3)} > ${luckHard.goals.expected.toFixed(3)})`);

		// Therefore, easy fixture should have LOWER luck for same actual performance
		assert(luckEasy.goals.luck < luckHard.goals.luck,
			`Easy fixture has lower goals luck for same output`);

		// Test defensive FDR
		const defender = players.find(p => p.element_type === 2 && p.minutes > 900);
		if (defender) {
			const defBaseline = baselines.get(defender.id)!;
			const defGwStats: PlayerGWStats = {
				total_points: 6, minutes: 90, goals_scored: 0, assists: 0,
				clean_sheets: 1, goals_conceded: 0, bonus: 1, expected_goals_conceded: 1.5,
			};

			const defLuckEasy = calculatePlayerGameweekLuck(defender.id, defender.web_name, currentGw, defGwStats, defBaseline, 1.5, 1);
			const defLuckHard = calculatePlayerGameweekLuck(defender.id, defender.web_name, currentGw, defGwStats, defBaseline, 1.5, 5);

			// Easy fixture should have HIGHER CS probability (weaker opponent)
			assert(defLuckEasy.cleanSheet.expected > defLuckHard.cleanSheet.expected,
				`Easy fixture has higher CS probability (${(defLuckEasy.cleanSheet.expected * 100).toFixed(1)}% > ${(defLuckHard.cleanSheet.expected * 100).toFixed(1)}%)`);

			// Easy fixture should have LOWER expected goals conceded
			assert(defLuckEasy.goalsConceded.expected < defLuckHard.goalsConceded.expected,
				`Easy fixture has lower expected GC (${defLuckEasy.goalsConceded.expected.toFixed(2)} < ${defLuckHard.goalsConceded.expected.toFixed(2)})`);
		}
	}

	// ========== TEST 4: FDR Lookup ==========
	console.log('\n' + '='.repeat(70));
	console.log('TEST 4: FDR Lookup from Fixtures');
	console.log('='.repeat(70));

	// Test that fixture data is loaded
	const gwFixtures = fixturesByGw.get(currentGw) || [];
	assert(gwFixtures.length > 0, `Fixtures loaded for GW${currentGw} (${gwFixtures.length} fixtures)`);

	// Test that we can look up FDR for multiple teams - at least one should not be 3
	const teamFDRs: { team: number; fdr: number }[] = [];
	for (let teamId = 1; teamId <= 20; teamId++) {
		const fdr = getPlayerFDR(teamId, currentGw, fixturesByGw);
		if (fdr >= 1 && fdr <= 5) {
			teamFDRs.push({ team: teamId, fdr });
		}
	}

	const nonNeutralFDRs = teamFDRs.filter(t => t.fdr !== 3);
	assert(teamFDRs.length > 0, `Can look up FDR for teams (${teamFDRs.length} teams found)`);
	assert(nonNeutralFDRs.length > 0, `At least one team has non-neutral FDR (${nonNeutralFDRs.length} teams)`);

	// Show some examples
	console.log(`\n   FDR examples for GW${currentGw}:`);
	for (const { team, fdr } of teamFDRs.slice(0, 5)) {
		console.log(`     Team ${team}: FDR ${fdr}`);
	}

	// ========== TEST 5: Position-Specific Logic ==========
	console.log('\n' + '='.repeat(70));
	console.log('TEST 5: Position-Specific Logic');
	console.log('='.repeat(70));

	// Test GK gets saves points
	const gk = players.find(p => p.element_type === 1 && p.minutes > 500);
	if (gk) {
		const baseline = baselines.get(gk.id)!;
		const gwStats: PlayerGWStats = {
			total_points: 6, minutes: 90, goals_scored: 0, assists: 0,
			clean_sheets: 1, goals_conceded: 0, bonus: 1, expected_goals_conceded: 1.5,
			saves: 5
		};
		const luck = calculatePlayerGameweekLuck(gk.id, gk.web_name, currentGw, gwStats, baseline, 1.5, 3);

		assert(luck.saves.actual === 5, `GK saves recorded (${gk.web_name})`);
		assert(luck.saves.pointsPerUnit === 1/3, `GK saves worth 0.333 pts each`);
		assert(baseline.savesPerGame > 0, `GK baseline has saves/90`);
	}

	// Test forward gets 0 CS points
	const fwd = players.find(p => p.element_type === 4 && p.minutes > 500);
	if (fwd) {
		const baseline = baselines.get(fwd.id)!;
		const gwStats: PlayerGWStats = {
			total_points: 6, minutes: 90, goals_scored: 1, assists: 0,
			clean_sheets: 1, goals_conceded: 0, bonus: 1, expected_goals_conceded: 1.5,
		};
		const luck = calculatePlayerGameweekLuck(fwd.id, fwd.web_name, currentGw, gwStats, baseline, 1.5, 3);

		assert(luck.cleanSheet.pointsPerUnit === 0, `Forward CS worth 0 pts (${fwd.web_name})`);
		assert(luck.goalsConceded.expected === 0, `Forward has no expected GC`);
	}

	// Test midfielder gets 1 CS point
	const mid = players.find(p => p.element_type === 3 && p.minutes > 500);
	if (mid) {
		const baseline = baselines.get(mid.id)!;
		assert(baseline.position === 3, `Midfielder position is 3`);
		const gwStats: PlayerGWStats = {
			total_points: 6, minutes: 90, goals_scored: 0, assists: 0,
			clean_sheets: 1, goals_conceded: 0, bonus: 0, expected_goals_conceded: 1.5,
		};
		const luck = calculatePlayerGameweekLuck(mid.id, mid.web_name, currentGw, gwStats, baseline, 1.5, 3);
		assert(luck.cleanSheet.pointsPerUnit === 1, `Midfielder CS worth 1 pt`);
	}

	// ========== TEST 6: Team Aggregation ==========
	console.log('\n' + '='.repeat(70));
	console.log('TEST 6: Team Luck Aggregation');
	console.log('='.repeat(70));

	// Pick 11 random players who played and sum their luck
	const playersWhoPlayed = players.filter(p => {
		const element = liveData.elements[p.id];
		return element?.stats?.minutes > 0;
	}).slice(0, 11);

	let teamTotalLuck = 0;
	let teamComponentLuck = {
		appearance: 0, goals: 0, assists: 0, cleanSheets: 0,
		goalsConceded: 0, bonus: 0, saves: 0, negative: 0
	};

	for (const player of playersWhoPlayed) {
		const element = liveData.elements[player.id];
		const baseline = baselines.get(player.id)!;
		const gwStats: PlayerGWStats = {
			total_points: element.stats.total_points,
			minutes: element.stats.minutes,
			goals_scored: element.stats.goals_scored,
			assists: element.stats.assists,
			clean_sheets: element.stats.clean_sheets,
			goals_conceded: element.stats.goals_conceded,
			bonus: element.stats.bonus,
			expected_goals_conceded: parseFloat(element.stats.expected_goals_conceded) || 1.5,
			saves: element.stats.saves,
			yellow_cards: element.stats.yellow_cards,
			red_cards: element.stats.red_cards,
			own_goals: element.stats.own_goals,
			penalties_saved: element.stats.penalties_saved,
			penalties_missed: element.stats.penalties_missed,
		};

		const fdr = getPlayerFDR(player.team, currentGw, fixturesByGw);
		const luck = calculatePlayerGameweekLuck(
			player.id, player.web_name, currentGw, gwStats, baseline,
			gwStats.expected_goals_conceded, fdr
		);

		teamTotalLuck += luck.totalLuck;
		teamComponentLuck.appearance += luck.appearance.points;
		teamComponentLuck.goals += luck.goals.points;
		teamComponentLuck.assists += luck.assists.points;
		teamComponentLuck.cleanSheets += luck.cleanSheet.points;
		teamComponentLuck.goalsConceded += luck.goalsConceded.points;
		teamComponentLuck.bonus += luck.bonus.points;
		teamComponentLuck.saves += luck.saves.points;
		teamComponentLuck.negative += luck.yellowCards.points + luck.redCards.points +
			luck.ownGoals.points + luck.penaltiesMissed.points + luck.penaltiesSaved.points;
	}

	const componentSumTeam = Object.values(teamComponentLuck).reduce((a, b) => a + b, 0);
	assertApprox(componentSumTeam, teamTotalLuck, 0.01,
		`Team component sum equals total luck (${componentSumTeam.toFixed(2)} ≈ ${teamTotalLuck.toFixed(2)})`);

	console.log(`\n   Sample team (${playersWhoPlayed.length} players):`);
	console.log(`   Total luck: ${teamTotalLuck >= 0 ? '+' : ''}${teamTotalLuck.toFixed(1)} pts`);
	console.log(`   Breakdown:`);
	console.log(`     Appearance: ${teamComponentLuck.appearance >= 0 ? '+' : ''}${teamComponentLuck.appearance.toFixed(1)}`);
	console.log(`     Goals: ${teamComponentLuck.goals >= 0 ? '+' : ''}${teamComponentLuck.goals.toFixed(1)}`);
	console.log(`     Assists: ${teamComponentLuck.assists >= 0 ? '+' : ''}${teamComponentLuck.assists.toFixed(1)}`);
	console.log(`     Clean Sheets: ${teamComponentLuck.cleanSheets >= 0 ? '+' : ''}${teamComponentLuck.cleanSheets.toFixed(1)}`);
	console.log(`     Goals Conceded: ${teamComponentLuck.goalsConceded >= 0 ? '+' : ''}${teamComponentLuck.goalsConceded.toFixed(1)}`);
	console.log(`     Bonus: ${teamComponentLuck.bonus >= 0 ? '+' : ''}${teamComponentLuck.bonus.toFixed(1)}`);
	console.log(`     Saves: ${teamComponentLuck.saves >= 0 ? '+' : ''}${teamComponentLuck.saves.toFixed(1)}`);
	console.log(`     Negative: ${teamComponentLuck.negative >= 0 ? '+' : ''}${teamComponentLuck.negative.toFixed(1)}`);

	// ========== TEST 7: Extreme Cases ==========
	console.log('\n' + '='.repeat(70));
	console.log('TEST 7: Extreme Cases');
	console.log('='.repeat(70));

	// Find highest scorer in GW
	let highestScorer: { player: Player; stats: any; luck: PlayerGameweekLuck } | null = null;
	let lowestScorer: { player: Player; stats: any; luck: PlayerGameweekLuck } | null = null;

	for (const player of players) {
		const element = liveData.elements[player.id];
		if (!element?.stats || element.stats.minutes === 0) continue;

		const baseline = baselines.get(player.id)!;
		const gwStats: PlayerGWStats = {
			total_points: element.stats.total_points,
			minutes: element.stats.minutes,
			goals_scored: element.stats.goals_scored,
			assists: element.stats.assists,
			clean_sheets: element.stats.clean_sheets,
			goals_conceded: element.stats.goals_conceded,
			bonus: element.stats.bonus,
			expected_goals_conceded: parseFloat(element.stats.expected_goals_conceded) || 1.5,
			saves: element.stats.saves,
			yellow_cards: element.stats.yellow_cards,
			red_cards: element.stats.red_cards,
			own_goals: element.stats.own_goals,
			penalties_saved: element.stats.penalties_saved,
			penalties_missed: element.stats.penalties_missed,
		};

		const fdr = getPlayerFDR(player.team, currentGw, fixturesByGw);
		const luck = calculatePlayerGameweekLuck(
			player.id, player.web_name, currentGw, gwStats, baseline,
			gwStats.expected_goals_conceded, fdr
		);

		if (!highestScorer || element.stats.total_points > highestScorer.stats.total_points) {
			highestScorer = { player, stats: element.stats, luck };
		}
		if (!lowestScorer || luck.totalLuck < lowestScorer.luck.totalLuck) {
			lowestScorer = { player, stats: element.stats, luck };
		}
	}

	if (highestScorer) {
		console.log(`\n   Highest scorer: ${highestScorer.player.web_name}`);
		console.log(`   Actual: ${highestScorer.stats.total_points} pts`);
		console.log(`   Expected: ${highestScorer.luck.totalExpectedPoints.toFixed(1)} pts`);
		console.log(`   Luck: ${highestScorer.luck.totalLuck >= 0 ? '+' : ''}${highestScorer.luck.totalLuck.toFixed(1)} pts`);

		// High scorers should typically have positive luck
		assert(highestScorer.luck.totalLuck > 0 || highestScorer.luck.totalExpectedPoints > 10,
			`High scorer has positive luck or high expected`);
	}

	if (lowestScorer) {
		console.log(`\n   Most unlucky: ${lowestScorer.player.web_name}`);
		console.log(`   Actual: ${lowestScorer.stats.total_points} pts`);
		console.log(`   Expected: ${lowestScorer.luck.totalExpectedPoints.toFixed(1)} pts`);
		console.log(`   Luck: ${lowestScorer.luck.totalLuck >= 0 ? '+' : ''}${lowestScorer.luck.totalLuck.toFixed(1)} pts`);
	}

	// ========== TEST 8: Statistical Distribution ==========
	console.log('\n' + '='.repeat(70));
	console.log('TEST 8: Statistical Distribution');
	console.log('='.repeat(70));

	const allLuck: number[] = [];
	for (const player of players) {
		const element = liveData.elements[player.id];
		if (!element?.stats || element.stats.minutes === 0) continue;

		const baseline = baselines.get(player.id);
		if (!baseline) continue;

		const gwStats: PlayerGWStats = {
			total_points: element.stats.total_points,
			minutes: element.stats.minutes,
			goals_scored: element.stats.goals_scored,
			assists: element.stats.assists,
			clean_sheets: element.stats.clean_sheets,
			goals_conceded: element.stats.goals_conceded,
			bonus: element.stats.bonus,
			expected_goals_conceded: parseFloat(element.stats.expected_goals_conceded) || 1.5,
			saves: element.stats.saves,
			yellow_cards: element.stats.yellow_cards,
			red_cards: element.stats.red_cards,
			own_goals: element.stats.own_goals,
			penalties_saved: element.stats.penalties_saved,
			penalties_missed: element.stats.penalties_missed,
		};

		const fdr = getPlayerFDR(player.team, currentGw, fixturesByGw);
		const luck = calculatePlayerGameweekLuck(player.id, player.web_name, currentGw, gwStats, baseline, gwStats.expected_goals_conceded, fdr);
		allLuck.push(luck.totalLuck);
	}

	const avgLuck = allLuck.reduce((a, b) => a + b, 0) / allLuck.length;
	const variance = allLuck.reduce((sum, l) => sum + Math.pow(l - avgLuck, 2), 0) / allLuck.length;
	const stdDev = Math.sqrt(variance);
	const maxLuck = Math.max(...allLuck);
	const minLuck = Math.min(...allLuck);

	console.log(`\n   Players analyzed: ${allLuck.length}`);
	console.log(`   Average luck: ${avgLuck >= 0 ? '+' : ''}${avgLuck.toFixed(2)} pts`);
	console.log(`   Std deviation: ${stdDev.toFixed(2)} pts`);
	console.log(`   Range: ${minLuck.toFixed(1)} to +${maxLuck.toFixed(1)} pts`);

	// Average luck should be close to 0 (maybe slightly negative due to appearance)
	assert(Math.abs(avgLuck) < 3, `Average luck reasonably close to 0 (${avgLuck.toFixed(2)})`);

	// Std dev should be reasonable (2-8 pts is typical)
	assert(stdDev > 1 && stdDev < 10, `Std deviation is reasonable (${stdDev.toFixed(2)})`);

	// ========== SUMMARY ==========
	console.log('\n' + '='.repeat(70));
	console.log('TEST SUMMARY');
	console.log('='.repeat(70));
	console.log(`\n   ✓ Passed: ${testsPassed}`);
	console.log(`   ✗ Failed: ${testsFailed}`);

	if (failedTests.length > 0) {
		console.log(`\n   Failed tests:`);
		for (const test of failedTests) {
			console.log(`     - ${test}`);
		}
	}

	console.log('\n' + '='.repeat(70));
	if (testsFailed === 0) {
		console.log('✅ All tests passed!');
	} else {
		console.log(`❌ ${testsFailed} test(s) failed`);
	}
	console.log('='.repeat(70));
}

runTests().catch(console.error);
