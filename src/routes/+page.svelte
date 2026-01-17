<script lang="ts">
	import type { PageProps } from './$types';
	import FormCharts from '$lib/components/FormCharts.svelte';
	import BenchPointsTracker from '$lib/components/BenchPointsTracker.svelte';
	import WeeklyPerformance from '$lib/components/WeeklyPerformance.svelte';
	import SquadAnalysis from '$lib/components/SquadAnalysis.svelte';
	import LeagueStandings from '$lib/components/shared/LeagueStandings.svelte';
	import LeagueInfo from '$lib/components/shared/LeagueInfo.svelte';
	import ManagerGrid from '$lib/components/shared/ManagerGrid.svelte';
	import H2HStats from '$lib/components/h2h/H2HStats.svelte';
	import RivalriesCard from '$lib/components/h2h/RivalriesCard.svelte';
	import StreaksCard from '$lib/components/h2h/StreaksCard.svelte';
	import TransferValue from '$lib/components/TransferValue.svelte';
	import TransferRegrets from '$lib/components/TransferRegrets.svelte';
	import LuckTab from '$lib/components/luck/LuckTab.svelte';
	import WeeklyAwards from '$lib/components/WeeklyAwards.svelte';
	import WeeklyBanter from '$lib/components/WeeklyBanter.svelte';
	import FunStatCard from '$lib/components/stats/FunStatCard.svelte';
	import * as Tabs from "$lib/components/ui/tabs";
	import {
		LayoutDashboard,
		Swords,
		TrendingUp,
		Users,
		Sparkles
	} from '@lucide/svelte';

	let { data }: PageProps = $props();

	// Calculate hero stats
	const totalPoints = $derived(
		data.standings.reduce((sum, s) => sum + s.total, 0)
	);
	const avgScore = $derived(
		data.league.entries.length > 0
			? Math.round(totalPoints / data.league.entries.length)
			: 0
	);
	const leader = $derived(data.standings[0]);
</script>

<svelte:head>
	<title>FPL Draft Stats - {data.league.name}</title>
</svelte:head>

