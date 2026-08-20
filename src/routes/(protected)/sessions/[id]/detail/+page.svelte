<script lang="ts">
	import { getContext } from 'svelte';
	import type { LayoutData } from '../$types';
	import PerformanceTargets from '$lib/components/PerformanceTargets.svelte';
	import DataDrillDown from '$lib/components/DataDrillDown.svelte';
	import SessionNotesManager from '$lib/components/SessionNotesManager.svelte';
	import type { SessionNote } from '$lib/types/notes';
	import SessionComparisonModal from '$lib/components/SessionComparisonModal.svelte';
	import DeepDiveRunDiagnostics from '$lib/components/session/DeepDiveRunDiagnostics.svelte';
	import {
		computeSessionStability,
		computeGForceStability,
		getStabilityInsight
	} from '$lib/performance-engine/sessionAnalysis';

	let { data }: { data: LayoutData } = $props();
	const ctx: any = getContext('session');

	let selectedRun = $derived(ctx.selectedRun);
	let selectedGate = $derived(ctx.selectedGate);
	let riderLevel = $derived(ctx.riderLevel);
	let performanceAnalysis = $derived(ctx.performanceAnalysis);
	let techniqueScores = $derived(ctx.techniqueScores);
	let techniqueScoreBreakdown = $derived(ctx.techniqueScoreBreakdown);
	let coachDiagnostics = $derived(ctx.coachDiagnostics);
	let jerkProfile = $derived(ctx.jerkProfile);
	let weaknesses = $derived(ctx.weaknesses);
	let recommendations = $derived(ctx.recommendations);
	let isMobile = $derived(ctx.isMobile);

	let chartData = $derived((selectedRun?.chart_data as number[]) ?? []);
	let elapsedMs = $derived(selectedRun?.elapsed_time_ms ?? 2000);

	let sessionStability = $derived.by(() => {
		if (data.runs.length < 2) return [];
		return computeSessionStability(
			data.runs.map((r: any) => ({
				run_number: r.run_number,
				chart_data: r.chart_data as number[],
				elapsed_time_ms: r.elapsed_time_ms
			}))
		);
	});

	let currentStability = $derived.by(() => {
		if (!chartData.length) return null;
		return computeGForceStability(chartData, elapsedMs);
	});

	let stabilityInsight = $derived.by(() => {
		if (sessionStability.length < 2 || currentStability === null)
			return 'Single run — no comparison available';
		return getStabilityInsight(currentStability, sessionStability);
	});

	let drillDownData = $derived(
		chartData.map((value: number, idx: number) => ({
			timeS: (idx / (chartData.length > 1 ? chartData.length - 1 : 1)) * (elapsedMs / 1000),
			value
		}))
	);

	let totalMassKg = $derived(
		(data.riderWeight ?? 0) + (data.bikeWeight ?? 0) > 0
			? (data.riderWeight ?? 0) + (data.bikeWeight ?? 0)
			: null
	);

	let showComparison = $state(false);

	function scoreColor(s: number) {
		if (s >= 80) return '#3de8c8';
		if (s >= 60) return '#f5a623';
		if (s >= 40) return '#ffcc44';
		return '#ff4444';
	}

	const priorityColor: Record<string, string> = {
		high: '#ff4444',
		medium: '#f5a623',
		low: '#9a8f7a'
	};
</script>

<svelte:head><title>Deep Dive — AppGatePro</title></svelte:head>

