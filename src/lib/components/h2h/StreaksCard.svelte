<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Flame, TrendingUp, TrendingDown, Minus } from "@lucide/svelte";
	import type { ManagerStreak } from "$lib/types/fpl";

	let { streaks = [] }: { streaks: ManagerStreak[] } = $props();

	const sortedStreaks = $derived(
		[...streaks].sort((a, b) => {
			if (a.currentStreak.type === 'W' && b.currentStreak.type !== 'W') return -1;
			if (b.currentStreak.type === 'W' && a.currentStreak.type !== 'W') return 1;
			return b.currentStreak.count - a.currentStreak.count;
		})
	);

	function getStreakStyle(type: 'W' | 'L' | 'D'): { text: string; bg: string; border: string } {
		if (type === 'W') return { text: 'text-success', bg: 'bg-success/10', border: 'border-success/30' };
		if (type === 'L') return { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' };
		return { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' };
	}

	function getFormStyle(result: 'W' | 'L' | 'D'): string {
		if (result === 'W') return 'bg-success text-success-foreground';
		if (result === 'L') return 'bg-destructive text-white';
		return 'bg-warning text-warning-foreground';
	}
</script>

<Card.Root>
	<Card.Header class="flex-row items-center gap-2">
		<Flame class="w-4 h-4 text-warning" />
		<div>
			<Card.Title>Streaks & Form</Card.Title>
			<Card.Description>Current runs and recent results</Card.Description>
		</div>
	</Card.Header>
	<Card.Content class="pt-0">
		<div class="space-y-2">
			{#each sortedStreaks as streak (streak.managerId)}
				{@const style = getStreakStyle(streak.currentStreak.type)}
				<div class="border border-border rounded overflow-hidden">
					<div class="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
						<span class="text-xs font-semibold text-foreground">{streak.managerName}</span>

						<!-- Current streak badge -->
						{#if streak.currentStreak.count >= 2}
							<div class="flex items-center gap-1 px-1.5 py-0.5 rounded border {style.bg} {style.border}">
								{#if streak.currentStreak.type === 'W'}
									<TrendingUp class="w-3 h-3 {style.text}" />
								{:else if streak.currentStreak.type === 'L'}
									<TrendingDown class="w-3 h-3 {style.text}" />
								{:else}
									<Minus class="w-3 h-3 {style.text}" />
								{/if}
								<span class="text-[10px] font-bold {style.text} tabular">
									{streak.currentStreak.count}{streak.currentStreak.type}
								</span>
							</div>
						{/if}
					</div>

					<div class="px-3 py-2 flex items-center justify-between">
						<!-- Form dots -->
						<div class="flex items-center gap-1">
							<span class="text-[9px] text-muted-foreground uppercase tracking-widest mr-1">Form</span>
							{#each streak.currentForm as result, i (i)}
								<div class="w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold {getFormStyle(result)}">
									{result}
								</div>
							{/each}
						</div>

						<!-- Best/Worst streaks -->
						<div class="flex items-center gap-2 text-[10px]">
							{#if streak.longestWinStreak > 1}
								<span class="text-muted-foreground">
									Best: <span class="text-success font-semibold tabular">{streak.longestWinStreak}W</span>
								</span>
							{/if}
							{#if streak.longestLossStreak > 1}
								<span class="text-muted-foreground">
									Worst: <span class="text-destructive font-semibold tabular">{streak.longestLossStreak}L</span>
								</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
