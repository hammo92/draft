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

<div class="flex items-center gap-4 p-4 bg-muted rounded-lg">
	<label for="manager-selector" class="font-semibold text-fpl-purple">{label}:</label>
	<select
		id="manager-selector"
		bind:value={selectedManager}
		class="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
	>
		{#each entries as entry}
			<option value={entry.entry_id}>
				{entry.entry_name} ({entry.player_first_name} {entry.player_last_name})
			</option>
		{/each}
	</select>
</div>
