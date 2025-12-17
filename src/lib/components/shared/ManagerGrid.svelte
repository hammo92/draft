<script lang="ts">
	import * as Card from "$lib/components/ui/card";

	let { entries = [] }: { entries: any[] } = $props();
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header>
		<Card.Title class="font-serif text-2xl font-semibold text-foreground">Managers</Card.Title>
		<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Individual performance overview</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each entries as entry}
				<div class="p-5 bg-muted rounded border-l-4 border-accent">
					<div class="mb-4">
						<h3 class="font-serif text-lg font-semibold text-foreground">{entry.player_first_name} {entry.player_last_name}</h3>
						<p class="font-mono text-xs uppercase tracking-wider text-muted-foreground">{entry.entry_name}</p>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div class="p-3 bg-card rounded">
							<div class="font-mono text-2xl font-bold text-foreground">{entry.history.reduce((sum: number, h: any) => sum + h.points, 0)}</div>
							<div class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Total</div>
						</div>
						<div class="p-3 bg-card rounded">
							<div class="font-mono text-2xl font-bold text-foreground">{entry.stats.averagePoints.toFixed(1)}</div>
							<div class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Avg/GW</div>
						</div>
					</div>
					{#if entry.history.length > 0}
						<div class="mt-3 pt-3 border-t border-border flex justify-between items-center">
							<span class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Last GW</span>
							<span class="font-mono text-lg font-bold text-accent">{entry.history[entry.history.length - 1].points}</span>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
