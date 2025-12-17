/**
 * Script to fetch FPL API data and examine structure
 * Run with: npx tsx scripts/fetch-api-structure.ts
 */

const LEAGUE_ID = 21959;

async function fetchAndLog(url: string, name: string) {
	console.log(`\n${'='.repeat(60)}`);
	console.log(`Fetching: ${name}`);
	console.log(`URL: ${url}`);
	console.log('='.repeat(60));

	try {
		const response = await fetch(url);
		const data = await response.json();

		console.log('\nSample structure:');
		console.log(JSON.stringify(data, null, 2).substring(0, 2000));
		console.log('\n...(truncated)');

		return data;
	} catch (error) {
		console.error(`Error fetching ${name}:`, error);
		return null;
	}
}

async function main() {
	console.log('Fetching FPL Draft API Data...\n');

	// 1. Bootstrap Static
	const bootstrap = await fetchAndLog(
		'https://fantasy.premierleague.com/api/bootstrap-static/',
		'Bootstrap Static'
	);

	// 2. League Details
	const leagueDetails = await fetchAndLog(
		`https://draft.premierleague.com/api/league/${LEAGUE_ID}/details`,
		'League Details'
	);

	if (leagueDetails?.league_entries?.[0]) {
		const entryId = leagueDetails.league_entries[0].entry_id;

		// 3. Entry History
		await fetchAndLog(
			`https://draft.premierleague.com/api/entry/${entryId}/history`,
			'Entry History'
		);

		// 4. Entry Transactions
		await fetchAndLog(
			`https://draft.premierleague.com/api/draft/entry/${entryId}/transactions`,
			'Entry Transactions'
		);

		// 5. Entry Event Picks
		const currentGW = bootstrap?.events?.find((e: any) => e.is_current)?.id || 1;
		await fetchAndLog(
			`https://draft.premierleague.com/api/entry/${entryId}/event/${currentGW}`,
			'Entry Event Picks'
		);
	}

	console.log('\n\nFetch complete!');
}

main();
