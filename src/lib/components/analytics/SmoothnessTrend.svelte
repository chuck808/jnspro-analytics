<script lang="ts">
	/**
	 * Smoothness / Jerk Trend Component
	 * Shows force application quality over time
	 */

	interface SmoothnessDataPoint {
		sessionDate: string;
		sessionNumber: number;
		smoothnessScore: number | null;
		meanJerk: number | null;
	}

	interface Props {
		data: SmoothnessDataPoint[];
		isMobile?: boolean;
	}

	let { data, isMobile = false }: Props = $props();

	let chartCanvas: HTMLCanvasElement | null = $state(null);

	// Smoothness trend
	let trend = $derived.by(() => {
		const valid = data.filter((d) => d.smoothnessScore !== null);
		if (valid.length < 2) return null;

		const first = valid.slice(0, Math.min(3, valid.length));
		const last = valid.slice(-Math.min(3, valid.length));

		const firstAvg = first.reduce((a, b) => a + b.smoothnessScore!, 0) / first.length;
		const lastAvg = last.reduce((a, b) => a + b.smoothnessScore!, 0) / last.length;

		const change = lastAvg - firstAvg;

		return {
			direction: change > 5 ? 'smoother' : change < -5 ? 'rougher' : 'stable',
			current: Math.round(lastAvg),
			change: Math.round(change)
		};
	});

	async function renderChart() {
		const cssVars = getComputedStyle(document.documentElement);
		const themeGrid = cssVars.getPropertyValue('--theme-border').trim() || '#221c18';
		const themeTick = cssVars.getPropertyValue('--theme-text-secondary').trim() || '#9a8f7a';
		const themeSubtle = cssVars.getPropertyValue('--theme-text-subtle').trim() || '#6b5f4d';
		const themeBg = cssVars.getPropertyValue('--theme-bg').trim() || '#0a0809';
		const themeSurface = cssVars.getPropertyValue('--theme-surface').trim() || '#131010';
		const themeText = cssVars.getPropertyValue('--theme-text-primary').trim() || '#f0ece4';
		if (!chartCanvas || data.length === 0) return;

		const { Chart, registerables } = await import('chart.js');
		Chart.register(...registerables);

		const labels = data.map((d) => d.sessionDate);

		new Chart(chartCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Smoothness Score',
						data: data.map((d) => d.smoothnessScore),
						borderColor: '#3de8c8',
						backgroundColor: '#3de8c820',
						borderWidth: 2,
						fill: true,
						tension: 0.3,
						pointRadius: 3,
						pointHoverRadius: 5
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						mode: 'index',
						intersect: false,
						callbacks: {
							label: (context) => {
								const score = context.parsed.y;
								if (score === null || score === undefined) return 'No data';

								let quality = 'Unknown';
								if (score >= 80) quality = 'Excellent';
								else if (score >= 60) quality = 'Good';
								else if (score >= 40) quality = 'Fair';
								else quality = 'Needs Work';

								return `Smoothness: ${score}/100 (${quality})`;
							}
						}
					}
				},
				scales: {
					x: {
						ticks: { color: themeSubtle, maxRotation: 45, font: { size: isMobile ? 9 : 10 } }
					},
					y: {
						min: 0,
						max: 100,
						ticks: { color: themeTick, font: { size: isMobile ? 9 : 10 } },
						title: { display: !isMobile, text: 'Smoothness Score', color: themeTick }
					}
				}
			}
		});
	}

	$effect(() => {
		if (chartCanvas) renderChart();
	});
</script>

<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
	<div class="mb-4 flex items-start justify-between gap-4">
		<div>
			<h3 class="text-sm font-semibold text-[#f0ece4]">Force Application Smoothness</h3>
			<p class="mt-1 text-xs text-[#6b5f4d]">How cleanly you apply power through the start</p>
		</div>
		{#if trend}
			<div class="text-right">
				<div class="text-xs text-[#6b5f4d]">Current</div>
				<div
					class="text-2xl font-bold"
					style="color:{trend.direction === 'smoother'
						? '#3de8c8'
						: trend.direction === 'rougher'
							? '#ff4444'
							: '#f5a623'}"
				>
					{trend.current}/100
				</div>
				<div
					class="text-xs {trend.direction === 'smoother'
						? 'text-[#3de8c8]'
						: trend.direction === 'rougher'
							? 'text-[#ff4444]'
							: 'text-[#9a8f7a]'}"
				>
					{trend.change > 0 ? '+' : ''}{trend.change} pts
				</div>
			</div>
		{/if}
	</div>

	<div class="h-64">
		<canvas bind:this={chartCanvas}></canvas>
	</div>

	{#if trend}
		<div class="mt-3 space-y-2">
			<p class="text-xs text-[#9a8f7a] italic">
				{#if trend.direction === 'smoother'}
					✅ Force application getting smoother — technique is refining
				{:else if trend.direction === 'rougher'}
					⚠️ More abrupt force changes — focus on smooth power delivery
				{:else}
					➡️ Smoothness stable — maintaining current technique quality
				{/if}
			</p>

			<div class="grid grid-cols-2 gap-2 text-xs">
				<div class="rounded border border-[#221c18] bg-[#0a0809] p-2">
					<div class="mb-1 text-[#6b5f4d]">What is smoothness?</div>
					<div class="text-[#9a8f7a]">Lower "jerk" = more fluid technique</div>
				</div>
				<div class="rounded border border-[#221c18] bg-[#0a0809] p-2">
					<div class="mb-1 text-[#6b5f4d]">Why it matters</div>
					<div class="text-[#9a8f7a]">Smooth = efficient, less energy wasted</div>
				</div>
			</div>
		</div>
	{/if}
</div>
