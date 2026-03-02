<script lang="ts">
	let {
		entries = [],
		selectedManager = $bindable(),
		label = "Select Manager"
	}: {
		entries: any[];
		selectedManager: number | null;
		label?: string;
	} = $props();
</script>

<div class="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-sm">
	<label for="manager-selector" class="label-bright whitespace-nowrap">{label}:</label>
	<select
		id="manager-selector"
		bind:value={selectedManager}
		class="flex-1 h-8 rounded-sm border border-border bg-input px-2 py-1 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
	>
		{#each entries as entry}
			<option value={entry.entry_id}>
				{entry.entry_name} ({entry.player_first_name} {entry.player_last_name})
			</option>
		{/each}
	</select>
</div>
