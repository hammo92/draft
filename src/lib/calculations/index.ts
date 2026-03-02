// Re-export all calculation functions and types

// Constants
export {
	FDR_MULTIPLIERS,
	DEFENSIVE_FDR_MULTIPLIERS,
	GOAL_POINTS,
	CS_POINTS,
	POSITION_FALLBACK_RATES,
	POSITION_MAIN_FALLBACKS,
	MIN_MINUTES_THRESHOLD
} from './constants';

// Types
export type {
	PlayerBaseline,
	LuckComponent,
	PlayerGameweekLuck,
	GWStats,
	FixtureData
} from './types';

// Baselines
export { getEffectiveRate, buildPlayerBaselines } from './baselines';

// FDR
export { getPlayerFDR, getCSProbability } from './fdr';

// Luck
export { calculatePlayerGameweekLuck } from './luck';

// H2H
export {
	getManagerNameFromEntry,
	buildH2HMatrix,
	processFixtures,
	calculateRivalryStats,
	calculateNemesisBunny
} from './h2h';

// Streaks
export { calculateStreaks } from './streaks';

// Would Have Beat
export { calculateWouldHaveBeat } from './would-have-beat';

// Fixture Luck & Holistic Luck
export { calculateFixtureLuck, calculateHolisticLuck, calculateLossAnalysis } from './fixture-luck';
export type { ManagerFixtureLuck, FixtureLuckGW, HolisticLuck } from './fixture-luck';
