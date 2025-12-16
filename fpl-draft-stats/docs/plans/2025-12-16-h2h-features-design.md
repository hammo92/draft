# Head-to-Head Features - Design Document

**Created:** 2025-12-16
**Purpose:** Add H2H statistics, rivalry data, and luck index to the FPL Draft Stats app

---

## Overview

Add a new "H2H" tab with three sub-sections:
1. **Matrix** - W-D-L grid between all managers
2. **Fixtures** - Match history by gameweek
3. **Luck Index** - Expected vs actual scores using player median PPG

## Data Structures

### New Types

```typescript
interface H2HRecord {
  manager1Id: number;
  manager2Id: number;
  wins: number;        // manager1 wins
  draws: number;
  losses: number;      // manager1 losses
  pointsFor: number;   // manager1 total points in matchups
  pointsAgainst: number;
}

interface MatchResult {
  gameweek: number;
  manager1: { id: number; name: string; score: number; expected: number };
  manager2: { id: number; name: string; score: number; expected: number };
  winner: number | null;
  margin: number;
}

interface ManagerLuck {
  managerId: number;
  managerName: string;
  gameweeks: Array<{
    gameweek: number;
    actual: number;
    expected: number;      // sum of median PPG for starting XI
    luck: number;          // actual - expected
    opponent: string;
    result: 'W' | 'D' | 'L';
  }>;
  seasonLuck: number;      // sum of weekly luck
}

interface RivalryStats {
  biggestWin: { winner: string; loser: string; margin: number; gameweek: number };
  closestGame: { manager1: string; manager2: string; margin: number; gameweek: number };
  nemesis: Record<number, { managerId: number; managerName: string; losses: number }>;
  victim: Record<number, { managerId: number; managerName: string; wins: number }>;
}
```

## Calculations

### Points Efficiency

```typescript
// How much of your total points actually "counted" in H2H
efficiency = (totalFixturePoints / totalSeasonPoints) * 100
```

### Luck Index

```typescript
// For each player in starting XI (positions 1-11)
// Use MEDIAN (not mean) to avoid outliers skewing expectations
playerMedianPPG = median(allGameweekScores for player this season)

expectedScore = sum of each starting player's median PPG

luck = actualScore - expectedScore
```

**Example:**
- Starting XI medians: [4, 5, 3, 6, 4, 5, 7, 3, 4, 5, 6] = 52 expected
- Actual score: 72
- Luck: +20 (players outperformed expectations)

### Rivalry Stats

- **Biggest win**: largest margin victory in league history
- **Closest game**: smallest non-zero margin
- **Nemesis**: manager who's beaten you most
- **Victim**: manager you've beaten most

## UI Components

### New Tab Structure

```
H2H (main tab)
├── Matrix (sub-tab)
├── Fixtures (sub-tab)
└── Luck (sub-tab)
```

### Matrix View

```
┌────────────────────────────────────────────────────┐
│ Head-to-Head Records                               │
│ SEASON MATCHUP GRID                                │
├──────┬──────┬──────┬──────┬──────┬──────┬─────────┤
│      │ Ben M│ Ben T│ Tom  │ James│ ...  │         │
├──────┼──────┼──────┼──────┼──────┼──────┼─────────┤
│Ben M │  -   │ 2-0-1│ 1-1-1│ 3-0-0│      │         │
│Ben T │ 1-0-2│  -   │ 2-1-0│ 1-0-2│      │         │
└──────┴──────┴──────┴──────┴──────┴──────┴─────────┘
```

- Format: W-D-L
- Green background: winning record
- Red background: losing record
- Neutral: even record

### Fixtures View

```
┌────────────────────────────────────────────────────┐
│ GW 16                                              │
│ ┌─────────────────────────────────────────────┐   │
│ │ Ben M        72 - 58        Ben Taylor      │   │
│ │ Tom H        45 - 45        James           │   │
│ └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

- Winner's score in accent color
- Draw: both scores in neutral color
- Grouped by gameweek, most recent first

### Luck View

```
┌────────────────────────────────────────────────────┐
│ [Manager Selector: Ben M ▼]                        │
│                                                    │
│  GW   ACTUAL  EXPECTED  LUCK   OPP      RESULT    │
│  16     72      58      +14   Ben T       W       │
│  15     65      61       +4   Tom H       L       │
│                                                    │
│  SEASON TOTAL:  +42 (Luckiest in league!)         │
└────────────────────────────────────────────────────┘
```

- Luck column: green for positive, red for negative
- Season total with rank ("Luckiest", "Unluckiest", etc.)

## Files to Create

```
src/lib/components/h2h/
  H2HStats.svelte           # Wrapper with sub-tabs
  H2HMatrix.svelte          # Grid of W-D-L records
  FixtureHistory.svelte     # Match results by gameweek
  LuckIndex.svelte          # Expected vs actual breakdown
```

## Files to Modify

- `src/routes/+page.server.ts` - Add H2H data calculations
- `src/routes/+page.svelte` - Add H2H tab
- `src/lib/types/fpl.ts` - Add new type definitions

## Styling

Follows existing design system:
- Serif headings (Playfair Display)
- Monospace labels and numbers (JetBrains Mono)
- Teal accent color for highlights
- Cards with accent-bar borders
- Dark mode optimized
