<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import FormAreaChart from "./FormAreaChart.svelte";

	let { entries = [] }: { entries: any[] } = $props();

	// Sort entries by average of last 5 gameweeks
	let sortedByForm = $derived(
		[...entries]
			.map(entry => ({
				...entry,
				formAverage: entry.stats.form.length > 0
					? entry.stats.form.reduce((a: number, b: number) => a + b, 0) / entry.stats.form.length
					: 0
			}))
			.sort((a, b) => b.formAverage - a.formAverage)
	);

	// Calculate global min/max for standardized y-axis across all charts
	const globalYExtent = $derived.by(() => {
		const allValues = entries.flatMap(entry => entry.stats.form as number[]);
		if (allValues.length === 0) return { min: 0, max: 100 };
		const max = Math.max(...allValues);
		const padding = 5;
		return {
			min: 0,
			max: Math.ceil(max + padding)
		};
	});

	function getTrendIcon(trend: number): string {
		if (trend > 5) return '↑↑';
		if (trend > 0) return '↑';
		if (trend < -5) return '↓↓';
		if (trend < 0) return '↓';
		return '→';
	}

	function getTrendClass(trend: number): string {
		if (trend > 0) return 'text-green-500';
		if (trend < 0) return 'text-red-500';
		return 'text-muted-foreground';
	}
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header>
		<Card.Title class="font-serif text-2xl font-semibold text-foreground">Form Analysis</Card.Title>
		<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
			Last 5 gameweeks performance
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each sortedByForm as entry (entry.entry_id)}
				<div class="p-4 bg-muted rounded border border-border">
					<div class="flex justify-between items-start mb-3">
						<div class="min-w-0 flex-1">
							<h3 class="font-serif font-semibold text-foreground truncate">{entry.entry_name}</h3>
							<p class="font-mono text-xs text-muted-foreground truncate">
								{entry.player_first_name} {entry.player_last_name}
							</p>
						</div>
						<Badge variant="secondary" class="font-mono text-xs ml-2 shrink-0">
							{entry.formAverage.toFixed(1)}
						</Badge>
					</div>

					{#if entry.stats.form.length > 0}
						<div class="mb-3">
							<FormAreaChart
								form={entry.stats.form}
								managerName={entry.entry_name}
								height={100}
								fixedYMin={globalYExtent.min}
								fixedYMax={globalYExtent.max}
							/>
						</div>

						<div class="flex justify-between items-center text-sm">
							<span class="font-mono text-xs text-muted-foreground">
								GW{entry.stats.form.length}→GW1
							</span>
							{#if entry.stats.form.length >= 2}
								{@const trend = entry.stats.form[entry.stats.form.length - 1] - entry.stats.form[0]}
								<span class="font-mono text-sm font-semibold {getTrendClass(trend)}">
									{getTrendIcon(trend)} {trend > 0 ? '+' : ''}{trend}
								</span>
							{/if}
						</div>
					{:else}
						<div class="h-[100px] flex items-center justify-center">
							<p class="text-muted-foreground text-sm italic">No recent data</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
