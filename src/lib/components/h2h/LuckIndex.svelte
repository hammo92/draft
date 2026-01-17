<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Switch } from "$lib/components/ui/switch";
	import { Label } from "$lib/components/ui/label";
	import { Button } from "$lib/components/ui/button";
	import type { ManagerLuck } from "$lib/types/fpl";
	import LuckLollipopChart from "./LuckLollipopChart.svelte";
	import LuckAreaChart from "./LuckAreaChart.svelte";

	let { luck = [] }: { luck: ManagerLuck[] } = $props();

	let useCentered = $state(false);
	let expandedManagers = $state(new Set<number>());
	const DEFAULT_GW_COUNT = 5;

	function toggleExpanded(managerId: number) {
		if (expandedManagers.has(managerId)) {
			expandedManagers.delete(managerId);
		} else {
			expandedManagers.add(managerId);
		}
		expandedManagers = new Set(expandedManagers); // trigger reactivity
	}

	function getDisplayedGameweeks(manager: ManagerLuck) {
		const isExpanded = expandedManagers.has(manager.managerId);
		if (isExpanded || manager.gameweeks.length <= DEFAULT_GW_COUNT) {
			return manager.gameweeks;
		}
		return manager.gameweeks.slice(0, DEFAULT_GW_COUNT);
	}

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
						Season luck ranking
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
					<span class="font-semibold text-foreground">How luck is calculated:</span> For each player, we calculate <span class="text-accent">expected points</span> using their <span class="text-foreground">season per-90 rates</span> (goals, assists, clean sheets, bonus, saves) adjusted for <span class="text-foreground">fixture difficulty</span>. We account for all 11 scoring components including defensive stats and negative events. Luck = Actual − Expected.
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
								{#each getDisplayedGameweeks(manager) as gw (gw.gameweek)}
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
								{#if manager.gameweeks.length > DEFAULT_GW_COUNT}
									<tr>
										<td colspan="5" class="py-2 px-2 text-center">
											<Button
												variant="ghost"
												size="sm"
												class="font-mono text-xs"
												onclick={() => toggleExpanded(manager.managerId)}
											>
												{expandedManagers.has(manager.managerId)
													? `Show less`
													: `Show more (${manager.gameweeks.length - DEFAULT_GW_COUNT} more)`}
											</Button>
										</td>
									</tr>
								{/if}
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
