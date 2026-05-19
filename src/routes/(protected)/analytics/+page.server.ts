import type { PageServerLoad } from './$types';
import { shouldExcludeFromStats } from '$lib/types/runs';
import { prepareCorrelationData, generateCorrelationInsights } from '$lib/analytics/correlationAnalysis';
import { analyseSession, scoreRunTechnique, buildCoachDiagnostics, buildPerformanceInsightPack } from '$lib/performance-engine';
import type { SessionAnalysis, TechniqueAnalysis, CoachDiagnostic, PerformanceInsightPack } from '$lib/performance-engine';
import { buildSessionSummaries } from '$lib/server/sessionSummaryBuilder';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
    const { profile } = await parent();
    if (!profile) return { sessions: [], sessionCount: 0, depth: 'none' as const, allRuns: [], personalBests: { reaction_ms: null, peak_speed_ms: null, max_g: null }, trend: { reaction: null, speed: null }, activeGoalMetrics: [], goalTargets: {}, bikes: [] };

    // Load bikes for power calculation
    const { data: bikes } = await supabase
        .from('bikes')
        .select('id, name, weight_kg')
        .eq('user_id', profile.id);

    // Fetch sessions with context data for correlation analysis
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, timestamp, session_type, weather_conditions, track_surface, session_focus, ride_feel')
        .eq('user_id', profile.id)
        .eq('archived', false)
        .eq('session_type', 'gate')
        .order('timestamp', { ascending: true });

    if (error || !sessions) {
        return { sessions: [], sessionCount: 0, depth: 'none' as const, allRuns: [], personalBests: { reaction_ms: null, peak_speed_ms: null, max_g: null }, trend: { reaction: null, speed: null }, activeGoalMetrics: [], goalTargets: {} };
    }

    // Fetch all runs for these sessions
    const sessionIds = sessions.map(s => s.id);
    const { data: runs, error: runsError } = await supabase
        .from('runs')
        .select('id, session_id, run_number, elapsed_time_ms, distance_m, chart_data, tags')
        .in('session_id', sessionIds);

    if (runsError) {
        return { sessions: [], sessionCount: 0, depth: 'none' as const, allRuns: [], personalBests: { reaction_ms: null, peak_speed_ms: null, max_g: null }, trend: { reaction: null, speed: null }, activeGoalMetrics: [], goalTargets: {} };
    }

    // Fetch all gate_runs for these runs
    const runIds = (runs || []).map(r => r.id);
    const { data: gateRuns, error: gateRunsError } = await supabase
        .from('gate_runs')
        .select('run_id, reaction_time_ms, max_g, avg_g, peak_speed_ms, avg_speed_ms_calc, time_to_peak_speed_ms, analytics_valid, max_pitch_deg, front_wheel_lifted, bias_correction_ms2')
        .in('run_id', runIds);


    // Combine the data
    const sessionsWithRuns = sessions.map(session => ({
        ...session,
        runs: (runs || [])
            .filter(r => r.session_id === session.id)
            .map(run => ({
                ...run,
                gate_runs: (gateRuns || []).filter(gr => gr.run_id === run.id)
            }))
    }));

    // Flat list of stats-eligible runs across all sessions (for heatmap + correlation).
    // Warmup and excluded runs are filtered out — they would skew trend data.
    const allRuns = sessionsWithRuns.flatMap(session =>
        (session.runs ?? [])
            .filter(run => !shouldExcludeFromStats(run.tags as any))
            .flatMap(run =>
                (run.gate_runs ?? []).map(g => ({
                    session_id:       session.id,
                    session_date:     session.timestamp,
                    reaction_time_ms: g.reaction_time_ms,
                    max_g:            g.max_g,
                    peak_speed_ms:    g.analytics_valid ? (g.peak_speed_ms ?? null) : null,
                    analytics_valid:  g.analytics_valid,
                }))
            )
    );

    // Per-session summaries — built by the shared utility so both the analytics
    // page and the session detail page produce identical values.
    const sessionSummaries = buildSessionSummaries(sessionsWithRuns as any);

    const sessionCount = sessionSummaries.length;

    let depth: 'none' | 'minimal' | 'basic' | 'full' | 'advanced';
    if (sessionCount === 0)      depth = 'none';
    else if (sessionCount <= 2)  depth = 'minimal';
    else if (sessionCount <= 9)  depth = 'basic';
    else if (sessionCount <= 19) depth = 'full';
    else                         depth = 'advanced';

    const allReactions  = sessionSummaries.map(s => s.best_reaction_ms).filter((v): v is number => v !== null);
    const allSpeeds     = sessionSummaries.map(s => s.best_peak_speed_ms).filter((v): v is number => v !== null && v > 0);
    const allMaxG       = sessionSummaries.map(s => s.best_max_g).filter((v): v is number => v !== null);

    const personalBests = {
        reaction_ms:   allReactions.length > 0 ? Math.min(...allReactions) : null,
        peak_speed_ms: allSpeeds.length > 0    ? Math.max(...allSpeeds)    : null,
        max_g:         allMaxG.length > 0       ? Math.max(...allMaxG)      : null,
    };

    let trend: { reaction: number | null; speed: number | null } = { reaction: null, speed: null };
    if (sessionCount >= 6) {
        const recent   = sessionSummaries.slice(-5);
        const previous = sessionSummaries.slice(-10, -5);
        const avgRecent   = recent.reduce((s: number, sess: any) => s + sess.avg_reaction_ms, 0) / recent.length;
        const avgPrevious = previous.reduce((s: number, sess: any) => s + sess.avg_reaction_ms, 0) / previous.length;
        trend.reaction = avgPrevious > 0 ? ((avgRecent - avgPrevious) / avgPrevious) * 100 : null;

        const recentSpeeds   = recent.filter((s: any) => s.avg_peak_speed_ms).map((s: any) => s.avg_peak_speed_ms!);
        const previousSpeeds = previous.filter((s: any) => s.avg_peak_speed_ms).map((s: any) => s.avg_peak_speed_ms!);
        if (recentSpeeds.length > 0 && previousSpeeds.length > 0) {
            const avgRS = recentSpeeds.reduce((s: number, v: number) => s + v, 0) / recentSpeeds.length;
            const avgPS = previousSpeeds.reduce((s: number, v: number) => s + v, 0) / previousSpeeds.length;
            trend.speed = ((avgRS - avgPS) / avgPS) * 100;
        }
    }

    // Fetch active goals to show "create goal" CTAs and chart overlays
    const { data: goals } = await supabase
        .from('training_goals')
        .select('metric, target_value, start_value, current_value, deadline')
        .eq('user_id', profile.id)
        .is('completed_at', null);

    const activeGoalMetrics = new Set((goals ?? []).map(g => g.metric));

    // Format goals for chart overlays
    const goalTargets = (goals ?? []).reduce((acc, goal) => {
        acc[goal.metric] = {
            target: goal.target_value,
            start: goal.start_value,
            current: goal.current_value,
            deadline: goal.deadline
        };
        return acc;
    }, {} as Record<string, any>);

    // ── CORRELATION INSIGHTS (Phase 3 Task 3.2) ──
    // Generate insights when sufficient data is available
    const correlationData = prepareCorrelationData(sessionsWithRuns, sessionSummaries);
    const correlationInsights = generateCorrelationInsights(correlationData, 10);

    // ── PERFORMANCE ENGINE ANALYSIS (Phase 2) ──
    // Analyze last 10 sessions for technique trends and diagnostics
    interface SessionAnalysisResult {
        sessionId: string;
        timestamp: string;
        analysis: SessionAnalysis;
        techniqueScores: TechniqueAnalysis | null;
        diagnostics: CoachDiagnostic[];
        insightPack: PerformanceInsightPack;
    }

    let sessionAnalyses: SessionAnalysisResult[] = [];
    
    if (sessionCount > 0) {
        // Analyse all sessions up to 'full' depth (up to 19 sessions).
        // At 'advanced' (20+), limit to the last 30 — approximately two full season
        // blocks — which is the meaningful trend window for gate start development.
        // Previously limited to 10 which truncated technique trends for active riders.
        const analysisLimit = depth === 'advanced' ? 30 : sessionCount;
        const sessionsToAnalyze = sessionsWithRuns.slice(-analysisLimit);
        
        sessionAnalyses = sessionsToAnalyze
            .map(session => {
                const sessionRuns = session.runs || [];
                const eligibleRuns = sessionRuns.filter((r: any) => !shouldExcludeFromStats(r.tags as any));
                
                // Only analyze if we have chart_data on eligible runs
                if (eligibleRuns.length === 0 || !eligibleRuns.some((r: any) => r.chart_data)) {
                    return null;
                }
                
                try {
                    // Build session object for Performance Engine using stats-eligible runs only
                    const sessionForAnalysis = {
                        id: session.id,
                        session_type: session.session_type,
                        timestamp: session.timestamp,
                        runs: eligibleRuns.map((run: any) => ({
                            id: run.id,
                            run_number: run.run_number,
                            elapsed_time_ms: run.elapsed_time_ms,
                            chart_data: run.chart_data,
                            gate_runs: run.gate_runs?.[0] || null,
                        })),
                    };
                    
                    // Run full Performance Engine analysis
                const analysis = analyseSession(sessionForAnalysis as any, {
                    riderWeightKg:    (profile as any).weight_kg,
                    bikeWeightKg:     bikes?.[0]?.weight_kg,
                    riderLevel:       (profile as any).rider_level,
                    sessionFocus:     (session as any).session_focus ?? null,
                    rideFeel:         (session as any).ride_feel ?? null,
                    weatherCondition: (session as any).weather_conditions ?? null,
                    trackSurface:     (session as any).track_surface ?? null,
                });
                    
                    // Extract technique scores from selected run
                    const techniqueScores = analysis.selectedRun?.technique ?? null;
                    
                    // Generate coach diagnostics if we have a selected run
                    let diagnostics: CoachDiagnostic[] = [];
                    if (analysis.selectedRun) {
                        const scoreBreakdown = scoreRunTechnique(
                            analysis.selectedRun,
                            analysis,
                            { riderLevel: ((profile as any).rider_level as any) || 'rider' }
                        );
                        diagnostics = buildCoachDiagnostics(analysis, scoreBreakdown, {
                            sessionFocus: (session as any).session_focus ?? null,
                            rideFeel:     (session as any).ride_feel ?? null,
                        });
                    }
                    
                    // Build insight pack
                    const insightPack = buildPerformanceInsightPack(
                        analysis,
                        ((profile as any).rider_level as any) || 'rider'
                    );
                    
                    return {
                        sessionId: session.id,
                        timestamp: session.timestamp,
                        analysis,
                        techniqueScores,
                        diagnostics,
                        insightPack,
                    };
                } catch (error) {
                    console.error(`Error analyzing session ${session.id}:`, error);
                    return null;
                }
            })
            .filter((result): result is SessionAnalysisResult => result !== null);
    }

    return {
        profile,
        sessions: sessionSummaries, 
        sessionCount, 
        depth, 
        allRuns, 
        personalBests, 
        trend,
        activeGoalMetrics: Array.from(activeGoalMetrics),
        goalTargets,
        bikes: bikes ?? [],
        correlationInsights, // NEW: Pattern discovery insights
        sessionAnalyses, // NEW: Performance Engine analysis for last 10 sessions
    };
};