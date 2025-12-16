const LEAGUE_ID = 21959;

// Calculate exponentially weighted mean
function calculateExponentiallyWeightedMean(values: number[], lambda: number = 0.25): number {
  if (values.length === 0) return 0;

  let weightedSum = 0;
  let weightTotal = 0;

  // values[0] is oldest, values[n-1] is most recent
  values.forEach((points, index) => {
    const weight = Math.exp(-lambda * (values.length - 1 - index));
    weightedSum += points * weight;
    weightTotal += weight;
  });

  return weightTotal > 0 ? weightedSum / weightTotal : 0;
}

// Simple mean
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Get FDR multiplier
function getFDRMultiplier(fdr: number): number {
  const multipliers: Record<number, number> = {
    1: 1.15, 2: 1.08, 3: 1.00, 4: 0.93, 5: 0.85
  };
  return multipliers[fdr] || 1.0;
}

async function testLambda(lambda: number, league: any, fixturesByGw: Map<number, any[]>, playerLookup: Map<number, any>) {
  const managerLuck: { name: string; luck: number }[] = [];

  for (const leagueEntry of league.league_entries.filter((e: any) => e.entry_id)) {
    let totalLuck = 0;

    for (let gw = 12; gw <= 16; gw++) {
      try {
        const picksRes = await fetch(`https://draft.premierleague.com/api/entry/${leagueEntry.entry_id}/event/${gw}`);
        const picks = await picksRes.json();
        const historyRes = await fetch(`https://draft.premierleague.com/api/entry/${leagueEntry.entry_id}/history`);
        const history = await historyRes.json();
        const gwHistory = history.history?.find((h: any) => h.event === gw);

        const startingXI = picks.picks?.filter((p: any) => p.position <= 11) || [];
        const gwFixtures = fixturesByGw.get(gw) || [];

        let expected = 0;
        for (const pick of startingXI) {
          const playerRes = await fetch(`https://fantasy.premierleague.com/api/element-summary/${pick.element}/`);
          const playerData = await playerRes.json();
          const player = playerLookup.get(pick.element);

          const priorPoints = playerData.history
            ?.filter((h: any) => h.round < gw)
            .slice(-10)
            .map((h: any) => h.total_points) || [];

          if (priorPoints.length === 0) {
            expected += parseFloat(player?.points_per_game) || 0;
            continue;
          }

          const ewm = calculateExponentiallyWeightedMean(priorPoints, lambda);
          const playerTeam = player?.team;
          const fixture = gwFixtures.find((f: any) => f.team_h === playerTeam || f.team_a === playerTeam);
          let fdrMultiplier = 1.0;
          if (fixture) {
            const isHome = fixture.team_h === playerTeam;
            const fdr = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
            fdrMultiplier = getFDRMultiplier(fdr);
          }
          expected += ewm * fdrMultiplier;
        }

        const actual = gwHistory?.points || 0;
        totalLuck += actual - expected;
      } catch (e) {
        // Skip errors
      }
    }

    managerLuck.push({
      name: `${leagueEntry.player_first_name} ${leagueEntry.player_last_name}`,
      luck: Math.round(totalLuck * 10) / 10
    });
  }

  return managerLuck;
}

