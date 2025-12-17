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

<div class="flex items-center gap-4 p-4 bg-muted rounded-lg">
	<label for="gw-selector" class="font-semibold text-fpl-purple">{label}:</label>
	<select
		id="gw-selector"
		bind:value={selectedGameweek}
		class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
	>
		{#each Array.from({ length: currentGameweek - startGameweek + 1 }, (_, i) => startGameweek + i) as gw}
			<option value={gw}>Gameweek {gw}</option>
		{/each}
	</select>
</div>
