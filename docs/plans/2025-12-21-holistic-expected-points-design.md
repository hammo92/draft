# Holistic Expected Points System Design

## Overview

A comprehensive system to calculate expected FPL points for each player in each gameweek, enabling accurate "luck" measurement across all scoring components.

**Luck = Actual Points - Expected Points**

## Data Model

### PlayerBaseline

Calculated once from season stats:

```typescript
interface PlayerBaseline {
  playerId: number;
  position: 1 | 2 | 3 | 4;  // GK, DEF, MID, FWD
  seasonMinutes: number;

  // Per-90 rates
  goalsPerGame: number;
  assistsPerGame: number;
  cleanSheetsPerGame: number;
  bonusPerGame: number;
  savesPerGame: number;        // GK only

  // Negative events per-90
  yellowsPerGame: number;
  redsPerGame: number;
  ownGoalsPerGame: number;
  penaltiesMissedPerGame: number;
  penaltiesSavedPerGame: number;  // GK only
}
```

### PlayerGameweekLuck

Calculated per player per gameweek:

```typescript
interface LuckComponent {
  actual: number;
  expected: number;
  luck: number;      // actual - expected (in raw units)
  points: number;    // luck converted to FPL points
}

interface PlayerGameweekLuck {
  playerId: number;
  playerName: string;
  gameweek: number;
  position: number;

  // Component breakdown
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
```

## Calculation Formulas

### Constants

```typescript
// Attacking FDR - for OUR expected output (goals, assists)
const FDR_MULTIPLIERS = {
  1: 1.15,  // Easiest - expect 15% more output from OUR players
  2: 1.08,
  3: 1.00,
  4: 0.93,
  5: 0.85   // Hardest - expect 15% less output from OUR players
};

// Defensive FDR - for OPPONENT's expected output (inverted)
// Easy fixture = weaker opponent = less opponent output
const DEFENSIVE_FDR_MULTIPLIERS = {
  1: 0.85,  // Easy fixture = weak opponent = 15% less opponent output
  2: 0.92,
  3: 1.00,
  4: 1.08,
  5: 1.15   // Hard fixture = strong opponent = 15% more opponent output
};

const GOAL_POINTS = { 1: 6, 2: 6, 3: 5, 4: 4 };
const CS_POINTS = { 1: 4, 2: 4, 3: 1, 4: 0 };

const POSITION_FALLBACK_RATES = {
  yellowsPerGame: { 1: 0.05, 2: 0.12, 3: 0.10, 4: 0.08 },
  redsPerGame: { 1: 0.002, 2: 0.004, 3: 0.003, 4: 0.003 },
  ownGoalsPerGame: { 1: 0.002, 2: 0.008, 3: 0.003, 4: 0.002 },
  penaltiesMissedPerGame: { 1: 0.001, 2: 0.002, 3: 0.008, 4: 0.012 },
  penaltiesSavedPerGame: { 1: 0.015, 2: 0, 3: 0, 4: 0 },
};
```

### Expected Points Formulas

| Component | Expected Formula | Point Value | FDR Type |
|-----------|------------------|-------------|----------|
| Goals | `(goalsPerGame × mins/90) × FDR_mult` | `× GOAL_POINTS[pos]` | Attacking |
| Assists | `(assistsPerGame × mins/90) × FDR_mult` | `× 3` | Attacking |
| Clean Sheet | `e^(-opponent_xG × DEF_FDR_mult)` | `× CS_POINTS[pos]` | Defensive |
| Goals Conceded | `opponent_xG × DEF_FDR_mult` | `× -0.5` (GK/DEF) | Defensive |
| Bonus | `bonusPerGame × mins/90` | `× 1` | None |
| Saves | `(savesPerGame × mins/90) × DEF_FDR_mult` | `× 0.333` (GK) | Defensive |
| Yellow Cards | `yellowsPerGame × mins/90` | `× -1` | None |
| Red Cards | `redsPerGame × mins/90` | `× -3` | None |
| Own Goals | `ownGoalsPerGame × mins/90` | `× -2` | None |
| Pens Missed | `pensMissedPerGame × mins/90` | `× -2` | None |
| Pens Saved | `(pensSavedPerGame × mins/90) × DEF_FDR_mult` | `× 5` (GK) | Defensive |

