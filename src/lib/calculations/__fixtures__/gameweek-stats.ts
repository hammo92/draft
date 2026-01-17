import type { GWStats } from '../types';

// Different GW stats scenarios for testing

// Normal game - 90 mins, 1 goal, 1 assist, clean sheet
export const normalGameStats: GWStats = {
	total_points: 15,
	minutes: 90,
	goals_scored: 1,
	assists: 1,
	clean_sheets: 1,
	goals_conceded: 0,
	bonus: 3,
	expected_goals_conceded: 1.2,
	saves: 0,
	yellow_cards: 0,
	red_cards: 0,
	own_goals: 0,
	penalties_saved: 0,
	penalties_missed: 0
};

// Haul game - big return
export const haulGameStats: GWStats = {
	total_points: 24,
	minutes: 90,
	goals_scored: 3,
	assists: 1,
	clean_sheets: 0,
	goals_conceded: 2,
	bonus: 3,
	expected_goals_conceded: 1.5,
	saves: 0,
	yellow_cards: 0,
	red_cards: 0,
	own_goals: 0,
	penalties_saved: 0,
	penalties_missed: 0
};

// Blank game - no returns
export const blankGameStats: GWStats = {
	total_points: 2,
	minutes: 90,
	goals_scored: 0,
	assists: 0,
	clean_sheets: 0,
	goals_conceded: 3,
	bonus: 0,
	expected_goals_conceded: 1.0,
	saves: 0,
	yellow_cards: 0,
	red_cards: 0,
	own_goals: 0,
	penalties_saved: 0,
	penalties_missed: 0
};

// GK clean sheet game
export const gkCleanSheetStats: GWStats = {
	total_points: 10,
	minutes: 90,
	goals_scored: 0,
	assists: 0,
	clean_sheets: 1,
	goals_conceded: 0,
	bonus: 2,
	expected_goals_conceded: 1.5, // Team was expected to concede
	saves: 5,
	yellow_cards: 0,
	red_cards: 0,
	own_goals: 0,
	penalties_saved: 0,
	penalties_missed: 0
};

// GK penalty save game
export const gkPenaltySaveStats: GWStats = {
	total_points: 12,
	minutes: 90,
	goals_scored: 0,
	assists: 0,
	clean_sheets: 1,
	goals_conceded: 0,
	bonus: 2,
	expected_goals_conceded: 2.0,
	saves: 6,
	yellow_cards: 0,
	red_cards: 0,
	own_goals: 0,
	penalties_saved: 1,
	penalties_missed: 0
};

// Red card game
export const redCardStats: GWStats = {
	total_points: -1,
	minutes: 45,
	goals_scored: 0,
	assists: 0,
	clean_sheets: 0,
	goals_conceded: 2,
	bonus: 0,
	expected_goals_conceded: 1.0,
	saves: 0,
	yellow_cards: 0,
	red_cards: 1,
	own_goals: 0,
	penalties_saved: 0,
	penalties_missed: 0
};

// Own goal game
export const ownGoalStats: GWStats = {
	total_points: 0,
	minutes: 90,
	goals_scored: 0,
	assists: 0,
	clean_sheets: 0,
	goals_conceded: 2,
	bonus: 0,
	expected_goals_conceded: 1.0,
	saves: 0,
	yellow_cards: 1,
	red_cards: 0,
	own_goals: 1,
	penalties_saved: 0,
	penalties_missed: 0
};

// Penalty miss game
export const penaltyMissStats: GWStats = {
	total_points: 6,
	minutes: 90,
	goals_scored: 1,
	assists: 0,
	clean_sheets: 0,
	goals_conceded: 1,
	bonus: 0,
	expected_goals_conceded: 1.0,
	saves: 0,
	yellow_cards: 0,
	red_cards: 0,
	own_goals: 0,
	penalties_saved: 0,
	penalties_missed: 1
};

// Cameo appearance (sub on, < 60 mins)
export const cameoStats: GWStats = {
	total_points: 3,
	minutes: 25,
	goals_scored: 0,
	assists: 1,
	clean_sheets: 0, // Doesn't count for CS if < 60 mins
	goals_conceded: 0,
	bonus: 0,
	expected_goals_conceded: 0.5,
	saves: 0,
	yellow_cards: 0,
	red_cards: 0,
	own_goals: 0,
	penalties_saved: 0,
	penalties_missed: 0
};

// Zero minutes (didn't play)
export const didNotPlayStats: GWStats = {
	total_points: 0,
	minutes: 0,
	goals_scored: 0,
	assists: 0,
	clean_sheets: 0,
	goals_conceded: 0,
	bonus: 0,
	expected_goals_conceded: 0,
	saves: 0,
	yellow_cards: 0,
	red_cards: 0,
	own_goals: 0,
	penalties_saved: 0,
	penalties_missed: 0
};

// DEF clean sheet with goal
export const defCleanSheetGoalStats: GWStats = {
	total_points: 15,
	minutes: 90,
	goals_scored: 1,
	assists: 0,
	clean_sheets: 1,
	goals_conceded: 0,
	bonus: 3,
	expected_goals_conceded: 1.0,
	saves: 0,
	yellow_cards: 0,
	red_cards: 0,
	own_goals: 0,
	penalties_saved: 0,
	penalties_missed: 0
};
