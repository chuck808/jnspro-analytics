<script lang="ts">
    import { getContext } from 'svelte';
    import type { LayoutData } from './$types';
    import SessionSetupStrip from '$lib/components/SessionSetupStrip.svelte';
    import CrossRunProgression from '$lib/components/CrossRunProgression.svelte';
    import SessionNarrativeCard from '$lib/components/performance-insights/SessionNarrativeCard.svelte';
    import StrengthsLimiters from '$lib/components/session/StrengthsLimiters.svelte';
    import { buildSessionNarrative } from '$lib/performance-engine/sessionNarrative';
    import { getUCICategory } from '$lib/utils/uciCategories';
    import { detectAchievement, buildDetectorInput } from '$lib/social';
    import SocialShareModal from '$lib/components/social/SocialShareModal.svelte';

    let { data }: { data: LayoutData } = $props();

    const ctx: any = getContext('session');

    // Pull what we need from shared context
    let sessionDate        = $derived(ctx.sessionDate);
    let uciCategory        = $derived(ctx.uciCategory);
    let performanceAnalysis = $derived(ctx.performanceAnalysis);
    let consistency        = $derived(ctx.consistency);
    let insightPack             = $derived(ctx.insightPack);
    let techniqueScoreBreakdown = $derived(ctx.techniqueScoreBreakdown);

    // ── Formatting helpers ─────────────────────────────────────────────────────
    function fmt(n: number | null | undefined, dec = 2, suf = '') {
        if (n === null || n === undefined) return '—';
        return n.toFixed(dec) + suf;
    }
    function fmtReaction(ms: number | null) { return ms !== null ? fmt(ms / 1000, 3, 's') : '—'; }
    function fmtSpeed(ms: number | null)    { return ms !== null ? fmt(ms * 3.6, 1, ' km/h') : '—'; }

    // ── Hero metric ────────────────────────────────────────────────────────────
    let personalBests = $derived({
        bestReactionMs: data.allTimePBs?.bestReactionMs ?? null,
        bestSpeedMs:    data.allTimePBs?.bestSpeedMs ?? null,
        bestMaxG:       data.allTimePBs?.bestMaxG ?? null,
    });

    type HeroMetric = {
        type: 'reaction' | 'speed' | 'maxG' | 'goalMilestone';
        label: string; value: string; unit: string; rawValue: number;
        isPersonalBest: boolean; isGoalMilestone: boolean;
    };

    let heroMetric = $derived.by((): HeroMetric => {
        const significantGoal = data.goalProgress?.find((g: any) => g.isSignificant);
        if (significantGoal) {
            const value = significantGoal.newValue;
            return {
                type: 'goalMilestone', label: significantGoal.metricLabel,
                value: significantGoal.metricLabel.toLowerCase().includes('reaction') ? (value / 1000).toFixed(3)
                     : significantGoal.metricLabel.toLowerCase().includes('speed')    ? (value * 3.6).toFixed(1)
                     : value.toFixed(2),
                unit: significantGoal.metricLabel.toLowerCase().includes('reaction') ? 's'
                    : significantGoal.metricLabel.toLowerCase().includes('speed')    ? ' km/h' : 'G',
                rawValue: value, isPersonalBest: false, isGoalMilestone: true,
            };
        }
        if (data.sessionStats.best_reaction_ms !== null && personalBests.bestReactionMs !== null &&
            data.sessionStats.best_reaction_ms < personalBests.bestReactionMs) {
            return { type: 'reaction', label: 'Reaction Time',
                value: (data.sessionStats.best_reaction_ms / 1000).toFixed(3), unit: 's',
                rawValue: data.sessionStats.best_reaction_ms, isPersonalBest: true, isGoalMilestone: false };
        }
        if (data.sessionStats.has_valid_speed && data.sessionStats.best_peak_speed_ms !== null &&
            personalBests.bestSpeedMs !== null && data.sessionStats.best_peak_speed_ms > personalBests.bestSpeedMs) {
            return { type: 'speed', label: 'Peak Speed',
                value: (data.sessionStats.best_peak_speed_ms * 3.6).toFixed(1), unit: ' km/h',
                rawValue: data.sessionStats.best_peak_speed_ms, isPersonalBest: true, isGoalMilestone: false };
        }
        if (data.sessionStats.best_max_g !== null && personalBests.bestMaxG !== null &&
            data.sessionStats.best_max_g > personalBests.bestMaxG) {
            return { type: 'maxG', label: 'Peak G-Force',
                value: data.sessionStats.best_max_g.toFixed(2), unit: 'G',
                rawValue: data.sessionStats.best_max_g, isPersonalBest: true, isGoalMilestone: false };
        }
        if (data.sessionStats.has_valid_speed && data.sessionStats.best_peak_speed_ms !== null &&
            personalBests.bestSpeedMs !== null && data.sessionStats.best_peak_speed_ms >= personalBests.bestSpeedMs * 0.95) {
            return { type: 'speed', label: 'Peak Speed',
                value: (data.sessionStats.best_peak_speed_ms * 3.6).toFixed(1), unit: ' km/h',
                rawValue: data.sessionStats.best_peak_speed_ms, isPersonalBest: false, isGoalMilestone: false };
        }
        return {
            type: 'reaction', label: 'Reaction Time',
            value: data.sessionStats.best_reaction_ms ? (data.sessionStats.best_reaction_ms / 1000).toFixed(3) : '—',
            unit: 's', rawValue: data.sessionStats.best_reaction_ms ?? 0,
            isPersonalBest: false, isGoalMilestone: false,
        };
    });

    // ── Session narrative ──────────────────────────────────────────────────────
    let sessionIntelligence = $derived(performanceAnalysis.intelligence);
    let quality = $derived(performanceAnalysis.selectedRun?.physics?.dataQuality);

    // ── Achievement detection ─────────────────────────────────────────────────
    // Runs deterministically from existing session data — no extra queries.
    // Result is null when nothing meaningful happened or data can't be trusted.
    let achievementResult = $derived.by(() => {
        const detectorInput = buildDetectorInput({
            session:          data.session as any,
            sessionStats:     data.sessionStats as any,
            allTimePBs:       data.allTimePBs as any,
            goalProgress:     (data as any).goalProgress ?? null,
            profile:          (data as any).profile ?? null,
            crossSessionReport: (data as any).advancedAnalytics?.crossSessionReport ?? null,
            hasCalibrationWarning: performanceAnalysis.hasCalibrationWarning ?? false,
            profileComplete:  performanceAnalysis.profileComplete ?? false,
            dataQualityRating: (quality?.badge as any) ?? null,
        });
        return detectAchievement(detectorInput);
    });

    let shareableAchievement = $derived(achievementResult.achievement);
    let showShareModal = $state(false);

    let totalMassKg = $derived(
        ((data.riderWeight ?? 0) + (data.bikeWeight ?? 0)) > 0
            ? (data.riderWeight ?? 0) + (data.bikeWeight ?? 0) : null
    );

    let sessionNarrative = $derived.by(() => {
        if (!sessionIntelligence) return null;
        const qualityRating = quality?.badge as any;
        return buildSessionNarrative({
            runCount:               data.runs.length,
            consistencyScore:       sessionIntelligence.repeatability.overall,
            reactionCvPercent:      consistency?.cv ?? null,
            dataQualityRating:      qualityRating ?? null,
            speedBlocked:           !data.sessionStats.has_valid_speed,
            powerBlocked:           !totalMassKg,
            hasCalibrationWarnings: false,
            // v8.5: pass the full intelligence report — narrative resolves
            // fatigueDetected, dropOffRun, bestVsAvgGapPercent from it directly
            intelligenceReport:     sessionIntelligence,
            // Session context
            sessionFocus:           (data.session as any).session_focus      ?? null,
            trackSurface:           (data.session as any).track_surface      ?? null,
            weatherCondition:       (data.session as any).weather_conditions ?? null,
            rideFeel:               (data.session as any).ride_feel          ?? null,
            techniqueScores: techniqueScoreBreakdown ? {
                launchQuality: techniqueScoreBreakdown.launchQuality,
                explosiveness: techniqueScoreBreakdown.explosiveness,
                speedCarry:    techniqueScoreBreakdown.speedCarry,
                smoothness:    techniqueScoreBreakdown.smoothness,
                repeatability: techniqueScoreBreakdown.repeatability,
            } : null,
        });
    });

    // ── Progression data ───────────────────────────────────────────────────────
    let progressionData = $derived(performanceAnalysis.runs.map((r: any, idx: number) => ({
        runNumber:     r.runNumber ?? idx + 1,
        reactionMs:    r.reactionMs,
        maxG:          r.maxG,
        peakSpeedKmh:  r.physics?.speedKmh?.length ? Math.max(...r.physics.speedKmh) : null,
        techniqueScore: r.technique?.overall ?? null,
    })));
