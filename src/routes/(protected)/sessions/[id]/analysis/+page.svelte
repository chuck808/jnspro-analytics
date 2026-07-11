<script lang="ts">
	import { getContext } from 'svelte';
	import type { LayoutData } from '../$types';
	import SwipeableRunSelector from '$lib/components/SwipeableRunSelector.svelte';
	import HelpButton from '$lib/components/HelpButton.svelte';
	import RunTagSelector from '$lib/components/RunTagSelector.svelte';
	import type { RunTag } from '$lib/types/runs';
	import RunComparisonSelector from '$lib/components/RunComparisonSelector.svelte';
	import { ImpulseChart, PowerChart } from '$lib/components/performance-charts';
	import { TrainingInsightsPanel } from '$lib/components/performance-insights';
	import CoachDiagnosticsCard from '$lib/components/session/CoachDiagnosticsCard.svelte';
	import TechniqueScoreBreakdown from '$lib/components/session/TechniqueScoreBreakdown.svelte';
	import { shouldShowPower } from '$lib/performance-engine';
	import { computeDetailedPhases } from '$lib/performance-engine/phaseAnalysis';
	import { getChartOptions } from '$lib/utils/chartConfig';
	import { gaugeArcPath } from '$lib/utils/svgHelpers';
	import DataQualityBadge from '$lib/components/DataQualityBadge.svelte';
	import { buildSessionNarrative } from '$lib/performance-engine/sessionNarrative';

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
	let jerkProfile = $derived(ctx.jerkProfile);
	let coachDiagnostics = $derived(ctx.coachDiagnostics);
	let techniqueScoreBreakdown = $derived(ctx.techniqueScoreBreakdown);

	// ── Per-run derived ────────────────────────────────────────────────────────
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
	let splits = $derived(performanceAnalysis.selectedRun?.physics?.speedSplits ?? []);
	let quality = $derived(
		performanceAnalysis.selectedRun?.physics?.dataQuality ?? { badge: '—', color: '#6b5f4d' }
	);
	let speedProfile = $derived(performanceAnalysis.selectedRun?.physics?.speedProfile ?? '—');

	// Map quality badge to DataQualityBadge type
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

	let phaseMetrics = $derived.by(() => {
		if (!chartData.length) return null;
		return computeDetailedPhases(chartData, elapsedMs);
	});

	let sessionIntelligence = $derived(performanceAnalysis.intelligence);
	let crossSessionReport = $derived(ctx.crossSessionReport);

	// v8.5: build narrative in analysis page so TrainingInsightsPanel gets
	// the unified headline and recommendations
	let sessionNarrative = $derived.by(() => {
		if (!sessionIntelligence) return null;
		return buildSessionNarrative({
			runCount: data.runs?.length ?? 0,
			consistencyScore: sessionIntelligence.repeatability.overall,
			dataQualityRating: null,
			intelligenceReport: sessionIntelligence,
			sessionFocus: (data.session as any)?.session_focus ?? null,
			trackSurface: (data.session as any)?.track_surface ?? null,
			weatherCondition: (data.session as any)?.weather_conditions ?? null,
			rideFeel: (data.session as any)?.ride_feel ?? null
		});
	});

	// ── Chart canvas refs ──────────────────────────────────────────────────────
	let gChartEl: HTMLCanvasElement | null = $state(null);
	let sChartEl: HTMLCanvasElement | null = $state(null);
	let jerkChartEl: HTMLCanvasElement | null = $state(null);
	let chartInstances: any[] = [];

	async function renderCharts() {
		const { Chart, registerables } = await import('chart.js');
		Chart.register(...registerables);
		chartInstances.forEach((c) => c.destroy());
		chartInstances = [];

		const amber = '#f5a623';
		const speed = '#ff6b3d';
		const teal = '#3de8c8';
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

		if (jerkChartEl && jerkProfile && jerkProfile.data.length > 0) {
			const jLabels = jerkProfile.data.map((d: any) => d.timeS.toFixed(2));
			const c = new Chart(jerkChartEl, {
				type: 'line',
				data: {
					labels: jLabels,
					datasets: [
						{
							label: 'Jerk (m/s³)',
							data: jerkProfile.data.map((d: any) => d.jerk),
							borderColor: teal,
							backgroundColor: `${teal}10`,
							borderWidth: 1.5,
							fill: true,
							tension: 0.2,
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
							title: { display: !isMobile, text: 'Jerk (m/s³)', color: themeTick }
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
		jerkProfile;
		gChartEl;
		sChartEl;
		jerkChartEl;
		if ((chartData.length > 0 || curve.times.length > 0) && (gChartEl || sChartEl || jerkChartEl)) {
			setTimeout(() => renderCharts(), 0);
		}
	});

	// ── Helpers ────────────────────────────────────────────────────────────────
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
	function effPct(n: number) {
		return Math.round(n * 100);
	}

	let chartHSm = $derived(isMobile ? 'h-40' : 'h-52');
	let chartHJerk = $derived(isMobile ? 'h-36' : 'h-44');
</script>

<svelte:head>
	<title>Analysis — AppGatePro</title>
</svelte:head>

<div class="space-y-5">
	<!-- ══════════════════════════════════════════════════════
         MULTI-RUN OVERLAY
         ══════════════════════════════════════════════════════ -->
	{#if data.runs.length >= 2}
		<RunComparisonSelector runs={data.runs as any} />
	{/if}

	<!-- ══════════════════════════════════════════════════════
         RUN SELECTOR
         ══════════════════════════════════════════════════════ -->
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
			<p class="themed-text-secondary mb-3 text-xs font-medium tracking-wider uppercase">
				Select run for detail
			</p>
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
							aria-label="Run {run.run_number}, reaction {g
								? fmtReaction(g.reaction_time_ms)
								: 'unknown'}"
							class="flex min-h-[44px] min-w-[64px] flex-col items-center justify-center rounded-lg border
                                   px-3 py-2.5 text-xs transition-colors
                                   focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--card)] focus:outline-none
                                   {selectedRunIdx === i
								? 'themed-bg-accent themed-accent border-[color:var(--accent)]/40'
								: 'themed-nested-card themed-text-secondary border-[color:var(--border)] hover:border-[color:var(--accent)]/20'}"
						>
							<span class="font-bold">Run {run.run_number}</span>
							<span class="mt-0.5 text-[10px] opacity-75"
								>{g ? fmtReaction(g.reaction_time_ms) : '—'}</span
							>
						</button>
						<RunTagSelector
							runId={run.id}
							runNumber={run.run_number}
							currentTags={runTags ?? []}
							sessionId={data.session.id}
						/>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ══════════════════════════════════════════════════════
         IMPULSE & POWER CHARTS
         ══════════════════════════════════════════════════════ -->
	{#if chartSeries}
		<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
			{#if analysisView.showCharts?.impulse && chartSeries.impulse.length > 0}
				<ImpulseChart data={chartSeries.impulse} />
			{/if}
			{#if analysisView.showCharts?.power && shouldShowPower(performanceAnalysis.diagnostics) && chartSeries.power.length > 0}
				<PowerChart
					data={chartSeries.power}
					reliable={shouldShowPower(performanceAnalysis.diagnostics)}
				/>
			{/if}
		</div>
	{/if}

	<!-- ══════════════════════════════════════════════════════
         RUN DETAIL — CHARTS + METRICS
         ══════════════════════════════════════════════════════ -->
	{#if selectedRun && selectedGate}
		<div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
			<!-- LEFT: Charts -->
			<div class="space-y-5">
				{#if analysisView.insights.find((i: any) => i.title
							.toLowerCase()
							.includes('explosive') || i.title.toLowerCase().includes('power'))}
					{@const ins = analysisView.insights.find(
						(i: any) =>
							i.title.toLowerCase().includes('explosive') || i.title.toLowerCase().includes('power')
					)}
					<div class="themed-nested-card rounded border-l-4 border-[color:var(--accent)] p-3">
						<p class="themed-accent mb-1 text-sm font-semibold">{ins?.title}</p>
						<p class="themed-text-secondary text-xs leading-relaxed">{ins?.body}</p>
					</div>
				{/if}

				<!-- G-Force chart -->
				<div class="themed-card rounded-xl p-5">
					<div class="mb-4 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<h3 class="themed-text-primary text-sm font-semibold">
								G-Force — Run {selectedRun.run_number}
							</h3>
							<HelpButton label="G-Force" onclick={() => ctx.openHelp('gForce')} />
						</div>
						<span class="themed-text-subtle text-xs"
							>{chartData.length} samples · {fmt(elapsedMs / 1000, 2, 's')}</span
						>
					</div>
					<div class={chartHSm}><canvas bind:this={gChartEl}></canvas></div>
				</div>

				{#if analysisView.insights.find((i: any) => i.title
							.toLowerCase()
							.includes('speed') || i.title.toLowerCase().includes('carry'))}
					{@const ins = analysisView.insights.find(
						(i: any) =>
							i.title.toLowerCase().includes('speed') || i.title.toLowerCase().includes('carry')
					)}
					<div class="themed-nested-card rounded border-l-4 border-[#ff6b3d] p-3">
						<p class="mb-1 text-sm font-semibold text-[#ff6b3d]">{ins?.title}</p>
						<p class="themed-text-secondary text-xs leading-relaxed">{ins?.body}</p>
					</div>
				{/if}

				<!-- Performance Curves -->
				{#if selectedGate.analytics_valid}
					<div class="themed-card rounded-xl p-5">
						<div class="mb-4 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<h3 class="themed-text-primary text-sm font-semibold">Performance Curves</h3>
								<HelpButton label="Speed Analysis" onclick={() => ctx.openHelp('speedAnalysis')} />
							</div>
							<DataQualityBadge quality={qualityLevel} size="sm" />
						</div>
						<div class={chartHSm}><canvas bind:this={sChartEl}></canvas></div>
						<p class="themed-text-subtle mt-2 text-xs">
							⚠ Speed estimated from IMU · Bias: {fmt(selectedGate.bias_correction_ms2, 3, ' m/s²')}
						</p>
					</div>
				{/if}

				{#if analysisView.insights.find((i: any) => i.title.toLowerCase().includes('smooth'))}
					{@const ins = analysisView.insights.find((i: any) =>
						i.title.toLowerCase().includes('smooth')
					)}
					<div class="themed-nested-card rounded border-l-4 border-[#3de8c8] p-3">
						<p class="mb-1 text-sm font-semibold text-[#3de8c8]">{ins?.title}</p>
						<p class="themed-text-secondary text-xs leading-relaxed">{ins?.body}</p>
					</div>
				{/if}

				<!-- Jerk chart -->
				{#if jerkProfile && jerkProfile.data.length > 0}
					<div class="themed-card rounded-xl p-5">
						<div class="mb-1 flex items-center justify-between">
							<h3 class="themed-text-primary text-sm font-semibold">Force Application (Jerk)</h3>
							<span class="themed-text-secondary text-xs">Rate of change of acceleration</span>
						</div>
						<p class="themed-text-subtle mb-4 text-xs">
							Smooth jerk = fluid technique · Spikes = abrupt force changes
						</p>
						<div class={chartHJerk}><canvas bind:this={jerkChartEl}></canvas></div>
						<div class="mt-4 flex-1">
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="themed-text-secondary">Smoothness score</span>
								<span class="font-bold" style="color:{scoreColor(jerkProfile.smoothnessScore)}"
									>{Math.round(jerkProfile.smoothnessScore)}/100</span
								>
							</div>
							<div class="h-1.5 w-full rounded-full bg-[color:var(--border)]">
								<div
									class="h-1.5 rounded-full transition-all"
									style="width:{jerkProfile.smoothnessScore}%; background:{scoreColor(
										jerkProfile.smoothnessScore
									)}"
								></div>
							</div>
						</div>
						<p class="themed-text-secondary mt-2 text-xs italic">{jerkProfile.insight}</p>
					</div>
				{/if}
			</div>

			<!-- RIGHT: Metrics -->
			<div class="space-y-5">
				<!-- Run metrics -->
				<div class="themed-card rounded-xl p-5">
					<div class="mb-4 flex items-center gap-2">
						<h3 class="themed-text-primary text-sm font-semibold">
							Run {selectedRun.run_number} Metrics
						</h3>
						<HelpButton label="Reaction Time" onclick={() => ctx.openHelp('reactionTime')} />
					</div>
					<div class="grid grid-cols-2 gap-3">
						{#each [{ label: 'Reaction time', value: fmtReaction(selectedGate.reaction_time_ms), hi: true }, { label: 'Elapsed time', value: fmtTime(selectedRun.elapsed_time_ms) }, { label: 'Max G-force', value: fmt(selectedGate.max_g, 2, 'G') }, { label: 'Avg G-force', value: fmt(selectedGate.avg_g, 2, 'G') }, { label: 'Peak speed', value: fmtSpeed(selectedGate.peak_speed_ms), warn: !selectedGate.analytics_valid }, { label: 'End speed', value: fmtSpeed(selectedGate.speed_ms), warn: !selectedGate.analytics_valid }, { label: 'Avg speed', value: fmtSpeed(selectedGate.avg_speed_ms_calc), warn: !selectedGate.analytics_valid }, { label: 'Time to peak', value: selectedGate.time_to_peak_speed_ms ? fmt(selectedGate.time_to_peak_speed_ms / 1000, 2, 's') : '—' }] as m}
							<div class="themed-nested-card min-h-[56px] rounded-lg p-3">
								<p class="themed-text-subtle mb-0.5 text-xs">{m.label}</p>
								<p
									class="text-base font-bold {m.hi
										? 'themed-accent'
										: (m as any).warn
											? 'themed-text-subtle'
											: 'themed-text-primary'}"
								>
									{m.value}
								</p>
							</div>
						{/each}
					</div>
					{#if selectedGate.analytics_valid}
						<div class="themed-nested-card mt-3 flex items-center gap-3 rounded-lg px-3 py-2.5">
							<p class="themed-text-subtle text-xs">Speed profile</p>
							<p class="themed-accent ml-auto text-sm font-bold">{speedProfile}</p>
						</div>
					{/if}
				</div>

				<!-- Technique scores -->
				{#if techniqueScores}
					<div class="themed-card rounded-xl p-5">
						<div class="mb-4 flex items-center gap-2">
							<h3 class="themed-text-primary text-sm font-semibold">Technique Scores</h3>
							<HelpButton label="Technique Score" onclick={() => ctx.openHelp('techniqueScore')} />
						</div>
						<div class="flex items-start gap-5">
							<div class="flex-shrink-0 text-center">
								<svg viewBox="0 0 36 36" class="h-20 w-20 -rotate-90">
									<circle
										cx="18"
										cy="18"
										r="15.9155"
										fill="none"
										stroke="var(--border)"
										stroke-width="3"
									/>
									<circle
										cx="18"
										cy="18"
										r="15.9155"
										fill="none"
										stroke={scoreColor(techniqueScores.overall ?? 0)}
										stroke-width="3"
										stroke-linecap="round"
										stroke-dasharray={gaugeArcPath(techniqueScores.overall ?? 0)}
									/>
								</svg>
								<p class="themed-text-subtle -mt-1 text-xs">Overall</p>
								<p
									class="text-lg font-bold"
									style="color:{scoreColor(techniqueScores.overall ?? 0)}"
								>
									{techniqueScores.overall}
								</p>
							</div>
							<div class="flex-1 space-y-2.5">
								{#each [{ label: 'Reaction', score: techniqueScores.reaction }, { label: 'Explosiveness', score: techniqueScores.explosiveness }, { label: 'Smoothness', score: techniqueScores.smoothness }, { label: 'Efficiency', score: techniqueScores.efficiency }] as s}
									<div>
										<div class="mb-0.5 flex items-center justify-between">
											<span class="themed-text-secondary text-xs">{s.label}</span>
											<span class="text-xs font-bold" style="color:{scoreColor(s.score ?? 0)}"
												>{s.score ?? 0}</span
											>
										</div>
										<div class="h-1.5 w-full rounded-full bg-[color:var(--border)]">
											<div
												class="h-1.5 rounded-full transition-all"
												style="width:{s.score ?? 0}%; background:{scoreColor(s.score ?? 0)}"
											></div>
										</div>
									</div>
								{/each}
							</div>
						</div>
						<p class="themed-text-subtle mt-3 text-xs">
							Benchmarked against {riderLevel ?? 'intermediate'} level
						</p>
					</div>
				{/if}

				<!-- Technique indicators -->
				{#if selectedGate.max_pitch_deg !== null}
					<div class="themed-card rounded-xl p-5">
						<h3 class="themed-text-primary mb-1 text-sm font-semibold">Technique Indicators</h3>
						<p class="themed-text-subtle mb-4 text-xs">
							IMU orientation data — pitch and front wheel behaviour
						</p>
						<div class="grid grid-cols-2 gap-3">
							{#each [{ label: 'Max pitch', value: fmt(selectedGate.max_pitch_deg, 1, '°') }, { label: 'Avg pitch', value: fmt(selectedGate.avg_pitch_deg, 1, '°') }, { label: 'Pitch at peak G', value: fmt(selectedGate.pitch_at_peak_g_deg, 1, '°') }, { label: 'Front wheel lift', value: selectedGate.front_wheel_lifted ? 'Yes' : 'No', color: selectedGate.front_wheel_lifted ? '#f5a623' : '#9a8f7a' }, { label: 'Time to wheelie', value: selectedGate.time_to_wheelie_ms ? fmt(selectedGate.time_to_wheelie_ms / 1000, 3, 's') : '—' }, { label: 'Wheelie duration', value: selectedGate.wheelie_duration_ms ? fmt(selectedGate.wheelie_duration_ms / 1000, 3, 's') : '—' }] as m}
								<div class="themed-nested-card min-h-[56px] rounded-lg p-3">
									<p class="themed-text-subtle mb-0.5 text-xs">{m.label}</p>
									<p
										class="text-base font-bold"
										style="color:{(m as any).color ?? 'var(--text-primary)'}"
									>
										{m.value}
									</p>
								</div>
							{/each}
						</div>
						<p class="themed-text-subtle mt-3 text-xs">
							⚠ Technique indicators — not absolute biomechanical measurements
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- ══════════════════════════════════════════════════════
             PHASE ANALYSIS
             ══════════════════════════════════════════════════════ -->
		{#if phaseMetrics}
			<div class="themed-card rounded-xl p-5">
				<div class="mb-1 flex items-center gap-2">
					<h3 class="themed-text-primary text-sm font-semibold">Detailed Phase Analysis</h3>
					<HelpButton label="Phase Analysis" onclick={() => ctx.openHelp('phaseAnalysis')} />
				</div>
				<p class="themed-text-subtle mb-5 text-xs">
					Drive → Transition → Velocity — how power is applied across the gate start
				</p>
				<div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div class="themed-nested-card rounded-xl border border-[#f5a623]/20 p-4">
						<div class="mb-3 flex items-center gap-2">
							<div class="h-2 w-2 rounded-full bg-[#f5a623]"></div>
							<p class="text-sm font-semibold text-[#f5a623]">Drive Phase</p>
						</div>
						<div class="space-y-2 text-xs">
							<div class="flex justify-between">
								<span class="themed-text-subtle">Duration</span><span
									class="themed-text-primary font-medium">{phaseMetrics.drivePhase.durationS}s</span
								>
							</div>
							<div class="flex justify-between">
								<span class="themed-text-subtle">Peak accel</span><span
									class="themed-text-primary font-medium"
									>{fmt(phaseMetrics.drivePhase.peakAccelMs2, 2, ' m/s²')}</span
								>
							</div>
							<div class="flex justify-between">
								<span class="themed-text-subtle">Time to peak</span><span
									class="themed-text-primary font-medium"
									>{phaseMetrics.drivePhase.timeToPeakS}s</span
								>
							</div>
							<div class="flex justify-between">
								<span class="themed-text-subtle">Efficiency</span><span
									class="font-bold"
									style="color:{scoreColor(effPct(phaseMetrics.drivePhase.efficiency))}"
									>{effPct(phaseMetrics.drivePhase.efficiency)}%</span
								>
							</div>
						</div>
					</div>
					<div class="themed-nested-card rounded-xl border border-[#ffcc44]/20 p-4">
						<div class="mb-3 flex items-center gap-2">
							<div class="h-2 w-2 rounded-full bg-[#ffcc44]"></div>
							<p class="text-sm font-semibold text-[#ffcc44]">Transition Phase</p>
						</div>
						<div class="space-y-2 text-xs">
							<div class="flex justify-between">
								<span class="themed-text-subtle">Duration</span><span
									class="themed-text-primary font-medium"
									>{phaseMetrics.transitionPhase.durationS}s</span
								>
							</div>
							<div class="flex justify-between">
								<span class="themed-text-subtle">Velocity at end</span><span
									class="themed-text-primary font-medium"
									>{fmt(phaseMetrics.transitionPhase.velocityAtEndMs, 2, ' m/s')}</span
								>
							</div>
							<div class="flex justify-between">
								<span class="themed-text-subtle">Efficiency</span><span
									class="font-bold"
									style="color:{scoreColor(
										effPct(phaseMetrics.transitionPhase.transitionEfficiency)
									)}">{effPct(phaseMetrics.transitionPhase.transitionEfficiency)}%</span
								>
							</div>
						</div>
					</div>
					<div class="themed-nested-card rounded-xl border border-[#3de8c8]/20 p-4">
						<div class="mb-3 flex items-center gap-2">
							<div class="h-2 w-2 rounded-full bg-[#3de8c8]"></div>
							<p class="text-sm font-semibold text-[#3de8c8]">Velocity Phase</p>
						</div>
						<div class="space-y-2 text-xs">
							<div class="flex justify-between">
								<span class="themed-text-subtle">Duration</span><span
									class="themed-text-primary font-medium"
									>{phaseMetrics.velocityPhase.durationS}s</span
								>
							</div>
							<div class="flex justify-between">
								<span class="themed-text-subtle">Peak velocity</span><span
									class="themed-text-primary font-medium"
									>{fmt(phaseMetrics.velocityPhase.peakVelocityMs, 2, ' m/s')}</span
								>
							</div>
							<div class="flex justify-between">
								<span class="themed-text-subtle">Time to max</span><span
									class="themed-text-primary font-medium"
									>{phaseMetrics.velocityPhase.timeToMaxS}s</span
								>
							</div>
							<div class="flex justify-between">
								<span class="themed-text-subtle">Maintenance</span><span
									class="font-bold"
									style="color:{scoreColor(effPct(phaseMetrics.velocityPhase.maintenanceScore))}"
									>{effPct(phaseMetrics.velocityPhase.maintenanceScore)}%</span
								>
							</div>
						</div>
					</div>
				</div>
				<div
					class="themed-nested-card flex items-start gap-3 rounded-lg border border-[color:var(--border)] p-4"
				>
					<svg
						class="themed-accent mt-0.5 h-5 w-5 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div>
						<p class="themed-accent mb-0.5 text-xs font-semibold">Technical Assessment</p>
						<p class="themed-text-secondary text-sm">{phaseMetrics.technicalAssessment}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- ══════════════════════════════════════════════════════
             ACCELERATION SPLITS
             ══════════════════════════════════════════════════════ -->
		{#if splits.length > 0}
			<div class="themed-card rounded-xl p-5">
				<h3 class="themed-text-primary mb-4 text-sm font-semibold">
					⚡ Acceleration Splits — Run {selectedRun.run_number}
				</h3>
				<div class="overflow-x-auto">
					<table class="w-full min-w-[400px] text-sm">
						<caption class="sr-only">Acceleration splits for run {selectedRun.run_number}</caption>
						<thead>
							<tr class="border-b border-[color:var(--border)]">
								{#each ['Target', 'Time', 'Distance', 'Phase'] as h}
									<th
										scope="col"
										class="themed-text-secondary pr-4 pb-2 text-left text-xs font-semibold tracking-wider uppercase"
										>{h}</th
									>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each splits as split}
								<tr
									class="border-b border-[color:var(--border)]/50 transition-colors hover:bg-[color:var(--nested-card)]"
								>
									<td class="themed-text-primary py-2.5 pr-4 font-medium">{split.label}</td>
									<td class="themed-accent py-2.5 pr-4 font-bold">{split.timeS}s</td>
									<td class="themed-text-secondary py-2.5 pr-4">{split.distanceM}m</td>
									<td class="themed-text-subtle py-2.5 text-xs">{split.phase}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}

	<!-- ══════════════════════════════════════════════════════
         DETAILED TECHNIQUE BREAKDOWN
         ══════════════════════════════════════════════════════ -->
	{#if techniqueScoreBreakdown}
		<div class="themed-card rounded-xl p-5">
			<div class="mb-4 flex items-center gap-2">
				<h3 class="themed-text-primary text-base font-bold">Detailed Technique Breakdown</h3>
				<HelpButton label="Technique Breakdown" onclick={() => ctx.openHelp('techniqueScore')} />
			</div>
			<p class="themed-text-secondary mb-5 text-xs">
				Six dimensions of gate start technique, scored 0-100 and benchmarked against {riderLevel ??
					'intermediate'} level
			</p>
			<TechniqueScoreBreakdown scores={techniqueScoreBreakdown} />
		</div>
	{/if}

	<!-- ══════════════════════════════════════════════════════
         COACH DIAGNOSTICS
         ══════════════════════════════════════════════════════ -->
	{#if coachDiagnostics && coachDiagnostics.length > 0}
		<CoachDiagnosticsCard diagnostics={coachDiagnostics} />
	{/if}

	<!-- ══════════════════════════════════════════════════════
         TRAINING INSIGHTS PANEL
         ══════════════════════════════════════════════════════ -->
	{#if sessionIntelligence}
		<TrainingInsightsPanel
			sessionReport={sessionIntelligence}
			narrative={sessionNarrative}
			{crossSessionReport}
			runs={data.runs.map((r: any) => ({
				id: r.id,
				run_number: r.run_number,
				gate_runs: r.gate_runs
					? {
							reaction_time_ms: r.gate_runs.reaction_time_ms ?? null,
							front_wheel_lifted: r.gate_runs.front_wheel_lifted ?? null,
							wheelie_duration_ms: r.gate_runs.wheelie_duration_ms ?? null,
							max_pitch: r.gate_runs.max_pitch_deg ?? null,
							time_to_wheelie_ms: r.gate_runs.time_to_wheelie_ms ?? null,
							bias_correction_ms2: r.gate_runs.bias_correction_ms2 ?? null,
							max_g: r.gate_runs.max_g ?? null,
							peak_speed_ms: r.gate_runs.peak_speed_ms ?? null
						}
					: undefined,
				elapsed_time_ms: r.elapsed_time_ms
			}))}
			detailLevel="coach"
			showSessionSection={true}
			showTechniqueSection={true}
			showProgressSection={false}
			sessionTitle="This Session Analysis"
		/>
	{/if}
</div>
