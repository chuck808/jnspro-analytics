import type { PageServerLoad } from './$types';
import { shouldExcludeFromStats } from '$lib/types/runs';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
    const { profile } = await parent();

    const empty = {
        sessionCount: 0,
        totalRuns: 0,
        personalBests: { reaction_ms: null, peak_speed_ms: null, max_g: null },
        consistency: null,
        activeGoals: [],
        recentSessions: []
    };

    if (!profile) return empty;

    const { data: sessions } = await supabase
        .from('sessions')
        .select('id, timestamp')
        .eq('user_id', profile.id)
        .eq('archived', false)
        .eq('session_type', 'gate')
        .order('timestamp', { ascending: false });

    if (!sessions || sessions.length === 0) return empty;

    const sessionIds = sessions.map(s => s.id);

    // Query through runs so we can access tags for exclusion filtering.
    // Going directly to gate_runs bypasses tags and would include warmup runs
    // in personal bests and consistency calculations.
    const { data: runsWithGateData } = await supabase
        .from('runs')
        .select(`
            tags,
            gate_runs(
                reaction_time_ms,
                peak_speed_ms,
                max_g,
                analytics_valid
            )
        `)
        .in('session_id', sessionIds);

    const eligibleRuns = (runsWithGateData ?? [])
        .filter(r => !shouldExcludeFromStats(r.tags as any));

    const allGateRuns = eligibleRuns.flatMap(r =>
        Array.isArray(r.gate_runs) ? r.gate_runs : (r.gate_runs ? [r.gate_runs] : [])
    );

    const validGateRuns = allGateRuns.filter(g => g.analytics_valid);

    const reactionTimes = allGateRuns
        .map(g => g.reaction_time_ms)
        .filter((v): v is number => v !== null);
    const speeds  = validGateRuns
        .map(g => g.peak_speed_ms)
        .filter((v): v is number => v !== null);
    const gForces = allGateRuns
        .map(g => g.max_g)
        .filter((v): v is number => v !== null);

    const personalBests = {
        reaction_ms:   reactionTimes.length ? Math.min(...reactionTimes) : null,
        peak_speed_ms: speeds.length        ? Math.max(...speeds)        : null,
        max_g:         gForces.length       ? Math.max(...gForces)       : null,
    };

    let consistency: number | null = null;
    if (reactionTimes.length >= 3) {
        const mean = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
        const std  = Math.sqrt(reactionTimes.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / reactionTimes.length);
        consistency = (std / mean) * 100;
    }

    const { count: totalRuns } = await supabase
        .from('runs')
        .select('id', { count: 'exact', head: true })
        .in('session_id', sessionIds);

    // Recent sessions — also filter excluded runs for per-session stats
    const recentIds = sessions.slice(0, 5).map(s => s.id);

    const { data: recentRuns } = await supabase
        .from('runs')
        .select(`
            session_id,
            tags,
            gate_runs(
                reaction_time_ms,
                peak_speed_ms,
                analytics_valid
            )
        `)
        .in('session_id', recentIds);

    const { data: recentRunCounts } = await supabase
        .from('runs')
        .select('session_id, id')
        .in('session_id', recentIds);

    const recentSessions = sessions.slice(0, 5).map(session => {
        const sessionEligibleRuns = (recentRuns ?? [])
            .filter(r => r.session_id === session.id && !shouldExcludeFromStats(r.tags as any));

        const sGateRuns = sessionEligibleRuns
            .flatMap(r => Array.isArray(r.gate_runs) ? r.gate_runs : (r.gate_runs ? [r.gate_runs] : []))
            .filter(g => g.analytics_valid);

        const sRunCount  = (recentRunCounts ?? []).filter(r => r.session_id === session.id).length;
        const sReactions = sessionEligibleRuns
            .flatMap(r => Array.isArray(r.gate_runs) ? r.gate_runs : (r.gate_runs ? [r.gate_runs] : []))
            .map(g => g.reaction_time_ms)
            .filter((v): v is number => v !== null);
        const sSpeeds = sGateRuns.map(r => r.peak_speed_ms).filter((v): v is number => v !== null);

        let reaction_cv: number | null = null;
        if (sReactions.length >= 3) {
            const mean = sReactions.reduce((a, b) => a + b, 0) / sReactions.length;
            const std  = Math.sqrt(sReactions.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / sReactions.length);
            reaction_cv = (std / mean) * 100;
        }

        return {
            id:                 session.id,
            timestamp:          session.timestamp,
            run_count:          sRunCount,
            best_reaction_ms:   sReactions.length ? Math.min(...sReactions) : null,
            best_peak_speed_ms: sSpeeds.length    ? Math.max(...sSpeeds)    : null,
            has_valid_speed:    sSpeeds.length > 0,
            reaction_cv,
        };
    });

    const { data: goals } = await supabase
        .from('training_goals')
        .select('id, metric, target_value, start_value, current_value, deadline')
        .eq('user_id', profile.id)
        .eq('completed', false)
        .order('deadline', { ascending: true })
        .limit(3);

    const now = new Date();
    const lowerIsBetterMetrics = ['reactionTime', 'elapsedTime', 'accelerationPhase'];

    const activeGoals = (goals ?? []).map(goal => {
        const deadline    = goal.deadline ? new Date(goal.deadline) : null;
        const daysUntil   = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86400000) : 999;
        const start       = goal.start_value ?? 0;
        const target      = goal.target_value ?? 0;
        const current     = goal.current_value ?? start;
        const lowerBetter = lowerIsBetterMetrics.includes(goal.metric);

        // Progress: how much of the gap between start and target has been closed.
        // Direction-aware — reaction time going DOWN is progress toward a lower target.
        let progress = 0;
        if (start !== target) {
            progress = Math.min(100, Math.max(0, Math.round(
                lowerBetter
                    ? ((start - current) / (start - target)) * 100
                    : ((current - start) / (target - start)) * 100
            )));
        }

        return {
            ...goal,
            daysUntilDeadline: daysUntil,
            isOverdue: daysUntil < 0,
            progress,
        };
    });

    return {
        sessionCount: sessions.length,
        totalRuns:    totalRuns ?? 0,
        personalBests,
        consistency,
        activeGoals,
        recentSessions,
    };
};