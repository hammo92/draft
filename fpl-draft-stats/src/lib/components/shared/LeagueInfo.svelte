<script lang="ts">
	import * as Card from "$lib/components/ui/card";

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
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header>
		<Card.Title class="font-serif text-2xl font-semibold text-foreground">League Details</Card.Title>
		<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Season configuration</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid grid-cols-3 gap-6">
			<div class="accent-bar">
				<div class="font-mono text-2xl font-bold text-foreground">{gameweeksPlayed}</div>
				<div class="font-mono text-xs uppercase tracking-wider text-muted-foreground">GWs Played</div>
			</div>
			<div class="accent-bar">
				<div class="font-mono text-2xl font-bold text-foreground">{startGameweek}</div>
				<div class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Start GW</div>
			</div>
			<div class="accent-bar">
				<div class="font-mono text-2xl font-bold text-foreground">{managerCount}</div>
				<div class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Teams</div>
			</div>
		</div>
	</Card.Content>
</Card.Root>
