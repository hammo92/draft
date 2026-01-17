# Fun Stats Enhancement Design

**Date:** 2025-12-20
**Purpose:** Entertainment/banter fuel for friend league

---

## Overview

Add 10 playful statistics distributed across existing tabs. Focus on fun labels and leaderboard/personal story formats rather than statistical rigor.

---

## Stats to Implement

### H2H Tab (5 stats)

| Stat Name | Calculation | Format |
|-----------|-------------|--------|
| **The Clinical Finisher / The Spursy** | Goals - xG (positive = clinical, negative = wasteful) | Leaderboard |
| **The Assist Merchant / The Chance Waster's Friend** | Assists - xA (positive = teammates finish well, negative = they miss) | Leaderboard |
| **The Bonus Magnet / The BPS Bridesmaid** | Total bonus points + count of close BPS losses (<3 BPS from bonus) | Leaderboard |
| **The Smash & Grab Artist** | Count of H2H wins when scoring below season average | Leaderboard |
| **The Nearly Man** | Count of H2H losses when scoring above season average | Leaderboard |

### Overview Tab (2 stats)

| Stat Name | Calculation | Format |
|-----------|-------------|--------|
| **The One-Man Army** | % of total points from single highest-scoring player | Leaderboard |
| **The Great Wall / The Sieve** | Clean sheets - expected CS (based on xGC faced) | Leaderboard |

### Bench Tab (1 stat)

| Stat Name | Calculation | Format |
|-----------|-------------|--------|
| **The Auto-Sub Lottery Winner/Loser** | Net points gained/lost from auto-subs activating | Leaderboard |

### Form Tab (2 stats)

| Stat Name | Calculation | Format |
|-----------|-------------|--------|
| **Mr. Consistent / The Rollercoaster** | Standard deviation of weekly scores (low = consistent) | Leaderboard |
| **The Ceiling Raiser / The Floor Dweller** | Highest single GW score / Lowest single GW score | Personal stat |

---

## Data Requirements

### Expanded Live Data Structure

```typescript
interface PlayerGWStats {
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
}
```

No additional API calls needed - expand existing `/api/event/{gw}/live` parsing.

### Output Structure

```typescript
interface FunStatEntry {
  managerId: number;
  managerName: string;
  value: number;
  label: string;  // Formatted for display, e.g., "+4.8 goals"
}

interface FunStats {
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
}
```

---

## Implementation Approach

1. **Expand `liveDataMap`** in `+page.server.ts` to capture full stats
2. **Add `calculateFunStats()` function** that computes all 10 stats
3. **Add `funStats` to page data** returned from load function
4. **Create `FunStatCard.svelte`** component for consistent display
5. **Add stats to relevant tabs** - small leaderboard cards

---

## UI Treatment

- Playful labels (not roast mode, not dry)
- Leaderboard format: rank, name, value, label
- Top entry gets highlighted title ("The Clinical Finisher")
- Bottom entry gets opposite title ("The Spursy")
- Keep cards compact - this is supplementary content

---

## Non-Goals

- Statistical rigor / confidence intervals
- Historical comparisons
- Predictive metrics
- External API integrations
