<script lang="ts">
	import { onMount } from 'svelte';

	interface RunPoint {
		runNumber: number;
		value: number;
		runIndex: number;
		isOutlier?: boolean;
		isBest?: boolean;
		isWorst?: boolean;
	}

	interface DistributionStats {
		mean: number;
		median: number;
		stdDev: number;
		min: number;
		max: number;
		range: number;
		consistency: number; // 0-100 score based on CV
	}

	interface Props {
		runs: Array<{
			run_number?: number;
			gate_runs?: {
				reaction_time_ms?: number | null;
				max_g?: number | null;
				peak_speed_ms?: number | null;
			};
			elapsed_time_ms?: number | null;
		}>;
		metric?: 'reaction' | 'speed' | 'gforce' | 'elapsed';
		height?: string;
		compact?: boolean;
	}

	let {
		runs = [],
		metric = $bindable('reaction'),
		height = 'h-64',
		compact = false
	}: Props = $props();

	let chartCanvas = $state<HTMLCanvasElement>();
	let chart: any = null;
	let renderGeneration = 0;

	// Metric configuration
	const metricConfig = {
		reaction: {
			label: 'Reaction Time',
			unit: 's',
			getValue: (run: any) =>
				run.gate_runs?.reaction_time_ms ? run.gate_runs.reaction_time_ms / 1000 : null,
			color: '#f5a623',
			decimals: 3,
			lowerIsBetter: true
		},
		speed: {
			label: 'Peak Speed',
			unit: 'km/h',
			getValue: (run: any) =>
				run.gate_runs?.peak_speed_ms ? run.gate_runs.peak_speed_ms * 3.6 : null,
			color: '#ff6b3d',
			decimals: 1,
			lowerIsBetter: false
		},
		gforce: {
			label: 'Max G-Force',
			unit: 'G',
			getValue: (run: any) => run.gate_runs?.max_g ?? null,
			color: '#3de8c8',
			decimals: 2,
			lowerIsBetter: false
		},
		elapsed: {
			label: 'Elapsed Time',
			unit: 's',
			getValue: (run: any) => (run.elapsed_time_ms ? run.elapsed_time_ms / 1000 : null),
			color: '#9b87f5',
			decimals: 2,
			lowerIsBetter: true
		}
	};

	// Extract data points
	let dataPoints = $derived.by((): RunPoint[] => {
		const config = metricConfig[metric];
		return runs
			.map((run, idx) => ({
				runNumber: run.run_number ?? idx + 1,
				value: config.getValue(run),
				runIndex: idx
			}))
			.filter((p): p is RunPoint => p.value !== null);
	});

	// Calculate statistics
	let stats = $derived.by((): DistributionStats | null => {
		if (dataPoints.length === 0) return null;

		const values = dataPoints.map((p) => p.value);
		const sorted = [...values].sort((a, b) => a - b);

		const mean = values.reduce((a, b) => a + b, 0) / values.length;
		const median =
			sorted.length % 2 === 0
				? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
				: sorted[Math.floor(sorted.length / 2)];

		const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
		const stdDev = Math.sqrt(variance);

		const min = Math.min(...values);
		const max = Math.max(...values);
		const range = max - min;

		// Consistency score: 100 - (CV * 100), capped at 0-100
		const cv = mean !== 0 ? stdDev / mean : 0;
		const consistency = Math.max(0, Math.min(100, 100 - cv * 100));

		return { mean, median, stdDev, min, max, range, consistency };
	});

	// Identify outliers, best, worst
	let annotatedPoints = $derived.by((): RunPoint[] => {
		if (!stats) return dataPoints;

		const config = metricConfig[metric];
		const threshold = stats.mean + 2 * stats.stdDev;
		const thresholdLow = stats.mean - 2 * stats.stdDev;

		return dataPoints.map((p) => ({
			...p,
			isOutlier: p.value > threshold || p.value < thresholdLow,
			isBest: config.lowerIsBetter ? p.value === stats.min : p.value === stats.max,
			isWorst: config.lowerIsBetter ? p.value === stats.max : p.value === stats.min
		}));
	});

	// Trend analysis
	let trend = $derived.by((): 'improving' | 'declining' | 'stable' => {
		if (dataPoints.length < 3) return 'stable';

		const config = metricConfig[metric];
		const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
		const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

		const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
		const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

		const diff = Math.abs(secondAvg - firstAvg);
		const threshold = stats ? stats.stdDev * 0.5 : 0;

		if (diff < threshold) return 'stable';

		if (config.lowerIsBetter) {
			return secondAvg < firstAvg ? 'improving' : 'declining';
		} else {
			return secondAvg > firstAvg ? 'improving' : 'declining';
		}
	});

	async function renderChart() {
		const cssVars = getComputedStyle(document.documentElement);
		const themeGrid = cssVars.getPropertyValue('--theme-border').trim() || '#221c18';
		const themeTick = cssVars.getPropertyValue('--theme-text-secondary').trim() || '#9a8f7a';
		const themeSurface = cssVars.getPropertyValue('--theme-surface').trim() || '#131010';
		const themeText = cssVars.getPropertyValue('--theme-text-primary').trim() || '#f0ece4';
		if (!chartCanvas || annotatedPoints.length === 0) return;

		const myGeneration = ++renderGeneration;
		const { Chart, registerables } = await import('chart.js');
		// onMount and the reactive $effect below can both call renderChart()
		// around the same tick; without this guard both survive their await
		// and race to create a Chart on the same canvas, which throws
		// "Canvas is already in use". Only the latest call proceeds.
		if (myGeneration !== renderGeneration) return;
		Chart.register(...registerables);

		if (chart) {
			chart.destroy();
			chart = null;
		}

		const config = metricConfig[metric];
		const labels = annotatedPoints.map((p) => `Run ${p.runNumber}`);

		// Create datasets with color coding
		const pointColors = annotatedPoints.map((p) => {
			if (p.isBest) return '#3de8c8'; // Teal for best
			if (p.isWorst) return '#ff4444'; // Red for worst
			if (p.isOutlier) return '#ffcc44'; // Yellow for outlier
			return config.color;
		});

		const pointSizes = annotatedPoints.map((p) => {
			if (p.isBest || p.isWorst) return 8;
			if (p.isOutlier) return 6;
			return 5;
		});

		chart = new Chart(chartCanvas, {
			type: 'scatter',
			data: {
				labels,
				datasets: [
					{
						label: config.label,
						data: annotatedPoints.map((p, i) => ({ x: i, y: p.value })),
						backgroundColor: pointColors,
						borderColor: pointColors,
						borderWidth: 2,
						pointRadius: pointSizes,
						pointHoverRadius: pointSizes.map((s) => s + 2)
					},
					// Mean line
					{
						label: 'Average',
						data: annotatedPoints.map((_, i) => ({ x: i, y: stats?.mean ?? 0 })),
						borderColor: config.color,
						borderWidth: 2,
						borderDash: [5, 5],
						pointRadius: 0,
						type: 'line',
						fill: false
					},
					// +1 StdDev
					{
						label: '+1σ',
						data: annotatedPoints.map((_, i) => ({
							x: i,
							y: (stats?.mean ?? 0) + (stats?.stdDev ?? 0)
						})),
						borderColor: `${config.color}40`,
						borderWidth: 1,
						borderDash: [2, 2],
						pointRadius: 0,
						type: 'line',
						fill: false
					},
					// -1 StdDev
					{
						label: '-1σ',
						data: annotatedPoints.map((_, i) => ({
							x: i,
							y: (stats?.mean ?? 0) - (stats?.stdDev ?? 0)
						})),
						borderColor: `${config.color}40`,
						borderWidth: 1,
						borderDash: [2, 2],
						pointRadius: 0,
						type: 'line',
						fill: false
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'point',
					intersect: true
				},
				plugins: {
					legend: {
						display: !compact,
						position: 'top',
						labels: {
							color: themeTick,
							font: { size: 10, family: 'Inter, system-ui, sans-serif' },
							boxWidth: 10,
							padding: 8,
							filter: (item) => item.text === config.label || item.text === 'Average'
						}
					},
					tooltip: {
						backgroundColor: themeSurface,
						titleColor: themeText,
						bodyColor: themeTick,
						borderColor: themeGrid,
						borderWidth: 1,
						padding: 10,
						callbacks: {
							title: (items: any) => {
								const idx = items[0].dataIndex;
								return labels[idx];
							},
							label: (context: any) => {
								if (context.datasetIndex !== 0) return '';
								const value = context.parsed.y.toFixed(config.decimals);
								const point = annotatedPoints[context.dataIndex];
								let badge = '';
								if (point.isBest) badge = ' ⭐ BEST';
								if (point.isWorst) badge = ' ⚠ WORST';
								if (point.isOutlier && !point.isBest && !point.isWorst) badge = ' 📊 OUTLIER';
								return `${config.label}: ${value}${config.unit}${badge}`;
							}
						}
					}
				},
				scales: {
					x: {
						type: 'linear',
						title: {
							display: !compact,
							text: 'Run Sequence',
							color: themeTick,
							font: { size: 11, family: 'Inter, system-ui, sans-serif' }
						},
						ticks: {
							color: themeTick,
							font: { size: 10 },
							callback: (val: any) => `R${annotatedPoints[val]?.runNumber ?? val + 1}`
						},
						grid: { color: themeGrid }
					},
					y: {
						title: {
							display: !compact,
							text: `${config.label} (${config.unit})`,
							color: themeTick,
							font: { size: 11, family: 'Inter, system-ui, sans-serif' }
						},
						ticks: {
							color: themeTick,
							font: { size: 10 }
						},
						grid: { color: themeGrid }
					}
				}
			}
		});
	}

	onMount(() => {
		renderChart();
		return () => {
			if (chart) chart.destroy();
		};
	});

	$effect(() => {
		annotatedPoints; // Track dependency
		metric; // Track metric changes
		if (chartCanvas) {
			setTimeout(() => renderChart(), 0);
		}
	});

	function fmt(n: number | null | undefined, dec: number = 2) {
		return n !== null && n !== undefined ? n.toFixed(dec) : '—';
	}

	function scoreColor(score: number) {
		if (score >= 85) return '#3de8c8';
		if (score >= 70) return '#f5a623';
		if (score >= 55) return '#ffcc44';
		return '#ff4444';
	}
</script>

<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
	<!-- Header with metric selector -->
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h3 class="text-sm font-semibold text-[#f0ece4]">📊 Performance Distribution</h3>
			<p class="mt-0.5 text-xs text-[#6b5f4d]">
				{dataPoints.length} runs · {metricConfig[metric].label} analysis
			</p>
		</div>

		<!-- Metric selector buttons -->
		<div class="flex items-center gap-1 rounded-lg border border-[#221c18] bg-[#0a0809] p-1">
			{#each [{ value: 'reaction', label: 'Reaction', icon: '⚡' }, { value: 'speed', label: 'Speed', icon: '🚀' }, { value: 'gforce', label: 'G-Force', icon: '💪' }, { value: 'elapsed', label: 'Time', icon: '⏱️' }] as option}
				<button
					onclick={() => (metric = option.value as any)}
					class="rounded px-2 py-1.5 text-xs font-medium transition-colors
                           focus:ring-2 focus:ring-[#f5a623] focus:outline-none
                           {metric === option.value
						? 'bg-[#f5a623] text-[#0a0809]'
						: 'text-[#9a8f7a] hover:text-[#f0ece4]'}"
				>
					<span class="hidden sm:inline">{option.icon} </span>{option.label}
				</button>
			{/each}
		</div>
	</div>

	{#if dataPoints.length === 0}
		<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-6 text-center">
			<p class="text-sm text-[#6b5f4d]">
				No {metricConfig[metric].label.toLowerCase()} data available for these runs.
			</p>
		</div>
	{:else}
		<!-- Chart -->
		<div class="{height} mb-4">
			<canvas bind:this={chartCanvas}></canvas>
		</div>

		{#if stats}
			<!-- Statistics grid -->
			<div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-3">
					<p class="mb-1 text-xs text-[#6b5f4d]">Average</p>
					<p class="text-lg font-bold text-[#f0ece4]">
						{fmt(stats.mean, metricConfig[metric].decimals)}<span
							class="ml-1 text-xs text-[#9a8f7a]">{metricConfig[metric].unit}</span
						>
					</p>
				</div>

				<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-3">
					<p class="mb-1 text-xs text-[#6b5f4d]">Best</p>
					<p class="text-lg font-bold text-[#3de8c8]">
						{fmt(
							metricConfig[metric].lowerIsBetter ? stats.min : stats.max,
							metricConfig[metric].decimals
						)}<span class="ml-1 text-xs text-[#9a8f7a]">{metricConfig[metric].unit}</span>
					</p>
				</div>

				<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-3">
					<p class="mb-1 text-xs text-[#6b5f4d]">Spread</p>
					<p class="text-lg font-bold text-[#f0ece4]">
						±{fmt(stats.stdDev, metricConfig[metric].decimals)}<span
							class="ml-1 text-xs text-[#9a8f7a]">{metricConfig[metric].unit}</span
						>
					</p>
				</div>

				<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-3">
					<p class="mb-1 text-xs text-[#6b5f4d]">Consistency</p>
					<p class="text-lg font-bold" style="color: {scoreColor(stats.consistency)}">
						{Math.round(stats.consistency)}<span class="ml-1 text-xs text-[#9a8f7a]">%</span>
					</p>
				</div>
			</div>

			<!-- Insights -->
			<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
				<div class="flex items-start gap-3">
					<span class="text-2xl">
						{trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️'}
					</span>
					<div class="flex-1">
						<p class="mb-1 text-xs font-semibold text-[#f5a623]">Performance Insight</p>
						<p class="text-sm text-[#9a8f7a]">
							{#if stats.consistency >= 85}
								Your {metricConfig[metric].label.toLowerCase()} is highly consistent (±{fmt(
									stats.stdDev,
									metricConfig[metric].decimals
								)}{metricConfig[metric].unit}). This excellent repeatability provides a stable
								foundation for improvement.
							{:else if stats.consistency >= 70}
								Your {metricConfig[metric].label.toLowerCase()} shows good consistency. Focus on tightening
								the spread (±{fmt(stats.stdDev, metricConfig[metric].decimals)}{metricConfig[metric]
									.unit}) for more predictable results.
							{:else if stats.consistency >= 55}
								Your {metricConfig[metric].label.toLowerCase()} varies significantly (±{fmt(
									stats.stdDev,
									metricConfig[metric].decimals
								)}{metricConfig[metric].unit}). Work on consistent technique to reduce variation.
							{:else}
								High variation in {metricConfig[metric].label.toLowerCase()} (±{fmt(
									stats.stdDev,
									metricConfig[metric].decimals
								)}{metricConfig[metric].unit}). Focus on developing repeatable technique patterns.
							{/if}

							{#if trend === 'improving'}
								<span class="text-[#3de8c8]">
									Positive trend detected — you're improving through the session!</span
								>
							{:else if trend === 'declining'}
								<span class="text-[#ffcc44]">
									Values declining through session — may indicate fatigue.</span
								>
							{/if}
						</p>

						{#if annotatedPoints.some((p) => p.isOutlier)}
							{@const outlierCount = annotatedPoints.filter((p) => p.isOutlier).length}
							<p class="mt-2 text-xs text-[#6b5f4d] italic">
								⚠️ {outlierCount} outlier{outlierCount > 1 ? 's' : ''} detected — may indicate inconsistent
								conditions or technique variation.
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
