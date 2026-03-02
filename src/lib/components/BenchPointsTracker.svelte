<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import BenchPointsBreakdown from "$lib/components/bench/BenchPointsBreakdown.svelte";

	let { entries = [] }: { entries: any[] } = $props();

	// Sort by total bench points (descending - most wasted first)
	let sortedByBenchPoints = $derived(
		[...entries]
			.filter(e => e.stats.totalBenchPoints > 0)
			.sort((a, b) => b.stats.totalBenchPoints - a.stats.totalBenchPoints)
	);
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header>
		<Card.Title>Bench Points Tracker</Card.Title>
		<Card.Description>Points left on the bench - measure your lineup optimization</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-8">
		<div class="flex flex-col gap-4">
			{#each sortedByBenchPoints as entry, index}
				<div class="grid grid-cols-[60px_1fr_auto] md:grid-cols-[60px_1fr_auto] gap-6 items-center p-6 rounded-lg border-l-4 transition-all hover:translate-x-1 hover:shadow-lg
					{index === 0 ? 'border-red-400 bg-red-400/10' : 'bg-muted border-border'}">
					<Badge variant="outline" class="text-2xl font-bold justify-center h-12 w-12">
						{index + 1}
					</Badge>
					<div>
						<h3 class="font-sans font-semibold text-lg mb-1 text-foreground">{entry.entry_name}</h3>
						<p class="font-sans text-xs text-muted-foreground">{entry.player_first_name} {entry.player_last_name}</p>
					</div>
					<div class="flex gap-8 md:flex-row flex-col md:col-auto col-span-3">
						<div class="flex flex-col items-center">
							<span class="text-3xl font-bold text-red-400">{entry.stats.totalBenchPoints}</span>
							<span class="text-xs text-muted-foreground uppercase tracking-wide">total pts</span>
						</div>
						<div class="flex flex-col items-center">
							<span class="text-2xl font-bold text-muted-foreground">
								{(entry.stats.totalBenchPoints / entry.stats.benchPointsByGameweek.length).toFixed(1)}
							</span>
							<span class="text-xs text-muted-foreground uppercase tracking-wide">per GW</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		{#if sortedByBenchPoints.length > 0}
			<Separator />
			<BenchPointsBreakdown {sortedByBenchPoints} />
		{/if}

		{#if sortedByBenchPoints.length === 0}
			<p class="text-center text-muted-foreground italic py-8">No bench point data available yet. Data will appear after gameweeks are completed.</p>
		{/if}
	</Card.Content>
</Card.Root>
