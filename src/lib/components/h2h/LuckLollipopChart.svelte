<script lang="ts">
	import { interpolateRgb } from 'd3-interpolate';
	import type { ManagerLuck } from '$lib/types/fpl';

	let {
		data = [],
		useCentered = false
	}: {
		data: ManagerLuck[];
		useCentered?: boolean;
	} = $props();

	// Sort by luck value (luckiest first)
	const sortedData = $derived(
		[...data].sort((a, b) => {
			const aVal = useCentered ? a.centeredLuck : a.seasonLuck;
			const bVal = useCentered ? b.centeredLuck : b.seasonLuck;
			return bVal - aVal;
		})
	);

	// Get luck value based on mode
	function getLuckValue(manager: ManagerLuck): number {
		return useCentered ? manager.centeredLuck : manager.seasonLuck;
	}

	// Calculate domain based on actual data range
	const luckExtent = $derived.by(() => {
		const values = data.map(m => getLuckValue(m));
		const min = Math.min(...values, 0);
		const max = Math.max(...values, 0);
		// Add padding
		return {
			min: min - 5,
			max: max + 5
		};
	});

	// Layout constants
	const svgWidth = 600;
	const nameColumnWidth = 160; // Fixed space for names
	const valueLabelWidth = 60; // Space for value labels on right
	const chartWidth = svgWidth - nameColumnWidth - valueLabelWidth; // Remaining space for chart

	// Calculate zero position within the chart area based on data distribution
	const zeroX = $derived.by(() => {
		const { min, max } = luckExtent;
		const range = max - min;
		if (range === 0) return nameColumnWidth + chartWidth / 2;
		// Position zero proportionally within chart area
		const zeroRatio = (0 - min) / range;
		return nameColumnWidth + zeroRatio * chartWidth;
	});

	// Scale value to x position
	function xScale(value: number): number {
		const { min, max } = luckExtent;
		const range = max - min;
		if (range === 0) return zeroX;
		const ratio = (value - min) / range;
		return nameColumnWidth + ratio * chartWidth;
	}

	// Color interpolation: red (-) -> gray (0) -> green (+)
	function getColor(value: number): string {
		const normalized = Math.max(-1, Math.min(1, value / 50));
		if (normalized < 0) {
			return interpolateRgb('#ef4444', '#a0a0a0')(1 + normalized);
		} else {
			return interpolateRgb('#a0a0a0', '#22c55e')(normalized);
		}
	}
</script>

<div class="w-full">
	<svg class="w-full" viewBox="0 0 {svgWidth} {sortedData.length * 40 + 20}" preserveAspectRatio="xMidYMid meet">
		<!-- Zero line -->
		<line x1={zeroX} y1="10" x2={zeroX} y2={sortedData.length * 40 + 10} stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="4" />

		{#each sortedData as manager, i (manager.managerId)}
			{@const luckValue = getLuckValue(manager)}
			{@const color = getColor(luckValue)}
			{@const y = i * 40 + 30}
			{@const xEnd = xScale(luckValue)}

			<!-- Manager name -->
			<text
				x="10"
				{y}
				class="text-sm font-sans fill-foreground"
				dominant-baseline="middle"
				textLength={manager.managerName.length > 14 ? nameColumnWidth - 20 : undefined}
				lengthAdjust="spacingAndGlyphs"
			>
				{manager.managerName}
			</text>

			<!-- Line from zero to dot -->
			<line
				x1={zeroX}
				y1={y}
				x2={xEnd}
				y2={y}
				stroke={color}
				stroke-width="2"
			/>

			<!-- Dot -->
			<circle
				cx={xEnd}
				cy={y}
				r="5"
				fill={color}
			/>

			<!-- Value label - negative to left of dot, positive to right -->
			<text
				x={luckValue >= 0 ? xEnd + 12 : xEnd - 12}
				{y}
				class="text-xs font-mono font-semibold"
				fill={color}
				dominant-baseline="middle"
				text-anchor={luckValue >= 0 ? 'start' : 'end'}
			>
				{luckValue > 0 ? '+' : ''}{luckValue}
			</text>
		{/each}
	</svg>
</div>
