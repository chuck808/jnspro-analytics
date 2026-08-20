<script lang="ts">
	import { getContext } from 'svelte';
	import type { LayoutData } from '../$types';
	import SwipeableRunSelector from '$lib/components/SwipeableRunSelector.svelte';
	import HelpButton from '$lib/components/HelpButton.svelte';
	import RunTagSelector from '$lib/components/RunTagSelector.svelte';
	import RunVideoAttachment from '$lib/components/RunVideoAttachment.svelte';
	import type { RunTag } from '$lib/types/runs';
	import RunComparisonSelector from '$lib/components/RunComparisonSelector.svelte';
	import { ImpulseChart, PowerChart } from '$lib/components/performance-charts';
	import { shouldShowPower } from '$lib/performance-engine';
	import { getChartOptions } from '$lib/utils/chartConfig';
	import { gaugeArcPath } from '$lib/utils/svgHelpers';
	import DataQualityBadge from '$lib/components/DataQualityBadge.svelte';

	let { data }: { data: LayoutData } = $props();

	const ctx: any = getContext('session');

	let selectedRunIdx = $derived(ctx.selectedRunIdx);
	let selectedRun = $derived(ctx.selectedRun);
	let selectedGate = $derived(ctx.selectedGate);
	let isMobile = $derived(ctx.isMobile);
	let riderLevel = $derived(ctx.riderLevel);
	let performanceAnalysis = $derived(ctx.performanceAnalysis);
	let analysisView = $derived(ctx.analysisView);
	let chartSeries = $derived(ctx.chartSeries);
	let techniqueScores = $derived(ctx.techniqueScores);

	let chartData = $derived((selectedRun?.chart_data as number[]) ?? []);
	let elapsedMs = $derived(selectedRun?.elapsed_time_ms ?? 2000);
	let curve = $derived(
		performanceAnalysis.selectedRun?.physics
			? {
					times: performanceAnalysis.selectedRun.physics.timesS,
					speeds: performanceAnalysis.selectedRun.physics.speedKmh
				}
			: { times: [], speeds: [] }
	);
	let quality = $derived(
		performanceAnalysis.selectedRun?.physics?.dataQuality ?? { badge: '—', color: '#6b5f4d' }
	);
	let speedProfile = $derived(performanceAnalysis.selectedRun?.physics?.speedProfile ?? '—');

	// Video remains optional supplementary evidence. The analysis page is complete
	// without it; when attached, the component can synchronise it with this run's
	// sensor trace and headline evidence.
	let drillDownData = $derived(
		chartData.map((value: number, idx: number) => ({
			timeS: (idx / (chartData.length > 1 ? chartData.length - 1 : 1)) * (elapsedMs / 1000),
			value
		}))
	);
	let hasVideo = $derived(!!selectedRun?.run_videos);
	let heroData = $derived(
		hasVideo
			? {
					drillDownData,
					speedKmh: performanceAnalysis.selectedRun?.physics?.speedKmh ?? [],
					reactionMs: selectedGate?.reaction_time_ms ?? null,
					measuredPeakSpeedKmh:
						performanceAnalysis.selectedRun?.physics?.measuredPeakSpeedKmh ?? null,
					maxG: selectedGate?.max_g ?? null,
					techniqueScoreOverall: techniqueScores?.overall ?? null,
					frontWheelLifted: !!selectedGate?.front_wheel_lifted,
					timeToWheelieMs: selectedGate?.time_to_wheelie_ms ?? null
				}
			: null
	);

	let qualityLevel = $derived.by(
		(): 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown' | null => {
			const badge = quality.badge?.toLowerCase();
			if (badge === 'excellent') return 'excellent';
			if (badge === 'good') return 'good';
			if (badge === 'fair') return 'fair';
			if (badge === 'calibrate') return 'calibrate';
			if (badge === 'unknown' || badge === '—') return 'unknown';
			return null;
		}
	);

	let runInsights = $derived((analysisView?.insights ?? []).slice(0, 3));

	let gChartEl: HTMLCanvasElement | null = $state(null);
	let sChartEl: HTMLCanvasElement | null = $state(null);
	let chartInstances: any[] = [];
	let renderGeneration = 0;

	async function renderCharts() {
		const myGeneration = ++renderGeneration;
		const { Chart, registerables } = await import('chart.js');
		if (myGeneration !== renderGeneration) return;
		Chart.register(...registerables);
		chartInstances.forEach((c) => c.destroy());
		chartInstances = [];

		const amber = '#f5a623';
		const speed = '#ff6b3d';
		const cssVars = getComputedStyle(document.documentElement);
		const themeGrid = cssVars.getPropertyValue('--theme-border').trim() || '#221c18';
		const themeTick = cssVars.getPropertyValue('--theme-text-secondary').trim() || '#9a8f7a';
		const baseOpts = getChartOptions(isMobile);
		const labels = curve.times.map((t: number) => t.toFixed(2));

		if (gChartEl && chartData.length > 0) {
			const c = new Chart(gChartEl, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'G-force',
							data: chartData,
							borderColor: amber,
							backgroundColor: `${amber}15`,
							borderWidth: 1.5,
							fill: true,
							tension: 0.3,
							pointRadius: 0
						}
					]
				},
				options: {
					...baseOpts,
					scales: {
						...baseOpts.scales,
						x: {
							...baseOpts.scales?.x,
							title: { display: !isMobile, text: 'Time (s)', color: themeTick }
						},
						y: {
							...baseOpts.scales?.y,
							title: { display: !isMobile, text: 'G-force', color: themeTick }
						}
					}
				} as any
			});
			chartInstances.push(c);
		}

		if (sChartEl && curve.speeds.length > 0 && selectedGate?.analytics_valid) {
			const c = new Chart(sChartEl, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'Speed (km/h)',
							data: curve.speeds,
							borderColor: speed,
							backgroundColor: `${speed}15`,
							borderWidth: 1.5,
							fill: true,
							tension: 0.3,
							pointRadius: 0,
							yAxisID: 'y-speed'
						},
						{
							label: 'Accel (G)',
							data: chartData,
							borderColor: `${amber}80`,
							borderWidth: 1,
							fill: false,
							tension: 0.3,
							pointRadius: 0,
							yAxisID: 'y-accel'
						}
					]
				},
				options: {
					...baseOpts,
					plugins: {
						...baseOpts.plugins,
						legend: {
							display: !isMobile,
							labels: { color: themeTick, boxWidth: 12, font: { size: 11 } }
						}
					},
					scales: {
						x: {
							...baseOpts.scales?.x,
							title: { display: !isMobile, text: 'Time (s)', color: themeTick }
						},
						'y-speed': {
							type: 'linear',
							position: 'left',
							grid: { color: themeGrid },
							ticks: { color: speed },
							title: { display: !isMobile, text: 'Speed (km/h)', color: speed }
						},
						'y-accel': {
							type: 'linear',
							position: 'right',
							grid: { display: false },
							ticks: { color: amber },
							title: { display: !isMobile, text: 'Accel (G)', color: amber }
						}
					}
				} as any
			});
			chartInstances.push(c);
		}
	}

	$effect(() => {
		selectedRunIdx;
		isMobile;
		chartData;
		curve.times;
		curve.speeds;
		gChartEl;
		sChartEl;
		if ((chartData.length > 0 || curve.times.length > 0) && (gChartEl || sChartEl)) {
			setTimeout(() => renderCharts(), 0);
		}
	});

	function fmt(n: number | null | undefined, dec = 2, suf = '') {
		if (n === null || n === undefined) return '—';
		return n.toFixed(dec) + suf;
	}

	function fmtReaction(ms: number | null) {
		return ms !== null ? fmt(ms / 1000, 3, 's') : '—';
	}

	function fmtSpeed(ms: number | null) {
		return ms !== null ? fmt(ms * 3.6, 1, ' km/h') : '—';
	}

	function fmtTime(ms: number | null) {
		if (!ms) return '—';
		return `${Math.floor(ms / 1000)
			.toString()
			.padStart(2, '0')}:${(ms % 1000).toString().padStart(3, '0')}`;
	}

	function scoreColor(s: number) {
		if (s >= 80) return '#3de8c8';
		if (s >= 60) return '#f5a623';
		if (s >= 40) return '#ffcc44';
		return '#ff4444';
	}

	let chartHeight = $derived(isMobile ? 'h-44' : 'h-60');
