<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { TrendingUp, TrendingDown, Target, Calendar, AlertTriangle, Trophy, Frown, Scale } from "@lucide/svelte";
	import type { HolisticLuck } from "$lib/types/fpl";

	let {
		holisticLuck = []
	}: {
		holisticLuck: HolisticLuck[];
	} = $props();

	function getZScoreColor(z: number): string {
		if (z >= 1) return "text-green-500";
		if (z >= 0.5) return "text-green-400";
		if (z >= 0) return "text-muted-foreground";
		if (z >= -0.5) return "text-red-400";
		return "text-red-500";
	}

	function getZScoreBg(z: number): string {
		if (z >= 0.5) return "bg-green-500/10";
		if (z >= 0) return "bg-muted/30";
		return "bg-red-500/10";
	}

	function formatZ(z: number): string {
		return z >= 0 ? `+${z.toFixed(2)}` : z.toFixed(2);
	}

	function getRankLabel(rank: number, total: number): string {
		if (rank === 1) return "Luckiest";
		if (rank === total) return "Unluckiest";
		return `#${rank}`;
	}

	function getRankEmoji(rank: number, total: number): string {
		if (rank === 1) return "";
		if (rank === total) return "";
		if (rank <= 3) return "";
		if (rank >= total - 2) return "";
		return "";
	}
</script>