<main class="min-h-screen bg-background">
	<!-- Header with dot pattern -->
	<header class="relative overflow-hidden border-b border-border">
		<div class="absolute inset-0 dot-pattern-subtle"></div>
		<div class="relative container max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
			<p class="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
				Fantasy Premier League Draft
			</p>
			<h1 class="font-serif text-4xl md:text-5xl font-bold text-foreground mb-2">
				{data.league.name}
			</h1>
			<p class="font-mono text-sm text-muted-foreground">
				League {data.league.id}
			</p>
		</div>
	</header>

	<!-- Hero Stats Row -->
	<section class="bg-muted border-b border-border">
		<div class="container max-w-7xl mx-auto px-4 md:px-8 py-8">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
				<div class="accent-bar">
					<div class="stat-number">{data.league.entries.length}</div>
					<div class="label">Managers</div>
				</div>
				<div class="accent-bar">
					<div class="stat-number">{data.currentGameweek}</div>
					<div class="label">Gameweek</div>
				</div>
				<div class="accent-bar">
					<div class="stat-number">{avgScore.toLocaleString()}</div>
					<div class="label">Avg Points</div>
				</div>
				<div class="accent-bar">
					<div class="stat-number">{leader?.total.toLocaleString() || '—'}</div>
					<div class="label">Leader</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Main Content -->
	<div class="container max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
		<Tabs.Root value="overview" class="w-full">
			<Tabs.List class="w-full mb-8 bg-transparent border-b border-border rounded-none p-0 gap-0">
				<Tabs.Trigger
					value="overview"
					class="font-mono text-sm uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:shadow-none bg-transparent px-4 py-3"
				>
					<LayoutDashboard class="w-4 h-4 mr-2" />
					<span class="hidden md:inline">Overview</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="h2h"
					class="font-mono text-sm uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:shadow-none bg-transparent px-4 py-3"
				>
					<Swords class="w-4 h-4 mr-2" />
					<span class="hidden md:inline">H2H</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="performance"
					class="font-mono text-sm uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:shadow-none bg-transparent px-4 py-3"
				>
					<TrendingUp class="w-4 h-4 mr-2" />
					<span class="hidden md:inline">Performance</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="squads"
					class="font-mono text-sm uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:shadow-none bg-transparent px-4 py-3"
				>
					<Users class="w-4 h-4 mr-2" />
					<span class="hidden md:inline">Squads</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="luck"
					class="font-mono text-sm uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:shadow-none bg-transparent px-4 py-3"
				>
					<Sparkles class="w-4 h-4 mr-2" />
					<span class="hidden md:inline">Luck</span>
				</Tabs.Trigger>
			</Tabs.List>

			<!-- Overview: Standings, League Info, Weekly Awards, Manager Grid -->
			<Tabs.Content value="overview" class="space-y-8">
				<LeagueStandings standings={data.standings} />

				<LeagueInfo
					managerCount={data.league.entries.length}
					currentGameweek={data.currentGameweek}
					startGameweek={data.league.start_event}
				/>

				<WeeklyAwards awards={data.weeklyAwards} currentGameweek={data.currentGameweek} />

				<WeeklyBanter banter={data.weeklyBanter} />

				<ManagerGrid entries={data.league.entries} />
			</Tabs.Content>

			<!-- H2H: Matrix, Fixtures, Rivalries, Streaks -->
			<Tabs.Content value="h2h">
				<div class="space-y-8">
					<H2HStats
						matrix={data.h2h.matrix}
						fixtures={data.h2h.fixtures}
						stats={data.h2h.stats}
						entries={data.league.entries}
					/>

					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<RivalriesCard rivalries={data.h2h.nemesisBunny} />
						<StreaksCard streaks={data.h2h.streaks} />
					</div>
				</div>
			</Tabs.Content>

			<!-- Performance: Form, Weekly, Bench, Transfer Value, Consistency stats -->
			<Tabs.Content value="performance">
				<div class="space-y-8">
					<FormCharts entries={data.league.entries} />

					<WeeklyPerformance entries={data.league.entries} startGameweek={data.startGameweek} currentGameweek={data.currentGameweek} />

					<TransferValue entries={data.league.entries} />

					<TransferRegrets entries={data.league.entries} />

					<BenchPointsTracker entries={data.league.entries} />

					{#if data.funStats}
						<div class="space-y-4">
							<h3 class="font-serif text-lg font-semibold text-foreground">Consistency & Efficiency</h3>
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<FunStatCard
									title="Mr. Consistent"
									description="Weekly score variance (lower = more consistent)"
									topLabel="Consistent"
									bottomLabel="Rollercoaster"
									stats={data.funStats.consistency}
								/>
								<FunStatCard
									title="The Ceiling Raiser"
									description="Best GW / Worst GW"
									topLabel="Highest Range"
									bottomLabel="Lowest Range"
									stats={data.funStats.ceilingFloor}
								/>
								<FunStatCard
									title="The Auto-Sub Lottery"
									description="Points left on the bench"
									topLabel="Wasteful"
									bottomLabel="Efficient"
									stats={data.funStats.autoSubLottery}
								/>
							</div>
						</div>
					{/if}
				</div>
			</Tabs.Content>

			<!-- Squads: Squad Analysis, One-Man Army, Great Wall -->
			<Tabs.Content value="squads">
				<div class="space-y-8">
					<SquadAnalysis entries={data.league.entries} players={data.players} currentGameweek={data.currentGameweek} />

					{#if data.funStats}
						<div class="space-y-4">
							<h3 class="font-serif text-lg font-semibold text-foreground">Squad Composition</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FunStatCard
									title="The One-Man Army"
									description="% of points from top scorer"
									topLabel="Dependent"
									bottomLabel="Balanced"
									stats={data.funStats.oneManArmy}
								/>
								<FunStatCard
									title="The Great Wall"
									description="Total clean sheets"
									topLabel="Great Wall"
									bottomLabel="Sieve"
									stats={data.funStats.greatWall}
								/>
							</div>
						</div>
					{/if}
				</div>
			</Tabs.Content>

			<!-- Luck: All luck/variance metrics -->
			<Tabs.Content value="luck">
				<LuckTab luck={data.h2h.luck} funStats={data.funStats} wouldHaveBeat={data.h2h.wouldHaveBeat} />
			</Tabs.Content>
		</Tabs.Root>
	</div>
</main>
