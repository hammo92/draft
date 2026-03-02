<script lang="ts">
	let { squadStrength = [] }: { squadStrength: any[] } = $props();

	function getPodiumClass(index: number): string {
		if (index === 0) return 'bg-amber-500/20 border-amber-500';
		if (index === 1) return 'bg-slate-400/20 border-slate-400';
		if (index === 2) return 'bg-orange-600/20 border-orange-600';
		return 'bg-muted border-border';
	}
</script>

<div class="space-y-6">
	<div>
		<h3 class="font-sans text-xl font-semibold text-foreground">Squad Strength Comparison</h3>
		<p class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Total points accumulated by each squad</p>
	</div>

	<div class="flex flex-col gap-4">
		{#each squadStrength as squad, index}
			<div
				class="grid grid-cols-1 md:grid-cols-[60px_1fr_2fr] gap-6 items-center p-6 rounded-lg border-l-4 {getPodiumClass(index)}"
			>
				<div class="text-2xl font-bold text-foreground text-center">#{index + 1}</div>
				<div>
					<h4 class="font-sans font-semibold text-foreground">{squad.entry_name}</h4>
					<div class="font-mono text-xs text-muted-foreground">{squad.totalPoints.toLocaleString()} total points</div>
				</div>
				<div class="flex flex-col gap-2">
					{#each Object.entries(squad.positions) as [position, points]}
						{@const maxPoints = Math.max(...squadStrength.map((s) => s.positions[position]))}
						{@const percentage = maxPoints > 0 ? ((points as number) / maxPoints) * 100 : 0}
						{@const isTop = points === maxPoints}
						<div class="grid grid-cols-[40px_1fr] gap-2 items-center">
							<span class="font-mono text-xs font-semibold text-muted-foreground">{position.substring(0, 3)}</span>
							<div class="h-6 bg-muted-foreground/20 rounded overflow-hidden relative">
								<div
									class="h-full flex items-center justify-end pr-2 text-xs font-mono font-bold transition-all
									{isTop ? 'bg-green-500' :
									percentage >= 80 ? 'bg-green-400/80' :
									percentage >= 60 ? 'bg-yellow-400' :
									'bg-red-400'}"
									style="width: {percentage}%"
								>
									<span class="{isTop || percentage < 60 ? 'text-white' : 'text-black'}">{points}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
