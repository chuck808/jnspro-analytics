/**
 * Session Summary Builder
 *
 * Canonical computation of per-session aggregate metrics.
 * Used by both the session detail layout server and the analytics page server
 * so both surfaces always produce identical summary values from the same data.
 *
 * ── INVARIANT ────────────────────────────────────────────────────────────────
 * This file is the single source of truth for per-session metric aggregation.
 * Both routes that consume session summaries MUST call buildSessionSummaries()
 * from here rather than computing metrics independently:
 *
 *   - src/routes/(protected)/analytics/+page.server.ts
 *   - src/routes/(protected)/sessions/[id]/+layout.server.ts
 *
 * If you need a new aggregate metric on the analytics or session detail pages,
 * add it to SessionSummary and buildSessionSummary() here first. Do NOT
 * compute session-level aggregates client-side from raw run data — the
 * cross-session engine consumes these summaries and must receive consistent
 * values from both call sites.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Callers are responsible for passing data in the expected shape — the function
 * does no DB access and applies no tag filtering (filter before calling).
 */

import { shouldExcludeFromStats } from '$lib/types/runs';

export interface GateRunInput {
    reaction_time_ms:      number | null;
    max_g:                 number | null;
    peak_speed_ms:         number | null;
    avg_speed_ms_calc?:    number | null;
    time_to_peak_speed_ms?: number | null;
    analytics_valid:       boolean;
    max_pitch_deg?:        number | null;
    front_wheel_lifted?:   boolean | null;
}

export interface RunInput {
    id?:             string;
    session_id?:     string;
    tags?:           string[] | null;
    elapsed_time_ms?: number | null;
    gate_runs:       GateRunInput[] | GateRunInput | null;
}

export interface SessionInput {
    id:                  string;
    timestamp:           string;
    weather_conditions?: string | null;
    track_surface?:      string | null;
    session_focus?:      string | null;
    ride_feel?:          string | null;
    runs:                RunInput[];
}

export interface SessionSummary {
    id:                  string;
    timestamp:           string;
    run_count:           number;          // stats-eligible runs only
    best_reaction_ms:    number | null;
    avg_reaction_ms:     number | null;
    reaction_cv:         number | null;   // CV% of reaction times
    best_max_g:          number | null;
    avg_max_g:           number | null;
    best_peak_speed_ms:  number | null;
    avg_peak_speed_ms:   number | null;
    avg_max_pitch_deg:   number | null;
    wheelie_count:       number;
    has_valid_speed:     boolean;
    // Context fields — null when not loaded
    weather_conditions:  string | null;
    track_surface:       string | null;
    session_focus:       string | null;
    ride_feel:           string | null;
}

/**
 * Build a canonical SessionSummary from a session with its runs.
 *
 * Filters warmup and excluded runs internally using shouldExcludeFromStats.
 * Returns null if no stats-eligible runs exist for this session.
 */
export function buildSessionSummary(session: SessionInput): SessionSummary | null {
    // Filter to stats-eligible runs only
    const eligibleRuns = session.runs.filter(r =>
        !shouldExcludeFromStats(r.tags as any)
    );

    // Flatten gate runs from eligible runs
    const gateRuns: GateRunInput[] = eligibleRuns.flatMap(r => {
        if (!r.gate_runs) return [];
        return Array.isArray(r.gate_runs) ? r.gate_runs : [r.gate_runs];
    }).filter(g => g !== null && g !== undefined);

    if (gateRuns.length === 0) return null;

    const validRuns = gateRuns.filter(g => g.analytics_valid);

    // Reaction time
    const reactionTimes = gateRuns
        .map(g => g.reaction_time_ms)
        .filter((v): v is number => v !== null);

    const bestReaction = reactionTimes.length > 0 ? Math.min(...reactionTimes) : null;
    const avgReaction  = reactionTimes.length > 0
        ? reactionTimes.reduce((s, v) => s + v, 0) / reactionTimes.length
        : null;

    let reactionCv: number | null = null;
    if (reactionTimes.length > 1 && avgReaction !== null && avgReaction > 0) {
        const variance = reactionTimes.reduce((s, v) => s + Math.pow(v - avgReaction, 2), 0) / reactionTimes.length;
        reactionCv = (Math.sqrt(variance) / avgReaction) * 100;
    }

    // G-force
    const gValues = gateRuns.map(g => g.max_g).filter((v): v is number => v !== null);
    const bestMaxG = gValues.length > 0 ? Math.max(...gValues) : null;
    const avgMaxG  = gValues.length > 0
        ? gValues.reduce((s, v) => s + v, 0) / gValues.length
        : null;

    // Speed (analytics_valid runs only)
    const speeds = validRuns.map(g => g.peak_speed_ms).filter((v): v is number => v !== null);
    const bestPeakSpeed = speeds.length > 0 ? Math.max(...speeds) : null;
    const avgPeakSpeed  = speeds.length > 0
        ? speeds.reduce((s, v) => s + v, 0) / speeds.length
        : null;

    // Pitch (optional field)
    const pitchValues = gateRuns
        .map(g => g.max_pitch_deg ?? null)
        .filter((v): v is number => v !== null);
    const avgMaxPitch = pitchValues.length > 0
        ? pitchValues.reduce((s, v) => s + v, 0) / pitchValues.length
        : null;

    // Wheelie count (optional field)
    const wheelieCount = gateRuns.filter(g => g.front_wheel_lifted === true).length;

    return {
        id:                 session.id,
        timestamp:          session.timestamp,
        run_count:          gateRuns.length,
        best_reaction_ms:   bestReaction,
        avg_reaction_ms:    avgReaction,
        reaction_cv:        reactionCv,
        best_max_g:         bestMaxG,
        avg_max_g:          avgMaxG,
        best_peak_speed_ms: bestPeakSpeed,
        avg_peak_speed_ms:  avgPeakSpeed,
        avg_max_pitch_deg:  avgMaxPitch,
        wheelie_count:      wheelieCount,
        has_valid_speed:    speeds.length > 0,
        weather_conditions: session.weather_conditions ?? null,
        track_surface:      session.track_surface ?? null,
        session_focus:      session.session_focus ?? null,
        ride_feel:          session.ride_feel ?? null,
    };
}

/**
 * Build summaries for an array of sessions, filtering out sessions
 * with no stats-eligible runs.
 */
export function buildSessionSummaries(sessions: SessionInput[]): SessionSummary[] {
    return sessions
        .map(buildSessionSummary)
        .filter((s): s is SessionSummary => s !== null);
}