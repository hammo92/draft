<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import Badge from "$lib/components/ui/badge/badge.svelte";

	let { entries = [], players = {}, currentGameweek = 1 }: { entries: any[], players: any, currentGameweek: number } = $props();

	// Build ownership map from most recent picks
	let ownership = $derived(() => {
		const ownershipMap = new Map();

		entries.forEach(entry => {
			// Get most recent picks
			const recentPicks = entry.recentPicks.find((p: any) => p.gameweek === currentGameweek);
			if (recentPicks?.data?.picks) {
				recentPicks.data.picks.forEach((pick: any) => {
					const playerId = pick.element;
					if (!ownershipMap.has(playerId)) {
						ownershipMap.set(playerId, {
							player: players[playerId],
							owners: [],
							starting: 0,
							bench: 0
						});
					}

					const ownership = ownershipMap.get(playerId);
					ownership.owners.push({
						managerName: entry.entry_name,
						position: pick.position
					});

					if (pick.position <= 11) {
						ownership.starting++;
					} else {
						ownership.bench++;
					}
				});
			}
		});

		return Array.from(ownershipMap.values())
			.filter(o => o.player)
			.sort((a, b) => b.owners.length - a.owners.length);
	});

	let filterPosition = $state('all');
	let searchTerm = $state('');

	let filteredOwnership = $derived(
		ownership().filter(o => {
			const matchesPosition = filterPosition === 'all' || o.player?.position_name === filterPosition;
			const matchesSearch = searchTerm === '' ||
				o.player?.web_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				o.player?.team_name?.toLowerCase().includes(searchTerm.toLowerCase());
			return matchesPosition && matchesSearch;
		})
	);

	let positions = $derived([...new Set(ownership().map(o => o.player?.position_name).filter(Boolean))]);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="text-accent text-2xl">👥 Player Ownership</Card.Title>
		<Card.Description>See who owns which players in your league</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		<!-- Filters -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-muted rounded-lg">
			<div class="flex flex-col gap-2">
				<label for="position-filter" class="font-semibold text-accent text-sm">Position:</label>
				<select
					id="position-filter"
					bind:value={filterPosition}
					class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
				>
					<option value="all">All Positions</option>
					{#each positions as position}
						<option value={position}>{position}</option>
					{/each}
				</select>
			</div>

			<div class="flex flex-col gap-2">
				<label for="search" class="font-semibold text-accent text-sm">Search:</label>
				<input
					id="search"
					type="text"
					placeholder="Player or team name..."
					bind:value={searchTerm}
					class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				/>
			</div>
		</div>

		<!-- Ownership Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredOwnership as item}
				<div class="p-6 bg-muted rounded-lg border-l-4 {item.owners.length > 1 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-400' : 'border-border'}">
					<div class="flex justify-between items-start mb-4 pb-4 border-b-2 border-border">
						<div>
							<h3 class="text-accent font-semibold text-lg mb-1">{item.player?.web_name || 'Unknown'}</h3>
							<p class="text-muted-foreground text-sm mb-2">{item.player?.team_name}</p>
							<Badge variant="secondary" class="text-xs">
								{item.player?.position_name}
							</Badge>
						</div>
						<div class="flex flex-col items-center">
							<span class="text-3xl font-bold text-accent">{item.owners.length}</span>
							<span class="text-xs text-muted-foreground uppercase tracking-wide">owner{item.owners.length !== 1 ? 's' : ''}</span>
						</div>
					</div>

					<div class="grid grid-cols-4 gap-2 mb-4">
						<div class="flex flex-col items-center p-3 bg-background rounded-md">
							<span class="text-lg font-bold text-accent">{item.player?.total_points || 0}</span>
							<span class="text-xs text-muted-foreground uppercase">Points</span>
						</div>
						<div class="flex flex-col items-center p-3 bg-background rounded-md">
							<span class="text-lg font-bold text-accent">{item.player?.form || '0.0'}</span>
							<span class="text-xs text-muted-foreground uppercase">Form</span>
						</div>
						<div class="flex flex-col items-center p-3 bg-background rounded-md">
							<span class="text-lg font-bold text-accent">{item.starting}</span>
							<span class="text-xs text-muted-foreground uppercase">Starting</span>
						</div>
						<div class="flex flex-col items-center p-3 bg-background rounded-md">
							<span class="text-lg font-bold text-accent">{item.bench}</span>
							<span class="text-xs text-muted-foreground uppercase">Bench</span>
						</div>
					</div>

					<div>
						<strong class="text-accent text-sm">Owned by:</strong>
						<ul class="space-y-1 mt-2">
							{#each item.owners as owner}
								<li class="flex justify-between items-center p-2 bg-background rounded text-sm">
									<span>{owner.managerName}</span>
									{#if owner.position > 11}
										<Badge variant="secondary" class="text-xs">Bench</Badge>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/each}
		</div>

		{#if filteredOwnership.length === 0}
			<p class="text-center text-muted-foreground italic py-8">No players found matching your filters.</p>
		{/if}
	</Card.Content>
</Card.Root>
