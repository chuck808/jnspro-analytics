<script lang="ts">
	import HelpButton from '$lib/components/HelpButton.svelte';
	import TechniqueScoreBreakdown from '$lib/components/session/TechniqueScoreBreakdown.svelte';
	import CoachDiagnosticsCard from '$lib/components/session/CoachDiagnosticsCard.svelte';
	import { computeDetailedPhases } from '$lib/performance-engine/phaseAnalysis';
	import { getChartOptions } from '$lib/utils/chartConfig';

	let {
		selectedRun,
		performanceAnalysis,
		techniqueScoreBreakdown,
		coachDiagnostics,
		jerkProfile,
		riderLevel,
		isMobile,
		onOpenHelp
	}: {
		selectedRun: any;
		performanceAnalysis: any;
		techniqueScoreBreakdown: any;
		coachDiagnostics: any[] | null | undefined;
		jerkProfile: any;
		riderLevel: string | null | undefined;
		isMobile: boolean;
		onOpenHelp: (key: string) => void;
	} = $props();

	let chartData = $derived((selectedRun?.chart_data as number[]) ?? []);
	let elapsedMs = $derived(selectedRun?.elapsed_time_ms ?? 2000);
	let splits = $derived(performanceAnalysis.selectedRun?.physics?.speedSplits ?? []);
	let phaseMetrics = $derived.by(() => {
		if (!chartData.length) return null;
		return computeDetailedPhases(chartData, elapsedMs);
	});

	let jerkChartEl: HTMLCanvasElement | null = $state(null);
	let chartInstance: any = null;
	let renderGeneration = 0;

	async function renderJerkChart() {
		const myGeneration = ++renderGeneration;
		if (!jerkChartEl || !jerkProfile?.data?.length) return;
		const { Chart, registerables } = await import('chart.js');
		if (myGeneration !== renderGeneration) return;
		Chart.register(...registerables);
		chartInstance?.destroy();

		const teal = '#3de8c8';
		const cssVars = getComputedStyle(document.documentElement);
		const themeTick = cssVars.getPropertyValue('--theme-text-secondary').trim() || '#9a8f7a';
		const baseOpts = getChartOptions(isMobile);
		const labels = jerkProfile.data.map((d: any) => d.timeS.toFixed(2));

		chartInstance = new Chart(jerkChartEl, {
			type: 'line',
			data: {
				labels,
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
	}

	$effect(() => {
		jerkProfile;
		isMobile;
		jerkChartEl;
		if (jerkChartEl && jerkProfile?.data?.length) setTimeout(() => renderJerkChart(), 0);
	});

	function fmt(n: number | null | undefined, dec = 2, suffix = '') {
		if (n === null || n === undefined) return '—';
		return n.toFixed(dec) + suffix;
	}

	function scoreColor(score: number) {
		if (score >= 80) return '#3de8c8';
		if (score >= 60) return '#f5a623';
		if (score >= 40) return '#ffcc44';
		return '#ff4444';
	}

	function effPct(value: number) {
		return Math.round(value * 100);
	}
</script>

<section class="space-y-5">
	<div>
		<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Expert diagnostics</p>
		<h2 class="themed-text-primary mt-1 text-xl font-bold">Trace and phase detail</h2>
		<p class="themed-text-secondary mt-1 max-w-3xl text-sm">
			These views explain the underlying signal and derived phases in more detail than the Analysis layer.
		</p>
	</div>

	{#if jerkProfile && jerkProfile.data.length > 0}
		<div class="themed-card rounded-xl p-5">
			<div class="mb-1 flex flex-wrap items-center justify-between gap-2">
				<h3 class="themed-text-primary text-sm font-semibold">Force Application (Jerk)</h3>
				<span class="themed-text-secondary text-xs">Rate of change of acceleration</span>
			</div>
			<p class="themed-text-subtle mb-4 text-xs">Smooth jerk = fluid technique · Spikes = abrupt force changes</p>
			<div class={isMobile ? 'h-36' : 'h-44'}><canvas bind:this={jerkChartEl}></canvas></div>
			<div class="mt-4">
				<div class="mb-1 flex items-center justify-between text-xs">
					<span class="themed-text-secondary">Smoothness score</span>
					<span class="font-bold" style="color:{scoreColor(jerkProfile.smoothnessScore)}">{Math.round(jerkProfile.smoothnessScore)}/100</span>
				</div>
				<div class="h-1.5 w-full rounded-full bg-[color:var(--border)]">
					<div class="h-1.5 rounded-full" style="width:{jerkProfile.smoothnessScore}%; background:{scoreColor(jerkProfile.smoothnessScore)}"></div>
				</div>
				<p class="themed-text-secondary mt-2 text-xs italic">{jerkProfile.insight}</p>
			</div>
		</div>
	{/if}

	{#if phaseMetrics}
		<div class="themed-card rounded-xl p-5">
			<div class="mb-1 flex items-center gap-2">
				<h3 class="themed-text-primary text-sm font-semibold">Detailed Phase Analysis</h3>
				<HelpButton label="Phase Analysis" onclick={() => onOpenHelp('phaseAnalysis')} />
			</div>
			<p class="themed-text-subtle mb-5 text-xs">Drive → Transition → Velocity — how force develops across the gate start</p>
			<div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div class="themed-nested-card rounded-xl border border-[#f5a623]/20 p-4">
					<p class="mb-3 text-sm font-semibold text-[#f5a623]">Drive Phase</p>
					<div class="space-y-2 text-xs">
						<div class="flex justify-between gap-3"><span class="themed-text-subtle">Duration</span><span class="themed-text-primary font-medium">{phaseMetrics.drivePhase.durationS}s</span></div>
						<div class="flex justify-between gap-3"><span class="themed-text-subtle">Peak accel</span><span class="themed-text-primary font-medium">{fmt(phaseMetrics.drivePhase.peakAccelMs2, 2, ' m/s²')}</span></div>
						<div class="flex justify-between gap-3"><span class="themed-text-subtle">Time to peak</span><span class="themed-text-primary font-medium">{phaseMetrics.drivePhase.timeToPeakS}s</span></div>
						<div class="flex justify-between gap-3"><span class="themed-text-subtle">Efficiency</span><span class="font-bold" style="color:{scoreColor(effPct(phaseMetrics.drivePhase.efficiency))}">{effPct(phaseMetrics.drivePhase.efficiency)}%</span></div>
					</div>
				</div>
				<div class="themed-nested-card rounded-xl border border-[#ffcc44]/20 p-4">
					<p class="mb-3 text-sm font-semibold text-[#ffcc44]">Transition Phase</p>
					<div class="space-y-2 text-xs">
						<div class="flex justify-between gap-3"><span class="themed-text-subtle">Duration</span><span class="themed-text-primary font-medium">{phaseMetrics.transitionPhase.durationS}s</span></div>
						<div class="flex justify-between gap-3"><span class="themed-text-subtle">Velocity at end</span><span class="themed-text-primary font-medium">{fmt(phaseMetrics.transitionPhase.velocityAtEndMs, 2, ' m/s')}</span></div>
						<div class="flex justify-between gap-3"><span class="themed-text-subtle">Efficiency</span><span class="font-bold" style="color:{scoreColor(effPct(phaseMetrics.transitionPhase.transitionEfficiency))}">{effPct(phaseMetrics.transitionPhase.transitionEfficiency)}%</span></div>
					</div>
				</div>
				<div class="themed-nested-card rounded-xl border border-[#3de8c8]/20 p-4">
					<p class="mb-3 text-sm font-semibold text-[#3de8c8]">Velocity Phase</p>
					<div class="space-y-2 text-xs">
						<div class="flex justify-between gap-3"><span class="themed-text-subtle">Duration</span><span class="themed-text-primary font-medium">{phaseMetrics.velocityPhase.durationS}s</span></div>
						<div class="flex justify-between gap-3"><span class="themed-text-subtle">Peak velocity</span><span class="themed-text-primary font-medium">{fmt(phaseMetrics.velocityPhase.peakVelocityMs, 2, ' m/s')}</span></div>
						<div class="flex justify-between gap-3"><span class="themed-text-subtle">Time to max</span><span class="themed-text-primary font-medium">{phaseMetrics.velocityPhase.timeToMaxS}s</span></div>
						<div class="flex justify-between gap-3"><span class="themed-text-subtle">Maintenance</span><span class="font-bold" style="color:{scoreColor(effPct(phaseMetrics.velocityPhase.maintenanceScore))}">{effPct(phaseMetrics.velocityPhase.maintenanceScore)}%</span></div>
					</div>
				</div>
			</div>
			<div class="themed-nested-card rounded-lg border border-[color:var(--border)] p-4">
				<p class="themed-accent mb-1 text-xs font-semibold">Technical assessment</p>
				<p class="themed-text-secondary text-sm">{phaseMetrics.technicalAssessment}</p>
			</div>
		</div>
	{/if}

	{#if splits.length > 0}
		<div class="themed-card rounded-xl p-5">
			<h3 class="themed-text-primary mb-4 text-sm font-semibold">Acceleration Splits — Run {selectedRun.run_number}</h3>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[400px] text-sm">
					<caption class="sr-only">Acceleration splits for run {selectedRun.run_number}</caption>
					<thead><tr class="border-b border-[color:var(--border)]">{#each ['Target', 'Time', 'Distance', 'Phase'] as heading}<th scope="col" class="themed-text-secondary pr-4 pb-2 text-left text-xs font-semibold tracking-wider uppercase">{heading}</th>{/each}</tr></thead>
					<tbody>
						{#each splits as split}
							<tr class="border-b border-[color:var(--border)]/50">
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

	{#if techniqueScoreBreakdown}
		<div class="themed-card rounded-xl p-5">
			<div class="mb-4 flex items-center gap-2">
				<h3 class="themed-text-primary text-base font-bold">Detailed Technique Breakdown</h3>
				<HelpButton label="Technique Breakdown" onclick={() => onOpenHelp('techniqueScore')} />
			</div>
			<p class="themed-text-secondary mb-5 text-xs">Six dimensions of gate start technique, scored 0–100 and benchmarked against {riderLevel ?? 'intermediate'} level.</p>
			<TechniqueScoreBreakdown scores={techniqueScoreBreakdown} />
		</div>
	{/if}

	{#if coachDiagnostics && coachDiagnostics.length > 0}
		<CoachDiagnosticsCard diagnostics={coachDiagnostics} />
	{/if}
</section>
