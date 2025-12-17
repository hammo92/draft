const LEAGUE_ID = 21959;

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

async function main() {
  const leagueRes = await fetch(`https://draft.premierleague.com/api/league/${LEAGUE_ID}/details`);
  const league = await leagueRes.json();

  const fixturesRes = await fetch('https://fantasy.premierleague.com/api/fixtures/');
  const fixtures: any[] = await fixturesRes.json();

  const fixturesByGw = new Map<number, any[]>();
  fixtures.forEach(f => {
    if (!fixturesByGw.has(f.event)) fixturesByGw.set(f.event, []);
    fixturesByGw.get(f.event)!.push(f);
  });

  const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
  const bootstrap = await bootstrapRes.json();
  const playerLookup = new Map(bootstrap.elements.map((p: any) => [p.id, p]));

  console.log('=== Luck Calculation Results (Simple Mean + FDR) ===\n');

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

    managerLuck.push({
      name: `${leagueEntry.player_first_name} ${leagueEntry.player_last_name}`,
      luck: Math.round(totalLuck * 10) / 10
    });
  }

  // Sort by luck
  managerLuck.sort((a, b) => b.luck - a.luck);

  console.log('Ranking (Last 5 GWs):');
  managerLuck.forEach((m, i) => {
    const label = i === 0 ? 'Luckiest' : i === managerLuck.length - 1 ? 'Unluckiest' : `#${i + 1}`;
    console.log(`  ${label.padEnd(10)}: ${m.name.padEnd(20)} ${m.luck > 0 ? '+' : ''}${m.luck}`);
  });

  const totalSum = managerLuck.reduce((sum, m) => sum + m.luck, 0);
  const avgLuck = totalSum / managerLuck.length;
  console.log(`\nTotal sum: ${totalSum.toFixed(1)}`);
  console.log(`Average: ${avgLuck.toFixed(1)}`);
  console.log(`Range: ${(managerLuck[0].luck - managerLuck[managerLuck.length - 1].luck).toFixed(1)}`);

  // Show centered values (relative to league average)
  console.log('\nCentered Values (relative to league average):');
  managerLuck.forEach((m, i) => {
    const centered = Math.round((m.luck - avgLuck) * 10) / 10;
    const label = i === 0 ? 'Luckiest' : i === managerLuck.length - 1 ? 'Unluckiest' : `#${i + 1}`;
    console.log(`  ${label.padEnd(10)}: ${m.name.padEnd(20)} ${centered > 0 ? '+' : ''}${centered}`);
  });
}

main().catch(console.error);
