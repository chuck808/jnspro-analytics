<script lang="ts">
	import { page } from '$app/stores';
	import { buildProgressTrendEvidence } from '$lib/analytics/progressTrendEvidence';

	interface PowerDataPoint {
		sessionDate: string;
		sessionNumber: number;
		peakPowerW: number | null;
		avgPowerW: number | null;
		riderWeightKg: number | null;
	}

	interface Props {
		data: PowerDataPoint[];
		isMobile?: boolean;
	}

	let { data: _legacyData, isMobile = false }: Props = $props();
	let chartCanvas: HTMLCanvasElement | null = $state(null);

	let data = $derived.by((): PowerDataPoint[] => {
		const pageData = $page.data as any;
		const riderWeightKg = pageData.riderWeightKg ?? null;
		return buildProgressTrendEvidence(
			(pageData.sessions ?? []).map((session: any) => ({ id: session.id, timestamp: session.timestamp })),
			pageData.sessionAnalyses ?? [],
			pageData.allRuns ?? []
		).map((point) => ({
			sessionDate: point.sessionDate,
			sessionNumber: point.sessionNumber,
			peakPowerW: point.powerPeakW,
			avgPowerW: point.powerAverageW,
			riderWeightKg
		}));
	});

	let powerToWeightData = $derived(
		data.map((d) => ({
			...d,
			powerToWeight:
				d.peakPowerW && d.riderWeightKg ? (d.peakPowerW / d.riderWeightKg).toFixed(1) : null
		}))
	);

	let trend = $derived.by(() => {
		const valid = data.filter((d) => d.peakPowerW !== null);
		if (valid.length < 2) return null;

		const first = valid.slice(0, Math.min(3, valid.length));
		const last = valid.slice(-Math.min(3, valid.length));
		const firstAvg = first.reduce((a, b) => a + b.peakPowerW!, 0) / first.length;
		const lastAvg = last.reduce((a, b) => a + b.peakPowerW!, 0) / last.length;
		const change = lastAvg - firstAvg;
		const changePct = (change / firstAvg) * 100;

		return {
			direction: changePct > 5 ? 'increasing' : changePct < -5 ? 'decreasing' : 'stable',
			current: Math.round(lastAvg),
			change: Math.round(change),
			changePct: changePct.toFixed(1)
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
						label: 'Peak Power (W)',
						data: data.map((d) => d.peakPowerW),
						borderColor: '#ff6b3d',
						backgroundColor: '#ff6b3d20',
						borderWidth: 2,
						fill: true,
						tension: 0.3,
						pointRadius: 3,
						yAxisID: 'y'
					},
					{
						label: 'Avg Power (W)',
						data: data.map((d) => d.avgPowerW),
						borderColor: '#f5a623',
						borderWidth: 1.5,
						fill: false,
						tension: 0.3,
						pointRadius: 2,
						yAxisID: 'y',
						hidden: true
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: !isMobile,
						labels: { color: themeTick, font: { size: 11 } }
					},
					tooltip: {
						mode: 'index',
						intersect: false,
						callbacks: {
							afterLabel: (context) => {
								const ptw = powerToWeightData[context.dataIndex]?.powerToWeight;
								return ptw ? `${ptw} W/kg` : '';
							}
						}
					}
				},
				scales: {
					x: {
						ticks: { color: themeSubtle, maxRotation: 45, font: { size: isMobile ? 9 : 10 } }
					},
					y: {
						ticks: { color: themeTick, font: { size: isMobile ? 9 : 10 } },
						title: { display: !isMobile, text: 'Power (W)', color: themeTick }
				}
			}
		});
	}

	$effect(() => {
		if (chartCanvas) renderChart();
	});

	let hasWeightData = $derived(powerToWeightData.some((d) => d.powerToWeight !== null));
	let hasPowerData = $derived(data.some((d) => d.peakPowerW !== null || d.avgPowerW !== null));
</script>

<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
	<div class="mb-4 flex items-start justify-between gap-4">
		<div>
			<h3 class="text-sm font-semibold text-[#f0ece4]">Power Output Development</h3>
			<p class="mt-1 text-xs text-[#6b5f4d]">Physics-derived power from eligible sessions</p>
		</div>
		{#if trend}
			<div class="text-right">
				<div class="text-xs text-[#6b5f4d]">Peak Power</div>
				<div class="text-2xl font-bold" style="color:{trend.direction === 'increasing' ? '#3de8c8' : trend.direction === 'decreasing' ? '#ff4444' : '#f5a623'}">
					{trend.current}W
				</div>
				<div class="text-xs {trend.direction === 'increasing' ? 'text-[#3de8c8]' : trend.direction === 'decreasing' ? 'text-[#ff4444]' : 'text-[#9a8f7a]'}">
					{trend.change > 0 ? '+' : ''}{trend.change}W ({trend.changePct}%)
				</div>
			</div>
		{/if}
	</div>

	{#if hasPowerData}
		<div class="h-64"><canvas bind:this={chartCanvas}></canvas></div>
		{#if trend}
			<p class="mt-3 text-xs text-[#9a8f7a] italic">
				{#if trend.direction === 'increasing'}Power output is trending upward across the available engine evidence.
				{:else if trend.direction === 'decreasing'}Power output is lower across the recent evidence; use the wider training context before drawing conclusions.
				{:else}Power output is broadly stable across the available evidence.{/if}
			</p>
		{/if}
	{:else}
		<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4 text-xs text-[#9a8f7a]">
			No trustworthy power series is available yet. Progress does not substitute G-force × mass for watts.
		</div>
	{/if}

	{#if hasPowerData && !hasWeightData}
		<div class="mt-3 rounded-lg border border-[#f5a623]/20 bg-[#f5a623]/10 p-3">
			<p class="text-xs font-semibold text-[#f5a623]">Add your body weight to unlock W/kg context</p>
		</div>
	{/if}

	<p class="mt-2 text-xs text-[#6b5f4d]">Power is derived by the Performance Engine from the recorded motion trace; it is not power-meter data.</p>
</div>
