<script lang="ts">
	import * as Tabs from "$lib/components/ui/tabs";
	import H2HMatrix from "./H2HMatrix.svelte";
	import FixtureHistory from "./FixtureHistory.svelte";
	import LuckIndex from "./LuckIndex.svelte";
	import { Grid3x3, Calendar, Sparkles } from "@lucide/svelte";
	import type { H2HRecord, MatchResult, ManagerLuck, RivalryStats } from "$lib/types/fpl";

	let {
		matrix = [],
		fixtures = [],
		luck = [],
		stats,
		entries = []
	}: {
		matrix: H2HRecord[];
		fixtures: MatchResult[];
		luck: ManagerLuck[];
		stats: RivalryStats;
		entries: any[];
	} = $props();
</script>

<Tabs.Root value="matrix" class="w-full">
	<Tabs.List class="w-full mb-6 bg-muted rounded-lg p-1 gap-1">
		<Tabs.Trigger
			value="matrix"
			class="font-mono text-sm uppercase tracking-wide rounded data-[state=active]:bg-card data-[state=active]:text-accent data-[state=active]:shadow-sm px-4 py-2"
		>
			<Grid3x3 class="w-4 h-4 mr-2" />
			Matrix
		</Tabs.Trigger>
		<Tabs.Trigger
			value="fixtures"
			class="font-mono text-sm uppercase tracking-wide rounded data-[state=active]:bg-card data-[state=active]:text-accent data-[state=active]:shadow-sm px-4 py-2"
		>
			<Calendar class="w-4 h-4 mr-2" />
			Fixtures
		</Tabs.Trigger>
		<Tabs.Trigger
			value="luck"
			class="font-mono text-sm uppercase tracking-wide rounded data-[state=active]:bg-card data-[state=active]:text-accent data-[state=active]:shadow-sm px-4 py-2"
		>
			<Sparkles class="w-4 h-4 mr-2" />
			Luck
		</Tabs.Trigger>
	</Tabs.List>

	<Tabs.Content value="matrix">
		<H2HMatrix {matrix} {entries} />
	</Tabs.Content>

	<Tabs.Content value="fixtures">
		<FixtureHistory {fixtures} {stats} />
	</Tabs.Content>

	<Tabs.Content value="luck">
		<LuckIndex {luck} />
	</Tabs.Content>
</Tabs.Root>
