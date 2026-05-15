import type { PageServerLoad } from './$types';

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

    const { data: gateRuns } = await supabase
        .from('gate_runs')
        .select('reaction_time_ms, peak_speed_ms, max_g, analytics_valid, runs!inner(session_id)')
        .in('runs.session_id', sessionIds)
        .eq('analytics_valid', true);

    const validRuns = gateRuns ?? [];
    const reactionTimes = validRuns.map(r => r.reaction_time_ms).filter((v): v is number => v !== null);
    const speeds = validRuns.map(r => r.peak_speed_ms).filter((v): v is number => v !== null);
    const gForces = validRuns.map(r => r.max_g).filter((v): v is number => v !== null);

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

    const recentIds = sessions.slice(0, 5).map(s => s.id);

    const { data: recentGateRuns } = await supabase
        .from('gate_runs')
        .select('runs!inner(session_id), reaction_time_ms, peak_speed_ms, analytics_valid')
        .in('runs.session_id', recentIds);

    const { data: recentRunCounts } = await supabase
        .from('runs')
        .select('session_id, id')
        .in('session_id', recentIds);

    const recentSessions = sessions.slice(0, 5).map(session => {
        const sGateRuns  = (recentGateRuns ?? []).filter(r => r.runs.session_id === session.id && r.analytics_valid);
        const sRunCount  = (recentRunCounts ?? []).filter(r => r.session_id === session.id).length;
        const sReactions = sGateRuns.map(r => r.reaction_time_ms).filter((v): v is number => v !== null);
        const sSpeeds    = sGateRuns.map(r => r.peak_speed_ms).filter((v): v is number => v !== null);

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
    const activeGoals = (goals ?? []).map(goal => {
        const deadline  = goal.deadline ? new Date(goal.deadline) : null;
        const daysUntil = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86400000) : 999;
        const start     = goal.start_value ?? 0;
        const target    = goal.target_value ?? 0;
        const current   = goal.current_value ?? start;
        const range     = Math.abs(target - start);
        const progress  = range > 0 ? Math.min(100, Math.round((Math.abs(current - start) / range) * 100)) : 0;

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