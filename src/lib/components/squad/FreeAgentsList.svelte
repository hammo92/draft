<script lang="ts">
	import Badge from "$lib/components/ui/badge/badge.svelte";

	let {
		freeAgents = [],
		positionFilter = $bindable('all'),
		searchTerm = $bindable('')
	}: {
		freeAgents: any[];
		positionFilter: string;
		searchTerm: string;
	} = $props();

	let filteredFreeAgents = $derived(
		freeAgents.filter((p: any) => {
			const matchesPosition = positionFilter === 'all' || p.position_name === positionFilter;
			const matchesSearch = searchTerm === '' ||
				p.web_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				p.team_name?.toLowerCase().includes(searchTerm.toLowerCase());
			return matchesPosition && matchesSearch;
		}).slice(0, 50)
	);
</script>

<div class="space-y-6">
	<!-- Filters -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-muted rounded-lg">
		<div class="flex flex-col gap-2">
			<label for="position" class="font-semibold text-fpl-purple text-sm">Position:</label>
			<select
				id="position"
				bind:value={positionFilter}
				class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
			>
				<option value="all">All Positions</option>
				<option value="Goalkeeper">Goalkeeper</option>
				<option value="Defender">Defender</option>
				<option value="Midfielder">Midfielder</option>
				<option value="Forward">Forward</option>
			</select>
		</div>
		<div class="flex flex-col gap-2">
			<label for="search" class="font-semibold text-fpl-purple text-sm">Search:</label>
			<input
				type="text"
				id="search"
				placeholder="Player or team..."
				bind:value={searchTerm}
				class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			/>
		</div>
	</div>

	<!-- Stats Summary -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="flex flex-col items-center p-6 bg-gradient-to-br from-fpl-green to-cyan-400 rounded-lg">
			<span class="text-3xl font-bold text-fpl-purple">{freeAgents.length}</span>
			<span class="text-sm font-semibold text-fpl-purple">Total Free Agents</span>
		</div>
		<div class="flex flex-col items-center p-6 bg-gradient-to-br from-fpl-green to-cyan-400 rounded-lg">
			<span class="text-3xl font-bold text-fpl-purple">{freeAgents.filter((p: any) => p.position_name === 'Forward').length}</span>
			<span class="text-sm font-semibold text-fpl-purple">Forwards</span>
		</div>
		<div class="flex flex-col items-center p-6 bg-gradient-to-br from-fpl-green to-cyan-400 rounded-lg">
			<span class="text-3xl font-bold text-fpl-purple">{freeAgents.filter((p: any) => p.position_name === 'Midfielder').length}</span>
			<span class="text-sm font-semibold text-fpl-purple">Midfielders</span>
		</div>
		<div class="flex flex-col items-center p-6 bg-gradient-to-br from-fpl-green to-cyan-400 rounded-lg">
			<span class="text-3xl font-bold text-fpl-purple">{freeAgents.filter((p: any) => p.position_name === 'Defender').length}</span>
			<span class="text-sm font-semibold text-fpl-purple">Defenders</span>
		</div>
	</div>

	<!-- Top Available Players -->
	<div class="space-y-4">
		<h3 class="text-fpl-purple text-xl font-semibold">Top Available Players</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filteredFreeAgents as player}
				<div class="p-4 bg-muted rounded-lg border-l-4 border-fpl-green">
					<div class="flex justify-between items-center mb-2">
						<h4 class="font-semibold text-fpl-purple">{player.web_name}</h4>
						<Badge variant="secondary" class="text-xs">
							{player.position_name}
						</Badge>
					</div>
					<div class="flex justify-between items-center pb-3 mb-3 border-b border-border">
						<span class="text-sm text-muted-foreground">{player.team_name}</span>
						<span class="font-semibold text-fpl-purple">{player.total_points} pts</span>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<div class="flex flex-col items-center p-2 bg-background rounded">
							<span class="text-xs text-muted-foreground uppercase">Form</span>
							<span class="font-semibold text-fpl-purple">{player.form}</span>
						</div>
						<div class="flex flex-col items-center p-2 bg-background rounded">
							<span class="text-xs text-muted-foreground uppercase">PPG</span>
							<span class="font-semibold text-fpl-purple">{player.points_per_game}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
