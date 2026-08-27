<script lang="ts">
	import { onDestroy } from 'svelte';
	import { getChartOptions } from '$lib/utils/chartConfig';
	import HelpButton from '$lib/components/HelpButton.svelte';

	export type EvidenceView = 'reaction' | 'speed' | 'consistency';

	interface SessionSummary {
		timestamp: string;
		best_reaction_ms: number | null;
		avg_reaction_ms: number | null;
		best_peak_speed_ms: number | null;
		reaction_cv: number | null;
		has_valid_speed: boolean;
	}

	interface Props {
		sessions: SessionSummary[];
		activeView: EvidenceView;
		isMobile: boolean;
		trend: { reaction: number | null; speed: number | null };
		overallConsistency: { label: string } | null;
		goalTargets?: Record<string, any>;
		onOpenHelp: (key: string) => void;
	}

	let { sessions, activeView, isMobile, trend, overallConsistency, goalTargets = {}, onOpenHelp }: Props = $props();
	let chartEl: HTMLCanvasElement | null = $state(null);
	let chartInstance: any = null;
	let hasValidSpeed = $derived(sessions.some((session) => session.has_valid_speed));

	function fmtDate(timestamp: string) {
		return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}

	function trendState(value: number | null, lowerIsBetter = false) {
		if (value === null) return { icon: '—', tone: 'neutral', text: 'No trend yet' };
		if (Math.abs(value) < 1) return { icon: '→', tone: 'neutral', text: 'Stable' };
		const improving = lowerIsBetter ? value < 0 : value > 0;
		return improving
			? { icon: '↑', tone: 'positive', text: `${Math.abs(value).toFixed(1)}% improving` }
			: { icon: '↓', tone: 'attention', text: `${Math.abs(value).toFixed(1)}% declining` };
	}

	let meta = $derived.by(() => {
		if (activeView === 'speed') return { title: 'Peak speed progression', subtitle: 'Estimated from IMU · higher is better', help: 'speedTrend', trend: trendState(trend.speed) };
		if (activeView === 'consistency') return { title: 'Reaction consistency', subtitle: 'CV % within each session · lower is more repeatable', help: 'sessionConsistency', trend: { icon: '•', tone: 'neutral', text: overallConsistency?.label ?? 'Building evidence' } };
		return { title: 'Reaction progression', subtitle: 'Best and average reaction · lower is better', help: 'reactionTrend', trend: trendState(trend.reaction, true) };
	});

	async function renderChart() {
		if (!chartEl || sessions.length < 2) return;
		const { Chart, registerables } = await import('chart.js');
		Chart.register(...registerables);
		chartInstance?.destroy();
		chartInstance = null;
		if (activeView === 'speed' && !hasValidSpeed) return;

		const labels = sessions.map((session) => fmtDate(session.timestamp));
		const base = getChartOptions(isMobile);
		const axis = '#8d8273';
		const amber = '#f5a623';
		const coral = '#ff6b3d';
		const teal = '#3de8c8';

		if (activeView === 'consistency') {
			const barColors = sessions.map((session) => {
				const cv = session.reaction_cv ?? 10;
				if (cv < 2) return `${teal}CC`;
				if (cv < 5) return `${amber}CC`;
				return '#e4564f99';
			});
			chartInstance = new Chart(chartEl, {
				type: 'bar',
				data: {
					labels,
					datasets: [{
						label: 'Reaction CV %',
						data: sessions.map((session) => session.reaction_cv),
						backgroundColor: barColors,
						borderRadius: 5,
						maxBarThickness: 34
					}]
				},
				options: { ...base, plugins: { ...base.plugins, legend: { display: false } }, scales: { ...base.scales, y: { ...base.scales?.y, title: { display: !isMobile, text: 'CV %', color: axis } } } } as any
			});
			return;
		}

		const datasets: any[] = activeView === 'speed'
			? [{ label: 'Best peak speed (km/h)', data: sessions.map((s) => s.best_peak_speed_ms ? s.best_peak_speed_ms * 3.6 : null), borderColor: coral, backgroundColor: `${coral}18`, borderWidth: 2.5, fill: true, tension: 0.32, pointRadius: isMobile ? 1.5 : 3, pointBackgroundColor: coral }]
			: [
				{ label: 'Best reaction (s)', data: sessions.map((s) => s.best_reaction_ms ? s.best_reaction_ms / 1000 : null), borderColor: amber, backgroundColor: `${amber}18`, borderWidth: 2.5, fill: true, tension: 0.32, pointRadius: isMobile ? 1.5 : 3, pointBackgroundColor: amber },
				{ label: 'Average reaction (s)', data: sessions.map((s) => s.avg_reaction_ms ? s.avg_reaction_ms / 1000 : null), borderColor: `${amber}65`, borderDash: [4, 5], borderWidth: 1.25, fill: false, tension: 0.32, pointRadius: 0 }
			];

		const target = activeView === 'speed' ? goalTargets.peakSpeed?.target : goalTargets.reactionTime?.target;
		if (target) datasets.push({ label: 'Goal target', data: Array(sessions.length).fill(activeView === 'speed' ? target * 3.6 : target / 1000), borderColor: teal, borderWidth: 1.5, borderDash: [7, 5], pointRadius: 0, fill: false });

		chartInstance = new Chart(chartEl, {
			type: 'line',
			data: { labels, datasets },
			options: {
				...base,
				plugins: { ...base.plugins, legend: { display: !isMobile, labels: { color: axis, boxWidth: 10, font: { size: 10 } } } },
				scales: { ...base.scales, y: { ...base.scales?.y, reverse: activeView === 'reaction', title: { display: !isMobile, text: activeView === 'reaction' ? 'Reaction (s)' : 'km/h', color: axis } } }
			} as any
		});
	}

	$effect(() => { sessions.length; isMobile; activeView; goalTargets; renderChart(); });
	onDestroy(() => chartInstance?.destroy());
</script>

<div class="rounded-2xl border border-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] bg-[color:var(--surface)] p-4 shadow-sm sm:p-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<p class="themed-text-subtle text-[10px] font-extrabold tracking-[0.16em] uppercase">Longitudinal evidence</p>
			<div class="mt-1 flex items-center gap-1"><h3 class="themed-text-primary text-xl font-bold">{meta.title}</h3><HelpButton onclick={() => onOpenHelp(meta.help)} /></div>
			<p class="themed-text-subtle mt-1 text-xs">{meta.subtitle}</p>
		</div>
		<span class:trend-positive={meta.trend.tone === 'positive'} class:trend-attention={meta.trend.tone === 'attention'} class="themed-text-secondary rounded-full bg-[color:color-mix(in_srgb,var(--text-primary)_6%,transparent)] px-3 py-1.5 text-xs font-bold">{meta.trend.icon} {meta.trend.text}</span>
	</div>
	<div class="mt-4 h-60 sm:h-80">
		{#if activeView === 'speed' && !hasValidSpeed}
			<div class="flex h-full flex-col items-center justify-center text-center"><strong class="themed-text-primary">No valid speed evidence yet</strong><span class="themed-text-subtle mt-1 max-w-md text-xs">Speed stays out of the progression view until the session data passes validation.</span></div>
		{:else}
			<canvas bind:this={chartEl}></canvas>
		{/if}
	</div>
</div>

<style>
	.trend-positive { color: #20b98b; }
	.trend-attention { color: #e4564f; }
</style>