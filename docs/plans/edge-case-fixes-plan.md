# Edge Case Fixes Implementation Plan

## Overview
Fix the remaining edge cases identified during the calculation review.

## Tasks

### Task 1: Add Position-Based Fallback Rates for New Signings

**Priority**: Important

**Problem**: Players with 0 season minutes have no baseline for main stats (goals, assists, CS, bonus, saves). All their actual output shows as "luck".

**Location**: `src/routes/+page.server.ts`

**Implementation**:
1. Add position fallback rates for main stats to the existing `POSITION_FALLBACK_RATES` constant (lines 71-77)
2. Modify `buildPlayerBaselines()` function to use fallbacks when `seasonMinutes < MIN_MINUTES_THRESHOLD`
3. Use league-average per-90 rates by position:
   - **GK**: goals=0.01, assists=0.02, CS=0.35, bonus=1.5, saves=3.0
   - **DEF**: goals=0.08, assists=0.10, CS=0.35, bonus=1.8, saves=0
   - **MID**: goals=0.15, assists=0.15, CS=0.15, bonus=2.0, saves=0
   - **FWD**: goals=0.35, assists=0.15, CS=0, bonus=2.2, saves=0

**Verification**:
- Build passes (`npm run build`)
- TypeScript compiles (`npx tsc --noEmit`)

---

### Task 2: Fix DGW FDR Averaging

**Priority**: Minor

**Problem**: `getPlayerFDR()` uses `.find()` which only returns the first fixture in a double gameweek.

**Location**: `src/routes/+page.server.ts` lines 191-203

**Implementation**:
1. Modify `getPlayerFDR()` to find ALL fixtures for the team in that gameweek
2. If multiple fixtures (DGW), return the average FDR
3. If single fixture, return that FDR
4. If no fixtures, return 3 (neutral)

**Verification**:
- Build passes (`npm run build`)
- TypeScript compiles (`npx tsc --noEmit`)

---

### Task 3: Update Review Plan Documentation

**Priority**: Minor

**Implementation**:
1. Update `docs/plans/calculation-review-plan.md` to mark edge case fixes as complete
2. Update status from "Minor Issue" / "Known Limitation" to "✓ FIXED"

**Verification**:
- Documentation accurately reflects current state

---

## Execution Notes

- Tasks 1 and 2 are independent and modify different functions
- Task 3 should be done after Tasks 1 and 2 are verified
- All changes should be committed together at the end
