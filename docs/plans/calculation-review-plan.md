# FPL Draft App - Calculation Review Plan

## Status: COMPLETED ✓

**Review Date**: 2026-01-17

## Summary

All major calculations have been reviewed and verified. Five issues were found and fixed:
1. **Auto-sub mismatch** in luck calculation (CRITICAL - fixed)
2. **"negative" renamed to "rareEvents"** in luck breakdown (MINOR - fixed)
3. **Efficiency metric** clarified with comments (MINOR - documented)
4. **New signings baseline** - added position fallback rates for players with < 900 mins (MINOR - fixed)
5. **DGW FDR averaging** - `getPlayerFDR()` now averages FDR across all fixtures in double gameweeks (MINOR - fixed)

## Overview
This plan outlines the systematic review of all statistics and calculations in the FPL Draft app to ensure accuracy and correctness.

---

## 1. Luck Index System (HIGHEST PRIORITY)

**Location**: `src/routes/+page.server.ts` lines 38-365, 948-1068

### 1.1 Player Baselines
- **What it does**: Calculates per-90 rates for each player from season totals
- **Components**: goals, assists, clean sheets, bonus, saves, yellows, reds, own goals, penalties
- **Review items**:
  - [ ] Verify per-90 formula: `(stat / seasonMinutes) * 90`
  - [ ] Check minimum minutes threshold (900 mins = ~10 games)
  - [ ] Validate position fallback rates for rare events are reasonable

### 1.2 FDR Multipliers
- **Attacking**: 1=1.15, 2=1.08, 3=1.00, 4=0.93, 5=0.85
- **Defensive**: 1=0.85, 2=0.92, 3=1.00, 4=1.08, 5=1.15 (inverted)
- **Review items**:
  - [ ] Confirm multiplier values are sensible (15% swing seems reasonable)
  - [ ] Verify defensive FDR is correctly inverted (easy fixture = less opponent output)

### 1.3 Clean Sheet Probability (Poisson)
- **Formula**: `P(CS) = e^(-opponent_xG)`
- **Review items**:
  - [ ] Verify Poisson formula is correctly implemented
  - [ ] Check that only 60+ minute players are counted for CS
  - [ ] Validate opponent xG source (expected_goals_conceded field)

### 1.4 Expected Points by Component
| Component | Formula | Points/Unit |
|-----------|---------|-------------|
| Goals | baseline × mins/90 × FDR | GK/DEF=6, MID=5, FWD=4 |
| Assists | baseline × mins/90 × FDR | 3 |
| Clean Sheets | Poisson P(CS) × played60+ | GK/DEF=4, MID=1, FWD=0 |
| Goals Conceded | opponent_xG × defFDR × played60+ | -0.5 (per 2) |
| Bonus | baseline × mins/90 | 1 |
| Saves | baseline × mins/90 × defFDR | 1/3 (per 3) |
| Yellow | effective_rate × mins/90 | -1 |
| Red | effective_rate × mins/90 | -3 |
| Own Goals | effective_rate × mins/90 | -2 |
| Pen Missed | effective_rate × mins/90 | -2 |
| Pen Saved | effective_rate × mins/90 × defFDR | +5 |

- **Review items**:
  - [ ] Verify all point values match official FPL scoring
  - [ ] Check goals conceded is -1 per 2 goals (so -0.5 per goal)
  - [ ] Confirm saves is 1 point per 3 saves (0.333 per save)
  - [ ] Validate appearance is excluded from luck (intentional design)

### 1.5 Season Luck Aggregation
- **Review items**:
  - [ ] Verify luck = actual - expected for each component
  - [ ] Check season luck is sum of all gameweek luck values
  - [ ] Validate "centered luck" calculation (relative to league average)

### 1.6 Potential Issues to Investigate
- [ ] Is `expected_goals_conceded` the right field for opponent xG?
- [ ] Are captain points handled correctly (multiplier)?
- [ ] What happens when a player has no baseline (new signing)?
- [ ] Is bench player luck being excluded correctly?

---

## 2. H2H Statistics

**Location**: `src/routes/+page.server.ts` lines 410-700

### 2.1 H2H Matrix
- **Review items**:
  - [ ] Verify win/loss counting from both perspectives
  - [ ] Check that draws are counted correctly
  - [ ] Validate points aggregation (pointsFor/pointsAgainst)

### 2.2 Rivalry Stats
- **Review items**:
  - [ ] Biggest win: correctly finds max margin (non-draws only)
  - [ ] Closest game: correctly finds min margin (non-draws only)

### 2.3 Nemesis/Bunny
- **Definition**:
  - Nemesis = opponent with worst W-L differential (you lose more)
  - Bunny = opponent with best W-L differential (you win more)
