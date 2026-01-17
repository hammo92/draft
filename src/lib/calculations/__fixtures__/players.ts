import type { EnrichedPlayer } from '$lib/types/fpl';
import type { PlayerBaseline } from '../types';

// Mock players with different positions and minute thresholds
export const mockPlayers: Record<number, EnrichedPlayer> = {
	// GK with sufficient minutes (1800 mins = 20 games)
	1: {
		id: 1,
		web_name: 'Alisson',
		first_name: 'Alisson',
		second_name: 'Becker',
		team: 14,
		element_type: 1, // GK
		total_points: 120,
		form: '6.0',
		points_per_game: '6.0',
		minutes: 1800,
		goals_scored: 0,
		assists: 1,
		clean_sheets: 10,
		goals_conceded: 15,
		own_goals: 0,
		penalties_saved: 1,
		penalties_missed: 0,
		yellow_cards: 1,
		red_cards: 0,
		saves: 60,
		bonus: 15,
		bps: 400,
		influence: '500.0',
		creativity: '50.0',
		threat: '10.0',
		ict_index: '56.0',
		team_name: 'Liverpool',
		position_name: 'Goalkeeper'
	},
	// DEF with sufficient minutes
	2: {
		id: 2,
		web_name: 'Alexander-Arnold',
		first_name: 'Trent',
		second_name: 'Alexander-Arnold',
		team: 14,
		element_type: 2, // DEF
		total_points: 150,
		form: '7.5',
		points_per_game: '7.5',
		minutes: 1620, // 18 full games
		goals_scored: 3,
		assists: 10,
		clean_sheets: 8,
		goals_conceded: 18,
		own_goals: 0,
		penalties_saved: 0,
		penalties_missed: 0,
		yellow_cards: 3,
		red_cards: 0,
		saves: 0,
		bonus: 20,
		bps: 550,
		influence: '600.0',
		creativity: '300.0',
		threat: '150.0',
		ict_index: '105.0',
		team_name: 'Liverpool',
		position_name: 'Defender'
	},
	// MID with sufficient minutes
	3: {
		id: 3,
		web_name: 'Salah',
		first_name: 'Mohamed',
		second_name: 'Salah',
		team: 14,
		element_type: 3, // MID
		total_points: 250,
		form: '10.0',
		points_per_game: '12.5',
		minutes: 1800,
		goals_scored: 20,
		assists: 10,
		clean_sheets: 5,
		goals_conceded: 0,
		own_goals: 0,
		penalties_saved: 0,
		penalties_missed: 2,
		yellow_cards: 2,
		red_cards: 0,
		saves: 0,
		bonus: 40,
		bps: 900,
		influence: '1200.0',
		creativity: '600.0',
		threat: '800.0',
		ict_index: '260.0',
		team_name: 'Liverpool',
		position_name: 'Midfielder'
	},
	// FWD with sufficient minutes
	4: {
		id: 4,
		web_name: 'Haaland',
		first_name: 'Erling',
		second_name: 'Haaland',
		team: 13,
		element_type: 4, // FWD
		total_points: 280,
		form: '12.0',
		points_per_game: '14.0',
		minutes: 1800,
		goals_scored: 30,
		assists: 5,
		clean_sheets: 0,
		goals_conceded: 0,
		own_goals: 0,
		penalties_saved: 0,
		penalties_missed: 1,
		yellow_cards: 1,
		red_cards: 0,
		saves: 0,
		bonus: 50,
		bps: 1000,
		influence: '1500.0',
		creativity: '200.0',
		threat: '1200.0',
		ict_index: '290.0',
		team_name: 'Man City',
		position_name: 'Forward'
	},
	// Low-minutes player (below threshold) - should use position fallbacks
	5: {
		id: 5,
		web_name: 'Youngster',
		first_name: 'Young',
		second_name: 'Player',
		team: 1,
		element_type: 3, // MID
		total_points: 15,
		form: '3.0',
		points_per_game: '3.0',
		minutes: 450, // Below 900 threshold
		goals_scored: 1,
		assists: 1,
		clean_sheets: 2,
		goals_conceded: 0,
		own_goals: 0,
		penalties_saved: 0,
		penalties_missed: 0,
		yellow_cards: 1,
		red_cards: 0,
		saves: 0,
		bonus: 2,
		bps: 50,
		influence: '50.0',
		creativity: '30.0',
		threat: '20.0',
		ict_index: '10.0',
		team_name: 'Arsenal',
		position_name: 'Midfielder'
	},
	// Player with zero minutes
	6: {
		id: 6,
		web_name: 'Injured',
		first_name: 'Ben',
		second_name: 'Injured',
		team: 1,
		element_type: 2, // DEF
		total_points: 0,
		form: '0.0',
		points_per_game: '0.0',
		minutes: 0,
		goals_scored: 0,
		assists: 0,
		clean_sheets: 0,
		goals_conceded: 0,
		own_goals: 0,
		penalties_saved: 0,
		penalties_missed: 0,
		yellow_cards: 0,
		red_cards: 0,
		saves: 0,
		bonus: 0,
		bps: 0,
		influence: '0.0',
		creativity: '0.0',
		threat: '0.0',
		ict_index: '0.0',
		team_name: 'Arsenal',
		position_name: 'Defender'
	}
};

