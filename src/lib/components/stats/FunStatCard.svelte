<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import type { FunStatEntry } from "$lib/types/fpl";
	import { TrendingUp, TrendingDown } from "@lucide/svelte";

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

	function getRankIndicator(index: number, total: number): { color: string; border: string } {
		if (index === 0) return { color: 'text-success', border: 'border-l-success' };
		if (index === 1) return { color: 'text-success/70', border: 'border-l-success/70' };
		if (index === total - 1) return { color: 'text-destructive', border: 'border-l-destructive' };
		if (index === total - 2) return { color: 'text-destructive/70', border: 'border-l-destructive/70' };
		return { color: 'text-muted-foreground', border: 'border-l-border' };
	}
</script>

<Card.Root>
	<Card.Header>
		<div class="flex items-center justify-between">
			<Card.Title>{title}</Card.Title>
		</div>
		<Card.Description>{description}</Card.Description>
	</Card.Header>
	<Card.Content class="pt-0">
		<div class="flex flex-col">
			{#each stats as stat, index (stat.managerId)}
				{@const style = getRankIndicator(index, stats.length)}
				<div
					class="flex items-center gap-2 py-1.5 px-2 border-l-2 {style.border} {index === 0 ? 'bg-success/5' : index === stats.length - 1 ? 'bg-destructive/5' : ''} hover:bg-muted/30 transition-colors"
				>
					<!-- Rank -->
					<div class="w-5 text-center text-[10px] tabular {style.color} font-medium">
						{index + 1}
					</div>

					<!-- Name with label for top/bottom -->
					<div class="flex-1 min-w-0 flex items-center gap-1.5">
						{#if index === 0}
							<TrendingUp class="w-3 h-3 text-success flex-shrink-0" />
						{:else if index === stats.length - 1}
							<TrendingDown class="w-3 h-3 text-destructive flex-shrink-0" />
						{/if}
						<span class="text-xs truncate {index === 0 || index === stats.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}">
							{stat.managerName}
						</span>
					</div>

					<!-- Value -->
					<div class="text-xs font-bold tabular {style.color}">
						{stat.label}
					</div>
				</div>
			{/each}
		</div>

		<!-- Legend -->
		<div class="flex items-center justify-between mt-3 pt-2 border-t border-border text-[9px] text-muted-foreground uppercase tracking-wider">
			<span class="flex items-center gap-1">
				<span class="w-2 h-2 bg-success rounded-sm"></span>
				{topLabel}
			</span>
			<span class="flex items-center gap-1">
				<span class="w-2 h-2 bg-destructive rounded-sm"></span>
				{bottomLabel}
			</span>
		</div>
	</Card.Content>
</Card.Root>
