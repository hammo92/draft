<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { ChevronDown, ChevronUp, AlertTriangle } from "@lucide/svelte";
	import type { ManagerRobberies } from "$lib/types/fpl";

	let { robberies = [] }: { robberies: ManagerRobberies[] } = $props();

	let expandedManager = $state<number | null>(null);

	function toggleManager(managerId: number) {
		expandedManager = expandedManager === managerId ? null : managerId;
	}

	function getStarRating(rating: number): string {
		return "★".repeat(rating) + "☆".repeat(5 - rating);
	}

	function getRatingColor(rating: number): string {
		if (rating >= 4) return "text-red-500";
		if (rating >= 3) return "text-orange-500";
		if (rating >= 2) return "text-yellow-500";
		return "text-muted-foreground";
	}
</script>

{#if robberies.length > 0}
	<Card.Root class="bg-card border border-border rounded shadow-none">
		<Card.Header class="pb-3">
			<Card.Title class="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
				<AlertTriangle class="w-5 h-5 text-red-500" />
				Robbery Report
			</Card.Title>
			<Card.Description class="font-mono text-xs text-muted-foreground">
				Losses caused by a single player massively overperforming
			</Card.Description>
		</Card.Header>
		<Card.Content class="pt-0">
			<div class="space-y-3">
				{#each robberies as manager (manager.managerId)}
					<div class="border border-border rounded-lg overflow-hidden">
						<button
							onclick={() => toggleManager(manager.managerId)}
							class="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
						>
							<div class="flex items-center gap-3">
								<div class="font-mono text-sm font-semibold text-foreground">
									{manager.managerName}
								</div>
								<div class="font-mono text-xs px-2 py-0.5 bg-red-500/10 text-red-500 rounded">
									{manager.totalRobberies} {manager.totalRobberies === 1 ? "robbery" : "robberies"}
								</div>
							</div>
							<div class="flex items-center gap-2">
								<span class="font-mono text-xs text-muted-foreground">
									{Math.round(manager.totalPointsStolen)} pts stolen
								</span>
								{#if expandedManager === manager.managerId}
									<ChevronUp class="w-4 h-4 text-muted-foreground" />
								{:else}
									<ChevronDown class="w-4 h-4 text-muted-foreground" />
								{/if}
							</div>
						</button>

						{#if expandedManager === manager.managerId}
							<div class="p-3 space-y-4 border-t border-border bg-card">
								{#each manager.robberies as robbery (robbery.gameweek)}
									<div class="p-3 bg-muted/20 rounded-lg border-l-2 border-l-red-500">
										<div class="flex items-center justify-between mb-2">
											<span class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
												GW{robbery.gameweek}
											</span>
											<span class="font-mono text-sm {getRatingColor(robbery.robberyRating)}">
												{getStarRating(robbery.robberyRating)}
											</span>
										</div>

										<div class="mb-3">
											<div class="font-mono text-sm">
												<span class="text-red-400">Lost</span> to {robbery.opponentName}
											</div>
											<div class="flex items-center gap-3 mt-1">
												<span class="font-mono text-lg font-bold text-foreground">
													{robbery.yourScore} - {robbery.theirScore}
												</span>
												<span class="font-mono text-xs text-muted-foreground">
													(margin: {robbery.margin})
												</span>
											</div>
										</div>

										<div class="bg-card p-2 rounded border border-border mb-3">
											<div class="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-1">
												The Culprit
											</div>
											<div class="flex items-center justify-between">
												<div>
													<span class="font-mono text-sm font-semibold text-amber-500">
														{robbery.culprit.playerName}
													</span>
													<div class="font-mono text-xs text-muted-foreground mt-0.5">
														{robbery.culprit.goals}G {robbery.culprit.assists}A
														<span class="mx-1">|</span>
														expected: {robbery.culprit.expectedGoals.toFixed(2)}G {robbery.culprit.expectedAssists.toFixed(2)}A
													</div>
												</div>
												<div class="text-right">
													<div class="font-mono text-sm font-bold text-green-500">
														+{robbery.culprit.luckPoints} pts
													</div>
													<div class="font-mono text-xs text-muted-foreground">
														player luck
													</div>
												</div>
											</div>
										</div>

										<div class="font-mono text-xs">
											<span class="text-muted-foreground">Real scoreline:</span>
											<span class="text-foreground ml-1">
												{robbery.realScoreline.you} - {robbery.realScoreline.them}
											</span>
											{#if robbery.realScoreline.you > robbery.realScoreline.them}
												<span class="text-green-500 ml-2">(You would've won!)</span>
											{:else if robbery.realScoreline.you === robbery.realScoreline.them}
												<span class="text-yellow-500 ml-2">(Would've been a draw)</span>
											{:else}
												<span class="text-muted-foreground ml-2">(Still would've lost)</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root class="bg-card border border-border rounded shadow-none">
		<Card.Header class="pb-3">
			<Card.Title class="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
				<AlertTriangle class="w-5 h-5 text-muted-foreground" />
				Robbery Report
			</Card.Title>
		</Card.Header>
		<Card.Content class="pt-0">
			<p class="font-mono text-sm text-muted-foreground">
				No robberies detected this season. Everyone's losses appear to be deserved!
			</p>
		</Card.Content>
	</Card.Root>
{/if}
