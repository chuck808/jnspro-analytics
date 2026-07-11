<script lang="ts">
	import type { DisplayChartProps } from './types';
	import {
		buildPath,
		formatValue,
		getStats,
		normaliseToPrimaryScale,
		validSeries
	} from './chartUtils';

	let {
		title,
		subtitle = '',
		unit,
		data = [],
		secondaryData = [],
		secondaryUnit = '',
		secondaryLabel = '',
		height = 220,
		compact = false,
		showStats = true
	}: DisplayChartProps = $props();

	const width = 720;
	const cleanData = $derived(validSeries(data));
	const stats = $derived(getStats(cleanData));
	const path = $derived(buildPath(cleanData, width, height ?? 220));
	const secondaryPath = $derived(
		secondaryData?.length
			? buildPath(normaliseToPrimaryScale(cleanData, secondaryData), width, height ?? 220)
			: ''
	);

	// Generate tick labels for axes
	const yTicks = $derived.by(() => {
		if (!stats) return [];
		const max = stats.max;
		const min = Math.min(0, stats.average - (max - stats.average));
		const step = (max - min) / 4;
		return [0, 1, 2, 3, 4].map((i) => ({
			value: min + step * i,
			y: (height ?? 220) - 24 - (i * ((height ?? 220) - 48)) / 4
		}));
	});

	const xTicks = $derived.by(() => {
		if (!stats) return [];
		const duration = stats.durationS;
		return [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
			value: duration * fraction,
			x: 24 + fraction * (width - 48)
		}));
	});
</script>

