// FPL Draft API Types

export interface Bootstrap {
	events: Event[];
	teams: Team[];
	elements: Player[];
	element_types: Position[];
}

export interface Event {
	id: number;
	name: string;
	deadline_time: string;
	finished: boolean;
	is_current: boolean;
	is_next: boolean;
}

export interface Team {
	id: number;
	name: string;
	short_name: string;
	strength: number;
}

export interface Player {
	id: number;
	web_name: string;
	first_name: string;
	second_name: string;
	team: number;
	element_type: number;
	total_points: number;
	form: string;
	points_per_game: string;
	minutes: number;
	goals_scored: number;
	assists: number;
	clean_sheets: number;
	goals_conceded: number;
	own_goals: number;
	penalties_saved: number;
	penalties_missed: number;
	yellow_cards: number;
	red_cards: number;
	saves: number;
	bonus: number;
	bps: number;
	influence: string;
	creativity: string;
	threat: string;
	ict_index: string;
}

export interface Position {
	id: number;
	singular_name: string;
	singular_name_short: string;
	plural_name: string;
	plural_name_short: string;
}

export interface ApiStanding {
	league_entry: number;
	rank: number;
	last_rank: number;
	rank_sort: number;
	matches_played: number;
	matches_won: number;
	matches_drawn: number;
	matches_lost: number;
	points_for: number;      // Total FPL points scored
	points_against: number;  // Total FPL points conceded
	total: number;           // Fixture points (3*W + D)
}

export interface LeagueDetails {
	league: League;
	league_entries: LeagueEntry[];
	matches: Match[];
	standings: ApiStanding[];
}

export interface League {
	id: number;
	name: string;
	scoring: string;
	start_event: number;
	stop_event: number;
	admin_entry: number;
	draft_status: string;
	transaction_mode: string;
}

export interface LeagueEntry {
	entry_id: number | null;
	entry_name: string | null;
	id: number;
	player_first_name: string | null;
	player_last_name: string | null;
	short_name: string;
	waiver_pick: number | null;
	joined_time: string;
}

export interface Match {
	event: number;
	finished: boolean;
	league_entry_1: number;
	league_entry_1_points: number;
	league_entry_2: number;
	league_entry_2_points: number;
	started: boolean;
	winning_league_entry: number | null;
	winning_method: string | null;
}

export interface EntryHistory {
	history: GameweekHistory[];
	entry: EntryInfo;
}

export interface GameweekHistory {
	id: number;
	points: number;
	total_points: number;
	rank: number | null;
	rank_sort: number | null;
	event_transfers: number;
	points_on_bench: number;
	entry: number;
	event: number;
}

export interface EntryInfo {
	id: number;
	name: string;
	player_first_name: string;
	player_last_name: string;
	event_points: number;
	overall_points: number;
	started_event: number;
	transactions_event: number;
	transactions_total: number;
}

export interface EntryEventPicks {
	picks: Pick[];
	subs: Substitution[];
}

export interface Pick {
	element: number;
	position: number;
	is_captain: boolean;
	is_vice_captain: boolean;
	multiplier: number;
}

export interface Substitution {
	element_in: number;
	element_out: number;
	entry: number;
	event: number;
}

// Calculated types
export interface Standing {
	entry_id: number;
	entry_name: string;
	player_name: string;
	played: number;
	wins: number;
	draws: number;
	losses: number;
	points_for: number;
	points_against: number;
	total: number;
	rank: number;
	event_total: number;
}

export interface EnrichedPlayer extends Player {
	team_name: string;
	position_name: string;
}

export interface Transaction {
	id: number;
	entry: number;
	event: number;
	element_in: number;
	element_out: number;
	kind: 'w' | 't'; // waiver or trade
	result: 'a' | 'di' | 'do'; // approved, didn't get, done/other
}

export interface TransferAnalysis {
	playerIn: {
		id: number;
		name: string;
		position: string;
		team: string;
	};
	playerOut: {
		id: number;
		name: string;
		position: string;
		team: string;
	};
	gameweek: number;
	pointsGained: number; // points by playerIn since transfer
	pointsLost: number;   // points by playerOut since transfer
	netImpact: number;    // pointsGained - pointsLost
}

export interface DetailedEntry extends LeagueEntry {
	history: GameweekHistory[];
	recentPicks: Array<{
		gameweek: number;
		data: EntryEventPicks | null;
	}>;
	stats: {
		form: number[];
		averagePoints: number;
		totalBenchPoints: number;
		benchPointsByGameweek: Array<{
			gameweek: number;
			benchPoints: number;
			benchPlayers: number;
		}>;
		squadStrength: {
			Goalkeeper: number;
			Defender: number;
			Midfielder: number;
			Forward: number;
		};
		totalSquadPoints: number;
		transferValue: number;
		gw1SquadTotal: number;
		transfers: TransferAnalysis[];
	};
}

// H2H Types
export interface H2HRecord {
	manager1Id: number;
	manager2Id: number;
	manager1Name: string;
	manager2Name: string;
	wins: number;
	draws: number;
	losses: number;
	pointsFor: number;
	pointsAgainst: number;
}

export interface MatchResult {
	gameweek: number;
	manager1: { id: number; name: string; score: number };
	manager2: { id: number; name: string; score: number };
	winner: number | null;
	margin: number;
}

export interface GameweekLuck {
	gameweek: number;
	actual: number;
	expected: number;
	luck: number;
	opponent: string;
	result: 'W' | 'D' | 'L';
}

