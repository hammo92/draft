<script lang="ts">
	let { sortedByBenchPoints = [] }: { sortedByBenchPoints: any[] } = $props();

	function getBarColor(benchPoints: number) {
		if (benchPoints >= 15) return 'bg-gradient-to-r from-red-400 to-red-500';
		if (benchPoints >= 8) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
		return 'bg-gradient-to-r from-cyan-400 to-blue-500';
	}
</script>

<div class="space-y-6">
	<h3 class="text-fpl-purple text-xl font-semibold">Recent Gameweek Breakdown</h3>
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each sortedByBenchPoints as entry}
			<div class="p-6 bg-muted rounded-lg">
				<h4 class="text-fpl-purple font-semibold mb-4">{entry.entry_name}</h4>
				<div class="flex flex-col gap-3">
					{#each entry.stats.benchPointsByGameweek.sort((a: any, b: any) => b.gameweek - a.gameweek) as gwData}
						<div class="flex flex-col gap-1">
							<div class="flex justify-between text-sm">
								<span class="font-semibold text-foreground">GW{gwData.gameweek}</span>
								<span class="font-semibold text-muted-foreground">{gwData.benchPoints} pts</span>
							</div>
							<div class="h-2 bg-muted-foreground/20 rounded overflow-hidden">
								<div
									class="h-full rounded transition-all {getBarColor(gwData.benchPoints)}"
									style="width: {Math.min((gwData.benchPoints / 25) * 100, 100)}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
