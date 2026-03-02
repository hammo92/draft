<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Scale, TrendingDown, ChevronDown, ChevronUp } from "@lucide/svelte";
	import type { ManagerWouldHaveBeat } from "$lib/types/fpl";

	let { data = [] }: { data: ManagerWouldHaveBeat[] } = $props();

	let expandedManager = $state<number | null>(null);

	function toggleExpand(managerId: number) {
		expandedManager = expandedManager === managerId ? null : managerId;
	}

	function getResultColor(result: 'W' | 'L' | 'D'): string {
		if (result === 'W') return 'text-green-500';
		if (result === 'L') return 'text-red-500';
		return 'text-yellow-500';
	}

	function getResultBg(result: 'W' | 'L' | 'D'): string {
		if (result === 'W') return 'bg-green-500/10';
		if (result === 'L') return 'bg-red-500/10';
		return 'bg-yellow-500/10';
	}

	// Calculate beat percentage for a gameweek
	function getBeatPercentage(beaten: number, total: number): number {
		if (total <= 1) return 0;
		return Math.round((beaten / (total - 1)) * 100);
	}
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header class="pb-3">
		<Card.Title class="font-sans text-lg font-semibold text-foreground flex items-center gap-2">
			<Scale class="w-5 h-5 text-purple-500" />
			Fixture Luck
		</Card.Title>
		<Card.Description class="font-mono text-xs text-muted-foreground">
			How many managers you would have beaten each week
		</Card.Description>
	</Card.Header>
	<Card.Content class="pt-0">
		<div class="space-y-3">
			{#each data as manager (manager.managerId)}
				<div class="bg-muted/30 rounded-lg border border-border overflow-hidden">
					<button
						onclick={() => toggleExpand(manager.managerId)}
						class="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
					>
						<div class="flex items-center gap-3">
							<div class="font-mono text-sm font-semibold text-foreground">
								{manager.managerName}
							</div>
							{#if manager.totalUnluckyWeeks > 0}
								<div class="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-500">
									<TrendingDown class="w-3 h-3" />
									<span class="font-mono text-xs font-bold">
										{manager.totalUnluckyWeeks} unlucky
									</span>
								</div>
							{/if}
						</div>
						<div class="flex items-center gap-4">
							<div class="text-right">
								<div class="font-mono text-xs text-muted-foreground">Avg Rank</div>
								<div class="font-mono text-sm font-bold text-foreground">
									#{manager.averageRank}
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
							<div class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
								{#each manager.gameweeks as gw (gw.gameweek)}
									<div class="flex items-center justify-between p-2 rounded {gw.unluckyDraw ? 'bg-red-500/5 border border-red-500/20' : 'bg-muted/20'}">
										<div class="flex items-center gap-3">
											<span class="font-mono text-xs text-muted-foreground w-8">
												GW{gw.gameweek}
											</span>
											<span class="font-mono text-sm font-semibold {getResultColor(gw.actualResult)}">
												{gw.actualResult}
											</span>
											<span class="font-mono text-xs text-muted-foreground">
												vs {gw.actualOpponent}
											</span>
										</div>
										<div class="flex items-center gap-3">
											<div class="text-right">
												<span class="font-mono text-xs text-muted-foreground">Score: </span>
												<span class="font-mono text-sm font-semibold text-foreground">{gw.score}</span>
											</div>
											<div class="px-2 py-0.5 rounded {gw.wouldHaveBeaten >= Math.floor(gw.totalManagers / 2) ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}">
												<span class="font-mono text-xs font-bold">
													Beat {gw.wouldHaveBeaten}/{gw.totalManagers - 1}
												</span>
											</div>
											{#if gw.unluckyDraw}
												<span class="font-mono text-xs text-red-500 font-bold">UNLUCKY</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Summary stats -->
		<div class="mt-4 pt-4 border-t border-border">
			<div class="grid grid-cols-2 gap-4">
				<div class="p-3 bg-muted/30 rounded-lg">
					<div class="font-mono text-xs text-muted-foreground mb-1">Most Unlucky</div>
					{#if data[0]}
						<div class="font-mono text-sm font-semibold text-red-500">
							{data[0].managerName}
						</div>
						<div class="font-mono text-xs text-muted-foreground">
							{data[0].totalUnluckyWeeks} weeks where they beat most but lost
						</div>
					{/if}
				</div>
				<div class="p-3 bg-muted/30 rounded-lg">
					<div class="font-mono text-xs text-muted-foreground mb-1">Luckiest Schedule</div>
					{#if data.length > 0}
						{@const luckiest = [...data].sort((a, b) => a.totalUnluckyWeeks - b.totalUnluckyWeeks)[0]}
						<div class="font-mono text-sm font-semibold text-green-500">
							{luckiest.managerName}
						</div>
						<div class="font-mono text-xs text-muted-foreground">
							Only {luckiest.totalUnluckyWeeks} unlucky weeks
						</div>
					{/if}
				</div>
			</div>
		</div>
	</Card.Content>
</Card.Root>
