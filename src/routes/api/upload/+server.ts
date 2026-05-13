import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSDFile, transformSDFile } from '$lib/services/ingest';
import type { SDCardFile } from '$lib/services/ingest';

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

            // Insert gate_run (typed run) - ensure required numeric fields are numbers not null
            const max_g: number = run.max_g ?? 0;
            const avg_g: number = run.avg_g ?? 0;
            
            const { error: gateError } = await locals.supabase
			.from('gate_runs')
			.insert({
				run_id:                runId,
				reaction_time_ms:      run.reaction_time_ms ?? 0,    // NOT NULL in DB
				max_g:                 run.max_g ?? 0,
				avg_g:                 run.avg_g ?? 0,
				speed_ms:              run.speed_ms ?? 0,             // NOT NULL in DB
				time_ms:               run.elapsed_time_ms ?? null,   // column exists in DB
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

        // Add timeseries failures to warnings if any occurred
        const allWarnings = [...validation.warnings];
        if (timeseriesFailedCount > 0) {
            allWarnings.push(
                `${timeseriesFailedCount} run(s) had timeseries data that failed to import. ` +
                `Pitch/wheelie analytics may be limited for these runs.`
            );
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
