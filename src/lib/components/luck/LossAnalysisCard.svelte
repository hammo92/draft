<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Target, Frown, Skull, AlertTriangle, Scale, Trophy } from "@lucide/svelte";
	import type { ManagerLossAnalysis, LossCategory } from "$lib/types/fpl";

	let {
		lossAnalysis = []
	}: {
		lossAnalysis: ManagerLossAnalysis[];
	} = $props();

	// Consolidated category config to avoid repetitive switch statements
	const categoryConfig: Record<LossCategory, { color: string; bg: string; label: string; icon: typeof Scale }> = {
		'fair': { color: 'text-muted-foreground', bg: 'bg-muted/30', label: 'Fair', icon: Scale },
		'self-inflicted': { color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Self', icon: Frown },
		'opponent-luck': { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Opp Luck', icon: AlertTriangle },
		'robbery': { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Robbery', icon: Skull },
		'mixed': { color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Mixed', icon: Target }
	};

	// Helper to get category data for a manager
	function getCategoryData(manager: ManagerLossAnalysis) {
		return [
			{ key: 'fair' as LossCategory, count: manager.fairLosses, fp: manager.fpLostToFair },
			{ key: 'self-inflicted' as LossCategory, count: manager.selfInflictedLosses, fp: manager.fpLostToSelf },
			{ key: 'opponent-luck' as LossCategory, count: manager.opponentLuckLosses, fp: manager.fpLostToOpponentLuck },
			{ key: 'robbery' as LossCategory, count: manager.robberyLosses, fp: manager.fpLostToRobberies },
			{ key: 'mixed' as LossCategory, count: manager.mixedLosses, fp: manager.fpLostToMixed }
		];
	}
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header>
		<div class="flex items-center justify-between flex-wrap gap-4">
			<div>
				<Card.Title class="font-sans text-lg font-semibold text-foreground flex items-center gap-2">
					<Target class="w-5 h-5 text-accent" />
					Loss Analysis
				</Card.Title>
				<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
					Why did each loss happen?
				</Card.Description>
			</div>
		</div>
	</Card.Header>
	<Card.Content>
		{#if lossAnalysis.length === 0}
			<div class="text-center py-8">
				<p class="font-mono text-sm text-muted-foreground">No loss data available</p>
			</div>
		{:else}
			<div class="mb-6 p-4 bg-muted/50 rounded border border-border">
				<p class="font-mono text-xs text-muted-foreground leading-relaxed">
					<span class="font-semibold text-foreground">Loss categories:</span>
					<span class="text-muted-foreground">Fair</span> (outscored fairly),
					<span class="text-orange-500">Self</span> (you underperformed 8+ pts),
					<span class="text-amber-500">Opp Luck</span> (they overperformed 8+ pts),
					<span class="text-red-500">Robbery</span> (single player haul),
					<span class="text-purple-500">Mixed</span> (both factors).
				</p>
			</div>

			<div class="space-y-4">
				{#each lossAnalysis as manager (manager.managerId)}
					<div class="border border-border rounded-lg overflow-hidden">
						<div class="p-4 bg-card">
							<!-- Header -->
							<div class="flex items-center justify-between mb-3">
								<div>
									<h3 class="font-sans text-base font-semibold text-foreground">
										{manager.managerName}
									</h3>
									<span class="font-mono text-xs text-muted-foreground">
										{manager.totalWins}W - {manager.totalDraws}D - {manager.totalLosses}L
									</span>
								</div>
								<div class="text-right">
									<div class="font-mono text-base font-bold text-red-500">
										-{manager.totalFPLost} FP
									</div>
									<span class="font-mono text-xs text-muted-foreground">total lost</span>
								</div>
							</div>

							<!-- Loss breakdown grid - responsive -->
							{#if manager.totalLosses > 0}
								<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
									{#each getCategoryData(manager) as cat}
										{@const config = categoryConfig[cat.key]}
										{@const isRobbery = cat.key === 'robbery'}
										<div class="{config.bg} rounded p-2 text-center border border-border" role="group" aria-label="{config.label} losses">
											<div class="flex items-center justify-center gap-1 mb-1">
												<svelte:component this={config.icon} class="w-4 h-4 {config.color}" aria-hidden="true" />
											</div>
											<div class="font-mono text-sm font-semibold {config.color}">
												{cat.count}
											</div>
											<div class="font-mono text-xs text-muted-foreground">{config.label}</div>
											<div class="font-mono text-xs {config.color}">
												-{cat.fp} FP
											</div>
											{#if isRobbery && manager.robberiesAlsoSelfInflicted > 0}
												<div class="font-mono text-xs text-orange-400 mt-1" title="You also underperformed in {manager.robberiesAlsoSelfInflicted} of these">
													({manager.robberiesAlsoSelfInflicted} also self)
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-center py-2 mb-3 bg-green-500/10 rounded border border-border">
									<span class="font-mono text-xs text-green-500">No losses - perfect record!</span>
								</div>
							{/if}

							<!-- Lucky outcomes (wins, draws) -->
							{#if manager.luckyWins > 0 || manager.luckyDraws > 0 || manager.unluckyDraws > 0}
								<div class="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-border">
									{#if manager.luckyWins > 0}
										<div class="flex items-center gap-1.5">
											<Trophy class="w-4 h-4 text-green-500" aria-hidden="true" />
											<span class="font-mono text-xs text-muted-foreground">
												{manager.luckyWins} lucky win{manager.luckyWins > 1 ? 's' : ''} (+{manager.fpGainedFromLuck} FP)
											</span>
										</div>
									{/if}
									{#if manager.luckyDraws > 0}
										<div class="flex items-center gap-1.5">
											<span class="w-4 h-4 text-center font-mono text-xs font-bold text-green-400">D</span>
											<span class="font-mono text-xs text-muted-foreground">
												{manager.luckyDraws} lucky draw{manager.luckyDraws > 1 ? 's' : ''}
											</span>
										</div>
									{/if}
									{#if manager.unluckyDraws > 0}
										<div class="flex items-center gap-1.5">
											<span class="w-4 h-4 text-center font-mono text-xs font-bold text-red-400">D</span>
											<span class="font-mono text-xs text-muted-foreground">
												{manager.unluckyDraws} unlucky draw{manager.unluckyDraws > 1 ? 's' : ''}
											</span>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
