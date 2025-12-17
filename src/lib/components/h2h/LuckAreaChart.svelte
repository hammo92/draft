<script lang="ts">
	import { interpolateRgb } from 'd3-interpolate';
	import type { GameweekLuck } from '$lib/types/fpl';

	let {
		gameweeks = [],
		managerName = ''
	}: {
		gameweeks: GameweekLuck[];
		managerName?: string;
	} = $props();

	// Sort gameweeks chronologically and calculate cumulative luck
	const chartData = $derived.by(() => {
		const sorted = [...gameweeks].sort((a, b) => a.gameweek - b.gameweek);
		let cumulative = 0;
		return sorted.map(gw => {
			cumulative += gw.luck;
			return {
				...gw,
				cumulativeLuck: Math.round(cumulative * 10) / 10
			};
		});
	});

	// Get min/max for Y axis
	const yExtent = $derived.by(() => {
		const values = chartData.map(d => d.cumulativeLuck);
		const min = Math.min(0, ...values);
		const max = Math.max(0, ...values);
		const padding = Math.max(Math.abs(max - min) * 0.1, 5);
		return { min: min - padding, max: max + padding };
	});

	// Final cumulative value determines area color
	const finalLuck = $derived.by(() => {
		return chartData.length > 0 ? chartData[chartData.length - 1].cumulativeLuck : 0;
	});

	// Color based on final value
	function getAreaColor(): string {
		if (finalLuck > 0) {
			return 'rgba(34, 197, 94, 0.3)'; // green
		} else if (finalLuck < 0) {
			return 'rgba(239, 68, 68, 0.3)'; // red
		}
		return 'rgba(160, 160, 160, 0.3)'; // gray
	}

	function getLineColor(): string {
		if (finalLuck > 0) return '#22c55e';
		if (finalLuck < 0) return '#ef4444';
		return '#a0a0a0';
	}

	// SVG path helpers
	const width = 300;
	const height = 150;
	const padding = { top: 20, right: 20, bottom: 30, left: 40 };
	const chartWidth = width - padding.left - padding.right;
	const chartHeight = height - padding.top - padding.bottom;

	function xScale(gw: number): number {
		if (chartData.length <= 1) return padding.left;
		const minGw = chartData[0].gameweek;
		const maxGw = chartData[chartData.length - 1].gameweek;
		return padding.left + ((gw - minGw) / (maxGw - minGw)) * chartWidth;
	}

	function yScale(value: number): number {
		const { min, max } = yExtent;
		return padding.top + chartHeight - ((value - min) / (max - min)) * chartHeight;
	}

	// Generate area path
	const areaPath = $derived.by(() => {
		if (chartData.length === 0) return '';

		const points = chartData.map(d => `${xScale(d.gameweek)},${yScale(d.cumulativeLuck)}`);
		const baseline = chartData.map(d => `${xScale(d.gameweek)},${yScale(0)}`).reverse();

		return `M${points.join(' L')} L${baseline.join(' L')} Z`;
	});

	// Generate line path
	const linePath = $derived.by(() => {
		if (chartData.length === 0) return '';
		return 'M' + chartData.map(d => `${xScale(d.gameweek)},${yScale(d.cumulativeLuck)}`).join(' L');
	});

	// Hover state
	let hoveredIndex = $state<number | null>(null);
</script>

<div class="w-full">
	<svg {width} {height} class="w-full h-auto" viewBox="0 0 {width} {height}">
		<!-- Zero line -->
		<line
			x1={padding.left}
			y1={yScale(0)}
			x2={width - padding.right}
			y2={yScale(0)}
			stroke="currentColor"
			stroke-opacity="0.3"
			stroke-dasharray="4"
		/>

		<!-- Area -->
		<path
			d={areaPath}
			fill={getAreaColor()}
			class="transition-colors duration-300"
		/>

		<!-- Line -->
		<path
			d={linePath}
			fill="none"
			stroke={getLineColor()}
			stroke-width="2"
			class="transition-colors duration-300"
		/>

		<!-- Data points -->
		{#each chartData as point, i (point.gameweek)}
			<circle
				cx={xScale(point.gameweek)}
				cy={yScale(point.cumulativeLuck)}
				r={hoveredIndex === i ? 6 : 4}
				fill={getLineColor()}
				class="transition-all duration-150 cursor-pointer"
				role="button"
				tabindex="0"
				aria-label="GW{point.gameweek}: {point.cumulativeLuck > 0 ? '+' : ''}{point.cumulativeLuck} luck"
				onmouseenter={() => hoveredIndex = i}
				onmouseleave={() => hoveredIndex = null}
				onfocus={() => hoveredIndex = i}
				onblur={() => hoveredIndex = null}
			/>
		{/each}

		<!-- Y axis labels -->
		<text x={padding.left - 5} y={padding.top} class="text-xs fill-muted-foreground" text-anchor="end" dominant-baseline="middle">
			{yExtent.max.toFixed(0)}
		</text>
		<text x={padding.left - 5} y={yScale(0)} class="text-xs fill-muted-foreground" text-anchor="end" dominant-baseline="middle">
			0
		</text>
		<text x={padding.left - 5} y={height - padding.bottom} class="text-xs fill-muted-foreground" text-anchor="end" dominant-baseline="middle">
			{yExtent.min.toFixed(0)}
		</text>

		<!-- X axis labels (gameweeks) -->
		{#each chartData as point (point.gameweek)}
			<text
				x={xScale(point.gameweek)}
				y={height - padding.bottom + 15}
				class="text-xs fill-muted-foreground"
				text-anchor="middle"
			>
				{point.gameweek}
			</text>
		{/each}

		<!-- Axis labels -->
		<text x={width / 2} y={height - 5} class="text-xs fill-muted-foreground" text-anchor="middle">
			Gameweek
		</text>

		<!-- Tooltip -->
		{#if hoveredIndex !== null}
			{@const point = chartData[hoveredIndex]}
			<g transform="translate({xScale(point.gameweek)}, {yScale(point.cumulativeLuck) - 45})">
				<rect
					x="-50"
					y="0"
					width="100"
					height="40"
					rx="4"
					fill="var(--color-popover)"
					stroke="var(--color-border)"
					class="drop-shadow-sm"
				/>
				<text x="0" y="14" class="text-xs font-mono fill-current" text-anchor="middle">
					GW{point.gameweek}: {point.luck > 0 ? '+' : ''}{point.luck}
				</text>
				<text x="0" y="28" class="text-xs font-mono fill-muted-foreground" text-anchor="middle">
					Total: {point.cumulativeLuck > 0 ? '+' : ''}{point.cumulativeLuck}
				</text>
			</g>
		{/if}
	</svg>
</div>
