import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { predictGoalProgress } from '$lib/services/predictions';
import { performHealthCheck } from '$lib/services/anomalyDetection';
import { analyzeGoalAdaptation } from '$lib/services/goalAdaptation';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
    const { profile } = await parent();
    if (!profile) return { 
        goals: [], 
        sessionCount: 0, 
        currentValues: {}, 
        healthCheck: null,
        goalsWithIntelligence: []
    };

    // Load goals with milestones
    const { data: goals } = await supabase
        .from('training_goals')
        .select(`
            id,
            metric,
            target_value,
            start_value,
            current_value,
            deadline,
            completed_at,
            distance_m,
            created_at,
            updated_at,
            user_id,
            goal_milestones(id, value, achieved_at)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

    // Load session data to compute current values
    const { data: sessions } = await supabase
        .from('sessions')
        .select(`
            id, timestamp,
            runs(
                elapsed_time_ms,
                distance_m,
                gate_runs(
                    reaction_time_ms,
                    max_g,
                    analytics_valid,
                    time_to_peak_speed_ms
                )
            )
        `)
        .eq('user_id', profile.id)
        .eq('archived', false)
        .eq('session_type', 'gate')
        .order('timestamp', { ascending: false })
        .limit(20);

    // Flatten all gate runs — cast explicitly to avoid 'never' from union type
    type GateRunRow = {
        reaction_time_ms:      number;
        max_g:                 number;
        analytics_valid:       boolean;
        time_to_peak_speed_ms: number | null;
        elapsed_time_ms:       number | null;
        distance_m:            number | null;
    };

    const allGateRuns: GateRunRow[] = (sessions ?? []).flatMap(s =>
        s.runs.flatMap(r => {
            const gateRunsArr = Array.isArray(r.gate_runs) ? r.gate_runs : (r.gate_runs ? [r.gate_runs] : []);
            return gateRunsArr.map(g => ({
                reaction_time_ms:      g.reaction_time_ms,
                max_g:                 g.max_g,
                analytics_valid:       g.analytics_valid,
                time_to_peak_speed_ms: g.time_to_peak_speed_ms ?? null,
                elapsed_time_ms:       r.elapsed_time_ms ?? null,
                distance_m:            r.distance_m ?? null,
            }));
        })
    );

    const currentValues: Record<string, number | null> = {};

    if (allGateRuns.length > 0) {
        const reactions = allGateRuns.map(g => g.reaction_time_ms).filter((v): v is number => v !== null);
        currentValues['reactionTime'] = reactions.length > 0 ? Math.min(...reactions) : null;

        const gs = allGateRuns.map(g => g.max_g).filter((v): v is number => v !== null);
        currentValues['maxG'] = gs.length > 0 ? Math.max(...gs) : null;

        // Consistency CV from last session
        const lastSessionRuns = (sessions ?? [])[0]?.runs?.flatMap(r => {
            const arr = Array.isArray(r.gate_runs) ? r.gate_runs : (r.gate_runs ? [r.gate_runs] : []);
            return arr;
        }) ?? [];
        if (lastSessionRuns.length > 1) {
            const rts  = lastSessionRuns.map(g => g.reaction_time_ms);
            const mean = rts.reduce((s, v) => s + v, 0) / rts.length;
            const variance = rts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / rts.length;
            currentValues['consistency'] = mean > 0 ? (1 - Math.sqrt(variance) / mean) * 100 : null;
        }

        const elapsed = allGateRuns.map(g => g.elapsed_time_ms).filter((v): v is number => v !== null);
        currentValues['elapsedTime'] = elapsed.length > 0 ? Math.min(...elapsed) / 1000 : null;

        const accelPhase = allGateRuns
            .filter(g => g.analytics_valid && g.time_to_peak_speed_ms !== null)
            .map(g => g.time_to_peak_speed_ms!);
        currentValues['accelerationPhase'] = accelPhase.length > 0 ? Math.min(...accelPhase) / 1000 : null;

        currentValues['endurance'] = (sessions ?? [])[0]?.runs?.length ?? null;
    }

    // Enrich goals with computed current values
    const enrichedGoals = (goals ?? []).map(goal => ({
        ...goal,
        computed_current: (currentValues[goal.metric] ?? goal.current_value) as number | null,
    }));

    // PHASE 5: Health check (needs to be before goal intelligence for shouldRest flag)
    let healthCheck: ReturnType<typeof performHealthCheck> | null = null;
    if (sessions && sessions.length >= 3) {
        const performanceData = {
            metric: 'reactionTime',
            lowerIsBetter: true,
            dataPoints: allGateRuns.slice(0, 50).map((run, index) => ({
                sessionId: sessions[Math.floor(index / 10)]?.id || `session-${index}`,
                value: run.reaction_time_ms,
                timestamp: sessions[Math.floor(index / 10)]?.timestamp || new Date().toISOString()
            }))
        };

        const sessionHistory = sessions.map(s => {
            const sessionRuns = s.runs || [];
            const reactions = sessionRuns.flatMap(r => {
                const arr = Array.isArray(r.gate_runs) ? r.gate_runs : (r.gate_runs ? [r.gate_runs] : []);
                return arr.map(g => g.reaction_time_ms).filter((v): v is number => v !== null);
            });
            
            return {
                sessionId: s.id,
                timestamp: s.timestamp,
                bestValue: reactions.length > 0 ? Math.min(...reactions) : 0,
                avgValue: reactions.length > 0 ? reactions.reduce((a, b) => a + b, 0) / reactions.length : 0,
                consistency: 0, // Simplified for now
                runCount: sessionRuns.length
            };
        });

        try {
            healthCheck = performHealthCheck(performanceData, sessionHistory);
        } catch (error) {
            console.error('Health check error:', error);
            healthCheck = null;
        }
    }

    // PHASE 5: Add intelligence layer with adaptive goal analysis
    const goalsWithIntelligence = enrichedGoals.map(goal => {
        const current = goal.computed_current ?? goal.current_value ?? goal.start_value;
        const lowerIsBetter = goal.metric === 'reactionTime' || goal.metric === 'elapsedTime' || goal.metric === 'accelerationPhase';
        
        // Get milestone values for prediction
        const milestones = Array.isArray(goal.goal_milestones) ? goal.goal_milestones : [];
        const sessionDataPoints = milestones
            .filter(m => m && m.value !== undefined && m.achieved_at)
            .sort((a: any, b: any) => new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime())
            .map((m, index) => ({
                sessionNumber: index + 1,
                value: m.value
            }));
        
        // Add current value
        if (current !== null) {
            sessionDataPoints.push({
                sessionNumber: sessionDataPoints.length + 1,
                value: current
            });
        }

        // Generate prediction
        const prediction = (sessionDataPoints.length >= 2 && current !== null)
            ? predictGoalProgress(sessionDataPoints, goal.target_value, current, lowerIsBetter)
            : null;

        // Use analyzeGoalAdaptation for comprehensive analysis
        let adaptiveAnalysis = null;
        let progressStatus: 'way_ahead' | 'ahead' | 'on_track' | 'behind' | 'way_behind' | 'stalled' = 'on_track';
        let percentComplete = 0;
        
        if (current !== null && goal.start_value !== null && goal.target_value !== null && goal.deadline) {
            try {
                adaptiveAnalysis = analyzeGoalAdaptation(
                    {
                        metric: goal.metric,
                        startValue: goal.start_value,
                        targetValue: goal.target_value,
                        currentValue: current,
                        startDate: new Date(goal.created_at),
                        deadline: new Date(goal.deadline),
                        lowerIsBetter
                    },
                    {
                        sessionsRemaining: prediction?.sessionsRemaining ?? null
                    },
                    {
                        shouldRest: healthCheck?.shouldRest ?? false
                    }
                );

                progressStatus = adaptiveAnalysis.progressEvaluation.status;
                percentComplete = adaptiveAnalysis.progressEvaluation.percentageComplete;
            } catch (error) {
                console.error('Goal adaptation analysis error:', error);
                // Fallback to manual calculation
                if (lowerIsBetter) {
                    percentComplete = Math.min(100, Math.max(0, ((goal.start_value - current) / (goal.start_value - goal.target_value)) * 100));
                } else {
                    percentComplete = Math.min(100, Math.max(0, ((current - goal.start_value) / (goal.target_value - goal.start_value)) * 100));
                }

                // Simple status determination
                const start = new Date(goal.created_at);
                const deadline = new Date(goal.deadline);
                const now = new Date();
                const totalDuration = deadline.getTime() - start.getTime();
                const elapsed = now.getTime() - start.getTime();
                const timeProgress = (elapsed / totalDuration) * 100;
                const variance = percentComplete - timeProgress;
                
                if (variance > 30) progressStatus = 'way_ahead';
                else if (variance > 10) progressStatus = 'ahead';
                else if (variance >= -10) progressStatus = 'on_track';
                else if (variance >= -30) progressStatus = 'behind';
                else progressStatus = 'way_behind';
            }
        }

        return {
            ...goal,
            prediction,
            progressStatus,
            percentComplete,
            adaptiveAnalysis
        };
    });

    return {
        goals: enrichedGoals,
        sessionCount: sessions?.length ?? 0,
        currentValues,
        goalsWithIntelligence,
        healthCheck
    };
};

export const actions: Actions = {

    createGoal: async ({ request, locals: { supabase, getSession } }) => {
        const session = await getSession();
        if (!session) return fail(401, { createError: 'Not authenticated' });

        const form         = await request.formData();
        const metric       = form.get('metric') as string;
        let target_value = parseFloat(form.get('target_value') as string);
        let start_value  = parseFloat(form.get('start_value') as string);
        const deadline     = form.get('deadline') as string;
        const distance_m   = form.get('distance_m') ? parseFloat(form.get('distance_m') as string) : null;

        if (!metric || isNaN(target_value) || isNaN(start_value) || !deadline) {
            return fail(400, { createError: 'All required fields must be filled in' });
        }

        // Convert reaction time from seconds to milliseconds for database storage
        if (metric === 'reactionTime') {
            target_value *= 1000;
            start_value *= 1000;
        }

        const { error } = await supabase
            .from('training_goals')
            .insert({
                user_id:       session.user.id,
                metric,
                target_value,
                start_value,
                current_value: start_value,
                deadline,
                distance_m,
            });

        if (error) return fail(500, { createError: error.message });
        return { createSuccess: true };
    },

    deleteGoal: async ({ request, locals: { supabase, getSession } }) => {
        const session = await getSession();
        if (!session) return fail(401, { deleteError: 'Not authenticated' });

        const form   = await request.formData();
        const goalId = form.get('goal_id') as string;

        const { error } = await supabase
            .from('training_goals')
            .delete()
            .eq('id', goalId)
            .eq('user_id', session.user.id);

        if (error) return fail(500, { deleteError: error.message });
        return { deleteSuccess: true };
    },

    completeGoal: async ({ request, locals: { supabase, getSession } }) => {
        const session = await getSession();
        if (!session) return fail(401);

        const form   = await request.formData();
        const goalId = form.get('goal_id') as string;

        const { error } = await supabase
            .from('training_goals')
            .update({ completed_at: new Date().toISOString() })
            .eq('id', goalId)
            .eq('user_id', session.user.id);

        if (error) return fail(500, { completeError: error.message });
        return { completeSuccess: true };
    },

    applySuggestion: async ({ request, locals: { supabase, getSession } }) => {
        const session = await getSession();
        if (!session) return fail(401, { adjustError: 'Not authenticated' });

        const form = await request.formData();
        const goalId = form.get('goal_id') as string;
        const adjustmentType = form.get('adjustment_type') as string;
        const newValue = form.get('new_value') as string;

        if (!goalId || !adjustmentType) {
            return fail(400, { adjustError: 'Missing required fields' });
        }

        // Build update object based on adjustment type
        let updateData: any = {};

        switch (adjustmentType) {
            case 'increase_target':
            case 'decrease_target':
                updateData = { target_value: parseFloat(newValue) };
                break;

            case 'extend_deadline':
            case 'shorten_deadline':
                updateData = { deadline: newValue };
                break;

            case 'complete':
                updateData = { completed_at: new Date().toISOString() };
                break;

            case 'pause':
                // For pause, we could add a paused flag or just notify the user
                // For now, we'll just return success without changing the goal
                return { adjustSuccess: true, message: 'Goal paused - take time to recover!' };

            case 'cancel':
                // Delete the goal
                const { error: deleteError } = await supabase
                    .from('training_goals')
                    .delete()
                    .eq('id', goalId)
                    .eq('user_id', session.user.id);

                if (deleteError) return fail(500, { adjustError: deleteError.message });
                return { adjustSuccess: true, message: 'Goal removed' };

            default:
                return fail(400, { adjustError: 'Unknown adjustment type' });
        }

        // Apply the update
        const { error } = await supabase
            .from('training_goals')
            .update(updateData)
            .eq('id', goalId)
            .eq('user_id', session.user.id);

        if (error) return fail(500, { adjustError: error.message });
        return { adjustSuccess: true, message: 'Goal adjusted successfully!' };
    },
};
