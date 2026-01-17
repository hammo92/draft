import type { PlayerBaseline, LuckComponent, PlayerGameweekLuck, GWStats } from './types';
import {
	FDR_MULTIPLIERS,
	DEFENSIVE_FDR_MULTIPLIERS,
	GOAL_POINTS,
	CS_POINTS
} from './constants';
import { getEffectiveRate } from './baselines';
import { getCSProbability } from './fdr';

// Helper to create a luck component
function createComponent(
	actual: number,
	expected: number,
	pointsPerUnit: number
): LuckComponent {
	const luck = actual - expected;
	return {
		actual,
		expected,
		luck,
		pointsPerUnit,
		points: luck * pointsPerUnit
	};
}

// Calculate full player gameweek luck with component breakdown
export function calculatePlayerGameweekLuck(
	playerId: number,
	playerName: string,
	gameweek: number,
	gwStats: GWStats,
	baseline: PlayerBaseline,
	opponentXG: number, // Opponent's expected goals against this team
	fdr: number // Fixture difficulty rating 1-5
): PlayerGameweekLuck {
	const minutes = gwStats.minutes || 0;
	const minutesFraction = minutes / 90;
	const position = baseline.position;
	const fdrMult = FDR_MULTIPLIERS[fdr] || 1; // For attacking stats
	const defFdrMult = DEFENSIVE_FDR_MULTIPLIERS[fdr] || 1; // For defensive stats

	// Goals: expected = (goalsPerGame x mins/90) x FDR_mult
	const expectedGoals = baseline.goalsPerGame * minutesFraction * fdrMult;
	const goals = createComponent(gwStats.goals_scored, expectedGoals, GOAL_POINTS[position]);

	// Assists: expected = (assistsPerGame x mins/90) x FDR_mult
	const expectedAssists = baseline.assistsPerGame * minutesFraction * fdrMult;
	const assists = createComponent(gwStats.assists, expectedAssists, 3);

	// Clean Sheet: expected = P(CS) x played60+
	// Only counts if player played 60+ mins, probability from Poisson
	const played60Plus = minutes >= 60 ? 1 : 0;
	const csProbability = getCSProbability(opponentXG, fdr);
	const expectedCS = csProbability * played60Plus;
	const actualCS = gwStats.clean_sheets;
	const cleanSheet = createComponent(actualCS, expectedCS, CS_POINTS[position]);

	// Goals Conceded: expected = opponent_xG x defensive_FDR_mult (only for GK/DEF)
	// Points: -0.5 per goal conceded for GK/DEF (every 2 = -1 pt)
	const expectedGC = position <= 2 ? opponentXG * defFdrMult * played60Plus : 0;
	const actualGC = position <= 2 ? gwStats.goals_conceded : 0;
	const goalsConceded = createComponent(actualGC, expectedGC, -0.5);

	// Bonus: expected = bonusPerGame x mins/90 (no FDR adjustment - bonus is relative to game)
	const expectedBonus = baseline.bonusPerGame * minutesFraction;
	const bonus = createComponent(gwStats.bonus, expectedBonus, 1);

	// Saves: expected = (savesPerGame x mins/90) x defensive_FDR_mult (GK only)
	// More saves expected against stronger opponents (higher defFdrMult)
	// Points: 1 per 3 saves = 0.333 per save
	const expectedSaves = position === 1 ? baseline.savesPerGame * minutesFraction * defFdrMult : 0;
	const actualSaves = position === 1 ? (gwStats.saves || 0) : 0;
	const saves = createComponent(actualSaves, expectedSaves, 1 / 3);

	// Yellow Cards: expected = effective rate x mins/90
	const effectiveYellowRate = getEffectiveRate(
		baseline.yellowsPerGame,
		baseline.seasonMinutes,
		position,
		'yellowsPerGame'
	);
	const expectedYellows = effectiveYellowRate * minutesFraction;
	const yellowCards = createComponent(gwStats.yellow_cards || 0, expectedYellows, -1);

	// Red Cards: expected = effective rate x mins/90
	const effectiveRedRate = getEffectiveRate(
		baseline.redsPerGame,
		baseline.seasonMinutes,
		position,
		'redsPerGame'
	);
	const expectedReds = effectiveRedRate * minutesFraction;
	const redCards = createComponent(gwStats.red_cards || 0, expectedReds, -3);

	// Own Goals: expected = effective rate x mins/90
	const effectiveOGRate = getEffectiveRate(
		baseline.ownGoalsPerGame,
		baseline.seasonMinutes,
		position,
		'ownGoalsPerGame'
	);
	const expectedOGs = effectiveOGRate * minutesFraction;
	const ownGoals = createComponent(gwStats.own_goals || 0, expectedOGs, -2);

	// Penalties Missed: expected = effective rate x mins/90
	const effectivePenMissedRate = getEffectiveRate(
		baseline.penaltiesMissedPerGame,
		baseline.seasonMinutes,
		position,
		'penaltiesMissedPerGame'
	);
	const expectedPensMissed = effectivePenMissedRate * minutesFraction;
	const penaltiesMissed = createComponent(gwStats.penalties_missed || 0, expectedPensMissed, -2);

	// Penalties Saved: expected = effective rate x mins/90 x defensive_FDR_mult (GK only)
	// More penalty opportunities against stronger opponents
	const effectivePenSavedRate =
		position === 1
			? getEffectiveRate(
					baseline.penaltiesSavedPerGame,
					baseline.seasonMinutes,
					position,
					'penaltiesSavedPerGame'
				)
			: 0;
	const expectedPensSaved = effectivePenSavedRate * minutesFraction * defFdrMult;
	const penaltiesSaved = createComponent(gwStats.penalties_saved || 0, expectedPensSaved, 5);

	// Appearance: 0 mins = 0 pts, 1-59 mins = 1 pt, 60+ mins = 2 pts
	// We track appearance but exclude it from luck - playing time is availability, not performance
	// Setting expected = actual means appearance luck is always 0
	const actualAppearance = minutes >= 60 ? 2 : minutes > 0 ? 1 : 0;
	const expectedAppearance = actualAppearance; // No luck component - availability is not performance luck
	const appearance = createComponent(actualAppearance, expectedAppearance, 1);

	// Calculate totals (appearance excluded from luck since it's not performance-based)
	const allComponents = [
		goals,
		assists,
		cleanSheet,
		goalsConceded,
		bonus,
		saves,
		yellowCards,
		redCards,
		ownGoals,
		penaltiesMissed,
		penaltiesSaved
	];
	const totalExpectedPoints = allComponents.reduce(
		(sum, c) => sum + c.expected * c.pointsPerUnit,
		0
	);
	const totalActualPoints = gwStats.total_points;
	const totalLuck = allComponents.reduce((sum, c) => sum + c.points, 0);

	return {
		playerId,
		playerName,
		gameweek,
		position,
		minutesPlayed: minutes,
		appearance,
		goals,
		assists,
		cleanSheet,
		goalsConceded,
		bonus,
		saves,
		yellowCards,
		redCards,
		ownGoals,
		penaltiesMissed,
		penaltiesSaved,
		totalExpectedPoints,
		totalActualPoints,
		totalLuck
	};
}
