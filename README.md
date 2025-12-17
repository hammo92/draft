# FPL Draft Stats

A comprehensive stats dashboard for your Fantasy Premier League Draft league, built with SvelteKit and Svelte 5.

## Features

### 📊 Overview
- League standings with current rankings
- Manager information and team names
- Quick stats: total points and averages per gameweek

### 📈 Form Charts
- Visual representation of each manager's last 5 gameweeks
- Color-coded performance bars (excellent, good, average, poor)
- Trend indicators showing momentum (up/down/flat)
- Sortable by average form

### 💺 Bench Points Tracker
- Track points left on the bench by each manager
- Total bench points and per-gameweek averages
- Gameweek breakdown showing optimization efficiency
- Identify who's making the best lineup decisions

### 📅 Weekly Performance
- Select any gameweek to see detailed results
- Full season overview grid with color-coded scores
- Compare performance across all gameweeks
- Identify winners and patterns

### 🎯 Manager Comparison
- Head-to-head comparison tool
- Compare total points, averages, and bench points
- Side-by-side form analysis
- Transfer activity comparison

### ⚽ Squad Analysis
- **Squad Viewer**: View any manager's full 15-player squad with starting XI and bench
- **Free Agents**: Browse all unowned players available to pick up (top 50 by points)
- **Squad Strength**: Compare total points by position across all teams
- Filter and search functionality for finding specific players


## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update League ID:**
   Edit `src/routes/+page.server.ts` and change the `LEAGUE_ID` constant to your league ID:
   ```typescript
   const LEAGUE_ID = YOUR_LEAGUE_ID;
   ```

3. **Run the dev server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to http://localhost:5173

## Finding Your League ID

1. Go to https://draft.premierleague.com/
2. Log in and navigate to your league
3. Open browser Dev Tools (F12)
4. Go to the Network tab
5. Refresh the page
6. Look for API calls containing `/league/` - your league ID will be in the URL

## Tech Stack

- **SvelteKit** - Full-stack framework
- **Svelte 5** - Using the new runes system ($state, $derived, $props)
- **TypeScript** - Type safety
- **FPL Draft API** - Official Fantasy Premier League API endpoints

## API Endpoints Used

- `fantasy.premierleague.com/api/bootstrap-static/` - Player, team, and gameweek data
- `draft.premierleague.com/api/league/{id}/details` - League information and standings
- `draft.premierleague.com/api/entry/{id}/history` - Manager gameweek history
- `draft.premierleague.com/api/entry/{id}/event/{gw}` - Team picks for specific gameweeks
- `draft.premierleague.com/api/draft/entry/{id}/transactions` - Transfer history

## Project Structure

```
src/
├── lib/
│   ├── types/
│   │   └── fpl.ts                     # TypeScript type definitions
│   └── components/
│       ├── FormCharts.svelte          # Form analysis component
│       ├── BenchPointsTracker.svelte  # Bench points tracking
│       ├── WeeklyPerformance.svelte   # Gameweek breakdown
│       ├── ManagerComparison.svelte   # Head-to-head comparison
│       └── SquadAnalysis.svelte       # Squad viewer & free agents
└── routes/
    ├── +page.svelte        # Main page with tabbed interface
    └── +page.server.ts     # Server-side data fetching
```

## Building for Production

```bash
npm run build
```

Then preview the production build:

```bash
npm run preview
```

## Development

This project uses:
- **Svelte 5 Runes**: Modern reactive primitives ($state, $derived, $props)
- **SvelteKit**: Full-stack framework with server-side rendering
- **TypeScript**: Full type safety throughout

## License

MIT

## Acknowledgments

- Built with data from the official Fantasy Premier League API
- FPL API endpoints documentation: https://github.com/vaastav/Fantasy-Premier-League
