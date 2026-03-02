<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Calendar, Play, Users } from "@lucide/svelte";

	let {
		managerCount,
		currentGameweek,
		startGameweek
	}: {
		managerCount: number;
		currentGameweek: number;
		startGameweek: number;
	} = $props();

	const gameweeksPlayed = currentGameweek - startGameweek + 1;
	const totalGameweeks = 38;
	const progress = Math.round((gameweeksPlayed / (totalGameweeks - startGameweek + 1)) * 100);
</script>

<Card.Root>
	<Card.Header class="flex-row items-center gap-2">
		<Calendar class="w-4 h-4 text-accent" />
		<Card.Title>League Config</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="space-y-4">
			<!-- Stats Grid -->
			<div class="grid grid-cols-3 gap-4">
				<div class="data-cell-accent">
					<div class="text-xl font-bold text-accent tabular">{gameweeksPlayed}</div>
					<div class="label">GWs Played</div>
				</div>
				<div class="data-cell">
					<div class="text-xl font-bold text-foreground tabular">{startGameweek}</div>
					<div class="label">Start GW</div>
				</div>
				<div class="data-cell">
					<div class="text-xl font-bold text-foreground tabular">{managerCount}</div>
					<div class="label">Teams</div>
				</div>
			</div>

			<!-- Season Progress Bar -->
			<div class="space-y-1.5">
				<div class="flex items-center justify-between text-[10px] uppercase tracking-wider">
					<span class="text-muted-foreground">Season Progress</span>
					<span class="text-accent font-medium">{progress}%</span>
				</div>
				<div class="h-1.5 bg-muted rounded-sm overflow-hidden">
					<div
						class="h-full bg-accent transition-all duration-500"
						style="width: {progress}%"
					></div>
				</div>
				<div class="flex items-center justify-between text-[9px] text-muted-foreground">
					<span>GW{startGameweek}</span>
					<span>GW{totalGameweeks}</span>
				</div>
			</div>
		</div>
	</Card.Content>
</Card.Root>
