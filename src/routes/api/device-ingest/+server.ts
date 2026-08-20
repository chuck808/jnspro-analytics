// src/routes/api/device-ingest/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSDFile, transformSDFile } from '$lib/services/ingest';
import type { SDCardFile } from '$lib/services/ingest';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import {
	calculateSessionChecksum,
	findSessionByChecksum,
	isUniqueViolation,
	rollbackIncompleteSession
} from '$lib/server/sessionIngestGuard';
import { DEVICE_INGEST_SECRET } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('x-device-ingest-secret');
	if (!authHeader || authHeader !== DEVICE_INGEST_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: { userId: string; fileData: unknown };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const { userId, fileData } = body;
	if (!userId || !fileData) {
		return json({ error: 'Missing userId or fileData' }, { status: 400 });
	}

	const validation = validateSDFile(fileData);
	if (!validation.valid) {
		return json(
			{ success: false, errors: validation.errors, warnings: validation.warnings },
			{ status: 422 }
		);
	}

	const supabase = createSupabaseAdminClient();
	const fileChecksum = await calculateSessionChecksum(fileData);

	// Both Wi-Fi and manual SD uploads use sessions.file_checksum. Treat a repeated
	// device upload as a successful no-op so storage retries are also idempotent.
	const { data: existingSession, error: duplicateCheckError } = await findSessionByChecksum(
		supabase,
		userId,
		fileChecksum
	);

	if (duplicateCheckError) {
		console.error('Device ingest duplicate check error:', duplicateCheckError);
		throw error(500, 'Failed to check existing session');
	}

	if (existingSession) {
		return json({
			success: true,
			duplicate: true,
			session_id: existingSession.id,
			runs_imported: 0,
			timeseries_count: 0,
			timeseries_failed: 0
		});
	}

	const sdFile = fileData as SDCardFile;
	const ingestData = transformSDFile(sdFile);

	try {
		const [bikeResult, profileResult] = await Promise.all([
			supabase.from('bikes').select('id').eq('user_id', userId).eq('is_active', true).maybeSingle(),
			supabase
				.from('rider_profiles')
				.select('id')
				.eq('user_id', userId)
				.order('effective_from', { ascending: false })
				.limit(1)
				.maybeSingle()
		]);

		const bikeId = bikeResult.data?.id ?? null;
		const riderProfileId = profileResult.data?.id ?? null;

		const { data: sessionRecord, error: sessionError } = await supabase
			.from('sessions')
			.insert({
				user_id: userId,
				session_type: ingestData.session_type,
				timestamp: ingestData.timestamp,
				bike_id: bikeId,
				rider_profile_id: riderProfileId,
				notes: '',
				archived: false,
				file_checksum: fileChecksum
			})
			.select('id')
			.single();

		if (sessionError || !sessionRecord) {
			// A concurrent upload can win after our pre-check. Resolve the unique
			// constraint race to the already-created session instead of duplicating it.
			if (isUniqueViolation(sessionError)) {
				const { data: concurrentSession, error: concurrentLookupError } = await findSessionByChecksum(
					supabase,
					userId,
					fileChecksum
				);

				if (concurrentLookupError) {
					console.error('Device ingest concurrent duplicate lookup error:', concurrentLookupError);
				}

				if (concurrentSession) {
					return json({
						success: true,
						duplicate: true,
						session_id: concurrentSession.id,
						runs_imported: 0,
						timeseries_count: 0,
						timeseries_failed: 0
					});
				}
			}

			console.error('Session insert error:', sessionError);
			throw error(500, 'Failed to create session record');
		}

		const sessionId = sessionRecord.id;
		let timeseriesCount = 0;
		let timeseriesFailedCount = 0;

		try {
			for (const run of ingestData.runs) {
				const { data: runRecord, error: runError } = await supabase
					.from('runs')
					.insert({
						session_id: sessionId,
						run_number: run.run_number,
						elapsed_time_ms: run.elapsed_time_ms,
						distance_m: run.distance_m,
						chart_data: run.chart_data
					})
					.select('id')
					.single();

				if (runError || !runRecord) throw error(500, `Failed to insert run ${run.run_number}`);
				const runId = runRecord.id;

				const { error: gateError } = await supabase.from('gate_runs').insert({
					run_id: runId,
					reaction_time_ms: run.reaction_time_ms ?? 0,
					max_g: run.max_g ?? 0,
					avg_g: run.avg_g ?? 0,
					speed_ms: run.speed_ms ?? null,
					peak_speed_ms: run.peak_speed_ms ?? null,
					avg_speed_ms_calc: run.avg_speed_ms_calc ?? null,
					time_to_peak_speed_ms: run.time_to_peak_speed_ms ?? null,
					bias_correction_ms2: run.bias_correction_ms2 ?? null,
					analytics_valid: run.analytics_valid ?? false,
					max_pitch_deg: run.max_pitch_deg ?? null,
					avg_pitch_deg: run.avg_pitch_deg ?? null,
					pitch_at_peak_g_deg: run.pitch_at_peak_g_deg ?? null,
					time_to_wheelie_ms: run.time_to_wheelie_ms ?? null,
					wheelie_duration_ms: run.wheelie_duration_ms ?? null,
					front_wheel_lifted: run.front_wheel_lifted ?? false
				});

				if (gateError) {
					console.error(`Gate run ${run.run_number} full error:`, JSON.stringify(gateError, null, 2));
					throw error(500, `Failed to insert gate run ${run.run_number}`);
				}

				if (run.timeSeries) {
					const { error: tsError } = await supabase.from('run_timeseries').insert({
						run_id: runId,
						sample_rate_hz: run.timeSeries.sample_rate_hz,
						sample_count: run.timeSeries.sample_count,
						g_force_data: run.timeSeries.g_force_data,
						pitch_deg: run.timeSeries.pitch_deg,
						roll_deg: run.timeSeries.roll_deg,
						linear_accel_g: run.timeSeries.linear_accel_g,
						raw_accel_g: run.timeSeries.raw_accel_g
					});
					if (tsError) {
						timeseriesFailedCount++;
						console.warn(`Timeseries failed run ${run.run_number}:`, tsError);
					} else {
						timeseriesCount++;
					}
				}
			}
		} catch (runInsertError) {
			console.error('[Device ingest] Run insertion failed, rolling back session:', runInsertError);
			await rollbackIncompleteSession(supabase, sessionId);
			throw runInsertError;
		}

		return json({
			success: true,
			duplicate: false,
			session_id: sessionId,
			runs_imported: ingestData.runs.length,
			timeseries_count: timeseriesCount,
			timeseries_failed: timeseriesFailedCount
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('Device ingest error:', err);
		throw error(500, 'Unexpected error during device ingest');
	}
};
