const LEAGUE_ID = 21959;

async function main() {
  // Fetch draft choices
  const choicesRes = await fetch(`https://draft.premierleague.com/api/draft/${LEAGUE_ID}/choices`);
  const choices = await choicesRes.json();

  // Fetch bootstrap for player names
  const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
  const bootstrap = await bootstrapRes.json();

  // Create player lookup
  const players = new Map(bootstrap.elements.map((p: any) => [p.id, p]));
  const teams = new Map(bootstrap.teams.map((t: any) => [t.id, t.short_name]));

  // Fetch league details for manager names
  const leagueRes = await fetch(`https://draft.premierleague.com/api/league/${LEAGUE_ID}/details`);
  const league = await leagueRes.json();
  const managers = new Map(league.league_entries.map((e: any) => [e.entry_id, e.entry_name]));

  // Filter round 1 picks and sort by pick number
  const round1 = choices.choices
    .filter((c: any) => c.round === 1)
    .sort((a: any, b: any) => a.pick - b.pick);

  console.log('=== ROUND 1 DRAFT PICKS ===\n');

  for (const pick of round1) {
    const player = players.get(pick.element);
    const team = player ? teams.get(player.team) : 'Unknown';
    const manager = managers.get(pick.entry) || 'Unknown';

    console.log(`Pick ${pick.pick}: ${player?.web_name || 'Unknown'} (${team}) → ${manager}`);
  }
}

main();
