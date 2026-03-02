import type { DetailedEntry, LeagueDetails, PlayerGWStats, EnrichedPlayer, LossCategory, GameweekResult, ManagerLossAnalysis, Robbery } from '$lib/types/fpl';
import type { PlayerBaseline, FixtureData } from './types';
import { calculatePlayerGameweekLuck } from './luck';
import { getPlayerFDR } from './fdr';

export interface FixtureLuckGW {
	gameweek: number;
	score: number;
	expectedScore: number; // Your expected score
	wouldBeat: number; // Number of managers you'd beat
	wouldDraw: number; // Number of managers you'd draw
	wouldLose: number; // Number of managers you'd lose to
	totalOpponents: number;
	expectedFixturePoints: number; // Expected based on where your score ranks
	actualFixturePoints: number; // 3 for win, 1 for draw, 0 for loss
	fixtureLuck: number; // Actual - Expected (schedule luck)
	opponentName: string;
	opponentScore: number;
	opponentExpectedScore: number; // Opponent's expected score
	opponentVariance: number; // Opponent's (actual - expected)
}

export interface ManagerFixtureLuck {
	managerId: number;
	managerName: string;
	gameweeks: FixtureLuckGW[];
	totalFixtureLuck: number; // Sum of all GW fixture luck (schedule-based)
	expectedFixturePoints: number; // Total expected over season
	actualFixturePoints: number; // Total actual over season
	luckyWins: number; // Wins where you would have lost to most opponents
	unluckyLosses: number; // Losses where you would have beaten most opponents
	totalOpponentVariance: number; // Sum of opponent (actual - expected) across all matches
}

// Helper to calculate expected score for a manager in a gameweek
function calculateExpectedScore(
	entry: DetailedEntry,
	gw: number,
	liveData: Record<string, PlayerGWStats>,
	baselines: Map<number, PlayerBaseline>,
	players: Record<number, EnrichedPlayer>,
	fixturesByGw: Map<number, FixtureData[]>
): number {
	const pick = entry.recentPicks.find(p => p.gameweek === gw);
	if (!pick?.data?.picks) return 0;

	const startingXI = pick.data.picks.filter(p => p.position <= 11);
	const autoSubs = pick.data.subs || [];
	const playersWhoWentOff = new Set(autoSubs.map(s => s.element_out));

	let totalExpected = 0;

	// Process starting XI (excluding those who were subbed off)
	for (const playerPick of startingXI) {
		if (playersWhoWentOff.has(playerPick.element)) continue;

		const stats = liveData[String(playerPick.element)];
		const baseline = baselines.get(playerPick.element);
		const playerInfo = players[playerPick.element];

		if (stats && baseline) {
			const opponentXG = stats.expected_goals_conceded || 1.5;
			const fdr = getPlayerFDR(playerInfo?.team, gw, fixturesByGw);

			const playerLuck = calculatePlayerGameweekLuck(
				playerPick.element,
				playerInfo?.web_name || 'Unknown',
				gw,
				stats,
				baseline,
				opponentXG,
				fdr
			);

			totalExpected += playerLuck.totalExpectedPoints;
		}
	}

	// Process auto-subs who came on
	for (const sub of autoSubs) {
		const stats = liveData[String(sub.element_in)];
		const baseline = baselines.get(sub.element_in);
		const playerInfo = players[sub.element_in];

		if (stats && baseline) {
			const opponentXG = stats.expected_goals_conceded || 1.5;
			const fdr = getPlayerFDR(playerInfo?.team, gw, fixturesByGw);

			const playerLuck = calculatePlayerGameweekLuck(
				sub.element_in,
				playerInfo?.web_name || 'Unknown',
				gw,
				stats,
				baseline,
				opponentXG,
				fdr
			);

			totalExpected += playerLuck.totalExpectedPoints;
		}
	}

	return totalExpected;
}

/**
 * Build a cache of expected scores for all managers across all gameweeks
 * Shared between calculateFixtureLuck and calculateLossAnalysis
 */
