/**
 * Session Goal Metrics
 *
 * Shared utility for computing the metric values used in goal milestone
 * creation. Used by both the upload route (at ingest time) and the session
 * layout server (when the session detail page is opened).
 *
 * Keeping the logic in one place ensures both paths produce identical values
 * and that adding a new goal metric only requires one change.
 */

export interface GoalMetricRun {
    reaction_time_ms:      number | null;
    max_g:                 number | null;
    peak_speed_ms:         number | null;
    elapsed_time_ms:       number | null;
    time_to_peak_speed_ms: number | null;
    analytics_valid:       boolean;
}

export interface SessionGoalMetrics {
    reactionTime:        number | null; // best reaction time in ms
    maxG:                number | null; // best peak G-force
    peakSpeed:           number | null; // best peak speed m/s (analytics_valid only)
    consistency:         number | null; // 0-100 score (100 - CV%)
    elapsedTime:         number | null; // best elapsed time in seconds
    accelerationPhase:   number | null; // best time to peak speed in seconds
    endurance:           number | null; // run count (proxy for endurance)
}

/**
 * Compute all goal-trackable metrics from a set of runs.
 *
 * Accepts any array of objects with the required fields — works with both
 * the ingest TransformedRun shape and the DB gate_runs shape.
 *
 * No tag filtering is applied here — callers are responsible for passing
 * only stats-eligible runs.
 */
export function computeSessionGoalMetrics(
    runs: GoalMetricRun[],
    totalRunCount?: number
): SessionGoalMetrics {
    if (runs.length === 0) {
        return {
            reactionTime:      null,
            maxG:              null,
            peakSpeed:         null,
            consistency:       null,
            elapsedTime:       null,
            accelerationPhase: null,
            endurance:         totalRunCount ?? null,
        };
    }

    const validRuns = runs.filter(r => r.analytics_valid);

    // Reaction time — measured, lower is better
    const reactions = runs
        .map(r => r.reaction_time_ms)
        .filter((v): v is number => v !== null);
    const reactionTime = reactions.length > 0 ? Math.min(...reactions) : null;

    // Max G — measured, higher is better
    const gs = runs
        .map(r => r.max_g)
        .filter((v): v is number => v !== null);
    const maxG = gs.length > 0 ? Math.max(...gs) : null;

    // Peak speed — derived (IMU), higher is better, analytics_valid runs only
    const speeds = validRuns
        .map(r => r.peak_speed_ms)
        .filter((v): v is number => v !== null);
    const peakSpeed = speeds.length > 0 ? Math.max(...speeds) : null;

    // Consistency — derived from reaction time CV%, higher is better (less variation)
    // Score = 100 - CV%, clamped to 0-100
    let consistency: number | null = null;
    if (reactions.length > 1) {
        const mean     = reactions.reduce((s, v) => s + v, 0) / reactions.length;
        const variance = reactions.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / reactions.length;
        const cv       = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : null;
        consistency    = cv !== null ? Math.max(0, Math.min(100, 100 - cv)) : null;
    }

    // Elapsed time — best (lowest) run time in seconds
    const elapsed = runs
        .map(r => r.elapsed_time_ms)
        .filter((v): v is number => v !== null);
    const elapsedTime = elapsed.length > 0 ? Math.min(...elapsed) / 1000 : null;

    // Acceleration phase — best (lowest) time to peak speed in seconds (analytics_valid only)
    const accelPhase = validRuns
        .map(r => r.time_to_peak_speed_ms)
        .filter((v): v is number => v !== null);
    const accelerationPhase = accelPhase.length > 0 ? Math.min(...accelPhase) / 1000 : null;

    // Endurance — total run count (proxy; no filtering applied, caller controls input)
    const endurance = totalRunCount ?? runs.length;

    return {
        reactionTime,
        maxG,
        peakSpeed,
        consistency,
        elapsedTime,
        accelerationPhase,
        endurance,
    };
}