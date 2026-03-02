<script lang="ts">
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

	const average = $derived(
		chartData.length > 0
			? chartData.reduce((sum, d) => sum + d.points, 0) / chartData.length
			: 0
	);

	// Terminal-style colors - cyan gradient based on performance
	function getLineColor(avg: number): string {
		if (avg >= 55) return '#00ff88'; // success green
		if (avg >= 45) return '#00d4ff'; // accent cyan
		if (avg >= 35) return '#ffaa00'; // warning amber
		return '#ff4455'; // destructive red
	}

	function getAreaColor(avg: number): string {
		if (avg >= 55) return 'rgba(0, 255, 136, 0.15)';
		if (avg >= 45) return 'rgba(0, 212, 255, 0.15)';
		if (avg >= 35) return 'rgba(255, 170, 0, 0.15)';
		return 'rgba(255, 68, 85, 0.15)';
	}

	function getGlowFilter(avg: number): string {
		if (avg >= 55) return 'drop-shadow(0 0 6px rgba(0, 255, 136, 0.7)) drop-shadow(0 0 12px rgba(0, 255, 136, 0.3))';
		if (avg >= 45) return 'drop-shadow(0 0 6px rgba(0, 212, 255, 0.7)) drop-shadow(0 0 12px rgba(0, 212, 255, 0.3))';
		if (avg >= 35) return 'drop-shadow(0 0 6px rgba(255, 170, 0, 0.7)) drop-shadow(0 0 12px rgba(255, 170, 0, 0.3))';
		return 'drop-shadow(0 0 6px rgba(255, 68, 85, 0.7)) drop-shadow(0 0 12px rgba(255, 68, 85, 0.3))';
	}

	// SVG dimensions - more compact for terminal style
	const width = 200;
	const padding = { top: 8, right: 12, bottom: 20, left: 28 };
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

	const areaPath = $derived.by(() => {
		if (chartData.length === 0) return '';
		const points = chartData.map((d, i) => `${xScale(i)},${yScale(d.points)}`);
		const baseline = chartData.map((_, i) => `${xScale(i)},${yScale(yExtent.min)}`).reverse();
		return `M${points.join(' L')} L${baseline.join(' L')} Z`;
	});

	const linePath = $derived.by(() => {
		if (chartData.length === 0) return '';
		return 'M' + chartData.map((d, i) => `${xScale(i)},${yScale(d.points)}`).join(' L');
	});

	let hoveredIndex = $state<number | null>(null);
</script>

<div class="w-full">
	<svg {width} {height} class="w-full h-auto" viewBox="0 0 {width} {height}">
		<!-- Grid lines -->
		{#each [0.25, 0.5, 0.75] as ratio}
			<line
				x1={padding.left}
				y1={padding.top + chartHeight * ratio}
				x2={width - padding.right}
				y2={padding.top + chartHeight * ratio}
				stroke="var(--color-border)"
				stroke-opacity="0.3"
				stroke-width="1"
			/>
		{/each}

		<!-- Average line -->
		<line
			x1={padding.left}
			y1={yScale(average)}
			x2={width - padding.right}
			y2={yScale(average)}
			stroke={getLineColor(average)}
			stroke-opacity="0.6"
			stroke-dasharray="4 4"
			stroke-width="1.5"
		/>

		<!-- Area fill -->
		<path
			d={areaPath}
			fill={getAreaColor(average)}
			class="transition-colors duration-300"
		/>

		<!-- Line with glow -->
		<path
			d={linePath}
			fill="none"
			stroke={getLineColor(average)}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="transition-colors duration-300"
			style="filter: {getGlowFilter(average)}"
		/>

		<!-- Data points -->
		{#each chartData as point, i (point.gw)}
			<circle
				cx={xScale(i)}
				cy={yScale(point.points)}
				r={hoveredIndex === i ? 5 : 3}
				fill={hoveredIndex === i ? getLineColor(average) : 'var(--color-card)'}
				stroke={getLineColor(average)}
				stroke-width="1.5"
				class="transition-all duration-100 cursor-pointer"
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
		<text x={padding.left - 4} y={padding.top + 4} class="text-[10px] fill-muted-foreground font-mono tabular" text-anchor="end">
			{Math.round(yExtent.max)}
		</text>
		<text x={padding.left - 4} y={height - padding.bottom - 2} class="text-[10px] fill-muted-foreground font-mono tabular" text-anchor="end">
			{Math.round(yExtent.min)}
		</text>

		<!-- X axis labels (gameweeks) - only show first and last -->
		{#if chartData.length > 0}
			<text
				x={xScale(0)}
				y={height - 4}
				class="text-[9px] fill-muted-foreground font-mono"
				text-anchor="middle"
			>
				GW{chartData[0].gw}
			</text>
			{#if chartData.length > 1}
				<text
					x={xScale(chartData.length - 1)}
					y={height - 4}
					class="text-[9px] fill-muted-foreground font-mono"
					text-anchor="middle"
				>
				GW{chartData[chartData.length - 1].gw}
				</text>
			{/if}
		{/if}

		<!-- Tooltip -->
		{#if hoveredIndex !== null}
			{@const point = chartData[hoveredIndex]}
			<g transform="translate({xScale(hoveredIndex)}, {Math.max(yScale(point.points) - 28, 10)})">
				<rect
					x="-20"
					y="0"
					width="40"
					height="20"
					rx="2"
					fill="var(--color-elevated)"
					stroke={getLineColor(average)}
					stroke-width="1"
				/>
				<text x="0" y="14" class="text-[10px] font-bold" fill={getLineColor(average)} text-anchor="middle">
					{point.points}
				</text>
			</g>
		{/if}
	</svg>
</div>
