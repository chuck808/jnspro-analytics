import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
    const { profile } = await parent();
    if (!profile) return { 
        sessionCount: 0, 
        recentSessions: [], 
        personalBests: { reaction_ms: null, peak_speed_ms: null, max_g: null },
        totalRuns: 0,
        consistency: null,
        activeGoals: []
    };

    // Fetch sessions with gate runs
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
            id,
            timestamp,
            session_type,
            runs(
                id,
                elapsed_time_ms,
                distance_m,
                gate_runs(
                    reaction_time_ms,
                    max_g,
                    avg_g,
                    peak_speed_ms,
                    analytics_valid
                )
            )
        `)
        .eq('user_id', profile.id)
        .eq('archived', false)
        .eq('session_type', 'gate')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error || !sessions) {
        return { 
            sessionCount: 0, 
            recentSessions: [], 
            personalBests: { reaction_ms: null, peak_speed_ms: null, max_g: null },
            totalRuns: 0,
            consistency: null,
            activeGoals: []
        };
    }

    // Get total session count
    const { count: sessionCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('archived', false)
        .eq('session_type', 'gate');

    // Process sessions for stats
    const allSessionData = (sessions ?? []).map(session => {
        const allGateRuns = session.runs.flatMap(r => r.gate_runs).filter(Boolean);
        const validRuns = allGateRuns.filter(g => g!.analytics_valid);
        
        if (allGateRuns.length === 0) return null;

        const reactionTimes = allGateRuns.map(g => g!.reaction_time_ms);
        const mean = reactionTimes.reduce((s, v) => s + v, 0) / reactionTimes.length;
        const variance = reactionTimes.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / reactionTimes.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? (stdDev / mean) * 100 : null;

        return {
            id: session.id,
            timestamp: session.timestamp,
            run_count: session.runs.length,
            best_reaction_ms: Math.min(...reactionTimes),
            avg_reaction_ms: mean,
            reaction_cv: cv,
            best_max_g: Math.max(...allGateRuns.map(g => g!.max_g)),
            best_peak_speed_ms: validRuns.length > 0 ? Math.max(...validRuns.map(g => g!.peak_speed_ms ?? 0)) : null,
            has_valid_speed: validRuns.length > 0,
        };
    }).filter(Boolean) as any[];

    // Calculate overall stats
    const totalRuns = allSessionData.reduce((sum, s) => sum + s.run_count, 0);
    
    const allReactions = allSessionData.map(s => s.best_reaction_ms).filter((v): v is number => v !== null);
    const allSpeeds = allSessionData.map(s => s.best_peak_speed_ms).filter((v): v is number => v !== null && v > 0);
    const allMaxG = allSessionData.map(s => s.best_max_g).filter((v): v is number => v !== null);
    const allCVs = allSessionData.map(s => s.reaction_cv).filter((v): v is number => v !== null);

    const personalBests = {
        reaction_ms: allReactions.length > 0 ? Math.min(...allReactions) : null,
        peak_speed_ms: allSpeeds.length > 0 ? Math.max(...allSpeeds) : null,
        max_g: allMaxG.length > 0 ? Math.max(...allMaxG) : null,
    };

    const avgConsistency = allCVs.length > 0 
        ? allCVs.reduce((s, v) => s + v, 0) / allCVs.length 
        : null;

    // Fetch active goals
    const { data: goals } = await supabase
        .from('training_goals')
        .select(`
            id,
            metric,
            target_value,
            start_value,
            current_value,
            deadline,
            completed_at
        `)
        .eq('user_id', profile.id)
        .is('completed_at', null)
        .order('deadline', { ascending: true })
        .limit(3);

    // Calculate current values for each goal metric
    const currentMetricValues: Record<string, number | null> = {};
    
    if (allSessionData.length > 0) {
        // Reaction time - best from all sessions
        currentMetricValues['reactionTime'] = personalBests.reaction_ms;
        
        // Max G - best from all sessions
        currentMetricValues['maxG'] = personalBests.max_g;
        
        // Peak speed - best from all sessions
        currentMetricValues['peakSpeed'] = personalBests.peak_speed_ms;
        
        // Consistency - average CV (lower is better, but we show as consistency score)
        if (avgConsistency !== null) {
            currentMetricValues['consistency'] = Math.max(0, 100 - avgConsistency);
        }
    }

    // Enrich goals with progress calculation
    const enrichedGoals = (goals ?? []).map(goal => {
        const current = currentMetricValues[goal.metric] ?? goal.current_value;
        const start = goal.start_value ?? 0;
        const target = goal.target_value ?? 0;
        const currentVal = current ?? start;
        
        const progress = start !== target && target !== 0
            ? Math.min(100, Math.max(0, (currentVal - start) / (target - start) * 100))
            : 0;
        
        const daysUntilDeadline = goal.deadline 
            ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 0;
        
        return {
            ...goal,
            current_value: current,
            progress: Math.round(progress),
            daysUntilDeadline,
            isOverdue: daysUntilDeadline < 0,
        };
    });

    return {
        sessionCount: sessionCount ?? 0,
        recentSessions: allSessionData,
        personalBests,
        totalRuns,
        consistency: avgConsistency,
        activeGoals: enrichedGoals,
    };
};
