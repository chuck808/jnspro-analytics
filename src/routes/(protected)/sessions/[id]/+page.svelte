<script lang="ts">
	import { getContext } from 'svelte';
	import type { LayoutData } from './$types';
	import SessionSetupStrip from '$lib/components/SessionSetupStrip.svelte';
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
	import type { FormattedComparison } from '$lib/performance-engine/crossSession/comparisonFormatting';

	let { data }: { data: LayoutData } = $props();

	const ctx: any = getContext('session');

	let sessionDate = $derived(ctx.sessionDate);
	let uciCategory = $derived(ctx.uciCategory);
	let performanceAnalysis = $derived(ctx.performanceAnalysis);
	let consistency = $derived(ctx.consistency);
	let insightPack = $derived(ctx.insightPack);
	let techniqueScoreBreakdown = $derived(ctx.techniqueScoreBreakdown);
	let riderLevel = $derived(ctx.riderLevel);

	const SETUP_FIELD_LABELS: Record<string, string> = {
		weight_kg: 'Bike weight',
		profile_weight_kg: 'Rider weight',
		height_cm: 'Height',
		crank_length_mm: 'Crank length',
		chainring_teeth: 'Gearing',
		sprocket_teeth: 'Gearing',
		front_tire_id: 'Tyres',
		rear_tire_id: 'Tyres',
		custom_wheel_diameter_inches: 'Wheel diameter'
	};

	function fieldLabel(field: string): string {
		return SETUP_FIELD_LABELS[field] ?? field;
	}

	function fieldValue(field: string, value: number | null): string {
		if (value === null) return '—';
		if (field === 'front_tire_id' || field === 'rear_tire_id') {
			return (data as any).tireLabelById?.[value] ?? `#${value}`;
		}
		if (field === 'weight_kg' || field === 'profile_weight_kg') return `${value}kg`;
		if (field === 'height_cm') return `${value}cm`;
		if (field === 'crank_length_mm') return `${value}mm`;
		return `${value}`;
	}

	let sessionIntelligence = $derived(performanceAnalysis.intelligence);
	let quality = $derived(performanceAnalysis.selectedRun?.physics?.dataQuality);

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

	let persistedAchievement = $derived(achievementResult.achievement);
	let heroAchievement = $derived(
		isFirstTimeSetup ? livePreviewResult.achievement : persistedAchievement
	);
	let showShareModal = $state(false);

	function handleShare() {
		showShareModal = true;
	}

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
			intelligenceReport: sessionIntelligence,
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
</script>

<svelte:head>
	<title>Session — AppGatePro</title>
</svelte:head>

