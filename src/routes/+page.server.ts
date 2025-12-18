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
	MatchResult,
	ManagerLuck,
	RivalryStats,
	GameweekLuck,
	Transaction,
	TransferAnalysis
} from '$lib/types/fpl';

const LEAGUE_ID = 21959;

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

// Helper to get manager name safely (defined before buildH2HMatrix uses it)
function getManagerNameFromEntry(entry: LeagueDetails['league_entries'][0]): string {
	if (!entry.player_first_name && !entry.player_last_name) return 'AVERAGE';
	return `${entry.player_first_name || ''} ${entry.player_last_name || ''}`.trim() || 'Unknown';
}

// Build H2H matrix from matches
function buildH2HMatrix(
	matches: LeagueDetails['matches'],
	entries: LeagueDetails['league_entries']
): H2HRecord[] {
	const entryLookup = new Map(entries.map(e => [e.id, e]));
	const matrix = new Map<string, H2HRecord>();

	matches.filter(m => m.finished).forEach(match => {
		const entry1 = entryLookup.get(match.league_entry_1);
		const entry2 = entryLookup.get(match.league_entry_2);
		if (!entry1 || !entry2) return;

		// Create key for this matchup (always smaller id first for consistency)
		const key = `${Math.min(match.league_entry_1, match.league_entry_2)}-${Math.max(match.league_entry_1, match.league_entry_2)}`;

		if (!matrix.has(key)) {
			const isEntry1First = match.league_entry_1 < match.league_entry_2;
			matrix.set(key, {
				manager1Id: isEntry1First ? match.league_entry_1 : match.league_entry_2,
				manager2Id: isEntry1First ? match.league_entry_2 : match.league_entry_1,
				manager1Name: isEntry1First
					? getManagerNameFromEntry(entry1)
					: getManagerNameFromEntry(entry2),
				manager2Name: isEntry1First
					? getManagerNameFromEntry(entry2)
					: getManagerNameFromEntry(entry1),
				wins: 0,
				draws: 0,
				losses: 0,
				pointsFor: 0,
				pointsAgainst: 0
			});
		}

		const record = matrix.get(key)!;
		const isManager1Entry1 = record.manager1Id === match.league_entry_1;

		if (isManager1Entry1) {
			record.pointsFor += match.league_entry_1_points;
			record.pointsAgainst += match.league_entry_2_points;
			if (match.league_entry_1_points > match.league_entry_2_points) record.wins++;
			else if (match.league_entry_1_points < match.league_entry_2_points) record.losses++;
			else record.draws++;
		} else {
			record.pointsFor += match.league_entry_2_points;
			record.pointsAgainst += match.league_entry_1_points;
			if (match.league_entry_2_points > match.league_entry_1_points) record.wins++;
			else if (match.league_entry_2_points < match.league_entry_1_points) record.losses++;
			else record.draws++;
		}
	});

	return Array.from(matrix.values());
}

// Process fixtures into match results
function processFixtures(
	matches: LeagueDetails['matches'],
	entries: LeagueDetails['league_entries']
): MatchResult[] {
	const entryLookup = new Map(entries.map(e => [e.id, e]));

	return matches
		.filter(m => m.finished)
		.map(match => {
			const entry1 = entryLookup.get(match.league_entry_1);
			const entry2 = entryLookup.get(match.league_entry_2);

			return {
				gameweek: match.event,
				manager1: {
					id: match.league_entry_1,
					name: entry1 ? getManagerNameFromEntry(entry1) : 'Unknown',
					score: match.league_entry_1_points
				},
				manager2: {
					id: match.league_entry_2,
					name: entry2 ? getManagerNameFromEntry(entry2) : 'Unknown',
					score: match.league_entry_2_points
				},
				winner: match.winning_league_entry,
				margin: Math.abs(match.league_entry_1_points - match.league_entry_2_points)
			};
		})
		.sort((a, b) => b.gameweek - a.gameweek);
}

// Calculate rivalry stats
function calculateRivalryStats(fixtures: MatchResult[]): RivalryStats {
	let biggestWin: RivalryStats['biggestWin'] = null;
	let closestGame: RivalryStats['closestGame'] = null;

	fixtures.forEach(match => {
		// Biggest win (non-draw)
		if (match.margin > 0) {
			if (!biggestWin || match.margin > biggestWin.margin) {
				const winner = match.manager1.score > match.manager2.score ? match.manager1 : match.manager2;
				const loser = match.manager1.score > match.manager2.score ? match.manager2 : match.manager1;
				biggestWin = {
					winner: winner.name,
					loser: loser.name,
					score: `${winner.score}-${loser.score}`,
					margin: match.margin,
					gameweek: match.gameweek
				};
			}

			// Closest game (non-draw)
			if (!closestGame || match.margin < closestGame.margin) {
				closestGame = {
					manager1: match.manager1.name,
					manager2: match.manager2.name,
					score: `${match.manager1.score}-${match.manager2.score}`,
					margin: match.margin,
					gameweek: match.gameweek
				};
			}
		}
	});

	return { biggestWin, closestGame };
}

