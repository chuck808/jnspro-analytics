<script lang="ts">
    import type { PageData } from './$types';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { getSessionLink } from '$lib/utils/deepLinks';
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
        CorrelationInsightsPanel
    } from '$lib/components/analytics';
    import RawPerformanceTrendsSection from '$lib/components/analytics/RawPerformanceTrendsSection.svelte';
    import { analyseSessionIntelligence } from '$lib/performance-engine';
    import { analyseCrossSessionIntelligence } from '$lib/performance-engine/crossSession';
    import { applyTruthRulesToReport } from '$lib/performance-engine/crossSession/truthRules';
    import { rateSessionMetrics } from '$lib/performance-engine/thresholds';
    import { buildSessionNarrative } from '$lib/performance-engine/sessionNarrative';
    import { buildProgressReport } from '$lib/report-engine';
    import { ReportOptionsPanel, ReportPreview } from '$lib/components/reports';
    import type { GeneratedReport, ReportDetailLevel } from '$lib/report-engine/types';

    let { data }: { data: PageData } = $props();

    let isMobile = $state(false);
    let helpKey = $state('');
    let helpOpen = $state(false);
    function openHelp(key: string) { helpKey = key; helpOpen = true; }

    onMount(() => {
        isMobile = window.innerWidth < 640;
        const handleResize = () => { isMobile = window.innerWidth < 640; };
        window.addEventListener('resize', handleResize);
        
        // Handle URL focus parameter for deep-linking to specific charts
        const focus = $page.url.searchParams.get('focus');
        if (focus) {
            setTimeout(() => {
                const element = document.getElementById(`${focus}-chart`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
        
        return () => window.removeEventListener('resize', handleResize);
    });

    const THRESHOLDS = $derived([
        { count:1,  label:'Session summaries',      unlocked: true },
        { count:2,  label:'Session comparison',     unlocked: data.sessionCount >= 2 },
        { count:3,  label:'Trend charts',           unlocked: data.sessionCount >= 3 },
        { count:3,  label:'Consistency scoring',    unlocked: data.sessionCount >= 3 },
        { count:10, label:'Full rolling analytics', unlocked: data.sessionCount >= 10 },
        { count:20, label:'Statistical analysis',   unlocked: data.sessionCount >= 20 },
    ]);

    // ── Performance Engine Integration ──
    // Compute session intelligence for ALL sessions
    let allSessionReports = $derived.by(() => {
        return data.sessions.map(session => {
            const runs = data.allRuns
                .filter(r => r.session_id === session.id)
                .map(r => ({
                    reactionMs: r.reaction_time_ms,
                    peakSpeed: r.peak_speed_ms ? r.peak_speed_ms * 3.6 : null,
                    maxG: r.max_g
                }));
            
            if (runs.length === 0) return null;
            
            const intelligence = analyseSessionIntelligence(runs);
            return {
                sessionId: session.id,
                intelligence
            };
        }).filter(Boolean);
    });

    // Latest session intelligence report (v7.2)
    let latestSessionReport = $derived.by(() => {
        if (allSessionReports.length === 0) return null;
        const lastReport = allSessionReports[allSessionReports.length - 1];
        return lastReport ? lastReport.intelligence : null;
    });

    // Transform session summaries for cross-session intelligence (v8.1 + v8.2)
    let crossSessionReport = $derived.by(() => {
        if (data.sessionCount < 3) return null;
        
        const sessionSummaries = data.sessions.map((s, index) => {
            const sessionReport = allSessionReports.find(r => r && r.sessionId === s.id);
            const intelligence = sessionReport?.intelligence;
            
            return {
                sessionId: s.id,
                date: s.timestamp,
                runCount: s.run_count,
                
                // Use real v7.2 session intelligence outputs
                sessionQuality: intelligence?.sessionQuality ?? null,
                repeatabilityScore: intelligence?.repeatability.overall ?? null,
                bestVsAvgGapPercent: intelligence?.bestVsAvg?.gapPercent ?? null,
                dropOffRun: intelligence?.dropOff?.dropOffRun ?? null,
                optimalSetLength: intelligence?.setLength.optimal ?? null,
                
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
        
        // v8.2: Apply truth rules
        return applyTruthRulesToReport(rawReport);
    });

    // ── BMX Threshold Ratings ──
    let latestSessionRatings = $derived.by(() => {
        if (data.sessions.length === 0) return null;
        const latest = data.sessions[data.sessions.length - 1];
        const latestIntelligence = latestSessionReport;
        
        return rateSessionMetrics({
            reactionTimeMs: latest.best_reaction_ms,
            peakSpeedKmh: latest.best_peak_speed_ms ? latest.best_peak_speed_ms * 3.6 : null,
            peakG: latest.best_max_g,
            repeatabilityScore: latestIntelligence?.repeatability.overall ?? null,
            bestVsAvgGapPercent: latestIntelligence?.bestVsAvg?.gapPercent ?? null
        }, 'rider');
    });

    // ── v8.3 Session Narrative ──
    let latestSessionNarrative = $derived.by(() => {
        if (data.sessions.length === 0 || !latestSessionReport) return null;
        const latest = data.sessions[data.sessions.length - 1];
        
        return buildSessionNarrative({
            runCount: latest.run_count,
            consistencyScore: latestSessionReport.repeatability.overall,
            reactionCvPercent: latest.reaction_cv,
            dataQualityRating: null,
            speedBlocked: false,
            powerBlocked: false,
            hasCalibrationWarnings: false,
            fatigueDetected: latestSessionReport.fatigue.trend === 'declining',
            dropOffRun: latestSessionReport.dropOff?.dropOffRun ?? null,
            bestVsAvgGapPercent: latestSessionReport.bestVsAvg?.gapPercent ?? null
        });
    });

    // Prepare data for Performance Patterns Section
    let performancePatternsData = $derived.by(() => {
        return data.sessions.map((s, index) => {
            const sessionReport = allSessionReports.find(r => r && r.sessionId === s.id);
            const intelligence = sessionReport?.intelligence;
            
            return {
                id: s.id,
                timestamp: s.timestamp,
                bestVsAvgGapPercent: intelligence?.bestVsAvg?.gapPercent ?? null,
                optimalSetLength: intelligence?.setLength.optimal ?? null,
                dropOffRun: intelligence?.dropOff?.dropOffRun ?? null,
                best_peak_speed_ms: s.best_peak_speed_ms,
                reaction_cv: s.reaction_cv
            };
        });
    });

    // ── Performance Engine Trend Data ──
    // Extract trend data from session intelligence reports
    let techniqueData = $derived(allSessionReports.map((report, index) => {
        if (!report) return null;
        const session = data.sessions[index];
        return {
            sessionDate: new Date(session.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            sessionNumber: index + 1,
            // Note: technique scores require full Performance Engine per-run analysis
            // Using repeatability as a proxy for overall technique consistency
            overall: report.intelligence.repeatability?.overall ?? null,
            reaction: null, // Would need per-run technique analysis
            explosiveness: null,
            smoothness: null,
            efficiency: null,
        };
    }).filter((d): d is NonNullable<typeof d> => d !== null));

    let dataQualityData = $derived(data.sessions.map((session, index) => {
        const firstRun = data.allRuns.find(r => r.session_id === session.id);
        // Note: bias_correction_ms2 requires full run data from server
        const biasCorrection = (firstRun as any)?.bias_correction_ms2 ?? null;
        return {
            sessionDate: new Date(session.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            sessionNumber: index + 1,
            biasCorrection: biasCorrection,
            qualityRating: (() => {
                const bias = Math.abs(biasCorrection ?? 0);
                if (bias < 0.5) return 'excellent';
                if (bias < 1.0) return 'good';
                if (bias < 2.0) return 'fair';
                return 'calibrate';
            })() as 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown',
            analyticsValid: firstRun?.analytics_valid ?? false,
        };
    }));

    let powerData = $derived(data.sessions.map((session, index) => {
        // Power requires rider weight + bike weight
        const riderWeight = data.profile && typeof data.profile === 'object' && 'weight_kg' in data.profile ? (data.profile.weight_kg as number | null) : null;
        const bikeWeight = data.bikes?.[0]?.weight_kg ?? null;
        const hasWeight = ((riderWeight ?? 0) as number) + ((bikeWeight ?? 0) as number) > 0;
        const totalMassKg = hasWeight ? ((riderWeight ?? 0) as number) + ((bikeWeight ?? 0) as number) : null;
        
        return {
            sessionDate: new Date(session.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            sessionNumber: index + 1,
            // Estimate peak power from max G
            peakPowerW: session.best_max_g && totalMassKg 
                ? Math.round(session.best_max_g * 9.81 * totalMassKg) 
                : null,
            avgPowerW: session.avg_max_g && totalMassKg 
                ? Math.round(session.avg_max_g * 9.81 * totalMassKg) 
                : null,
            riderWeightKg: riderWeight as number | null,
        };
    }));

    let smoothnessData = $derived(data.sessions.map((session, index) => {
        const report = allSessionReports.find(r => r && r.sessionId === session.id);
        return {
            sessionDate: new Date(session.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            sessionNumber: index + 1,
            // Using repeatability as proxy for smoothness (more repeatable = smoother technique)
            smoothnessScore: report?.intelligence.repeatability?.overall ?? null,
            meanJerk: null, // Would need full physics analysis
        };
    }));

    let wheelieData = $derived(data.sessions.map((session, index) => {
        const sessionRuns = data.allRuns.filter(r => r.session_id === session.id);
        // Note: front_wheel_lifted not available in allRuns data structure
        const wheelieRuns = sessionRuns.filter(r => 'front_wheel_lifted' in r && r.front_wheel_lifted === true);
        const nonWheelieRuns = sessionRuns.filter(r => !('front_wheel_lifted' in r) || r.front_wheel_lifted !== true);
        
        const avgReaction = (runs: typeof sessionRuns) => {
            const valid = runs.filter(r => r.reaction_time_ms !== null);
            return valid.length > 0
                ? valid.reduce((sum, r) => sum + r.reaction_time_ms!, 0) / valid.length
                : null;
        };
        
        return {
            sessionDate: new Date(session.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            sessionNumber: index + 1,
            wheelieRate: sessionRuns.length > 0 
                ? (wheelieRuns.length / sessionRuns.length) * 100 
                : 0,
            avgReactionMs: avgReaction(sessionRuns),
            avgReactionWithWheelieMs: wheelieRuns.length > 0 ? avgReaction(wheelieRuns) : null,
            avgReactionWithoutWheelieMs: nonWheelieRuns.length > 0 ? avgReaction(nonWheelieRuns) : null,
        };
    }));

    // ── Progress Report State ──
    let progressReport: GeneratedReport | null = $state(null);
    let generatingProgress = $state(false);
    let showProgressReport = $state(false);
    let showProgressOptions = $state(false);
    let progressDetailLevel = $state<ReportDetailLevel>('coach');
    let progressIncludeCharts = $state(true);
    let progressIncludeDiag = $state(true);
    let progressIncludeGoals = $state(false);

    // ── Generate Progress Report Function ──
    async function generateProgressReport() {
        generatingProgress = true;
        try {
            // 1. Trend percentages from data.trend
            const reactionTrendPct = data.trend?.reaction ?? null;
            const speedTrendPct = data.trend?.speed ?? null;

            // 2. Recommendations from cross-session engine
            const crossRecs = (crossSessionReport?.recommendations ?? [])
                .filter((r: string) => r && r.trim().length > 10)
                .slice(0, 5)
                .map((r: string, i: number) => ({
                    id: `progress-rec-${i}`,
                    title: r.split(':')[0]?.trim() ?? `Focus ${i + 1}`,
                    body: r,
                    priority: (i === 0 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
                }));

            // 3. Personal bests
            const personalBests = {
                bestReactionMs: data.personalBests?.reaction_ms ?? null,
                bestPeakSpeedKmh: data.personalBests?.peak_speed_ms ? data.personalBests.peak_speed_ms * 3.6 : null,
                bestMaxG: data.personalBests?.max_g ?? null,
            };

            // 4. Date range
            const sessions = data.sessions ?? [];
            const dateRange = sessions.length >= 2
                ? (() => {
                    const first = new Date(sessions[0].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    const last = new Date(sessions[sessions.length - 1].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    return `${first} – ${last}`;
                })()
                : undefined;

            // 5. Goal context (if goals available in data)
            const goalContext = progressIncludeGoals && data.goalTargets && Object.keys(data.goalTargets).length > 0
                ? Object.entries(data.goalTargets).map(([metric, goal]: [string, any]) => ({
                    metric,
                    targetValue: goal.target,
                    currentValue: goal.current,
                    percentToGoal: goal.current && goal.target
                        ? Math.round((goal.current / goal.target) * 100)
                        : null,
                }))
                : null;

            // 6. Build input
            const progressInput = {
                riderName: data.profile?.name ?? data.profile?.display_name ?? undefined,
                sessionCount: data.sessionCount,
                dateRange,
                personalBests,

                // Cross-session intelligence — the heart of this report
                crossSessionReport: crossSessionReport ? {
                    headline: crossSessionReport.headline ?? null,
                    summary: null,
                    overallTrend: crossSessionReport.overallTrend ?? null,
                    confidence: crossSessionReport.confidence ?? 'medium',
                    warnings: crossSessionReport.warnings ?? [],
                    recommendations: crossSessionReport.recommendations ?? [],

                    performance: {
                        reactionTrend: {
                            direction: crossSessionReport.performance?.reactionTrend?.direction ?? null,
                            change: crossSessionReport.performance?.reactionTrend?.change ?? null,
                        },
                        speedTrend: {
                            direction: crossSessionReport.performance?.speedTrend?.direction ?? null,
                            change: crossSessionReport.performance?.speedTrend?.change ?? null,
                        },
                    },

                    consistency: {
                        repeatabilityTrend: {
                            direction: crossSessionReport.consistency?.repeatabilityTrend?.direction ?? null,
                        },
                        bestVsAvgGapTrend: {
                            direction: crossSessionReport.consistency?.bestVsAverageGapTrend?.direction ?? null,
                        },
                    },

                    fatigue: {
                        optimalSetLengthTrend: {
                            direction: crossSessionReport.fatigue?.optimalSetLengthTrend?.direction ?? null,
                        },
                        dropOffTrend: {
                            direction: crossSessionReport.fatigue?.dropOffTrend?.direction ?? null,
                        },
                    },
                } : null,

                // Trend percentages from server
                reactionTrendPercent: reactionTrendPct,
                speedTrendPercent: speedTrendPct,

                // Recommendations
                recommendations: crossRecs,

                // Goal context
                goalContext,

                // Charts (stubs for now)
                charts: [],
            };

            progressReport = buildProgressReport(progressInput, {
                detailLevel: progressDetailLevel,
                includeCharts: progressIncludeCharts,
                includeDiagnostics: progressIncludeDiag,
                includeRecommendations: true,
            });

            showProgressReport = true;
            showProgressOptions = false;

        } catch (error) {
            console.error('Failed to generate progress report:', error);
        } finally {
            generatingProgress = false;
        }
    }

    function closeProgressReport() {
        showProgressReport = false;
    }

    function toggleProgressOptions() {
        showProgressOptions = !showProgressOptions;
    }
</script>

<svelte:head>
    <title>Analytics — AppGatePro</title>
</svelte:head>

<div class="space-y-6">

    <!-- Header -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
            <h2 class="text-lg font-bold themed-text-primary">Performance Analytics</h2>
            <p class="text-sm themed-text-secondary mt-0.5">{data.sessionCount} session{data.sessionCount !== 1 ? 's' : ''} analysed</p>
        </div>
        {#if data.sessionCount > 0}
            <div class="flex items-center gap-2">
                <ExportButton sessions={data.sessions} variant="secondary" />
                <a href="/sessions"
                   class="text-sm themed-text-secondary hover:text-[color:var(--accent)] transition-colors min-h-[44px] flex items-center
                          focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--card)] rounded">
                    View all sessions →
                </a>
            </div>
        {/if}
    </div>

    {#if data.depth === 'none'}
        <!-- Empty state -->
        <div class="themed-card border-[color:var(--accent)]/20 rounded-xl p-12 text-center">
            <div class="w-16 h-16 themed-bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 themed-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                </svg>
            </div>
            <h3 class="text-lg font-semibold themed-text-primary mb-2">Analytics build as you train</h3>
            <p class="text-sm themed-text-secondary mb-6 max-w-md mx-auto">Upload your first session to start seeing performance data.</p>
            <a href="/upload"
               class="inline-flex items-center gap-2 px-6 py-3 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)]
                      text-[color:var(--card)] font-semibold rounded-lg transition-colors text-sm min-h-[44px]
                      focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--card)]">
                Upload first session
            </a>
        </div>

    {:else}

        <!-- Unlock progress -->
        <div class="themed-card rounded-xl p-5">
            <p class="text-xs font-semibold themed-text-subtle uppercase tracking-wider mb-3">Analytics unlocked</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {#each THRESHOLDS as t}
                    <div class="flex items-center gap-2 text-xs">
                        <span class="{t.unlocked ? 'text-[#3de8c8]' : 'themed-text-subtle'}">{t.unlocked ? '✓' : `${t.count}+`}</span>
                        <span class="{t.unlocked ? 'themed-text-secondary' : 'themed-text-subtle'}">{t.label}</span>
                    </div>
                {/each}
            </div>
        </div>

        <!-- 🥇 1. PERFORMANCE OVERVIEW (Decision Layer) -->
        <PerformanceOverview
            sessionCount={data.sessionCount}
            crossSessionReport={crossSessionReport}
            latestSessionRatings={latestSessionRatings}
            personalBests={data.personalBests}
            {isMobile}
        />

        <!-- 🧠 CROSS-SESSION PROGRESS ONLY (v8.1) -->
        {#if crossSessionReport}
            <TrainingInsightsPanel
                sessionReport={null}
                crossSessionReport={crossSessionReport}
                runs={[]}
                detailLevel="rider"
                showSessionSection={false}
                showTechniqueSection={false}
                showProgressSection={true}
            />
        {/if}

        <!-- ── Generate Progress Report Button ── -->
        {#if data.sessionCount >= 3}
            <button
                onclick={() => showProgressOptions = true}
                class="w-full bg-[#131010] border border-[#221c18] hover:border-[#f5a623]/40 rounded-xl p-5
                       transition-colors text-left group
                       focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#0a0809]">
                <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-[#f5a623]/10 flex items-center justify-center
                                    group-hover:bg-[#f5a623]/20 transition-colors flex-shrink-0">
                            <svg class="w-5 h-5 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-[#f0ece4] group-hover:text-[#f5a623] transition-colors mb-0.5">
                                Generate Progress Report
                            </h3>
                            <p class="text-xs text-[#6b5f4d]">
                                {data.sessionCount} session{data.sessionCount !== 1 ? 's' : ''} analysed
                                · Reaction, speed, consistency and fatigue trends
                            </p>
                        </div>
                    </div>
                    <svg class="w-5 h-5 text-[#6b5f4d] group-hover:text-[#f5a623] transition-colors flex-shrink-0"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </div>
            </button>
        {/if}

        <!-- 📊 3. PERFORMANCE PATTERNS (Core Charts Section) -->
        <PerformancePatternsSection 
            sessions={performancePatternsData}
            {isMobile}
            onOpenHelp={openHelp}
        />

        <!-- 📈 4. RAW PERFORMANCE TRENDS (Data View) -->
        {#if data.sessionCount >= 3}
            <div class="space-y-5">
                <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
                    <div class="flex items-center justify-between mb-2">
                        <div>
                            <h2 class="text-lg font-bold text-[#f0ece4]">Raw Performance Trends</h2>
                            <p class="text-sm text-[#9a8f7a] mt-1">Direct metrics over time</p>
                        </div>
                        <span class="text-xs px-3 py-1.5 rounded-full bg-[#6b5f4d]/20 text-[#9a8f7a] font-medium">
                            Data View
                        </span>
                    </div>
                </div>
                
                <RawPerformanceTrendsSection
                    sessions={data.sessions}
                    trend={data.trend}
                    {isMobile}
                    onOpenHelp={openHelp}
                    goalTargets={data.goalTargets}
                />
            </div>

            <!-- Goal Creation CTAs based on trends -->
            {#if data.trend.reaction !== null || data.trend.speed !== null}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#if data.trend.reaction !== null && data.trend.reaction < 0 && !data.activeGoalMetrics.includes('reactionTime')}
                        <div class="bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-xl p-4">
                            <div class="flex items-start gap-3">
                                <svg class="w-5 h-5 text-[#3de8c8] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                                </svg>
                                <div class="flex-1">
                                    <p class="text-sm font-semibold text-[#3de8c8] mb-1">📈 Reaction Time Improving</p>
                                    <p class="text-xs text-[#9a8f7a] mb-2">
                                        {Math.abs(data.trend.reaction).toFixed(1)}% faster — set a goal to stay motivated!
                                    </p>
                                    <a href="/goals" 
                                       class="inline-flex items-center gap-1 text-xs text-[#3de8c8] hover:text-[#f0ece4] font-medium transition-colors
                                              focus:outline-none focus:ring-2 focus:ring-[#3de8c8] rounded">
                                        Create reaction time goal
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    {/if}
                    
                    {#if data.trend.speed !== null && data.trend.speed > 0 && !data.activeGoalMetrics.includes('peakSpeed')}
                        <div class="bg-[#ff6b3d]/10 border border-[#ff6b3d]/30 rounded-xl p-4">
                            <div class="flex items-start gap-3">
                                <svg class="w-5 h-5 text-[#ff6b3d] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                                </svg>
                                <div class="flex-1">
                                    <p class="text-sm font-semibold text-[#ff6b3d] mb-1">⚡ Speed Increasing</p>
                                    <p class="text-xs text-[#9a8f7a] mb-2">
                                        +{data.trend.speed.toFixed(1)}% improvement — track your progress with a goal!
                                    </p>
                                    <a href="/goals" 
                                       class="inline-flex items-center gap-1 text-xs text-[#ff6b3d] hover:text-[#f0ece4] font-medium transition-colors
                                              focus:outline-none focus:ring-2 focus:ring-[#ff6b3d] rounded">
                                        Create speed goal
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        {/if}

        <!-- ── 📊 PERFORMANCE ENGINE DEEP ANALYTICS ── -->
        {#if data.sessionCount >= 5}
            <div class="space-y-5">
                <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
                    <div class="flex items-center justify-between mb-2">
                        <div>
                            <h2 class="text-lg font-bold text-[#f0ece4]">Performance Engine Analytics</h2>
                            <p class="text-sm text-[#9a8f7a] mt-1">Deep insights from comprehensive session analysis</p>
                        </div>
                        <span class="text-xs px-3 py-1.5 rounded-full bg-[#f5a623]/20 text-[#f5a623] font-medium">
                            🚀 New
                        </span>
                    </div>
                    <p class="text-xs text-[#6b5f4d] mt-3 italic">
                        These components are ready for use. To enable, add Performance Engine analysis in +page.server.ts. 
                        See ANALYTICS_ENHANCEMENTS.md for implementation guide.
                    </p>
                </div>

                <!-- Active components with real data -->
                {#if techniqueData.length > 0 || smoothnessData.length > 0}
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {#if techniqueData.length > 0}
                            <TechniqueQualityTrend data={techniqueData} {isMobile} />
                        {/if}
                        {#if smoothnessData.length > 0}
                            <SmoothnessTrend data={smoothnessData} {isMobile} />
                        {/if}
                    </div>
                {/if}

                {#if powerData.length > 0 || dataQualityData.length > 0}
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {#if powerData.length > 0}
                            <PowerOutputTrend data={powerData} {isMobile} />
                        {/if}
                        {#if dataQualityData.length > 0}
                            <DataQualityTrend data={dataQualityData} {isMobile} />
                        {/if}
                    </div>
                {/if}

                {#if wheelieData.length > 0}
                    <WheeliePatternAnalysis data={wheelieData} {isMobile} />
                {/if}
            </div>
        {/if}

        <!-- ── 🔍 CORRELATION INSIGHTS (Phase 3 Task 3.2) ── -->
        <CorrelationInsightsPanel
            insights={data.correlationInsights ?? []}
            minSessionsRequired={10}
            currentSessionCount={data.sessionCount}
        />

        <!-- Show unlock message for minimal depth -->
        {#if data.depth === 'minimal'}
            <div class="bg-[#131010] border border-[#f5a623]/20 rounded-xl p-6 text-center">
                <p class="text-sm font-medium text-[#f5a623] mb-1">{3 - data.sessionCount} more session{3 - data.sessionCount !== 1 ? 's' : ''} to unlock trends</p>
                <p class="text-xs text-[#9a8f7a]">Trend charts, consistency scoring and comparison unlock at 3 sessions</p>
            </div>
        {/if}

    {/if}

</div>

<!-- ── Report Options Modal ── -->
{#if showProgressOptions}
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4"
         role="button"
         tabindex="0"
         onclick={(e) => e.target === e.currentTarget && (showProgressOptions = false)}
         onkeydown={(e) => (e.key === 'Escape' || (e.key === 'Enter' && e.target === e.currentTarget)) && (showProgressOptions = false)}
         aria-label="Close report options">
        <div class="w-full max-w-3xl my-8"
             role="dialog"
             tabindex="-1"
             aria-modal="true"
             aria-labelledby="progress-report-options-title"
             onclick={(e) => e.stopPropagation()}
             onkeydown={(e) => e.stopPropagation()}>

            <!-- Modal header -->
            <div class="bg-[#131010] border-b border-[#221c18] rounded-t-xl px-5 py-4 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-[#f5a623]/10 flex items-center justify-center">
                        <svg class="w-4 h-4 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                    </div>
                    <div>
                        <h2 id="progress-report-options-title" class="text-base font-bold text-[#f0ece4]">
                            Generate Progress Report
                        </h2>
                        <p class="text-xs text-[#6b5f4d]">
                            {data.sessionCount} sessions · {crossSessionReport?.confidence ?? 'medium'} confidence
                        </p>
                    </div>
                </div>
                <button
                    onclick={() => showProgressOptions = false}
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b5f4d]
                           hover:text-[#f0ece4] hover:bg-[#221c18] transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                    aria-label="Close">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- Modal body -->
            <div class="bg-[#131010] rounded-b-xl p-5 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <!-- Options panel -->
                    <div class="space-y-5">
                        <!-- Detail level -->
                        <fieldset>
                            <legend class="text-xs font-semibold text-[#6b5f4d] uppercase tracking-wider mb-2">Audience</legend>
                            <div class="space-y-1.5">
                                <label class="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors
                                              {progressDetailLevel === 'simple' ? 'bg-[#f5a623]/10 border border-[#f5a623]/30' : 'bg-[#0a0809] border border-[#221c18] hover:border-[#f5a623]/20'}">
                                    <input type="radio" bind:group={progressDetailLevel} value="simple" class="mt-0.5 accent-[#f5a623]" />
                                    <div>
                                        <p class="text-sm font-medium {progressDetailLevel === 'simple' ? 'text-[#f5a623]' : 'text-[#f0ece4]'}">Simple</p>
                                        <p class="text-xs text-[#6b5f4d]">Rider or parent — plain language</p>
                                    </div>
                                </label>
                                <label class="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors
                                              {progressDetailLevel === 'standard' ? 'bg-[#f5a623]/10 border border-[#f5a623]/30' : 'bg-[#0a0809] border border-[#221c18] hover:border-[#f5a623]/20'}">
                                    <input type="radio" bind:group={progressDetailLevel} value="standard" class="mt-0.5 accent-[#f5a623]" />
                                    <div>
                                        <p class="text-sm font-medium {progressDetailLevel === 'standard' ? 'text-[#f5a623]' : 'text-[#f0ece4]'}">Standard</p>
                                        <p class="text-xs text-[#6b5f4d]">Club rider — some context</p>
                                    </div>
                                </label>
                                <label class="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors
                                              {progressDetailLevel === 'coach' ? 'bg-[#f5a623]/10 border border-[#f5a623]/30' : 'bg-[#0a0809] border border-[#221c18] hover:border-[#f5a623]/20'}">
                                    <input type="radio" bind:group={progressDetailLevel} value="coach" class="mt-0.5 accent-[#f5a623]" />
                                    <div>
                                        <p class="text-sm font-medium {progressDetailLevel === 'coach' ? 'text-[#f5a623]' : 'text-[#f0ece4]'}">Coach</p>
                                        <p class="text-xs text-[#6b5f4d]">Full coaching detail</p>
                                    </div>
                                </label>
                                <label class="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors
                                              {progressDetailLevel === 'technical' ? 'bg-[#f5a623]/10 border border-[#f5a623]/30' : 'bg-[#0a0809] border border-[#221c18] hover:border-[#f5a623]/20'}">
                                    <input type="radio" bind:group={progressDetailLevel} value="technical" class="mt-0.5 accent-[#f5a623]" />
                                    <div>
                                        <p class="text-sm font-medium {progressDetailLevel === 'technical' ? 'text-[#f5a623]' : 'text-[#f0ece4]'}">Technical</p>
                                        <p class="text-xs text-[#6b5f4d]">All metrics and diagnostics</p>
                                    </div>
                                </label>
                            </div>
                        </fieldset>

                        <!-- Options -->
                        <fieldset>
                            <legend class="text-xs font-semibold text-[#6b5f4d] uppercase tracking-wider mb-2">Include</legend>
                            <div class="space-y-2">
                                <label class="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" bind:checked={progressIncludeCharts} class="accent-[#f5a623]" />
                                    <div>
                                        <p class="text-sm text-[#f0ece4] group-hover:text-[#f5a623] transition-colors">Charts</p>
                                        <p class="text-xs text-[#6b5f4d]">Visual evidence sections</p>
                                    </div>
                                </label>
                                <label class="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" bind:checked={progressIncludeDiag} class="accent-[#f5a623]" />
                                    <div>
                                        <p class="text-sm text-[#f0ece4] group-hover:text-[#f5a623] transition-colors">Data quality notes</p>
                                        <p class="text-xs text-[#6b5f4d]">Sensor and calibration detail</p>
                                    </div>
                                </label>
                                {#if data.goalTargets && Object.keys(data.goalTargets).length > 0}
                                    <label class="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" bind:checked={progressIncludeGoals} class="accent-[#f5a623]" />
                                        <div>
                                            <p class="text-sm text-[#f0ece4] group-hover:text-[#f5a623] transition-colors">Goal progress</p>
                                            <p class="text-xs text-[#6b5f4d]">Progress toward active training goals</p>
                                        </div>
                                    </label>
                                {/if}
                            </div>
                        </fieldset>

                        <!-- Generate button -->
                        <button
                            onclick={() => {
                                showProgressOptions = false;
                                generateProgressReport();
                            }}
                            disabled={generatingProgress}
                            class="w-full py-3 rounded-xl text-sm font-bold transition-all
                                   bg-[#f5a623] text-[#0a0809] hover:bg-[#c97e0a]
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#131010]"
                        >
                            {generatingProgress ? 'Generating…' : 'Generate Report'}
                        </button>
                    </div>

                    <!-- What's included preview -->
                    <div class="bg-[#0a0809] rounded-lg p-4 border border-[#221c18]">
                        <h4 class="text-xs font-semibold text-[#f5a623] uppercase tracking-wider mb-3">
                            What's Included
                        </h4>
                        <ul class="space-y-2 text-xs text-[#9a8f7a]">
                            <li class="flex items-start gap-2">
                                <span class="text-[#f5a623]">•</span>
                                <span>Progress headline with confidence level</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-[#f5a623]">•</span>
                                <span>Reaction time and speed trends across {data.sessionCount} sessions</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-[#f5a623]">•</span>
                                <span>Consistency and fatigue patterns over time</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-[#f5a623]">•</span>
                                <span>Forward-looking observations for next sessions</span>
                            </li>
                            {#if progressIncludeCharts}
                                <li class="flex items-start gap-2">
                                    <span class="text-[#3de8c8]">•</span>
                                    <span>Trend chart references</span>
                                </li>
                            {/if}
                            {#if progressIncludeGoals && data.goalTargets && Object.keys(data.goalTargets).length > 0}
                                <li class="flex items-start gap-2">
                                    <span class="text-[#3de8c8]">•</span>
                                    <span>Goal progress context</span>
                                </li>
                            {/if}
                        </ul>
                        <div class="mt-4 pt-4 border-t border-[#221c18]">
                            <p class="text-[10px] text-[#6b5f4d]">
                                Progress reports cover trends across all sessions.
                                For single-session detail, use the Session Report on any session page.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
{/if}


<!-- ── Report Preview Modal ── -->
{#if showProgressReport && progressReport}
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4"
         role="button"
         tabindex="0"
         onclick={(e) => e.target === e.currentTarget && closeProgressReport()}
         onkeydown={(e) => (e.key === 'Escape' || (e.key === 'Enter' && e.target === e.currentTarget)) && closeProgressReport()}
         aria-label="Close progress report">
        <div class="w-full max-w-5xl my-8"
             role="dialog"
             tabindex="-1"
             aria-modal="true"
             onclick={(e) => e.stopPropagation()}
             onkeydown={(e) => e.stopPropagation()}>
            <ReportPreview report={progressReport} onClose={closeProgressReport} />
        </div>
    </div>
{/if}

<HelpPanel bind:open={helpOpen} {helpKey} />