export interface ManagerLuck {
	managerId: number;
	managerName: string;
	gameweeks: GameweekLuck[];
	seasonLuck: number;
	centeredLuck: number;
	efficiency: number;
}

export interface RivalryStats {
	biggestWin: { winner: string; loser: string; score: string; margin: number; gameweek: number } | null;
	closestGame: { manager1: string; manager2: string; score: string; margin: number; gameweek: number } | null;
}

export interface NemesisBunny {
	managerId: number;
	managerName: string;
	nemesis: {
		opponentId: number;
		opponentName: string;
		wins: number;
		losses: number;
		draws: number;
		record: string; // e.g., "0-3-1"
	} | null;
	bunny: {
		opponentId: number;
		opponentName: string;
		wins: number;
		losses: number;
		draws: number;
		record: string; // e.g., "4-0-0"
	} | null;
}

export interface ManagerStreak {
	managerId: number;
	managerName: string;
	currentStreak: {
		type: 'W' | 'L' | 'D';
		count: number;
	};
	longestWinStreak: number;
	longestLossStreak: number;
	currentForm: ('W' | 'L' | 'D')[]; // Last 5 results
}

export interface WeeklyAward {
	managerId: number;
	managerName: string;
	value: number;
	label: string;
}

export interface GameweekAwards {
	gameweek: number;
	managerOfTheWeek: WeeklyAward;
	benchBlunder: WeeklyAward;
	differentialKing: WeeklyAward | null; // Highest scorer from a player owned only by them
	closestCall: { // Tightest H2H margin
		winner: string;
		loser: string;
		margin: number;
	} | null;
}

export interface WouldHaveBeatGW {
	gameweek: number;
	score: number;
	wouldHaveBeaten: number; // How many managers you would have beaten
	totalManagers: number;
	actualOpponent: string;
	actualResult: 'W' | 'L' | 'D';
	unluckyDraw: boolean; // True if you would have beaten more managers than you lost to
}

export interface ManagerWouldHaveBeat {
	managerId: number;
	managerName: string;
	gameweeks: WouldHaveBeatGW[];
	totalUnluckyWeeks: number; // Weeks where you beat most managers but lost
	averageRank: number; // Average weekly rank (1 = best)
}

export interface H2HData {
	matrix: Map<string, H2HRecord>;
	fixtures: MatchResult[];
	luck: ManagerLuck[];
	stats: RivalryStats;
}

// Fun Stats Types
export interface PlayerGWStats {
	total_points: number;
	minutes: number;
	goals_scored: number;
	assists: number;
	clean_sheets: number;
	goals_conceded: number;
	bonus: number;
	bps: number;
	expected_goals: number;
	expected_assists: number;
	expected_goal_involvements: number;
	expected_goals_conceded: number;
	// Additional fields for holistic luck calculation
	saves: number;
	yellow_cards: number;
	red_cards: number;
	own_goals: number;
	penalties_saved: number;
	penalties_missed: number;
}

export interface FunStatEntry {
	managerId: number;
	managerName: string;
	value: number;
	label: string;
}

export interface FunStats {
	// H2H Tab
	clinicalFinisher: FunStatEntry[];
	assistLuck: FunStatEntry[];
	bonusMagnet: FunStatEntry[];
	smashAndGrab: FunStatEntry[];
	nearlyMan: FunStatEntry[];

	// Overview Tab
	oneManArmy: FunStatEntry[];
	greatWall: FunStatEntry[];

	// Bench Tab
	autoSubLottery: FunStatEntry[];

	// Form Tab
	consistency: FunStatEntry[];
	ceilingFloor: FunStatEntry[];

	// Robbery Report
	robberies: ManagerRobberies[];

	// Luck Breakdown (holistic points-based luck by component)
	luckBreakdown: ManagerLuckBreakdown[];
}

export interface RobberyCulprit {
	playerId: number;
	playerName: string;
	goals: number;
	assists: number;
	expectedGoals: number; // Based on season per-90 average
	expectedAssists: number; // Based on season per-90 average
	actualPoints: number;
	expectedPoints: number;
	luckPoints: number;
}

export interface Robbery {
	gameweek: number;
	opponentId: number;
	opponentName: string;
	yourScore: number;
	theirScore: number;
	margin: number;
	theirTotalLuck: number;
	realScoreline: { you: number; them: number };
	culprit: RobberyCulprit;
	robberyRating: number; // 1-5 stars based on egregiousness
}

export interface ManagerRobberies {
	managerId: number;
	managerName: string;
	robberies: Robbery[];
	totalRobberies: number;
	totalPointsStolen: number;
}

export interface LuckComponentSummary {
	actual: number;
	expected: number;
	luck: number;      // In raw units
	luckPoints: number; // In FPL points
}

export interface ManagerLuckBreakdown {
	managerId: number;
	managerName: string;
	totalLuck: number;
	// Component breakdown (all in points)
	components: {
		appearance: number;
		goals: number;
		assists: number;
		cleanSheets: number;
		goalsConceded: number;
		bonus: number;
		saves: number;
		rareEvents: number; // cards + OGs + penalty saves/misses combined
	};
	// Per-gameweek breakdown
	gameweeks: Array<{
		gameweek: number;
		luck: number;
	}>;
}

export interface WeeklyBanter {
	gameweek: number;
	message: string;
	generatedAt: string;
}
