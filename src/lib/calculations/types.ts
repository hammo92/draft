// Player baseline stats derived from season totals
export interface PlayerBaseline {
	playerId: number;
	position: 1 | 2 | 3 | 4; // GK, DEF, MID, FWD
	seasonMinutes: number;
	// Per-90 rates
	goalsPerGame: number;
	assistsPerGame: number;
	cleanSheetsPerGame: number;
	bonusPerGame: number;
	savesPerGame: number; // GK only, 0 for outfield
	// Negative events per-90
	yellowsPerGame: number;
	redsPerGame: number;
	ownGoalsPerGame: number;
	penaltiesMissedPerGame: number;
	penaltiesSavedPerGame: number; // GK only, 0 for outfield
}

// Luck component for a single scoring category
export interface LuckComponent {
	actual: number; // Actual events (goals, assists, etc.)
	expected: number; // Expected events based on baseline
	luck: number; // actual - expected (in raw units)
	pointsPerUnit: number; // FPL points per unit (e.g., 4 for DEF goal)
	points: number; // luck converted to FPL points
}

// Full player gameweek luck breakdown
export interface PlayerGameweekLuck {
	playerId: number;
	playerName: string;
	gameweek: number;
	position: number;
	minutesPlayed: number;
	// Component breakdown
	appearance: LuckComponent;
	goals: LuckComponent;
	assists: LuckComponent;
	cleanSheet: LuckComponent;
	goalsConceded: LuckComponent;
	bonus: LuckComponent;
	saves: LuckComponent;
	yellowCards: LuckComponent;
	redCards: LuckComponent;
	ownGoals: LuckComponent;
	penaltiesMissed: LuckComponent;
	penaltiesSaved: LuckComponent;
	// Totals
	totalExpectedPoints: number;
	totalActualPoints: number;
	totalLuck: number;
}

// Gameweek stats from live data API
export interface GWStats {
	total_points: number;
	minutes: number;
	goals_scored: number;
	assists: number;
	clean_sheets: number;
	goals_conceded: number;
	bonus: number;
	expected_goals_conceded: number;
	saves?: number;
	yellow_cards?: number;
	red_cards?: number;
	own_goals?: number;
	penalties_saved?: number;
	penalties_missed?: number;
}

// Fixture with difficulty ratings
export interface FixtureData {
	id: number;
	event: number;
	team_h: number;
	team_a: number;
	team_h_difficulty: number;
	team_a_difficulty: number;
}
