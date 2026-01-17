import type { EnrichedPlayer } from '$lib/types/fpl';
import type { PlayerBaseline } from './types';
import {
	MIN_MINUTES_THRESHOLD,
	POSITION_FALLBACK_RATES,
	POSITION_MAIN_FALLBACKS
} from './constants';

// Get effective rate for rare events - use player rate if sufficient sample, else position fallback
export function getEffectiveRate(
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

// Build player baseline lookup from season stats
export function buildPlayerBaselines(
	players: Record<number, EnrichedPlayer>
): Map<number, PlayerBaseline> {
	const baselines = new Map<number, PlayerBaseline>();

	for (const [id, player] of Object.entries(players)) {
		const playerId = parseInt(id);
		const seasonMinutes = player.minutes || 0;
		const position = player.element_type as 1 | 2 | 3 | 4;

		// Calculate per-90 rates (raw - will use getEffectiveRate for rare events)
		const per90 = (stat: number) => (seasonMinutes > 0 ? (stat / seasonMinutes) * 90 : 0);

		// For players with insufficient minutes, use position-based fallbacks for main stats
		const usePlayerRate = seasonMinutes >= MIN_MINUTES_THRESHOLD;

		baselines.set(playerId, {
			playerId,
			position,
			seasonMinutes,
			// Positive stats - use position fallback if insufficient minutes
			goalsPerGame: usePlayerRate
				? per90(player.goals_scored || 0)
				: POSITION_MAIN_FALLBACKS.goalsPerGame[position],
			assistsPerGame: usePlayerRate
				? per90(player.assists || 0)
				: POSITION_MAIN_FALLBACKS.assistsPerGame[position],
			cleanSheetsPerGame: usePlayerRate
				? per90(player.clean_sheets || 0)
				: POSITION_MAIN_FALLBACKS.cleanSheetsPerGame[position],
			bonusPerGame: usePlayerRate
				? per90(player.bonus || 0)
				: POSITION_MAIN_FALLBACKS.bonusPerGame[position],
			savesPerGame: usePlayerRate
				? per90(player.saves || 0)
				: POSITION_MAIN_FALLBACKS.savesPerGame[position],
			// Negative events (rare events still use getEffectiveRate at calculation time)
			yellowsPerGame: per90(player.yellow_cards || 0),
			redsPerGame: per90(player.red_cards || 0),
			ownGoalsPerGame: per90(player.own_goals || 0),
			penaltiesMissedPerGame: per90(player.penalties_missed || 0),
			penaltiesSavedPerGame: per90(player.penalties_saved || 0)
		});
	}

	return baselines;
}
