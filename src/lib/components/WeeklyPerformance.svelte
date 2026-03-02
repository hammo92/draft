<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import GameweekSelector from "$lib/components/shared/GameweekSelector.svelte";
	import SeasonGrid from "$lib/components/weekly/SeasonGrid.svelte";

	let { entries = [], startGameweek = 1, currentGameweek = 1 }: { entries: any[], startGameweek: number, currentGameweek: number } = $props();

	// Build a matrix of all gameweeks and their points
	let performanceMatrix = $derived(
		entries.map(entry => {
			const gwMap = new Map();
			entry.history.forEach((h: any) => {
				gwMap.set(h.event, h.points);
			});

			return {
				...entry,
				gameweekPoints: Array.from({ length: currentGameweek - startGameweek + 1 }, (_, i) => {
					const gw = startGameweek + i;
					return {
						gameweek: gw,
						points: gwMap.get(gw) || 0
					};
				})
			};
		})
	);

	let selectedGameweek = $state(currentGameweek);

	let gameweekData = $derived(
		performanceMatrix
			.map(entry => ({
				entry_name: entry.entry_name,
				player_name: entry.player_name,
				points: entry.gameweekPoints.find((gw: any) => gw.gameweek === selectedGameweek)?.points || 0
			}))
			.sort((a, b) => b.points - a.points)
	);
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header>
		<Card.Title class="font-sans text-2xl font-semibold text-foreground">Weekly Performance</Card.Title>
		<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Detailed gameweek-by-gameweek analysis</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		<GameweekSelector
			bind:selectedGameweek
			{startGameweek}
			{currentGameweek}
		/>

		<!-- Gameweek Leaderboard -->
		<div class="space-y-4">
			<h3 class="font-sans text-xl font-semibold text-foreground">Gameweek {selectedGameweek} Results</h3>
			<div class="flex flex-col gap-3">
				{#each gameweekData as manager, index}
					{@const podiumClass = index === 0
						? 'bg-amber-500/20 border-amber-500'
						: index === 1
						? 'bg-slate-400/20 border-slate-400'
						: index === 2
						? 'bg-orange-600/20 border-orange-600'
						: 'bg-muted border-border'}
					<div
						class="grid grid-cols-[60px_1fr_80px] md:grid-cols-[60px_1fr_100px] gap-4 items-center p-4 rounded-lg border-l-4 transition-all hover:translate-x-1 hover:shadow-md {podiumClass}"
					>
						<div class="text-2xl font-bold text-center">
							{#if index === 0}
								🥇
							{:else if index === 1}
								🥈
							{:else if index === 2}
								🥉
							{:else}
								<Badge variant="outline">{index + 1}</Badge>
							{/if}
						</div>
						<div>
							<h4 class="font-sans font-semibold text-foreground">{manager.entry_name}</h4>
							<p class="font-mono text-xs text-muted-foreground">{manager.player_name}</p>
						</div>
						<div class="text-3xl md:text-3xl font-bold text-foreground text-center">{manager.points}</div>
					</div>
				{/each}
			</div>
		</div>

		<Separator />

		<SeasonGrid
			{performanceMatrix}
			{startGameweek}
			{currentGameweek}
		/>
	</Card.Content>
</Card.Root>
