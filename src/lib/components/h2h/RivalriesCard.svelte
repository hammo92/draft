<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Skull, Rabbit } from "@lucide/svelte";
	import type { NemesisBunny } from "$lib/types/fpl";

	let { rivalries = [] }: { rivalries: NemesisBunny[] } = $props();

	// Filter to only show managers with at least one nemesis or bunny
	const meaningfulRivalries = $derived(
		rivalries.filter(r => r.nemesis || r.bunny)
	);
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header class="pb-3">
		<Card.Title class="font-serif text-lg font-semibold text-foreground">Rivalries</Card.Title>
		<Card.Description class="font-mono text-xs text-muted-foreground">
			Your nemesis (can't beat) and bunny (always beat)
		</Card.Description>
	</Card.Header>
	<Card.Content class="pt-0">
		{#if meaningfulRivalries.length === 0}
			<p class="font-mono text-sm text-muted-foreground">
				No clear rivalries yet - records are too even!
			</p>
		{:else}
			<div class="space-y-3">
				{#each meaningfulRivalries as rivalry (rivalry.managerId)}
					<div class="p-3 bg-muted/30 rounded-lg border border-border">
						<div class="font-mono text-sm font-semibold text-foreground mb-2">
							{rivalry.managerName}
						</div>
						<div class="grid grid-cols-2 gap-3">
							<!-- Nemesis -->
							<div class="flex items-start gap-2">
								<Skull class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
								<div>
									<div class="font-mono text-xs uppercase tracking-wide text-red-500">Nemesis</div>
									{#if rivalry.nemesis}
										<div class="font-mono text-sm text-foreground">{rivalry.nemesis.opponentName}</div>
										<div class="font-mono text-xs text-muted-foreground">{rivalry.nemesis.record}</div>
									{:else}
										<div class="font-mono text-xs text-muted-foreground">None</div>
									{/if}
								</div>
							</div>
							<!-- Bunny -->
							<div class="flex items-start gap-2">
								<Rabbit class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
								<div>
									<div class="font-mono text-xs uppercase tracking-wide text-green-500">Bunny</div>
									{#if rivalry.bunny}
										<div class="font-mono text-sm text-foreground">{rivalry.bunny.opponentName}</div>
										<div class="font-mono text-xs text-muted-foreground">{rivalry.bunny.record}</div>
									{:else}
										<div class="font-mono text-xs text-muted-foreground">None</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