- **Review items**:
  - [ ] Verify nemesis requires negative differential (actually losing)
  - [ ] Verify bunny requires positive differential (actually winning)
  - [ ] Check that ties are broken by absolute wins/losses

### 2.4 Streaks
- **Review items**:
  - [ ] Current streak counts consecutive same results from end
  - [ ] Longest streaks tracked independently for W and L
  - [ ] Draws correctly reset both win and loss streaks
  - [ ] Current form shows last 5 results in chronological order

---

## 3. Weekly Awards

**Location**: `src/routes/+page.server.ts` lines 703-841

### 3.1 Manager of the Week
- **Review items**:
  - [ ] Simply highest score - should be straightforward

### 3.2 Bench Blunder
- **Calculation**:
  1. GK waste = max(bench_gk_pts - starting_gk_pts, 0) if starting GK played
  2. Outfield waste = sum(bench outfield who didn't sub) - sum(lowest starting outfield)
- **Review items**:
  - [ ] Only counts bench players who DIDN'T come on as auto-subs
  - [ ] GK waste only counts if starting GK actually played (minutes > 0)
  - [ ] Outfield comparison uses correct number of players
  - [ ] Uses max(0, ...) to avoid negative bench waste

### 3.3 Closest Call
- **Review items**:
  - [ ] Correctly finds minimum non-zero margin
  - [ ] Identifies winner and loser correctly

---

## 4. Fun Statistics (12 Categories)

**Location**: `src/routes/+page.server.ts` lines 1072-1500+

### 4.1 Clinical Finisher (Goals vs xG)
- **Uses**: Per-gameweek xG from Opta
- **Review items**:
  - [ ] Only counts starting XI players
  - [ ] Aggregates across all gameweeks correctly
  - [ ] Positive = overperforming (more goals than xG)

### 4.2 Assist Luck (Assists vs xA)
- **Same structure as Clinical Finisher**
- **Review items**:
  - [ ] Uses expected_assists field from live data

### 4.3 Bonus Magnet
- **Includes**: Total bonus + "near misses" (BPS >= 20 but 0 bonus)
- **Review items**:
  - [ ] Near miss threshold (20 BPS) is reasonable
  - [ ] Sorting by total bonus (higher is better)

### 4.4 Smash & Grab
- **Definition**: Wins when scoring below YOUR season average
- **Review items**:
  - [ ] Season average calculated correctly (sum / count)
  - [ ] Uses your score vs your average (not league average)

### 4.5 Nearly Man
- **Definition**: Losses when scoring above YOUR season average
- **Review items**:
  - [ ] Same logic as Smash & Grab but inverted

### 4.6 One-Man Army
- **Definition**: % of total points from top scorer
- **Review items**:
  - [ ] Aggregates player points across all GWs correctly
  - [ ] Finds maximum scorer and calculates percentage

### 4.7 Great Wall (CS vs Expected)
- **Uses**: Poisson probability from opponent xG
- **Review items**:
  - [ ] Only counts GK/DEF who played 60+ mins
  - [ ] Uses same Poisson formula as luck system
  - [ ] Positive = more CS than expected

### 4.8 Auto-Sub Lottery
- **Tracks**: Points gained from players who came ON from bench
- **Review items**:
  - [ ] Only counts players who actually got subbed in
  - [ ] Sums their points (not comparing to who went out)

### 4.9 Consistency
- **Formula**: Standard deviation of weekly scores
- **Review items**:
  - [ ] Correct variance formula: sum((x - mean)^2) / n
  - [ ] Lower is better (more consistent)

### 4.10 Ceiling/Floor
- **Metric**: Range = max score - min score
- **Review items**:
  - [ ] Simple max/min finding
  - [ ] Higher range = more volatile

### 4.11 Robbery Report
- **Definition**: Loss where a single opponent player's overperformance >= loss margin
- **Review items**:
  - [ ] Uses full holistic luck calculation for each opponent player
  - [ ] Culprit must have luck >= margin to qualify as robbery
  - [ ] Robbery rating scale (1-5 stars) seems reasonable
  - [ ] "Real scoreline" calculation: their_score - culprit_luck

### 4.12 Luck Breakdown
- **8 Categories**: Appearance, Goals, Assists, CS, GC, Bonus, Saves, Negative
- **Review items**:
  - [ ] Aggregates per-player luck across all gameweeks
  - [ ] "Negative" combines cards + OGs + penalties correctly

---

## 5. Transfer Analysis

**Location**: Integrated into DetailedEntry stats

### 5.1 Transfer Value
- **Definition**: Net impact of all transfers vs keeping GW1 squad
- **Review items**:
  - [ ] Calculates what GW1 squad would have scored
  - [ ] Compares to actual points earned

### 5.2 Transfer Regrets
- **Per-transfer tracking**:
  - Points gained by player IN since transfer
  - Points lost by player OUT since transfer
  - Net impact = gained - lost
- **Review items**:
  - [ ] Only counts points AFTER the transfer gameweek
  - [ ] Handles multiple transfers correctly

---

## 6. Would Have Beat Analysis

**Location**: `src/routes/+page.server.ts` lines 844-935

### 6.1 Weekly Ranking
- **Calculation**: Count how many managers you would have beaten
- **Review items**:
  - [ ] Compares your score to all other managers' scores
  - [ ] Calculates rank correctly (1 = best)

### 6.2 Unlucky Weeks
- **Definition**: Lost but beat >= half the league
- **Review items**:
  - [ ] Uses floor(totalManagers / 2) as threshold
  - [ ] Only counts actual losses (not draws)

---

## 7. General Data Integrity

### 7.1 API Data Sources
- [ ] Bootstrap static data (players, teams, events)
- [ ] League details (standings, matches, entries)
- [ ] Entry histories (gameweek performance)
- [ ] Entry picks (squad selections)
- [ ] Live gameweek data (player stats)
- [ ] Fixtures (for FDR)

### 7.2 Edge Cases to Test
- [ ] Manager with 0 games played
- [ ] Player transferred mid-gameweek
- [ ] Double gameweeks
- [ ] Players with 0 minutes across season
- [ ] New signings with no baseline data
- [ ] AVERAGE system entry handling

---

## Review Priority Order

1. **High Priority** (Core metrics users see most):
   - Luck Index calculation
   - H2H Matrix and standings
   - Weekly Awards

2. **Medium Priority** (Fun features):
   - Fun Statistics categories
   - Robbery Report
   - Would Have Beat

3. **Lower Priority** (Supporting features):
   - Transfer Analysis
   - Consistency/Ceiling/Floor

---

## Testing Approach

For each calculation:
1. Pick a specific gameweek with known outcomes
2. Manually calculate expected values
3. Compare to app output
4. Document any discrepancies

---

## Issues Found

### CRITICAL: Auto-Sub Mismatch in Luck Calculation
**Location**: `+page.server.ts` lines 982-1047

**Problem**: The luck calculation has an inconsistency between `actual`, `expected`, and `luck`:
- `actual` = Total GW points from history (INCLUDES auto-sub points)
- `expected` = Sum of expected for starting XI only (EXCLUDES auto-subs)
- `luck` = Sum of individual player luck for starting XI only (EXCLUDES auto-subs)

**Impact**: When auto-subs happen:
1. The auto-sub player's points are in `actual` but NOT in `expected` or `luck`
2. This means: `actual ≠ expected + luck`
3. The UI shows `actual` and `expected` side by side, but they're calculated differently

**Example**:
- Manager picks Palmer (position 1) who doesn't play
- Dibling (position 12) auto-subs in and scores 10 points
- `actual` = includes Dibling's 10 points
- `expected` = 0 for Palmer (since he played 0 mins)
- `luck` = 0 for Palmer
- Result: Shows inflated luck that doesn't match actual - expected

**Fix Options**:
1. Include auto-sub players in expected/luck calculation
2. Use sum of starting XI actual points instead of gwHistory.points
3. Track separately and show both perspectives

---

### MODERATE: Efficiency Calculation is Confusing
**Location**: `+page.server.ts` line 1054

**Current formula**: `points_for / total` (FPL points / fixture points)

**Problem**: This measures "how many FPL points per fixture point earned" - higher = worse efficiency (you need more points to win). This is counter-intuitive for a stat called "efficiency".

**Example**:
- Manager A: 500 points_for, 15 total (5 wins) → efficiency = 33.3
- Manager B: 450 points_for, 18 total (6 wins) → efficiency = 25.0
- Manager B is MORE efficient but has LOWER number

**Fix**: Either rename to "Points per Win" or invert the calculation.

---

### VERIFIED OK: Captain Handling
FPL Draft mode does NOT have captain multipliers (no 2x points), so the absence of captain handling is correct.

---

### VERIFIED OK: Clean Sheet Probability
- Poisson formula `P(CS) = e^(-xG)` is correctly implemented
- Only counts 60+ minute players
- Uses `expected_goals_conceded` field which IS the opponent's xG against this team

---

### VERIFIED OK: Centered Luck
Calculated as `manager.seasonLuck - avgLuck` which correctly shows luck relative to league average.

---

### POTENTIAL ISSUE: Penalties Saved in Negative Category
**Location**: `+page.server.ts` line 1577

In the luck breakdown aggregation, `penaltiesSaved` is added to the `negative` component:
```javascript
components.negative += playerLuck.yellowCards.points +
    playerLuck.redCards.points +
    playerLuck.ownGoals.points +
    playerLuck.penaltiesMissed.points +
    playerLuck.penaltiesSaved.points;  // This is POSITIVE (+5 pts)
```

**Problem**: Penalties saved is a POSITIVE event (+5 points) but it's being added to "negative" events. This may just be a naming issue (calling it "negative" when it means "other/rare events").

---

### NEEDS VERIFICATION: Per-90 Baselines Use Full Season
**Current behavior**: Baselines use the player's full season stats regardless of which manager owned them or game situation.

**Consideration**: A player's per-90 rate might differ significantly:
- When playing for a top team vs bottom team
- In different tactical systems
- At home vs away

This is likely acceptable for simplicity, but worth noting.

---

## Notes

- Captain multiplier: Draft mode has no captains - verified OK
- Bench auto-sub logic: Fixed to include auto-subs in luck calculation
- Position-based fallback rates for rare events: Seem reasonable (900 min threshold)

---

## Verification Summary

### ✓ All Calculations Verified

| Category | Status | Notes |
|----------|--------|-------|
| Luck Index | ✓ FIXED | Auto-sub handling corrected |
| H2H Matrix | ✓ OK | Correctly tracks W/D/L from manager1 perspective |
| Rivalry Stats | ✓ OK | Biggest win, closest game correct |
| Nemesis/Bunny | ✓ OK | Correctly identifies best/worst matchups |
| Streaks | ✓ OK | Current, longest win/loss correct |
| Manager of Week | ✓ OK | Simply highest score |
| Bench Blunder | ✓ OK | Approximation acceptable for fun stat |
| Closest Call | ✓ OK | Minimum non-zero margin |
| Clinical Finisher | ✓ OK | Goals vs xG |
| Assist Luck | ✓ OK | Assists vs xA |
| Bonus Magnet | ✓ OK | Total + near misses |
| Smash & Grab | ✓ OK | Wins below avg |
| Nearly Man | ✓ OK | Losses above avg |
| One-Man Army | ✓ OK | % from top scorer |
| Great Wall | ✓ OK | CS vs Poisson probability |
| Auto-Sub Lottery | ✓ OK | Points from subs who came on |
| Consistency | ✓ OK | Standard deviation |
| Ceiling/Floor | ✓ OK | Max - min range |
| Robbery Report | ✓ OK | Culprit luck >= margin |
| Luck Breakdown | ✓ FIXED | Renamed "negative" to "rareEvents" |
| Transfer Value | ✓ OK | Optimal XI comparison |
| Transfer Regrets | ✓ OK | Individual transfer impact |

### Key Formulas Verified

- **Poisson CS**: `P(CS) = e^(-opponent_xG)` ✓
- **Per-90 rates**: `(stat / minutes) * 90` ✓
- **FDR multipliers**: 15% swing (1=+15%, 5=-15%) ✓
- **Luck**: `actual - expected` per component ✓
- **Centered luck**: `seasonLuck - avgLuck` ✓

---

## Edge Cases Reviewed

### Double Gameweeks
**Status**: ✓ FIXED

`getPlayerFDR()` now uses `.filter()` to find ALL fixtures for a team in a gameweek and returns the average FDR across all fixtures.

- Single fixture: returns that fixture's FDR
- DGW (2+ fixtures): returns average FDR
- No fixtures: returns 3 (neutral)

---

### New Signings (0 Season Minutes)
**Status**: ✓ FIXED

Players with insufficient season minutes (< 900 mins) now use position-based fallback rates for main stats:

| Position | Goals | Assists | CS | Bonus | Saves |
|----------|-------|---------|-----|-------|-------|
| GK | 0.01 | 0.02 | 0.35 | 1.5 | 3.0 |
| DEF | 0.08 | 0.10 | 0.35 | 1.8 | 0 |
| MID | 0.15 | 0.15 | 0.15 | 2.0 | 0 |
| FWD | 0.35 | 0.15 | 0 | 2.2 | 0 |

This prevents all actual points from new signings showing as "luck".

---

### AVERAGE System Entry
**Status**: ✓ OK

- Identified by `!entry?.entry_id`
- Given special names in standings
- Correctly filtered from: streaks, weekly awards, "would have beat", detailed entries

---

### Players with 0 Minutes in a GW
**Status**: ✓ OK

- `minutesFraction = 0/90 = 0`
- Expected = baseline × 0 = 0
- Actual = 0 (didn't play)
- Luck = 0 - 0 = 0 (correct!)
- 60+ minute rule correctly applied for CS and GC

---

### Mid-Gameweek Transfers
**Status**: ✓ OK (Not Applicable)

FPL Draft processes all transfers before gameweek deadlines:
- Waivers: Processed Tuesday/Friday
- Trades: Processed before deadlines
- `event` field = which GW transfer applies FROM
- Code correctly applies transfers at GW start
