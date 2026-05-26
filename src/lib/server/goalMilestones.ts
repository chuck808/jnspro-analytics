/**
 * Goal Milestone Auto-Creation Utilities
 * 
 * Automatically creates milestone entries when performance metrics improve
 * toward active training goals.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

interface MilestoneCreationResult {
    created: boolean;
    milestoneId?: number;
    error?: string;
}

/**
 * Create a milestone for a goal when a new performance value is achieved
 * 
 * @param supabase - Supabase client
 * @param goalId - ID of the goal
 * @param newValue - The new metric value achieved
 * @param achievedAt - Timestamp when the value was achieved (defaults to now)
 * @returns Result indicating success or failure
 */
export async function createGoalMilestone(
    supabase: SupabaseClient,
    goalId: string,
    newValue: number,
    achievedAt?: string
): Promise<MilestoneCreationResult> {
    try {
        const { data, error } = await supabase
            .from('goal_milestones')
            .insert({
                goal_id: goalId,
                value: newValue,
                achieved_at: achievedAt ?? new Date().toISOString()
            })
            .select('id')
            .single();

        if (error) {
            console.error('[Goal Milestones] Failed to create milestone:', error);
            return { created: false, error: error.message };
        }

        return { created: true, milestoneId: data.id };
    } catch (err) {
        console.error('[Goal Milestones] Exception creating milestone:', err);
        return { created: false, error: String(err) };
    }
}

/**
 * Update a goal's current value
 * 
 * @param supabase - Supabase client
 * @param goalId - ID of the goal
 * @param newValue - The new current value
 * @returns Success boolean
 */
export async function updateGoalCurrentValue(
    supabase: SupabaseClient,
    goalId: string,
    newValue: number
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('training_goals')
            .update({ current_value: newValue, updated_at: new Date().toISOString() })
            .eq('id', goalId);

        if (error) {
            console.error('[Goal Milestones] Failed to update goal current value:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Goal Milestones] Exception updating goal:', err);
        return false;
    }
}

interface GoalImprovement {
    goalId: string;
    metric: string;
    previousValue: number;
    newValue: number;
    improved: boolean;
}

/**
 * Process improvements for multiple goals and create milestones
 * 
 * @param supabase - Supabase client
 * @param improvements - Array of goal improvements
 * @param timestamp - Session timestamp for milestone dating
 * @returns Number of milestones created
 */
export async function processGoalImprovements(
    supabase: SupabaseClient,
    improvements: GoalImprovement[],
    timestamp?: string
): Promise<number> {
    let milestonesCreated = 0;

    for (const improvement of improvements) {
        if (!improvement.improved) continue;

        // Create milestone
        const milestoneResult = await createGoalMilestone(
            supabase,
            improvement.goalId,
            improvement.newValue,
            timestamp
        );

        if (milestoneResult.created) {
            milestonesCreated++;

            // Update goal's current value
            await updateGoalCurrentValue(
                supabase,
                improvement.goalId,
                improvement.newValue
            );
        }
    }

    return milestonesCreated;
}

/**
 * Check if a new value represents a significant improvement
 * 
 * @param metric - The metric being measured
 * @param previousValue - Previous best value
 * @param newValue - New value to check
 * @param threshold - Minimum improvement percentage to be significant (default: 0.5%)
 * @returns True if improvement is significant
 */
export function isSignificantImprovement(
    metric: string,
    previousValue: number,
    newValue: number,
    threshold: number = 0.5
): boolean {
    const lowerIsBetter = ['reactionTime', 'elapsedTime', 'accelerationPhase'].includes(metric);
    
    const improvementPercent = lowerIsBetter
        ? ((previousValue - newValue) / previousValue) * 100
        : ((newValue - previousValue) / previousValue) * 100;

    return improvementPercent >= threshold;
}