<script lang="ts">
	let {
		performanceMatrix = [],
		startGameweek,
		currentGameweek
	}: {
		performanceMatrix: any[];
		startGameweek: number;
		currentGameweek: number;
	} = $props();
</script>

<div class="space-y-4">
	<h3 class="font-sans text-xl font-semibold text-foreground">Full Season Overview</h3>
	<div class="overflow-x-auto bg-muted rounded-lg p-4">
		<div class="grid gap-2" style="grid-template-columns: 150px repeat({currentGameweek - startGameweek + 1}, 45px) 70px;">
			<!-- Header Row -->
			<div class="contents font-mono text-xs uppercase text-muted-foreground border-b-2 border-border pb-2">
				<div class="pb-2">Manager</div>
				{#each Array.from({ length: currentGameweek - startGameweek + 1 }, (_, i) => startGameweek + i) as gw}
					<div class="text-center pb-2">GW{gw}</div>
				{/each}
				<div class="text-center pb-2">Total</div>
			</div>

			<!-- Data Rows -->
			{#each performanceMatrix as entry}
				<div class="contents border-b border-border/50 py-2">
					<div class="font-sans font-semibold text-muted-foreground text-sm py-2">{entry.entry_name}</div>
					{#each entry.gameweekPoints as gwData}
						{@const points = gwData.points}
						<div
							class="text-center text-sm font-mono font-semibold rounded py-1
							{points >= 55 ? 'bg-green-500 text-white' :
							points >= 45 ? 'bg-green-400/80 text-black' :
							points >= 35 ? 'bg-yellow-400 text-black' :
							points > 0 ? 'bg-red-400 text-white' :
							'bg-muted-foreground/20 text-muted-foreground'}"
						>
							{points || '-'}
						</div>
					{/each}
					<div class="text-center font-mono font-bold text-white bg-emerald-600 rounded py-1">
						{entry.history.reduce((sum: number, h: any) => sum + h.points, 0)}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
