<script lang="ts">
	import { onMount } from 'svelte';
	import type { Chart as ChartType } from 'chart.js';

	interface Point {
		runNumber: number;
		value: number | null;
	}

	interface Props {
		label: string;
		unit: string;
		points: Point[];
		color: string;
		decimals?: number;
		highlightRunNumber?: number | null;
	}

	let { label, unit, points, color, decimals = 2, highlightRunNumber = null }: Props = $props();

	let chartEl: HTMLCanvasElement | null = $state(null);
	let chartInstance: ChartType | null = $state(null);

	const HIGHLIGHT_COLOR = '#f5a623'; // established "achievement gold" used for milestones elsewhere

	async function renderChart() {
		if (!chartEl || points.length === 0) return;

		const { Chart, registerables } = await import('chart.js');
		Chart.register(...registerables);

		if (chartInstance) {
			chartInstance.destroy();
		}

		const labels = points.map((p) => `Run ${p.runNumber}`);
		const values = points.map((p) => p.value);
		const isHighlighted = points.map((p) => p.runNumber === highlightRunNumber);

		const style = getComputedStyle(document.documentElement);
		const themeGrid = style.getPropertyValue('--theme-border').trim() || '#221c18';
		const themeTick = style.getPropertyValue('--theme-text-secondary').trim() || '#9a8f7a';
		const themeSurface = style.getPropertyValue('--theme-surface').trim() || '#131010';
		const themeText = style.getPropertyValue('--theme-text-primary').trim() || '#f0ece4';
		const themeBg = style.getPropertyValue('--theme-bg').trim() || '#0a0809';

		chartInstance = new Chart(chartEl, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label,
						data: values,
						borderColor: color,
						backgroundColor: `${color}20`,
						borderWidth: 2,
						fill: true,
						tension: 0.3,
						pointRadius: isHighlighted.map((h) => (h ? 6 : 3)),
						pointHoverRadius: isHighlighted.map((h) => (h ? 8 : 5)),
						pointBackgroundColor: isHighlighted.map((h) => (h ? HIGHLIGHT_COLOR : color)),
						pointBorderColor: isHighlighted.map(() => themeBg),
						pointBorderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: {
						backgroundColor: themeSurface,
						titleColor: themeText,
						bodyColor: themeTick,
						borderColor: themeGrid,
						borderWidth: 1,
						padding: 10,
						displayColors: false,
						callbacks: {
							label: (context) => {
								const val = context.parsed.y;
								return val !== null ? `${label}: ${val.toFixed(decimals)}${unit}` : 'No data';
							}
						}
					}
				},
				scales: {
					x: {
						grid: { display: false },
						ticks: { color: themeTick, font: { size: 9 }, maxRotation: 0 }
					},
					y: {
						grid: { color: themeGrid },
						ticks: {
							color: themeTick,
							font: { size: 9 },
							callback: (val) => `${val}${unit}`
						}
					}
				}
			}
		});
	}

	$effect(() => {
		points;
		highlightRunNumber;
		renderChart();
	});

	onMount(() => {
		return () => {
			if (chartInstance) chartInstance.destroy();
		};
	});
</script>

<div class="metric-progression-chart">
	<p class="metric-progression-chart__label themed-text-subtle">{label}</p>
	<div class="metric-progression-chart__canvas">
		<canvas bind:this={chartEl}></canvas>
	</div>
</div>

<style>
	.metric-progression-chart {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.metric-progression-chart__label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.metric-progression-chart__canvas {
		height: 170px;
		position: relative;
	}
</style>
