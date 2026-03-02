<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import FormAreaChart from "./FormAreaChart.svelte";
	import { Activity, TrendingUp, TrendingDown, Minus } from "@lucide/svelte";

	let { entries = [] }: { entries: any[] } = $props();

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

	function getTrendData(trend: number): { icon: typeof TrendingUp; class: string; label: string } {
		if (trend > 5) return { icon: TrendingUp, class: 'text-success glow-success', label: `+${trend}` };
		if (trend > 0) return { icon: TrendingUp, class: 'text-success', label: `+${trend}` };
		if (trend < -5) return { icon: TrendingDown, class: 'text-destructive glow-destructive', label: `${trend}` };
		if (trend < 0) return { icon: TrendingDown, class: 'text-destructive', label: `${trend}` };
		return { icon: Minus, class: 'text-muted-foreground', label: '0' };
	}
</script>

<Card.Root>
	<Card.Header class="flex-row items-center gap-2">
		<Activity class="w-4 h-4 text-accent" />
		<div>
			<Card.Title>Form Analysis</Card.Title>
			<Card.Description>Last 5 gameweeks performance</Card.Description>
		</div>
	</Card.Header>
	<Card.Content>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
			{#each sortedByForm as entry, rank (entry.entry_id)}
				<div class="border border-border rounded overflow-hidden bg-card hover:border-accent/50 transition-colors group">
					<!-- Header -->
					<div class="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5">
								<span class="text-[10px] text-muted-foreground tabular w-4">#{rank + 1}</span>
								<h3 class="font-sans text-xs font-semibold text-foreground truncate group-hover:text-accent transition-colors">
									{entry.player_first_name} {entry.player_last_name}
								</h3>
							</div>
							<p class="font-sans text-[10px] text-muted-foreground truncate pl-5">
								{entry.entry_name}
							</p>
						</div>
						<div class="flex flex-col items-end">
							<span class="text-lg font-bold text-accent tabular">{entry.formAverage.toFixed(1)}</span>
							<span class="text-[9px] text-muted-foreground uppercase tracking-wider">avg</span>
						</div>
					</div>

					<!-- Chart -->
					<div class="px-3 py-2">
						{#if entry.stats.form.length > 0}
							<div class="mb-2">
								<FormAreaChart
									form={entry.stats.form}
									managerName={entry.entry_name}
									height={80}
									fixedYMin={globalYExtent.min}
									fixedYMax={globalYExtent.max}
								/>
							</div>

							<div class="flex items-center justify-between">
								<span class="text-[9px] text-muted-foreground uppercase tracking-wider">
									Last {entry.stats.form.length} GW
								</span>
								{#if entry.stats.form.length >= 2}
									{@const trend = entry.stats.form[entry.stats.form.length - 1] - entry.stats.form[0]}
									{@const trendData = getTrendData(trend)}
									<div class="flex items-center gap-1 {trendData.class}">
										<svelte:component this={trendData.icon} class="w-3 h-3" />
										<span class="text-xs font-bold tabular">{trendData.label}</span>
									</div>
								{/if}
							</div>
						{:else}
							<div class="h-[80px] flex items-center justify-center">
								<p class="text-[10px] text-muted-foreground uppercase tracking-wider">No data</p>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
