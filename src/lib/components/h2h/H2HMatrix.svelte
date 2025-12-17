<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import type { H2HRecord } from "$lib/types/fpl";

	let { matrix = [], entries = [] }: { matrix: H2HRecord[]; entries: any[] } = $props();

	// Get unique managers from entries
	const managers = $derived(
		entries.map(e => {
			const firstName = e.player_first_name || '';
			const lastName = e.player_last_name || '';
			const isAverage = !firstName && !lastName;
			return {
				id: e.id,
				name: isAverage ? 'AVERAGE' : `${firstName} ${lastName}`.trim(),
				shortName: isAverage ? 'AVG' : `${firstName.charAt(0)}. ${lastName.split(' ')[0]}`
			};
		})
	);

	// Build lookup for quick access to records
	function getRecord(manager1Id: number, manager2Id: number): { wins: number; draws: number; losses: number } | null {
		if (manager1Id === manager2Id) return null;

		const record = matrix.find(r =>
			(r.manager1Id === manager1Id && r.manager2Id === manager2Id) ||
			(r.manager1Id === manager2Id && r.manager2Id === manager1Id)
		);

		if (!record) return { wins: 0, draws: 0, losses: 0 };

		// If manager1 is our row manager, return as-is; otherwise flip
		if (record.manager1Id === manager1Id) {
			return { wins: record.wins, draws: record.draws, losses: record.losses };
		} else {
			return { wins: record.losses, draws: record.draws, losses: record.wins };
		}
	}

	function getRecordClass(record: { wins: number; draws: number; losses: number } | null): string {
		if (!record) return '';
		if (record.wins > record.losses) return 'bg-accent/20 text-accent';
		if (record.wins < record.losses) return 'bg-destructive/20 text-destructive';
		return '';
	}
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header>
		<Card.Title class="font-serif text-2xl font-semibold text-foreground">Head-to-Head Records</Card.Title>
		<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
			Season matchup grid (W-D-L)
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr>
						<th class="font-mono text-xs uppercase tracking-wider text-muted-foreground text-left p-2 sticky left-0 bg-card"></th>
						{#each managers as manager}
							<th class="font-mono text-xs uppercase tracking-wider text-muted-foreground text-center p-2 min-w-[70px]">
								{manager.shortName}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each managers as rowManager}
						<tr class="border-t border-border">
							<td class="font-mono text-xs uppercase tracking-wider text-muted-foreground p-2 sticky left-0 bg-card">
								{rowManager.shortName}
							</td>
							{#each managers as colManager}
								{@const record = getRecord(rowManager.id, colManager.id)}
								<td class="text-center p-2 {getRecordClass(record)}">
									{#if record}
										<span class="font-mono text-sm font-medium">
											{record.wins}-{record.draws}-{record.losses}
										</span>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card.Content>
</Card.Root>