export function buildExpectedScoresCache(
	entries: DetailedEntry[],
	completedGameweeks: number[],
	liveDataMap: Map<number, Record<string, PlayerGWStats>>,
	baselines: Map<number, PlayerBaseline>,
	players: Record<number, EnrichedPlayer>,
	fixturesByGw: Map<number, FixtureData[]>
): Map<string, number> {
	const cache = new Map<string, number>();
	for (const entry of entries) {
		if (!entry.entry_id) continue;
		for (const gw of completedGameweeks) {
			const liveData = liveDataMap.get(gw);
			if (!liveData) continue;
			const expected = calculateExpectedScore(entry, gw, liveData, baselines, players, fixturesByGw);
			cache.set(`${entry.entry_id}-${gw}`, expected);
		}
	}
	return cache;
}

/**
 * Calculate fixture luck for each manager
 * Fixture luck measures how favorable your H2H schedule was
 *
 * Schedule Luck: Based on opponent's EXPECTED scores (squad quality)
 * Opponent Variance: Opponent's (actual - expected) - their luck against you
 */
export function calculateFixtureLuck(
	entries: DetailedEntry[],
	matches: LeagueDetails['matches'],
	completedGameweeks: number[],
	liveDataMap: Map<number, Record<string, PlayerGWStats>>,
	baselines: Map<number, PlayerBaseline>,
	players: Record<number, EnrichedPlayer>,
	fixturesByGw: Map<number, FixtureData[]>
): ManagerFixtureLuck[] {
	const results: ManagerFixtureLuck[] = [];

	// Pre-calculate expected scores for all managers for all gameweeks
	const expectedScoresCache = buildExpectedScoresCache(
		entries, completedGameweeks, liveDataMap, baselines, players, fixturesByGw
	);

	for (const entry of entries) {
		if (!entry.entry_id) continue;

		const managerName =
			`${entry.player_first_name || ''} ${entry.player_last_name || ''}`.trim() || 'Unknown';
		const gameweeks: FixtureLuckGW[] = [];
		let totalFixtureLuck = 0;
		let totalExpectedFP = 0;
		let totalActualFP = 0;
		let luckyWins = 0;
		let unluckyLosses = 0;
		let totalOpponentVariance = 0;

		for (const gw of completedGameweeks) {
			const gwHistory = entry.history.find((h) => h.event === gw);
			if (!gwHistory) continue;

			const myScore = gwHistory.points;
			const myExpected = expectedScoresCache.get(`${entry.entry_id}-${gw}`) || 0;

			// Get all other managers' scores and expected scores for this gameweek
			const otherScores: { entryId: number; leagueId: number; score: number; expected: number; name: string }[] = [];
			for (const e of entries) {
				if (!e.entry_id || e.entry_id === entry.entry_id) continue;
				const hist = e.history.find((h) => h.event === gw);
				if (hist) {
					otherScores.push({
						entryId: e.entry_id,
						leagueId: e.id!,
						score: hist.points,
						expected: expectedScoresCache.get(`${e.entry_id}-${gw}`) || 0,
						name: `${e.player_first_name || ''} ${e.player_last_name || ''}`.trim()
					});
				}
			}

			if (otherScores.length === 0) continue;

			// Calculate would beat/draw/lose based on ACTUAL scores
			const wouldBeat = otherScores.filter((s) => s.score < myScore).length;
			const wouldDraw = otherScores.filter((s) => s.score === myScore).length;
			const wouldLose = otherScores.filter((s) => s.score > myScore).length;
			const totalOpponents = otherScores.length;

			// Expected fixture points = weighted average of outcomes
			const expectedFixturePoints = (wouldBeat * 3 + wouldDraw * 1) / totalOpponents;

			// Find actual H2H match result
			const match = matches.find(
				(m) =>
					m.event === gw &&
					m.finished &&
					(m.league_entry_1 === entry.id || m.league_entry_2 === entry.id)
			);

			let actualFixturePoints = 0;
			let opponentName = 'Unknown';
			let opponentScore = 0;
			let opponentExpectedScore = 0;
			let opponentVariance = 0;

			if (match) {
				const isEntry1 = match.league_entry_1 === entry.id;
				const opponentLeagueId = isEntry1 ? match.league_entry_2 : match.league_entry_1;
				const opponentEntry = entries.find((e) => e.id === opponentLeagueId);

				if (opponentEntry && opponentEntry.entry_id) {
					opponentName =
						`${opponentEntry.player_first_name || ''} ${opponentEntry.player_last_name || ''}`.trim();
					const oppHist = opponentEntry.history.find((h) => h.event === gw);
					opponentScore = oppHist?.points || 0;
					opponentExpectedScore = expectedScoresCache.get(`${opponentEntry.entry_id}-${gw}`) || 0;

					// Opponent variance = their actual - their expected
					// Positive = they overperformed against you (bad for you)
					// Negative = they underperformed against you (good for you)
					opponentVariance = opponentScore - opponentExpectedScore;
				}

				const myMatchScore = isEntry1 ? match.league_entry_1_points : match.league_entry_2_points;
				const theirMatchScore = isEntry1 ? match.league_entry_2_points : match.league_entry_1_points;

				if (myMatchScore > theirMatchScore) {
					actualFixturePoints = 3;
				} else if (myMatchScore === theirMatchScore) {
					actualFixturePoints = 1;
				} else {
					actualFixturePoints = 0;
				}
			}

			const fixtureLuck = actualFixturePoints - expectedFixturePoints;

			// Track lucky wins and unlucky losses
			// Use >= floor((opponents+1)/2) to match would-have-beat.ts formula
			// This means beating at least half the field (including yourself conceptually)
			const halfOfField = Math.floor((totalOpponents + 1) / 2);
			const wouldBeatMost = wouldBeat >= halfOfField;
			const wouldLoseToMost = wouldLose >= halfOfField;

			if (actualFixturePoints === 3 && wouldLoseToMost) {
				luckyWins++;
			}
			if (actualFixturePoints === 0 && wouldBeatMost) {
				unluckyLosses++;
			}

			totalFixtureLuck += fixtureLuck;
			totalExpectedFP += expectedFixturePoints;
			totalActualFP += actualFixturePoints;
			totalOpponentVariance += opponentVariance;

			gameweeks.push({
				gameweek: gw,
				score: myScore,
				expectedScore: Math.round(myExpected * 10) / 10,
				wouldBeat,
				wouldDraw,
				wouldLose,
				totalOpponents,
				expectedFixturePoints: Math.round(expectedFixturePoints * 100) / 100,
				actualFixturePoints,
				fixtureLuck: Math.round(fixtureLuck * 100) / 100,
				opponentName,
				opponentScore,
				opponentExpectedScore: Math.round(opponentExpectedScore * 10) / 10,
				opponentVariance: Math.round(opponentVariance * 10) / 10
			});
		}

		// Sort by gameweek
		gameweeks.sort((a, b) => a.gameweek - b.gameweek);

		results.push({
			managerId: entry.entry_id,
			managerName,
			gameweeks,
			totalFixtureLuck: Math.round(totalFixtureLuck * 100) / 100,
			expectedFixturePoints: Math.round(totalExpectedFP * 100) / 100,
			actualFixturePoints: totalActualFP,
			luckyWins,
			unluckyLosses,
			totalOpponentVariance: Math.round(totalOpponentVariance * 10) / 10
		});
	}

	return results;
}

