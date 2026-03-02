import type { PageServerLoad } from './$types';
import type {
	Bootstrap,
	LeagueDetails,
	EntryHistory,
	EntryEventPicks,
	EnrichedPlayer,
	Standing,
	DetailedEntry,
	H2HRecord,
	Match,
	MatchResult,
	ManagerLuck,
	RivalryStats,
	GameweekLuck,
	Transaction,
	TransferAnalysis,
	Pick as FplPick,
	NemesisBunny,
	ManagerStreak,
	GameweekAwards,
	WeeklyAward,
	ManagerWouldHaveBeat,
	WouldHaveBeatGW,
	WeeklyBanter,
	FunStatEntry,
	FunStats,
	RobberyCulprit,
	Robbery,
	ManagerRobberies,
	ManagerLuckBreakdown,
	PlayerGWStats
} from '$lib/types/fpl';
import { env } from '$env/dynamic/private';

// Import calculation modules
import {
	type PlayerBaseline,
	type FixtureData,
	buildPlayerBaselines,
	getPlayerFDR,
	calculatePlayerGameweekLuck,
	getManagerNameFromEntry,
	buildH2HMatrix,
	processFixtures,
	calculateRivalryStats,
	calculateNemesisBunny,
	calculateStreaks,
	calculateWouldHaveBeat,
	calculateFixtureLuck,
	calculateHolisticLuck,
	calculateLossAnalysis
} from '$lib/calculations';

const LEAGUE_ID = 21959;

// Calculate expected goals/assists for a player in a specific match
function getExpectedOutput(
	playerId: number,
	matchMinutes: number,
	baselines: Map<number, PlayerBaseline>
): { expectedGoals: number; expectedAssists: number } {
	const baseline = baselines.get(playerId);
	if (!baseline || matchMinutes === 0) {
		return { expectedGoals: 0, expectedAssists: 0 };
	}

	return {
		expectedGoals: (baseline.goalsPerGame * matchMinutes) / 90,
		expectedAssists: (baseline.assistsPerGame * matchMinutes) / 90
	};
}

// Build standings from API data
function buildStandings(leagueDetails: LeagueDetails, histories: Map<number, EntryHistory>): Standing[] {
	const entryLookup = new Map(leagueDetails.league_entries.map(e => [e.id, e]));

	// Use the API standings which have correct fixture points
	return leagueDetails.standings.map(apiStanding => {
		const entry = entryLookup.get(apiStanding.league_entry);
		const history = entry?.entry_id ? histories.get(entry.entry_id) : null;
		const latestHistory = history?.history[history.history.length - 1];

		// Handle special "AVERAGE" system entry (has null entry_id and names)
		const isAverageEntry = !entry?.entry_id;
		const playerName = isAverageEntry
			? 'AVERAGE'
			: `${entry?.player_first_name || ''} ${entry?.player_last_name || ''}`.trim() || 'Unknown';
		const entryName = isAverageEntry
			? 'League Average'
			: entry?.entry_name || 'Unknown';

		return {
			entry_id: entry?.entry_id || 0,
			entry_name: entryName,
			player_name: playerName,
			played: apiStanding.matches_played,
			wins: apiStanding.matches_won,
			draws: apiStanding.matches_drawn,
			losses: apiStanding.matches_lost,
			points_for: apiStanding.points_for,      // Total FPL points
			points_against: apiStanding.points_against,
			total: apiStanding.total,                 // Fixture points (3*W + D)
			rank: apiStanding.rank,
			event_total: latestHistory?.points || 0
		};
	});
}

// Calculate weekly awards for each gameweek
function calculateWeeklyAwards(
	entries: DetailedEntry[],
	matches: LeagueDetails['matches'],
	liveDataMap: Map<number, Record<string, any>>,
	completedGameweeks: number[],
	players: Record<number, EnrichedPlayer>
): GameweekAwards[] {
	const awards: GameweekAwards[] = [];

	for (const gw of completedGameweeks) {
		const liveData = liveDataMap.get(gw);
		if (!liveData) continue;

		// Get gameweek scores for each manager
		const gwScores: { managerId: number; managerName: string; points: number; benchPoints: number }[] = [];

		for (const entry of entries) {
			if (!entry.entry_id) continue;

			const gwHistory = entry.history.find(h => h.event === gw);
			const gwPicks = entry.recentPicks.find(p => p.gameweek === gw);

			if (!gwHistory) continue;

			const managerName = `${entry.player_first_name || ''} ${entry.player_last_name || ''}`.trim() || 'Unknown';

			// Calculate WASTED bench points (same logic as main calculation)
			let benchPoints = 0;
			if (gwPicks?.data?.picks) {
				const startingXI = gwPicks.data.picks.filter(p => p.position <= 11);
				const benchPicks = gwPicks.data.picks.filter(p => p.position > 11);
				const autoSubs = gwPicks.data.subs || [];
				const playersWhoCameOn = new Set(autoSubs.map(s => s.element_in));

				// Separate bench into GK and outfield
				const benchGK = benchPicks.find(p => players[p.element]?.element_type === 1);
				const benchOutfield = benchPicks.filter(p => players[p.element]?.element_type !== 1);

				// GK waste
				if (benchGK && !playersWhoCameOn.has(benchGK.element)) {
					const benchGKPoints = liveData[String(benchGK.element)]?.total_points || 0;
					const startingGK = startingXI.find(p => players[p.element]?.element_type === 1);
					if (startingGK) {
						const startingGKMinutes = liveData[String(startingGK.element)]?.minutes || 0;
						const startingGKPoints = liveData[String(startingGK.element)]?.total_points || 0;
						if (startingGKMinutes > 0) {
							benchPoints += Math.max(0, benchGKPoints - startingGKPoints);
						}
					}
				}

				// Outfield waste
				const outfieldBenchWhoDidntComeOn = benchOutfield.filter(p => !playersWhoCameOn.has(p.element));
				if (outfieldBenchWhoDidntComeOn.length > 0) {
					const benchOutfieldTotal = outfieldBenchWhoDidntComeOn.reduce((sum, p) => {
						return sum + (liveData[String(p.element)]?.total_points || 0);
					}, 0);

					const outfieldStarters = startingXI
						.filter(p => players[p.element]?.element_type !== 1)
						.map(p => ({
							points: liveData[String(p.element)]?.total_points || 0,
							minutes: liveData[String(p.element)]?.minutes || 0
						}))
						.filter(p => p.minutes > 0)
						.sort((a, b) => a.points - b.points);

					const lowestStarters = outfieldStarters.slice(0, outfieldBenchWhoDidntComeOn.length);
					const lowestStartersTotal = lowestStarters.reduce((sum, p) => sum + p.points, 0);
					benchPoints += Math.max(0, benchOutfieldTotal - lowestStartersTotal);
				}
			}

			gwScores.push({
				managerId: entry.entry_id,
				managerName,
				points: gwHistory.points,
				benchPoints
			});
		}

		if (gwScores.length === 0) continue;

		// Manager of the Week (highest score)
		const sortedByPoints = [...gwScores].sort((a, b) => b.points - a.points);
		const motw = sortedByPoints[0];

		// Bench Blunder (most points left on bench)
		const sortedByBench = [...gwScores].sort((a, b) => b.benchPoints - a.benchPoints);
		const benchBlunder = sortedByBench[0];

		// Closest Call (tightest H2H margin this week)
		const gwMatches = matches.filter(m => m.event === gw && m.finished);
		let closestCall: GameweekAwards['closestCall'] = null;
		let minMargin = Infinity;

		for (const match of gwMatches) {
			const margin = Math.abs(match.league_entry_1_points - match.league_entry_2_points);
			if (margin > 0 && margin < minMargin) {
				minMargin = margin;
				const winner = match.league_entry_1_points > match.league_entry_2_points
					? entries.find(e => e.id === match.league_entry_1)
					: entries.find(e => e.id === match.league_entry_2);
				const loser = match.league_entry_1_points > match.league_entry_2_points
					? entries.find(e => e.id === match.league_entry_2)
					: entries.find(e => e.id === match.league_entry_1);

				if (winner && loser) {
					closestCall = {
						winner: `${winner.player_first_name || ''} ${winner.player_last_name || ''}`.trim(),
						loser: `${loser.player_first_name || ''} ${loser.player_last_name || ''}`.trim(),
						margin
					};
				}
			}
		}

		awards.push({
			gameweek: gw,
			managerOfTheWeek: {
				managerId: motw.managerId,
				managerName: motw.managerName,
				value: motw.points,
				label: `${motw.points} pts`
			},
			benchBlunder: {
				managerId: benchBlunder.managerId,
				managerName: benchBlunder.managerName,
				value: benchBlunder.benchPoints,
				label: `${benchBlunder.benchPoints} pts wasted`
			},
			differentialKing: null, // TODO: Implement if needed
			closestCall
		});
	}

	// Return most recent first
	return awards.sort((a, b) => b.gameweek - a.gameweek);
}

