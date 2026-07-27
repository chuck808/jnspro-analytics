<script lang="ts">
	import { getContext } from 'svelte';
	import type { LayoutData } from './$types';
	import SessionSetupStrip from '$lib/components/SessionSetupStrip.svelte';
	import CrossRunProgression from '$lib/components/CrossRunProgression.svelte';
	import SessionNarrativeCard from '$lib/components/performance-insights/SessionNarrativeCard.svelte';
	import StrengthsLimiters from '$lib/components/session/StrengthsLimiters.svelte';
	import SessionHero from '$lib/components/session/SessionHero.svelte';
	import { buildSessionNarrative } from '$lib/performance-engine/sessionNarrative';
	import { detectAchievement, buildDetectorInput } from '$lib/social';
	import SocialShareModal from '$lib/components/social/SocialShareModal.svelte';
	import { computeSessionInsights, computeSessionStats } from '$lib/performance-engine';
	import { shouldExcludeFromStats, type RunTag } from '$lib/types/runs';
	import type {
		WeatherCondition,
		TrackSurface,
		SessionFocus,
		RideFeel
	} from '$lib/types/sessionContext';
	import type { SessionInsights } from '$lib/performance-engine/computeSessionInsights';

	let { data }: { data: LayoutData } = $props();

	const ctx: any = getContext('session');

	// Pull what we need from shared context
	let sessionDate = $derived(ctx.sessionDate);
	let uciCategory = $derived(ctx.uciCategory);
	let performanceAnalysis = $derived(ctx.performanceAnalysis);
	let consistency = $derived(ctx.consistency);
	let insightPack = $derived(ctx.insightPack);
	let techniqueScoreBreakdown = $derived(ctx.techniqueScoreBreakdown);
	let riderLevel = $derived(ctx.riderLevel);

	// ── Formatting helpers ─────────────────────────────────────────────────────
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

	// ── Session narrative / intelligence (persisted) ──────────────────────────
	let sessionIntelligence = $derived(performanceAnalysis.intelligence);
	let quality = $derived(performanceAnalysis.selectedRun?.physics?.dataQuality);

	// ── First-time setup detection ─────────────────────────────────────────────
	// Same signal SessionSetupStrip computes internally as `showNudge` — a
	// session nobody's touched yet gets the setup game above the hero; once
	// context/tags exist, the hero leads and setup drops to its low-key spot.
	let hasContext = $derived(
		!!(
			(data.session as any).weather_conditions ||
			(data.session as any).track_surface ||
			(data.session as any).session_focus ||
			(data.session as any).ride_feel
		)
	);
	let hasAnyStatsTag = $derived(
		data.runs.some((r: any) => shouldExcludeFromStats(r.tags ?? null))
	);
	let isFirstTimeSetup = $derived(!hasContext && !hasAnyStatsTag && data.runs.length > 1);

	// ── Live setup-game draft state ────────────────────────────────────────────
	// Never touches `data` — only flips isFirstTimeSetup once a real save
	// triggers a page-data reload, at which point the hero switches from this
	// live preview to the real, persisted, shareable achievement.
	type ContextDraft = {
		weather: WeatherCondition | null;
		surface: TrackSurface | null;
		focus: SessionFocus | null;
		feel: RideFeel | null;
	};
	let draftContext = $state<ContextDraft | null>(null);
	let draftTagOverrides = $state<Map<string, RunTag[]>>(new Map());

	function handleDraftContextChange(draft: ContextDraft) {
		draftContext = draft;
	}
	function handleDraftRunTagsChange(runId: string, tags: RunTag[]) {
		const next = new Map(draftTagOverrides);
		next.set(runId, tags);
		draftTagOverrides = next;
	}

	let effectiveRuns = $derived(
		data.runs.map((r: any) => ({
			...r,
			tags: draftTagOverrides.get(r.id) ?? r.tags ?? null
		}))
	);
	let effectiveContext = $derived({
		weather_conditions: draftContext?.weather ?? (data.session as any).weather_conditions ?? null,
		track_surface: draftContext?.surface ?? (data.session as any).track_surface ?? null,
		session_focus: draftContext?.focus ?? (data.session as any).session_focus ?? null,
		ride_feel: draftContext?.feel ?? (data.session as any).ride_feel ?? null
	});

	let previewSessionStats = $derived(
		isFirstTimeSetup ? computeSessionStats(effectiveRuns) : data.sessionStats
	);

	let previewInsights = $derived.by((): SessionInsights | null => {
		if (!isFirstTimeSetup) return null;
		const includedRuns = effectiveRuns.filter(
			(r: any) => !shouldExcludeFromStats(r.tags ?? null)
		);
		return computeSessionInsights({
			session: { ...data.session, runs: includedRuns } as any,
			riderContext: {
				riderLevel: (data.session.rider_profiles as any)?.rider_level,
				riderWeightKg: data.riderWeight,
				bikeWeightKg: data.bikeWeight,
				crankLengthMm: data.crankLength,
				sessionFocus: effectiveContext.session_focus,
				rideFeel: effectiveContext.ride_feel,
				weatherCondition: effectiveContext.weather_conditions,
				trackSurface: effectiveContext.track_surface
			},
			selectedRunIndex: ctx.selectedRunIdx,
			riderLevel
		});
	});

	// ── Achievement detection ─────────────────────────────────────────────────
	// Runs deterministically from existing session data — no extra queries.
	// One builder, reused for the persisted result and the live draft preview,
	// so they can never quietly disagree about what "the story" is.
	function buildAchievementInput(opts: {
		sessionContext: any;
		sessionStats: any;
		insights: SessionInsights;
	}) {
		const { sessionContext, sessionStats, insights } = opts;
		const intel = insights.performanceAnalysis.intelligence;
		const impulseData = insights.performanceAnalysis.selectedRun?.physics?.impulse;
		const qualityRating = insights.performanceAnalysis.selectedRun?.physics?.dataQuality?.rating;
		const tsb = insights.techniqueScoreBreakdown;
		const ip = insights.insightPack;

		return buildDetectorInput({
			session: sessionContext,
			sessionStats,
			allTimePBs: data.allTimePBs as any,
			goalProgress: (data as any).goalProgress ?? null,
			profile: (data as any).profile ?? null,
			crossSessionReport: (data as any).advancedAnalytics?.crossSessionReport ?? null,
			hasCalibrationWarning: insights.performanceAnalysis.hasCalibrationWarning ?? false,
			dataQualityRating: (qualityRating as any) ?? null,
			intelligence: intel
				? {
						sessionQuality: intel.sessionQuality ?? null,
						repeatability: intel.repeatability ?? null,
						bestVsAvg: intel.bestVsAvg ?? null,
						dropOff: intel.dropOff ?? null,
						setLength: intel.setLength ?? null,
						fatigue: intel.fatigue ?? null
					}
				: null,
			techniqueScores: tsb
				? {
						launchQuality: tsb.launchQuality ?? null,
						explosiveness: tsb.explosiveness ?? null,
						speedCarry: tsb.speedCarry ?? null,
						smoothness: tsb.smoothness ?? null,
						repeatability: tsb.repeatability ?? null
					}
				: null,
			impulse: impulseData
				? {
						totalImpulseNs: impulseData.totalImpulseNs,
						timeToHalfImpulseS: impulseData.timeToHalfImpulseS,
						frontLoadedScore: impulseData.frontLoadedScore,
						impulseEfficiency: impulseData.impulseEfficiency
					}
				: null,
			insightPack: ip ? { strengths: ip.strengths ?? [], limiters: ip.limiters ?? [] } : null,
			riderLevel: riderLevel ?? null,
			uciCategory: uciCategory ?? null
		});
	}

	let achievementResult = $derived.by(() => {
		const input = buildAchievementInput({
			sessionContext: data.session as any,
			sessionStats: data.sessionStats as any,
			insights: { performanceAnalysis, techniqueScoreBreakdown, insightPack }
		});
		return detectAchievement(input);
	});

	let livePreviewResult = $derived.by(() => {
		if (!isFirstTimeSetup || !previewInsights) return achievementResult;
		const input = buildAchievementInput({
			sessionContext: { ...data.session, ...effectiveContext } as any,
			sessionStats: previewSessionStats as any,
			insights: previewInsights
		});
		return detectAchievement(input);
	});

	// `SocialShareModal` always binds to this, never the live preview — nothing
	// gets shared until it's actually saved.
	let persistedAchievement = $derived(achievementResult.achievement);
	let heroAchievement = $derived(
		isFirstTimeSetup ? livePreviewResult.achievement : persistedAchievement
	);
	let showShareModal = $state(false);
	function handleShare() {
		showShareModal = true;
	}

	// ── Hero fallback + sparkline (used regardless of notable/ordinary state) ──
	// The hero's own progression data — reflects the live draft while setting up
	// a never-touched session, otherwise the persisted analysis. Separate from
	// `progressionData` below, which always stays persisted-only for
	// CrossRunProgression further down the page.
	let heroProgressionData = $derived.by(() => {
		const runs =
			isFirstTimeSetup && previewInsights
				? previewInsights.performanceAnalysis.runs
				: performanceAnalysis.runs;
		return (runs ?? []).map((r: any, idx: number) => ({
			runNumber: r.runNumber ?? idx + 1,
			reactionMs: r.reactionMs,
			maxG: r.maxG,
			peakSpeedKmh:
				r.physics?.measuredPeakSpeedKmh ??
				(r.physics?.speedKmh?.length ? Math.max(...r.physics.speedKmh) : null),
			techniqueScore: r.technique?.overall ?? null
		}));
	});
	let heroHasValidSpeed = $derived(
		isFirstTimeSetup ? previewSessionStats.has_valid_speed : data.sessionStats.has_valid_speed
	);
	// `effectiveContext` already resolves to the persisted session value when
	// there's no in-progress draft, so it's safe to use unconditionally here.
	let heroConditions = $derived({
		weatherCondition: effectiveContext.weather_conditions,
		trackSurface: effectiveContext.track_surface,
		sessionFocus: effectiveContext.session_focus,
		rideFeel: effectiveContext.ride_feel
	});

	let totalMassKg = $derived(
		(data.riderWeight ?? 0) + (data.bikeWeight ?? 0) > 0
			? (data.riderWeight ?? 0) + (data.bikeWeight ?? 0)
			: null
	);

	let sessionNarrative = $derived.by(() => {
		if (!sessionIntelligence) return null;
		const qualityRating = quality?.rating as any;
		return buildSessionNarrative({
			runCount: data.runs.length,
			consistencyScore: sessionIntelligence.repeatability.overall,
			reactionCvPercent: consistency?.cv ?? null,
			dataQualityRating: qualityRating ?? null,
			speedBlocked: !data.sessionStats.has_valid_speed,
			powerBlocked: !totalMassKg,
			hasCalibrationWarnings: false,
			// v8.5: pass the full intelligence report — narrative resolves
			// fatigueDetected, dropOffRun, bestVsAvgGapPercent from it directly
			intelligenceReport: sessionIntelligence,
			// Session context
			sessionFocus: (data.session as any).session_focus ?? null,
			trackSurface: (data.session as any).track_surface ?? null,
			weatherCondition: (data.session as any).weather_conditions ?? null,
			rideFeel: (data.session as any).ride_feel ?? null,
			techniqueScores: techniqueScoreBreakdown
				? {
						launchQuality: techniqueScoreBreakdown.launchQuality,
						explosiveness: techniqueScoreBreakdown.explosiveness,
						speedCarry: techniqueScoreBreakdown.speedCarry,
						smoothness: techniqueScoreBreakdown.smoothness,
						repeatability: techniqueScoreBreakdown.repeatability
					}
				: null
		});
	});

	// ── Progression data ───────────────────────────────────────────────────────
	let progressionData = $derived(
		performanceAnalysis.runs.map((r: any, idx: number) => ({
			runNumber: r.runNumber ?? idx + 1,
			reactionMs: r.reactionMs,
			maxG: r.maxG,
			peakSpeedKmh:
				r.physics?.measuredPeakSpeedKmh ??
				(r.physics?.speedKmh?.length ? Math.max(...r.physics.speedKmh) : null),
			techniqueScore: r.technique?.overall ?? null
		}))
	);
