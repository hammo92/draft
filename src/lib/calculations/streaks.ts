import type { LeagueDetails, ManagerStreak } from '$lib/types/fpl';

// Calculate streaks for each manager
export function calculateStreaks(
	matches: LeagueDetails['matches'],
	entries: LeagueDetails['league_entries']
): ManagerStreak[] {
	const results: ManagerStreak[] = [];

	for (const entry of entries) {
		if (!entry.entry_id) continue;

		const managerName =
			`${entry.player_first_name || ''} ${entry.player_last_name || ''}`.trim() || 'Unknown';

		// Get all matches for this manager, sorted by gameweek
		const managerMatches = matches
			.filter(
				(m) => m.finished && (m.league_entry_1 === entry.id || m.league_entry_2 === entry.id)
			)
			.sort((a, b) => a.event - b.event);

		// Calculate results
		const resultsList: ('W' | 'L' | 'D')[] = managerMatches.map((m) => {
			const isEntry1 = m.league_entry_1 === entry.id;
			const myScore = isEntry1 ? m.league_entry_1_points : m.league_entry_2_points;
			const theirScore = isEntry1 ? m.league_entry_2_points : m.league_entry_1_points;
			if (myScore > theirScore) return 'W';
			if (myScore < theirScore) return 'L';
			return 'D';
		});

		// Current streak
		let currentType: 'W' | 'L' | 'D' = resultsList[resultsList.length - 1] || 'D';
		let currentCount = 0;
		for (let i = resultsList.length - 1; i >= 0; i--) {
			if (resultsList[i] === currentType) {
				currentCount++;
			} else {
				break;
			}
		}

		// Longest streaks
		let longestWin = 0;
		let longestLoss = 0;
		let tempWin = 0;
		let tempLoss = 0;

		for (const result of resultsList) {
			if (result === 'W') {
				tempWin++;
				tempLoss = 0;
				longestWin = Math.max(longestWin, tempWin);
			} else if (result === 'L') {
				tempLoss++;
				tempWin = 0;
				longestLoss = Math.max(longestLoss, tempLoss);
			} else {
				tempWin = 0;
				tempLoss = 0;
			}
		}

		// Last 5 form
		const currentForm = resultsList.slice(-5);

		results.push({
			managerId: entry.entry_id,
			managerName,
			currentStreak: { type: currentType, count: currentCount },
			longestWinStreak: longestWin,
			longestLossStreak: longestLoss,
			currentForm
		});
	}

	return results;
}
