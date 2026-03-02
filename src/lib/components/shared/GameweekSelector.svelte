<script lang="ts">
	let {
		selectedGameweek = $bindable(),
		startGameweek,
		currentGameweek,
		label = "Select Gameweek"
	}: {
		selectedGameweek: number;
		startGameweek: number;
		currentGameweek: number;
		label?: string;
	} = $props();
</script>

<div class="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-sm">
	<label for="gw-selector" class="label-bright whitespace-nowrap">{label}:</label>
	<select
		id="gw-selector"
		bind:value={selectedGameweek}
		class="h-8 rounded-sm border border-border bg-input px-2 py-1 text-sm font-mono tabular focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
	>
		{#each Array.from({ length: currentGameweek - startGameweek + 1 }, (_, i) => startGameweek + i) as gw}
			<option value={gw}>Gameweek {gw}</option>
		{/each}
	</select>
</div>
