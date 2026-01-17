import type {
	LeagueDetails,
	DetailedEntry,
	ManagerWouldHaveBeat,
	WouldHaveBeatGW
} from '$lib/types/fpl';

// Calculate "would have beat" data for each manager
export function calculateWouldHaveBeat(
	entries: DetailedEntry[],
	matches: LeagueDetails['matches'],
	completedGameweeks: number[]
): ManagerWouldHaveBeat[] {
	const results: ManagerWouldHaveBeat[] = [];

	for (const entry of entries) {
		if (!entry.entry_id) continue;

		const managerName =
			`${entry.player_first_name || ''} ${entry.player_last_name || ''}`.trim() || 'Unknown';
		const gameweeks: WouldHaveBeatGW[] = [];
		let totalUnluckyWeeks = 0;
		let totalRank = 0;
		let rankedWeeks = 0;

		for (const gw of completedGameweeks) {
			const gwHistory = entry.history.find((h) => h.event === gw);
			if (!gwHistory) continue;

			const myScore = gwHistory.points;

			// Get all scores for this gameweek
			const allScores = entries
				.filter((e) => e.entry_id && e.history.find((h) => h.event === gw))
				.map((e) => ({
					entryId: e.entry_id!,
					score: e.history.find((h) => h.event === gw)!.points
				}));

			// How many would I have beaten?
			const wouldHaveBeaten = allScores.filter(
				(s) => s.entryId !== entry.entry_id && s.score < myScore
			).length;
			const totalManagers = allScores.length;

			// Find actual H2H match result
			const match = matches.find(
				(m) =>
					m.event === gw &&
					m.finished &&
					(m.league_entry_1 === entry.id || m.league_entry_2 === entry.id)
			);

			let actualOpponent = 'Unknown';
			let actualResult: 'W' | 'L' | 'D' = 'D';

			if (match) {
				const isEntry1 = match.league_entry_1 === entry.id;
				const opponentId = isEntry1 ? match.league_entry_2 : match.league_entry_1;
				const opponentEntry = entries.find((e) => e.id === opponentId);
				actualOpponent = opponentEntry
					? `${opponentEntry.player_first_name || ''} ${opponentEntry.player_last_name || ''}`.trim()
					: 'Unknown';

				const myMatchScore = isEntry1 ? match.league_entry_1_points : match.league_entry_2_points;
				const theirScore = isEntry1 ? match.league_entry_2_points : match.league_entry_1_points;
				actualResult = myMatchScore > theirScore ? 'W' : myMatchScore < theirScore ? 'L' : 'D';
			}

			// Unlucky if you beat more than half but still lost
			const unluckyDraw = actualResult === 'L' && wouldHaveBeaten >= Math.floor(totalManagers / 2);
			if (unluckyDraw) totalUnluckyWeeks++;

			// Calculate rank (1 = best)
			const rank = allScores.filter((s) => s.score > myScore).length + 1;
			totalRank += rank;
			rankedWeeks++;

			gameweeks.push({
				gameweek: gw,
				score: myScore,
				wouldHaveBeaten,
				totalManagers,
				actualOpponent,
				actualResult,
				unluckyDraw
			});
		}

		// Sort by gameweek descending
		gameweeks.sort((a, b) => b.gameweek - a.gameweek);

		results.push({
			managerId: entry.entry_id,
			managerName,
			gameweeks,
			totalUnluckyWeeks,
			averageRank: rankedWeeks > 0 ? Math.round((totalRank / rankedWeeks) * 10) / 10 : 0
		});
	}

	// Sort by most unlucky weeks
	return results.sort((a, b) => b.totalUnluckyWeeks - a.totalUnluckyWeeks);
}
