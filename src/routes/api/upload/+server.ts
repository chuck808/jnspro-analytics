import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSDFile, transformSDFile } from '$lib/services/ingest';
import type { SDCardFile } from '$lib/services/ingest';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { processGoalImprovements, isSignificantImprovement } from '$lib/server/goalMilestones';
import { computeSessionGoalMetrics } from '$lib/server/sessionGoalMetrics';
import { upsertSnapshot } from '$lib/services/benchmarking';
import { determineAgeGroup } from '$lib/services/benchmarking/peerComparison';

/**
 * Calculate SHA-256 hash of file content for duplicate detection
 */
async function calculateFileChecksum(data: unknown): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: RequestHandler = async ({ request, locals }) => {
    // Auth check
    const { data: claimsData, error: claimsError } = await locals.supabase.auth.getClaims();
    if (claimsError || !claimsData?.claims) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = claimsData.claims.sub;

    // Parse JSON body
    let rawData: unknown;
    try {
        rawData = await request.json();
    } catch {
        throw error(400, 'Invalid JSON — could not parse file');
    }

    // Calculate file checksum for duplicate detection
    const fileChecksum = await calculateFileChecksum(rawData);

    // Check for duplicate upload
    const { data: existingSession, error: duplicateCheckError } = await locals.supabase
        .from('sessions')
        .select('id, timestamp, session_type, runs(id)')
        .eq('user_id', userId)
        .eq('file_checksum', fileChecksum)
        .maybeSingle();

    if (!duplicateCheckError && existingSession) {
        // Duplicate found - return 409 Conflict with details
        const runCount = Array.isArray(existingSession.runs) ? existingSession.runs.length : 0;
        return json({
            success: false,
            duplicate: true,
            existing_session: {
                id: existingSession.id,
                timestamp: existingSession.timestamp,
                session_type: existingSession.session_type,
                run_count: runCount,
            },
            message: `This file was already uploaded on ${new Date(existingSession.timestamp).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`,
        }, { status: 409 });
    }

    // Validate
    const validation = validateSDFile(rawData);
    if (!validation.valid) {
        return json({
            success: false,
            errors: validation.errors,
            warnings: validation.warnings,
        }, { status: 422 });
    }

    // Transform
    const sdFile = rawData as SDCardFile;
    const ingestData = transformSDFile(sdFile);

    try {
        // Get the user's active bike and latest rider profile
        // to associate with this session
        const [bikeResult, profileResult] = await Promise.all([
            locals.supabase
                .from('bikes')
                .select('id')
                .eq('user_id', userId)
                .eq('is_active', true)
                .maybeSingle(),
            locals.supabase
                .from('rider_profiles')
                .select('id')
                .eq('user_id', userId)
                .order('effective_from', { ascending: false })
                .limit(1)
                .maybeSingle()
        ]);

        const bikeId          = bikeResult.data?.id ?? null;
        const riderProfileId  = profileResult.data?.id ?? null;

        // Insert session with file checksum
        const { data: sessionRecord, error: sessionError } = await locals.supabase
            .from('sessions')
            .insert({
                user_id:          userId,
                session_type:     ingestData.session_type,
                timestamp:        ingestData.timestamp,
                bike_id:          bikeId,
                rider_profile_id: riderProfileId,
                notes:            '',
                archived:         false,
                file_checksum:    fileChecksum,
            })
            .select('id')
            .single();

        if (sessionError || !sessionRecord) {
            console.error('Session insert error:', sessionError);
            throw error(500, 'Failed to create session record');
        }

        const sessionId = sessionRecord.id;
        let timeseriesCount = 0;
        let timeseriesFailedCount = 0;
        const timeseriesErrors: string[] = [];

        // Wrap run insertion in try-catch to ensure atomicity
        // If any run fails, delete the session to avoid partial state
        try {
            // Insert runs one by one (to capture run IDs for typed tables)
            for (const run of ingestData.runs) {
            // Insert base run
            const { data: runRecord, error: runError } = await locals.supabase
                .from('runs')
                .insert({
                    session_id:      sessionId,
                    run_number:      run.run_number,
                    elapsed_time_ms: run.elapsed_time_ms,
                    distance_m:      run.distance_m,
                    chart_data:      run.chart_data,
                })
                .select('id')
                .single();

            if (runError || !runRecord) {
                console.error(`Run ${run.run_number} insert error:`, runError);
                throw error(500, `Failed to insert run ${run.run_number}`);
            }

            const runId = runRecord.id;

            // Insert gate_run. speed_ms is NULL when analytics_valid=false;
            // storing 0 would conflate "unknown speed" with "measured zero speed".
            const { error: gateError } = await locals.supabase
                .from('gate_runs')
                .insert({
                    run_id:                runId,
                    reaction_time_ms:      run.reaction_time_ms ?? 0,
                    max_g:                 run.max_g ?? 0,
                    avg_g:                 run.avg_g ?? 0,
                    speed_ms:              run.speed_ms ?? null,          // null when analytics invalid
                    peak_speed_ms:         run.peak_speed_ms ?? null,
                    avg_speed_ms_calc:     run.avg_speed_ms_calc ?? null,
                    time_to_peak_speed_ms: run.time_to_peak_speed_ms ?? null,
                    bias_correction_ms2:   run.bias_correction_ms2 ?? null,
                    analytics_valid:       run.analytics_valid ?? false,
                    max_pitch_deg:         run.max_pitch_deg ?? null,
                    avg_pitch_deg:         run.avg_pitch_deg ?? null,
                    pitch_at_peak_g_deg:   run.pitch_at_peak_g_deg ?? null,
                    time_to_wheelie_ms:    run.time_to_wheelie_ms ?? null,
                    wheelie_duration_ms:   run.wheelie_duration_ms ?? null,
                    front_wheel_lifted:    run.front_wheel_lifted ?? false,
                });

            if (gateError) {
                console.error(`Gate run ${run.run_number} insert error:`, gateError);
                throw error(500, `Failed to insert gate run ${run.run_number}`);
            }

            // Insert time series if present
            if (run.timeSeries) {
                const { error: tsError } = await locals.supabase
                    .from('run_timeseries')
                    .insert({
                        run_id:         runId,
                        sample_rate_hz: run.timeSeries.sample_rate_hz,
                        sample_count:   run.timeSeries.sample_count,
                        g_force_data:   run.timeSeries.g_force_data,
                        pitch_deg:      run.timeSeries.pitch_deg,
                        roll_deg:       run.timeSeries.roll_deg,
                        linear_accel_g: run.timeSeries.linear_accel_g,
                        raw_accel_g:    run.timeSeries.raw_accel_g,
                    });

                if (tsError) {
                    // Track failure but don't fail entire upload — timeseries is optional
                    timeseriesFailedCount++;
                    const errorMsg = `Run ${run.run_number}: ${tsError.message || 'Unknown error'}`;
                    timeseriesErrors.push(errorMsg);
                    console.warn(`Timeseries insert failed for run ${run.run_number}:`, tsError);
                } else {
                    timeseriesCount++;
                }
            }
            }
        } catch (runInsertError) {
            // Run insertion failed — delete the session to maintain atomicity
            console.error('[Upload] Run insertion failed, rolling back session:', runInsertError);
            await locals.supabase
                .from('sessions')
                .delete()
                .eq('id', sessionId);
            
            // Re-throw the error to return failure to client
            throw runInsertError;
        }

        // Add timeseries failures to warnings if any occurred
        const allWarnings = [...validation.warnings];
        if (timeseriesFailedCount > 0) {
            allWarnings.push(
                `${timeseriesFailedCount} run(s) had timeseries data that failed to import. ` +
                `Pitch/wheelie analytics may be limited for these runs.`
            );
        }

        // ── GOAL MILESTONE PROCESSING ──
        // At upload time, no runs have been tagged yet so all are stats-eligible.
        // If the rider later tags warmups, the layout server will recompute when
        // they open the session detail page.
        try {
            const { data: activeGoals } = await locals.supabase
                .from('training_goals')
                .select('id, metric, target_value, start_value, current_value, deadline')
                .eq('user_id', userId)
                .is('completed_at', null);

            if (activeGoals && activeGoals.length > 0) {
                const sessionMetrics = computeSessionGoalMetrics(
                    ingestData.runs.map(r => ({
                        reaction_time_ms:      r.reaction_time_ms,
                        max_g:                 r.max_g,
                        peak_speed_ms:         r.peak_speed_ms ?? null,
                        elapsed_time_ms:       r.elapsed_time_ms ?? null,
                        time_to_peak_speed_ms: r.time_to_peak_speed_ms ?? null,
                        analytics_valid:       r.analytics_valid ?? false,
                    })),
                    ingestData.runs.length
                );

                const improvements: Array<{
                    goalId: string;
                    metric: string;
                    previousValue: number;
                    newValue: number;
                    improved: boolean;
                }> = [];

                for (const goal of activeGoals) {
                    const sessionValue = sessionMetrics[goal.metric as keyof typeof sessionMetrics];
                    const previousValue = goal.current_value;

                    if (sessionValue === null || sessionValue === undefined || previousValue === null) continue;

                    const lowerIsBetter = ['reactionTime', 'elapsedTime', 'accelerationPhase']
                        .includes(goal.metric);
                    const improved = lowerIsBetter
                        ? sessionValue < previousValue
                        : sessionValue > previousValue;

                    if (!improved) continue;

                    const isSignificant = isSignificantImprovement(
                        goal.metric,
                        previousValue,
                        sessionValue,
                        0.5
                    );

                    if (isSignificant) {
                        improvements.push({
                            goalId: goal.id,
                            metric: goal.metric,
                            previousValue,
                            newValue: sessionValue,
                            improved: true,
                        });
                    }
                }

                if (improvements.length > 0) {
                    await processGoalImprovements(
                        locals.supabase,
                        improvements,
                        ingestData.timestamp
                    );
                }
            }
        } catch (goalErr) {
            // Goal milestone failures should not fail the upload — log and continue
            console.warn('[Upload] Goal milestone processing failed:', goalErr);
        }

        // ── Upsert performance snapshot and refresh aggregates ──────────────
        // Non-fatal: snapshot failures must not fail the upload response.
        try {
            // Fetch the data we need to build the snapshot
            const [snapSessionCount, snapPrefs, snapProfile] = await Promise.all([
                locals.supabase
                    .from('sessions')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('archived', false)
                    .eq('session_type', 'gate')
                    .then(r => r.count ?? 0),
                locals.supabase
                    .from('user_preferences')
                    .select('show_on_leaderboard, leaderboard_display_name')
                    .eq('user_id', userId)
                    .maybeSingle()
                    .then(r => r.data),
                locals.supabase
                    .from('rider_profiles')
                    .select('date_of_birth, weight_kg')
                    .eq('user_id', userId)
                    .order('effective_from', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                    .then(r => r.data),
            ]);

            // Compute all-time personal bests across stats-eligible runs
            const { data: allRunsData } = await locals.supabase
                .from('runs')
                .select('tags, gate_runs(reaction_time_ms, peak_speed_ms, max_g, analytics_valid)')
                .in('session_id', (await locals.supabase
                    .from('sessions')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('archived', false)
                    .eq('session_type', 'gate')
                    .then(r => (r.data ?? []).map((s: any) => s.id))));

            const { shouldExcludeFromStats } = await import('$lib/types/runs');
            const eligRuns = (allRunsData ?? []).filter((r: any) => !shouldExcludeFromStats(r.tags));
            const allGate  = eligRuns.flatMap((r: any) => Array.isArray(r.gate_runs) ? r.gate_runs : (r.gate_runs ? [r.gate_runs] : []));
            const validGate = allGate.filter((g: any) => g.analytics_valid);

            const reactions = allGate.map((g: any) => g.reaction_time_ms).filter((v: any): v is number => v != null);
            const speeds    = validGate.map((g: any) => g.peak_speed_ms).filter((v: any): v is number => v != null);
            const gForces   = allGate.map((g: any) => g.max_g).filter((v: any): v is number => v != null);

            let consistency: number | null = null;
            if (reactions.length >= 3) {
                const mean = reactions.reduce((a: number, b: number) => a + b, 0) / reactions.length;
                const std  = Math.sqrt(reactions.map((v: number) => (v - mean) ** 2).reduce((a: number, b: number) => a + b, 0) / reactions.length);
                consistency = Math.max(0, 100 - ((std / mean) * 100));
            }

            // Derive age group and UCI category from date_of_birth if available
            let ageGroup: any = 'unknown';
            let uciCategory: string | null = null;
            if (snapProfile?.date_of_birth) {
                const dob = new Date(snapProfile.date_of_birth);
                const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                ageGroup = determineAgeGroup(age);
                const { getUCICategory } = await import('$lib/utils/uciCategories');
                const uciCat = getUCICategory(snapProfile.date_of_birth);
                uciCategory = uciCat?.shortName ?? null;
            }

            // Experience level: simple session-count-based estimate until real
            // distribution data exists. Will self-correct as aggregates build up.
            const { estimateExperienceLevel } = await import('$lib/services/benchmarking/peerComparison');
            const experienceLevel = estimateExperienceLevel(snapSessionCount, 50);

            // Participation type from profile
            const { data: profileData } = await locals.supabase
                .from('profiles')
                .select('participation_type')
                .eq('id', userId)
                .maybeSingle();

            const adminClient = createSupabaseAdminClient();
            await upsertSnapshot(adminClient, {
                userId,
                bestReactionMs:    reactions.length ? Math.min(...reactions) : null,
                bestPeakSpeedMs:   speeds.length    ? Math.max(...speeds)    : null,
                bestMaxG:          gForces.length   ? Math.max(...gForces)   : null,
                bestConsistency:   consistency,
                sessionCount:      snapSessionCount,
                totalRuns:         allGate.length,
                ageGroup,
                uciCategory,
                experienceLevel,
                participationType: profileData?.participation_type ?? null,
                showOnLeaderboard: snapPrefs?.show_on_leaderboard ?? false,
                displayName:       snapPrefs?.leaderboard_display_name ?? null,
            });
        } catch (snapErr) {
            console.warn('[Upload] Snapshot upsert failed:', snapErr);
        }

        return json({
            success:               true,
            session_id:            sessionId,
            runs_imported:         ingestData.runs.length,
            timeseries_count:      timeseriesCount,
            timeseries_failed:     timeseriesFailedCount,
            timeseries_errors:     timeseriesErrors.length > 0 ? timeseriesErrors : undefined,
            warnings:              allWarnings,
            bike_linked:           bikeId !== null,
            profile_linked:        riderProfileId !== null,
        });

    } catch (err) {
        // Re-throw SvelteKit errors
        if (err && typeof err === 'object' && 'status' in err) throw err;
        console.error('Unexpected ingest error:', err);
        throw error(500, 'Unexpected error during import');
    }
};