/**
 * Calculate z-score for a value within a dataset
 */
function zScore(value: number, values: number[]): number {
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
	const stdDev = Math.sqrt(variance);
	if (stdDev === 0) return 0;
	return (value - mean) / stdDev;
}

export interface HolisticLuck {
	managerId: number;
	managerName: string;
	// Performance luck (your players over/underperformance)
	performanceLuck: number;
	performanceZScore: number;
	// Schedule luck (did you face strong or weak squads based on expected scores)
	scheduleLuck: number; // Fixture points relative to expected
	scheduleZScore: number;
	// Robbery luck (opponent's players having massive hauls that cost you matches)
	robberyLuck: number; // Points stolen by opponent overperformance (negative = bad luck)
	robberyZScore: number;
	totalRobberies: number;
	totalPointsStolen: number;
	// Combined holistic luck
	holisticZScore: number;
	holisticRank: number;
	// Narrative helpers
	luckyWins: number;
	unluckyLosses: number;
}

/**
 * Combine performance luck, schedule luck, and outcome luck into holistic luck
 * Uses z-scores to normalize different scales
 *
 * - Performance Luck: Your players over/underperforming their expected
 * - Schedule Luck: Did you face easy or tough schedules (fixture points vs expected)
 * - Outcome Luck: FP lost to opponent overperformance (opponent-luck + robbery losses)
 */
