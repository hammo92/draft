<script lang="ts">
	import { interpolateRgb } from 'd3-interpolate';

	let {
		form = [],
		managerName = '',
		height = 120,
		fixedYMin,
		fixedYMax
	}: {
		form: number[];
		managerName?: string;
		height?: number;
		fixedYMin?: number;
		fixedYMax?: number;
	} = $props();

	// Reverse form to chronological order (oldest first)
	const chartData = $derived(
		[...form].reverse().map((points, i) => ({
			gw: form.length - i,
			points
		}))
	);

	// Get min/max for Y axis (use fixed values if provided for standardization)
	const yExtent = $derived.by(() => {
		if (fixedYMin !== undefined && fixedYMax !== undefined) {
			return { min: fixedYMin, max: fixedYMax };
		}
		if (chartData.length === 0) return { min: 0, max: 100 };
		const values = chartData.map(d => d.points);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const padding = Math.max((max - min) * 0.15, 10);
		return {
			min: Math.max(0, min - padding),
			max: max + padding
		};
	});

	// Average line value
	const average = $derived(
		chartData.length > 0
			? chartData.reduce((sum, d) => sum + d.points, 0) / chartData.length
			: 0
	);

	// Color based on average performance
	function getColor(avg: number): string {
		if (avg >= 55) return '#22c55e'; // green
		if (avg >= 45) return '#3b82f6'; // blue
		if (avg >= 35) return '#eab308'; // yellow
		return '#ef4444'; // red
	}

	function getAreaColor(avg: number): string {
		if (avg >= 55) return 'rgba(34, 197, 94, 0.3)';
		if (avg >= 45) return 'rgba(59, 130, 246, 0.3)';
		if (avg >= 35) return 'rgba(234, 179, 8, 0.3)';
		return 'rgba(239, 68, 68, 0.3)';
	}

	// SVG dimensions
	const width = 200;
	const padding = { top: 15, right: 15, bottom: 25, left: 30 };
	const chartWidth = width - padding.left - padding.right;
	const chartHeight = height - padding.top - padding.bottom;

	function xScale(index: number): number {
		if (chartData.length <= 1) return padding.left + chartWidth / 2;
		return padding.left + (index / (chartData.length - 1)) * chartWidth;
	}

	function yScale(value: number): number {
		const { min, max } = yExtent;
		if (max === min) return padding.top + chartHeight / 2;
		return padding.top + chartHeight - ((value - min) / (max - min)) * chartHeight;
	}

	// Generate area path
	const areaPath = $derived.by(() => {
		if (chartData.length === 0) return '';
		const points = chartData.map((d, i) => `${xScale(i)},${yScale(d.points)}`);
		const baseline = chartData.map((_, i) => `${xScale(i)},${yScale(yExtent.min)}`).reverse();
		return `M${points.join(' L')} L${baseline.join(' L')} Z`;
	});

	// Generate line path
	const linePath = $derived.by(() => {
		if (chartData.length === 0) return '';
		return 'M' + chartData.map((d, i) => `${xScale(i)},${yScale(d.points)}`).join(' L');
	});

	// Hover state
	let hoveredIndex = $state<number | null>(null);
</script>

<div class="w-full">
	<svg {width} {height} class="w-full h-auto" viewBox="0 0 {width} {height}">
		<!-- Average line -->
		<line
			x1={padding.left}
			y1={yScale(average)}
			x2={width - padding.right}
			y2={yScale(average)}
			stroke={getColor(average)}
			stroke-opacity="0.5"
			stroke-dasharray="4"
			stroke-width="1"
		/>

		<!-- Area -->
		<path
			d={areaPath}
			fill={getAreaColor(average)}
			class="transition-colors duration-300"
		/>

		<!-- Line -->
		<path
			d={linePath}
			fill="none"
			stroke={getColor(average)}
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="transition-colors duration-300"
		/>

		<!-- Data points -->
		{#each chartData as point, i (point.gw)}
			<circle
				cx={xScale(i)}
				cy={yScale(point.points)}
				r={hoveredIndex === i ? 6 : 4}
				fill={getColor(average)}
				class="transition-all duration-150 cursor-pointer"
				role="button"
				tabindex="0"
				aria-label="GW{point.gw}: {point.points} points"
				onmouseenter={() => hoveredIndex = i}
				onmouseleave={() => hoveredIndex = null}
				onfocus={() => hoveredIndex = i}
				onblur={() => hoveredIndex = null}
			/>
		{/each}

		<!-- Y axis labels -->
		<text x={padding.left - 5} y={padding.top + 4} class="text-[10px] fill-muted-foreground" text-anchor="end">
			{Math.round(yExtent.max)}
		</text>
		<text x={padding.left - 5} y={height - padding.bottom} class="text-[10px] fill-muted-foreground" text-anchor="end">
			{Math.round(yExtent.min)}
		</text>

		<!-- X axis labels (gameweeks) -->
		{#each chartData as point, i (point.gw)}
			<text
				x={xScale(i)}
				y={height - padding.bottom + 15}
				class="text-[10px] fill-muted-foreground"
				text-anchor="middle"
			>
				{point.gw}
			</text>
		{/each}

		<!-- Tooltip -->
		{#if hoveredIndex !== null}
			{@const point = chartData[hoveredIndex]}
			<g transform="translate({xScale(hoveredIndex)}, {yScale(point.points) - 30})">
				<rect
					x="-25"
					y="0"
					width="50"
					height="22"
					rx="4"
					fill="var(--color-popover)"
					stroke="var(--color-border)"
					class="drop-shadow-sm"
				/>
				<text x="0" y="15" class="text-xs font-mono font-bold fill-current" text-anchor="middle">
					{point.points}
				</text>
			</g>
		{/if}
	</svg>
</div>
