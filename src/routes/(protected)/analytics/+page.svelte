<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import ExportButton from '$lib/components/ExportButton.svelte';
	import HelpPanel from '$lib/components/HelpPanel.svelte';
	import { TrainingInsightsPanel } from '$lib/components/performance-insights';
	import {
		PerformanceOverview,
		PerformancePatternsSection,
		TechniqueQualityTrend,
		DataQualityTrend,
		PowerOutputTrend,
		SmoothnessTrend,
		WheeliePatternAnalysis,
		CorrelationInsightsPanel,
		TechniqueScoreTrends,
		DiagnosticPatternsCard,
		StrengthsLimitersEvolution
	} from '$lib/components/analytics';
	import RawPerformanceTrendsSection from '$lib/components/analytics/RawPerformanceTrendsSection.svelte';
	import { analyseSessionIntelligence } from '$lib/performance-engine';
	import {
		analyseCrossSessionIntelligence,
		buildSessionPerformanceSummary
	} from '$lib/performance-engine/crossSession';
	import { applyTruthRulesToReport } from '$lib/performance-engine/crossSession/truthRules';
	import { rateSessionMetrics } from '$lib/performance-engine/thresholds';
	import { buildProgressReport, buildProgressChartSeries } from '$lib/report-engine';
	import { ReportPreview } from '$lib/components/reports';
	import type { GeneratedReport, ReportDetailLevel } from '$lib/report-engine/types';
	import type { ProgressChartSessionPoint } from '$lib/report-engine/progressCharts';
	import { buildProgressTrendEvidence } from '$lib/analytics/progressTrendEvidence';

	let { data }: { data: PageData } = $props();

	let isMobile = $state(false);
	let helpKey = $state('');
	let helpOpen = $state(false);
	let progressReport: GeneratedReport | null = $state(null);
	let generatingProgress = $state(false);
	let showProgressReport = $state(false);
	let showProgressOptions = $state(false);
	let progressDetailLevel = $state<ReportDetailLevel>('coach');
	let progressIncludeCharts = $state(true);
	let progressIncludeDiag = $state(true);
	let progressIncludeGoals = $state(false);

	function openHelp(key: string) {
		helpKey = key;
		helpOpen = true;
	}

	onMount(() => {
		isMobile = window.innerWidth < 640;
		const handleResize = () => (isMobile = window.innerWidth < 640);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	let allSessionReports = $derived.by(() =>
		data.sessions
			.map((session) => {
				const runs = data.allRuns
					.filter((r) => r.session_id === session.id)
					.map((r) => ({
						reactionMs: r.reaction_time_ms,
						peakSpeed: r.peak_speed_ms ? r.peak_speed_ms * 3.6 : null,
						maxG: r.max_g
					}));
				if (runs.length === 0) return null;
				return { sessionId: session.id, intelligence: analyseSessionIntelligence(runs) };
			})
			.filter(Boolean)
	);

	let latestSessionReport = $derived.by(() => {
		const report = allSessionReports[allSessionReports.length - 1];
		return report ? report.intelligence : null;
	});

	let sessionIntelligenceSummaries = $derived.by(() =>
		data.sessions.map((session) => {
			const report = allSessionReports.find((item) => item?.sessionId === session.id);
			return buildSessionPerformanceSummary(
				{
					sessionId: session.id,
					date: session.timestamp,
					runCount: session.run_count,
					bestReactionMs: session.best_reaction_ms,
					avgReactionMs: session.avg_reaction_ms,
					bestPeakSpeedMs: session.best_peak_speed_ms,
					avgPeakSpeedMs: session.avg_peak_speed_ms,
					bestMaxG: session.best_max_g,
					avgMaxG: session.avg_max_g,
					weatherCondition: (session as any).weather_conditions ?? null,
					trackSurface: (session as any).track_surface ?? null,
					sessionFocus: (session as any).session_focus ?? null,
					rideFeel: (session as any).ride_feel ?? null,
					bikeId: (session as any).bike_id ?? null,
					riderProfileId: (session as any).rider_profile_id ?? null
				},
				report?.intelligence ?? null
			);
		})
	);

	let crossSessionReport = $derived.by(() => {
		if (data.sessionCount < 3) return null;
		return applyTruthRulesToReport(analyseCrossSessionIntelligence(sessionIntelligenceSummaries));
	});

	let latestSessionRatings = $derived.by(() => {
		if (data.sessions.length === 0) return null;
		const latest = data.sessions[data.sessions.length - 1];
		return rateSessionMetrics(
			{
				reactionTimeMs: latest.best_reaction_ms,
				peakSpeedKmh: latest.best_peak_speed_ms ? latest.best_peak_speed_ms * 3.6 : null,
				peakG: latest.best_max_g,
				repeatabilityScore: latestSessionReport?.repeatability.overall ?? null,
				bestVsAvgGapPercent: latestSessionReport?.bestVsAvg?.gapPercent ?? null
			},
			'rider'
		);
	});

	let performancePatternsData = $derived.by(() =>
		data.sessions.map((session) => {
			const report = allSessionReports.find((item) => item?.sessionId === session.id);
			const intelligence = report?.intelligence;
			return {
				id: session.id,
				timestamp: session.timestamp,
				bestVsAvgGapPercent: intelligence?.bestVsAvg?.gapPercent ?? null,
				optimalSetLength: intelligence?.setLength.optimal ?? null,
				dropOffRun: intelligence?.dropOff?.dropOffRun ?? null,
				best_peak_speed_ms: session.best_peak_speed_ms,
				reaction_cv: session.reaction_cv
			};
		})
	);

	let trendEvidence = $derived.by(() =>
		buildProgressTrendEvidence(
			data.sessions.map((session) => ({ id: session.id, timestamp: session.timestamp })),
			(data as any).sessionAnalyses ?? [],
			data.allRuns
		)
	);

	let hasTechniqueEvidence = $derived(trendEvidence.some((point) => point.techniqueOverall !== null));
	let hasSmoothnessEvidence = $derived(trendEvidence.some((point) => point.smoothness !== null));
	let hasPowerEvidence = $derived(
		trendEvidence.some((point) => point.powerPeakW !== null || point.powerAverageW !== null)
	);
	let hasQualityEvidence = $derived(
		trendEvidence.some((point) => point.dataQualityBias !== null || point.dataQualityValid !== null)
	);

	let wheelieData = $derived(
		data.sessions.map((session, index) => {
			const sessionRuns = data.allRuns.filter((r) => r.session_id === session.id);
			const wheelieRuns = sessionRuns.filter((r) => r.front_wheel_lifted === true);
			const nonWheelieRuns = sessionRuns.filter((r) => r.front_wheel_lifted !== true);
			const avgReaction = (runs: typeof sessionRuns) => {
				const valid = runs.filter((r) => r.reaction_time_ms !== null);
				return valid.length
					? valid.reduce((sum, run) => sum + run.reaction_time_ms!, 0) / valid.length
					: null;
			};
			return {
				sessionDate: new Date(session.timestamp).toLocaleDateString('en-GB', {
					day: 'numeric',
					month: 'short'
				}),
				sessionNumber: index + 1,
				wheelieRate: sessionRuns.length ? (wheelieRuns.length / sessionRuns.length) * 100 : 0,
				avgReactionMs: avgReaction(sessionRuns),
				avgReactionWithWheelieMs: wheelieRuns.length ? avgReaction(wheelieRuns) : null,
				avgReactionWithoutWheelieMs: nonWheelieRuns.length ? avgReaction(nonWheelieRuns) : null
			};
		})
	);

	let progressChartPoints = $derived.by((): ProgressChartSessionPoint[] =>
		sessionIntelligenceSummaries.map((summary, index) => {
			const evidence = trendEvidence.find((point) => point.sessionId === summary.sessionId);
			const sessionRuns = data.allRuns.filter((run) => run.session_id === summary.sessionId);
			const wheelieCount = sessionRuns.filter((run) => run.front_wheel_lifted).length;
			return {
				sessionId: summary.sessionId,
				sessionIndex: index + 1,
				date: summary.date as string,
				bestReactionTimeSec: summary.bestReactionTimeSec,
				avgReactionTimeSec: summary.avgReactionTimeSec,
				bestVsAvgGapPercent: summary.bestVsAvgGapPercent,
				optimalSetLength: summary.optimalSetLength,
				dropOffRun: summary.dropOffRun,
				runCount: summary.runCount,
				techniqueOverall: evidence?.techniqueOverall ?? null,
				smoothness: evidence?.smoothness ?? null,
				powerAverageW: evidence?.powerAverageW ?? null,
				dataQualityBias: evidence?.dataQualityBias ?? null,
				dataQualityValid: evidence?.dataQualityValid ?? null,
				wheelieRatePercent: sessionRuns.length ? (wheelieCount / sessionRuns.length) * 100 : null
			};
		})
	);

	let diagnosticPatterns = $derived.by(() => {
		const patterns = new Map<string, { issue: string; occurrences: number; lastSeen: string; tone: string }>();
		for (const session of (data as any).sessionAnalyses ?? []) {
			for (const diagnostic of session.diagnostics ?? []) {
				const existing = patterns.get(diagnostic.title);
				if (existing) {
					existing.occurrences += 1;
					existing.lastSeen = session.timestamp;
				} else {
					patterns.set(diagnostic.title, {
						issue: diagnostic.title,
						occurrences: 1,
						lastSeen: session.timestamp,
						tone: diagnostic.tone
					});
				}
			}
		}
		return Array.from(patterns.values())
			.sort((a, b) => b.occurrences - a.occurrences)
			.slice(0, 5);
	});

	let techniqueScoreData = $derived.by(() =>
		((data as any).sessionAnalyses ?? []).map((session: any, index: number) => ({
			sessionDate: new Date(session.timestamp).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short'
			}),
			sessionNumber: index + 1,
			overall: session.techniqueScores?.overall ?? null,
			launchQuality: session.insightPack?.scores?.launchQuality ?? null,
			explosiveness: session.insightPack?.scores?.explosiveness ?? null,
			speedCarry: session.insightPack?.scores?.speedCarry ?? null,
			smoothness: session.insightPack?.scores?.smoothness ?? null,
			impulseTiming: session.insightPack?.scores?.impulseTiming ?? null,
			repeatability: session.insightPack?.scores?.repeatability ?? null
		}))
	);

	let sessionInsights = $derived.by(() =>
		((data as any).sessionAnalyses ?? []).map((session: any) => ({
			sessionId: session.sessionId,
			timestamp: session.timestamp,
			strengths: session.insightPack?.strengths ?? [],
			limiters: session.insightPack?.limiters ?? []
		}))
	);

	async function generateProgressReport() {
		generatingProgress = true;
		try {
			const recommendations = (crossSessionReport?.recommendations ?? [])
				.filter((recommendation: string) => recommendation?.trim().length > 10)
				.slice(0, 5)
				.map((recommendation: string, index: number) => ({
					id: `progress-rec-${index}`,
					title: recommendation.split(':')[0]?.trim() ?? `Focus ${index + 1}`,
					body: recommendation,
					priority: (index === 0 ? 'high' : 'medium') as 'high' | 'medium' | 'low'
				}));

			const firstDate = data.sessions[0]?.timestamp;
			const lastDate = data.sessions[data.sessions.length - 1]?.timestamp;
			const dateRange =
				firstDate && lastDate && data.sessions.length >= 2
					? `${new Date(firstDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(lastDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
					: undefined;

			const goalContext =
				progressIncludeGoals && data.goalTargets
					? Object.entries(data.goalTargets).map(([metric, goal]: [string, any]) => {
							const lowerIsBetter = ['reactionTime', 'elapsedTime', 'accelerationPhase'].includes(metric);
							const start = goal.start ?? goal.current;
							const target = goal.target;
							const current = goal.current;
							let percentToGoal: number | null = null;
							if (current != null && target != null && start != null && start !== target) {
								percentToGoal = Math.round(
									Math.min(
										100,
										Math.max(
											0,
											lowerIsBetter
												? ((start - current) / (start - target)) * 100
												: ((current - start) / (target - start)) * 100
										)
									)
								);
							}
							return { metric, targetValue: target, currentValue: current, percentToGoal };
						})
					: null;

			const progressInput = {
				riderName: (data.profile as any)?.name ?? (data.profile as any)?.display_name ?? undefined,
				sessionCount: data.sessionCount,
				dateRange,
				personalBests: {
					bestReactionMs: data.personalBests?.reaction_ms ?? null,
					bestPeakSpeedKmh: data.personalBests?.peak_speed_ms
						? data.personalBests.peak_speed_ms * 3.6
						: null,
					bestMaxG: data.personalBests?.max_g ?? null
				},
				crossSessionReport: crossSessionReport ?? undefined,
				reactionTrendPercent: data.trend?.reaction ?? null,
				speedTrendPercent: data.trend?.speed ?? null,
				recommendations,
				goalContext,
				charts: progressIncludeCharts ? buildProgressChartSeries(progressChartPoints) : []
			};

			progressReport = buildProgressReport(progressInput as any, {
				detailLevel: progressDetailLevel,
				includeCharts: progressIncludeCharts,
				includeDiagnostics: progressIncludeDiag,
				includeRecommendations: true
			});
			showProgressReport = true;
			showProgressOptions = false;
		} catch (error) {
			console.error('Failed to generate progress report:', error);
		} finally {
			generatingProgress = false;
		}
	}

	async function sendProgressReportToCoach(linkId: string): Promise<boolean> {
		if (!progressReport) return false;
		try {
			const response = await fetch('/api/coach/report-shares', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ linkId, report: progressReport })
			});
			return response.ok;
		} catch (error) {
			console.error('Failed to send progress report to coach:', error);
			return false;
		}
	}
</script>

<svelte:head>
	<title>Progress — AppGatePro</title>
</svelte:head>

<div class="no-print space-y-8 pb-12">
	{#if data.sessionCount === 0}
		<section class="themed-card rounded-xl p-10 text-center">
			<h1 class="themed-text-primary text-2xl font-bold">Progress builds as you train</h1>
			<p class="themed-text-secondary mx-auto mt-2 max-w-lg text-sm">
				Upload your first session to begin a longitudinal training record. We will add trends only when there is enough evidence to support them.
			</p>
			<a href="/upload" class="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--bg)]">
				Upload first session
			</a>
		</section>
	{:else}
		<section class="themed-card rounded-xl p-6">
			<div class="flex flex-wrap items-start justify-between gap-5">
				<div class="max-w-3xl">
					<p class="themed-accent text-xs font-semibold tracking-[0.18em] uppercase">Progress</p>
					<h1 class="themed-text-primary mt-2 text-2xl font-bold sm:text-3xl">
						{crossSessionReport?.headline ?? 'Your training record is taking shape'}
					</h1>
					<p class="themed-text-secondary mt-2 text-sm leading-6">
						{data.sessionCount} eligible session{data.sessionCount === 1 ? '' : 's'} in your longitudinal record. Recent form, longer-term progression, repeatability and context are kept separate so one session is not mistaken for a trend.
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<ExportButton sessions={data.sessions} variant="secondary" />
					{#if data.sessionCount >= 3}
						<button onclick={() => (showProgressOptions = true)} class="min-h-[44px] rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--bg)]">
							Progress report
						</button>
					{/if}
				</div>
			</div>

			<div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div class="themed-nested-card rounded-lg p-4">
					<p class="themed-text-subtle text-xs">Sessions</p>
					<p class="themed-text-primary mt-1 text-xl font-bold">{data.sessionCount}</p>
				</div>
				<div class="themed-nested-card rounded-lg p-4">
					<p class="themed-text-subtle text-xs">Reaction PB</p>
					<p class="themed-text-primary mt-1 text-xl font-bold">{data.personalBests?.reaction_ms ? `${(data.personalBests.reaction_ms / 1000).toFixed(3)}s` : '—'}</p>
				</div>
				<div class="themed-nested-card rounded-lg p-4">
					<p class="themed-text-subtle text-xs">Top speed</p>
					<p class="themed-text-primary mt-1 text-xl font-bold">{data.personalBests?.peak_speed_ms ? `${(data.personalBests.peak_speed_ms * 3.6).toFixed(1)} km/h` : '—'}</p>
				</div>
				<div class="themed-nested-card rounded-lg p-4">
					<p class="themed-text-subtle text-xs">Peak G</p>
					<p class="themed-text-primary mt-1 text-xl font-bold">{data.personalBests?.max_g ? `${data.personalBests.max_g.toFixed(2)}G` : '—'}</p>
				</div>
			</div>
		</section>

		<section class="space-y-4" aria-labelledby="where-now-heading">
			<div>
				<p class="themed-text-subtle text-xs font-semibold tracking-[0.16em] uppercase">Where am I now?</p>
				<h2 id="where-now-heading" class="themed-text-primary mt-1 text-xl font-bold">Recent form, in context</h2>
				<p class="themed-text-secondary mt-1 max-w-3xl text-sm">A current snapshot, not a verdict on your direction of travel.</p>
			</div>
			<PerformanceOverview
				sessionCount={data.sessionCount}
				{crossSessionReport}
				{latestSessionRatings}
				personalBests={data.personalBests}
				{isMobile}
			/>
		</section>

		<section class="space-y-4" aria-labelledby="improving-heading">
			<div>
				<p class="themed-text-subtle text-xs font-semibold tracking-[0.16em] uppercase">Am I improving?</p>
				<h2 id="improving-heading" class="themed-text-primary mt-1 text-xl font-bold">Performance over time</h2>
				<p class="themed-text-secondary mt-1 max-w-3xl text-sm">Recorded reaction, speed and force evidence first; derived technique and power are shown only where the engine has trustworthy evidence.</p>
			</div>
			{#if data.sessionCount >= 3}
				<RawPerformanceTrendsSection
					sessions={data.sessions}
					trend={data.trend}
					{isMobile}
					onOpenHelp={openHelp}
					goalTargets={data.goalTargets}
				/>
			{:else}
				<div class="themed-card rounded-xl p-5 text-sm">
					<p class="themed-text-primary font-semibold">A direction needs more evidence.</p>
					<p class="themed-text-secondary mt-1">Complete {3 - data.sessionCount} more eligible session{3 - data.sessionCount === 1 ? '' : 's'} before Progress draws trend charts.</p>
				</div>
			{/if}

			{#if hasPowerEvidence || hasTechniqueEvidence}
				<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
					{#if hasPowerEvidence}<PowerOutputTrend data={[]} {isMobile} />{/if}
					{#if hasTechniqueEvidence}<TechniqueQualityTrend data={[]} {isMobile} />{/if}
				</div>
			{/if}
		</section>

		<section class="space-y-4" aria-labelledby="repeatable-heading">
			<div>
				<p class="themed-text-subtle text-xs font-semibold tracking-[0.16em] uppercase">How repeatable am I?</p>
				<h2 id="repeatable-heading" class="themed-text-primary mt-1 text-xl font-bold">Consistency and stability</h2>
				<p class="themed-text-secondary mt-1 max-w-3xl text-sm">Best runs matter, but repeatable starts tell a different part of the training story.</p>
			</div>
			<PerformancePatternsSection sessions={performancePatternsData} {isMobile} onOpenHelp={openHelp} />
			{#if hasSmoothnessEvidence}
				<SmoothnessTrend data={[]} {isMobile} />
			{/if}
		</section>

		<section class="space-y-4" aria-labelledby="context-heading">
			<div>
				<p class="themed-text-subtle text-xs font-semibold tracking-[0.16em] uppercase">What context matters?</p>
				<h2 id="context-heading" class="themed-text-primary mt-1 text-xl font-bold">Patterns around the riding</h2>
				<p class="themed-text-secondary mt-1 max-w-3xl text-sm">Weather, track, setup, ride feel and other context are useful only when enough comparable sessions support the pattern.</p>
			</div>
			<CorrelationInsightsPanel
				insights={data.correlationInsights ?? []}
				minSessionsRequired={10}
				currentSessionCount={data.sessionCount}
			/>
			{#if wheelieData.some((point) => point.wheelieRate > 0)}
				<WheeliePatternAnalysis data={wheelieData} {isMobile} />
			{/if}
		</section>

		<section class="space-y-4" aria-labelledby="investigate-heading">
			<div>
				<p class="themed-text-subtle text-xs font-semibold tracking-[0.16em] uppercase">Is anything worth investigating?</p>
				<h2 id="investigate-heading" class="themed-text-primary mt-1 text-xl font-bold">Fatigue, regression and recurring signals</h2>
				<p class="themed-text-secondary mt-1 max-w-3xl text-sm">These are prompts to investigate, not diagnoses. The system weighs repeated evidence and confidence before making a suggestion.</p>
			</div>
			{#if crossSessionReport}
				<TrainingInsightsPanel
					sessionReport={null}
					{crossSessionReport}
					runs={[]}
					detailLevel="rider"
					showSessionSection={false}
					showTechniqueSection={false}
					showProgressSection={true}
				/>
			{:else}
				<div class="themed-card rounded-xl p-5 text-sm">
					<p class="themed-text-secondary">At least three eligible sessions are needed before the cross-session engine looks for repeated signals.</p>
				</div>
			{/if}
			{#if diagnosticPatterns.length > 0}<DiagnosticPatternsCard patterns={diagnosticPatterns} />{/if}
		</section>

		<details class="themed-card rounded-xl p-5">
			<summary class="themed-text-primary cursor-pointer text-base font-semibold">More longitudinal evidence</summary>
			<p class="themed-text-secondary mt-2 text-sm">For riders and coaches who want the deeper derived series without making them the first thing everyone sees.</p>
			<div class="mt-5 space-y-5">
				{#if techniqueScoreData.length > 0}<TechniqueScoreTrends data={techniqueScoreData} {isMobile} />{/if}
				{#if sessionInsights.length >= 2}<StrengthsLimitersEvolution {sessionInsights} />{/if}
				{#if hasQualityEvidence}<DataQualityTrend data={[]} {isMobile} />{/if}
			</div>
		</details>

		<section class="themed-card rounded-xl p-5">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div>
					<p class="themed-text-subtle text-xs font-semibold tracking-[0.16em] uppercase">Where do I drill down?</p>
					<h2 class="themed-text-primary mt-1 text-lg font-bold">Follow the evidence back to the sessions</h2>
					<p class="themed-text-secondary mt-1 text-sm">Progress explains the longitudinal story. Session Analysis and Deep Dive remain the place to inspect the run-level evidence behind it.</p>
				</div>
				<a href="/sessions" class="themed-accent inline-flex min-h-[44px] items-center rounded-lg border border-[color:var(--accent)]/30 px-4 py-2 text-sm font-semibold">Browse sessions</a>
			</div>
		</section>
	{/if}
</div>

{#if showProgressOptions}
	<div class="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4" role="presentation" onclick={(event) => event.target === event.currentTarget && (showProgressOptions = false)}>
		<div class="themed-card my-8 w-full max-w-2xl rounded-xl p-5" role="dialog" aria-modal="true" aria-labelledby="progress-options-title">
			<div class="flex items-start justify-between gap-4">
				<div>
					<h2 id="progress-options-title" class="themed-text-primary text-lg font-bold">Generate progress report</h2>
					<p class="themed-text-secondary mt-1 text-sm">Choose how much of the longitudinal evidence to include.</p>
				</div>
				<button class="themed-text-secondary min-h-[44px] px-2" onclick={() => (showProgressOptions = false)} aria-label="Close">Close</button>
			</div>

			<div class="mt-5 grid gap-5 md:grid-cols-2">
				<fieldset>
					<legend class="themed-text-subtle mb-2 text-xs font-semibold tracking-wider uppercase">Audience</legend>
					<div class="space-y-2">
						{#each [['simple', 'Simple — rider or parent'], ['standard', 'Standard — club rider'], ['coach', 'Coach — full coaching detail'], ['technical', 'Technical — all metrics']] as option}
							<label class="themed-nested-card flex cursor-pointer items-center gap-3 rounded-lg p-3 text-sm">
								<input type="radio" bind:group={progressDetailLevel} value={option[0]} />
								<span class="themed-text-primary">{option[1]}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<fieldset>
					<legend class="themed-text-subtle mb-2 text-xs font-semibold tracking-wider uppercase">Include</legend>
					<div class="space-y-3 text-sm">
						<label class="flex items-center gap-3"><input type="checkbox" bind:checked={progressIncludeCharts} /><span class="themed-text-primary">Charts</span></label>
						<label class="flex items-center gap-3"><input type="checkbox" bind:checked={progressIncludeDiag} /><span class="themed-text-primary">Data-quality notes</span></label>
						{#if data.goalTargets && Object.keys(data.goalTargets).length > 0}
							<label class="flex items-center gap-3"><input type="checkbox" bind:checked={progressIncludeGoals} /><span class="themed-text-primary">Goal context</span></label>
						{/if}
					</div>
				</fieldset>
			</div>

			<button onclick={generateProgressReport} disabled={generatingProgress} class="mt-6 w-full rounded-lg bg-[color:var(--accent)] py-3 text-sm font-bold text-[color:var(--bg)] disabled:opacity-50">
				{generatingProgress ? 'Generating…' : 'Generate report'}
			</button>
		</div>
	</div>
{/if}

{#if showProgressReport && progressReport}
	<div class="report-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4" role="presentation" onclick={(event) => event.target === event.currentTarget && (showProgressReport = false)}>
		<div class="report-modal-dialog my-8 w-full max-w-5xl" role="dialog" aria-modal="true">
			<ReportPreview
				report={progressReport}
				onClose={() => (showProgressReport = false)}
				coachLinks={data.coachLinks ?? []}
				onSendToCoach={sendProgressReportToCoach}
			/>
		</div>
	</div>
{/if}

<div class="no-print"><HelpPanel bind:open={helpOpen} {helpKey} /></div>

<style>
	@media print {
		.report-modal-backdrop {
			position: static !important;
			inset: auto !important;
			z-index: auto !important;
			display: block !important;
			overflow: visible !important;
			background: none !important;
			padding: 0 !important;
		}
		.report-modal-dialog {
			margin: 0 !important;
			max-width: none !important;
			width: auto !important;
		}
	}
</style>
