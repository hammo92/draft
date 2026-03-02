<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import ManagerSelector from "$lib/components/shared/ManagerSelector.svelte";
	import SquadViewer from "$lib/components/squad/SquadViewer.svelte";
	import FreeAgentsList from "$lib/components/squad/FreeAgentsList.svelte";
	import SquadStrengthComparison from "$lib/components/squad/SquadStrengthComparison.svelte";
	import { Users, UserSearch, BarChart3 } from '@lucide/svelte';

	let { entries = [], players = {}, currentGameweek = 1 }: { entries: any[], players: any, currentGameweek: number } = $props();

	let selectedManager = $state(entries[0]?.entry_id || null);
	let positionFilter = $state('all');
	let searchTerm = $state('');

	// Find the most recent available gameweek (current GW may not have data if in progress)
	let availableGameweek = $derived.by(() => {
		// Check if any manager has data for the current gameweek
		const hasCurrentGw = entries.some((e: any) =>
			e.recentPicks?.some((p: any) => p.gameweek === currentGameweek && p.data?.picks)
		);
		if (hasCurrentGw) return currentGameweek;

		// Otherwise find the most recent gameweek with data
		const allGameweeks = entries
			.flatMap((e: any) => e.recentPicks?.filter((p: any) => p.data?.picks).map((p: any) => p.gameweek) || []);
		return allGameweeks.length > 0 ? Math.max(...allGameweeks) : currentGameweek;
	});

	// Get manager's squad
	let selectedManagerSquad = $derived.by(() => {
		const manager = entries.find((e: any) => e.entry_id === selectedManager);
		if (!manager) return [];

		const recentPicks = manager.recentPicks?.find((p: any) => p.gameweek === availableGameweek);
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
	let freeAgents = $derived.by(() => {
		const owned = new Set<number>();

		entries.forEach(entry => {
			const recentPicks = entry.recentPicks?.find((p: any) => p.gameweek === availableGameweek);
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
	let squadStrength = $derived.by(() => {
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

<div class="space-y-6">
	<!-- Section: Squad Viewer -->
	<Card.Root>
		<Card.Header class="flex-row items-center gap-2">
			<Users class="w-4 h-4 text-accent" />
			<div>
				<Card.Title>Squad Viewer</Card.Title>
				<Card.Description>View any manager's current squad</Card.Description>
			</div>
		</Card.Header>
		<Card.Content class="space-y-4">
			<ManagerSelector entries={entries} bind:selectedManager label="Select Manager" />
			<SquadViewer squad={selectedManagerSquad} />
		</Card.Content>
	</Card.Root>

	<!-- Section: Squad Strength Comparison -->
	<Card.Root>
		<Card.Header class="flex-row items-center gap-2">
			<BarChart3 class="w-4 h-4 text-accent" />
			<div>
				<Card.Title>Squad Strength</Card.Title>
				<Card.Description>Compare total squad points by position</Card.Description>
			</div>
		</Card.Header>
		<Card.Content>
			<SquadStrengthComparison squadStrength={squadStrength} />
		</Card.Content>
	</Card.Root>

	<!-- Section: Free Agents -->
	<Card.Root>
		<Card.Header class="flex-row items-center gap-2">
			<UserSearch class="w-4 h-4 text-accent" />
			<div>
				<Card.Title>Free Agents</Card.Title>
				<Card.Description>Available players not owned by any manager</Card.Description>
			</div>
		</Card.Header>
		<Card.Content>
			<FreeAgentsList
				freeAgents={freeAgents}
				bind:positionFilter
				bind:searchTerm
			/>
		</Card.Content>
	</Card.Root>
</div>
