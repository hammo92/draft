<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Flame, TrendingUp, TrendingDown } from "@lucide/svelte";
	import type { ManagerStreak } from "$lib/types/fpl";

	let { streaks = [] }: { streaks: ManagerStreak[] } = $props();

	// Sort by current streak (wins first, then by count)
	const sortedStreaks = $derived(
		[...streaks].sort((a, b) => {
			// Prioritize win streaks
			if (a.currentStreak.type === 'W' && b.currentStreak.type !== 'W') return -1;
			if (b.currentStreak.type === 'W' && a.currentStreak.type !== 'W') return 1;
			// Then by streak count
			return b.currentStreak.count - a.currentStreak.count;
		})
	);

	function getStreakColor(type: 'W' | 'L' | 'D'): string {
		if (type === 'W') return 'text-green-500';
		if (type === 'L') return 'text-red-500';
		return 'text-yellow-500';
	}

	function getStreakBg(type: 'W' | 'L' | 'D'): string {
		if (type === 'W') return 'bg-green-500/10';
		if (type === 'L') return 'bg-red-500/10';
		return 'bg-yellow-500/10';
	}

	function getFormColor(result: 'W' | 'L' | 'D'): string {
		if (result === 'W') return 'bg-green-500';
		if (result === 'L') return 'bg-red-500';
		return 'bg-yellow-500';
	}
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header class="pb-3">
		<Card.Title class="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
			<Flame class="w-5 h-5 text-orange-500" />
			Streaks & Form
		</Card.Title>
		<Card.Description class="font-mono text-xs text-muted-foreground">
			Current streaks and recent form
		</Card.Description>
	</Card.Header>
	<Card.Content class="pt-0">
		<div class="space-y-3">
			{#each sortedStreaks as streak (streak.managerId)}
				<div class="p-3 bg-muted/30 rounded-lg border border-border">
					<div class="flex items-center justify-between mb-2">
						<div class="font-mono text-sm font-semibold text-foreground">
							{streak.managerName}
						</div>
						<!-- Current streak badge -->
						{#if streak.currentStreak.count >= 2}
							<div class="flex items-center gap-1 px-2 py-0.5 rounded {getStreakBg(streak.currentStreak.type)}">
								{#if streak.currentStreak.type === 'W'}
									<TrendingUp class="w-3 h-3 {getStreakColor(streak.currentStreak.type)}" />
								{:else if streak.currentStreak.type === 'L'}
									<TrendingDown class="w-3 h-3 {getStreakColor(streak.currentStreak.type)}" />
								{/if}
								<span class="font-mono text-xs font-bold {getStreakColor(streak.currentStreak.type)}">
									{streak.currentStreak.count}{streak.currentStreak.type}
								</span>
							</div>
						{/if}
					</div>

					<div class="flex items-center justify-between">
						<!-- Form dots -->
						<div class="flex items-center gap-1">
							<span class="font-mono text-xs text-muted-foreground mr-1">Form:</span>
							{#each streak.currentForm as result, i (i)}
								<div class="w-4 h-4 rounded-full {getFormColor(result)} flex items-center justify-center">
									<span class="text-[10px] font-bold text-white">{result}</span>
								</div>
							{/each}
						</div>

						<!-- Best/Worst streaks -->
						<div class="flex items-center gap-3">
							{#if streak.longestWinStreak > 1}
								<div class="font-mono text-xs text-muted-foreground">
									Best: <span class="text-green-500 font-semibold">{streak.longestWinStreak}W</span>
								</div>
							{/if}
							{#if streak.longestLossStreak > 1}
								<div class="font-mono text-xs text-muted-foreground">
									Worst: <span class="text-red-500 font-semibold">{streak.longestLossStreak}L</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