</script>

<svelte:head>
	<title>Session — AppGatePro</title>
</svelte:head>

<div class="space-y-5">
	<!-- ══════════════════════════════════════════════════════
         HEADER
         ══════════════════════════════════════════════════════ -->
	<div class="themed-card rounded-xl p-5">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="min-w-0 flex-1">
				<div class="mb-1 flex items-center gap-2">
					<span
						class="themed-bg-accent themed-accent rounded border border-[color:var(--accent)]/20 px-2 py-0.5 text-xs font-semibold"
					>
						Gate Session
					</span>
					{#if uciCategory}
						<span class="themed-nested-card themed-text-secondary rounded px-2 py-0.5 text-xs"
							>{uciCategory.name}</span
						>
					{/if}
				</div>
				<h2 class="themed-text-primary text-lg font-bold">{sessionDate}</h2>
				<p class="themed-text-secondary mt-0.5 text-sm">
					{data.sessionStats.run_count} runs
					{#if (data.session.bikes as any)?.name}· {(data.session.bikes as any).name}{/if}
				</p>
			</div>
			<a
				href="/sessions"
				class="themed-text-secondary hover:themed-accent flex items-center gap-1 rounded text-sm
                      transition-colors focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)] focus:outline-none"
			>
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				All sessions
			</a>
		</div>
	</div>

	<!-- ══════════════════════════════════════════════════════
         SESSION SETUP + HERO
         A never-set-up session gets the setup strip prominently above the
         hero, with the hero reacting live to in-progress edits. Once set up,
         the hero leads and the strip drops to its low-key spot below.
         ══════════════════════════════════════════════════════ -->
	{#if isFirstTimeSetup}
		<SessionSetupStrip
			sessionId={data.session.id}
			runs={data.runs.map((r: any) => ({
				id: r.id,
				run_number: r.run_number,
				tags: r.tags ?? null,
				gate_runs: Array.isArray(r.gate_runs) ? r.gate_runs[0] : r.gate_runs
			}))}
			initialWeather={(data.session as any).weather_conditions ?? null}
			initialSurface={(data.session as any).track_surface ?? null}
			initialFocus={(data.session as any).session_focus ?? null}
			initialFeel={(data.session as any).ride_feel ?? null}
			onDraftContextChange={handleDraftContextChange}
			onDraftRunTagsChange={handleDraftRunTagsChange}
		/>
		<SessionHero
			achievement={heroAchievement}
			isLivePreview={true}
			progressionData={heroProgressionData}
			hasValidSpeed={heroHasValidSpeed}
			conditions={heroConditions}
			onShare={handleShare}
		/>
	{:else}
		<SessionHero
			achievement={heroAchievement}
			isLivePreview={false}
			progressionData={heroProgressionData}
			hasValidSpeed={heroHasValidSpeed}
			conditions={heroConditions}
			onShare={handleShare}
		/>
		<SessionSetupStrip
			sessionId={data.session.id}
			runs={data.runs.map((r: any) => ({
				id: r.id,
				run_number: r.run_number,
				tags: r.tags ?? null,
				gate_runs: Array.isArray(r.gate_runs) ? r.gate_runs[0] : r.gate_runs
			}))}
			initialWeather={(data.session as any).weather_conditions ?? null}
			initialSurface={(data.session as any).track_surface ?? null}
			initialFocus={(data.session as any).session_focus ?? null}
			initialFeel={(data.session as any).ride_feel ?? null}
		/>
	{/if}

	<!-- ══════════════════════════════════════════════════════
         GOAL PROGRESS ALERT
         ══════════════════════════════════════════════════════ -->
	{#if data.goalProgress && data.goalProgress.length > 0}
		<div class="rounded-xl border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-5">
			<div class="flex items-start gap-3">
				<svg
					class="mt-0.5 h-6 w-6 flex-shrink-0 text-[#3de8c8]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
					/>
				</svg>
				<div class="flex-1">
					<h3 class="mb-2 text-sm font-semibold text-[#3de8c8]">🎯 Goal Progress Updated!</h3>
					<div class="space-y-2">
						{#each data.goalProgress as progress}
							<div class="flex flex-wrap items-center justify-between gap-4">
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<p class="themed-text-primary text-sm font-medium">{progress.metricLabel}</p>
										{#if progress.isSignificant}
											<span
												class="rounded border border-[#f5a623]/40 bg-[#f5a623]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#f5a623]"
												>⭐ MILESTONE</span
											>
										{/if}
									</div>
									<p class="themed-text-secondary text-xs">
										{progress.improvement} improvement →
										<span class="font-semibold text-[#3de8c8]">{progress.percentToGoal}%</span> to target
									</p>
								</div>
								<div class="w-24 flex-shrink-0">
									<div class="themed-nested-card h-2 w-full rounded-full">
										<div
											class="h-2 rounded-full bg-[#3de8c8] transition-all"
											style="width:{progress.percentToGoal}%"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
					<a
						href="/goals"
						class="hover:themed-text-primary mt-3 inline-flex items-center gap-1 rounded text-xs text-[#3de8c8]
                              transition-colors focus:ring-2 focus:ring-[#3de8c8] focus:outline-none"
					>
						View all goals
						<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</a>
				</div>
			</div>
		</div>
	{:else if data.hasActiveGoals === false}
		<div class="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/10 p-4">
			<div class="flex items-start gap-3">
				<svg
					class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#f5a623]"
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
				<div>
					<p class="mb-1 text-sm font-medium text-[#f5a623]">
						Set training goals to track your progress
					</p>
					<p class="themed-text-secondary mb-2 text-xs">
						Create performance targets and automatically track improvements from your sessions.
					</p>
					<a
						href="/goals"
						class="inline-flex items-center gap-2 rounded-lg bg-[#f5a623] px-3 py-1.5
                              text-xs font-semibold text-[color:var(--theme-bg)] transition-colors hover:bg-[#c97e0a]
                              focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-bg)] focus:outline-none"
					>
						<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Create your first goal
					</a>
				</div>
			</div>
		</div>
	{/if}

	<!-- ══════════════════════════════════════════════════════
         SESSION NARRATIVE — supporting "why", underneath the hero
         ══════════════════════════════════════════════════════ -->
	{#if sessionNarrative}
		<div class="themed-card rounded-xl p-5">
			<p class="themed-accent text-xs tracking-wide uppercase">Session Summary</p>
			<h3 class="themed-text-primary mt-1 mb-4 text-lg font-semibold">How This Session Went</h3>
			<SessionNarrativeCard narrative={sessionNarrative} detailLevel="coach" />
		</div>
	{/if}

	<!-- Social share modal — always the persisted, saved achievement, never the live preview -->
	{#if showShareModal && persistedAchievement}
		<SocialShareModal
			achievement={persistedAchievement}
			backgroundImageUrl={(data as any).profile?.background_image_url ?? null}
			profileIconUrl={(data as any).profile?.profile_icon_url ?? null}
			showProfileIcon={data.userPreferences?.show_profile_icon ?? true}
			showBackgroundImage={data.userPreferences?.show_background_image ?? true}
			onclose={() => (showShareModal = false)}
		/>
	{/if}

	<!-- ══════════════════════════════════════════════════════
         STRENGTHS & LIMITERS
         ══════════════════════════════════════════════════════ -->
	{#if insightPack && (insightPack.strengths.length > 0 || insightPack.limiters.length > 0)}
		<div class="themed-card rounded-xl p-5">
			<h3 class="themed-text-primary mb-4 text-base font-bold">Performance Summary</h3>
			<StrengthsLimiters strengths={insightPack.strengths} limiters={insightPack.limiters} />
		</div>
	{/if}

	<!-- ══════════════════════════════════════════════════════
         SESSION SUMMARY STATS
         ══════════════════════════════════════════════════════ -->
	<div class="space-y-3">
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
			{#each [{ label: 'Best Reaction', value: fmtReaction(data.sessionStats.best_reaction_ms) }, { label: 'Avg Reaction', value: fmtReaction(data.sessionStats.avg_reaction_ms) }, { label: 'Best Peak Speed', value: fmtSpeed(data.sessionStats.best_peak_speed_ms), warn: !data.sessionStats.has_valid_speed }, { label: 'Best Max G', value: fmt(data.sessionStats.best_max_g, 2, 'G') }, { label: 'Consistency', value: consistency ? `${consistency.cv}% CV` : '—' }, { label: 'Wheelie Runs', value: String(data.sessionStats.wheelie_count) }] as s}
				<div class="themed-card rounded-xl p-4">
					<p class="themed-text-subtle mb-1 text-xs">{s.label}</p>
					<p class="text-xl font-bold {s.warn ? 'themed-text-subtle' : 'themed-accent'}">
						{s.value}
					</p>
				</div>
			{/each}
		</div>
		{#if data.sessionStats.excluded_run_count > 0}
			<div class="themed-bg-accent rounded-lg border border-[color:var(--accent)]/20 px-4 py-2.5">
				<p class="themed-accent text-sm">
					📊 Showing {data.sessionStats.included_run_count} of {data.sessionStats.run_count} runs
					<span class="themed-text-secondary"
						>({data.sessionStats.excluded_run_count} warmup/excluded)</span
					>
				</p>
			</div>
		{/if}
	</div>

	<!-- ══════════════════════════════════════════════════════
         CROSS-RUN PROGRESSION
         ══════════════════════════════════════════════════════ -->
	{#if data.runs.length > 1}
		<CrossRunProgression
			data={progressionData}
			isMobile={ctx.isMobile}
			sessionId={data.session.id}
		/>
	{/if}

	<!-- ══════════════════════════════════════════════════════
         CONTINUE CTA
         ══════════════════════════════════════════════════════ -->
	<a
		href="/sessions/{data.session.id}/analysis"
		class="themed-card-hover group flex w-full items-center justify-between rounded-xl p-4 transition-colors
              focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)] focus:outline-none"
	>
		<div>
			<p
				class="themed-text-primary group-hover:themed-accent text-sm font-semibold transition-colors"
			>
				View run analysis
			</p>
			<p class="themed-text-subtle mt-0.5 text-xs">
				Charts, metrics, technique scores and phase breakdown
			</p>
		</div>
		<svg
			class="themed-text-subtle group-hover:themed-accent h-5 w-5 flex-shrink-0 transition-colors"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</a>
</div>
