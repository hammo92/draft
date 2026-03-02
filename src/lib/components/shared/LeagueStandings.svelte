<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { ChevronUp, ChevronDown, Trophy, TrendingUp, TrendingDown, Minus } from "@lucide/svelte";

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
			sortDir = key === 'player_name' ? 'asc' : 'desc';
		}
	}

	let sortedStandings = $derived.by(() => {
		return [...standings].sort((a, b) => {
			let aVal = a[sortKey];
			let bVal = b[sortKey];

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
		const base = `text-[10px] uppercase tracking-widest py-2 px-2 cursor-pointer hover:text-accent transition-colors select-none whitespace-nowrap`;
		const active = sortKey === key ? 'text-accent' : 'text-muted-foreground';
		const alignment = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
		return `${base} ${active} ${alignment}`;
	}

	function getRankStyle(rank: number, total: number): string {
		if (rank === 1) return 'text-accent glow-accent';
		if (rank === 2) return 'text-success';
		if (rank === 3) return 'text-success/70';
		if (rank >= total - 1) return 'text-destructive';
		return 'text-foreground';
	}

	function getWinRate(wins: number, total: number): number {
		if (total === 0) return 0;
		return Math.round((wins / total) * 100);
	}
</script>

<Card.Root class="overflow-hidden">
	<Card.Header class="flex-row items-center justify-between">
		<div class="flex items-center gap-2">
			<Trophy class="w-4 h-4 text-accent" />
			<Card.Title>League Standings</Card.Title>
		</div>
		<Card.Description>Click column headers to sort</Card.Description>
	</Card.Header>
	<Card.Content class="p-0">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-muted/50">
						<th class="{headerClass('rank')} w-10" onclick={() => toggleSort('rank')}>
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
						<th class="{headerClass('wins', 'center')} hidden sm:table-cell w-10" onclick={() => toggleSort('wins')}>
							<span class="inline-flex items-center justify-center gap-1">
								W
								{#if sortKey === 'wins'}
									{#if sortDir === 'asc'}<ChevronUp class="w-3 h-3" />{:else}<ChevronDown class="w-3 h-3" />{/if}
								{/if}
							</span>
						</th>
						<th class="{headerClass('draws', 'center')} hidden sm:table-cell w-10" onclick={() => toggleSort('draws')}>
							<span class="inline-flex items-center justify-center gap-1">
								D
								{#if sortKey === 'draws'}
									{#if sortDir === 'asc'}<ChevronUp class="w-3 h-3" />{:else}<ChevronDown class="w-3 h-3" />{/if}
								{/if}
							</span>
						</th>
						<th class="{headerClass('losses', 'center')} hidden sm:table-cell w-10" onclick={() => toggleSort('losses')}>
							<span class="inline-flex items-center justify-center gap-1">
								L
								{#if sortKey === 'losses'}
									{#if sortDir === 'asc'}<ChevronUp class="w-3 h-3" />{:else}<ChevronDown class="w-3 h-3" />{/if}
								{/if}
							</span>
						</th>
						<th class="{headerClass('points_for', 'right')} hidden md:table-cell" onclick={() => toggleSort('points_for')}>
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
					{#each sortedStandings as standing, i (standing.entry_id)}
						{@const totalMatches = (standing.wins || 0) + (standing.draws || 0) + (standing.losses || 0)}
						{@const winRate = getWinRate(standing.wins || 0, totalMatches)}
						{@const isAverage = standing.player_name?.toUpperCase() === 'AVERAGE' || standing.entry_name?.toLowerCase() === 'league average'}
						<tr class="border-b last:border-b-0 transition-colors group {isAverage ? 'border-dashed border-accent/30 bg-accent/5' : 'border-border hover:bg-muted/50'}">
							<td class="py-2.5 px-2">
								<span class="font-bold tabular {getRankStyle(standing.rank, standings.length)}">
									{standing.rank || '-'}
								</span>
							</td>
							<td class="py-2.5 px-2">
								<div class="flex flex-col gap-0.5">
									<span class="font-sans font-medium transition-colors {isAverage ? 'text-accent italic' : 'text-foreground group-hover:text-accent'}">{standing.player_name}</span>
									<span class="font-sans text-[10px] text-muted-foreground truncate max-w-[150px]">{standing.entry_name}</span>
								</div>
							</td>
							<td class="py-2.5 px-2 text-center hidden sm:table-cell">
								<span class="tabular text-success font-medium">{standing.wins || 0}</span>
							</td>
							<td class="py-2.5 px-2 text-center hidden sm:table-cell">
								<span class="tabular text-muted-foreground">{standing.draws || 0}</span>
							</td>
							<td class="py-2.5 px-2 text-center hidden sm:table-cell">
								<span class="tabular text-destructive font-medium">{standing.losses || 0}</span>
							</td>
							<td class="py-2.5 px-2 text-right hidden md:table-cell">
								<span class="tabular text-muted-foreground">{standing.points_for?.toLocaleString() || 0}</span>
							</td>
							<td class="py-2.5 px-2 text-right">
								<div class="flex flex-col items-end gap-0.5">
									<span class="tabular font-bold {standing.rank === 1 ? 'text-accent glow-accent' : 'text-foreground'}">{standing.total || 0}</span>
									{#if winRate > 0}
										<span class="text-[9px] text-muted-foreground tabular">{winRate}% WR</span>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card.Content>
</Card.Root>
