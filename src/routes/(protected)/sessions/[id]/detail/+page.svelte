<script lang="ts">
	import { getContext } from 'svelte';
	import type { LayoutData } from '../$types';
	import RunComparison from '$lib/components/RunComparison.svelte';
	import PerformanceTargets from '$lib/components/PerformanceTargets.svelte';
	import DataDrillDown from '$lib/components/DataDrillDown.svelte';
	import SessionNotesManager from '$lib/components/SessionNotesManager.svelte';
	import type { SessionNote } from '$lib/types/notes';
	import SessionComparisonModal from '$lib/components/SessionComparisonModal.svelte';
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
	let weaknesses = $derived(ctx.weaknesses);
	let recommendations = $derived(ctx.recommendations);

	// ── Comparison runs ────────────────────────────────────────────────────────
	let comparisonRuns = $derived(
		performanceAnalysis.runs.map((r: any, idx: number) => ({
			runNumber: r.runNumber ?? idx + 1,
			reactionMs: r.reactionMs,
			maxG: r.maxG,
			peakSpeedKmh:
				r.physics?.measuredPeakSpeedKmh ??
				(r.physics?.speedKmh?.length ? Math.max(...r.physics.speedKmh) : null),
			techniqueScore: r.technique?.overall ?? null,
			elapsedMs: r.elapsedMs,
			speedProfile: r.physics?.speedProfile ?? '—'
		}))
	);

	// ── Stability ──────────────────────────────────────────────────────────────
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

	// ── Drill-down data ────────────────────────────────────────────────────────
	let drillDownData = $derived(
		chartData.map((value: number, idx: number) => ({
			timeS: (idx / (chartData.length > 1 ? chartData.length - 1 : 1)) * (elapsedMs / 1000),
			value
		}))
	);

	// ── Mass check ────────────────────────────────────────────────────────────
	let totalMassKg = $derived(
		(data.riderWeight ?? 0) + (data.bikeWeight ?? 0) > 0
			? (data.riderWeight ?? 0) + (data.bikeWeight ?? 0)
			: null
	);

	// ── Session comparison ─────────────────────────────────────────────────────
	let showComparison = $state(false);

	// ── Helpers ────────────────────────────────────────────────────────────────
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

<svelte:head>
	<title>Deep Dive — AppGatePro</title>
</svelte:head>