// Pre-calculated baselines for the mock players
export const mockBaselines: Map<number, PlayerBaseline> = new Map([
	[
		1,
		{
			playerId: 1,
			position: 1, // GK
			seasonMinutes: 1800,
			goalsPerGame: 0,
			assistsPerGame: (1 / 1800) * 90, // 0.05
			cleanSheetsPerGame: (10 / 1800) * 90, // 0.5
			bonusPerGame: (15 / 1800) * 90, // 0.75
			savesPerGame: (60 / 1800) * 90, // 3.0
			yellowsPerGame: (1 / 1800) * 90,
			redsPerGame: 0,
			ownGoalsPerGame: 0,
			penaltiesMissedPerGame: 0,
			penaltiesSavedPerGame: (1 / 1800) * 90
		}
	],
	[
		2,
		{
			playerId: 2,
			position: 2, // DEF
			seasonMinutes: 1620,
			goalsPerGame: (3 / 1620) * 90, // ~0.167
			assistsPerGame: (10 / 1620) * 90, // ~0.556
			cleanSheetsPerGame: (8 / 1620) * 90, // ~0.444
			bonusPerGame: (20 / 1620) * 90, // ~1.111
			savesPerGame: 0,
			yellowsPerGame: (3 / 1620) * 90,
			redsPerGame: 0,
			ownGoalsPerGame: 0,
			penaltiesMissedPerGame: 0,
			penaltiesSavedPerGame: 0
		}
	],
	[
		3,
		{
			playerId: 3,
			position: 3, // MID
			seasonMinutes: 1800,
			goalsPerGame: (20 / 1800) * 90, // 1.0
			assistsPerGame: (10 / 1800) * 90, // 0.5
			cleanSheetsPerGame: (5 / 1800) * 90, // 0.25
			bonusPerGame: (40 / 1800) * 90, // 2.0
			savesPerGame: 0,
			yellowsPerGame: (2 / 1800) * 90,
			redsPerGame: 0,
			ownGoalsPerGame: 0,
			penaltiesMissedPerGame: (2 / 1800) * 90,
			penaltiesSavedPerGame: 0
		}
	],
	[
		4,
		{
			playerId: 4,
			position: 4, // FWD
			seasonMinutes: 1800,
			goalsPerGame: (30 / 1800) * 90, // 1.5
			assistsPerGame: (5 / 1800) * 90, // 0.25
			cleanSheetsPerGame: 0,
			bonusPerGame: (50 / 1800) * 90, // 2.5
			savesPerGame: 0,
			yellowsPerGame: (1 / 1800) * 90,
			redsPerGame: 0,
			ownGoalsPerGame: 0,
			penaltiesMissedPerGame: (1 / 1800) * 90,
			penaltiesSavedPerGame: 0
		}
	],
	[
		5, // Low-minutes player - should use fallbacks
		{
			playerId: 5,
			position: 3, // MID
			seasonMinutes: 450,
			goalsPerGame: 0.15, // Position fallback
			assistsPerGame: 0.15, // Position fallback
			cleanSheetsPerGame: 0.15, // Position fallback
			bonusPerGame: 2.0, // Position fallback
			savesPerGame: 0,
			yellowsPerGame: (1 / 450) * 90,
			redsPerGame: 0,
			ownGoalsPerGame: 0,
			penaltiesMissedPerGame: 0,
			penaltiesSavedPerGame: 0
		}
	]
]);
