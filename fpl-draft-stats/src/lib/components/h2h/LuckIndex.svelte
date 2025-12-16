<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Switch } from "$lib/components/ui/switch";
	import { Label } from "$lib/components/ui/label";
	import type { ManagerLuck } from "$lib/types/fpl";
	import LuckLollipopChart from "./LuckLollipopChart.svelte";
	import LuckAreaChart from "./LuckAreaChart.svelte";

	let { luck = [] }: { luck: ManagerLuck[] } = $props();

	let useCentered = $state(false);

	// Sort managers by luck for ranking (uses appropriate field based on mode)
	const sortedByLuck = $derived(
		[...luck].sort((a, b) => {
			const aVal = useCentered ? a.centeredLuck : a.seasonLuck;
			const bVal = useCentered ? b.centeredLuck : b.seasonLuck;
			return bVal - aVal;
		})
	);

	function getLuckValue(manager: ManagerLuck): number {
		return useCentered ? manager.centeredLuck : manager.seasonLuck;
	}

	function getLuckClass(luckVal: number): string {
		if (luckVal > 0) return 'text-green-500';
		if (luckVal < 0) return 'text-red-500';
		return 'text-muted-foreground';
	}

	function getResultClass(result: 'W' | 'D' | 'L'): string {
		if (result === 'W') return 'bg-green-500/20 text-green-500';
		if (result === 'L') return 'bg-red-500/20 text-red-500';
		return 'bg-muted text-muted-foreground';
	}

	function getRankLabel(index: number, total: number): string {
		if (index === 0) return 'Luckiest';
		if (index === total - 1) return 'Unluckiest';
		return `#${index + 1}`;
	}
</script>

<div class="space-y-6">
	<!-- Luck Leaderboard -->
	<Card.Root class="bg-card border border-border rounded shadow-none">
		<Card.Header>
			<div class="flex items-center justify-between flex-wrap gap-4">
				<div>
					<Card.Title class="font-serif text-2xl font-semibold text-foreground">Luck Index</Card.Title>
					<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
						Season luck ranking (recent 5 GWs)
					</Card.Description>
				</div>
				<div class="flex items-center gap-2">
					<Label for="luck-mode" class="font-mono text-xs text-muted-foreground">
						{useCentered ? 'Relative' : 'Raw'}
					</Label>
					<Switch id="luck-mode" bind:checked={useCentered} />
				</div>
			</div>
		</Card.Header>
		<Card.Content>
			<div class="mb-6 p-4 bg-muted/50 rounded border border-border">
				<p class="font-mono text-xs text-muted-foreground leading-relaxed">
					<span class="font-semibold text-foreground">How luck is calculated:</span> For each gameweek, we calculate an <span class="text-accent">expected score</span> using each player's <span class="text-foreground">average points</span> from the last 10 gameweeks, adjusted for <span class="text-foreground">fixture difficulty</span> (FDR 1-5 scale). Luck = Actual − Expected.
					{#if useCentered}
						<span class="text-accent">Relative mode</span> shows luck compared to league average.
					{:else}
						<span class="text-accent">Raw mode</span> shows absolute outperformance.
					{/if}
				</p>
			</div>

			<!-- Lollipop Chart -->
			<LuckLollipopChart
				data={luck}
				{useCentered}
			/>
		</Card.Content>
	</Card.Root>

	<!-- All Manager Breakdowns -->
	{#each sortedByLuck as manager, index (manager.managerId)}
		<Card.Root class="bg-card border border-border rounded shadow-none">
			<Card.Header class="pb-2">
				<div class="flex items-center justify-between flex-wrap gap-2">
					<div class="flex items-center gap-3">
						<span class="font-mono text-xs uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded">
							{getRankLabel(index, sortedByLuck.length)}
						</span>
						<Card.Title class="font-serif text-xl font-semibold text-foreground">
							{manager.managerName}
						</Card.Title>
					</div>
					<div class="font-mono text-2xl font-bold {getLuckClass(getLuckValue(manager))}">
						{getLuckValue(manager) > 0 ? '+' : ''}{getLuckValue(manager)}
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<!-- Area Chart -->
					<div class="flex items-center justify-center bg-muted/30 rounded p-4">
						<LuckAreaChart
							gameweeks={manager.gameweeks}
							managerName={manager.managerName}
						/>
					</div>

					<!-- Table -->
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-border">
									<th class="font-mono text-xs uppercase tracking-wider text-muted-foreground text-left py-1 px-2">GW</th>
									<th class="font-mono text-xs uppercase tracking-wider text-muted-foreground text-right py-1 px-2">Actual</th>
									<th class="font-mono text-xs uppercase tracking-wider text-muted-foreground text-right py-1 px-2">Exp</th>
									<th class="font-mono text-xs uppercase tracking-wider text-muted-foreground text-right py-1 px-2">Luck</th>
									<th class="font-mono text-xs uppercase tracking-wider text-muted-foreground text-center py-1 px-2">Result</th>
								</tr>
							</thead>
							<tbody>
								{#each manager.gameweeks as gw (gw.gameweek)}
									<tr class="border-b border-border last:border-b-0">
										<td class="py-1 px-2">
											<span class="font-mono font-semibold text-foreground">{gw.gameweek}</span>
										</td>
										<td class="py-1 px-2 text-right">
											<span class="font-mono text-foreground">{gw.actual}</span>
										</td>
										<td class="py-1 px-2 text-right">
											<span class="font-mono text-muted-foreground">{gw.expected}</span>
										</td>
										<td class="py-1 px-2 text-right">
											<span class="font-mono font-semibold {getLuckClass(gw.luck)}">
												{gw.luck > 0 ? '+' : ''}{gw.luck}
											</span>
										</td>
										<td class="py-1 px-2 text-center">
											<span class="font-mono text-xs font-bold px-2 py-0.5 rounded {getResultClass(gw.result)}">
												{gw.result}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
							<tfoot>
								<tr class="border-t-2 border-border">
									<td class="py-1 px-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">Total</td>
									<td class="py-1 px-2 text-right font-mono font-bold text-foreground">
										{manager.gameweeks.reduce((sum, gw) => sum + gw.actual, 0)}
									</td>
									<td class="py-1 px-2 text-right font-mono text-muted-foreground">
										{manager.gameweeks.reduce((sum, gw) => sum + gw.expected, 0).toFixed(1)}
									</td>
									<td class="py-1 px-2 text-right font-mono font-bold {getLuckClass(manager.seasonLuck)}">
										{manager.seasonLuck > 0 ? '+' : ''}{manager.seasonLuck}
									</td>
									<td></td>
								</tr>
							</tfoot>
						</table>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/each}
</div>