<div class="space-y-5">
	{#if selectedRun && selectedGate}
		<!-- ══════════════════════════════════════════════════════
             RUN COMPARISON
             ══════════════════════════════════════════════════════ -->
		{#if data.runs.length > 1}
			<RunComparison runs={comparisonRuns} />
		{/if}

		<!-- ══════════════════════════════════════════════════════
             PERFORMANCE TARGETS
             ══════════════════════════════════════════════════════ -->
		<PerformanceTargets
			reactionMs={selectedGate.reaction_time_ms}
			maxG={selectedGate.max_g}
			techniqueScore={techniqueScores?.overall ?? null}
			riderLevel={riderLevel ?? 'intermediate'}
		/>

		<!-- ══════════════════════════════════════════════════════
             G-FORCE STABILITY
             ══════════════════════════════════════════════════════ -->
		{#if sessionStability.length > 1}
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
				<h3 class="mb-1 text-sm font-semibold text-[#f0ece4]">G-Force Stability — First 0.5s</h3>
				<p class="mb-4 text-xs text-[#6b5f4d]">
					Average G-force applied in the first 500ms of each run. Higher = more aggressive initial
					stroke · Consistency = repeatable technique.
				</p>
				<div
					class="flex h-24 items-end gap-2"
					role="img"
					aria-label="G-force stability comparison across runs"
				>
					{#each sessionStability as s}
						{@const maxStab = Math.max(...sessionStability.map((x: any) => x.stability))}
						{@const pct = maxStab > 0 ? (s.stability / maxStab) * 100 : 0}
						<div class="flex flex-1 flex-col items-center gap-1">
							<span class="text-[10px] text-[#9a8f7a]">{s.stability.toFixed(2)}G</span>
							<div
								class="w-full rounded-t transition-all"
								style="height:{pct}%; min-height:4px; background:{s.isBest
									? '#f5a623'
									: s.runNumber === selectedRun.run_number
										? '#f5a62380'
										: '#221c18'}"
							></div>
							<span class="text-[10px] text-[#6b5f4d]">#{s.runNumber}</span>
						</div>
					{/each}
				</div>
				<div
					class="mt-4 flex items-start gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-3"
				>
					<svg
						class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#f5a623]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p class="text-xs leading-relaxed text-[#9a8f7a]">{stabilityInsight}</p>
				</div>
				<p class="mt-2 text-xs text-[#6b5f4d]">Amber = best · Highlighted = selected run</p>
			</div>
		{/if}

		<!-- ══════════════════════════════════════════════════════
             WARNINGS
             ══════════════════════════════════════════════════════ -->
		{#if !totalMassKg}
			<div class="rounded-xl border border-[#f5a623]/20 bg-[#131010] p-4 text-sm">
				<p class="mb-1 font-medium text-[#f5a623]">Power analytics locked</p>
				<p class="text-[#9a8f7a]">
					Add your weight and bike weight in
					<a
						href="/profile"
						class="rounded text-[#f5a623] hover:underline focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
						>your profile</a
					>
					to unlock power and impulse analysis.
				</p>
			</div>
		{/if}

		{#if performanceAnalysis.hasCalibrationWarning}
			<div class="rounded-xl border border-[#ff4444]/20 bg-[#0a0809] p-4">
				<div class="flex items-start gap-3">
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#ff4444]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div class="flex-1">
						<p class="mb-1 text-sm font-semibold text-[#ff4444]">Calibration Warning</p>
						<p class="mb-2 text-xs text-[#9a8f7a]">
							Some physics values appear outside normal ranges. Power and speed estimates may be
							unreliable.
						</p>
						{#if performanceAnalysis.diagnostics}
							<div class="space-y-1">
								{#each performanceAnalysis.diagnostics.filter((d: any) => d.severity === 'error') as diag}
									<p class="text-xs text-[#9a8f7a]">
										<span class="text-[#ff4444]">•</span>
										{diag.message}
										{#if diag.suggestion}<span class="text-[#6b5f4d]">— {diag.suggestion}</span
											>{/if}
									</p>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- ══════════════════════════════════════════════════════
             DATA DRILL-DOWN
             ══════════════════════════════════════════════════════ -->
		<DataDrillDown
			title="G-Force Data - Run {selectedRun.run_number}"
			data={drillDownData}
			unit="G"
			runNumber={selectedRun.run_number}
			metric="G-Force"
		/>

		<!-- ══════════════════════════════════════════════════════
             WEAKNESSES + RECOMMENDATIONS
             ══════════════════════════════════════════════════════ -->
		{#if weaknesses.length > 0}
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
				<h3 class="mb-1 text-sm font-semibold text-[#f0ece4]">Areas for Improvement</h3>
				<p class="mb-4 text-xs text-[#6b5f4d]">
					Metrics scoring below threshold for {riderLevel ?? 'intermediate'} level
				</p>
				<div class="space-y-3">
					{#each weaknesses as w}
						<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
							<div class="mb-2 flex items-center justify-between">
								<p class="text-sm font-semibold text-[#f0ece4]">{w.area}</p>
								<span
									class="rounded px-2 py-0.5 text-xs font-bold"
									style="background:{scoreColor(w.score ?? 0)}20; color:{scoreColor(w.score ?? 0)}"
								>
									{w.score ?? 0}/100
								</span>
							</div>
							<ul class="space-y-1">
								{#each w.advice as tip}
									<li class="flex gap-2 text-xs text-[#9a8f7a]">
										<span class="flex-shrink-0 text-[#f5a623]" aria-hidden="true">→</span>{tip}
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if recommendations.length > 0}
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
				<h3 class="mb-1 text-sm font-semibold text-[#f0ece4]">💡 Recommendations</h3>
				<p class="mb-4 text-xs text-[#6b5f4d]">Prioritised actions based on this run's data</p>
				<div class="space-y-3">
					{#each recommendations as rec}
						<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
							<div class="flex items-start gap-3">
								<span
									class="mt-0.5 flex-shrink-0 rounded px-2 py-0.5 text-xs font-bold"
									style="background:{priorityColor[rec.priority]}20; color:{priorityColor[
										rec.priority
									]}"
								>
									{rec.priority.toUpperCase()}
								</span>
								<div>
									<p class="text-sm font-semibold text-[#f0ece4]">{rec.title}</p>
									<p class="mt-0.5 text-xs text-[#9a8f7a]">{rec.message}</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- ══════════════════════════════════════════════════════
         SESSION NOTES
         ══════════════════════════════════════════════════════ -->
	<SessionNotesManager
		sessionId={data.session.id}
		notes={data.sessionNotes as SessionNote[]}
		currentUserRole="rider"
	/>

	<!-- ══════════════════════════════════════════════════════
         COMPARE TO PREVIOUS SESSION
         ══════════════════════════════════════════════════════ -->
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
		<button
			onclick={() => (showComparison = true)}
			class="group w-full rounded-xl border border-[#221c18] bg-[#131010] p-5
                   text-left transition-colors hover:border-[#3de8c8]/40
                   focus:ring-2 focus:ring-[#3de8c8] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none"
		>
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3de8c8]/10 transition-colors group-hover:bg-[#3de8c8]/20"
					>
						<svg
							class="h-5 w-5 text-[#3de8c8]"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
					</div>
					<div>
						<h3
							class="mb-0.5 text-sm font-semibold text-[#f0ece4] transition-colors group-hover:text-[#3de8c8]"
						>
							📊 Compare to Previous Session
						</h3>
						<p class="text-xs text-[#6b5f4d]">
							See how your performance changed session-to-session
						</p>
					</div>
				</div>
				<svg
					class="h-5 w-5 text-[#6b5f4d] transition-colors group-hover:text-[#3de8c8]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</button>

		<SessionComparisonModal
			session1={data.previousSessionSummary}
			session2={currentSummary}
			bind:open={showComparison}
		/>
	{/if}

	<!-- ══════════════════════════════════════════════════════
         REPORT BUTTON
         ══════════════════════════════════════════════════════ -->
	<button
		onclick={() => ctx.openReport()}
		class="group w-full rounded-xl border border-[#221c18] bg-[#131010] p-5
               text-left transition-colors hover:border-[#f5a623]/40
               focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none"
	>
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5a623]/10 transition-colors group-hover:bg-[#f5a623]/20"
				>
					<svg class="h-5 w-5 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				</div>
				<div>
					<h3
						class="mb-0.5 text-sm font-semibold text-[#f0ece4] transition-colors group-hover:text-[#f5a623]"
					>
						📄 Generate Session Report
					</h3>
					<p class="text-xs text-[#6b5f4d]">
						Create professional coaching report with customizable options
					</p>
				</div>
			</div>
			<svg
				class="h-5 w-5 text-[#6b5f4d] transition-colors group-hover:text-[#f5a623]"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</div>
	</button>
</div>
