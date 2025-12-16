<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { ChevronUp, ChevronDown } from "@lucide/svelte";

	let { standings = [] }: { standings: any[] } = $props();

	type SortKey = 'rank' | 'player_name' | 'wins' | 'draws' | 'losses' | 'points_for' | 'total';
	type SortDir = 'asc' | 'desc';

	let sortKey = $state<SortKey>('total');
	let sortDir = $state<SortDir>('desc');

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			// Default sort direction based on column type
			sortDir = key === 'player_name' ? 'asc' : 'desc';
		}
	}

	let sortedStandings = $derived.by(() => {
		return [...standings].sort((a, b) => {
			let aVal = a[sortKey];
			let bVal = b[sortKey];

			// Handle string comparison
			if (typeof aVal === 'string') {
				aVal = aVal.toLowerCase();
				bVal = bVal?.toLowerCase() || '';
			}

			if (sortDir === 'asc') {
				return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
			} else {
				return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
			}
		});
	});

	function headerClass(key: SortKey, align: 'left' | 'right' | 'center' = 'left'): string {
		const base = `font-mono text-xs uppercase tracking-wider py-3 px-2 cursor-pointer hover:text-accent transition-colors select-none`;
		const active = sortKey === key ? 'text-accent' : 'text-muted-foreground';
		const alignment = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
		return `${base} ${active} ${alignment}`;
	}
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header>
		<Card.Title class="font-serif text-2xl font-semibold text-foreground">League Standings</Card.Title>
		<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Click headers to sort</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b border-border">
						<th class="{headerClass('rank')} w-12" onclick={() => toggleSort('rank')}>
							<span class="inline-flex items-center gap-1">
								#
								{#if sortKey === 'rank'}
									{#if sortDir === 'asc'}<ChevronUp class="w-3 h-3" />{:else}<ChevronDown class="w-3 h-3" />{/if}
								{/if}
							</span>
						</th>
						<th class="{headerClass('player_name')}" onclick={() => toggleSort('player_name')}>
							<span class="inline-flex items-center gap-1">
								Manager
								{#if sortKey === 'player_name'}
									{#if sortDir === 'asc'}<ChevronUp class="w-3 h-3" />{:else}<ChevronDown class="w-3 h-3" />{/if}
								{/if}
							</span>
						</th>
						<th class="{headerClass('wins', 'center')} hidden sm:table-cell w-12" onclick={() => toggleSort('wins')}>
							<span class="inline-flex items-center justify-center gap-1">
								W
								{#if sortKey === 'wins'}
									{#if sortDir === 'asc'}<ChevronUp class="w-3 h-3" />{:else}<ChevronDown class="w-3 h-3" />{/if}
								{/if}
							</span>
						</th>
						<th class="{headerClass('draws', 'center')} hidden sm:table-cell w-12" onclick={() => toggleSort('draws')}>
							<span class="inline-flex items-center justify-center gap-1">
								D
								{#if sortKey === 'draws'}
									{#if sortDir === 'asc'}<ChevronUp class="w-3 h-3" />{:else}<ChevronDown class="w-3 h-3" />{/if}
								{/if}
							</span>
						</th>
						<th class="{headerClass('losses', 'center')} hidden sm:table-cell w-12" onclick={() => toggleSort('losses')}>
							<span class="inline-flex items-center justify-center gap-1">
								L
								{#if sortKey === 'losses'}
									{#if sortDir === 'asc'}<ChevronUp class="w-3 h-3" />{:else}<ChevronDown class="w-3 h-3" />{/if}
								{/if}
							</span>
						</th>
						<th class="{headerClass('points_for', 'right')}" onclick={() => toggleSort('points_for')}>
							<span class="inline-flex items-center justify-end gap-1">
								{#if sortKey === 'points_for'}
									{#if sortDir === 'asc'}<ChevronUp class="w-3 h-3" />{:else}<ChevronDown class="w-3 h-3" />{/if}
								{/if}
								PF
							</span>
						</th>
						<th class="{headerClass('total', 'right')}" onclick={() => toggleSort('total')}>
							<span class="inline-flex items-center justify-end gap-1">
								{#if sortKey === 'total'}
									{#if sortDir === 'asc'}<ChevronUp class="w-3 h-3" />{:else}<ChevronDown class="w-3 h-3" />{/if}
								{/if}
								Pts
							</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each sortedStandings as standing (standing.entry_id)}
						<tr class="border-b border-border last:border-b-0 hover:bg-muted transition-colors">
							<td class="py-3 px-2">
								<span class="font-mono font-bold text-foreground {standing.rank === 1 ? 'text-accent' : ''}">{standing.rank || '-'}</span>
							</td>
							<td class="py-3 px-2">
								<div class="flex flex-col">
									<span class="font-sans text-foreground">{standing.player_name}</span>
									<span class="font-sans text-xs text-muted-foreground md:hidden">{standing.entry_name}</span>
								</div>
							</td>
							<td class="py-3 px-2 text-center hidden sm:table-cell">
								<span class="font-mono text-green-500">{standing.wins || 0}</span>
							</td>
							<td class="py-3 px-2 text-center hidden sm:table-cell">
								<span class="font-mono text-muted-foreground">{standing.draws || 0}</span>
							</td>
							<td class="py-3 px-2 text-center hidden sm:table-cell">
								<span class="font-mono text-red-500">{standing.losses || 0}</span>
							</td>
							<td class="py-3 px-2 text-right">
								<span class="font-mono text-muted-foreground">{standing.points_for || 0}</span>
							</td>
							<td class="py-3 px-2 text-right">
								<span class="font-mono font-bold text-accent">{standing.total || 0}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card.Content>
</Card.Root>