<Card.Root class="bg-card border border-border rounded shadow-none">
	<Card.Header>
		<div class="flex items-center justify-between flex-wrap gap-4">
			<div>
				<Card.Title class="font-sans text-2xl font-semibold text-foreground flex items-center gap-2">
					<Target class="w-6 h-6 text-accent" />
					Holistic Luck Index
				</Card.Title>
				<Card.Description class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
					Performance + Schedule + Outcome luck combined
				</Card.Description>
			</div>
		</div>
	</Card.Header>
	<Card.Content>
		<div class="mb-6 p-4 bg-muted/50 rounded border border-border">
			<p class="font-mono text-xs text-muted-foreground leading-relaxed">
				<span class="font-semibold text-foreground">How holistic luck works:</span>
				We combine three factors: <span class="text-accent">Performance</span> (did your players over/underperform their expected?), <span class="text-accent">Schedule</span> (fixture points relative to expected based on score ranking), and <span class="text-accent">Outcome</span> (FP lost to opponent overperformance - robberies and team-wide opponent luck).
				All are normalized to z-scores and equally weighted.
			</p>
		</div>

		<div class="space-y-4">
			{#each holisticLuck as manager (manager.managerId)}
				<div class="border border-border rounded-lg overflow-hidden {getZScoreBg(manager.holisticZScore)}">
					<div class="p-4">
						<!-- Header row -->
						<div class="flex items-center justify-between mb-4">
							<div class="flex items-center gap-3">
								<span class="font-mono text-lg">
									{getRankEmoji(manager.holisticRank, holisticLuck.length)}
								</span>
								<div>
									<span class="font-mono text-xs uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
										{getRankLabel(manager.holisticRank, holisticLuck.length)}
									</span>
									<h3 class="font-sans text-lg font-semibold text-foreground mt-1">
										{manager.managerName}
									</h3>
								</div>
							</div>
							<div class="text-right">
								<div class="flex items-center gap-1 justify-end">
									{#if manager.holisticZScore >= 0}
										<TrendingUp class="w-5 h-5 text-green-500" />
									{:else}
										<TrendingDown class="w-5 h-5 text-red-500" />
									{/if}
									<span class="font-mono text-2xl font-bold {getZScoreColor(manager.holisticZScore)}">
										{formatZ(manager.holisticZScore)}
									</span>
								</div>
								<span class="font-mono text-xs text-muted-foreground">z-score</span>
							</div>
						</div>

						<!-- Breakdown grid -->
						<div class="grid grid-cols-3 gap-3">
							<!-- Performance Luck -->
							<div class="bg-card/50 rounded p-3 border border-border">
								<div class="flex items-center gap-2 mb-2">
									<Target class="w-4 h-4 text-muted-foreground" />
									<span class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Performance</span>
								</div>
								<div class="font-mono text-lg font-semibold {getZScoreColor(manager.performanceZScore)}">
									{manager.performanceLuck >= 0 ? '+' : ''}{manager.performanceLuck} pts
								</div>
								<div class="font-mono text-xs text-muted-foreground">
									z: {formatZ(manager.performanceZScore)}
								</div>
							</div>

							<!-- Schedule Luck -->
							<div class="bg-card/50 rounded p-3 border border-border">
								<div class="flex items-center gap-2 mb-2">
									<Calendar class="w-4 h-4 text-muted-foreground" />
									<span class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Schedule</span>
								</div>
								<div class="font-mono text-lg font-semibold {getZScoreColor(manager.scheduleZScore)}">
									{manager.scheduleLuck >= 0 ? '+' : ''}{manager.scheduleLuck} FP
								</div>
								<div class="font-mono text-xs text-muted-foreground">
									z: {formatZ(manager.scheduleZScore)}
								</div>
							</div>

							<!-- Outcome Luck -->
							<div class="bg-card/50 rounded p-3 border border-border">
								<div class="flex items-center gap-2 mb-2">
									<AlertTriangle class="w-4 h-4 text-muted-foreground" />
									<span class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Outcome</span>
								</div>
								<div class="font-mono text-lg font-semibold {getZScoreColor(manager.outcomeZScore)}">
									{manager.outcomeLuck >= 0 ? '+' : ''}{manager.outcomeLuck} FP
								</div>
								<div class="font-mono text-xs text-muted-foreground">
									z: {formatZ(manager.outcomeZScore)}
								</div>
							</div>
						</div>

						<!-- Loss breakdown summary -->
						{#if manager.totalFPLost > 0}
							<div class="mt-3 pt-3 border-t border-border">
								<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
									{#if manager.robberyLosses > 0}
										<span class="font-mono text-red-500">
											{manager.robberyLosses} robbery ({manager.fpLostToRobberies.toFixed(1)} FP)
										</span>
									{/if}
									{#if manager.opponentLuckLosses > 0}
										<span class="font-mono text-amber-500">
											{manager.opponentLuckLosses} opp luck ({manager.fpLostToOpponentLuck.toFixed(1)} FP)
										</span>
									{/if}
									{#if manager.selfInflictedLosses > 0}
										<span class="font-mono text-orange-500">
											{manager.selfInflictedLosses} self-inflicted
										</span>
									{/if}
									{#if manager.fairLosses > 0}
										<span class="font-mono text-muted-foreground">
											{manager.fairLosses} fair
										</span>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Lucky/Unlucky highlights -->
						{#if manager.luckyWins > 0 || manager.unluckyLosses > 0 || manager.luckyDraws > 0 || manager.unluckyDraws > 0}
							<div class="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-border">
								{#if manager.luckyWins > 0}
									<div class="flex items-center gap-1.5">
										<Trophy class="w-4 h-4 text-green-500" />
										<span class="font-mono text-xs text-muted-foreground">
											{manager.luckyWins} lucky win{manager.luckyWins > 1 ? 's' : ''}
										</span>
									</div>
								{/if}
								{#if manager.luckyDraws > 0}
									<div class="flex items-center gap-1.5">
										<Scale class="w-4 h-4 text-green-400" />
										<span class="font-mono text-xs text-muted-foreground">
											{manager.luckyDraws} lucky draw{manager.luckyDraws > 1 ? 's' : ''}
										</span>
									</div>
								{/if}
								{#if manager.unluckyLosses > 0}
									<div class="flex items-center gap-1.5">
										<Frown class="w-4 h-4 text-red-500" />
										<span class="font-mono text-xs text-muted-foreground">
											{manager.unluckyLosses} unlucky loss{manager.unluckyLosses > 1 ? 'es' : ''}
										</span>
									</div>
								{/if}
								{#if manager.unluckyDraws > 0}
									<div class="flex items-center gap-1.5">
										<Scale class="w-4 h-4 text-red-400" />
										<span class="font-mono text-xs text-muted-foreground">
											{manager.unluckyDraws} unlucky draw{manager.unluckyDraws > 1 ? 's' : ''}
										</span>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