// Calculate luck index for managers using holistic per-player luck calculation
async function calculateLuckIndex(
	entries: DetailedEntry[],
	matches: LeagueDetails['matches'],
	players: Record<number, EnrichedPlayer>,
	leagueEntries: LeagueDetails['league_entries'],
	standings: Standing[],
	fetchFn: typeof fetch,
	baselines: Map<number, PlayerBaseline>,
	liveDataMap: Map<number, Record<string, PlayerGWStats>>
): Promise<{ luck: ManagerLuck[]; fixturesByGw: Map<number, FixtureData[]> }> {
	const entryLookup = new Map(leagueEntries.map(e => [e.id, e]));
	const entryIdToLeagueId = new Map(leagueEntries.map(e => [e.entry_id, e.id]));
	const standingsLookup = new Map(standings.map(s => [s.entry_id, s]));

	// Fetch fixtures for FDR data
	const fixturesRes = await fetchFn('https://fantasy.premierleague.com/api/fixtures/');
	const fixtures: FixtureData[] = await fixturesRes.json();

	// Group fixtures by gameweek
	const fixturesByGw = new Map<number, FixtureData[]>();
	fixtures.forEach(f => {
		if (!fixturesByGw.has(f.event)) fixturesByGw.set(f.event, []);
		fixturesByGw.get(f.event)!.push(f);
	});

	const managerLuck = entries.map(entry => {
		const leagueEntryId = entryIdToLeagueId.get(entry.entry_id!);
		const managerName = `${entry.player_first_name} ${entry.player_last_name}`.trim();
		const managerStanding = standingsLookup.get(entry.entry_id!);

		const managerMatches = matches.filter(m =>
			m.finished && (m.league_entry_1 === leagueEntryId || m.league_entry_2 === leagueEntryId)
		);

		const gameweeksLuck: GameweekLuck[] = entry.recentPicks
			.filter(p => p.data?.picks)
			.map(pick => {
				const startingXI = pick.data!.picks.filter(p => p.position <= 11);
				const autoSubs = pick.data!.subs || [];
				const liveData = liveDataMap.get(pick.gameweek);

				// Build set of players who actually contributed to the score:
				// Starting XI who played + auto-subs who came on
				const playersWhoCameOn = new Set(autoSubs.map(s => s.element_in));
				const playersWhoWentOff = new Set(autoSubs.map(s => s.element_out));

				// Calculate expected using holistic per-player luck system
				let totalExpected = 0;
				let totalLuck = 0;

				if (liveData) {
					// Process starting XI (excluding those who were subbed off with 0 mins)
					for (const playerPick of startingXI) {
						// Skip players who were auto-subbed off (they contributed 0 to actual)
						if (playersWhoWentOff.has(playerPick.element)) continue;

						const stats = liveData[String(playerPick.element)];
						const baseline = baselines.get(playerPick.element);
						const playerInfo = players[playerPick.element];

						if (stats && baseline) {
							const opponentXG = stats.expected_goals_conceded || 1.5;
							const fdr = getPlayerFDR(playerInfo?.team, pick.gameweek, fixturesByGw);

							const playerLuck = calculatePlayerGameweekLuck(
								playerPick.element,
								playerInfo?.web_name || 'Unknown',
								pick.gameweek,
								stats,
								baseline,
								opponentXG,
								fdr
							);

							totalExpected += playerLuck.totalExpectedPoints;
							totalLuck += playerLuck.totalLuck;
						}
					}

					// Process auto-subs who came on (they contributed to actual)
					for (const sub of autoSubs) {
						const stats = liveData[String(sub.element_in)];
						const baseline = baselines.get(sub.element_in);
						const playerInfo = players[sub.element_in];

						if (stats && baseline) {
							const opponentXG = stats.expected_goals_conceded || 1.5;
							const fdr = getPlayerFDR(playerInfo?.team, pick.gameweek, fixturesByGw);

							const playerLuck = calculatePlayerGameweekLuck(
								sub.element_in,
								playerInfo?.web_name || 'Unknown',
								pick.gameweek,
								stats,
								baseline,
								opponentXG,
								fdr
							);

							totalExpected += playerLuck.totalExpectedPoints;
							totalLuck += playerLuck.totalLuck;
						}
					}
				}

				const gwHistory = entry.history.find(h => h.event === pick.gameweek);
				const actual = gwHistory?.points || 0;

				const match = managerMatches.find(m => m.event === pick.gameweek);
				let opponent = 'Unknown';
				let result: 'W' | 'D' | 'L' = 'D';

				if (match) {
					const isEntry1 = match.league_entry_1 === leagueEntryId;
					const opponentId = isEntry1 ? match.league_entry_2 : match.league_entry_1;
					const opponentEntry = entryLookup.get(opponentId);
					opponent = opponentEntry
						? `${opponentEntry.player_first_name} ${opponentEntry.player_last_name}`.trim()
						: 'Unknown';

					const myScore = isEntry1 ? match.league_entry_1_points : match.league_entry_2_points;
					const theirScore = isEntry1 ? match.league_entry_2_points : match.league_entry_1_points;
					result = myScore > theirScore ? 'W' : myScore < theirScore ? 'L' : 'D';
				}

				return {
					gameweek: pick.gameweek,
					actual,
					expected: Math.round(totalExpected * 10) / 10,
					luck: Math.round(totalLuck * 10) / 10,
					opponent,
					result
				};
			})
			.sort((a, b) => b.gameweek - a.gameweek);

		const seasonLuck = gameweeksLuck.reduce((sum, gw) => sum + gw.luck, 0);

		// Points per fixture point earned (lower = more efficient at converting FPL points to wins)
		// Example: 500 FPL pts / 15 fixture pts = 33.3 (needs 33 FPL pts per fixture point)
		let efficiency = 0;
		if (managerStanding && managerStanding.total > 0) {
			efficiency = Math.round((managerStanding.points_for / managerStanding.total) * 10) / 10;
		}

		return {
			managerId: entry.entry_id!,
			managerName,
			gameweeks: gameweeksLuck,
			seasonLuck: Math.round(seasonLuck * 10) / 10,
			centeredLuck: 0, // Calculated after all managers processed
			efficiency
		};
	});

	return { luck: managerLuck, fixturesByGw };
}

// Fun stats calculation - types imported from '$lib/types/fpl'

