// FDR multipliers for expected output adjustment
export const FDR_MULTIPLIERS: Record<number, number> = {
	1: 1.15, // Easiest - expect 15% more output
	2: 1.08,
	3: 1.0,
	4: 0.93,
	5: 0.85 // Hardest - expect 15% less
};

// FDR multiplier for defensive stats (inverted - easy fixture = weaker opponent)
// FDR 1 (easy for us) = opponent scores LESS, FDR 5 (hard for us) = opponent scores MORE
export const DEFENSIVE_FDR_MULTIPLIERS: Record<number, number> = {
	1: 0.85, // Easy fixture = weak opponent = 15% less opponent output
	2: 0.92,
	3: 1.0,
	4: 1.08,
	5: 1.15 // Hard fixture = strong opponent = 15% more opponent output
};

// Point values by position
export const GOAL_POINTS: Record<number, number> = { 1: 6, 2: 6, 3: 5, 4: 4 };
export const CS_POINTS: Record<number, number> = { 1: 4, 2: 4, 3: 1, 4: 0 };

// Position-based fallback rates for rare events (when player has insufficient sample)
export const POSITION_FALLBACK_RATES = {
	yellowsPerGame: { 1: 0.05, 2: 0.12, 3: 0.1, 4: 0.08 } as Record<number, number>,
	redsPerGame: { 1: 0.002, 2: 0.004, 3: 0.003, 4: 0.003 } as Record<number, number>,
	ownGoalsPerGame: { 1: 0.002, 2: 0.008, 3: 0.003, 4: 0.002 } as Record<number, number>,
	penaltiesMissedPerGame: { 1: 0.001, 2: 0.002, 3: 0.008, 4: 0.012 } as Record<number, number>,
	penaltiesSavedPerGame: { 1: 0.015, 2: 0, 3: 0, 4: 0 } as Record<number, number>
};

// Position-based fallback rates for main stats (when player has < MIN_MINUTES_THRESHOLD)
// Uses league-average per-90 rates by position
// Note: ~60 total bonus awarded per GW across ~300 players = ~0.2 avg per player
export const POSITION_MAIN_FALLBACKS = {
	goalsPerGame: { 1: 0.01, 2: 0.08, 3: 0.15, 4: 0.35 } as Record<number, number>,
	assistsPerGame: { 1: 0.02, 2: 0.1, 3: 0.15, 4: 0.15 } as Record<number, number>,
	cleanSheetsPerGame: { 1: 0.35, 2: 0.35, 3: 0.15, 4: 0 } as Record<number, number>,
	bonusPerGame: { 1: 0.25, 2: 0.20, 3: 0.25, 4: 0.30 } as Record<number, number>,
	savesPerGame: { 1: 3.0, 2: 0, 3: 0, 4: 0 } as Record<number, number>
};

// Minimum minutes threshold for using player's own rate vs position fallback
export const MIN_MINUTES_THRESHOLD = 900; // ~10 full games