<div class="space-y-5">
	<div>
		<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Deep Dive</p>
		<h2 class="themed-text-primary mt-1 text-xl font-bold">Inspect the evidence behind the run</h2>
		<p class="themed-text-secondary mt-1 max-w-3xl text-sm">
			Start with evidence quality and the recorded signal, then work through derived force, phase and technique diagnostics.
		</p>
	</div>

	{#if selectedRun && selectedGate}
		<!-- Evidence quality comes before derived interpretation. -->
		{#if performanceAnalysis.hasCalibrationWarning || !totalMassKg}
			<section class="space-y-3" aria-labelledby="evidence-quality-heading">
				<div>
					<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Before interpreting</p>
					<h3 id="evidence-quality-heading" class="themed-text-primary mt-1 text-base font-bold">Evidence quality</h3>
				</div>

				{#if performanceAnalysis.hasCalibrationWarning}
					<div class="rounded-xl border border-[#ff4444]/20 bg-[#0a0809] p-4">
						<p class="mb-1 text-sm font-semibold text-[#ff4444]">Calibration warning</p>
						<p class="mb-2 text-xs text-[#9a8f7a]">Some physics values appear outside normal ranges. Power and speed estimates may be unreliable.</p>
						{#if performanceAnalysis.diagnostics}
							<div class="space-y-1">
								{#each performanceAnalysis.diagnostics.filter((d: any) => d.severity === 'error') as diag}
									<p class="text-xs text-[#9a8f7a]"><span class="text-[#ff4444]">•</span> {diag.message}{#if diag.suggestion}<span class="text-[#6b5f4d]"> — {diag.suggestion}</span>{/if}</p>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				{#if !totalMassKg}
					<div class="rounded-xl border border-[#f5a623]/20 bg-[#131010] p-4 text-sm">
						<p class="mb-1 font-medium text-[#f5a623]">Mass-dependent analytics unavailable</p>
						<p class="text-[#9a8f7a]">Add rider and bike weight in <a href="/profile" class="rounded text-[#f5a623] hover:underline focus:ring-1 focus:ring-[#f5a623] focus:outline-none">your profile</a> to unlock power and impulse analysis.</p>
					</div>
				{/if}
			</section>
		{/if}

		<section class="space-y-3" aria-labelledby="raw-evidence-heading">
			<div>
				<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Recorded evidence</p>
				<h3 id="raw-evidence-heading" class="themed-text-primary mt-1 text-base font-bold">Selected run signal</h3>
				<p class="themed-text-secondary mt-1 text-xs">Inspect the recorded G-force trace before relying on the diagnostics derived from it.</p>
			</div>
			<DataDrillDown title="G-Force Data - Run {selectedRun.run_number}" data={drillDownData} unit="G" runNumber={selectedRun.run_number} metric="G-Force" />
		</section>

		{#if sessionStability.length > 1}
			<section class="rounded-xl border border-[#221c18] bg-[#131010] p-5" aria-labelledby="stability-heading">
				<h3 id="stability-heading" class="mb-1 text-sm font-semibold text-[#f0ece4]">Early-force stability — first 0.5s</h3>
				<p class="mb-4 text-xs text-[#6b5f4d]">Average G-force in the first 500ms of each run. Use this to inspect how repeatable the initial force application was.</p>
				<div class="flex h-24 items-end gap-2" role="img" aria-label="G-force stability comparison across runs">
					{#each sessionStability as s}
						{@const maxStab = Math.max(...sessionStability.map((x: any) => x.stability))}
						{@const pct = maxStab > 0 ? (s.stability / maxStab) * 100 : 0}
						<div class="flex flex-1 flex-col items-center gap-1">
							<span class="text-[10px] text-[#9a8f7a]">{s.stability.toFixed(2)}G</span>
							<div class="w-full rounded-t transition-all" style="height:{pct}%; min-height:4px; background:{s.isBest ? '#f5a623' : s.runNumber === selectedRun.run_number ? '#f5a62380' : '#221c18'}"></div>
							<span class="text-[10px] text-[#6b5f4d]">#{s.runNumber}</span>
						</div>
					{/each}
				</div>
				<p class="mt-4 text-xs leading-relaxed text-[#9a8f7a]">{stabilityInsight}</p>
				<p class="mt-2 text-xs text-[#6b5f4d]">Amber = best · Highlighted = selected run</p>
			</section>
		{/if}

		<DeepDiveRunDiagnostics
			{selectedRun}
			{performanceAnalysis}
			{techniqueScoreBreakdown}
			{coachDiagnostics}
			{jerkProfile}
			{riderLevel}
			{isMobile}
			onOpenHelp={(key: string) => ctx.openHelp(key)}
		/>

		<section class="space-y-3" aria-labelledby="benchmark-heading">
			<div>
				<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Benchmark context</p>
				<h3 id="benchmark-heading" class="themed-text-primary mt-1 text-base font-bold">How this evidence compares</h3>
			</div>
			<PerformanceTargets reactionMs={selectedGate.reaction_time_ms} maxG={selectedGate.max_g} techniqueScore={techniqueScores?.overall ?? null} riderLevel={riderLevel ?? 'intermediate'} />
		</section>

		{#if weaknesses.length > 0 || recommendations.length > 0}
			<section class="space-y-3" aria-labelledby="follow-up-heading">
				<div>
					<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Expert follow-up</p>
					<h3 id="follow-up-heading" class="themed-text-primary mt-1 text-base font-bold">What to investigate next</h3>
				</div>

				{#if weaknesses.length > 0}
					<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
						<p class="mb-1 text-sm font-semibold text-[#f0ece4]">Below-threshold areas</p>
						<p class="mb-4 text-xs text-[#6b5f4d]">Metrics scoring below threshold for {riderLevel ?? 'intermediate'} level</p>
						<div class="space-y-3">
							{#each weaknesses as w}
								<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
									<div class="mb-2 flex items-center justify-between gap-3"><p class="text-sm font-semibold text-[#f0ece4]">{w.area}</p><span class="rounded px-2 py-0.5 text-xs font-bold" style="background:{scoreColor(w.score ?? 0)}20; color:{scoreColor(w.score ?? 0)}">{w.score ?? 0}/100</span></div>
									<ul class="space-y-1">{#each w.advice as tip}<li class="flex gap-2 text-xs text-[#9a8f7a]"><span class="flex-shrink-0 text-[#f5a623]" aria-hidden="true">→</span>{tip}</li>{/each}</ul>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if recommendations.length > 0}
					<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
						<p class="mb-1 text-sm font-semibold text-[#f0ece4]">Prioritised actions</p>
						<p class="mb-4 text-xs text-[#6b5f4d]">Actions derived from this run's evidence</p>
						<div class="space-y-3">
							{#each recommendations as rec}
								<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
									<div class="flex items-start gap-3"><span class="mt-0.5 flex-shrink-0 rounded px-2 py-0.5 text-xs font-bold" style="background:{priorityColor[rec.priority]}20; color:{priorityColor[rec.priority]}">{rec.priority.toUpperCase()}</span><div><p class="text-sm font-semibold text-[#f0ece4]">{rec.title}</p><p class="mt-0.5 text-xs text-[#9a8f7a]">{rec.message}</p></div></div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</section>
		{/if}
	{/if}

	<section class="space-y-3" aria-labelledby="supporting-actions-heading">
		<div>
			<p class="themed-accent text-xs font-semibold tracking-wide uppercase">Supporting record</p>
			<h3 id="supporting-actions-heading" class="themed-text-primary mt-1 text-base font-bold">Notes and reporting</h3>
		</div>

		<SessionNotesManager sessionId={data.session.id} notes={data.sessionNotes as SessionNote[]} currentUserRole="rider" />

		{#if data.previousSessionSummary}
			{@const currentSummary = {
				id: data.session.id,
				timestamp: data.session.timestamp,
				run_count: data.sessionStats.run_count,
				best_reaction_ms: data.sessionStats.best_reaction_ms,
				avg_reaction_ms: data.sessionStats.avg_reaction_ms,
				best_max_g: data.sessionStats.best_max_g,
				best_peak_speed_ms: data.sessionStats.best_peak_speed_ms,
				reaction_cv: data.sessionStats.reaction_cv,
				bike_name: (data.session.bikes as any)?.name ?? null,
				weather: (data.session as any).weather_conditions ?? null,
				surface: (data.session as any).track_surface ?? null
			}}
			<button onclick={() => (showComparison = true)} class="group w-full rounded-xl border border-[#221c18] bg-[#131010] p-5 text-left transition-colors hover:border-[#3de8c8]/40 focus:ring-2 focus:ring-[#3de8c8] focus:outline-none">
				<h4 class="text-sm font-semibold text-[#f0ece4] group-hover:text-[#3de8c8]">Compare to previous session</h4>
				<p class="mt-1 text-xs text-[#6b5f4d]">Existing session-to-session comparison; Phase 8 will decide its longer-term home.</p>
			</button>
			<SessionComparisonModal session1={data.previousSessionSummary} session2={currentSummary} bind:open={showComparison} />
		{/if}

		<button onclick={() => ctx.openReport()} class="group w-full rounded-xl border border-[#221c18] bg-[#131010] p-5 text-left transition-colors hover:border-[#f5a623]/40 focus:ring-2 focus:ring-[#f5a623] focus:outline-none">
			<h4 class="text-sm font-semibold text-[#f0ece4] group-hover:text-[#f5a623]">Generate session report</h4>
			<p class="mt-1 text-xs text-[#6b5f4d]">Create the existing coaching report with its configurable options.</p>
		</button>
	</section>
</div>
