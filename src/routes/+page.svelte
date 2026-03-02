<script lang="ts">
	import type { PageProps } from './$types';
	import FormCharts from '$lib/components/FormCharts.svelte';
	import BenchPointsTracker from '$lib/components/BenchPointsTracker.svelte';
	import WeeklyPerformance from '$lib/components/WeeklyPerformance.svelte';
	import SquadAnalysis from '$lib/components/SquadAnalysis.svelte';
	import LeagueStandings from '$lib/components/shared/LeagueStandings.svelte';
	import LeagueInfo from '$lib/components/shared/LeagueInfo.svelte';
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
		Sparkles,
		Activity
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

	// Current time for terminal status bar
	let currentTime = $state(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

	$effect(() => {
		const interval = setInterval(() => {
			currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
		}, 60000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>FPL Draft Stats - {data.league.name}</title>
</svelte:head>

<main class="min-h-screen bg-background">
	<!-- Terminal Status Bar -->
	<header class="sticky top-0 z-50 bg-surface border-b border-border">
		<div class="flex items-center justify-between px-4 py-1.5 text-xs">
			<div class="flex items-center gap-4">
				<span class="text-accent font-semibold tracking-wide">FPL DRAFT</span>
				<span class="text-muted-foreground">//</span>
				<span class="font-sans text-foreground">{data.league.name}</span>
				<span class="text-muted-foreground hidden sm:inline">ID:{data.league.id}</span>
			</div>
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-1.5">
					<span class="status-dot"></span>
					<span class="text-muted-foreground hidden sm:inline">LIVE</span>
				</div>
				<span class="text-muted-foreground">{currentTime}</span>
			</div>
		</div>
	</header>

	<!-- Data Summary Strip -->
	<section class="bg-muted border-b border-border">
		<div class="container max-w-7xl mx-auto px-4">
			<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 divide-x divide-border">
				<div class="py-3 px-4 first:pl-0">
					<div class="label mb-0.5">Gameweek</div>
					<div class="text-2xl font-bold text-accent tabular glow-accent">{data.currentGameweek}</div>
				</div>
				<div class="py-3 px-4">
					<div class="label mb-0.5">Managers</div>
					<div class="text-2xl font-bold text-foreground tabular">{data.league.entries.length}</div>
				</div>
				<div class="py-3 px-4 hidden md:block">
					<div class="label mb-0.5">Avg Points</div>
					<div class="text-2xl font-bold text-foreground tabular">{avgScore.toLocaleString()}</div>
				</div>
				<div class="py-3 px-4 hidden md:block">
					<div class="label mb-0.5">Leader Pts</div>
					<div class="text-2xl font-bold text-success tabular">{leader?.total.toLocaleString() || '—'}</div>
				</div>
				<div class="py-3 px-4 hidden lg:block">
					<div class="label mb-0.5">Leader</div>
					<div class="font-sans text-lg font-semibold text-foreground truncate">{leader?.player_name || '—'}</div>
				</div>
				<div class="py-3 px-4 hidden lg:block">
					<div class="label mb-0.5">Gap to 2nd</div>
					<div class="text-2xl font-bold tabular {data.standings[1] ? (leader?.total - data.standings[1]?.total > 0 ? 'text-success' : 'text-warning') : 'text-muted-foreground'}">
						{#if data.standings[1]}
							{leader?.total - data.standings[1]?.total > 0 ? '+' : ''}{leader?.total - data.standings[1]?.total}
						{:else}
							—
						{/if}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Main Content -->
	<div class="container max-w-7xl mx-auto px-4 py-6">
		<Tabs.Root value="overview" class="w-full">
			<!-- Terminal-style tab navigation -->
			<Tabs.List class="w-full mb-6 bg-surface border border-border rounded p-1 gap-0 flex flex-wrap">
				<Tabs.Trigger
					value="overview"
					class="flex-1 min-w-[100px] text-xs uppercase tracking-wider font-medium rounded-sm border border-transparent
						data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:border-accent
						data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted
						transition-all duration-150 px-3 py-2"
				>
					<LayoutDashboard class="w-3.5 h-3.5 mr-1.5 inline" />
					<span class="hidden sm:inline">Overview</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="h2h"
					class="flex-1 min-w-[100px] text-xs uppercase tracking-wider font-medium rounded-sm border border-transparent
						data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:border-accent
						data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted
						transition-all duration-150 px-3 py-2"
				>
					<Swords class="w-3.5 h-3.5 mr-1.5 inline" />
					<span class="hidden sm:inline">H2H</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="performance"
					class="flex-1 min-w-[100px] text-xs uppercase tracking-wider font-medium rounded-sm border border-transparent
						data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:border-accent
						data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted
						transition-all duration-150 px-3 py-2"
				>
					<TrendingUp class="w-3.5 h-3.5 mr-1.5 inline" />
					<span class="hidden sm:inline">Performance</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="luck"
					class="flex-1 min-w-[100px] text-xs uppercase tracking-wider font-medium rounded-sm border border-transparent
						data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:border-accent
						data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted
						transition-all duration-150 px-3 py-2"
				>
					<Sparkles class="w-3.5 h-3.5 mr-1.5 inline" />
					<span class="hidden sm:inline">Luck</span>
				</Tabs.Trigger>
			</Tabs.List>

			<!-- Overview: Standings, League Info, Weekly Awards, Manager Grid -->
			<Tabs.Content value="overview" class="space-y-6">
				<LeagueStandings standings={data.standings} />

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<LeagueInfo
						managerCount={data.league.entries.length}
						currentGameweek={data.currentGameweek}
						startGameweek={data.league.start_event}
					/>
					<WeeklyAwards awards={data.weeklyAwards} currentGameweek={data.currentGameweek} />
				</div>

				<WeeklyBanter banter={data.weeklyBanter} />
			</Tabs.Content>

			<!-- H2H: Matrix, Fixtures, Rivalries, Streaks -->
			<Tabs.Content value="h2h">
				<div class="space-y-6">
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

			<!-- Performance: Form, Weekly, Squads, Bench, Transfers, Stats -->
			<Tabs.Content value="performance">
				<!-- Section Navigation -->
				<nav class="sticky top-[41px] z-40 -mx-4 px-4 py-2 mb-6 bg-surface/95 backdrop-blur border-b border-border">
					<div class="flex gap-2 overflow-x-auto scrollbar-none">
						<a href="#form" class="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-sm transition-colors whitespace-nowrap">Form</a>
						<a href="#weekly" class="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-sm transition-colors whitespace-nowrap">Weekly</a>
						<a href="#squads" class="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-sm transition-colors whitespace-nowrap">Squads</a>
						<a href="#transfers" class="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-sm transition-colors whitespace-nowrap">Transfers</a>
						<a href="#bench" class="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-sm transition-colors whitespace-nowrap">Bench</a>
						<a href="#stats" class="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-sm transition-colors whitespace-nowrap">Stats</a>
					</div>
				</nav>

				<div class="space-y-8">
					<!-- Section: Form Analysis -->
					<section id="form" class="scroll-mt-24">
						<FormCharts entries={data.league.entries} />
					</section>

					<!-- Section: Weekly Performance -->
					<section id="weekly" class="scroll-mt-24">
						<WeeklyPerformance entries={data.league.entries} startGameweek={data.startGameweek} currentGameweek={data.currentGameweek} />
					</section>

					<!-- Section: Squad Analysis (merged from Squads tab) -->
					<section id="squads" class="scroll-mt-24">
						<SquadAnalysis entries={data.league.entries} players={data.players} currentGameweek={data.currentGameweek} />
					</section>

					<!-- Section: Transfers -->
					<section id="transfers" class="scroll-mt-24">
						<div class="space-y-4">
							<h3 class="text-sm font-sans font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
								<TrendingUp class="w-4 h-4 text-accent" />
								Transfer Analysis
							</h3>
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<TransferValue entries={data.league.entries} />
								<TransferRegrets entries={data.league.entries} />
							</div>
						</div>
					</section>

					<!-- Section: Bench Points -->
					<section id="bench" class="scroll-mt-24">
						<BenchPointsTracker entries={data.league.entries} />
					</section>

					<!-- Section: Performance Stats -->
					{#if data.funStats}
						<section id="stats" class="scroll-mt-24">
							<div class="space-y-4">
								<h3 class="text-sm font-sans font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
									<Activity class="w-4 h-4 text-accent" />
									Performance Stats
								</h3>
								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
						</section>
					{/if}
				</div>
			</Tabs.Content>

			<!-- Luck: All luck/variance metrics -->
			<Tabs.Content value="luck">
				<LuckTab
					luck={data.h2h.luck}
					funStats={data.funStats}
					wouldHaveBeat={data.h2h.wouldHaveBeat}
					fixtureLuck={data.h2h.fixtureLuck}
					holisticLuck={data.h2h.holisticLuck}
					lossAnalysis={data.h2h.lossAnalysis}
				/>
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<!-- Terminal Footer -->
	<footer class="border-t border-border bg-surface mt-auto">
		<div class="container max-w-7xl mx-auto px-4 py-2">
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>FPL DRAFT ANALYTICS // {data.league.entries.length} MANAGERS // GW{data.currentGameweek}</span>
				<span class="hidden sm:inline">DATA SOURCE: DRAFT.PREMIERLEAGUE.COM</span>
			</div>
		</div>
	</footer>
</main>
