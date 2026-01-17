<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { ArrowRightLeft, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from "@lucide/svelte";
	import type { DetailedEntry, TransferAnalysis } from "$lib/types/fpl";

	let { entries = [] }: { entries: DetailedEntry[] } = $props();

	let expandedManager = $state<number | null>(null);
	let showBest = $state(false); // Toggle between worst and best transfers

	function toggleExpand(managerId: number) {
		expandedManager = expandedManager === managerId ? null : managerId;
	}

	// Get all transfers across the league
	const allTransfers = $derived(
		entries
			.filter(e => e.entry_id && e.stats?.transfers)
			.flatMap(e =>
				e.stats.transfers.map(t => ({
					...t,
					managerId: e.entry_id!,
					managerName: `${e.player_first_name || ''} ${e.player_last_name || ''}`.trim()
				}))
			)
	);

	// Get worst transfers (most negative impact)
	const worstTransfers = $derived(
		[...allTransfers]
			.filter(t => t.netImpact < 0)
			.sort((a, b) => a.netImpact - b.netImpact)
			.slice(0, 5)
	);

	// Get best transfers (most positive impact)
	const bestTransfers = $derived(
		[...allTransfers]
			.filter(t => t.netImpact > 0)
			.sort((a, b) => b.netImpact - a.netImpact)
			.slice(0, 5)
	);

	// Get managers sorted by total transfer impact (worst first)
	const managerTransferStats = $derived(
		entries
			.filter(e => e.entry_id && e.stats?.transfers?.length > 0)
			.map(e => {
				const transfers = e.stats.transfers;
				const totalImpact = transfers.reduce((sum, t) => sum + t.netImpact, 0);
				const worstTransfer = [...transfers].sort((a, b) => a.netImpact - b.netImpact)[0];
				const bestTransfer = [...transfers].sort((a, b) => b.netImpact - a.netImpact)[0];
				const negativeTransfers = transfers.filter(t => t.netImpact < 0).length;

				return {
					managerId: e.entry_id!,
					managerName: `${e.player_first_name || ''} ${e.player_last_name || ''}`.trim(),
					totalImpact,
					transferCount: transfers.length,
					negativeTransfers,
					worstTransfer,
					bestTransfer,
					transfers
				};
			})
			.sort((a, b) => a.totalImpact - b.totalImpact)
	);

	function formatImpact(impact: number): string {
		return impact > 0 ? `+${impact}` : `${impact}`;
	}
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header class="pb-3">
		<div class="flex items-center justify-between">
			<div>
				<Card.Title class="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
					<ArrowRightLeft class="w-5 h-5 text-orange-500" />
					Transfer Regrets
				</Card.Title>
				<Card.Description class="font-mono text-xs text-muted-foreground">
					Points gained or lost from transfers
				</Card.Description>
			</div>
			<button
				onclick={() => showBest = !showBest}
				class="px-3 py-1 rounded text-xs font-mono font-semibold transition-colors {showBest ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}"
			>
				{showBest ? 'Best' : 'Worst'}
			</button>
		</div>
	</Card.Header>
	<Card.Content class="pt-0">
		<!-- Top 5 worst/best transfers -->
		<div class="mb-4">
			<h4 class="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
				{showBest ? 'Top 5 Best Transfers' : 'Top 5 Worst Transfers'}
			</h4>
			<div class="space-y-2">
				{#each (showBest ? bestTransfers : worstTransfers) as transfer, i (i)}
					<div class="flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-border">
						<div class="flex items-center gap-3">
							<span class="font-mono text-xs text-muted-foreground w-6">#{i + 1}</span>
							<div>
								<div class="flex items-center gap-2">
									<span class="font-mono text-sm text-red-400">{transfer.playerOut.name}</span>
									<span class="text-muted-foreground">→</span>
									<span class="font-mono text-sm text-green-400">{transfer.playerIn.name}</span>
								</div>
								<div class="font-mono text-xs text-muted-foreground">
									{transfer.managerName} • GW{transfer.gameweek}
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="font-mono text-sm font-bold {transfer.netImpact > 0 ? 'text-green-500' : 'text-red-500'}">
								{formatImpact(transfer.netImpact)} pts
							</div>
							<div class="font-mono text-xs text-muted-foreground">
								+{transfer.pointsGained} / -{transfer.pointsLost}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Manager breakdown -->
		<div class="border-t border-border pt-4">
			<h4 class="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
				By Manager
			</h4>
			<div class="space-y-2">
				{#each managerTransferStats as manager (manager.managerId)}
					<div class="bg-muted/30 rounded-lg border border-border overflow-hidden">
						<button
							onclick={() => toggleExpand(manager.managerId)}
							class="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
						>
							<div class="flex items-center gap-3">
								<div class="font-mono text-sm font-semibold text-foreground">
									{manager.managerName}
								</div>
								<span class="font-mono text-xs text-muted-foreground">
									{manager.transferCount} transfers
								</span>
								{#if manager.negativeTransfers > 0}
									<div class="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10">
										<TrendingDown class="w-3 h-3 text-red-500" />
										<span class="font-mono text-xs font-bold text-red-500">
											{manager.negativeTransfers}
										</span>
									</div>
								{/if}
							</div>
							<div class="flex items-center gap-4">
								<div class="text-right">
									<div class="font-mono text-sm font-bold {manager.totalImpact > 0 ? 'text-green-500' : manager.totalImpact < 0 ? 'text-red-500' : 'text-muted-foreground'}">
										{formatImpact(manager.totalImpact)} pts
									</div>
								</div>
								{#if expandedManager === manager.managerId}
									<ChevronUp class="w-4 h-4 text-muted-foreground" />
								{:else}
									<ChevronDown class="w-4 h-4 text-muted-foreground" />
								{/if}
							</div>
						</button>

						{#if expandedManager === manager.managerId}
							<div class="border-t border-border p-3 bg-background/50">
								<div class="space-y-2 max-h-48 overflow-y-auto">
									{#each manager.transfers.sort((a, b) => a.netImpact - b.netImpact) as transfer (transfer.gameweek + '-' + transfer.playerIn.id)}
										<div class="flex items-center justify-between p-2 rounded {transfer.netImpact < 0 ? 'bg-red-500/5' : transfer.netImpact > 0 ? 'bg-green-500/5' : 'bg-muted/20'}">
											<div class="flex items-center gap-3">
												<span class="font-mono text-xs text-muted-foreground w-8">
													GW{transfer.gameweek}
												</span>
												<div class="flex items-center gap-2">
													<span class="font-mono text-xs text-red-400">{transfer.playerOut.name}</span>
													<span class="text-muted-foreground text-xs">→</span>
													<span class="font-mono text-xs text-green-400">{transfer.playerIn.name}</span>
												</div>
											</div>
											<div class="flex items-center gap-3">
												<div class="font-mono text-xs text-muted-foreground">
													+{transfer.pointsGained} / -{transfer.pointsLost}
												</div>
												<div class="font-mono text-xs font-bold {transfer.netImpact > 0 ? 'text-green-500' : transfer.netImpact < 0 ? 'text-red-500' : 'text-muted-foreground'}">
													{formatImpact(transfer.netImpact)}
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</Card.Content>
</Card.Root>
