<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Skull, Rabbit, Target } from "@lucide/svelte";
	import type { NemesisBunny } from "$lib/types/fpl";

	let { rivalries = [] }: { rivalries: NemesisBunny[] } = $props();

	const meaningfulRivalries = $derived(
		rivalries.filter(r => r.nemesis || r.bunny)
	);
</script>

<Card.Root>
	<Card.Header class="flex-row items-center gap-2">
		<Target class="w-4 h-4 text-accent" />
		<div>
			<Card.Title>Rivalries</Card.Title>
			<Card.Description>Nemesis vs Bunny matchups</Card.Description>
		</div>
	</Card.Header>
	<Card.Content class="pt-0">
		{#if meaningfulRivalries.length === 0}
			<p class="text-xs text-muted-foreground">
				No clear rivalries yet - records are too even!
			</p>
		{:else}
			<div class="space-y-2">
				{#each meaningfulRivalries as rivalry (rivalry.managerId)}
					<div class="border border-border rounded overflow-hidden">
						<!-- Manager name header -->
						<div class="px-3 py-1.5 bg-muted/50 border-b border-border">
							<span class="text-xs font-semibold text-foreground">{rivalry.managerName}</span>
						</div>

						<div class="grid grid-cols-2 divide-x divide-border">
							<!-- Nemesis -->
							<div class="p-2 {rivalry.nemesis ? 'bg-destructive/5' : ''}">
								<div class="flex items-center gap-1.5 mb-1">
									<Skull class="w-3 h-3 text-destructive" />
									<span class="text-[9px] uppercase tracking-widest text-destructive font-medium">Nemesis</span>
								</div>
								{#if rivalry.nemesis}
									<div class="text-xs font-medium text-foreground truncate">{rivalry.nemesis.opponentName}</div>
									<div class="text-[10px] text-destructive tabular">{rivalry.nemesis.record}</div>
								{:else}
									<div class="text-[10px] text-muted-foreground">None</div>
								{/if}
							</div>

							<!-- Bunny -->
							<div class="p-2 {rivalry.bunny ? 'bg-success/5' : ''}">
								<div class="flex items-center gap-1.5 mb-1">
									<Rabbit class="w-3 h-3 text-success" />
									<span class="text-[9px] uppercase tracking-widest text-success font-medium">Bunny</span>
								</div>
								{#if rivalry.bunny}
									<div class="text-xs font-medium text-foreground truncate">{rivalry.bunny.opponentName}</div>
									<div class="text-[10px] text-success tabular">{rivalry.bunny.record}</div>
								{:else}
									<div class="text-[10px] text-muted-foreground">None</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
