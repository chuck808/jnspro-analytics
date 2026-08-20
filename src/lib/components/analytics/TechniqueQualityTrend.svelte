<script lang="ts">
	import { page } from '$app/stores';
	import { buildProgressTrendEvidence } from '$lib/analytics/progressTrendEvidence';

	interface TechniqueDataPoint {
		sessionDate: string;
		sessionNumber: number;
		overall: number | null;
		reaction: number | null;
		explosiveness: number | null;
		smoothness: number | null;
		efficiency: number | null;
	}

	interface Props {
		data: TechniqueDataPoint[];
		isMobile?: boolean;
	}

	let { data: _legacyData, isMobile = false }: Props = $props();
	let chartCanvas: HTMLCanvasElement | null = $state(null);

	let data = $derived.by((): TechniqueDataPoint[] => {
		const pageData = $page.data as any;
		return buildProgressTrendEvidence(
			(pageData.sessions ?? []).map((session: any) => ({ id: session.id, timestamp: session.timestamp })),
			pageData.sessionAnalyses ?? [],
			pageData.allRuns ?? []
		).map((point) => ({
			sessionDate: point.sessionDate,
			sessionNumber: point.sessionNumber,
			overall: point.techniqueOverall,
			reaction: null,
			explosiveness: null,
			smoothness: point.smoothness,
			efficiency: null
		}));
	});

	let trend = $derived.by(() => {
		const validScores = data.filter((d) => d.overall !== null).map((d) => d.overall!);
		if (validScores.length < 2) return null;

		const first = validScores.slice(0, Math.min(3, validScores.length));
		const last = validScores.slice(-Math.min(3, validScores.length));
		const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
		const lastAvg = last.reduce((a, b) => a + b, 0) / last.length;
		const change = lastAvg - firstAvg;

		return {
			direction: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
			change: Math.round(change),
			current: Math.round(lastAvg)
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
						label: 'Technique Score',
						data: data.map((d) => d.overall),
						borderColor: '#f5a623',
						backgroundColor: '#f5a62320',
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
					legend: { display: !isMobile, labels: { color: themeTick, font: { size: 11 } } },
					tooltip: { mode: 'index', intersect: false }
				},
				scales: {
					x: { ticks: { color: themeSubtle, maxRotation: 45, font: { size: isMobile ? 9 : 10 } } },
					y: {
						min: 0,
						max: 100,
						ticks: { color: themeTick, font: { size: isMobile ? 9 : 10 } },
						title: { display: !isMobile, text: 'Score / 100', color: themeTick }
					}
				}
			}
		});
	}

	$effect(() => {
		if (chartCanvas) renderChart();
	});

	let hasTechniqueData = $derived(data.some((d) => d.overall !== null));
</script>

<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
	<div class="mb-4 flex items-start justify-between gap-4">
		<div>
			<h3 class="text-sm font-semibold text-[#f0ece4]">Technique Quality Over Time</h3>
			<p class="mt-1 text-xs text-[#6b5f4d]">Performance Engine technique score across eligible sessions</p>
		</div>
		{#if trend}
			<div class="text-right">
				<div class="text-xs text-[#6b5f4d]">Current</div>
				<div class="text-2xl font-bold" style="color:{trend.direction === 'improving' ? '#3de8c8' : trend.direction === 'declining' ? '#ff4444' : '#f5a623'}">
					{trend.current}
				</div>
				<div class="text-xs {trend.direction === 'improving' ? 'text-[#3de8c8]' : trend.direction === 'declining' ? 'text-[#ff4444]' : 'text-[#9a8f7a]'}">
					{trend.change > 0 ? '+' : ''}{trend.change} pts
				</div>
			</div>
		{/if}
	</div>

	{#if hasTechniqueData}
		<div class="h-64"><canvas bind:this={chartCanvas}></canvas></div>
		{#if trend}
			<p class="mt-3 text-xs text-[#9a8f7a] italic">
				{#if trend.direction === 'improving'}Technique scores are trending upward across the available engine evidence.
				{:else if trend.direction === 'declining'}Technique scores are lower across the recent evidence; inspect session context before treating that as a persistent decline.
				{:else}Technique scores are broadly stable across the available evidence.{/if}
			</p>
		{/if}
	{:else}
		<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4 text-xs text-[#9a8f7a]">
			No trustworthy technique series is available yet. Repeatability is not substituted for technique quality.
		</div>
	{/if}
</div>
