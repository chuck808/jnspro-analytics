<script lang="ts">
	import { onMount } from 'svelte';

	interface ConsistencyData {
		sessionDate: string;
		sessionNumber: number;
		repeatabilityScore: number | null;
		cvPercent: number | null;
		bestVsAvgGap: number | null;
	}

	interface Props {
		data: ConsistencyData[];
		isMobile?: boolean;
	}

	let { data, isMobile = false }: Props = $props();

	let chartCanvas: HTMLCanvasElement;
	let chart: any = null;

	// Calculate improvements
	let improvements = $derived.by(() => {
		if (data.length < 2) return null;

		const first = data[0];
		const last = data[data.length - 1];

		return {
			repeatability:
				first.repeatabilityScore && last.repeatabilityScore
					? ((last.repeatabilityScore - first.repeatabilityScore) / first.repeatabilityScore) * 100
					: null,
			cv:
				first.cvPercent && last.cvPercent
					? ((first.cvPercent - last.cvPercent) / first.cvPercent) * 100 // Lower is better
					: null,
			bestVsAvgGap:
				first.bestVsAvgGap && last.bestVsAvgGap
					? ((first.bestVsAvgGap - last.bestVsAvgGap) / first.bestVsAvgGap) * 100 // Lower is better
					: null
		};
	});

	onMount(() => {
		(async () => {
			const Chart = (await import('chart.js/auto')).default;

			if (chartCanvas) {
				const ctx = chartCanvas.getContext('2d');
				if (ctx) {
					chart = new Chart(ctx, {
						type: 'line',
						data: {
							labels: data.map((d) => d.sessionDate),
							datasets: [
								{
									label: 'Repeatability Score',
									data: data.map((d) => d.repeatabilityScore),
									borderColor: '#3de8c8',
									backgroundColor: '#3de8c820',
									borderWidth: 2,
									tension: 0.3,
									yAxisID: 'y'
								},
								{
									label: 'CV %',
									data: data.map((d) => d.cvPercent),
									borderColor: '#f5a623',
									backgroundColor: '#f5a62320',
									borderWidth: 2,
									tension: 0.3,
									yAxisID: 'y1'
								},
								{
									label: 'Best vs Avg Gap %',
									data: data.map((d) => d.bestVsAvgGap),
									borderColor: '#ff6b3d',
									backgroundColor: '#ff6b3d20',
									borderWidth: 2,
									tension: 0.3,
									yAxisID: 'y1'
								}
							]
						},
						options: {
							responsive: true,
							maintainAspectRatio: false,
							interaction: {
								mode: 'index',
								intersect: false
							},
							plugins: {
								legend: {
									display: true,
									position: 'bottom',
									labels: {
										color: '#999',
										usePointStyle: true,
										padding: 15
									}
								},
								tooltip: {
									backgroundColor: 'rgba(0, 0, 0, 0.8)',
									padding: 12,
									titleColor: '#3de8c8',
									bodyColor: '#ffffff'
								}
							},
							scales: {
								y: {
									type: 'linear',
									display: true,
									position: 'left',
									title: {
										display: true,
										text: 'Repeatability Score',
										color: '#3de8c8'
									},
									ticks: {
										color: '#999'
									},
									grid: {
										color: 'rgba(255, 255, 255, 0.1)'
									}
								},
								y1: {
									type: 'linear',
									display: true,
									position: 'right',
									title: {
										display: true,
										text: 'CV % / Gap %',
										color: '#f5a623'
									},
									ticks: {
										color: '#999'
									},
									grid: {
										drawOnChartArea: false
									}
								},
								x: {
									ticks: {
										color: '#999',
										maxRotation: 45,
										minRotation: 45
									},
									grid: {
										display: false
									}
								}
							}
						}
					});
				}
			}
		})();

		return () => {
			if (chart) chart.destroy();
		};
	});
</script>

<div class="themed-card rounded-xl p-5">
	<div class="mb-4">
		<h3 class="themed-text-primary mb-2 text-base font-bold">Consistency Trends</h3>
		<p class="themed-text-subtle text-xs">
			Track improvements in repeatability and run-to-run consistency
		</p>
	</div>

	<!-- Chart -->
	<div class="relative mb-4" style="height: {isMobile ? '300px' : '350px'};">
		<canvas bind:this={chartCanvas}></canvas>
	</div>

	<!-- Improvement Summary -->
	{#if improvements && data.length >= 3}
		<div class="themed-nested-card grid grid-cols-3 gap-3 rounded-lg p-4">
			<div class="text-center">
				<p class="themed-text-subtle mb-1 text-xs">Repeatability</p>
				{#if improvements.repeatability !== null}
					<p
						class="text-lg font-bold"
						style="color: {improvements.repeatability > 0 ? '#3de8c8' : '#ff6b3d'};"
					>
						{improvements.repeatability > 0 ? '+' : ''}{improvements.repeatability.toFixed(1)}%
					</p>
				{:else}
					<p class="themed-text-subtle text-sm">—</p>
				{/if}
			</div>

			<div class="text-center">
				<p class="themed-text-subtle mb-1 text-xs">CV Improvement</p>
				{#if improvements.cv !== null}
					<p
						class="text-lg font-bold"
						style="color: {improvements.cv > 0 ? '#3de8c8' : '#ff6b3d'};"
					>
						{improvements.cv > 0 ? '+' : ''}{improvements.cv.toFixed(1)}%
					</p>
				{:else}
					<p class="themed-text-subtle text-sm">—</p>
				{/if}
			</div>

			<div class="text-center">
				<p class="themed-text-subtle mb-1 text-xs">Gap Reduction</p>
				{#if improvements.bestVsAvgGap !== null}
					<p
						class="text-lg font-bold"
						style="color: {improvements.bestVsAvgGap > 0 ? '#3de8c8' : '#ff6b3d'};"
					>
						{improvements.bestVsAvgGap > 0 ? '+' : ''}{improvements.bestVsAvgGap.toFixed(1)}%
					</p>
				{:else}
					<p class="themed-text-subtle text-sm">—</p>
				{/if}
			</div>
		</div>

		<div class="themed-text-subtle mt-3 text-center text-xs">
			📈 Changes from first to most recent session
		</div>
	{/if}
</div>
