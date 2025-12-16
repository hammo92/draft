<script lang="ts">
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";

	let { squad = [] }: { squad: any[] } = $props();

	let startingXI = $derived(squad.filter((p: any) => p.position <= 11));
	let bench = $derived(squad.filter((p: any) => p.position > 11));
</script>

<div class="space-y-6">
	<!-- Starting XI -->
	<div class="space-y-4">
		<h3 class="text-fpl-purple text-xl font-semibold">Starting XI</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each startingXI as player}
				<div
					class="relative p-4 rounded-lg border-l-4 {player.is_captain ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-400' : player.is_vice_captain ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300' : 'bg-muted border-fpl-purple'}"
				>
					{#if player.is_captain}
						<Badge class="absolute top-2 right-2">C</Badge>
					{:else if player.is_vice_captain}
						<Badge class="absolute top-2 right-2">V</Badge>
					{/if}
					<div class="font-semibold text-fpl-purple mb-1">{player.web_name}</div>
					<div class="text-sm text-muted-foreground mb-2">{player.team_name}</div>
					<div class="flex justify-between items-center">
						<Badge variant="secondary" class="text-xs">
							{player.position_name?.substring(0, 3)}
						</Badge>
						<span class="font-semibold text-muted-foreground">{player.total_points} pts</span>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<Separator />

	<!-- Bench -->
	<div class="space-y-4">
		<h3 class="text-fpl-purple text-xl font-semibold">Bench</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each bench as player, index}
				<div class="relative p-4 bg-muted rounded-lg border-l-4 border-muted-foreground opacity-70">
					<Badge variant="outline" class="absolute top-2 right-2">{index + 1}</Badge>
					<div class="font-semibold text-fpl-purple mb-1">{player.web_name}</div>
					<div class="text-sm text-muted-foreground mb-2">{player.team_name}</div>
					<div class="flex justify-between items-center">
						<Badge variant="secondary" class="text-xs">
							{player.position_name?.substring(0, 3)}
						</Badge>
						<span class="font-semibold text-muted-foreground">{player.total_points} pts</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