</script>

<svelte:head>
	<title>Analysis — AppGatePro</title>
</svelte:head>

<div class="space-y-5">
	<div class="themed-card rounded-xl p-5">
		<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Analysis</p>
		<h2 class="themed-text-primary mt-1 text-xl font-bold">Understand the run</h2>
		<p class="themed-text-secondary mt-1 max-w-3xl text-sm">
			Choose a run, compare its important evidence, then follow the traces that explain how it was delivered. Deep Dive keeps the trace-level diagnostics and methodology when you want them.
		</p>
	</div>

	{#if data.runs.length >= 2}
		<RunComparisonSelector runs={data.runs as any} />
	{/if}

	{#if data.runs.length > 1}
		<div class="sm:hidden">
			<SwipeableRunSelector
				runs={data.runs}
				bind:selectedIdx={ctx.selectedRunIdx}
				onSelect={(i: number) => {
					ctx.selectedRunIdx = i;
				}}
			/>
		</div>
		<div class="themed-card hidden rounded-xl p-4 sm:block">
			<p class="themed-text-secondary mb-3 text-xs font-medium tracking-wider uppercase">Choose a run</p>
			<div class="flex flex-wrap gap-2">
				{#each data.runs as run, i}
					{@const g = run.gate_runs}
					{@const runTags = (run as any).tags as RunTag[] | null}
					<div class="flex items-center gap-2">
						<button
							onclick={() => {
								ctx.selectedRunIdx = i;
							}}
							aria-pressed={selectedRunIdx === i}
							aria-label="Run {run.run_number}, reaction {g ? fmtReaction(g.reaction_time_ms) : 'unknown'}"
							class="flex min-h-[44px] min-w-[64px] flex-col items-center justify-center rounded-lg border px-3 py-2.5 text-xs transition-colors focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--card)] focus:outline-none {selectedRunIdx === i ? 'themed-bg-accent themed-accent border-[color:var(--accent)]/40' : 'themed-nested-card themed-text-secondary border-[color:var(--border)] hover:border-[color:var(--accent)]/20'}"
						>
							<span class="font-bold">Run {run.run_number}</span>
							<span class="mt-0.5 text-[10px] opacity-75">{g ? fmtReaction(g.reaction_time_ms) : '—'}</span>
						</button>
						{#if selectedRunIdx === i}
							<RunTagSelector
								runId={run.id}
								runNumber={run.run_number}
								currentTags={runTags ?? []}
								sessionId={data.session.id}
							/>
						{:else if runTags && runTags.length > 0}
							<span class="flex h-6 w-6 items-center justify-center rounded-full text-xs opacity-60" title="{runTags.length} tag{runTags.length > 1 ? 's' : ''} — select this run to edit">🏷️</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if selectedRun && selectedGate}
		<section class="themed-card rounded-xl p-5">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Run {selectedRun.run_number}</p>
					<h3 class="themed-text-primary mt-1 text-lg font-bold">At a glance</h3>
				</div>
				{#if qualityLevel}
					<DataQualityBadge quality={qualityLevel} size="sm" />
				{/if}
			</div>

			<div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
				<div class="themed-nested-card rounded-lg p-3">
					<p class="themed-text-subtle text-xs">Reaction</p>
					<p class="themed-accent mt-1 text-xl font-bold">{fmtReaction(selectedGate.reaction_time_ms)}</p>
				</div>
				<div class="themed-nested-card rounded-lg p-3">
					<p class="themed-text-subtle text-xs">Peak G</p>
					<p class="themed-text-primary mt-1 text-xl font-bold">{fmt(selectedGate.max_g, 2, 'G')}</p>
				</div>
				{#if selectedGate.analytics_valid}
					<div class="themed-nested-card rounded-lg p-3">
						<p class="themed-text-subtle text-xs">Peak speed</p>
						<p class="themed-text-primary mt-1 text-xl font-bold">{fmtSpeed(selectedGate.peak_speed_ms)}</p>
					</div>
				{/if}
				<div class="themed-nested-card rounded-lg p-3">
					<p class="themed-text-subtle text-xs">Elapsed</p>
					<p class="themed-text-primary mt-1 text-xl font-bold">{fmtTime(selectedRun.elapsed_time_ms)}</p>
				</div>
			</div>

			<div class="themed-text-secondary mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
				<span>Average G: <strong class="themed-text-primary">{fmt(selectedGate.avg_g, 2, 'G')}</strong></span>
				{#if selectedGate.analytics_valid}
					<span>End speed: <strong class="themed-text-primary">{fmtSpeed(selectedGate.speed_ms)}</strong></span>
					<span>Speed profile: <strong class="themed-text-primary">{speedProfile}</strong></span>
				{/if}
			</div>
		</section>

		<RunVideoAttachment
			runId={selectedRun.id}
			video={selectedRun.run_videos ?? null}
			hero
			{heroData}
		/>

		<section class="space-y-3">
			<div>
				<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Primary traces</p>
				<h3 class="themed-text-primary mt-1 text-lg font-bold">How the run developed</h3>
				<p class="themed-text-secondary mt-1 text-sm">Start with force over time, then add estimated speed where the sensor evidence supports it.</p>
			</div>

			<div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
				<div class="themed-card rounded-xl p-5">
					<div class="mb-4 flex items-center justify-between gap-3">
						<div class="flex items-center gap-2">
							<h4 class="themed-text-primary text-sm font-semibold">G-force trace</h4>
							<HelpButton label="G-Force" onclick={() => ctx.openHelp('gForce')} />
						</div>
						<span class="themed-text-subtle text-xs">{chartData.length} samples · {fmt(elapsedMs / 1000, 2, 's')}</span>
					</div>
					<div class={chartHeight}><canvas bind:this={gChartEl}></canvas></div>
				</div>

				{#if selectedGate.analytics_valid && curve.speeds.length > 0}
					<div class="themed-card rounded-xl p-5">
						<div class="mb-4 flex items-center justify-between gap-3">
							<div class="flex items-center gap-2">
								<h4 class="themed-text-primary text-sm font-semibold">Speed and acceleration</h4>
								<HelpButton label="Speed Analysis" onclick={() => ctx.openHelp('speedAnalysis')} />
							</div>
							<DataQualityBadge quality={qualityLevel} size="sm" />
						</div>
						<div class={chartHeight}><canvas bind:this={sChartEl}></canvas></div>
						<p class="themed-text-subtle mt-2 text-xs">Speed is estimated from IMU evidence · Bias correction {fmt(selectedGate.bias_correction_ms2, 3, ' m/s²')}</p>
					</div>
				{/if}
			</div>
		</section>

		{#if chartSeries && ((analysisView.showCharts?.impulse && chartSeries.impulse.length > 0) || (analysisView.showCharts?.power && shouldShowPower(performanceAnalysis.diagnostics) && chartSeries.power.length > 0))}
			<section class="space-y-3">
				<div>
					<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Force delivery</p>
					<h3 class="themed-text-primary mt-1 text-lg font-bold">How force became movement</h3>
					<p class="themed-text-secondary mt-1 text-sm">Impulse and power add another view of delivery when the required inputs are reliable.</p>
				</div>
				<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
					{#if analysisView.showCharts?.impulse && chartSeries.impulse.length > 0}
						<ImpulseChart data={chartSeries.impulse} />
					{/if}
					{#if analysisView.showCharts?.power && shouldShowPower(performanceAnalysis.diagnostics) && chartSeries.power.length > 0}
						<PowerChart data={chartSeries.power} reliable={shouldShowPower(performanceAnalysis.diagnostics)} />
					{/if}
				</div>
			</section>
		{/if}

		{#if runInsights.length > 0}
			<section class="themed-card rounded-xl p-5">
				<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Interpretation</p>
				<h3 class="themed-text-primary mt-1 text-lg font-bold">What this run suggests</h3>
				<div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{#each runInsights as insight}
						<div class="themed-nested-card rounded-lg p-4">
							<p class="themed-text-primary text-sm font-semibold">{insight.title}</p>
							<p class="themed-text-secondary mt-1 text-xs leading-relaxed">{insight.body}</p>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if techniqueScores}
			<section class="themed-card rounded-xl p-5">
				<div class="mb-4 flex items-center justify-between gap-3">
					<div>
						<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Technique</p>
						<h3 class="themed-text-primary mt-1 text-lg font-bold">Technique summary</h3>
					</div>
					<HelpButton label="Technique Score" onclick={() => ctx.openHelp('techniqueScore')} />
				</div>
				<div class="flex flex-col gap-5 sm:flex-row sm:items-start">
					<div class="flex-shrink-0 text-center">
						<svg viewBox="0 0 36 36" class="h-20 w-20 -rotate-90">
							<circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--border)" stroke-width="3" />
							<circle cx="18" cy="18" r="15.9155" fill="none" stroke={scoreColor(techniqueScores.overall ?? 0)} stroke-width="3" stroke-linecap="round" stroke-dasharray={gaugeArcPath(techniqueScores.overall ?? 0)} />
						</svg>
						<p class="themed-text-subtle -mt-1 text-xs">Overall</p>
						<p class="text-lg font-bold" style="color:{scoreColor(techniqueScores.overall ?? 0)}">{techniqueScores.overall}</p>
					</div>
					<div class="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
						{#each [{ label: 'Reaction', score: techniqueScores.reaction }, { label: 'Explosiveness', score: techniqueScores.explosiveness }, { label: 'Smoothness', score: techniqueScores.smoothness }, { label: 'Efficiency', score: techniqueScores.efficiency }] as score}
							<div class="themed-nested-card rounded-lg p-3">
								<div class="flex items-center justify-between gap-3">
									<span class="themed-text-secondary text-xs">{score.label}</span>
									<span class="text-sm font-bold" style="color:{scoreColor(score.score ?? 0)}">{score.score ?? 0}</span>
								</div>
								<div class="mt-2 h-1.5 w-full rounded-full bg-[color:var(--border)]">
									<div class="h-1.5 rounded-full" style="width:{score.score ?? 0}%; background:{scoreColor(score.score ?? 0)}"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
				<p class="themed-text-subtle mt-4 text-xs">Benchmarked against {riderLevel ?? 'intermediate'} level. Deep Dive contains the detailed technique and phase diagnostics.</p>
			</section>
		{/if}
	{/if}

	<a href="/sessions/{data.session.id}/detail" class="themed-card-hover group flex w-full items-center justify-between rounded-xl p-4 transition-colors focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)] focus:outline-none">
		<div>
			<p class="themed-text-primary group-hover:themed-accent text-sm font-semibold transition-colors">Open Deep Dive</p>
			<p class="themed-text-subtle mt-0.5 text-xs">Raw-data drill-down, stability, detailed diagnostics and expert-level comparisons.</p>
		</div>
		<svg class="themed-text-subtle group-hover:themed-accent h-5 w-5 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</a>
</div>