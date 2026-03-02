<script lang="ts">
	import LuckIndex from "$lib/components/h2h/LuckIndex.svelte";
	import RobberyReport from "$lib/components/h2h/RobberyReport.svelte";
	import LuckBreakdown from "$lib/components/luck/LuckBreakdown.svelte";
	import WouldHaveBeat from "$lib/components/luck/WouldHaveBeat.svelte";
	import HolisticLuckCard from "$lib/components/luck/HolisticLuckCard.svelte";
	import LossAnalysisCard from "$lib/components/luck/LossAnalysisCard.svelte";
	import FunStatCard from "$lib/components/stats/FunStatCard.svelte";
	import type { ManagerLuck, FunStats, ManagerWouldHaveBeat, ManagerFixtureLuck, HolisticLuck, ManagerLossAnalysis } from "$lib/types/fpl";

	let {
		luck = [],
		funStats,
		wouldHaveBeat = [],
		fixtureLuck = [],
		holisticLuck = [],
		lossAnalysis = []
	}: {
		luck: ManagerLuck[];
		funStats?: FunStats;
		wouldHaveBeat?: ManagerWouldHaveBeat[];
		fixtureLuck?: ManagerFixtureLuck[];
		holisticLuck?: HolisticLuck[];
		lossAnalysis?: ManagerLossAnalysis[];
	} = $props();
</script>

<div class="space-y-8">
	<!-- Holistic Luck - Combined performance + schedule + outcome luck -->
	{#if holisticLuck && holisticLuck.length > 0}
		<HolisticLuckCard {holisticLuck} />
	{/if}

	<!-- Loss Analysis - Categorized breakdown of why losses happened -->
	{#if lossAnalysis && lossAnalysis.length > 0}
		<LossAnalysisCard {lossAnalysis} />
	{/if}

	<!-- Performance Luck Index - Detailed breakdown -->
	<LuckIndex {luck} />

	<!-- Component-level Luck Breakdown -->
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
			<h3 class="font-sans text-lg font-semibold text-foreground">Player Performance Luck</h3>
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
			<h3 class="font-sans text-lg font-semibold text-foreground">Match Outcome Luck</h3>
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
