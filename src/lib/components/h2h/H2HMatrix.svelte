<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import type { H2HRecord } from "$lib/types/fpl";
	import { Grid3x3 } from "@lucide/svelte";

	let { matrix = [], entries = [] }: { matrix: H2HRecord[]; entries: any[] } = $props();

	const managers = $derived(
		entries.map(e => {
			const firstName = e.player_first_name || '';
			const lastName = e.player_last_name || '';
			const isAverage = !firstName && !lastName;
			return {
				id: e.id,
				name: isAverage ? 'AVERAGE' : `${firstName} ${lastName}`.trim(),
				displayName: isAverage ? 'AVG' : firstName || lastName.charAt(0) || '?',
				shortName: isAverage ? 'AVG' : `${firstName.charAt(0)}${lastName.charAt(0)}`
			};
		})
	);

	function getRecord(manager1Id: number, manager2Id: number): { wins: number; draws: number; losses: number } | null {
		if (manager1Id === manager2Id) return null;

		const record = matrix.find(r =>
			(r.manager1Id === manager1Id && r.manager2Id === manager2Id) ||
			(r.manager1Id === manager2Id && r.manager2Id === manager1Id)
		);

		if (!record) return { wins: 0, draws: 0, losses: 0 };

		if (record.manager1Id === manager1Id) {
			return { wins: record.wins, draws: record.draws, losses: record.losses };
		} else {
			return { wins: record.losses, draws: record.draws, losses: record.wins };
		}
	}

	function getRecordStyle(record: { wins: number; draws: number; losses: number } | null): string {
		if (!record) return 'bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(30,30,40,0.5)_4px,rgba(30,30,40,0.5)_8px)] border-border/50';
		const diff = record.wins - record.losses;
		if (diff > 2) return 'bg-success/20 border-success/40';
		if (diff > 0) return 'bg-success/10 border-success/20';
		if (diff < -2) return 'bg-destructive/20 border-destructive/40';
		if (diff < 0) return 'bg-destructive/10 border-destructive/20';
		return 'bg-muted/20 border-border';
	}

	function getTextStyle(record: { wins: number; draws: number; losses: number } | null): string {
		if (!record) return 'text-muted-foreground';
		if (record.wins > record.losses) return 'text-success';
		if (record.wins < record.losses) return 'text-destructive';
		return 'text-muted-foreground';
	}
</script>

<Card.Root>
	<Card.Header class="flex-row items-center gap-2">
		<Grid3x3 class="w-4 h-4 text-accent" />
		<div>
			<Card.Title>H2H Matrix</Card.Title>
			<Card.Description>Season matchup grid (W-D-L)</Card.Description>
		</div>
	</Card.Header>
	<Card.Content class="p-0">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse">
				<thead>
					<tr class="bg-muted/50">
						<th class="text-[9px] uppercase tracking-widest text-muted-foreground text-left p-1.5 sticky left-0 bg-muted/50 z-10 border-r border-border w-12"></th>
						{#each managers as manager}
							<th
								class="font-sans text-[9px] uppercase tracking-wider text-muted-foreground text-center p-1.5 min-w-[60px] border-r border-border last:border-r-0 cursor-help"
								title={manager.name}
							>
								{manager.displayName}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each managers as rowManager, rowIndex}
						<tr class="border-t border-border">
							<td
								class="font-sans text-[9px] uppercase tracking-wider text-muted-foreground p-1.5 sticky left-0 bg-card z-10 border-r border-border font-medium cursor-help"
								title={rowManager.name}
							>
								{rowManager.displayName}
							</td>
							{#each managers as colManager}
								{@const record = getRecord(rowManager.id, colManager.id)}
								<td class="p-0.5 border-r border-border last:border-r-0">
									<div class="h-8 flex items-center justify-center rounded-sm border {getRecordStyle(record)}">
										{#if record}
											<span class="text-[10px] font-medium tabular {getTextStyle(record)}">
												{record.wins}<span class="text-muted-foreground/50">-</span>{record.draws}<span class="text-muted-foreground/50">-</span>{record.losses}
											</span>
										{:else}
											<span class="text-[10px] text-muted-foreground/30">-</span>
										{/if}
									</div>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Legend -->
		<div class="flex items-center justify-center gap-4 px-4 py-2 border-t border-border text-[9px] text-muted-foreground uppercase tracking-wider">
			<span class="flex items-center gap-1">
				<span class="w-3 h-3 rounded-sm bg-success/20 border border-success/40"></span>
				Winning
			</span>
			<span class="flex items-center gap-1">
				<span class="w-3 h-3 rounded-sm bg-muted/20 border border-border"></span>
				Even
			</span>
			<span class="flex items-center gap-1">
				<span class="w-3 h-3 rounded-sm bg-destructive/20 border border-destructive/40"></span>
				Losing
			</span>
		</div>
	</Card.Content>
</Card.Root>