async function main() {
  // Fetch league data
  const leagueRes = await fetch(`https://draft.premierleague.com/api/league/${LEAGUE_ID}/details`);
  const league = await leagueRes.json();

  // Fetch fixtures for FDR
  const fixturesRes = await fetch('https://fantasy.premierleague.com/api/fixtures/');
  const fixtures: any[] = await fixturesRes.json();

  // Group fixtures by gameweek
  const fixturesByGw = new Map<number, any[]>();
  fixtures.forEach(f => {
    if (!fixturesByGw.has(f.event)) fixturesByGw.set(f.event, []);
    fixturesByGw.get(f.event)!.push(f);
  });

  // Fetch bootstrap for player data
  const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
  const bootstrap = await bootstrapRes.json();
  const playerLookup = new Map(bootstrap.elements.map((p: any) => [p.id, p]));

  // Test different lambda values
  console.log('Testing different lambda values:\n');

  for (const lambda of [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]) {
    const results = await testLambda(lambda, league, fixturesByGw, playerLookup);
    const totalSum = results.reduce((sum, m) => sum + m.luck, 0);
    const sorted = [...results].sort((a, b) => b.luck - a.luck);
    const range = sorted[0].luck - sorted[sorted.length - 1].luck;

    console.log(`λ=${lambda.toFixed(2)}: Total=${totalSum.toFixed(1).padStart(7)}, Range=${range.toFixed(1)}`);
    console.log(`         Luckiest: ${sorted[0].name} (${sorted[0].luck > 0 ? '+' : ''}${sorted[0].luck})`);
    console.log(`         Unluckiest: ${sorted[sorted.length - 1].name} (${sorted[sorted.length - 1].luck})`);
    console.log('');
  }

  // Also test simple mean (no weighting)
  console.log('\nTesting simple mean (no exponential weighting):\n');

  const managerLuckMean: { name: string; luck: number }[] = [];
  for (const leagueEntry of league.league_entries.filter((e: any) => e.entry_id)) {
    let totalLuck = 0;

    for (let gw = 12; gw <= 16; gw++) {
      try {
        const picksRes = await fetch(`https://draft.premierleague.com/api/entry/${leagueEntry.entry_id}/event/${gw}`);
        const picks = await picksRes.json();
        const historyRes = await fetch(`https://draft.premierleague.com/api/entry/${leagueEntry.entry_id}/history`);
        const history = await historyRes.json();
        const gwHistory = history.history?.find((h: any) => h.event === gw);

        const startingXI = picks.picks?.filter((p: any) => p.position <= 11) || [];
        const gwFixtures = fixturesByGw.get(gw) || [];

        let expected = 0;
        for (const pick of startingXI) {
          const playerRes = await fetch(`https://fantasy.premierleague.com/api/element-summary/${pick.element}/`);
          const playerData = await playerRes.json();
          const player = playerLookup.get(pick.element);

          const priorPoints = playerData.history
            ?.filter((h: any) => h.round < gw)
            .slice(-10)
            .map((h: any) => h.total_points) || [];

          if (priorPoints.length === 0) {
            expected += parseFloat(player?.points_per_game) || 0;
            continue;
          }

          const mean = calculateMean(priorPoints);
          const playerTeam = player?.team;
          const fixture = gwFixtures.find((f: any) => f.team_h === playerTeam || f.team_a === playerTeam);
          let fdrMultiplier = 1.0;
          if (fixture) {
            const isHome = fixture.team_h === playerTeam;
            const fdr = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
            fdrMultiplier = getFDRMultiplier(fdr);
          }
          expected += mean * fdrMultiplier;
        }

        const actual = gwHistory?.points || 0;
        totalLuck += actual - expected;
      } catch (e) {
        // Skip errors
      }
    }

    managerLuckMean.push({
      name: `${leagueEntry.player_first_name} ${leagueEntry.player_last_name}`,
      luck: Math.round(totalLuck * 10) / 10
    });
  }

  const totalSumMean = managerLuckMean.reduce((sum, m) => sum + m.luck, 0);
  const sortedMean = [...managerLuckMean].sort((a, b) => b.luck - a.luck);
  const rangeMean = sortedMean[0].luck - sortedMean[sortedMean.length - 1].luck;

  console.log(`Simple Mean: Total=${totalSumMean.toFixed(1).padStart(7)}, Range=${rangeMean.toFixed(1)}`);
  console.log(`         Luckiest: ${sortedMean[0].name} (${sortedMean[0].luck > 0 ? '+' : ''}${sortedMean[0].luck})`);
  console.log(`         Unluckiest: ${sortedMean[sortedMean.length - 1].name} (${sortedMean[sortedMean.length - 1].luck})`);
}

main().catch(console.error);
