<script lang="ts">
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";

	let { squad = [] }: { squad: any[] } = $props();

	let startingXI = $derived(squad.filter((p: any) => p.position <= 11));
	let bench = $derived(squad.filter((p: any) => p.position > 11));
</script>

<div class="space-y-4">
	<!-- Starting XI -->
	<div class="space-y-3">
		<h3 class="text-xs font-medium uppercase tracking-widest text-muted-foreground">Starting XI</h3>
		{#if startingXI.length === 0}
			<p class="text-xs text-muted-foreground italic">No squad data available for this gameweek</p>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
				{#each startingXI as player}
					<div
						class="relative p-3 rounded-sm border-l-2 bg-card {player.is_captain ? 'border-warning bg-warning/5' : player.is_vice_captain ? 'border-info bg-info/5' : 'border-accent'}"
					>
						{#if player.is_captain}
							<Badge variant="warning" class="absolute top-2 right-2 text-[10px]">C</Badge>
						{:else if player.is_vice_captain}
							<Badge variant="secondary" class="absolute top-2 right-2 text-[10px]">V</Badge>
						{/if}
						<div class="font-sans font-medium text-foreground text-sm">{player.web_name || 'Unknown'}</div>
						<div class="font-sans text-[10px] text-muted-foreground mb-1">{player.team_name || '-'}</div>
						<div class="flex justify-between items-center">
							<Badge variant="outline" class="text-[10px] px-1.5 py-0">
								{player.position_name?.substring(0, 3) || '-'}
							</Badge>
							<span class="text-xs font-bold text-accent tabular">{player.total_points || 0}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<Separator class="border-border" />

	<!-- Bench -->
	<div class="space-y-3">
		<h3 class="text-xs font-medium uppercase tracking-widest text-muted-foreground">Bench</h3>
		{#if bench.length === 0}
			<p class="text-xs text-muted-foreground italic">No bench data available</p>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
				{#each bench as player, index}
					<div class="relative p-3 bg-muted/50 rounded-sm border-l-2 border-muted-foreground/30 opacity-70">
						<Badge variant="outline" class="absolute top-2 right-2 text-[10px]">{index + 1}</Badge>
						<div class="font-sans font-medium text-foreground text-sm">{player.web_name || 'Unknown'}</div>
						<div class="font-sans text-[10px] text-muted-foreground mb-1">{player.team_name || '-'}</div>
						<div class="flex justify-between items-center">
							<Badge variant="outline" class="text-[10px] px-1.5 py-0">
								{player.position_name?.substring(0, 3) || '-'}
							</Badge>
							<span class="text-xs font-medium text-muted-foreground tabular">{player.total_points || 0}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