// Player history from element-summary API
interface PlayerGameweekHistory {
	round: number;
	total_points: number;
	opponent_team: number;
	was_home: boolean;
}

interface PlayerHistoryData {
	history: PlayerGameweekHistory[];
}

// Fixture with difficulty ratings
interface FixtureData {
	id: number;
	event: number;
	team_h: number;
	team_a: number;
	team_h_difficulty: number;
	team_a_difficulty: number;
}

// Calculate simple mean of values
function calculateMean(values: number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Get FDR multiplier for fixture difficulty (1-5 scale)
function getFDRMultiplier(fdr: number): number {
	const multipliers: Record<number, number> = {
		1: 1.15,  // Easiest - expect 15% more points
		2: 1.08,  // Easy - expect 8% more
		3: 1.00,  // Average - neutral
		4: 0.93,  // Hard - expect 7% less
		5: 0.85   // Hardest - expect 15% less
	};
	return multipliers[fdr] || 1.0;
}

// Fetch player histories for all players in squads
async function fetchPlayerHistories(
	playerIds: number[],
	fetchFn: typeof fetch
): Promise<Map<number, PlayerGameweekHistory[]>> {
	const historyMap = new Map<number, PlayerGameweekHistory[]>();

	// Fetch in batches to avoid overwhelming the API
	const batchSize = 10;
	for (let i = 0; i < playerIds.length; i += batchSize) {
		const batch = playerIds.slice(i, i + batchSize);
		const results = await Promise.all(
			batch.map(async (playerId) => {
				try {
					const res = await fetchFn(`https://fantasy.premierleague.com/api/element-summary/${playerId}/`);
					const data: PlayerHistoryData = await res.json();
					return { playerId, history: data.history || [] };
				} catch (e) {
					console.error(`Error fetching history for player ${playerId}:`, e);
					return { playerId, history: [] };
				}
			})
		);
		results.forEach(({ playerId, history }) => {
			historyMap.set(playerId, history);
		});
	}

	return historyMap;
}

// Calculate expected score using mean and fixture difficulty
function calculateExpectedScore(
	startingXI: { element: number }[],
	gameweek: number,
	playerHistories: Map<number, PlayerGameweekHistory[]>,
	fixturesByGw: Map<number, FixtureData[]>,
	players: Record<number, EnrichedPlayer>
): number {
	const gwFixtures = fixturesByGw.get(gameweek) || [];
	const LOOKBACK_GAMEWEEKS = 10;

	return startingXI.reduce((sum, pick) => {
		const history = playerHistories.get(pick.element) || [];
		const player = players[pick.element];

		if (history.length === 0) {
			// Fallback to PPG if no history
			return sum + (player ? parseFloat(player.points_per_game) || 0 : 0);
		}

		// Get points from gameweeks before this one (to calculate expected)
		// Limit to last 10 gameweeks
		const priorGwPoints = history
			.filter(h => h.round < gameweek)
			.slice(-LOOKBACK_GAMEWEEKS)
			.map(h => h.total_points);

		if (priorGwPoints.length === 0) {
			return sum + (player ? parseFloat(player.points_per_game) || 0 : 0);
		}

		// Calculate mean of prior gameweek points
		const meanPoints = calculateMean(priorGwPoints);

		// Find fixture difficulty for this player's team this gameweek
		const playerTeam = player?.team;
		const fixture = gwFixtures.find(f => f.team_h === playerTeam || f.team_a === playerTeam);

		if (fixture) {
			const isHome = fixture.team_h === playerTeam;
			const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;

			// Apply FDR multiplier based on fixture difficulty
			const difficultyMultiplier = getFDRMultiplier(difficulty);
			return sum + meanPoints * difficultyMultiplier;
		}

		return sum + meanPoints;
	}, 0);
}

// Calculate luck index for managers
async function calculateLuckIndex(
	entries: DetailedEntry[],
	matches: LeagueDetails['matches'],
	players: Record<number, EnrichedPlayer>,
	leagueEntries: LeagueDetails['league_entries'],
	standings: Standing[],
	fetchFn: typeof fetch
): Promise<ManagerLuck[]> {
	const entryLookup = new Map(leagueEntries.map(e => [e.id, e]));
	const entryIdToLeagueId = new Map(leagueEntries.map(e => [e.entry_id, e.id]));
	const standingsLookup = new Map(standings.map(s => [s.entry_id, s]));

	// Collect all unique player IDs from picks
	const playerIds = new Set<number>();
	entries.forEach(entry => {
		entry.recentPicks.forEach(pick => {
			pick.data?.picks?.forEach(p => playerIds.add(p.element));
		});
	});

	// Fetch player histories and fixtures in parallel
	const [playerHistories, fixturesRes] = await Promise.all([
		fetchPlayerHistories(Array.from(playerIds), fetchFn),
		fetchFn('https://fantasy.premierleague.com/api/fixtures/')
	]);

	const fixtures: FixtureData[] = await fixturesRes.json();

	// Group fixtures by gameweek
	const fixturesByGw = new Map<number, FixtureData[]>();
	fixtures.forEach(f => {
		if (!fixturesByGw.has(f.event)) fixturesByGw.set(f.event, []);
		fixturesByGw.get(f.event)!.push(f);
	});

	return entries.map(entry => {
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

				// Calculate expected using median + fixture difficulty
				const expected = calculateExpectedScore(
					startingXI,
					pick.gameweek,
					playerHistories,
					fixturesByGw,
					players
				);

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
					expected: Math.round(expected * 10) / 10,
					luck: Math.round((actual - expected) * 10) / 10,
					opponent,
					result
				};
			})
			.sort((a, b) => b.gameweek - a.gameweek);

		const seasonLuck = gameweeksLuck.reduce((sum, gw) => sum + gw.luck, 0);

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

		// Fetch live event data for all completed gameweeks (for bench points calculation)
		const liveDataMap = new Map<number, Record<string, { total_points: number }>>();
		const completedGameweeks = bootstrap.events?.filter(e => e.finished).map(e => e.id) || [];

		const liveDataPromises = completedGameweeks.map(async (gw) => {
			try {
				const res = await fetch(`https://draft.premierleague.com/api/event/${gw}/live`);
				const data = await res.json();
				return { gw, elements: data.elements || {} };
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

					// Fetch team picks for ALL completed gameweeks (for bench points calculation)
					const gameweeksToFetch = completedGameweeks.filter(gw => gw >= startGameweek);
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

					// Get GW1 (startGameweek) picks for "what if no transfers" calculation
					const gw1Picks = picks.find(p => p.gameweek === startGameweek)?.data?.picks || [];

					// Function to simulate auto-subs and calculate points for a squad in a given GW
					function simulateSquadPoints(squadPicks: Pick[], liveData: Record<string, any>): number {
						if (squadPicks.length === 0) return 0;

						const startingXI = squadPicks.filter(p => p.position <= 11).sort((a, b) => a.position - b.position);
						const bench = squadPicks.filter(p => p.position > 11).sort((a, b) => a.position - b.position);

						// Track which positions are filled and their points
						const squad: { element: number; points: number; minutes: number; position: number; playerType: number }[] = [];

						// Add starting XI players
						for (const pick of startingXI) {
							const playerLive = liveData[String(pick.element)];
							const playerInfo = players[pick.element];
							const minutes = playerLive?.stats?.minutes || 0;
							const points = playerLive?.stats?.total_points || 0;
							squad.push({
								element: pick.element,
								points,
								minutes,
								position: pick.position,
								playerType: playerInfo?.element_type || 0
							});
						}

						// Count current formation
						const getFormation = () => {
							const playing = squad.filter(p => p.minutes > 0);
							return {
								gk: playing.filter(p => p.playerType === 1).length,
								def: playing.filter(p => p.playerType === 2).length,
								mid: playing.filter(p => p.playerType === 3).length,
								fwd: playing.filter(p => p.playerType === 4).length
							};
						};

						// Try auto-subs for players with 0 minutes
						for (let i = 0; i < squad.length; i++) {
							if (squad[i].minutes === 0) {
								// Find a valid sub
								for (const sub of bench) {
									const subLive = liveData[String(sub.element)];
									const subInfo = players[sub.element];
									const subMinutes = subLive?.stats?.minutes || 0;

									if (subMinutes === 0) continue; // Sub didn't play

									// Check if already used this sub
									if (squad.some(s => s.element === sub.element)) continue;

									// Check formation validity
									const formation = getFormation();
									const subType = subInfo?.element_type || 0;
									const outType = squad[i].playerType;

									// Minimum formation: 1 GK, 3 DEF, 2 MID, 1 FWD
									let valid = true;
									if (outType === 1 && subType !== 1) valid = false; // GK can only be replaced by GK
									if (outType === 2 && formation.def <= 3 && subType !== 2) valid = false;
									if (outType === 3 && formation.mid <= 2 && subType !== 3) valid = false;
									if (outType === 4 && formation.fwd <= 1 && subType !== 4) valid = false;

									if (valid) {
										squad[i] = {
											element: sub.element,
											points: subLive?.stats?.total_points || 0,
											minutes: subMinutes,
											position: squad[i].position,
											playerType: subType
										};
										break;
									}
								}
							}
						}

						// Sum points for players who played (or their subs)
						return squad.reduce((sum, p) => sum + (p.minutes > 0 ? p.points : 0), 0);
					}

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

						// Sum up bench player points
						const benchPoints = benchPicks.reduce((sum, benchPlayer) => {
							const playerLive = liveData[String(benchPlayer.element)];
							return sum + (playerLive?.stats?.total_points || 0);
						}, 0);

						// Calculate squad points by position (for starting XI only)
						const squadPoints = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0 };
						startingXI.forEach((starter) => {
							const playerLive = liveData[String(starter.element)];
							const playerInfo = players[starter.element];
							const points = playerLive?.stats?.total_points || 0;
							const position = playerInfo?.position_name as keyof typeof squadPoints;
							if (position && squadPoints.hasOwnProperty(position)) {
								squadPoints[position] += points;
							}
						});

						// Calculate what GW1 squad would have scored this week (with auto-subs)
						const gw1SquadPoints = simulateSquadPoints(gw1Picks, liveData);

						return {
							gameweek: pick.gameweek,
							benchPoints,
							benchPlayers: benchPicks.length,
							squadPoints,
							gw1SquadPoints
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

					// Calculate transfer value: actual points vs what GW1 squad would have scored
					const actualTotal = historyArray.reduce((sum, h) => sum + h.points, 0);
					const gw1SquadTotal = pointsByGameweek.reduce((sum, gw) => sum + gw.gw1SquadPoints, 0);
					const transferValue = actualTotal - gw1SquadTotal;

					// Calculate individual transfer impact
					const managerTransactions = transactions.filter(
						t => t.entry === entry.entry_id && t.result === 'a'
					);

					const transferAnalyses: TransferAnalysis[] = managerTransactions.map(t => {
						const playerIn = players[t.element_in];
						const playerOut = players[t.element_out];

						// Find when player_in was next traded away (to avoid double-counting)
						const nextTradeOut = managerTransactions.find(
							other => other.element_out === t.element_in && other.event > t.event
						);
						const gainedUntilGw = nextTradeOut ? nextTradeOut.event : Infinity;

						// Find when player_out was traded back in (to avoid double-counting)
						const nextTradeIn = managerTransactions.find(
							other => other.element_in === t.element_out && other.event > t.event
						);
						const lostUntilGw = nextTradeIn ? nextTradeIn.event : Infinity;

						let pointsGained = 0;
						let pointsLost = 0;

						for (const gw of completedGameweeks) {
							if (gw >= t.event) {
								const liveData = liveDataMap.get(gw);
								if (liveData) {
									// Only count gained points while player was on the team
									if (gw < gainedUntilGw) {
										pointsGained += liveData[String(t.element_in)]?.stats?.total_points || 0;
									}
									// Only count lost points until player was re-acquired
									if (gw < lostUntilGw) {
										pointsLost += liveData[String(t.element_out)]?.stats?.total_points || 0;
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

					// Get only recent 5 picks for display
					const recentPicks = picks
						.filter((p) => p.data !== null)
						.sort((a, b) => b.gameweek - a.gameweek)
						.slice(0, 5);

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

		// Calculate H2H data
		const h2hMatrix = buildH2HMatrix(leagueDetails.matches, leagueDetails.league_entries);
		const h2hFixtures = processFixtures(leagueDetails.matches, leagueDetails.league_entries);
		const h2hStats = calculateRivalryStats(h2hFixtures);
		const h2hLuckRaw = await calculateLuckIndex(detailedEntries, leagueDetails.matches, players, leagueDetails.league_entries, standings, fetch);

		// Calculate centered luck (relative to league average)
		const avgLuck = h2hLuckRaw.reduce((sum, m) => sum + m.seasonLuck, 0) / h2hLuckRaw.length;
		const h2hLuck = h2hLuckRaw.map(m => ({
			...m,
			centeredLuck: Math.round((m.seasonLuck - avgLuck) * 10) / 10
		}));

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
				stats: h2hStats
			}
		};
	} catch (error) {
		console.error('Error loading page data:', error);
		throw error;
	}
};
