<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Trophy, Ban, Target, ChevronLeft, ChevronRight } from "@lucide/svelte";
	import type { GameweekAwards } from "$lib/types/fpl";

	let { awards = [], currentGameweek = 1 }: { awards: GameweekAwards[]; currentGameweek: number } = $props();

	// Start showing the most recent gameweek
	let selectedGwIndex = $state(0);

	const selectedAward = $derived(awards[selectedGwIndex]);

	function prevWeek() {
		if (selectedGwIndex < awards.length - 1) {
			selectedGwIndex++;
		}
	}

	function nextWeek() {
		if (selectedGwIndex > 0) {
			selectedGwIndex--;
		}
	}
</script>

{#if awards.length > 0 && selectedAward}
	<Card.Root class="bg-card border border-border rounded shadow-none">
		<Card.Header class="pb-3">
			<div class="flex items-center justify-between">
				<div>
					<Card.Title class="font-serif text-lg font-semibold text-foreground">Weekly Awards</Card.Title>
					<Card.Description class="font-mono text-xs text-muted-foreground">
						Gameweek highlights and lowlights
					</Card.Description>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={prevWeek}
						disabled={selectedGwIndex >= awards.length - 1}
						class="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
					>
						<ChevronLeft class="w-5 h-5" />
					</button>
					<span class="font-mono text-sm font-semibold min-w-16 text-center">
						GW{selectedAward.gameweek}
					</span>
					<button
						onclick={nextWeek}
						disabled={selectedGwIndex <= 0}
						class="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
					>
						<ChevronRight class="w-5 h-5" />
					</button>
				</div>
			</div>
		</Card.Header>
		<Card.Content class="pt-0">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- Manager of the Week -->
				<div class="p-4 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-lg border border-amber-500/20">
					<div class="flex items-center gap-2 mb-2">
						<Trophy class="w-5 h-5 text-amber-500" />
						<span class="font-mono text-xs uppercase tracking-wide text-amber-500">Manager of the Week</span>
					</div>
					<div class="font-mono text-sm font-semibold text-foreground">
						{selectedAward.managerOfTheWeek.managerName}
					</div>
					<div class="font-mono text-lg font-bold text-amber-500">
						{selectedAward.managerOfTheWeek.label}
					</div>
				</div>

				<!-- Bench Blunder -->
				<div class="p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20">
					<div class="flex items-center gap-2 mb-2">
						<Ban class="w-5 h-5 text-red-500" />
						<span class="font-mono text-xs uppercase tracking-wide text-red-500">Bench Blunder</span>
					</div>
					<div class="font-mono text-sm font-semibold text-foreground">
						{selectedAward.benchBlunder.managerName}
					</div>
					<div class="font-mono text-lg font-bold text-red-500">
						{selectedAward.benchBlunder.label}
					</div>
				</div>

				<!-- Closest Call -->
				<div class="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
					<div class="flex items-center gap-2 mb-2">
						<Target class="w-5 h-5 text-blue-500" />
						<span class="font-mono text-xs uppercase tracking-wide text-blue-500">Closest Call</span>
					</div>
					{#if selectedAward.closestCall}
						<div class="font-mono text-sm text-foreground">
							<span class="font-semibold text-green-500">{selectedAward.closestCall.winner}</span>
							<span class="text-muted-foreground"> beat </span>
							<span class="font-semibold text-red-400">{selectedAward.closestCall.loser}</span>
						</div>
						<div class="font-mono text-lg font-bold text-blue-500">
							by {selectedAward.closestCall.margin} pts
						</div>
					{:else}
						<div class="font-mono text-sm text-muted-foreground">No close games</div>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>
{/if}
