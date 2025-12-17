# FPL Draft Stats - Implementation Details

## API Structure & Types

### Key Findings

After analyzing the actual FPL Draft API responses, we discovered:

1. **No Direct Standings Endpoint**: The API doesn't provide a ready-made standings table. We calculate it from:
   - Match results (`matches` array in league details)
   - Entry histories (total points)

2. **History Structure**: The entry history response structure is:
   ```json
   {
     "history": [...],  // Array of gameweek data
     "entry": {...}     // Entry info
   }
   ```
   Not `{ current: [...] }` as initially assumed.

3. **Transactions Require Auth**: The `/transactions` endpoint requires authentication, so transfer history cannot be fetched without user login.

4. **Null Entries**: Some leagues have placeholder entries with `null` values that must be filtered out.

## Type Definitions

Created comprehensive TypeScript types in `src/lib/types/fpl.ts`:

- `Bootstrap` - Main player/team/gameweek data
- `LeagueDetails` - League info, entries, and matches
- `EntryHistory` - Manager's gameweek-by-gameweek performance
- `EntryEventPicks` - Team picks for a specific gameweek
- `Standing` - Calculated standings with wins/draws/losses
- `DetailedEntry` - Enriched entry with history, picks, and stats

## Data Fetching Strategy

### 1. Initial Data Load
- Fetch bootstrap (all players, teams, gameweeks)
- Fetch league details (entries, matches)

### 2. Per-Manager Data
- Fetch history for each manager
- Calculate standings from matches + histories
- Fetch recent picks (last 5 gameweeks)

### 3. Calculated Stats
For each manager we calculate:
- **Form**: Last 5 gameweek scores
- **Average Points**: Total points / gameweeks played
- **Bench Points**: Points left unused (from history `points_on_bench`)
- **Bench Points by Gameweek**: Breakdown for visualization

## Features Implemented

### ✅ Working Features

1. **Overview Tab**
   - League standings (calculated from matches)
   - Manager cards with stats
   - League information

2. **Form Charts**
   - Last 5 gameweeks visualization
   - Color-coded bars by performance level
   - Trend indicators

3. **Bench Points Tracker**
   - Leaderboard of wasted points
   - Per-gameweek breakdown
   - Uses `points_on_bench` from history

4. **Weekly Performance**
   - Gameweek selector
   - Full season grid
   - Color-coded scores

5. **Manager Comparison**
   - Side-by-side comparison
   - Multiple metrics
   - Form visualization

6. **Player Ownership**
   - Searchable/filterable player list
   - Ownership details
   - Starting vs bench status

### ⚠️ Limited Features

7. **Transfer History**
   - Shows unavailable notice (requires auth)
   - Provides workaround instructions
   - Could be enhanced if authentication is added

## Standings Calculation

The standings are calculated using this logic:

```typescript
1. Initialize standings from entry histories (for total points)
2. Process each finished match:
   - Increment played count
   - Award wins/draws/losses based on match points
3. Sort by total points
4. Assign ranks
```

## API Endpoints Used

### Public (No Auth)
- `fantasy.premierleague.com/api/bootstrap-static/`
- `draft.premierleague.com/api/league/{id}/details`
- `draft.premierleague.com/api/entry/{id}/history`
- `draft.premierleague.com/api/entry/{id}/event/{gw}`

### Requires Auth (Not Used)
- `draft.premierleague.com/api/draft/entry/{id}/transactions`

## Known Issues & Limitations

1. **Transfer History**: Cannot access without authentication
2. **Live Scoring**: No real-time updates during active gameweeks
3. **Player Stats**: Limited to what's in bootstrap-static
4. **Historical Seasons**: Only current season data available

## Performance Optimizations

1. **Parallel Fetching**: All manager data fetched concurrently
2. **Minimal Requests**: Only fetch last 5 gameweeks of picks
3. **Computed Values**: Stats calculated once on server
4. **Type Safety**: Full TypeScript coverage prevents runtime errors

## Future Enhancements

Potential improvements:

1. **Authentication**: Add OAuth to access transfer data
2. **Caching**: Cache bootstrap data (changes infrequently)
3. **Live Updates**: Poll API during active gameweeks
4. **Charts**: Add visual charts for trends
5. **Export**: CSV/JSON export functionality
6. **Historical**: Multi-season comparison
7. **Predictions**: Simple projections based on fixtures

## Development Notes

- Uses **Svelte 5** with runes (`$state`, `$derived`, `$props`)
- **SvelteKit** for SSR and routing
- **TypeScript** for type safety
- Hot module replacement works for all components
- No external UI libraries (vanilla CSS)

## Testing the Application

1. Update `LEAGUE_ID` in `src/routes/+page.server.ts`
2. Run `npm run dev`
3. Navigate to http://localhost:5173
4. Check all tabs for proper data display

## Troubleshooting

### "Authentication credentials were not provided"
- This is expected for transactions endpoint
- Transfer History tab shows appropriate message

### "Cannot read property of null"
- Ensure null entry filtering is working
- Check `entries.filter((e) => e.entry_id)` is present

### Slow Loading
- API makes ~7-14 requests per manager
- Consider reducing gameweeks fetched (currently 5)
- Could implement loading states

## Credits

- FPL API structure from https://github.com/vaastav/Fantasy-Premier-League
- Built with SvelteKit and Svelte 5
- Premier League colors and branding
