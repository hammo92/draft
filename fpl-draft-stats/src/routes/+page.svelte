<script lang="ts">
	import type { PageProps } from './$types';
	import FormCharts from '$lib/components/FormCharts.svelte';
	import BenchPointsTracker from '$lib/components/BenchPointsTracker.svelte';
	import WeeklyPerformance from '$lib/components/WeeklyPerformance.svelte';
	import ManagerComparison from '$lib/components/ManagerComparison.svelte';
	import SquadAnalysis from '$lib/components/SquadAnalysis.svelte';
	import LeagueStandings from '$lib/components/shared/LeagueStandings.svelte';
	import LeagueInfo from '$lib/components/shared/LeagueInfo.svelte';
	import ManagerGrid from '$lib/components/shared/ManagerGrid.svelte';
	import H2HStats from '$lib/components/h2h/H2HStats.svelte';
	import TransferValue from '$lib/components/TransferValue.svelte';
	import * as Card from "$lib/components/ui/card";
	import * as Tabs from "$lib/components/ui/tabs";
	import {
		LayoutDashboard,
		Swords,
		TrendingUp,
		Armchair,
		CalendarDays,
		Target,
		Users
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
	<title>FPL Draft Stats - Who gets Isak?</title>
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
				Who gets Isak?
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
					value="form"
					class="font-mono text-sm uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:shadow-none bg-transparent px-4 py-3"
				>
					<TrendingUp class="w-4 h-4 mr-2" />
					<span class="hidden md:inline">Form</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="bench"
					class="font-mono text-sm uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:shadow-none bg-transparent px-4 py-3"
				>
					<Armchair class="w-4 h-4 mr-2" />
					<span class="hidden md:inline">Bench</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="weekly"
					class="font-mono text-sm uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:shadow-none bg-transparent px-4 py-3"
				>
					<CalendarDays class="w-4 h-4 mr-2" />
					<span class="hidden md:inline">Weekly</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="comparison"
					class="font-mono text-sm uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:shadow-none bg-transparent px-4 py-3"
				>
					<Target class="w-4 h-4 mr-2" />
					<span class="hidden md:inline">Compare</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="squads"
					class="font-mono text-sm uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:shadow-none bg-transparent px-4 py-3"
				>
					<Users class="w-4 h-4 mr-2" />
					<span class="hidden md:inline">Squads</span>
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="overview" class="space-y-8">
				<LeagueStandings standings={data.standings} />

				<LeagueInfo
					managerCount={data.league.entries.length}
					currentGameweek={data.currentGameweek}
					startGameweek={data.league.start_event}
				/>

				<TransferValue entries={data.league.entries} />

				<ManagerGrid entries={data.league.entries} />
			</Tabs.Content>

			<Tabs.Content value="h2h">
				<H2HStats
					matrix={data.h2h.matrix}
					fixtures={data.h2h.fixtures}
					luck={data.h2h.luck}
					stats={data.h2h.stats}
					entries={data.league.entries}
				/>
			</Tabs.Content>

			<Tabs.Content value="form">
				<FormCharts entries={data.league.entries} />
			</Tabs.Content>

			<Tabs.Content value="bench">
				<BenchPointsTracker entries={data.league.entries} />
			</Tabs.Content>

			<Tabs.Content value="weekly">
				<WeeklyPerformance entries={data.league.entries} startGameweek={data.startGameweek} currentGameweek={data.currentGameweek} />
			</Tabs.Content>

			<Tabs.Content value="comparison">
				<ManagerComparison entries={data.league.entries} />
			</Tabs.Content>

			<Tabs.Content value="squads">
				<SquadAnalysis entries={data.league.entries} players={data.players} currentGameweek={data.currentGameweek} />
			</Tabs.Content>
		</Tabs.Root>
	</div>
</main>