### Clean Sheet Probability

Uses Poisson distribution with defensively-adjusted opponent xG:

```typescript
function getCSProbability(opponentXG: number, fdr: number): number {
  const adjustedXG = opponentXG * DEFENSIVE_FDR_MULTIPLIERS[fdr];
  return Math.exp(-adjustedXG);  // P(0 goals) = e^(-lambda)
}
```

### Hybrid Rate Selection

For negative events, use player's rate if sufficient sample:

```typescript
function getEffectiveRate(
  playerRate: number,
  playerMinutes: number,
  position: number,
  rateType: keyof typeof POSITION_FALLBACK_RATES
): number {
  const MIN_MINUTES_THRESHOLD = 900;  // ~10 full games

  if (playerMinutes >= MIN_MINUTES_THRESHOLD) {
    return playerRate;
  }
  return POSITION_FALLBACK_RATES[rateType][position];
}
```

## Data Requirements

### Additional per-GW stats to extract

```typescript
// Add to PlayerGWStats interface
saves: number;
yellow_cards: number;
red_cards: number;
own_goals: number;
penalties_saved: number;
penalties_missed: number;
```

### Opponent xG source

Use `expected_goals_conceded` from a defender who played 90 mins - this represents the opponent's xG against the team.

## Integration

### Robbery Detection

```typescript
// Calculate total luck for opponent's starting XI
let totalOpponentLuck = 0;
let biggestLuckPlayer = null;

for (const player of opponentStartingXI) {
  const luck = calculatePlayerGameweekLuck(player, gw, opponentXG, fdr);
  totalOpponentLuck += luck.totalLuck;

  if (!biggestLuckPlayer || luck.totalLuck > biggestLuckPlayer.totalLuck) {
    biggestLuckPlayer = luck;
  }
}

const isRobbery = totalOpponentLuck >= margin;
```

### Manager Luck Breakdown

```typescript
interface ManagerLuckBreakdown {
  managerId: number;
  managerName: string;
  totalLuck: number;
  components: {
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    bonus: number;
    saves: number;
    negative: number;  // cards + OGs + pens
  };
  luckiestPlayers: PlayerGameweekLuck[];
  unluckiestPlayers: PlayerGameweekLuck[];
}
```

## Implementation Phases

### Phase 1: Extend data extraction
1. Update `PlayerGWStats` interface with missing fields
2. Update live data fetch to extract saves, cards, own_goals, penalties
3. Verify `expected_goals_conceded` extraction working

### Phase 2: Build baseline system
4. Create comprehensive `PlayerBaseline` interface
5. Create `buildPlayerBaselines()` with all per-90 rates
6. Add `POSITION_FALLBACK_RATES` constant
7. Add `getEffectiveRate()` helper function

### Phase 3: Expected points calculator
8. Create `calculateExpectedPoints()` function
9. Returns full `PlayerGameweekLuck` object
10. Add unit tests with known examples

### Phase 4: Integration
11. Refactor robbery detection to use new system
12. Refactor clinicalFinisher/assistLuck stats
13. Add `ManagerLuckBreakdown` calculation
14. Update types in `fpl.ts`

### Phase 5: Display
15. Update RobberyReport with component breakdown
16. Create LuckBreakdown component for managers
17. Add player-level luck table (sortable)

## Success Criteria

- Luck calculation accounts for all FPL scoring components
- Robbery detection uses points-based luck, not just goals/assists
- UI shows breakdown by component for transparency
- Position-specific logic (CS points, saves, goals conceded) handled correctly
- FDR adjustments applied consistently across attacking and defensive stats
