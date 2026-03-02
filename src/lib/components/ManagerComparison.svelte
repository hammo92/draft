<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import * as Select from "$lib/components/ui/select";
	import Badge from "$lib/components/ui/badge/badge.svelte";

	let { entries = [] }: { entries: any[] } = $props();

	let manager1 = $state(entries[0]?.entry_id || null);
	let manager2 = $state(entries[1]?.entry_id || null);

	let comparison = $derived(() => {
		const m1 = entries.find((e: any) => e.entry_id === manager1);
		const m2 = entries.find((e: any) => e.entry_id === manager2);

		if (!m1 || !m2) return null;

		const m1Total = m1.history.reduce((sum: number, h: any) => sum + h.points, 0);
		const m2Total = m2.history.reduce((sum: number, h: any) => sum + h.points, 0);

		// Get last gameweek points
		const m1LastGW = m1.history[m1.history.length - 1]?.points || 0;
		const m2LastGW = m2.history[m2.history.length - 1]?.points || 0;

		return {
			m1,
			m2,
			m1Total,
			m2Total,
			m1LastGW,
			m2LastGW,
			difference: m1Total - m2Total,
			m1Avg: m1.stats.averagePoints,
			m2Avg: m2.stats.averagePoints,
			m1BenchTotal: m1.stats.totalBenchPoints,
			m2BenchTotal: m2.stats.totalBenchPoints
		};
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="text-accent text-2xl">🎯 Manager Comparison</Card.Title>
		<Card.Description>Compare two managers head-to-head</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		<!-- Manager Selectors -->
		<div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-center p-4 bg-muted rounded-lg">
			<div class="flex flex-col gap-2">
				<label for="manager1" class="font-semibold text-accent text-sm">Manager 1:</label>
				<select
					id="manager1"
					bind:value={manager1}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
				>
					{#each entries as entry}
						<option value={entry.entry_id}>{entry.entry_name} ({entry.player_name})</option>
					{/each}
				</select>
			</div>

			<div class="hidden md:block text-center text-2xl font-bold text-accent">VS</div>

			<div class="flex flex-col gap-2">
				<label for="manager2" class="font-semibold text-accent text-sm">Manager 2:</label>
				<select
					id="manager2"
					bind:value={manager2}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
				>
					{#each entries as entry}
						<option value={entry.entry_id}>{entry.entry_name} ({entry.player_name})</option>
					{/each}
				</select>
			</div>
		</div>

		{#if comparison()}
			{@const comp = comparison()}
			<div class="space-y-6">
				<!-- Stats Comparison -->
				<div class="space-y-3">
					<!-- Season Total Points -->
					<div class="grid grid-cols-[1fr_auto_auto] gap-4 items-center p-4 bg-muted rounded-lg">
						<div class="font-semibold text-muted-foreground">Season Total Points</div>
						<Badge variant={comp.m1Total > comp.m2Total ? "default" : "outline"} class="text-lg font-bold min-w-20 justify-center">
							{comp.m1Total}
						</Badge>
						<Badge variant={comp.m2Total > comp.m1Total ? "default" : "outline"} class="text-lg font-bold min-w-20 justify-center">
							{comp.m2Total}
						</Badge>
					</div>

					<!-- Last Gameweek Points -->
					<div class="grid grid-cols-[1fr_auto_auto] gap-4 items-center p-4 bg-muted rounded-lg">
						<div class="font-semibold text-muted-foreground">Last Gameweek Points</div>
						<Badge variant={comp.m1LastGW > comp.m2LastGW ? "default" : "outline"} class="text-lg font-bold min-w-20 justify-center">
							{comp.m1LastGW}
						</Badge>
						<Badge variant={comp.m2LastGW > comp.m1LastGW ? "default" : "outline"} class="text-lg font-bold min-w-20 justify-center">
							{comp.m2LastGW}
						</Badge>
					</div>

					<!-- Average per GW -->
					<div class="grid grid-cols-[1fr_auto_auto] gap-4 items-center p-4 bg-muted rounded-lg">
						<div class="font-semibold text-muted-foreground">Average per GW</div>
						<Badge variant={comp.m1Avg > comp.m2Avg ? "default" : "outline"} class="text-lg font-bold min-w-20 justify-center">
							{comp.m1Avg.toFixed(1)}
						</Badge>
						<Badge variant={comp.m2Avg > comp.m1Avg ? "default" : "outline"} class="text-lg font-bold min-w-20 justify-center">
							{comp.m2Avg.toFixed(1)}
						</Badge>
					</div>

					<!-- Bench Points -->
					<div class="grid grid-cols-[1fr_auto_auto] gap-4 items-center p-4 bg-muted rounded-lg">
						<div class="font-semibold text-muted-foreground">Total Bench Points <span class="text-xs">(lower is better)</span></div>
						<Badge variant={comp.m1BenchTotal < comp.m2BenchTotal ? "default" : "outline"} class="text-lg font-bold min-w-20 justify-center">
							{comp.m1BenchTotal}
						</Badge>
						<Badge variant={comp.m2BenchTotal < comp.m1BenchTotal ? "default" : "outline"} class="text-lg font-bold min-w-20 justify-center">
							{comp.m2BenchTotal}
						</Badge>
					</div>

					<!-- Total Transfers -->
					<div class="grid grid-cols-[1fr_auto_auto] gap-4 items-center p-4 bg-muted rounded-lg">
						<div class="font-semibold text-muted-foreground">Total Transfers</div>
						<Badge variant="outline" class="text-lg font-bold min-w-20 justify-center">
							{comp.m1.transfers?.length ?? 0}
						</Badge>
						<Badge variant="outline" class="text-lg font-bold min-w-20 justify-center">
							{comp.m2.transfers?.length ?? 0}
						</Badge>
					</div>
				</div>

				<!-- Form Comparison -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-accent">Weekly Form (Last 5 GWs)</Card.Title>
						<Card.Description>Gameweek points over recent fixtures</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="space-y-3">
								<h4 class="font-semibold text-accent">{comp.m1.entry_name}</h4>
								<div class="flex justify-around items-end h-32 gap-2">
									{#each comp.m1.stats.form as points}
										<div class="flex-1 bg-gradient-to-t from-purple-500 to-purple-700 rounded flex items-start justify-center pt-1 text-white text-xs font-bold min-h-8" style="height: {(points / 100) * 100}%">
											{points}
										</div>
									{/each}
								</div>
							</div>

							<div class="space-y-3">
								<h4 class="font-semibold text-accent">{comp.m2.entry_name}</h4>
								<div class="flex justify-around items-end h-32 gap-2">
									{#each comp.m2.stats.form as points}
										<div class="flex-1 bg-gradient-to-t from-purple-500 to-purple-700 rounded flex items-start justify-center pt-1 text-white text-xs font-bold min-h-8" style="height: {(points / 100) * 100}%">
											{points}
										</div>
									{/each}
								</div>
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Verdict -->
				<div class="text-center p-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg">
					{#if comp.difference > 0}
						<p class="text-white text-2xl font-bold">{comp.m1.entry_name} is ahead by {comp.difference} points!</p>
					{:else if comp.difference < 0}
						<p class="text-white text-2xl font-bold">{comp.m2.entry_name} is ahead by {Math.abs(comp.difference)} points!</p>
					{:else}
						<p class="text-white text-2xl font-bold">It's a perfect tie!</p>
					{/if}
				</div>
			</div>
		{:else}
			<p class="text-center text-muted-foreground italic py-8">Select two different managers to compare</p>
		{/if}
	</Card.Content>
</Card.Root>
