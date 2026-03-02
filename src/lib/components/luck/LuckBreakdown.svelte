<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, Shield, Zap, Award, AlertCircle, Clock } from "@lucide/svelte";
	import type { ManagerLuckBreakdown } from "$lib/types/fpl";

	let { breakdown = [] }: { breakdown: ManagerLuckBreakdown[] } = $props();

	let expandedManager = $state<number | null>(null);

	function toggleManager(managerId: number) {
		expandedManager = expandedManager === managerId ? null : managerId;
	}

	function getLuckColor(luck: number): string {
		if (luck >= 10) return "text-green-500";
		if (luck >= 5) return "text-green-400";
		if (luck >= 0) return "text-muted-foreground";
		if (luck >= -5) return "text-red-400";
		return "text-red-500";
	}

	function getLuckBgColor(luck: number): string {
		if (luck >= 5) return "bg-green-500/10";
		if (luck >= 0) return "bg-muted/30";
		return "bg-red-500/10";
	}

	function formatLuck(luck: number): string {
		return luck >= 0 ? `+${luck.toFixed(1)}` : luck.toFixed(1);
	}

	const componentInfo = {
		appearance: { label: "Appearance", icon: Clock, description: "Playing time vs expected (2 pts for 60+ mins)" },
		goals: { label: "Goals", icon: Target, description: "Goals vs expected from season average" },
		assists: { label: "Assists", icon: Zap, description: "Assists vs expected from season average" },
		cleanSheets: { label: "Clean Sheets", icon: Shield, description: "CS probability based on opponent xG" },
		goalsConceded: { label: "Goals Conceded", icon: AlertCircle, description: "GC vs expected from opponent xG" },
		bonus: { label: "Bonus", icon: Award, description: "Bonus vs expected from season average" },
		saves: { label: "Saves", icon: Shield, description: "GK saves vs expected (FDR adjusted)" },
		rareEvents: { label: "Cards/OG/Pens", icon: AlertCircle, description: "Yellow/Red cards, own goals, penalty events" }
	};
</script>

{#if breakdown.length > 0}
	<Card.Root class="bg-card border border-border rounded shadow-none">
		<Card.Header class="pb-3">
			<Card.Title class="font-sans text-lg font-semibold text-foreground flex items-center gap-2">
				<Target class="w-5 h-5 text-accent" />
				Holistic Luck Breakdown
			</Card.Title>
			<Card.Description class="font-mono text-xs text-muted-foreground">
				Points-based luck across all scoring components (actual - expected)
			</Card.Description>
		</Card.Header>
		<Card.Content class="pt-0">
			<div class="space-y-3">
				{#each breakdown as manager (manager.managerId)}
					<div class="border border-border rounded-lg overflow-hidden">
						<button
							onclick={() => toggleManager(manager.managerId)}
							class="w-full flex items-center justify-between p-3 {getLuckBgColor(manager.totalLuck)} hover:bg-muted/50 transition-colors"
						>
							<div class="flex items-center gap-3">
								<div class="font-mono text-sm font-semibold text-foreground">
									{manager.managerName}
								</div>
							</div>
							<div class="flex items-center gap-2">
								<div class="flex items-center gap-1">
									{#if manager.totalLuck >= 0}
										<TrendingUp class="w-4 h-4 text-green-500" />
									{:else}
										<TrendingDown class="w-4 h-4 text-red-500" />
									{/if}
									<span class="font-mono text-sm font-bold {getLuckColor(manager.totalLuck)}">
										{formatLuck(manager.totalLuck)} pts
									</span>
								</div>
								{#if expandedManager === manager.managerId}
									<ChevronUp class="w-4 h-4 text-muted-foreground" />
								{:else}
									<ChevronDown class="w-4 h-4 text-muted-foreground" />
								{/if}
							</div>
						</button>

						{#if expandedManager === manager.managerId}
							<div class="p-4 space-y-4 border-t border-border bg-card">
								<!-- Component Breakdown -->
								<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
									{#each Object.entries(manager.components) as [key, value]}
										{@const info = componentInfo[key as keyof typeof componentInfo]}
										{#if info}
											{@const Icon = info.icon}
											<div class="bg-muted/30 rounded p-2">
												<div class="flex items-center gap-1.5 mb-1">
													<Icon class="w-3 h-3 text-muted-foreground" />
													<span class="font-mono text-xs text-muted-foreground">{info.label}</span>
												</div>
												<div class="font-mono text-sm font-semibold {getLuckColor(value)}">
													{formatLuck(value)}
												</div>
											</div>
										{/if}
									{/each}
								</div>

								<!-- Per-GW Breakdown (sparkline style) -->
								{#if manager.gameweeks.length > 0}
									<div class="border-t border-border pt-3">
										<div class="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
											Weekly Luck
										</div>
										<div class="flex gap-1 flex-wrap">
											{#each manager.gameweeks as gw}
												<div
													class="flex flex-col items-center px-1.5 py-1 rounded {getLuckBgColor(gw.luck)}"
													title="GW{gw.gameweek}: {formatLuck(gw.luck)} pts"
												>
													<span class="font-mono text-[10px] text-muted-foreground">GW{gw.gameweek}</span>
													<span class="font-mono text-xs font-semibold {getLuckColor(gw.luck)}">
														{gw.luck >= 0 ? '+' : ''}{gw.luck.toFixed(0)}
													</span>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
{/if}
