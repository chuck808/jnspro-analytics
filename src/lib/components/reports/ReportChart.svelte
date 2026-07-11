<script lang="ts">
	/**
	 * Simple chart component optimized for report printing
	 * Supports line, bar, and scatter chart types
	 */

	let {
		title,
		description,
		chartType,
		data = [],
		height = 180
	}: {
		title: string;
		description?: string;
		chartType: 'line' | 'bar' | 'scatter' | 'heatmap' | 'table';
		data: Array<{ x: number; y: number; label?: string }>;
		height?: number;
	} = $props();

	const width = 600;
	const padding = { top: 20, right: 30, bottom: 40, left: 50 };

	// Calculate scales
	const xExtent = $derived.by(() => {
		if (!data || data.length === 0) return [0, 1];
		const values = data.map((d) => d.x).filter((x) => typeof x === 'number' && !isNaN(x));
		if (values.length === 0) return [0, 1];
		return [Math.min(...values), Math.max(...values)];
	});

	const yExtent = $derived.by(() => {
		if (!data || data.length === 0) return [0, 1];
		const values = data.map((d) => d.y).filter((y) => typeof y === 'number' && !isNaN(y));
		if (values.length === 0) return [0, 1];
		const min = Math.min(...values);
		const max = Math.max(...values);
		// Add 10% padding
		const range = max - min || 1;
		return [Math.max(0, min - range * 0.1), max + range * 0.1];
	});

	const xScale = $derived((val: number) => {
		const [min, max] = xExtent;
		const range = max - min || 1;
		return padding.left + ((val - min) / range) * (width - padding.left - padding.right);
	});

	const yScale = $derived((val: number) => {
		const [min, max] = yExtent;
		const range = max - min || 1;
		return (
			height - padding.bottom - ((val - min) / range) * (height - padding.top - padding.bottom)
		);
	});

	// Generate path for line chart
	const linePath = $derived.by(() => {
		if (chartType !== 'line' || data.length === 0) return '';
		return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.x)} ${yScale(d.y)}`).join(' ');
	});

	// Generate axis ticks
	const yTicks = $derived.by(() => {
		const [min, max] = yExtent;
		const step = (max - min) / 4;
		return [0, 1, 2, 3, 4].map((i) => ({
			value: min + step * i,
			y: yScale(min + step * i)
		}));
	});

	const xTicks = $derived.by(() => {
		const [min, max] = xExtent;
		const step = (max - min) / 4;
		return [0, 1, 2, 3, 4].map((i) => ({
			value: min + step * i,
			x: xScale(min + step * i)
		}));
	});

	function formatNumber(val: number): string {
		if (Math.abs(val) < 0.01 && val !== 0) return val.toExponential(1);
		if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'k';
		if (Math.abs(val) >= 100) return val.toFixed(0);
		if (Math.abs(val) >= 1) return val.toFixed(1);
		return val.toFixed(2);
	}
</script>

<div class="report-chart">
	<div class="chart-header">
		<p class="chart-title">{title}</p>
		{#if description}
			<p class="chart-description">{description}</p>
		{/if}
	</div>

	{#if !data || data.length === 0}
		<div class="empty-state">
			<p>No data available for this chart ({data ? data.length : 'undefined'} points)</p>
		</div>
	{:else}
		<svg viewBox="0 0 {width} {height}" class="chart-svg">
			<!-- Grid lines -->
			<g class="grid">
				{#each yTicks as tick}
					<line
						x1={padding.left}
						y1={tick.y}
						x2={width - padding.right}
						y2={tick.y}
						class="grid-line"
					/>
				{/each}
			</g>

			<!-- Axes -->
			<line
				x1={padding.left}
				y1={height - padding.bottom}
				x2={width - padding.right}
				y2={height - padding.bottom}
				class="axis"
			/>
			<line
				x1={padding.left}
				y1={padding.top}
				x2={padding.left}
				y2={height - padding.bottom}
				class="axis"
			/>

			<!-- Y-axis labels -->
			{#each yTicks as tick}
				<text x={padding.left - 8} y={tick.y + 3} class="axis-label" text-anchor="end">
					{formatNumber(tick.value)}
				</text>
			{/each}

			<!-- X-axis labels -->
			{#each xTicks as tick, i}
				<text x={tick.x} y={height - padding.bottom + 20} class="axis-label" text-anchor="middle">
					{i === 0 || i === xTicks.length - 1 ? formatNumber(tick.value) : ''}
				</text>
			{/each}

			<!-- Chart content -->
			{#if chartType === 'line'}
				<!-- Line path -->
				<path d={linePath} class="line-path" />
				<!-- Data points -->
				{#each data as point}
					<circle cx={xScale(point.x)} cy={yScale(point.y)} r="2.5" class="data-point" />
				{/each}
			{:else if chartType === 'bar'}
				<!-- Bars -->
				{#each data as point}
					{@const barWidth = ((width - padding.left - padding.right) / data.length) * 0.7}
					{@const barX = xScale(point.x) - barWidth / 2}
					{@const barHeight = yScale(yExtent[0]) - yScale(point.y)}
					<rect x={barX} y={yScale(point.y)} width={barWidth} height={barHeight} class="bar" />
				{/each}
			{:else if chartType === 'scatter'}
				<!-- Scatter points -->
				{#each data as point}
					<circle cx={xScale(point.x)} cy={yScale(point.y)} r="3" class="scatter-point" />
				{/each}
			{/if}
		</svg>
	{/if}
</div>

<style>
	.report-chart {
		background: #faf8f5;
		border: 1px solid #ede8e0;
		border-radius: 8px;
		padding: 16px;
		margin: 12px 0;
	}

	.chart-header {
		margin-bottom: 12px;
	}

	.chart-title {
		font-size: 12px;
		font-weight: 600;
		color: #1a1410;
		margin: 0 0 4px 0;
	}

	.chart-description {
		font-size: 10px;
		color: #6b5f4d;
		margin: 0;
		line-height: 1.4;
	}

	.chart-svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.grid-line {
		stroke: #ede8e0;
		stroke-width: 1;
		stroke-dasharray: 2, 3;
	}

	.axis {
		stroke: #9a8f7a;
		stroke-width: 1.5;
	}

	.axis-label {
		fill: #6b5f4d;
		font-size: 9px;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.line-path {
		fill: none;
		stroke: #f5a623;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.data-point {
		fill: #f5a623;
		stroke: #fff;
		stroke-width: 1;
	}

	.bar {
		fill: #f5a623;
		stroke: none;
	}

	.bar:hover {
		fill: #c97e0a;
	}

	.scatter-point {
		fill: #f5a623;
		stroke: #fff;
		stroke-width: 1.5;
		opacity: 0.8;
	}

	.empty-state {
		padding: 40px 20px;
		text-align: center;
		background: #f9f7f4;
		border: 1px dashed #ede8e0;
		border-radius: 6px;
	}

	.empty-state p {
		font-size: 11px;
		color: #9a8f7a;
		margin: 0;
	}

	/* Print optimizations */
	@media print {
		.report-chart {
			break-inside: avoid;
			page-break-inside: avoid;
		}
	}
</style>
