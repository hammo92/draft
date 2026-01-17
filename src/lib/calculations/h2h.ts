import type {
	LeagueDetails,
	H2HRecord,
	MatchResult,
	RivalryStats,
	NemesisBunny
} from '$lib/types/fpl';

// Helper to get manager name safely
export function getManagerNameFromEntry(entry: LeagueDetails['league_entries'][0]): string {
	if (!entry.player_first_name && !entry.player_last_name) return 'AVERAGE';
	return `${entry.player_first_name || ''} ${entry.player_last_name || ''}`.trim() || 'Unknown';
}

// Build H2H matrix from matches
export function buildH2HMatrix(
	matches: LeagueDetails['matches'],
	entries: LeagueDetails['league_entries']
): H2HRecord[] {
	const entryLookup = new Map(entries.map((e) => [e.id, e]));
	const matrix = new Map<string, H2HRecord>();

	matches
		.filter((m) => m.finished)
		.forEach((match) => {
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
export function processFixtures(
	matches: LeagueDetails['matches'],
	entries: LeagueDetails['league_entries']
): MatchResult[] {
	const entryLookup = new Map(entries.map((e) => [e.id, e]));

	return matches
		.filter((m) => m.finished)
		.map((match) => {
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
export function calculateRivalryStats(fixtures: MatchResult[]): RivalryStats {
	let biggestWin: RivalryStats['biggestWin'] = null;
	let closestGame: RivalryStats['closestGame'] = null;

	fixtures.forEach((match) => {
		// Biggest win (non-draw)
		if (match.margin > 0) {
			if (!biggestWin || match.margin > biggestWin.margin) {
				const winner =
					match.manager1.score > match.manager2.score ? match.manager1 : match.manager2;
				const loser =
					match.manager1.score > match.manager2.score ? match.manager2 : match.manager1;
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

// Calculate nemesis (opponent you can't beat) and bunny (opponent you always beat) for each manager
export function calculateNemesisBunny(
	matrix: H2HRecord[],
	entries: LeagueDetails['league_entries']
): NemesisBunny[] {
	// Build a map of each manager's record against all opponents
	const managerRecords = new Map<
		number,
		Map<number, { wins: number; losses: number; draws: number }>
	>();

	matrix.forEach((record) => {
		// Manager 1's perspective
		if (!managerRecords.has(record.manager1Id)) {
			managerRecords.set(record.manager1Id, new Map());
		}
		managerRecords.get(record.manager1Id)!.set(record.manager2Id, {
			wins: record.wins,
			losses: record.losses,
			draws: record.draws
		});

		// Manager 2's perspective (reversed)
		if (!managerRecords.has(record.manager2Id)) {
			managerRecords.set(record.manager2Id, new Map());
		}
		managerRecords.get(record.manager2Id)!.set(record.manager1Id, {
			wins: record.losses, // Flipped
			losses: record.wins, // Flipped
			draws: record.draws
		});
	});

	const results: NemesisBunny[] = [];

	for (const [managerId, opponents] of managerRecords) {
		const entry = entries.find((e) => e.id === managerId);
		const managerName = entry
			? `${entry.player_first_name || ''} ${entry.player_last_name || ''}`.trim() || 'Unknown'
			: 'Unknown';

		let nemesis: NemesisBunny['nemesis'] = null;
		let bunny: NemesisBunny['bunny'] = null;
		let worstDiff = Infinity;
		let bestDiff = -Infinity;

		for (const [opponentId, record] of opponents) {
			const diff = record.wins - record.losses;
			const totalGames = record.wins + record.losses + record.draws;

			// Skip if no games played
			if (totalGames === 0) continue;

			const opponentEntry = entries.find((e) => e.id === opponentId);
			const opponentName = opponentEntry
				? `${opponentEntry.player_first_name || ''} ${opponentEntry.player_last_name || ''}`.trim() ||
					'Unknown'
				: 'Unknown';

			// Nemesis: worst win-loss differential (most losses relative to wins)
			if (diff < worstDiff || (diff === worstDiff && record.losses > (nemesis?.losses || 0))) {
				worstDiff = diff;
				nemesis = {
					opponentId,
					opponentName,
					wins: record.wins,
					losses: record.losses,
					draws: record.draws,
					record: `${record.wins}-${record.losses}-${record.draws}`
				};
			}

			// Bunny: best win-loss differential (most wins relative to losses)
			if (diff > bestDiff || (diff === bestDiff && record.wins > (bunny?.wins || 0))) {
				bestDiff = diff;
				bunny = {
					opponentId,
					opponentName,
					wins: record.wins,
					losses: record.losses,
					draws: record.draws,
					record: `${record.wins}-${record.losses}-${record.draws}`
				};
			}
		}

		// Only include if there's a meaningful difference
		if (nemesis && worstDiff >= 0) nemesis = null; // Not a real nemesis if you're even or ahead
		if (bunny && bestDiff <= 0) bunny = null; // Not a real bunny if you're even or behind

		results.push({ managerId, managerName, nemesis, bunny });
	}

	return results;
}
