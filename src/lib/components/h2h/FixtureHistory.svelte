<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import type { MatchResult, RivalryStats } from "$lib/types/fpl";

	let { fixtures = [], stats }: { fixtures: MatchResult[]; stats: RivalryStats } = $props();

	// Group fixtures by gameweek
	const fixturesByGameweek = $derived(() => {
		const grouped = new Map<number, MatchResult[]>();
		fixtures.forEach(f => {
			if (!grouped.has(f.gameweek)) grouped.set(f.gameweek, []);
			grouped.get(f.gameweek)!.push(f);
		});
		return Array.from(grouped.entries()).sort((a, b) => b[0] - a[0]);
	});
</script>

<div class="space-y-6">
	<!-- Rivalry Stats -->
	{#if stats.biggestWin || stats.closestGame}
		<Card.Root class="bg-card border border-border rounded shadow-none">
			<Card.Header>
				<Card.Title class="font-sans text-2xl font-semibold text-foreground">Season Highlights</Card.Title>
				<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
					Notable fixtures
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#if stats.biggestWin}
						<div class="p-4 bg-muted rounded border-l-4 border-accent">
							<div class="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">Biggest Win</div>
							<div class="font-sans text-lg font-semibold text-foreground">{stats.biggestWin.winner}</div>
							<div class="font-mono text-2xl font-bold text-accent">{stats.biggestWin.score}</div>
							<div class="font-mono text-sm text-muted-foreground">
								vs {stats.biggestWin.loser} (GW{stats.biggestWin.gameweek})
							</div>
						</div>
					{/if}
					{#if stats.closestGame}
						<div class="p-4 bg-muted rounded border-l-4 border-accent">
							<div class="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">Closest Game</div>
							<div class="font-sans text-lg font-semibold text-foreground">{stats.closestGame.manager1}</div>
							<div class="font-mono text-2xl font-bold text-accent">{stats.closestGame.score}</div>
							<div class="font-mono text-sm text-muted-foreground">
								vs {stats.closestGame.manager2} (GW{stats.closestGame.gameweek})
							</div>
						</div>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Fixtures by Gameweek -->
	<Card.Root class="bg-card border border-border rounded shadow-none">
		<Card.Header>
			<Card.Title class="font-sans text-2xl font-semibold text-foreground">Match History</Card.Title>
			<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
				All fixtures by gameweek
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-6">
				{#each fixturesByGameweek() as [gameweek, matches]}
					<div>
						<div class="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
							Gameweek {gameweek}
						</div>
						<div class="space-y-2">
							{#each matches as match}
								<div class="flex items-center justify-between p-3 bg-muted rounded">
									<div class="flex-1 text-right">
										<span class="font-sans {match.manager1.score > match.manager2.score ? 'text-foreground font-semibold' : 'text-muted-foreground'}">
											{match.manager1.name}
										</span>
									</div>
									<div class="px-4 flex items-center gap-2">
										<span class="font-mono text-xl font-bold {match.manager1.score > match.manager2.score ? 'text-accent' : 'text-foreground'}">
											{match.manager1.score}
										</span>
										<span class="font-mono text-muted-foreground">-</span>
										<span class="font-mono text-xl font-bold {match.manager2.score > match.manager1.score ? 'text-accent' : 'text-foreground'}">
											{match.manager2.score}
										</span>
									</div>
									<div class="flex-1">
										<span class="font-sans {match.manager2.score > match.manager1.score ? 'text-foreground font-semibold' : 'text-muted-foreground'}">
											{match.manager2.name}
										</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>
