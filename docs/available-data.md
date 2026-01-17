# FPL Draft - Available Data Reference

This document outlines all data available from the FPL API for building statistics and metrics.

---

## 1. Live Gameweek Data (Per Player, Per GW)

Endpoint: `https://draft.premierleague.com/api/event/{gw}/live`

### Scoring Stats
| Field | Type | Description |
|-------|------|-------------|
| `total_points` | number | Final FPL points for this GW |
| `minutes` | number | Minutes played (0-90+) |
| `goals_scored` | number | Goals scored |
| `assists` | number | Assists |
| `clean_sheets` | number | 1 if clean sheet, 0 otherwise |
| `bonus` | number | Bonus points awarded (0-3) |
| `bps` | number | Raw Bonus Points System score |

### Expected Stats (xG Data)
| Field | Type | Description |
|-------|------|-------------|
| `expected_goals` | number | xG - expected goals based on chances |
| `expected_assists` | number | xA - expected assists |
| `expected_goal_involvements` | number | xGI - combined xG + xA |
| `expected_goals_conceded` | number | xGC - expected goals conceded (defensive) |

### Defensive Stats
| Field | Type | Description |
|-------|------|-------------|
| `goals_conceded` | number | Actual goals conceded |
| `saves` | number | Goalkeeper saves |
| `penalties_saved` | number | Penalties saved by GK |
| `clearances_blocks_interceptions` | number | CBI - defensive actions |
| `recoveries` | number | Ball recoveries |
| `tackles` | number | Tackles made |
| `defensive_contribution` | number | Composite defensive metric |

### Performance Indices
| Field | Type | Description |
|-------|------|-------------|
| `influence` | number | FPL influence rating |
| `creativity` | number | FPL creativity rating |
| `threat` | number | FPL threat rating |
| `ict_index` | number | Combined ICT index |

### Negative Events
| Field | Type | Description |
|-------|------|-------------|
| `yellow_cards` | number | Yellow cards received |
| `red_cards` | number | Red cards received |
| `own_goals` | number | Own goals scored |
| `penalties_missed` | number | Penalties missed |

### Other
| Field | Type | Description |
|-------|------|-------------|
| `starts` | number | 1 if started, 0 if sub |
| `in_dreamteam` | boolean | Selected for GW dream team |

---

## 2. Player Season Data (Bootstrap)

Endpoint: `https://draft.premierleague.com/api/bootstrap-static`

### Identity
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique player ID |
| `web_name` | string | Display name (e.g., "Salah") |
| `first_name` | string | First name |
| `second_name` | string | Surname |
| `team` | number | Team ID |
| `element_type` | number | Position: 1=GK, 2=DEF, 3=MID, 4=FWD |

### Season Totals
| Field | Type | Description |
|-------|------|-------------|
| `total_points` | number | Season total points |
| `minutes` | number | Total minutes played |
| `goals_scored` | number | Season goals |
| `assists` | number | Season assists |
| `clean_sheets` | number | Season clean sheets |
| `goals_conceded` | number | Season goals conceded |
| `own_goals` | number | Season own goals |
| `penalties_saved` | number | Season penalties saved |
| `penalties_missed` | number | Season penalties missed |
| `yellow_cards` | number | Season yellow cards |
| `red_cards` | number | Season red cards |
| `saves` | number | Season saves |
| `bonus` | number | Season bonus points |
| `bps` | number | Season BPS total |

### Averages & Form
| Field | Type | Description |
|-------|------|-------------|
| `form` | string | Recent form rating (parsed as float) |
| `points_per_game` | string | Average PPG (parsed as float) |
| `influence` | string | Season influence |
| `creativity` | string | Season creativity |
| `threat` | string | Season threat |
| `ict_index` | string | Season ICT index |

---

## 3. Player History (Per Player)

Endpoint: `https://fantasy.premierleague.com/api/element-summary/{player_id}/`

Returns array of gameweek performances with:
- `round` - Gameweek number
- `total_points` - Points scored
- `minutes` - Minutes played
- All stats from Live Data section above

---

## 4. Fixture Data

Endpoint: `https://draft.premierleague.com/api/bootstrap-static` (fixtures array)

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Fixture ID |
| `event` | number | Gameweek number |
| `team_h` | number | Home team ID |
| `team_a` | number | Away team ID |
| `team_h_difficulty` | number | FDR for home team (1-5) |
| `team_a_difficulty` | number | FDR for away team (1-5) |
| `finished` | boolean | Has match been played |
| `team_h_score` | number | Home team goals |
| `team_a_score` | number | Away team goals |

---

## 5. Manager/Entry Data

### Entry History
Endpoint: `https://draft.premierleague.com/api/entry/{entry_id}/history`

| Field | Type | Description |
|-------|------|-------------|
| `event` | number | Gameweek |
| `points` | number | GW points scored |
| `rank` | number | Overall rank that GW |

### Entry Picks (Per GW)
Endpoint: `https://draft.premierleague.com/api/entry/{entry_id}/event/{gw}`

| Field | Type | Description |
|-------|------|-------------|
| `picks` | array | Array of 15 player picks |
| `picks[].element` | number | Player ID |
| `picks[].position` | number | Squad position (1-11 = starting, 12-15 = bench) |

---

## 6. League Data

Endpoint: `https://draft.premierleague.com/api/league/{league_id}/details`

### Standings
| Field | Type | Description |
|-------|------|-------------|
| `rank` | number | Current league position |
| `matches_won` | number | H2H wins |
| `matches_drawn` | number | H2H draws |
| `matches_lost` | number | H2H losses |
| `points_for` | number | Total FPL points scored |
| `points_against` | number | Total FPL points conceded |
| `total` | number | H2H points (3W + 1D) |

### Matches
| Field | Type | Description |
|-------|------|-------------|
| `event` | number | Gameweek |
| `league_entry_1` | number | Manager 1 ID |
| `league_entry_2` | number | Manager 2 ID |
| `league_entry_1_points` | number | Manager 1 GW points |
| `league_entry_2_points` | number | Manager 2 GW points |
| `finished` | boolean | Match completed |

---

## 7. Transactions/Waivers

Endpoint: `https://draft.premierleague.com/api/draft/league/{league_id}/transactions`

| Field | Type | Description |
|-------|------|-------------|
| `element_in` | number | Player ID transferred in |
| `element_out` | number | Player ID transferred out |
| `entry` | number | Manager entry ID |
| `event` | number | Gameweek of transfer |
| `result` | string | "a" = accepted |

---

## Data Availability Summary

| Data Type | Granularity | Historical |
|-----------|-------------|------------|
| Live stats | Per player, per GW | Yes (all completed GWs) |
| xG/xA data | Per player, per GW | Yes |
| Player totals | Season cumulative | Current season |
| Fixtures/FDR | Per match | Yes |
| Manager picks | Per GW | Yes |
| H2H results | Per GW | Yes |
| Transactions | Per event | Yes |
