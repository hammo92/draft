<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import type { FunStatEntry } from "$lib/types/fpl";

	let {
		title = "",
		description = "",
		topLabel = "",
		bottomLabel = "",
		stats = [],
		higherIsBetter = true
	}: {
		title: string;
		description: string;
		topLabel: string;
		bottomLabel: string;
		stats: FunStatEntry[];
		higherIsBetter?: boolean;
	} = $props();

	function getRankClass(index: number, total: number): string {
		if (index === 0) return 'bg-amber-500/20 border-l-amber-500';
		if (index === total - 1) return 'bg-red-500/10 border-l-red-500';
		return 'bg-muted/30 border-l-border';
	}

	function getValueClass(index: number, total: number): string {
		if (index === 0) return 'text-green-500';
		if (index === total - 1) return 'text-red-500';
		return 'text-foreground';
	}
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header class="pb-3">
		<Card.Title class="font-serif text-lg font-semibold text-foreground">{title}</Card.Title>
		<Card.Description class="font-mono text-xs text-muted-foreground">
			{description}
		</Card.Description>
	</Card.Header>
	<Card.Content class="pt-0">
		<div class="flex flex-col gap-1">
			{#each stats as stat, index (stat.managerId)}
				<div class="flex items-center gap-3 p-2 rounded border-l-2 {getRankClass(index, stats.length)}">
					<div class="w-6 text-center font-mono text-xs text-muted-foreground">
						{index + 1}
					</div>
					<div class="flex-1 min-w-0">
						<div class="font-mono text-sm truncate">
							{#if index === 0}
								<span class="text-amber-500 font-semibold">{topLabel}:</span>
							{:else if index === stats.length - 1}
								<span class="text-red-400 font-semibold">{bottomLabel}:</span>
							{/if}
							{stat.managerName}
						</div>
					</div>
					<div class="font-mono text-sm font-bold {getValueClass(index, stats.length)}">
						{stat.label}
					</div>
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