export function calculateHolisticLuck(
	performanceLuck: { managerId: number; managerName: string; seasonLuck: number }[],
	fixtureLuck: ManagerFixtureLuck[],
	lossAnalysis: ManagerLossAnalysis[] = []
): HolisticLuck[] {
	// Extract values for z-score calculation
	const perfValues = performanceLuck.map((p) => p.seasonLuck);
	const scheduleValues = fixtureLuck.map((f) => f.totalFixtureLuck);

	// Outcome luck = FP lost to factors outside your control (negative = bad luck)
	// Uses loss analysis: opponent-luck + robbery losses (NOT self-inflicted or fair)
	const outcomeValues = performanceLuck.map((p) => {
		const analysis = lossAnalysis.find((a) => a.managerId === p.managerId);
		if (!analysis) return 0;
		// Negative because FP lost is bad luck
		return -(analysis.fpLostToOpponentLuck + analysis.fpLostToRobberies);
	});

	const results: HolisticLuck[] = [];

	for (const perf of performanceLuck) {
		const fixture = fixtureLuck.find((f) => f.managerId === perf.managerId);
		const analysis = lossAnalysis.find((a) => a.managerId === perf.managerId);
		if (!fixture) continue;

		// Outcome luck = FP lost to opponent overperformance (negative = bad luck)
		const outcomeLuck = analysis
			? -(analysis.fpLostToOpponentLuck + analysis.fpLostToRobberies)
			: 0;

		const perfZ = zScore(perf.seasonLuck, perfValues);
		const schedZ = zScore(fixture.totalFixtureLuck, scheduleValues);
		const outcomeZ = zScore(outcomeLuck, outcomeValues);

		// Combine z-scores (equal weighting across all 3 components)
		const holisticZ = (perfZ + schedZ + outcomeZ) / 3;

		results.push({
			managerId: perf.managerId,
			managerName: perf.managerName,
			performanceLuck: Math.round(perf.seasonLuck * 10) / 10,
			performanceZScore: Math.round(perfZ * 100) / 100,
			scheduleLuck: fixture.totalFixtureLuck,
			scheduleZScore: Math.round(schedZ * 100) / 100,
			outcomeLuck: Math.round(outcomeLuck * 100) / 100,
			outcomeZScore: Math.round(outcomeZ * 100) / 100,
			// Loss breakdown from analysis
			fairLosses: analysis?.fairLosses || 0,
			selfInflictedLosses: analysis?.selfInflictedLosses || 0,
			opponentLuckLosses: analysis?.opponentLuckLosses || 0,
			robberyLosses: analysis?.robberyLosses || 0,
			mixedLosses: analysis?.mixedLosses || 0,
			fpLostToOpponentLuck: analysis?.fpLostToOpponentLuck || 0,
			fpLostToRobberies: analysis?.fpLostToRobberies || 0,
			totalFPLost: analysis?.totalFPLost || 0,
			holisticZScore: Math.round(holisticZ * 100) / 100,
			holisticRank: 0, // Will be set after sorting
			luckyWins: analysis?.luckyWins || 0,
			unluckyLosses: fixture.unluckyLosses,
			luckyDraws: analysis?.luckyDraws || 0,
			unluckyDraws: analysis?.unluckyDraws || 0
		});
	}

	// Sort by holistic z-score (highest = luckiest) and assign ranks
	results.sort((a, b) => b.holisticZScore - a.holisticZScore);
	results.forEach((r, i) => {
		r.holisticRank = i + 1;
	});

	return results;
}

// Threshold for considering variance significant (in points)
// 8 points = roughly a goal + assist, or significant over/underperformance
const VARIANCE_THRESHOLD = 8;

/**
 * Categorize a loss based on performance variance
 */
function categorizeLoss(
	yourVariance: number,
	opponentVariance: number,
	isRobbery: boolean
): LossCategory {
	const youUnderperformed = yourVariance < -VARIANCE_THRESHOLD;
	const opponentOverperformed = opponentVariance > VARIANCE_THRESHOLD;

	if (isRobbery) {
		// Robbery takes precedence - single player caused this
		return 'robbery';
	}

	if (youUnderperformed && opponentOverperformed) {
		return 'mixed';
	}

	if (youUnderperformed) {
		return 'self-inflicted';
	}

	if (opponentOverperformed) {
		return 'opponent-luck';
	}

	return 'fair';
}

/**
 * Analyze each gameweek result and categorize losses
 */
