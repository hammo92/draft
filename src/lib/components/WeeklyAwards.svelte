<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Trophy, Ban, Target, ChevronLeft, ChevronRight, Award } from "@lucide/svelte";
	import type { GameweekAwards } from "$lib/types/fpl";

	let { awards = [], currentGameweek = 1 }: { awards: GameweekAwards[]; currentGameweek: number } = $props();

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
	<Card.Root>
		<Card.Header class="flex-row items-center justify-between">
			<div class="flex items-center gap-2">
				<Award class="w-4 h-4 text-accent" />
				<div>
					<Card.Title>Weekly Awards</Card.Title>
					<Card.Description>Highlights & lowlights</Card.Description>
				</div>
			</div>
			<div class="flex items-center gap-1 bg-muted rounded px-1">
				<button
					onclick={prevWeek}
					disabled={selectedGwIndex >= awards.length - 1}
					class="p-1 rounded hover:bg-muted-foreground/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
				>
					<ChevronLeft class="w-4 h-4" />
				</button>
				<span class="text-xs font-semibold min-w-12 text-center text-accent">
					GW{selectedAward.gameweek}
				</span>
				<button
					onclick={nextWeek}
					disabled={selectedGwIndex <= 0}
					class="p-1 rounded hover:bg-muted-foreground/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
				>
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>
		</Card.Header>
		<Card.Content class="pt-0">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
				<!-- Manager of the Week -->
				<div class="p-3 border border-success/30 bg-success/5 rounded">
					<div class="flex items-center gap-1.5 mb-2">
						<Trophy class="w-3.5 h-3.5 text-success" />
						<span class="text-[10px] uppercase tracking-widest text-success font-medium">MOTW</span>
					</div>
					<div class="text-xs font-medium text-foreground truncate">
						{selectedAward.managerOfTheWeek.managerName}
					</div>
					<div class="text-lg font-bold text-success tabular glow-success">
						{selectedAward.managerOfTheWeek.label}
					</div>
				</div>

				<!-- Bench Blunder -->
				<div class="p-3 border border-destructive/30 bg-destructive/5 rounded">
					<div class="flex items-center gap-1.5 mb-2">
						<Ban class="w-3.5 h-3.5 text-destructive" />
						<span class="text-[10px] uppercase tracking-widest text-destructive font-medium">Bench Blunder</span>
					</div>
					<div class="text-xs font-medium text-foreground truncate">
						{selectedAward.benchBlunder.managerName}
					</div>
					<div class="text-lg font-bold text-destructive tabular glow-destructive">
						{selectedAward.benchBlunder.label}
					</div>
				</div>

				<!-- Closest Call -->
				<div class="p-3 border border-accent/30 bg-accent/5 rounded">
					<div class="flex items-center gap-1.5 mb-2">
						<Target class="w-3.5 h-3.5 text-accent" />
						<span class="text-[10px] uppercase tracking-widest text-accent font-medium">Closest Call</span>
					</div>
					{#if selectedAward.closestCall}
						<div class="text-xs text-foreground mb-0.5">
							<span class="font-medium text-success">{selectedAward.closestCall.winner}</span>
							<span class="text-muted-foreground"> vs </span>
							<span class="font-medium text-destructive">{selectedAward.closestCall.loser}</span>
						</div>
						<div class="text-lg font-bold text-accent tabular glow-accent">
							+{selectedAward.closestCall.margin}
						</div>
					{:else}
						<div class="text-xs text-muted-foreground">No close games</div>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>
{/if}
