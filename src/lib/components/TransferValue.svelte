<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { ArrowRight, TrendingUp, TrendingDown } from "@lucide/svelte";
	import type { TransferAnalysis } from "$lib/types/fpl";

	let { entries = [] }: { entries: any[] } = $props();

	// Sort by transfer value (best transfers first)
	let sortedByTransferValue = $derived(
		[...entries]
			.filter(e => e.stats?.transferValue !== undefined)
			.map(entry => ({
				...entry,
				actualTotal: entry.history.reduce((sum: number, h: any) => sum + h.points, 0),
				gw1Total: entry.stats.gw1SquadTotal,
				transferValue: entry.stats.transferValue,
				transfers: (entry.stats.transfers || []) as TransferAnalysis[]
			}))
			.sort((a, b) => b.transferValue - a.transferValue)
	);

	function getValueClass(value: number): string {
		if (value > 20) return 'text-green-500';
		if (value > 0) return 'text-green-400';
		if (value < -20) return 'text-red-500';
		if (value < 0) return 'text-red-400';
		return 'text-muted-foreground';
	}

	function getValueBg(value: number, index: number): string {
		if (index === 0) return 'bg-amber-500/20 border-amber-500';
		if (index === 1) return 'bg-slate-400/20 border-slate-400';
		if (index === 2) return 'bg-orange-600/20 border-orange-600';
		return 'bg-muted border-border';
	}

	function getImpactClass(value: number): string {
		if (value > 0) return 'text-green-500';
		if (value < 0) return 'text-red-500';
		return 'text-muted-foreground';
	}

	function getImpactBg(value: number): string {
		if (value > 10) return 'bg-green-500/10';
		if (value > 0) return 'bg-green-500/5';
		if (value < -10) return 'bg-red-500/10';
		if (value < 0) return 'bg-red-500/5';
		return 'bg-muted/50';
	}
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header>
		<Card.Title class="font-sans text-2xl font-semibold text-foreground">Transfer Value</Card.Title>
		<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
			Actual points vs if you'd kept your GW1 squad (with auto-subs)
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="flex flex-col gap-3">
			{#each sortedByTransferValue as entry, index}
				<div class="rounded-lg border-l-4 {getValueBg(entry.transferValue, index)}">
					<!-- Summary row -->
					<div class="grid grid-cols-[50px_1fr_auto] gap-4 items-center p-4">
						<div class="text-xl font-bold text-foreground text-center">
							#{index + 1}
						</div>
						<div>
							<h4 class="font-sans font-semibold text-foreground">{entry.entry_name}</h4>
							<div class="font-mono text-xs text-muted-foreground">
								Actual: {entry.actualTotal} | GW1 Squad: {entry.gw1Total} | {entry.transfers.length} transfers
							</div>
						</div>
						<div class="text-right">
							<div class="font-mono text-2xl font-bold {getValueClass(entry.transferValue)}">
								{entry.transferValue > 0 ? '+' : ''}{entry.transferValue}
							</div>
							<div class="font-mono text-xs text-muted-foreground">
								net pts
							</div>
						</div>
					</div>

					<!-- Transfer details -->
					{#if entry.transfers.length > 0}
						<div class="px-4 pb-4">
							<div class="grid gap-2">
								{#each entry.transfers as transfer}
									<div class="flex items-center gap-2 p-2 rounded {getImpactBg(transfer.netImpact)}">
										<!-- GW badge -->
										<span class="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
											GW{transfer.gameweek}
										</span>

										<!-- Player out -->
										<div class="flex items-center gap-1 min-w-0 flex-1">
											<span class="font-mono text-xs text-red-400 truncate">
												{transfer.playerOut.name}
											</span>
											<span class="font-mono text-[10px] text-muted-foreground shrink-0">
												({transfer.pointsLost})
											</span>
										</div>

										<!-- Arrow -->
										<ArrowRight class="w-3 h-3 text-muted-foreground shrink-0" />

										<!-- Player in -->
										<div class="flex items-center gap-1 min-w-0 flex-1">
											<span class="font-mono text-xs text-green-400 truncate">
												{transfer.playerIn.name}
											</span>
											<span class="font-mono text-[10px] text-muted-foreground shrink-0">
												({transfer.pointsGained})
											</span>
										</div>

										<!-- Net impact -->
										<div class="flex items-center gap-1 shrink-0">
											{#if transfer.netImpact > 0}
												<TrendingUp class="w-3 h-3 text-green-500" />
											{:else if transfer.netImpact < 0}
												<TrendingDown class="w-3 h-3 text-red-500" />
											{/if}
											<span class="font-mono text-xs font-bold {getImpactClass(transfer.netImpact)}">
												{transfer.netImpact > 0 ? '+' : ''}{transfer.netImpact}
											</span>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div class="px-4 pb-4">
							<p class="font-mono text-xs text-muted-foreground italic">No transfers made</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if sortedByTransferValue.length > 0}
			<div class="mt-6 p-4 bg-muted rounded-lg">
				<p class="font-mono text-xs text-muted-foreground">
					<span class="text-green-500">Positive</span> = transfers have helped |
					<span class="text-red-500">Negative</span> = would've been better doing nothing
				</p>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