<section class:compact class="chart-card">
	<div class="chart-header">
		<div>
			<h3>{title}</h3>
			{#if subtitle}<p>{subtitle}</p>{/if}
		</div>
		{#if stats && showStats}
			<div class="stat-pill">Peak {formatValue(stats.max)} {unit}</div>
		{/if}
	</div>

	{#if cleanData.length < 2}
		<div class="empty-state">Not enough data to draw this chart.</div>
	{:else}
		<svg
			viewBox={`0 0 ${width} ${height ?? 220}`}
			role="img"
			aria-label={title}
			preserveAspectRatio="none"
		>
			<!-- Gradient definitions for fills -->
			<defs>
				<linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="var(--color-jns-amber, #f5a623)" stop-opacity="0.15" />
					<stop offset="100%" stop-color="var(--color-jns-amber, #f5a623)" stop-opacity="0.02" />
				</linearGradient>
				<linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="var(--color-jns-mint, #3de8c8)" stop-opacity="0.15" />
					<stop offset="100%" stop-color="var(--color-jns-mint, #3de8c8)" stop-opacity="0.02" />
				</linearGradient>
			</defs>

			<!-- Y-axis ticks and labels -->
			{#each yTicks as tick}
				<line x1="20" y1={tick.y} x2="28" y2={tick.y} class="tick" />
				<text x="16" y={tick.y + 4} class="tick-label" text-anchor="end"
					>{formatValue(tick.value, 1)}</text
				>
			{/each}

			<!-- X-axis ticks and labels -->
			{#each xTicks as tick}
				<line
					x1={tick.x}
					y1={(height ?? 220) - 20}
					x2={tick.x}
					y2={(height ?? 220) - 28}
					class="tick"
				/>
				<text x={tick.x} y={(height ?? 220) - 8} class="tick-label" text-anchor="middle"
					>{formatValue(tick.value, 1)}</text
				>
			{/each}

			<!-- Main axes -->
			<line
				x1="24"
				y1={(height ?? 220) - 24}
				x2={width - 24}
				y2={(height ?? 220) - 24}
				class="axis"
			/>
			<line x1="24" y1="24" x2="24" y2={(height ?? 220) - 24} class="axis" />

			<!-- Data area fills (below lines) -->
			{#if secondaryPath}
				<path
					d="{secondaryPath} L{width - 24},{(height ?? 220) - 24} L24,{(height ?? 220) - 24} Z"
					class="fill secondary-fill"
				/>
			{/if}
			<path
				d="{path} L{width - 24},{(height ?? 220) - 24} L24,{(height ?? 220) - 24} Z"
				class="fill primary-fill"
			/>

			<!-- Data lines (on top of fills) -->
			{#if secondaryPath}
				<path d={secondaryPath} class="line secondary" />
			{/if}
			<path d={path} class="line primary" />
		</svg>

		{#if showStats && stats}
			<div class="stats-grid">
				<div><span>Avg</span><strong>{formatValue(stats.average)} {unit}</strong></div>
				<div><span>Peak</span><strong>{formatValue(stats.max)} {unit}</strong></div>
				<div><span>Final</span><strong>{formatValue(stats.final)} {unit}</strong></div>
				<div><span>Duration</span><strong>{formatValue(stats.durationS, 2)}s</strong></div>
			</div>
		{/if}

		{#if secondaryPath && secondaryLabel}
			<p class="legend">
				<span class="legend-primary"></span>{unit}
				<span class="legend-secondary"></span>{secondaryLabel}{secondaryUnit
					? ` (${secondaryUnit})`
					: ''}
			</p>
		{/if}
	{/if}
</section>

<style>
	.chart-card {
		background: var(--theme-surface, #131010);
		border: 1px solid var(--theme-border, #221c18);
		border-radius: 0.75rem;
		padding: 1.25rem;
		color: var(--theme-text-primary, #f0ece4);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		transition: border-color 0.2s ease;
	}
	.chart-card:hover {
		border-color: var(--theme-border-hover, #2a2318);
	}
	.chart-card.compact {
		padding: 1rem;
	}
	.chart-header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
		margin-bottom: 1rem;
	}
	h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--theme-text-primary, #f0ece4);
		letter-spacing: 0.01em;
	}
	p {
		margin: 0.25rem 0 0;
		color: var(--theme-text-subtle, #9a8f7a);
		font-size: 0.75rem;
		line-height: 1.4;
	}
	.stat-pill {
		white-space: nowrap;
		background: rgba(61, 232, 200, 0.08);
		border: 1px solid rgba(61, 232, 200, 0.25);
		color: var(--color-jns-mint, #3de8c8);
		border-radius: 0.5rem;
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 600;
		box-shadow: 0 1px 2px rgba(61, 232, 200, 0.1);
	}
	svg {
		width: 100%;
		height: auto;
		min-height: 180px;
		overflow: visible;
		border-radius: 0.5rem;
	}
	.axis {
		stroke: var(--theme-border, #221c18);
		stroke-width: 1.5;
		opacity: 0.6;
	}
	.tick {
		stroke: var(--theme-border, #221c18);
		stroke-width: 1;
		opacity: 0.4;
	}
	.tick-label {
		fill: var(--theme-text-secondary, #6b5f4d);
		font-size: 9px;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}
	.line {
		fill: none;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.primary {
		stroke: var(--color-jns-amber, #f5a623);
	}
	.secondary {
		stroke: var(--color-jns-mint, #3de8c8);
		stroke-dasharray: 4 4;
		opacity: 0.8;
		stroke-width: 1;
	}
	.fill {
		stroke: none;
	}
	.primary-fill {
		fill: url(#primaryGradient);
	}
	.secondary-fill {
		fill: url(#secondaryGradient);
	}
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--theme-border, #221c18);
	}
	.stats-grid div {
		background: var(--theme-bg, #0a0809);
		border: 1px solid var(--theme-border, #221c18);
		border-radius: 0.5rem;
		padding: 0.75rem;
		min-height: 60px;
		transition: all 0.2s ease;
	}
	.stats-grid div:hover {
		background: var(--theme-bg-hover, #0f0d0b);
		border-color: var(--theme-border-hover, #2a2318);
	}
	.stats-grid span {
		display: block;
		color: var(--theme-text-secondary, #6b5f4d);
		font-size: 0.625rem;
		margin-bottom: 0.25rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
	.stats-grid strong {
		display: block;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-jns-amber, #f5a623);
		line-height: 1.2;
	}
	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--theme-text-secondary, #6b5f4d);
		border: 1px dashed var(--theme-border, #221c18);
		border-radius: 0.5rem;
		background: var(--theme-bg, #0a0809);
	}
	.legend {
		font-size: 0.75rem;
		color: var(--theme-text-subtle, #9a8f7a);
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--theme-border, #221c18);
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.legend-primary,
	.legend-secondary {
		display: inline-block;
		width: 20px;
		height: 3px;
		border-radius: 999px;
		margin: 0 0.35rem;
		vertical-align: middle;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}
	.legend-primary {
		background: var(--color-jns-amber, #f5a623);
	}
	.legend-secondary {
		background: var(--color-jns-mint, #3de8c8);
	}
	@media (max-width: 640px) {
		.chart-header {
			flex-direction: column;
			gap: 0.5rem;
		}
		.stats-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		svg {
			min-height: 160px;
		}
	}
</style>