</script>

<svelte:head>
    <title>Session — AppGatePro</title>
</svelte:head>

<div class="space-y-5">

    <!-- ══════════════════════════════════════════════════════
         HEADER
         ══════════════════════════════════════════════════════ -->
    <div class="themed-card rounded-xl p-5">
        <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 text-xs font-semibold rounded themed-bg-accent themed-accent border border-[color:var(--accent)]/20">
                        Gate Session
                    </span>
                    {#if uciCategory}
                        <span class="px-2 py-0.5 text-xs rounded themed-nested-card themed-text-secondary">{uciCategory.name}</span>
                    {/if}
                </div>
                <h2 class="text-lg font-bold themed-text-primary">{sessionDate}</h2>
                <p class="text-sm themed-text-secondary mt-0.5">
                    {data.sessionStats.run_count} runs
                    {#if (data.session.bikes as any)?.name}· {(data.session.bikes as any).name}{/if}
                </p>
            </div>
            <a href="/sessions"
               class="text-sm themed-text-secondary hover:themed-accent transition-colors flex items-center gap-1
                      focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)] rounded">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                All sessions
            </a>
        </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         SESSION SETUP — context + run tags + nudge
         ══════════════════════════════════════════════════════ -->
    <SessionSetupStrip
        sessionId={data.session.id}
        runs={data.runs.map((r: any) => ({
            id:         r.id,
            run_number: r.run_number,
            tags:       r.tags ?? null,
            gate_runs:  Array.isArray(r.gate_runs) ? r.gate_runs[0] : r.gate_runs,
        }))}
        initialWeather={(data.session as any).weather_conditions ?? null}
        initialSurface={(data.session as any).track_surface ?? null}
        initialFocus={(data.session as any).session_focus ?? null}
        initialFeel={(data.session as any).ride_feel ?? null}
    />

    <!-- ══════════════════════════════════════════════════════
         GOAL PROGRESS ALERT
         ══════════════════════════════════════════════════════ -->
    {#if data.goalProgress && data.goalProgress.length > 0}
        <div class="bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-xl p-5">
            <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-[#3de8c8] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
                <div class="flex-1">
                    <h3 class="text-sm font-semibold text-[#3de8c8] mb-2">🎯 Goal Progress Updated!</h3>
                    <div class="space-y-2">
                        {#each data.goalProgress as progress}
                            <div class="flex items-center justify-between gap-4 flex-wrap">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <p class="text-sm themed-text-primary font-medium">{progress.metricLabel}</p>
                                        {#if progress.isSignificant}
                                            <span class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/40">⭐ MILESTONE</span>
                                        {/if}
                                    </div>
                                    <p class="text-xs themed-text-secondary">
                                        {progress.improvement} improvement → <span class="text-[#3de8c8] font-semibold">{progress.percentToGoal}%</span> to target
                                    </p>
                                </div>
                                <div class="w-24 flex-shrink-0">
                                    <div class="w-full themed-nested-card rounded-full h-2">
                                        <div class="h-2 rounded-full transition-all bg-[#3de8c8]" style="width:{progress.percentToGoal}%"></div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                    <a href="/goals" class="inline-flex items-center gap-1 text-xs text-[#3de8c8] hover:themed-text-primary transition-colors mt-3
                              focus:outline-none focus:ring-2 focus:ring-[#3de8c8] rounded">
                        View all goals
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    {:else if data.hasActiveGoals === false}
        <div class="bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-xl p-4">
            <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-[#f5a623] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <div>
                    <p class="text-sm font-medium text-[#f5a623] mb-1">Set training goals to track your progress</p>
                    <p class="text-xs themed-text-secondary mb-2">Create performance targets and automatically track improvements from your sessions.</p>
                    <a href="/goals" class="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f5a623] hover:bg-[#c97e0a]
                              text-[color:var(--theme-bg)] text-xs font-semibold rounded-lg transition-colors
                              focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-bg)]">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Create your first goal
                    </a>
                </div>
            </div>
        </div>
    {/if}

    <!-- ══════════════════════════════════════════════════════
         HERO METRIC + SESSION NARRATIVE
         ══════════════════════════════════════════════════════ -->
        {#if sessionNarrative}
        <div class="themed-card rounded-xl p-5">
            <div class="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                    <p class="text-xs uppercase tracking-wide themed-accent">Session Summary</p>
                    <h3 class="text-lg font-semibold themed-text-primary mt-1">How This Session Went</h3>
                </div>
                <div class="flex items-start gap-3">
                    <!-- Share card button — only when achievement detected -->
                    {#if shareableAchievement?.isShareable}
                        <button
                            onclick={() => showShareModal = true}
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                   bg-[rgba(0,229,255,0.1)] border border-[rgba(0,229,255,0.25)]
                                   text-[#00e5ff] hover:bg-[rgba(0,229,255,0.18)] transition-colors"
                            title="Share this achievement"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            Share
                        </button>
                    {/if}
                    <div class="text-right">
                    <p class="text-[10px] uppercase tracking-wider themed-text-subtle mb-0.5">
                        {heroMetric.isPersonalBest ? '🏆 Personal Best' : heroMetric.isGoalMilestone ? '🎯 Goal Milestone' : 'Best Today'}
                    </p>
                    <div class="flex items-baseline gap-1 justify-end">
                        <span class="text-2xl font-black themed-accent">{heroMetric.value}</span>
                        <span class="text-sm themed-text-secondary">{heroMetric.unit}</span>
                    </div>
                    <p class="text-xs themed-text-subtle">{heroMetric.label}</p>
                </div>
                </div>
            </div>
            <SessionNarrativeCard narrative={sessionNarrative} detailLevel="coach" />
        </div>
    {/if}

    <!-- Social share modal — rendered when achievement detected and user clicks Share -->
    {#if showShareModal && shareableAchievement}
        <SocialShareModal
            achievement={shareableAchievement}
            backgroundImageUrl={(data as any).profile?.background_image_url ?? null}
            profileIconUrl={(data as any).profile?.profile_icon_url ?? null}
            showProfileIcon={data.userPreferences?.show_profile_icon ?? true}
            showBackgroundImage={data.userPreferences?.show_background_image ?? true}
            onclose={() => showShareModal = false}
        />
    {/if}

    <!-- ══════════════════════════════════════════════════════
         STRENGTHS & LIMITERS
         ══════════════════════════════════════════════════════ -->
    {#if insightPack && (insightPack.strengths.length > 0 || insightPack.limiters.length > 0)}
        <div class="themed-card rounded-xl p-5">
            <h3 class="text-base font-bold themed-text-primary mb-4">Performance Summary</h3>
            <StrengthsLimiters 
                strengths={insightPack.strengths} 
                limiters={insightPack.limiters} 
            />
        </div>
    {/if}

    <!-- ══════════════════════════════════════════════════════
         SESSION SUMMARY STATS
         ══════════════════════════════════════════════════════ -->
    <div class="space-y-3">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {#each [
                { label:'Best Reaction',   value: fmtReaction(data.sessionStats.best_reaction_ms) },
                { label:'Avg Reaction',    value: fmtReaction(data.sessionStats.avg_reaction_ms) },
                { label:'Best Peak Speed', value: fmtSpeed(data.sessionStats.best_peak_speed_ms), warn:!data.sessionStats.has_valid_speed },
                { label:'Best Max G',      value: fmt(data.sessionStats.best_max_g, 2, 'G') },
                { label:'Consistency',     value: consistency ? `${consistency.cv}% CV` : '—' },
                { label:'Wheelie Runs',    value: String(data.sessionStats.wheelie_count) },
            ] as s}
                <div class="themed-card rounded-xl p-4">
                    <p class="text-xs themed-text-subtle mb-1">{s.label}</p>
                    <p class="text-xl font-bold {s.warn ? 'themed-text-subtle' : 'themed-accent'}">{s.value}</p>
                </div>
            {/each}
        </div>
        {#if data.sessionStats.excluded_run_count > 0}
            <div class="themed-bg-accent rounded-lg px-4 py-2.5 border border-[color:var(--accent)]/20">
                <p class="text-sm themed-accent">
                    📊 Showing {data.sessionStats.included_run_count} of {data.sessionStats.run_count} runs
                    <span class="themed-text-secondary">({data.sessionStats.excluded_run_count} warmup/excluded)</span>
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
    <a href="/sessions/{data.session.id}/analysis"
       class="flex items-center justify-between w-full themed-card-hover rounded-xl p-4 transition-colors group
              focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)]">
        <div>
            <p class="text-sm font-semibold themed-text-primary group-hover:themed-accent transition-colors">View run analysis</p>
            <p class="text-xs themed-text-subtle mt-0.5">Charts, metrics, technique scores and phase breakdown</p>
        </div>
        <svg class="w-5 h-5 themed-text-subtle group-hover:themed-accent transition-colors flex-shrink-0"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
    </a>

</div>