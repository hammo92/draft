import type { FixtureData } from './types';
import { DEFENSIVE_FDR_MULTIPLIERS } from './constants';

// Get FDR for a player's team in a given gameweek
// For DGWs, returns the average FDR across all fixtures
export function getPlayerFDR(
	playerTeam: number | undefined,
	gameweek: number,
	fixturesByGw: Map<number, FixtureData[]>
): number {
	if (!playerTeam) return 3; // Default neutral
	const gwFixtures = fixturesByGw.get(gameweek) || [];

	// Find ALL fixtures for this team in the gameweek (handles DGWs)
	const teamFixtures = gwFixtures.filter((f) => f.team_h === playerTeam || f.team_a === playerTeam);

	if (teamFixtures.length === 0) return 3; // Default neutral if no fixture found

	// Calculate FDR for each fixture
	const fdrValues = teamFixtures.map((fixture) => {
		const isHome = fixture.team_h === playerTeam;
		return isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
	});

	// Return average FDR (handles both single fixtures and DGWs)
	return fdrValues.reduce((sum, fdr) => sum + fdr, 0) / fdrValues.length;
}

// Calculate clean sheet probability using Poisson distribution
export function getCSProbability(opponentXG: number, fdr: number): number {
	const adjustedXG = opponentXG * (DEFENSIVE_FDR_MULTIPLIERS[fdr] || 1);
	return Math.exp(-adjustedXG); // P(0 goals) = e^(-lambda)
}
