# Luck Visualizations Design

## Overview

Add interactive charts to the Luck Index section to provide three perspectives:
1. **Comparison** - Who's luckiest/unluckiest in the league
2. **Trends** - How luck changes over time for each manager
3. **Understanding** - Detailed breakdown of expected vs actual

## Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Luck Index                          [Raw ⟷ Centered] │
├─────────────────────────────────────────────────────┤
│  League Lollipop Chart                              │
│  - All managers ranked by luck                      │
│  - Diverging from center zero line                  │
│  - Click to select manager                          │
├─────────────────────────────────────────────────────┤
│  Selected Manager Detail Panel                      │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │ Cumulative Luck Area │  │ GW Breakdown Table   │ │
│  │ Chart (5 GWs)        │  │ (existing)           │ │
│  └──────────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Lollipop Chart Specification

**Purpose:** League-wide comparison of luck values

**Elements:**
- Horizontal orientation, zero line in center
- Sorted by luck value (luckiest at top)
- Each row: manager name, connecting line, dot at value, value label

**Colors (gradient):**
- Negative extreme (-50+): `#ef4444` (red)
- Neutral (0): `#a0a0a0` (gray)
- Positive extreme (+50+): `#22c55e` (green)
- Smooth interpolation between values

**Toggle:**
- Raw mode: Absolute luck values
- Centered mode: Relative to league average (balanced around zero)
- Smooth animation on toggle

**Interactions:**
- Hover: Tooltip with both raw and centered values
- Click: Select manager for detail panel
- Selected state: Highlighted/thicker dot

## Cumulative Area Chart Specification

**Purpose:** Show luck trend over gameweeks for selected manager

**Elements:**
- X-axis: Gameweeks (e.g., 12-16)
- Y-axis: Cumulative luck value
- Area fill with gradient based on final value
- Solid line on top of area
- Dashed zero reference line
- Dots at each GW, hoverable

**Hover tooltip:**
- Gameweek number
- That GW's luck (+/-)
- Running total
- Opponent faced

## Data Changes

Add to `ManagerLuck` type:
```typescript
centeredLuck: number; // seasonLuck minus league average
```

Calculate server-side in `+page.server.ts`:
```typescript
const avgLuck = managerLuck.reduce((sum, m) => sum + m.seasonLuck, 0) / managerLuck.length;
return managerLuck.map(m => ({
  ...m,
  centeredLuck: Math.round((m.seasonLuck - avgLuck) * 10) / 10
}));
```

## Components

```
src/lib/components/h2h/
├── LuckIndex.svelte          (update - add toggle, integrate charts)
├── LuckLollipopChart.svelte  (new)
└── LuckAreaChart.svelte      (new)
```

## Dependencies

- `layerchart` - Svelte-native charting library
- `d3-scale`, `d3-interpolate` - Color gradient (peer deps)

## Responsive Design

- **Desktop:** Side-by-side area chart and table
- **Mobile:** Stacked vertically, chart above table
- **Lollipop:** Full width all sizes

## Accessibility

- Charts include aria-labels with summary
- Position indicates value (left=negative, right=positive)
- Table provides screen reader fallback
