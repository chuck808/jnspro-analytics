<script lang="ts">
	import { page } from '$app/stores';
	import { buildProgressTrendEvidence } from '$lib/analytics/progressTrendEvidence';

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

	let { data: _legacyData, isMobile = false }: Props = $props();
	let chartCanvas: HTMLCanvasElement | null = $state(null);

	let data = $derived.by((): SmoothnessDataPoint[] => {
		const pageData = $page.data as any;
		return buildProgressTrendEvidence(
			(pageData.sessions ?? []).map((session: any) => ({ id: session.id, timestamp: session.timestamp })),
			pageData.sessionAnalyses ?? [],
			pageData.allRuns ?? []
		).map((point) => ({
			sessionDate: point.sessionDate,
			sessionNumber: point.sessionNumber,
			smoothnessScore: point.smoothness,
			meanJerk: null
		}));
	});

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
		const themeTick = cssVars.getPropertyValue('--theme-text-secondary').trim() || '#9a8f7a';
		const themeSubtle = cssVars.getPropertyValue('--theme-text-subtle').trim() || '#6b5f4d';
		if (!chartCanvas || data.length === 0) return;

		const { Chart, registerables } = await import('chart.js');
		Chart.register(...registerables);
		new Chart(chartCanvas, {
			type: 'line',
			data: {
				labels: data.map((d) => d.sessionDate),
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
					legend: { display: false },
					tooltip: { mode: 'index', intersect: false }
				},
				scales: {
					x: { ticks: { color: themeSubtle, maxRotation: 45, font: { size: isMobile ? 9 : 10 } } },
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

	let hasSmoothnessData = $derived(data.some((d) => d.smoothnessScore !== null));
</script>

<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
	<div class="mb-4 flex items-start justify-between gap-4">
		<div>
			<h3 class="text-sm font-semibold text-[#f0ece4]">Force Application Smoothness</h3>
			<p class="mt-1 text-xs text-[#6b5f4d]">Performance Engine smoothness score across eligible sessions</p>
		</div>
		{#if trend}
			<div class="text-right">
				<div class="text-xs text-[#6b5f4d]">Current</div>
				<div class="text-2xl font-bold" style="color:{trend.direction === 'smoother' ? '#3de8c8' : trend.direction === 'rougher' ? '#ff4444' : '#f5a623'}">
					{trend.current}/100
				</div>
				<div class="text-xs {trend.direction === 'smoother' ? 'text-[#3de8c8]' : trend.direction === 'rougher' ? 'text-[#ff4444]' : 'text-[#9a8f7a]'}">
					{trend.change > 0 ? '+' : ''}{trend.change} pts
				</div>
			</div>
		{/if}
	</div>

	{#if hasSmoothnessData}
		<div class="h-64"><canvas bind:this={chartCanvas}></canvas></div>
		{#if trend}
			<p class="mt-3 text-xs text-[#9a8f7a] italic">
				{#if trend.direction === 'smoother'}Smoothness scores are improving across the available engine evidence.
				{:else if trend.direction === 'rougher'}Smoothness scores are lower across the recent evidence; inspect fatigue and session context before treating that as persistent.
				{:else}Smoothness scores are broadly stable across the available evidence.{/if}
			</p>
		{/if}
	{:else}
		<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4 text-xs text-[#9a8f7a]">
			No trustworthy smoothness series is available yet. Repeatability is not substituted for smoothness.
		</div>
	{/if}
</div>
