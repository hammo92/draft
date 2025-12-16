<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import ManagerSelector from "$lib/components/shared/ManagerSelector.svelte";
	import SquadViewer from "$lib/components/squad/SquadViewer.svelte";
	import FreeAgentsList from "$lib/components/squad/FreeAgentsList.svelte";
	import SquadStrengthComparison from "$lib/components/squad/SquadStrengthComparison.svelte";

	let { entries = [], players = {}, currentGameweek = 1 }: { entries: any[], players: any, currentGameweek: number } = $props();

	let activeView = $state('squads');
	let selectedManager = $state(entries[0]?.entry_id || null);
	let positionFilter = $state('all');
	let searchTerm = $state('');

	// Get manager's squad
	let selectedManagerSquad = $derived(() => {
		const manager = entries.find((e: any) => e.entry_id === selectedManager);
		if (!manager) return [];

		const recentPicks = manager.recentPicks.find((p: any) => p.gameweek === currentGameweek);
		if (!recentPicks?.data?.picks) return [];

		return recentPicks.data.picks
			.map((pick: any) => ({
				...players[pick.element],
				position: pick.position,
				is_captain: pick.is_captain,
				is_vice_captain: pick.is_vice_captain
			}))
			.sort((a: any, b: any) => a.position - b.position);
	});

	// Free agents
	let freeAgents = $derived(() => {
		const owned = new Set<number>();

		entries.forEach(entry => {
			const recentPicks = entry.recentPicks.find((p: any) => p.gameweek === currentGameweek);
			if (recentPicks?.data?.picks) {
				recentPicks.data.picks.forEach((pick: any) => {
					owned.add(pick.element);
				});
			}
		});

		return Object.values(players)
			.filter((p: any) => !owned.has(p.id))
			.sort((a: any, b: any) => b.total_points - a.total_points);
	});

	// Squad strength by position - uses server-calculated data based on actual gameweek picks
	let squadStrength = $derived(() => {
		return entries
			.filter((entry: any) => entry.stats?.totalSquadPoints > 0)
			.map((entry: any) => ({
				entry_name: entry.entry_name,
				entry_id: entry.entry_id,
				totalPoints: entry.stats.totalSquadPoints,
				positions: entry.stats.squadStrength
			}))
			.sort((a: any, b: any) => b.totalPoints - a.totalPoints);
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="text-fpl-purple text-2xl">⚽ Squad Analysis</Card.Title>
		<Card.Description>Explore squads, free agents, and team strength</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		<!-- Tab Navigation -->
		<div class="flex gap-2 p-2 bg-muted rounded-lg">
			<button
				class="flex-1 px-4 py-3 rounded-md font-medium transition-all {activeView === 'squads' ? 'bg-fpl-purple text-white' : 'bg-transparent text-foreground hover:bg-muted-foreground/10'}"
				onclick={() => activeView = 'squads'}
			>
				📋 Squad Viewer
			</button>
			<button
				class="flex-1 px-4 py-3 rounded-md font-medium transition-all {activeView === 'free-agents' ? 'bg-fpl-purple text-white' : 'bg-transparent text-foreground hover:bg-muted-foreground/10'}"
				onclick={() => activeView = 'free-agents'}
			>
				🆓 Free Agents
			</button>
			<button
				class="flex-1 px-4 py-3 rounded-md font-medium transition-all {activeView === 'strength' ? 'bg-fpl-purple text-white' : 'bg-transparent text-foreground hover:bg-muted-foreground/10'}"
				onclick={() => activeView = 'strength'}
			>
				💪 Squad Strength
			</button>
		</div>

		{#if activeView === 'squads'}
			<div class="space-y-6">
				<ManagerSelector entries={entries} bind:selectedManager label="Select Manager" />
				<SquadViewer squad={selectedManagerSquad()} />
			</div>

		{:else if activeView === 'free-agents'}
			<FreeAgentsList
				freeAgents={freeAgents()}
				bind:positionFilter
				bind:searchTerm
			/>

		{:else if activeView === 'strength'}
			<SquadStrengthComparison squadStrength={squadStrength()} />
		{/if}
	</Card.Content>
</Card.Root>
