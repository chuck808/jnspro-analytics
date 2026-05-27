<script lang="ts">
    import type { LayoutData } from './$types';
    import { onMount, setContext } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import HelpPanel from '$lib/components/HelpPanel.svelte';
    import { ReportOptionsPanel, ReportPreview } from '$lib/components/reports';
    import { buildCoachSessionReport } from '$lib/report-engine';
    import type { GeneratedReport, ReportDetailLevel } from '$lib/report-engine/types';
    import { analyseSession, type DetailLevel, scoreRunTechnique, buildCoachDiagnostics, buildPerformanceInsightPack } from '$lib/performance-engine';
    import { analyseSessionIntelligence } from '$lib/performance-engine';
    import { analyseCrossSessionIntelligence } from '$lib/performance-engine/crossSession';
    import { applyTruthRulesToReport } from '$lib/performance-engine/crossSession/truthRules';
    import { createAnalysisView } from '$lib/analysis-views';
    import { buildChartSeries, shouldShowPower } from '$lib/performance-engine';
    import { getExclusionReasons } from '$lib/types/runs';
    import { getUCICategory } from '$lib/utils/uciCategories';

    let { data, children }: { data: LayoutData; children: any } = $props();

    // ── Shared reactive state ──────────────────────────────────────────────────

    let selectedRunIdx = $state(0);
    let isMobile       = $state(false);
    let scrolled       = $state(false);

    // Help panel
    let helpKey  = $state('');
    let helpOpen = $state(false);
    function openHelp(key: string) { helpKey = key; helpOpen = true; }

    // Report state
    let report: GeneratedReport | null = $state(null);
    let generating        = $state(false);
    let showReport        = $state(false);
    let showReportOptions = $state(false);
    let reportType        = $state<'coach-session'>('coach-session');
    let reportDetailLevel = $state<ReportDetailLevel>('coach');
    let includeCharts     = $state(true);
    let includeDiag       = $state(true);
    let includeAppendix   = $state(false);
    let includeGoals      = $state(false);

    onMount(() => {
        isMobile = window.innerWidth < 640;

        // Initialise selectedRunIdx from URL ?run= param
        const urlParams = new URLSearchParams(window.location.search);
        const runParam  = urlParams.get('run');
        if (runParam) {
            const runNumber = parseInt(runParam, 10);
            const idx = data.runs.findIndex((r: any) => r.run_number === runNumber);
            if (idx >= 0) selectedRunIdx = idx;
        }

        const handleResize = () => { isMobile = window.innerWidth < 640; };
        const handleScroll = () => { scrolled = window.scrollY > 200; };
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    });

    // Keep ?run= in sync with selection
    $effect(() => {
        if (!browser || !data.runs[selectedRunIdx]) return;
        const runNumber = data.runs[selectedRunIdx].run_number;
        const url = new URL(window.location.href);
        url.searchParams.set('run', String(runNumber));
        window.history.replaceState({}, '', url.toString());
    });

    // ── Performance Engine (single source of truth) ───────────────────────────

    let performanceAnalysis = $derived(analyseSession(
        { ...data.session, runs: (data as any).analysisRuns as any },
        {
            riderLevel:       (data.session.rider_profiles as any)?.rider_level,
            riderWeightKg:    data.riderWeight,
            bikeWeightKg:     data.bikeWeight,
            crankLengthMm:    data.crankLength,
            sessionFocus:     (data.session as any).session_focus ?? null,
            rideFeel:         (data.session as any).ride_feel ?? null,
            weatherCondition: (data.session as any).weather_conditions ?? null,
            trackSurface:     (data.session as any).track_surface ?? null,
        },
        { selectedRunIndex: selectedRunIdx }
    ));

    let analysisView     = $derived(createAnalysisView(performanceAnalysis, 'coach'));
    let chartSeries      = $derived(buildChartSeries(performanceAnalysis));

    let selectedRun  = $derived(data.runs[selectedRunIdx]);
    let selectedGate = $derived((selectedRun as any)?.gate_runs ?? null);
    let riderLevel   = $derived((data.session.rider_profiles as any)?.rider_level ?? null);

    // ── NEW: Performance Engine Detailed Analysis ──────────────────────────────
    let techniqueScoreBreakdown = $derived.by(() => {
        if (!performanceAnalysis.selectedRun) return null;
        return scoreRunTechnique(
            performanceAnalysis.selectedRun,
            performanceAnalysis,
            { riderLevel: (riderLevel as DetailLevel) || 'rider' }
        );
    });

    let coachDiagnostics = $derived.by(() => {
        if (!techniqueScoreBreakdown) return [];
        return buildCoachDiagnostics(performanceAnalysis, techniqueScoreBreakdown, {
                sessionFocus: (data.session as any).session_focus ?? null,
                rideFeel:     (data.session as any).ride_feel ?? null,
            });
    });

    let insightPack = $derived(
        buildPerformanceInsightPack(
            performanceAnalysis,
            (riderLevel as DetailLevel) || 'rider'
        )
    );
    let uciCategory  = $derived(getUCICategory((data.session.rider_profiles as any)?.date_of_birth));

    let sessionDate = $derived(new Date(data.session.timestamp).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }));

    // ── Report generation ─────────────────────────────────────────────────────

    let consistency = $derived(performanceAnalysis.summary.consistencyScore !== null ? {
        cv:    performanceAnalysis.summary.consistencyScore,
        label: performanceAnalysis.summary.consistencyLabel ?? 'Unknown',
    } : null);

    let techniqueScores = $derived(performanceAnalysis.selectedRun?.technique);
    let jerkProfile = $derived(performanceAnalysis.selectedRun?.physics?.jerk ? {
        ...performanceAnalysis.selectedRun.physics.jerk,
        data: performanceAnalysis.selectedRun.physics.jerkSeries?.map((p: any) => ({ timeS: p.timeS, jerk: p.value })) ?? []
    } : null);
    let impulse   = $derived(performanceAnalysis.selectedRun?.physics?.impulse);
    let weaknesses     = $derived(performanceAnalysis.weaknesses);
    let recommendations = $derived(performanceAnalysis.recommendations);

    async function generateReport() {
        generating = true;
        try {
            const engineDetailLevel =
                reportDetailLevel === 'simple'    ? 'grom'  :
                reportDetailLevel === 'standard'  ? 'rider' :
                reportDetailLevel === 'coach'     ? 'coach' :
                reportDetailLevel === 'technical' ? 'coach' : 'rider';

            const view = createAnalysisView(performanceAnalysis, engineDetailLevel);
            const allRuns = performanceAnalysis.runs ?? [];

            const runSummaries = allRuns.map((r: any) => ({
                runNumber:        r.runNumber ?? 0,
                reactionMs:       r.reactionMs ?? null,
                maxG:             r.maxG ?? null,
                peakSpeedKmh:     r.physics?.speedKmh?.length ? Math.max(...r.physics.speedKmh) : null,
                techniqueOverall: r.technique?.overall ?? null,
                analyticsValid:   r.analyticsValid ?? false,
            }));

            const intelligence       = performanceAnalysis.intelligence;
            const bestVsAvgGap       = intelligence?.bestVsAvg?.gapPercent ?? null;
            const dropOffRun         = intelligence?.dropOff?.dropOffRun ?? null;
            const optimalSetLength   = intelligence?.setLength?.optimal ?? runSummaries.length;
            const qualityScore       = intelligence?.sessionQuality ?? null;
            const repeatabilityScore = intelligence?.repeatability?.overall ?? null;
            const cvPercent          = consistency?.cv ?? null;

            const primaryRecs = (view.nextActions ?? [])
                .filter((a: string) => a?.trim().length > 0)
                .slice(0, 3)
                .map((action: string, i: number) => ({
                    id:       `action-${i}`,
                    title:    action.split(':')[0]?.trim() ?? `Focus ${i + 1}`,
                    body:     action,
                    priority: (i === 0 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
                }));

            const weaknessRecs = reportDetailLevel === 'coach' || reportDetailLevel === 'technical'
                ? (weaknesses ?? [])
                    .filter((w: any) => w?.area && typeof w.score === 'number' && w.score < 60)
                    .slice(0, 2)
                    .map((w: any, i: number) => ({
                        id:       `weakness-${i}`,
                        title:    w.area === 'Repeatability' ? 'Improve start consistency' : w.area,
                        body:     w.advice?.[0] ?? `${w.area} needs attention`,
                        priority: ((w.score ?? 0) < 40 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
                    }))
                : [];

            const seen = new Set<string>();
            const mergedRecs = [...primaryRecs, ...weaknessRecs]
                .filter(rec => {
                    const key = rec.title.toLowerCase().slice(0, 30);
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
                .slice(0, 5)
                .map((rec, i) => ({ ...rec, id: `rec-${i}` }));

            const selectedRunAnalysis = performanceAnalysis.selectedRun;
            const techniqueSummary = selectedRunAnalysis?.technique ? {
                overall:         selectedRunAnalysis.technique.overall       ?? null,
                reaction:        selectedRunAnalysis.technique.reaction      ?? null,
                explosiveness:   selectedRunAnalysis.technique.explosiveness ?? null,
                smoothness:      selectedRunAnalysis.technique.smoothness    ?? null,
                efficiency:      selectedRunAnalysis.technique.efficiency    ?? null,
                wheelieRunCount: (data as any).analysisRuns.filter((r: any) => r.gate_runs?.front_wheel_lifted).length,
                controlledLiftCount: 0,
                excessiveLiftCount:  0,
                summary: selectedRunAnalysis.physics?.jerk?.insight ?? jerkProfile?.insight ?? null,
            } : null;

            const watchItems: string[] = [];
            (view.insights ?? []).filter((i: any) => i.tone === 'warning').slice(0, 2).forEach((i: any) => watchItems.push(i.title));
            if (dropOffRun !== null) watchItems.push(`Performance dropped off at run ${dropOffRun}`);
            if (bestVsAvgGap !== null && bestVsAvgGap > 10) watchItems.push(`${bestVsAvgGap.toFixed(0)}% gap between best and average run`);

            const quality = performanceAnalysis.selectedRun?.physics?.dataQuality;

            const sessionInput = {
                riderName:       (data as any).profile?.name ?? (data as any).profile?.display_name ?? undefined,
                sessionId:       data.session.id,
                sessionTitle:    sessionDate,
                sessionDate:     sessionDate,
                runCount:        (data as any).analysisRuns.length,
                excludedRunCount: data.sessionStats.excluded_run_count ?? 0,
                excludedReasons: data.runs
                    .flatMap((r: any) => getExclusionReasons(r.tags)),
                sessionFocus:        (data.session as any).session_focus     ?? null,
                trackSurface:        (data.session as any).track_surface     ?? null,
                weatherCondition:    (data.session as any).weather_conditions ?? null,
                rideFeel:            (data.session as any).ride_feel          ?? null,
                sessionNotes:    (data.sessionNotes ?? []).map((n: any) => ({
                    note_type:   n.note_type,
                    content:     n.content,
                    author_role: n.author_role ?? null,
                    created_at:  n.created_at,
                })),
                riderLevel:      riderLevel ?? undefined,
                sessionReport: {
                    sessionQuality: qualityScore,
                    headline:       view.headline,
                    confidence:     50,
                    repeatability: cvPercent !== null ? { overall: repeatabilityScore, cvPercent, label: consistency?.label ?? null } : null,
                    bestVsAvg: bestVsAvgGap !== null ? { gapPercent: bestVsAvgGap } : null,
                    setLength: { optimal: optimalSetLength, message: optimalSetLength < (data as any).analysisRuns.length ? `Quality held for ${optimalSetLength} of ${(data as any).analysisRuns.length} runs` : null },
                    dropOff: { dropOffRun },
                    phaseAnalysis: null,
                    impulseAnalysis: impulse ? {
                        totalImpulseNs:     impulse.totalImpulseNs,
                        timeToHalfImpulseS: impulse.timeToHalfImpulseS,
                        frontLoadedScore:   impulse.frontLoadedScore,
                        impulseEfficiency:  impulse.impulseEfficiency,
                    } : null,
                    runSummaries,
                    recommendations: mergedRecs,
                },
                sessionNarrative: {
                    message: {
                        headline:       view.headline,
                        impact:         view.summary,
                        action:         mergedRecs[0]?.body ?? null,
                        whyThisMatters: view.insights?.[0]?.body ?? null,
                        watchFor:       watchItems[0] ?? null,
                    },
                    trust: {
                        confidence: 'moderate' as const,
                        basedOnRuns: (data as any).analysisRuns.length,
                        excludedRuns: data.sessionStats.excluded_run_count ?? 0,
                        excludedReasons: data.runs
                            .filter((r: any) => data.sessionStats.excluded_run_count > 0)
                            .flatMap((r: any) => getExclusionReasons(r.tags)),
                        trustedMetrics: ['reaction time'],
                        cautionMetrics: (
                            (data.session as any).track_surface === 'wet' ||
                            (data.session as any).track_surface === 'muddy'
                        ) ? ['speed', 'explosiveness'] : [],
                        blockedMetrics: [],
                    },
                    insights: (view.insights ?? []).map((i: any) => ({ title: i.title, body: i.body, tone: i.tone })),
                },
                techniqueSummary,
                dataQuality: {
                    label:          quality?.badge ?? null,
                    biasCorrection: data.runs[0]?.gate_runs?.bias_correction_ms2 ?? null,
                    analyticsValid: !(performanceAnalysis.hasCalibrationWarning ?? false),
                    blocksPower:    !performanceAnalysis.profileComplete,
                    blocksSpeed:    performanceAnalysis.hasCalibrationWarning ?? false,
                },
                recommendations: mergedRecs,
                // Goal progress this session — surfaces in report context
                goalProgress: (data as any).goalProgress?.length > 0
                    ? (data as any).goalProgress.map((g: any) => ({
                        goalId:        g.goalId,
                        metric:        g.metric,
                        metricLabel:   g.metricLabel,
                        improvement:   g.improvement,
                        percentToGoal: g.percentToGoal,
                        isSignificant: g.isSignificant ?? false,
                    }))
                    : null,
                // Build actual chart data from performance analysis
                charts: includeCharts ? [
                    // Acceleration/G-Force chart
                    {
                        id: 'gforce-chart',
                        title: 'G-Force Trace',
                        description: 'Acceleration through the run — shows force application timing and peak.',
                        chartType: 'line' as const,
                        dataKey: 'acceleration',
                        includeByDefault: true,
                        data: chartSeries?.acceleration?.map((p: any, i: number) => ({
                            x: p.timeS ?? i * 0.01,
                            y: p.value ?? 0
                        })) ?? []
                    },
                    // Run progression chart (reaction times)
                    {
                        id: 'run-progression-chart',
                        title: 'Run-by-Run Performance',
                        description: 'Reaction time across all runs — shows consistency and drop-off patterns.',
                        chartType: 'bar' as const,
                        dataKey: 'runProgression',
                        includeByDefault: true,
                        data: allRuns.map((r: any, i: number) => ({
                            x: i + 1,
                            y: (r.reactionMs ?? 0) / 1000 // Convert to seconds
                        }))
                    },
                    // Speed curve (if available)
                    ...(chartSeries?.speed && chartSeries.speed.length > 0 ? [{
                        id: 'speed-chart',
                        title: 'Speed Development',
                        description: 'Estimated speed curve from IMU data.',
                        chartType: 'line' as const,
                        dataKey: 'speed',
                        includeByDefault: true,
                        data: chartSeries.speed.map((p: any, i: number) => ({
                            x: p.timeS ?? i * 0.01,
                            y: p.value ?? 0
                        }))
                    }] : [])
                ] : undefined
            };

            report = buildCoachSessionReport(sessionInput, {
                detailLevel: reportDetailLevel,
                includeCharts,
                includeDiagnostics: includeDiag,
                includeAppendix,
            });

            showReport = true;
        } catch (error) {
            console.error('Failed to generate report:', error);
        } finally {
            generating = false;
        }
    }

    function closeReport() { showReport = false; }

    // ── Cross-Session Intelligence ────────────────────────────────────────────
    
    let crossSessionReport = $derived.by(() => {
        const sessions = (data as any).advancedAnalytics?.sessions;
        if (!sessions || sessions.length < 3) return null;
        
        // Transform session data for cross-session intelligence
        const sessionSummaries = sessions.map((s: any) => {
            const runs = s.runs?.map((r: any) => ({
                reactionMs: r.reaction_time_ms,
                peakSpeed: r.peak_speed_ms ? r.peak_speed_ms * 3.6 : null,
                maxG: r.max_g
            })) ?? [];
            
            const intelligence = runs.length > 0 ? analyseSessionIntelligence(runs) : null;
            
            return {
                sessionId: s.id,
                date: s.timestamp,
                runCount: s.run_count || runs.length,
                
                // Session intelligence metrics
                sessionQuality: intelligence?.sessionQuality ?? null,
                repeatabilityScore: intelligence?.repeatability?.overall ?? null,
                bestVsAvgGapPercent: intelligence?.bestVsAvg?.gapPercent ?? null,
                dropOffRun: intelligence?.dropOff?.dropOffRun ?? null,
                optimalSetLength: intelligence?.setLength?.optimal ?? null,
                
                // Performance metrics
                bestSpeedKmh: s.best_peak_speed_ms ? s.best_peak_speed_ms * 3.6 : null,
                avgSpeedKmh: s.avg_peak_speed_ms ? s.avg_peak_speed_ms * 3.6 : null,
                bestReactionTimeSec: s.best_reaction_ms ? s.best_reaction_ms / 1000 : null,
                avgReactionTimeSec: s.avg_reaction_ms ? s.avg_reaction_ms / 1000 : null,
                peakG: s.best_max_g,
                avgPeakG: s.avg_max_g
            };
        });

        const rawReport = analyseCrossSessionIntelligence(sessionSummaries);
        return applyTruthRulesToReport(rawReport);
    });

    // ── Expose shared state to child pages via Svelte context ─────────────────

    setContext('session', {
        get data()                      { return data; },
        get selectedRunIdx()            { return selectedRunIdx; },
        set selectedRunIdx(v: number)   { selectedRunIdx = v; },
        get selectedRun()               { return selectedRun; },
        get selectedGate()              { return selectedGate; },
        get isMobile()                  { return isMobile; },
        get riderLevel()                { return riderLevel; },
        get sessionDate()               { return sessionDate; },
        get uciCategory()               { return uciCategory; },
        get performanceAnalysis()       { return performanceAnalysis; },
        get analysisView()              { return analysisView; },
        get chartSeries()               { return chartSeries; },
        get consistency()               { return consistency; },
        get techniqueScores()           { return techniqueScores; },
        get jerkProfile()               { return jerkProfile; },
        get weaknesses()                { return weaknesses; },
        get recommendations()           { return recommendations; },
        get crossSessionReport()        { return crossSessionReport; },
        get techniqueScoreBreakdown()   { return techniqueScoreBreakdown; },
        get coachDiagnostics()          { return coachDiagnostics; },
        get insightPack()               { return insightPack; },
        openHelp,
        openReport: () => { showReportOptions = true; },
    });

    // ── Sub-page nav helpers ──────────────────────────────────────────────────

    let currentPath = $derived($page.url.pathname);
    let sessionBase = $derived(`/sessions/${data.session.id}`);

    // Top tab bar — underline style inside rounded card
    function tabClass(path: string) {
        const active = path === sessionBase
            ? currentPath === sessionBase
            : currentPath.startsWith(path);
        return active
            ? 'px-4 py-3 text-sm font-semibold themed-accent border-b-2 border-[color:var(--color-jns-amber)] transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[color:var(--color-jns-amber)]/40'
            : 'px-4 py-3 text-sm font-medium themed-text-secondary hover:themed-text-primary border-b-2 border-transparent transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[color:var(--color-jns-amber)]/40';
    }

    // Sticky footer pills (compact, used once scrolled)
    function navClass(path: string) {
        const active = path === sessionBase
            ? currentPath === sessionBase
            : currentPath.startsWith(path);
        return active
            ? 'px-4 py-1.5 rounded-lg text-xs font-semibold themed-bg-accent themed-accent border border-[color:var(--accent)]/30'
            : 'px-4 py-1.5 rounded-lg text-xs font-medium themed-text-secondary hover:themed-text-primary hover:bg-[color:var(--card-nested)] transition-colors';
    }
</script>

<!-- ══════════════════════════════════════════════════════
     OPTION A: UNDERLINE TAB BAR — always visible below header
     ══════════════════════════════════════════════════════ -->
<div class="bg-[color:var(--theme-surface)] border border-[color:var(--theme-border)] rounded-xl mb-5">
    <nav class="flex items-center px-1" aria-label="Session sections">
        <a href="{sessionBase}"          class="{tabClass(sessionBase)}">Overview</a>
        <a href="{sessionBase}/analysis" class="{tabClass(`${sessionBase}/analysis`)}">Analysis</a>
        <a href="{sessionBase}/detail"   class="{tabClass(`${sessionBase}/detail`)}">Deep Dive</a>
    </nav>
</div>

<div class="pb-20">
    {@render children()}
</div>

<!-- ══════════════════════════════════════════════════════
     STICKY FOOTER — always visible, gives run context + report shortcut
     ══════════════════════════════════════════════════════ -->
{#if scrolled}
    <div class="fixed bottom-0 left-0 right-0 z-40 bg-[color:var(--theme-surface)]/95 backdrop-blur-sm border-t border-[color:var(--theme-border)] shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <div class="flex items-center justify-between gap-4">

                <!-- Sub-page navigation -->
                <nav class="flex items-center gap-1" aria-label="Session sections">
                    <a href="{sessionBase}"          class="{navClass(sessionBase)}">Overview</a>
                    <a href="{sessionBase}/analysis" class="{navClass(`${sessionBase}/analysis`)}">Analysis</a>
                    <a href="{sessionBase}/detail"   class="{navClass(`${sessionBase}/detail`)}">Deep Dive</a>
                </nav>

                <!-- Session info (desktop) -->
                <div class="hidden md:flex items-center gap-2 text-xs themed-text-secondary">
                    <span>{sessionDate}</span>
                    <span>•</span>
                    <span>{data.sessionStats.run_count} runs</span>
                    {#if selectedRun}
                        <span>•</span>
                        <span class="themed-accent">Run #{selectedRun.run_number}</span>
                    {/if}
                </div>

                <!-- Report button -->
                <button
                    onclick={() => showReportOptions = true}
                    class="flex items-center gap-2 px-4 py-2 bg-[color:var(--accent)] hover:bg-[color:var(--accent-dark)]
                           text-[color:var(--bg)] text-sm font-semibold rounded-lg transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--card)]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <span class="hidden sm:inline">Report</span>
                </button>

            </div>
        </div>
    </div>
{/if}

<!-- Report Options Modal -->
{#if showReportOptions}
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4"
         role="button" tabindex="0"
         onclick={(e) => e.target === e.currentTarget && (showReportOptions = false)}
         onkeydown={(e) => (e.key === 'Escape' || (e.key === 'Enter' && e.target === e.currentTarget)) && (showReportOptions = false)}
         aria-label="Close report options">
        <div class="w-full max-w-3xl my-8"
             role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="report-options-title"
             onclick={(e) => e.stopPropagation()}
             onkeydown={(e) => e.stopPropagation()}>
            <div class="themed-card border-b border-[color:var(--border)] rounded-t-xl px-5 py-4 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg themed-bg-accent flex items-center justify-center">
                        <svg class="w-4 h-4 themed-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <div>
                        <h2 id="report-options-title" class="text-base font-bold themed-text-primary">Generate Session Report</h2>
                        <p class="text-xs themed-text-subtle">Customize your report options</p>
                    </div>
                </div>
                <button onclick={() => showReportOptions = false}
                    class="w-8 h-8 flex items-center justify-center rounded-lg themed-text-subtle
                           hover:themed-text-primary hover:bg-[color:var(--card-nested)] transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]" aria-label="Close">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="themed-card rounded-b-xl p-5 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <ReportOptionsPanel
                            bind:reportType={reportType}
                            bind:detailLevel={reportDetailLevel}
                            bind:includeCharts={includeCharts}
                            bind:includeDiag={includeDiag}
                            bind:includeAppendix={includeAppendix}
                            bind:includeGoals={includeGoals}
                            hasActiveGoals={(data as any).goalProgress?.length > 0}
                            onGenerate={async () => { await generateReport(); showReportOptions = false; }}
                            generating={generating}
                        />
                    </div>
                    <div class="themed-nested-card rounded-lg p-4">
                        <h4 class="text-xs font-semibold themed-accent uppercase tracking-wider mb-3">What's Included</h4>
                        <ul class="space-y-2 text-xs themed-text-secondary">
                            <li class="flex items-start gap-2"><span class="themed-accent">•</span><span>Executive summary with confidence indicator</span></li>
                            <li class="flex items-start gap-2"><span class="themed-accent">•</span><span>Session quality metrics and repeatability analysis</span></li>
                            <li class="flex items-start gap-2"><span class="themed-accent">•</span><span>Technique breakdown with scores and recommendations</span></li>
                            {#if includeCharts}<li class="flex items-start gap-2"><span class="text-[#3de8c8]">•</span><span>Visual charts and performance curves</span></li>{/if}
                            {#if includeDiag}<li class="flex items-start gap-2"><span class="text-[#3de8c8]">•</span><span>Data quality assessment and diagnostics</span></li>{/if}
                            {#if includeAppendix}<li class="flex items-start gap-2"><span class="text-[#3de8c8]">•</span><span>Technical appendix with raw metrics</span></li>{/if}
                        </ul>
                        <div class="mt-4 pt-4 border-t border-[color:var(--border)]">
                            <p class="text-[10px] themed-text-subtle">Reports can be printed or saved as PDF. JSON export available for data analysis.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<!-- Report Preview Modal -->
{#if showReport && report}
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4"
         role="button" tabindex="0"
         onclick={(e) => e.target === e.currentTarget && closeReport()}
         onkeydown={(e) => (e.key === 'Escape' || (e.key === 'Enter' && e.target === e.currentTarget)) && closeReport()}
         aria-label="Close report preview">
        <div class="w-full max-w-5xl my-8"
             role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="report-title"
             onclick={(e) => e.stopPropagation()}
             onkeydown={(e) => e.stopPropagation()}>
            <ReportPreview {report} onClose={closeReport} />
        </div>
    </div>
{/if}

<HelpPanel helpKey={helpKey} bind:open={helpOpen} />