function calculateFunStats(
	entries: DetailedEntry[],
	liveDataMap: Map<number, Record<string, PlayerGWStats>>,
	matches: Match[],
	players: Record<number, EnrichedPlayer>,
	startGameweek: number,
	baselines: Map<number, PlayerBaseline>,
	fixturesByGw: Map<number, FixtureData[]>
): FunStats {
	const getManagerName = (entry: DetailedEntry) =>
		`${entry.player_first_name || ''} ${entry.player_last_name || ''}`.trim() || 'Unknown';

	// 1. Clinical Finisher (Goals vs xG from actual match data)
	// Uses per-GW xG from Opta - actual chances taken vs scored
	const clinicalFinisher: FunStatEntry[] = entries.map(entry => {
		let totalGoals = 0;
		let totalXG = 0;

		for (const pick of entry.recentPicks) {
			if (!pick.data?.picks) continue;
			const startingXI = pick.data.picks.filter(p => p.position <= 11);
			const liveData = liveDataMap.get(pick.gameweek);
			if (!liveData) continue;

			for (const player of startingXI) {
				const stats = liveData[String(player.element)];
				if (stats) {
					totalGoals += stats.goals_scored;
					totalXG += stats.expected_goals || 0;
				}
			}
		}

		const diff = Math.round((totalGoals - totalXG) * 10) / 10;
		return {
			managerId: entry.entry_id!,
			managerName: getManagerName(entry),
			value: diff,
			label: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} vs xG`
		};
	}).sort((a, b) => b.value - a.value);

	// 2. Assist Luck (Assists vs xA from actual match data)
	// Uses per-GW xA from Opta - actual key passes vs assists
	const assistLuck: FunStatEntry[] = entries.map(entry => {
		let totalAssists = 0;
		let totalXA = 0;

		for (const pick of entry.recentPicks) {
			if (!pick.data?.picks) continue;
			const startingXI = pick.data.picks.filter(p => p.position <= 11);
			const liveData = liveDataMap.get(pick.gameweek);
			if (!liveData) continue;

			for (const player of startingXI) {
				const stats = liveData[String(player.element)];
				if (stats) {
					totalAssists += stats.assists;
					totalXA += stats.expected_assists || 0;
				}
			}
		}

		const diff = Math.round((totalAssists - totalXA) * 10) / 10;
		return {
			managerId: entry.entry_id!,
			managerName: getManagerName(entry),
			value: diff,
			label: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} vs xA`
		};
	}).sort((a, b) => b.value - a.value);

	// 3. Bonus Magnet (Total bonus points + near misses)
	// Near miss = player with BPS >= 20 but got 0 bonus (likely just missed out)
	const bonusMagnet: FunStatEntry[] = entries.map(entry => {
		let totalBonus = 0;
		let nearMisses = 0; // High BPS but no bonus

		for (const pick of entry.recentPicks) {
			if (!pick.data?.picks) continue;
			const startingXI = pick.data.picks.filter(p => p.position <= 11);
			const liveData = liveDataMap.get(pick.gameweek);
			if (!liveData) continue;

			for (const player of startingXI) {
				const stats = liveData[String(player.element)];
				if (stats) {
					totalBonus += stats.bonus;
					// High BPS (20+) but no bonus = near miss (4th place or tied)
					if (stats.bps >= 20 && stats.bonus === 0) {
						nearMisses++;
					}
				}
			}
		}

		return {
			managerId: entry.entry_id!,
			managerName: getManagerName(entry),
			value: totalBonus,
			label: `${totalBonus} pts${nearMisses > 0 ? ` (${nearMisses} near miss${nearMisses > 1 ? 'es' : ''})` : ''}`
		};
	}).sort((a, b) => b.value - a.value);

	// 4. Smash & Grab (Wins when scoring below season average)
	const smashAndGrab: FunStatEntry[] = entries.map(entry => {
		const seasonAvg = entry.history.length > 0
			? entry.history.reduce((sum, h) => sum + h.points, 0) / entry.history.length
			: 0;

		const flukyWins = matches.filter(m => {
			if (!m.finished) return false;
			const isEntry1 = m.league_entry_1 === entry.id;
			const isEntry2 = m.league_entry_2 === entry.id;
			if (!isEntry1 && !isEntry2) return false;

			const myScore = isEntry1 ? m.league_entry_1_points : m.league_entry_2_points;
			const theirScore = isEntry1 ? m.league_entry_2_points : m.league_entry_1_points;
			return myScore > theirScore && myScore < seasonAvg;
		}).length;

		return {
			managerId: entry.entry_id!,
			managerName: getManagerName(entry),
			value: flukyWins,
			label: `${flukyWins} fluky wins`
		};
	}).sort((a, b) => b.value - a.value);

	// 5. Nearly Man (Losses when scoring above season average)
	const nearlyMan: FunStatEntry[] = entries.map(entry => {
		const seasonAvg = entry.history.length > 0
			? entry.history.reduce((sum, h) => sum + h.points, 0) / entry.history.length
			: 0;

		const unluckyLosses = matches.filter(m => {
			if (!m.finished) return false;
			const isEntry1 = m.league_entry_1 === entry.id;
			const isEntry2 = m.league_entry_2 === entry.id;
			if (!isEntry1 && !isEntry2) return false;

			const myScore = isEntry1 ? m.league_entry_1_points : m.league_entry_2_points;
			const theirScore = isEntry1 ? m.league_entry_2_points : m.league_entry_1_points;
			return myScore < theirScore && myScore > seasonAvg;
		}).length;

		return {
			managerId: entry.entry_id!,
			managerName: getManagerName(entry),
			value: unluckyLosses,
			label: `${unluckyLosses} unlucky losses`
		};
	}).sort((a, b) => b.value - a.value);

	// 6. One-Man Army (% of points from top scorer)
	const oneManArmy: FunStatEntry[] = entries.map(entry => {
		const playerPoints: Record<number, number> = {};

		for (const pick of entry.recentPicks) {
			if (!pick.data?.picks) continue;
			const startingXI = pick.data.picks.filter(p => p.position <= 11);
			const liveData = liveDataMap.get(pick.gameweek);
			if (!liveData) continue;

			for (const player of startingXI) {
				const stats = liveData[String(player.element)];
				if (stats) {
					playerPoints[player.element] = (playerPoints[player.element] || 0) + stats.total_points;
				}
			}
		}

		const totalPoints = Object.values(playerPoints).reduce((sum, p) => sum + p, 0);
		const topScorerPoints = Math.max(...Object.values(playerPoints), 0);
		const percentage = totalPoints > 0 ? Math.round((topScorerPoints / totalPoints) * 100) : 0;

		// Find top scorer name
		const topScorerId = Object.entries(playerPoints).find(([_, pts]) => pts === topScorerPoints)?.[0];
		const topScorerName = topScorerId ? players[Number(topScorerId)]?.web_name || 'Unknown' : 'N/A';

		return {
			managerId: entry.entry_id!,
			managerName: getManagerName(entry),
			value: percentage,
			label: `${percentage}% (${topScorerName})`
		};
	}).sort((a, b) => b.value - a.value);

	// 7. Great Wall (Clean sheets vs expected based on opponent xG)
	// Uses Poisson probability: P(CS) = e^(-xGC) for each defender who played 60+ mins
	const greatWall: FunStatEntry[] = entries.map(entry => {
		let totalActualCS = 0;
		let totalExpectedCS = 0;

		for (const pick of entry.recentPicks) {
			if (!pick.data?.picks) continue;
			const liveData = liveDataMap.get(pick.gameweek);
			if (!liveData) continue;

			// Get GK/DEF in starting XI
			const defenders = pick.data.picks.filter(p => {
				const player = players[p.element];
				return p.position <= 11 && player && (player.element_type === 1 || player.element_type === 2);
			});

			// Get opponent xG from any defender who played (it's the same for all)
			let opponentXG = 1.5; // Default
			for (const player of defenders) {
				const stats = liveData[String(player.element)];
				if (stats?.expected_goals_conceded) {
					opponentXG = stats.expected_goals_conceded;
					break;
				}
			}

			// For each defender who played 60+ mins, count CS and calculate expected
			for (const player of defenders) {
				const stats = liveData[String(player.element)];
				if (stats && stats.minutes >= 60) {
					totalActualCS += stats.clean_sheets;
					// P(0 goals) = e^(-opponent_xG) is the probability of a clean sheet
					totalExpectedCS += Math.exp(-opponentXG);
				}
			}
		}

		// Positive = more CS than expected (lucky/good defense)
		// Negative = fewer CS than expected (unlucky/poor defense)
		const diff = Math.round((totalActualCS - totalExpectedCS) * 10) / 10;
		return {
			managerId: entry.entry_id!,
			managerName: getManagerName(entry),
			value: diff,
			label: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} vs expected`
		};
	}).sort((a, b) => b.value - a.value);

	// 8. Auto-Sub Lottery (points gained from players who came off the bench)
	// Positive = lucky bench order, bench players scored when they came on
	// Negative = unlucky, bench players blanked when subbed in
	const autoSubLottery: FunStatEntry[] = entries.map(entry => {
		let autoSubPoints = 0;
		let autoSubCount = 0;

		for (const pick of entry.recentPicks) {
			if (!pick.data?.subs || pick.data.subs.length === 0) continue;
			const liveData = liveDataMap.get(pick.gameweek);
			if (!liveData) continue;

			// Each sub represents a player who came on from the bench
			for (const sub of pick.data.subs) {
				const incomingStats = liveData[String(sub.element_in)];
				if (incomingStats) {
					autoSubPoints += incomingStats.total_points;
					autoSubCount++;
				}
			}
		}

		// Average points per auto-sub, or total if preferred
		const avgPoints = autoSubCount > 0 ? Math.round((autoSubPoints / autoSubCount) * 10) / 10 : 0;
		return {
			managerId: entry.entry_id!,
			managerName: getManagerName(entry),
			value: autoSubPoints,
			label: `${autoSubPoints} pts (${autoSubCount} subs)`
		};
	}).sort((a, b) => b.value - a.value);

	// 9. Consistency (Standard deviation of weekly scores)
	const consistency: FunStatEntry[] = entries.map(entry => {
		const scores = entry.history.map(h => h.points);
		if (scores.length < 2) {
			return {
				managerId: entry.entry_id!,
				managerName: getManagerName(entry),
				value: 0,
				label: 'N/A'
			};
		}

		const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
		const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
		const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

		return {
			managerId: entry.entry_id!,
			managerName: getManagerName(entry),
			value: stdDev,
			label: `±${stdDev} pts`
		};
	}).sort((a, b) => a.value - b.value); // Lower is better (more consistent)

	// 10. Ceiling/Floor (Highest and lowest GW scores)
	const ceilingFloor: FunStatEntry[] = entries.map(entry => {
		const scores = entry.history.map(h => h.points);
		const ceiling = Math.max(...scores, 0);
		const floor = Math.min(...scores, 0);

		return {
			managerId: entry.entry_id!,
			managerName: getManagerName(entry),
			value: ceiling - floor,
			label: `${ceiling} / ${floor}`
		};
	}).sort((a, b) => b.value - a.value);

	// 11. Robbery Report - Find losses where opponent had significant luck or a standout performer
	const robberies: ManagerRobberies[] = entries.map(entry => {
		const managerName = getManagerName(entry);
		const managerRobberies: Robbery[] = [];

		// Find all losses for this manager
		const losses = matches.filter(m => {
			if (!m.finished) return false;
			const isEntry1 = m.league_entry_1 === entry.id;
			const isEntry2 = m.league_entry_2 === entry.id;
			if (!isEntry1 && !isEntry2) return false;

			const myScore = isEntry1 ? m.league_entry_1_points : m.league_entry_2_points;
			const theirScore = isEntry1 ? m.league_entry_2_points : m.league_entry_1_points;
			return myScore < theirScore;
		});

		for (const loss of losses) {
			const isEntry1 = loss.league_entry_1 === entry.id;
			const opponentLeagueId = isEntry1 ? loss.league_entry_2 : loss.league_entry_1;
			const myScore = isEntry1 ? loss.league_entry_1_points : loss.league_entry_2_points;
			const theirScore = isEntry1 ? loss.league_entry_2_points : loss.league_entry_1_points;
			const margin = theirScore - myScore;

			// Find opponent entry
			const opponentEntry = entries.find(e => e.id === opponentLeagueId);
			if (!opponentEntry) continue;

			const opponentName = getManagerName(opponentEntry);

			// Get opponent's picks for this gameweek
			const opponentPicks = opponentEntry.recentPicks.find(p => p.gameweek === loss.event);
			if (!opponentPicks?.data?.picks) continue;

			const liveData = liveDataMap.get(loss.event);
			if (!liveData) continue;

			// Calculate luck for each opponent player using comprehensive system
			const opponentStartingXI = opponentPicks.data.picks.filter(p => p.position <= 11);
			let totalOpponentLuck = 0;
			let biggestOverperformer: RobberyCulprit | null = null;
			let maxLuck = -Infinity;
			let hasHaulPlayer = false; // Player with 12+ points (double-digit haul)

			for (const pick of opponentStartingXI) {
				const stats = liveData[String(pick.element)];
				const playerInfo = players[pick.element];
				const baseline = baselines.get(pick.element);
				if (!stats || !baseline) continue;

				// Use player's expected_goals_conceded as opponent xG
				// Get actual FDR from fixture data
				const opponentXG = stats.expected_goals_conceded || 1.5;
				const fdr = getPlayerFDR(playerInfo?.team, loss.event, fixturesByGw);

				// Calculate comprehensive luck using new system
				const playerLuck = calculatePlayerGameweekLuck(
					pick.element,
					playerInfo?.web_name || 'Unknown',
					loss.event,
					stats,
					baseline,
					opponentXG,
					fdr
				);

				const luckPoints = playerLuck.totalLuck;
				totalOpponentLuck += luckPoints;

				// Check for haul (12+ points is a notable return)
				if (stats.total_points >= 12) {
					hasHaulPlayer = true;
				}

				// Track biggest overperformer (by points or by luck)
				const playerScore = stats.total_points;
				if (luckPoints > maxLuck || (playerScore >= 12 && (!biggestOverperformer || playerScore > biggestOverperformer.actualPoints))) {
					if (luckPoints > 0 || playerScore >= 12) {
						maxLuck = Math.max(luckPoints, maxLuck);
						biggestOverperformer = {
							playerId: pick.element,
							playerName: playerInfo?.web_name || 'Unknown',
							goals: stats.goals_scored,
							assists: stats.assists,
							expectedGoals: Math.round(playerLuck.goals.expected * 100) / 100,
							expectedAssists: Math.round(playerLuck.assists.expected * 100) / 100,
							actualPoints: stats.total_points,
							expectedPoints: Math.round(playerLuck.totalExpectedPoints * 10) / 10,
							luckPoints: Math.round(luckPoints * 10) / 10
						};
					}
				}
			}

			// A robbery is when ONE player significantly overperforming causes the win
			// The culprit's luck alone must exceed the margin of defeat
			const culpritLuck = biggestOverperformer?.luckPoints || 0;
			const isRobbery = biggestOverperformer && culpritLuck >= margin;

			if (isRobbery && biggestOverperformer) {
				// Calculate "real" scoreline without the culprit's overperformance
				const realTheirScore = Math.round((theirScore - culpritLuck) * 10) / 10;

				// Calculate robbery rating based on how much the culprit overperformed
				// relative to the margin (how "stolen" was this win?)
				let robberyRating = 1;
				const culpritRatio = culpritLuck / margin;

				if (culpritRatio >= 3 || culpritLuck >= 15) robberyRating = 5;
				else if (culpritRatio >= 2 || culpritLuck >= 12) robberyRating = 4;
				else if (culpritRatio >= 1.5 || culpritLuck >= 8) robberyRating = 3;
				else if (culpritRatio >= 1) robberyRating = 2;

				managerRobberies.push({
					gameweek: loss.event,
					opponentId: opponentLeagueId,
					opponentName,
					yourScore: myScore,
					theirScore,
					margin,
					theirTotalLuck: Math.round(culpritLuck * 10) / 10, // Now this is the culprit's luck
					realScoreline: { you: myScore, them: realTheirScore },
					culprit: biggestOverperformer,
					robberyRating
				});
			}
		}

		// Sort by robbery rating (most egregious first), then by gameweek
		managerRobberies.sort((a, b) => b.robberyRating - a.robberyRating || b.gameweek - a.gameweek);

		return {
			managerId: entry.entry_id!,
			managerName,
			robberies: managerRobberies,
			totalRobberies: managerRobberies.length,
			totalPointsStolen: managerRobberies.reduce((sum, r) => sum + r.theirTotalLuck, 0)
		};
	}).filter(m => m.totalRobberies > 0)
		.sort((a, b) => b.totalRobberies - a.totalRobberies);

	// 12. Holistic Luck Breakdown by manager (all scoring components)
	const luckBreakdown: import('$lib/types/fpl').ManagerLuckBreakdown[] = entries.map(entry => {
		const managerName = getManagerName(entry);
		const components = {
			appearance: 0,
			goals: 0,
			assists: 0,
			cleanSheets: 0,
			goalsConceded: 0,
			bonus: 0,
			saves: 0,
			rareEvents: 0
		};
		const gameweeks: Array<{ gameweek: number; luck: number }> = [];
		let totalLuck = 0;

		for (const pick of entry.recentPicks) {
			if (!pick.data?.picks) continue;
			const startingXI = pick.data.picks.filter(p => p.position <= 11);
			const autoSubs = pick.data.subs || [];
			const liveData = liveDataMap.get(pick.gameweek);
			if (!liveData) continue;

			// Build set of players who actually contributed to the score
			const playersWhoWentOff = new Set(autoSubs.map(s => s.element_out));

			let gwLuck = 0;

			// Helper function to process a player's luck
			const processPlayerLuck = (playerId: number) => {
				const stats = liveData[String(playerId)];
				const baseline = baselines.get(playerId);
				const playerInfo = players[playerId];
				if (!stats || !baseline) return;

				const opponentXG = stats.expected_goals_conceded || 1.5;
				const fdr = getPlayerFDR(playerInfo?.team, pick.gameweek, fixturesByGw);

				const playerLuck = calculatePlayerGameweekLuck(
					playerId,
					playerInfo?.web_name || 'Unknown',
					pick.gameweek,
					stats,
					baseline,
					opponentXG,
					fdr
				);

				// Aggregate by component
				components.appearance += playerLuck.appearance.points;
				components.goals += playerLuck.goals.points;
				components.assists += playerLuck.assists.points;
				components.cleanSheets += playerLuck.cleanSheet.points;
				components.goalsConceded += playerLuck.goalsConceded.points;
				components.bonus += playerLuck.bonus.points;
				components.saves += playerLuck.saves.points;
				components.rareEvents += playerLuck.yellowCards.points +
					playerLuck.redCards.points +
					playerLuck.ownGoals.points +
					playerLuck.penaltiesMissed.points +
					playerLuck.penaltiesSaved.points;

				gwLuck += playerLuck.totalLuck;
				totalLuck += playerLuck.totalLuck;
			};

			// Process starting XI (excluding those who were subbed off)
			for (const player of startingXI) {
				if (playersWhoWentOff.has(player.element)) continue;
				processPlayerLuck(player.element);
			}

			// Process auto-subs who came on
			for (const sub of autoSubs) {
				processPlayerLuck(sub.element_in);
			}

			gameweeks.push({ gameweek: pick.gameweek, luck: Math.round(gwLuck * 10) / 10 });
		}

		// Round all components
		Object.keys(components).forEach(key => {
			components[key as keyof typeof components] = Math.round(components[key as keyof typeof components] * 10) / 10;
		});

		return {
			managerId: entry.entry_id!,
			managerName,
			totalLuck: Math.round(totalLuck * 10) / 10,
			components,
			gameweeks
		};
	}).sort((a, b) => b.totalLuck - a.totalLuck);

	return {
		clinicalFinisher,
		assistLuck,
		bonusMagnet,
		smashAndGrab,
		nearlyMan,
		oneManArmy,
		greatWall,
		autoSubLottery,
		consistency,
		ceilingFloor,
		robberies,
		luckBreakdown
	};
}

// Generate weekly banter using Gemini API
async function generateWeeklyBanter(
	currentGameweek: number,
	standings: Standing[],
	weeklyAwards: GameweekAwards[],
	matches: Match[],
	funStats: ReturnType<typeof calculateFunStats> | null,
	entries: LeagueDetails['league_entries']
): Promise<WeeklyBanter | null> {
	if (!env.GEMINI_API_KEY) {
		console.warn('GEMINI_API_KEY not set, skipping banter generation');
		return null;
	}

	const currentAwards = weeklyAwards.find(w => w.gameweek === currentGameweek);
	const gwMatches = matches.filter(m => m.event === currentGameweek && m.finished);

	// Build match results summary
	const entryLookup = new Map(entries.map(e => [e.id, e]));
	const matchResults = gwMatches.map(m => {
		const e1 = entryLookup.get(m.league_entry_1);
		const e2 = entryLookup.get(m.league_entry_2);
		const name1 = e1 ? `${e1.player_first_name || ''} ${e1.player_last_name || ''}`.trim() : 'Unknown';
		const name2 = e2 ? `${e2.player_first_name || ''} ${e2.player_last_name || ''}`.trim() : 'Unknown';
		const score1 = m.league_entry_1_points;
		const score2 = m.league_entry_2_points;
		const margin = Math.abs(score1 - score2);
		const winner = score1 > score2 ? name1 : score2 > score1 ? name2 : null;
		return { name1, name2, score1, score2, margin, winner };
	});

	// Get this week's robberies
	const gwRobberies = funStats?.robberies?.flatMap(mr =>
		mr.robberies.filter(r => r.gameweek === currentGameweek).map(r => ({
			victim: mr.managerName,
			culprit: r.opponentName,
			player: r.culprit.playerName,
			luck: Math.round(r.theirTotalLuck),
			rating: r.robberyRating
		}))
	) || [];

	// Build the prompt
	const prompt = `You are the witty commentator for a fantasy football draft league called "Big at the Back". Write a SHORT, punchy recap of Gameweek ${currentGameweek} in 2-4 sentences max.

CONTEXT:
- Current Standings (top 3): ${standings.slice(0, 3).map((s, i) => `${i + 1}. ${s.player_name} (${s.total} pts)`).join(', ')}
- Manager of the Week: ${currentAwards?.managerOfTheWeek.managerName} with ${currentAwards?.managerOfTheWeek.value} points
- Bench Blunder: ${currentAwards?.benchBlunder.managerName} left ${currentAwards?.benchBlunder.value} points on bench
${currentAwards?.closestCall ? `- Closest match: ${currentAwards.closestCall.winner} beat ${currentAwards.closestCall.loser} by just ${currentAwards.closestCall.margin} points` : ''}
${gwRobberies.length > 0 ? `- Robberies: ${gwRobberies.map(r => `${r.culprit} robbed ${r.victim} thanks to ${r.player} (${'⭐'.repeat(r.rating)} robbery)`).join('; ')}` : ''}

MATCH RESULTS:
${matchResults.map(m => `${m.name1} ${m.score1} - ${m.score2} ${m.name2}${m.margin <= 3 ? ' (CLOSE!)' : m.margin >= 30 ? ' (DEMOLITION)' : ''}`).join('\n')}

STYLE: Be playful but brutal. Mock poor decisions. Celebrate fluky wins. Use British football banter. Reference specific managers and scores. Keep it under 300 characters.`;

	try {
		const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + env.GEMINI_API_KEY, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: {
					temperature: 0.9,
					maxOutputTokens: 150
				}
			})
		});

		if (!response.ok) {
			console.error('Gemini API error:', response.status, await response.text());
			return null;
		}

		const data = await response.json();
		const message = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

		if (!message) {
			console.error('No message in Gemini response');
			return null;
		}

		return {
			gameweek: currentGameweek,
			message,
			generatedAt: new Date().toISOString()
		};
	} catch (error) {
		console.error('Error calling Gemini API:', error);
		return null;
	}
}

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch all the data in parallel
		const [bootstrapRes, leagueDetailsRes, transactionsRes] = await Promise.all([
			fetch('https://fantasy.premierleague.com/api/bootstrap-static/'),
			fetch(`https://draft.premierleague.com/api/league/${LEAGUE_ID}/details`),
			fetch(`https://draft.premierleague.com/api/draft/league/${LEAGUE_ID}/transactions`)
		]);

		const bootstrap: Bootstrap = await bootstrapRes.json();
		const leagueDetails: LeagueDetails = await leagueDetailsRes.json();
		const transactionsData = await transactionsRes.json();
		const transactions: Transaction[] = transactionsData.transactions || [];

		// Get current gameweek
		const currentGameweek = bootstrap.events?.find((e) => e.is_current)?.id || 1;
		const startGameweek = leagueDetails.league?.start_event || 1;

		// Build team lookup from bootstrap data
		const teams = bootstrap.teams?.reduce((acc: Record<number, any>, team) => {
			acc[team.id] = team;
			return acc;
		}, {}) || {};

		// Build player lookup
		const players: Record<number, EnrichedPlayer> = bootstrap.elements?.reduce((acc, player) => {
			acc[player.id] = {
				...player,
				team_name: teams[player.team]?.name || 'Unknown',
				position_name: bootstrap.element_types?.find((t) => t.id === player.element_type)?.singular_name || 'Unknown'
			};
			return acc;
		}, {} as Record<number, EnrichedPlayer>) || {};

		// Fetch detailed data for each manager
		const entries = leagueDetails.league_entries.filter((e) => e.entry_id);

		// Fetch live event data for all completed gameweeks (for bench points and fun stats)
		interface PlayerGWStats {
			total_points: number;
			minutes: number;
			goals_scored: number;
			assists: number;
			clean_sheets: number;
			goals_conceded: number;
			bonus: number;
			bps: number;
			expected_goals: number;
			expected_assists: number;
			expected_goal_involvements: number;
			expected_goals_conceded: number;
			// Additional fields for holistic luck calculation
			saves: number;
			yellow_cards: number;
			red_cards: number;
			own_goals: number;
			penalties_saved: number;
			penalties_missed: number;
		}
		const liveDataMap = new Map<number, Record<string, PlayerGWStats>>();
		const completedGameweeks = bootstrap.events?.filter(e => e.finished).map(e => e.id) || [];

		const liveDataPromises = completedGameweeks.map(async (gw) => {
			try {
				const res = await fetch(`https://draft.premierleague.com/api/event/${gw}/live`);
				const data = await res.json();
				// Extract full stats for each player
				const elements: Record<string, PlayerGWStats> = {};
				for (const [id, player] of Object.entries(data.elements || {})) {
					const stats = (player as any).stats || {};
					elements[id] = {
						total_points: stats.total_points || 0,
						minutes: stats.minutes || 0,
						goals_scored: stats.goals_scored || 0,
						assists: stats.assists || 0,
						clean_sheets: stats.clean_sheets || 0,
						goals_conceded: stats.goals_conceded || 0,
						bonus: stats.bonus || 0,
						bps: stats.bps || 0,
						expected_goals: parseFloat(stats.expected_goals) || 0,
						expected_assists: parseFloat(stats.expected_assists) || 0,
						expected_goal_involvements: parseFloat(stats.expected_goal_involvements) || 0,
						expected_goals_conceded: parseFloat(stats.expected_goals_conceded) || 0,
						saves: stats.saves || 0,
						yellow_cards: stats.yellow_cards || 0,
						red_cards: stats.red_cards || 0,
						own_goals: stats.own_goals || 0,
						penalties_saved: stats.penalties_saved || 0,
						penalties_missed: stats.penalties_missed || 0,
					};
				}
				return { gw, elements };
			} catch {
				return { gw, elements: {} };
			}
		});

		const liveDataResults = await Promise.all(liveDataPromises);
		liveDataResults.forEach(({ gw, elements }) => {
			liveDataMap.set(gw, elements);
		});

		// Fetch histories first for standings calculation
		const historiesPromises = entries.map(async (entry) => {
			try {
				const historyRes = await fetch(
					`https://draft.premierleague.com/api/entry/${entry.entry_id}/history`
				);
				const history: EntryHistory = await historyRes.json();
				return { entryId: entry.entry_id!, history };
			} catch (error) {
				console.error(`Error fetching history for entry ${entry.entry_id}:`, error);
				return { entryId: entry.entry_id!, history: null };
			}
		});

		const historiesData = await Promise.all(historiesPromises);
		const historiesMap = new Map<number, EntryHistory>();
		historiesData.forEach(({ entryId, history }) => {
			if (history) historiesMap.set(entryId, history);
		});

		// Calculate standings
		const standings = buildStandings(leagueDetails, historiesMap);

		// Fetch detailed picks data
		const detailedEntries: DetailedEntry[] = await Promise.all(
			entries.map(async (entry) => {
				try {
					const history = historiesMap.get(entry.entry_id!);

					// Fetch team picks for ALL completed gameweeks + current gameweek (for bench points and squad viewer)
					const gameweeksToFetch = [...new Set([
						...completedGameweeks.filter(gw => gw >= startGameweek),
						currentGameweek // Include current GW even if not finished, so squad viewer works
					])].sort((a, b) => a - b);
					const picksPromises = gameweeksToFetch.map(gw =>
						fetch(`https://draft.premierleague.com/api/entry/${entry.entry_id}/event/${gw}`)
							.then((r) => r.json())
							.then((data: EntryEventPicks) => ({ gameweek: gw, data }))
							.catch(() => ({ gameweek: gw, data: null }))
					);

					const picks = await Promise.all(picksPromises);

					// Calculate stats
					const historyArray = history?.history || [];
					const recent5 = historyArray.slice(-5);

					// Function to calculate optimal starting XI points from a squad
					// Assumes best possible team selection (1 GK, 3-5 DEF, 2-5 MID, 1-3 FWD)
					function calculateOptimalPoints(squadPlayerIds: number[], liveData: Record<string, any>): number {
						if (squadPlayerIds.length === 0) return 0;

						// Get player data with points for this GW
						const squadWithStats = squadPlayerIds.map(playerId => {
							const playerInfo = players[playerId];
							const playerLive = liveData[String(playerId)];
							return {
								id: playerId,
								type: playerInfo?.element_type || 0, // 1=GK, 2=DEF, 3=MID, 4=FWD
								points: playerLive?.total_points || 0,
								minutes: playerLive?.minutes || 0
							};
						}).filter(p => p.minutes > 0); // Only players who played

						// Separate by position
						const gks = squadWithStats.filter(p => p.type === 1).sort((a, b) => b.points - a.points);
						const defs = squadWithStats.filter(p => p.type === 2).sort((a, b) => b.points - a.points);
						const mids = squadWithStats.filter(p => p.type === 3).sort((a, b) => b.points - a.points);
						const fwds = squadWithStats.filter(p => p.type === 4).sort((a, b) => b.points - a.points);

						// Must have 1 GK
						const selectedGK = gks[0];
						if (!selectedGK) return 0; // No GK played

						// Find optimal formation (3-5 DEF, 2-5 MID, 1-3 FWD, total outfield = 10)
						// Try all valid formations and pick the one with max points
						let maxPoints = 0;
						const formations = [
							[3, 5, 2], [3, 4, 3], [4, 4, 2], [4, 3, 3], [5, 4, 1], [5, 3, 2], [4, 5, 1], [3, 6, 1]
						]; // [DEF, MID, FWD] - note 3-6-1 is invalid but we'll filter

						for (const [numDef, numMid, numFwd] of formations) {
							// Check if we have enough players for this formation
							if (defs.length < numDef || mids.length < numMid || fwds.length < numFwd) continue;
							// Validate formation rules
							if (numDef < 3 || numDef > 5) continue;
							if (numMid < 2 || numMid > 5) continue;
							if (numFwd < 1 || numFwd > 3) continue;
							if (numDef + numMid + numFwd !== 10) continue;

							const formationPoints = selectedGK.points +
								defs.slice(0, numDef).reduce((sum, p) => sum + p.points, 0) +
								mids.slice(0, numMid).reduce((sum, p) => sum + p.points, 0) +
								fwds.slice(0, numFwd).reduce((sum, p) => sum + p.points, 0);

							maxPoints = Math.max(maxPoints, formationPoints);
						}

						return maxPoints;
					}

					// Get GW1 squad (all 15 players)
					const gw1PicksData = picks.find(p => p.gameweek === startGameweek)?.data?.picks || [];
					const gw1Squad = new Set(gw1PicksData.map(p => p.element));

					// Get manager's transfers to track squad evolution
					const managerTransactions = transactions.filter(
						t => t.entry === entry.entry_id && t.result === 'a'
					).sort((a, b) => a.event - b.event);

					// Calculate points from picks + live data for each gameweek
					const pointsByGameweek = picks.map((pick) => {
						if (!pick.data?.picks) return {
							gameweek: pick.gameweek,
							benchPoints: 0,
							benchPlayers: 0,
							squadPoints: { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0 },
							gw1SquadPoints: 0
						};

						// Get live data for this gameweek
						const liveData = liveDataMap.get(pick.gameweek) || {};

						// Separate starting XI and bench
						const startingXI = pick.data.picks.filter((p) => p.position <= 11);
						const benchPicks = pick.data.picks.filter((p) => p.position > 11);

						// Get auto-subs that happened this gameweek
						const autoSubs = pick.data.subs || [];
						const playersWhoCameOn = new Set(autoSubs.map(s => s.element_in));

						// Calculate WASTED bench points
						// Waste = how many more points you'd have if you started bench over worst starters
						let benchPoints = 0;

						// Separate bench into GK and outfield
						const benchGK = benchPicks.find(p => players[p.element]?.element_type === 1);
						const benchOutfield = benchPicks.filter(p => players[p.element]?.element_type !== 1);

						// GK waste: bench GK points - starting GK points (if positive and GK played)
						if (benchGK && !playersWhoCameOn.has(benchGK.element)) {
							const benchGKPoints = liveData[String(benchGK.element)]?.total_points || 0;
							const startingGK = startingXI.find(p => players[p.element]?.element_type === 1);
							if (startingGK) {
								const startingGKLive = liveData[String(startingGK.element)];
								const startingGKMinutes = startingGKLive?.minutes || 0;
								const startingGKPoints = startingGKLive?.total_points || 0;
								// Only count as waste if starting GK played
								if (startingGKMinutes > 0) {
									benchPoints += Math.max(0, benchGKPoints - startingGKPoints);
								}
							}
						}

						// Outfield waste: bench outfield total - lowest N starters total
						const outfieldBenchWhoDidntComeOn = benchOutfield.filter(p => !playersWhoCameOn.has(p.element));
						if (outfieldBenchWhoDidntComeOn.length > 0) {
							// Sum bench outfield points
							const benchOutfieldTotal = outfieldBenchWhoDidntComeOn.reduce((sum, p) => {
								return sum + (liveData[String(p.element)]?.total_points || 0);
							}, 0);

							// Get outfield starters who played, sorted by points ascending
							const outfieldStarters = startingXI
								.filter(p => players[p.element]?.element_type !== 1)
								.map(p => ({
									element: p.element,
									points: liveData[String(p.element)]?.total_points || 0,
									minutes: liveData[String(p.element)]?.minutes || 0
								}))
								.filter(p => p.minutes > 0) // Only those who played
								.sort((a, b) => a.points - b.points);

							// Take the N lowest-scoring starters (N = number of bench outfield who didn't come on)
							const lowestStarters = outfieldStarters.slice(0, outfieldBenchWhoDidntComeOn.length);
							const lowestStartersTotal = lowestStarters.reduce((sum, p) => sum + p.points, 0);

							// Waste is the difference (if positive)
							benchPoints += Math.max(0, benchOutfieldTotal - lowestStartersTotal);
						}

						// Calculate squad points by position (for starting XI only)
						const squadPoints = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0 };
						startingXI.forEach((starter) => {
							const playerLive = liveData[String(starter.element)];
							const playerInfo = players[starter.element];
							const points = playerLive?.total_points || 0;
							const position = playerInfo?.position_name as keyof typeof squadPoints;
							if (position && squadPoints.hasOwnProperty(position)) {
								squadPoints[position] += points;
							}
						});

						return {
							gameweek: pick.gameweek,
							benchPoints,
							benchPlayers: benchPicks.length,
							squadPoints
						};
					});

					// Aggregate bench points
					const benchPointsByGameweek = pointsByGameweek.map(({ gameweek, benchPoints, benchPlayers }) => ({
						gameweek, benchPoints, benchPlayers
					}));

					// Aggregate squad strength by position across all gameweeks
					const squadStrength = {
						Goalkeeper: pointsByGameweek.reduce((sum, gw) => sum + gw.squadPoints.Goalkeeper, 0),
						Defender: pointsByGameweek.reduce((sum, gw) => sum + gw.squadPoints.Defender, 0),
						Midfielder: pointsByGameweek.reduce((sum, gw) => sum + gw.squadPoints.Midfielder, 0),
						Forward: pointsByGameweek.reduce((sum, gw) => sum + gw.squadPoints.Forward, 0)
					};
					const totalSquadPoints = Object.values(squadStrength).reduce((a, b) => a + b, 0);

					// Calculate transfer value using optimal play assumption
					// Track actual squad week by week, applying transfers
					let currentSquad = new Set(gw1Squad); // Start with GW1 squad
					let gw1SquadTotal = 0;
					let actualOptimalTotal = 0;

					// Sort gameweeks for proper transfer application
					const sortedGameweeks = [...completedGameweeks].filter(gw => gw >= startGameweek).sort((a, b) => a - b);

					for (const gw of sortedGameweeks) {
						const liveData = liveDataMap.get(gw);
						if (!liveData) continue;

						// Apply any transfers that happened this gameweek to current squad
						const gwTransfers = managerTransactions.filter(t => t.event === gw);
						for (const transfer of gwTransfers) {
							currentSquad.delete(transfer.element_out);
							currentSquad.add(transfer.element_in);
						}

						// Calculate optimal points for both squads this GW
						const gw1Optimal = calculateOptimalPoints(Array.from(gw1Squad), liveData);
						const actualOptimal = calculateOptimalPoints(Array.from(currentSquad), liveData);

						gw1SquadTotal += gw1Optimal;
						actualOptimalTotal += actualOptimal;
					}

					const transferValue = actualOptimalTotal - gw1SquadTotal;

					// Calculate individual transfer impact (using optimal play)
					const transferAnalyses: TransferAnalysis[] = managerTransactions.map(t => {
						const playerIn = players[t.element_in];
						const playerOut = players[t.element_out];

						// Find when player_in was next traded away
						const nextTradeOut = managerTransactions.find(
							other => other.element_out === t.element_in && other.event > t.event
						);
						const gainedUntilGw = nextTradeOut ? nextTradeOut.event : Infinity;

						// Find when player_out was traded back in
						const nextTradeIn = managerTransactions.find(
							other => other.element_in === t.element_out && other.event > t.event
						);
						const lostUntilGw = nextTradeIn ? nextTradeIn.event : Infinity;

						let pointsGained = 0;
						let pointsLost = 0;

						// For individual transfers, count all points (not just optimal XI)
						// This shows the raw player performance comparison
						for (const gw of completedGameweeks) {
							if (gw >= t.event) {
								const liveData = liveDataMap.get(gw);
								if (liveData) {
									if (gw < gainedUntilGw) {
										pointsGained += liveData[String(t.element_in)]?.total_points || 0;
									}
									if (gw < lostUntilGw) {
										pointsLost += liveData[String(t.element_out)]?.total_points || 0;
									}
								}
							}
						}

						return {
							playerIn: {
								id: t.element_in,
								name: playerIn?.web_name || 'Unknown',
								position: playerIn?.position_name || 'Unknown',
								team: playerIn?.team_name || 'Unknown'
							},
							playerOut: {
								id: t.element_out,
								name: playerOut?.web_name || 'Unknown',
								position: playerOut?.position_name || 'Unknown',
								team: playerOut?.team_name || 'Unknown'
							},
							gameweek: t.event,
							pointsGained,
							pointsLost,
							netImpact: pointsGained - pointsLost
						};
					}).sort((a, b) => b.netImpact - a.netImpact); // Sort best first

					// Get all picks for display (sorted by gameweek descending)
					const recentPicks = picks
						.filter((p) => p.data !== null)
						.sort((a, b) => b.gameweek - a.gameweek);

					return {
						...entry,
						history: historyArray,
						recentPicks,
						stats: {
							form: recent5.map((h) => h.points),
							averagePoints: historyArray.length > 0
								? historyArray.reduce((sum, h) => sum + h.points, 0) / historyArray.length
								: 0,
							totalBenchPoints: benchPointsByGameweek.reduce((sum, b) => sum + b.benchPoints, 0),
							benchPointsByGameweek,
							squadStrength,
							totalSquadPoints,
							transferValue,
							gw1SquadTotal,
							transfers: transferAnalyses
						}
					};
				} catch (error) {
					console.error(`Error fetching data for entry ${entry.entry_id}:`, error);
					return {
						...entry,
						history: [],
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
					};
				}
			})
		);

		// Build player baselines for luck calculations (needed by multiple functions)
		const playerBaselines = buildPlayerBaselines(players);

		// Calculate H2H data
		const h2hMatrix = buildH2HMatrix(leagueDetails.matches, leagueDetails.league_entries);
		const h2hFixtures = processFixtures(leagueDetails.matches, leagueDetails.league_entries);
		const h2hStats = calculateRivalryStats(h2hFixtures);
		const { luck: h2hLuckRaw, fixturesByGw } = await calculateLuckIndex(
			detailedEntries,
			leagueDetails.matches,
			players,
			leagueDetails.league_entries,
			standings,
			fetch,
			playerBaselines,
			liveDataMap
		);

		// Calculate centered luck (relative to league average)
		const avgLuck = h2hLuckRaw.reduce((sum, m) => sum + m.seasonLuck, 0) / h2hLuckRaw.length;
		const h2hLuck = h2hLuckRaw.map(m => ({
			...m,
			centeredLuck: Math.round((m.seasonLuck - avgLuck) * 10) / 10
		}));

		// Calculate nemesis/bunny and streaks
		const nemesisBunny = calculateNemesisBunny(h2hMatrix, leagueDetails.league_entries);
		const streaks = calculateStreaks(leagueDetails.matches, leagueDetails.league_entries);

		// Calculate weekly awards
		const weeklyAwards = calculateWeeklyAwards(
			detailedEntries,
			leagueDetails.matches,
			liveDataMap,
			completedGameweeks,
			players
		);

		// Calculate "would have beat" data
		const wouldHaveBeat = calculateWouldHaveBeat(
			detailedEntries,
			leagueDetails.matches,
			completedGameweeks
		);

		// Calculate fixture luck (schedule favorability + opponent variance)
		const fixtureLuck = calculateFixtureLuck(
			detailedEntries,
			leagueDetails.matches,
			completedGameweeks,
			liveDataMap,
			playerBaselines,
			players,
			fixturesByGw
		);

		// Calculate fun stats (includes robberies)
		const funStats = calculateFunStats(
			detailedEntries,
			liveDataMap,
			leagueDetails.matches,
			players,
			startGameweek,
			playerBaselines,
			fixturesByGw
		);

		// Calculate loss analysis (categorized breakdown of why losses happened)
		const lossAnalysis = calculateLossAnalysis(
			detailedEntries,
			leagueDetails.matches,
			completedGameweeks,
			liveDataMap,
			playerBaselines,
			players,
			fixturesByGw,
			funStats.robberies
		);

		// Calculate holistic luck (performance + schedule + outcome luck from loss analysis)
		const holisticLuck = calculateHolisticLuck(h2hLuck, fixtureLuck, lossAnalysis);

		// Generate weekly banter using Gemini
		const weeklyBanter = await generateWeeklyBanter(
			currentGameweek,
			standings,
			weeklyAwards,
			leagueDetails.matches,
			funStats,
			leagueDetails.league_entries
		);

		return {
			league: {
				id: LEAGUE_ID,
				name: leagueDetails.league?.name,
				scoring: leagueDetails.league?.scoring,
				start_event: startGameweek,
				entries: detailedEntries
			},
			standings,
			currentGameweek,
			startGameweek,
			teams,
			players,
			positions: bootstrap.element_types || [],
			fixtures: bootstrap.events || [],
			h2h: {
				matrix: h2hMatrix,
				fixtures: h2hFixtures,
				luck: h2hLuck,
				stats: h2hStats,
				nemesisBunny,
				streaks,
				wouldHaveBeat,
				fixtureLuck,
				holisticLuck,
				lossAnalysis
			},
			funStats,
			weeklyAwards,
			weeklyBanter
		};
	} catch (error) {
		console.error('Error loading page data:', error);
		throw error;
	}
};