<div class="space-y-5">
	<div class="themed-card rounded-xl p-5">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="min-w-0 flex-1">
				<div class="mb-1 flex items-center gap-2">
					<span class="themed-bg-accent themed-accent rounded border border-[color:var(--accent)]/20 px-2 py-0.5 text-xs font-semibold">
						Gate Session
					</span>
					{#if uciCategory}
						<span class="themed-nested-card themed-text-secondary rounded px-2 py-0.5 text-xs">{uciCategory.name}</span>
					{/if}
				</div>
				<h2 class="themed-text-primary text-lg font-bold">{sessionDate}</h2>
				<p class="themed-text-secondary mt-0.5 text-sm">
					{data.sessionStats.run_count} runs
					{#if (data.session.bikes as any)?.name}· {(data.session.bikes as any).name}{/if}
				</p>
			</div>
			<a href="/sessions" class="themed-text-secondary hover:themed-accent flex items-center gap-1 rounded text-sm transition-colors focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)] focus:outline-none">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				All sessions
			</a>
		</div>
	</div>

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

	{#if sessionNarrative}
		<div class="themed-card rounded-xl p-5">
			<p class="themed-accent text-xs tracking-wide uppercase">What it means</p>
			<h3 class="themed-text-primary mt-1 mb-4 text-lg font-semibold">How this session went</h3>
			<SessionNarrativeCard narrative={sessionNarrative} detailLevel="coach" />
		</div>
	{/if}

	{#if data.goalProgress && data.goalProgress.length > 0}
		<div class="rounded-xl border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-5">
			<div class="flex items-start gap-3">
				<svg class="mt-0.5 h-6 w-6 flex-shrink-0 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
				</svg>
				<div class="flex-1">
					<h3 class="mb-2 text-sm font-semibold text-[#3de8c8]">Goal progress moved</h3>
					<div class="space-y-2">
						{#each data.goalProgress as progress}
							<div class="flex flex-wrap items-center justify-between gap-4">
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<p class="themed-text-primary text-sm font-medium">{progress.metricLabel}</p>
										{#if progress.isSignificant}
											<span class="rounded border border-[#f5a623]/40 bg-[#f5a623]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#f5a623]">MILESTONE</span>
										{/if}
									</div>
									<p class="themed-text-secondary text-xs">
										{progress.improvement} improvement · <span class="font-semibold text-[#3de8c8]">{progress.percentToGoal}%</span> to target
									</p>
								</div>
								<div class="w-24 flex-shrink-0">
									<div class="themed-nested-card h-2 w-full rounded-full">
										<div class="h-2 rounded-full bg-[#3de8c8] transition-all" style="width:{progress.percentToGoal}%"></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
					<a href="/goals" class="hover:themed-text-primary mt-3 inline-flex items-center gap-1 rounded text-xs text-[#3de8c8] transition-colors focus:ring-2 focus:ring-[#3de8c8] focus:outline-none">View goals →</a>
				</div>
			</div>
		</div>
	{:else if data.hasActiveGoals === false}
		<div class="themed-card rounded-xl p-4">
			<p class="themed-text-primary text-sm font-medium">Want something to chase?</p>
			<p class="themed-text-secondary mt-1 text-xs">Goals can turn improvements from future sessions into a simple target.</p>
			<a href="/goals" class="themed-accent mt-2 inline-flex text-xs font-semibold">Create a goal →</a>
		</div>
	{/if}

	{#if data.setupChangeReport && data.setupChangeReport.status !== 'none' && data.setupChangeReport.event}
		<div class="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/10 p-5">
			<div class="flex items-start gap-3">
				<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				</svg>
				<div class="flex-1">
					<h3 class="mb-2 text-sm font-semibold text-[#f5a623]">Setup changed</h3>
					<ul class="mb-2 space-y-1 text-xs text-[#9a8f7a]">
						{#each data.setupChangeReport.event.changes as change}
							<li><span class="themed-text-primary font-medium">{fieldLabel(change.field)}:</span> {fieldValue(change.field, change.from)} → {fieldValue(change.field, change.to)}</li>
						{/each}
					</ul>

					{#if data.setupChangeReport.status === 'gathering'}
						<p class="themed-text-secondary text-xs">
							Still gathering data — need {data.setupChangeReport.sessionsUntilReady} more session{data.setupChangeReport.sessionsUntilReady === 1 ? '' : 's'} before a fair comparison is possible.
						</p>
					{:else if data.setupChangeReport.comparison}
						{@const comp = data.setupChangeReport.comparison}
						<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
							{#each [
								['Reaction', comp.reactionTime],
								['Speed', comp.speed],
								['Consistency', comp.consistency],
								['Quality', comp.sessionQuality]
							] as [string, FormattedComparison | null][] as [label, c]}
								{#if c}
									<div>
										<p class="text-[10px] text-[#9a8f7a]">{label}</p>
										<p class="text-xs font-medium" class:text-[#3de8c8]={c.isImproving} class:text-red-400={!c.isImproving}>{c.narrative}</p>
									</div>
								{/if}
							{/each}
						</div>
						<p class="themed-text-secondary mt-2 text-[10px]">Based on {data.setupChangeReport.comparison.beforeCount} sessions before vs {data.setupChangeReport.comparison.afterCount} after.</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if insightPack && (insightPack.strengths.length > 0 || insightPack.limiters.length > 0)}
		<div class="themed-card rounded-xl p-5">
			<p class="themed-accent text-xs tracking-wide uppercase">What to carry forward</p>
			<h3 class="themed-text-primary mt-1 mb-4 text-base font-bold">One strength, one focus</h3>
			<StrengthsLimiters strengths={insightPack.strengths} limiters={insightPack.limiters} />
		</div>
	{/if}

	{#if data.sessionStats.excluded_run_count > 0}
		<div class="themed-bg-accent rounded-lg border border-[color:var(--accent)]/20 px-4 py-3">
			<p class="themed-accent text-sm font-medium">Statistics use {data.sessionStats.included_run_count} of {data.sessionStats.run_count} recorded runs.</p>
			<p class="themed-text-secondary mt-1 text-xs">{data.sessionStats.excluded_run_count} warm-up or excluded run{data.sessionStats.excluded_run_count === 1 ? '' : 's'} remain in the session record but do not affect normal analytics.</p>
		</div>
	{/if}

	<a href="/sessions/{data.session.id}/analysis" class="themed-card-hover group flex w-full items-center justify-between rounded-xl p-4 transition-colors focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)] focus:outline-none">
		<div>
			<p class="themed-text-primary group-hover:themed-accent text-sm font-semibold transition-colors">Explore the runs</p>
			<p class="themed-text-subtle mt-0.5 text-xs">Compare runs, technique scores, phase breakdowns and the detailed charts behind this overview.</p>
		</div>
		<svg class="themed-text-subtle group-hover:themed-accent h-5 w-5 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</a>

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
</div>