export function calculateLossAnalysis(
	entries: DetailedEntry[],
	matches: LeagueDetails['matches'],
	completedGameweeks: number[],
	liveDataMap: Map<number, Record<string, PlayerGWStats>>,
	baselines: Map<number, PlayerBaseline>,
	players: Record<number, EnrichedPlayer>,
	fixturesByGw: Map<number, FixtureData[]>,
	robberies: { managerId: number; robberies: Robbery[] }[]
): ManagerLossAnalysis[] {
	const results: ManagerLossAnalysis[] = [];

	// Pre-calculate expected scores for all managers for all gameweeks
	const expectedScoresCache = buildExpectedScoresCache(
		entries, completedGameweeks, liveDataMap, baselines, players, fixturesByGw
	);

	for (const entry of entries) {
		if (!entry.entry_id) continue;

		const managerName =
			`${entry.player_first_name || ''} ${entry.player_last_name || ''}`.trim() || 'Unknown';
		const gameweekResults: GameweekResult[] = [];
		const managerRobberies = robberies.find(r => r.managerId === entry.entry_id)?.robberies || [];

		// Counters
		let totalWins = 0, totalDraws = 0, totalLosses = 0;
		let fairLosses = 0, selfInflictedLosses = 0, opponentLuckLosses = 0, robberyLosses = 0, robberiesAlsoSelfInflicted = 0, mixedLosses = 0;
		let fpLostToFair = 0, fpLostToSelf = 0, fpLostToOpponentLuck = 0, fpLostToRobberies = 0, fpLostToMixed = 0;
		let luckyWins = 0, fpGainedFromLuck = 0;
		let luckyDraws = 0, unluckyDraws = 0;

		for (const gw of completedGameweeks) {
			const gwHistory = entry.history.find(h => h.event === gw);
			if (!gwHistory) continue;

			const myScore = gwHistory.points;
			const myExpected = expectedScoresCache.get(`${entry.entry_id}-${gw}`) || 0;
			const myVariance = myScore - myExpected;

			// Find actual H2H match
			const match = matches.find(
				m => m.event === gw && m.finished &&
					(m.league_entry_1 === entry.id || m.league_entry_2 === entry.id)
			);

			if (!match) continue;

			const isEntry1 = match.league_entry_1 === entry.id;
			const opponentLeagueId = isEntry1 ? match.league_entry_2 : match.league_entry_1;
			const opponentEntry = entries.find(e => e.id === opponentLeagueId);
			if (!opponentEntry?.entry_id) continue;

			const opponentName = `${opponentEntry.player_first_name || ''} ${opponentEntry.player_last_name || ''}`.trim() || 'Unknown';
			const opponentHist = opponentEntry.history.find(h => h.event === gw);
			const opponentScore = opponentHist?.points || 0;
			const opponentExpected = expectedScoresCache.get(`${opponentEntry.entry_id}-${gw}`) || 0;
			const opponentVariance = opponentScore - opponentExpected;

			const myMatchScore = isEntry1 ? match.league_entry_1_points : match.league_entry_2_points;
			const theirMatchScore = isEntry1 ? match.league_entry_2_points : match.league_entry_1_points;

			let result: 'W' | 'L' | 'D';
			let actualFP: number;
			if (myMatchScore > theirMatchScore) {
				result = 'W';
				actualFP = 3;
				totalWins++;
			} else if (myMatchScore < theirMatchScore) {
				result = 'L';
				actualFP = 0;
				totalLosses++;
			} else {
				result = 'D';
				actualFP = 1;
				totalDraws++;
			}

			// Calculate expected FP based on score ranking
			const otherScores = entries
				.filter(e => e.entry_id && e.entry_id !== entry.entry_id)
				.map(e => e.history.find(h => h.event === gw)?.points || 0);
			const wouldBeat = otherScores.filter(s => s < myScore).length;
			const wouldDraw = otherScores.filter(s => s === myScore).length;
			const totalOpponents = otherScores.length;
			const expectedFP = totalOpponents > 0 ? (wouldBeat * 3 + wouldDraw * 1) / totalOpponents : 0;
			const fpLuck = actualFP - expectedFP;

			// Check if this was a robbery
			const robberyMatch = managerRobberies.find(r => r.gameweek === gw);
			const isRobbery = !!robberyMatch;

			let lossCategory: LossCategory | undefined;
			let robberyPlayer: string | undefined;
			let robberyPoints: number | undefined;
			let wasAlsoSelfInflicted: boolean | undefined;

			if (result === 'L') {
				lossCategory = categorizeLoss(myVariance, opponentVariance, isRobbery);

				if (isRobbery && robberyMatch) {
					robberyPlayer = robberyMatch.culprit.playerName;
					robberyPoints = robberyMatch.culprit.luckPoints;
					// Track if you also underperformed during this robbery
					wasAlsoSelfInflicted = myVariance < -VARIANCE_THRESHOLD;
				}

				// Track FP lost by category
				const fpLost = expectedFP - actualFP; // Positive number = FP you should have gotten
				switch (lossCategory) {
					case 'fair':
						fairLosses++;
						fpLostToFair += fpLost;
						break;
					case 'self-inflicted':
						selfInflictedLosses++;
						fpLostToSelf += fpLost;
						break;
					case 'opponent-luck':
						opponentLuckLosses++;
						fpLostToOpponentLuck += fpLost;
						break;
					case 'robbery':
						robberyLosses++;
						if (wasAlsoSelfInflicted) robberiesAlsoSelfInflicted++;
						fpLostToRobberies += fpLost;
						break;
					case 'mixed':
						mixedLosses++;
						fpLostToMixed += fpLost;
						break;
				}
			}

			// Track lucky wins (you overperformed OR opponent underperformed significantly)
			if (result === 'W') {
				const youOverperformed = myVariance > VARIANCE_THRESHOLD;
				const opponentUnderperformed = opponentVariance < -VARIANCE_THRESHOLD;
				if (youOverperformed || opponentUnderperformed) {
					luckyWins++;
					// FP gained = what you got minus what you expected
					fpGainedFromLuck += Math.max(0, actualFP - expectedFP);
				}
			}

			// Track lucky/unlucky draws based on performance variance
			if (result === 'D') {
				const youUnderperformed = myVariance < -VARIANCE_THRESHOLD;
				const youOverperformed = myVariance > VARIANCE_THRESHOLD;
				const opponentUnderperformed = opponentVariance < -VARIANCE_THRESHOLD;
				const opponentOverperformed = opponentVariance > VARIANCE_THRESHOLD;

				// Lucky draw: You underperformed but still drew (opponent also underperformed more)
				if (youUnderperformed && !opponentOverperformed) {
					luckyDraws++;
				}
				// Unlucky draw: You overperformed but only got a draw (opponent also overperformed)
				if (youOverperformed && !opponentUnderperformed) {
					unluckyDraws++;
				}
			}

			gameweekResults.push({
				gameweek: gw,
				result,
				yourScore: myScore,
				yourExpected: Math.round(myExpected * 10) / 10,
				yourVariance: Math.round(myVariance * 10) / 10,
				opponentName,
				opponentScore,
				opponentExpected: Math.round(opponentExpected * 10) / 10,
				opponentVariance: Math.round(opponentVariance * 10) / 10,
				lossCategory,
				robberyPlayer,
				robberyPoints: robberyPoints ? Math.round(robberyPoints * 10) / 10 : undefined,
				wasAlsoSelfInflicted,
				expectedFP: Math.round(expectedFP * 100) / 100,
				actualFP,
				fpLuck: Math.round(fpLuck * 100) / 100
			});
		}

		// Sort by gameweek
		gameweekResults.sort((a, b) => a.gameweek - b.gameweek);

		const totalFPLost = fpLostToFair + fpLostToSelf + fpLostToOpponentLuck + fpLostToRobberies + fpLostToMixed;

		results.push({
			managerId: entry.entry_id,
			managerName,
			gameweeks: gameweekResults,
			totalWins,
			totalDraws,
			totalLosses,
			fairLosses,
			selfInflictedLosses,
			opponentLuckLosses,
			robberyLosses,
			robberiesAlsoSelfInflicted,
			mixedLosses,
			fpLostToFair: Math.round(fpLostToFair * 100) / 100,
			fpLostToSelf: Math.round(fpLostToSelf * 100) / 100,
			fpLostToOpponentLuck: Math.round(fpLostToOpponentLuck * 100) / 100,
			fpLostToRobberies: Math.round(fpLostToRobberies * 100) / 100,
			fpLostToMixed: Math.round(fpLostToMixed * 100) / 100,
			totalFPLost: Math.round(totalFPLost * 100) / 100,
			luckyWins,
			fpGainedFromLuck: Math.round(fpGainedFromLuck * 100) / 100,
			luckyDraws,
			unluckyDraws
		});
	}

	// Sort by total FP lost (most unlucky first)
	return results.sort((a, b) => b.totalFPLost - a.totalFPLost);
}
