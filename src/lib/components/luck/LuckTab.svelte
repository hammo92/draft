<script lang="ts">
	import LuckIndex from "$lib/components/h2h/LuckIndex.svelte";
	import RobberyReport from "$lib/components/h2h/RobberyReport.svelte";
	import LuckBreakdown from "$lib/components/luck/LuckBreakdown.svelte";
	import WouldHaveBeat from "$lib/components/luck/WouldHaveBeat.svelte";
	import FunStatCard from "$lib/components/stats/FunStatCard.svelte";
	import type { ManagerLuck, FunStats, ManagerWouldHaveBeat } from "$lib/types/fpl";

	let {
		luck = [],
		funStats,
		wouldHaveBeat = []
	}: {
		luck: ManagerLuck[];
		funStats?: FunStats;
		wouldHaveBeat?: ManagerWouldHaveBeat[];
	} = $props();
</script>

<div class="space-y-8">
	<!-- Luck Index - Hero component -->
	<LuckIndex {luck} />

	<!-- Holistic Luck Breakdown - Component-based luck -->
	{#if funStats?.luckBreakdown}
		<LuckBreakdown breakdown={funStats.luckBreakdown} />
	{/if}

	<!-- Robbery Report - Hero component -->
	{#if funStats?.robberies}
		<RobberyReport robberies={funStats.robberies} />
	{/if}

	<!-- Fixture Luck - Would Have Beat -->
	{#if wouldHaveBeat && wouldHaveBeat.length > 0}
		<WouldHaveBeat data={wouldHaveBeat} />
	{/if}

	<!-- xG-based luck stats -->
	{#if funStats}
		<div class="space-y-4">
			<h3 class="font-serif text-lg font-semibold text-foreground">Player Performance Luck</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<FunStatCard
					title="The Clinical Finisher"
					description="Goals scored vs expected (xG)"
					topLabel="Clinical"
					bottomLabel="Spursy"
					stats={funStats.clinicalFinisher}
				/>
				<FunStatCard
					title="The Assist Merchant"
					description="Assists vs expected (xA)"
					topLabel="Merchant"
					bottomLabel="Chance Waster's Friend"
					stats={funStats.assistLuck}
				/>
				<FunStatCard
					title="The Bonus Magnet"
					description="Total bonus points collected"
					topLabel="Magnet"
					bottomLabel="BPS Bridesmaid"
					stats={funStats.bonusMagnet}
				/>
			</div>
		</div>

		<!-- H2H outcome luck stats -->
		<div class="space-y-4">
			<h3 class="font-serif text-lg font-semibold text-foreground">Match Outcome Luck</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<FunStatCard
					title="The Smash & Grab Artist"
					description="H2H wins when scoring below average"
					topLabel="Smash & Grab"
					bottomLabel="Deserving Loser"
					stats={funStats.smashAndGrab}
				/>
				<FunStatCard
					title="The Nearly Man"
					description="H2H losses when scoring above average"
					topLabel="Nearly Man"
					bottomLabel="Deserving Winner"
					stats={funStats.nearlyMan}
				/>
			</div>
		</div>
	{/if}
</div>
