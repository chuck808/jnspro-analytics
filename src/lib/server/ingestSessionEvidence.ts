import type { SupabaseClient } from '@supabase/supabase-js';
import { validateSDFile, transformSDFile, type SDCardFile } from '$lib/services/ingest';
import { reconcilePerformanceSnapshot } from '$lib/server/reconcilePerformanceSnapshot';
import {
	calculateSessionChecksum,
	findSessionByChecksum,
	isUniqueViolation,
	rollbackIncompleteSession
} from '$lib/server/sessionIngestGuard';

export type IngestExistingSession = {
	id: string;
	timestamp: string;
	session_type: string | null;
	runs: { id: string }[] | null;
};

export type SessionIngestResult =
	| {
			outcome: 'invalid';
			errors: string[];
			warnings: string[];
	  }
	| {
			outcome: 'duplicate';
			existingSession: IngestExistingSession;
			warnings: string[];
	  }
	| {
			outcome: 'created';
			sessionId: string;
			runsImported: number;
			timeseriesCount: number;
			timeseriesFailed: number;
			timeseriesErrors: string[];
			warnings: string[];
			bikeLinked: boolean;
			profileLinked: boolean;
	  };

export interface IngestSessionEvidenceOptions {
	persistenceClient: SupabaseClient;
	reconciliationClient: SupabaseClient;
	userId: string;
	fileData: unknown;
	logPrefix: string;
}

/**
 * Canonical source-evidence ingest shared by manual SD and device/Wi-Fi transports.
 *
 * Transport routes own authentication and response semantics. This helper owns the
 * evidence contract: validation, checksum identity, current setup linkage, required
 * session/run/gate persistence, optional timeseries degradation, rollback, and
 * downstream reconciliation.
 */
export async function ingestSessionEvidence({
	persistenceClient,
	reconciliationClient,
	userId,
	fileData,
	logPrefix
}: IngestSessionEvidenceOptions): Promise<SessionIngestResult> {
	const validation = validateSDFile(fileData);
	if (!validation.valid) {
		return {
			outcome: 'invalid',
			errors: validation.errors,
			warnings: validation.warnings
		};
	}

	const fileChecksum = await calculateSessionChecksum(fileData);
	const { data: existingSession, error: duplicateCheckError } = await findSessionByChecksum(
		persistenceClient,
		userId,
		fileChecksum
	);

	if (duplicateCheckError) {
		throw new Error(`Failed to check existing session: ${duplicateCheckError.message}`);
	}

	if (existingSession) {
		return {
			outcome: 'duplicate',
			existingSession: existingSession as IngestExistingSession,
			warnings: validation.warnings
		};
	}

	const ingestData = transformSDFile(fileData as SDCardFile);
	const [bikeResult, profileResult] = await Promise.all([
		persistenceClient
			.from('bikes')
			.select('id')
			.eq('user_id', userId)
			.eq('is_active', true)
			.maybeSingle(),
		persistenceClient
			.from('rider_profiles')
			.select('id')
			.eq('user_id', userId)
			.order('effective_from', { ascending: false })
			.limit(1)
			.maybeSingle()
	]);

	if (bikeResult.error) {
		console.warn(`${logPrefix} active bike lookup failed:`, bikeResult.error);
	}
	if (profileResult.error) {
		console.warn(`${logPrefix} rider profile lookup failed:`, profileResult.error);
	}

	const bikeId = bikeResult.data?.id ?? null;
	const riderProfileId = profileResult.data?.id ?? null;

	const { data: sessionRecord, error: sessionError } = await persistenceClient
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
		if (isUniqueViolation(sessionError)) {
			const { data: concurrentSession, error: concurrentLookupError } = await findSessionByChecksum(
				persistenceClient,
				userId,
				fileChecksum
			);
			if (concurrentLookupError) {
				console.error(`${logPrefix} concurrent duplicate lookup failed:`, concurrentLookupError);
			}
			if (concurrentSession) {
				return {
					outcome: 'duplicate',
					existingSession: concurrentSession as IngestExistingSession,
					warnings: validation.warnings
				};
			}
		}
		throw new Error(`Failed to create session record: ${sessionError?.message ?? 'unknown error'}`);
	}

	const sessionId = sessionRecord.id;
	let timeseriesCount = 0;
	let timeseriesFailed = 0;
	const timeseriesErrors: string[] = [];

	try {
		for (const run of ingestData.runs) {
			const { data: runRecord, error: runError } = await persistenceClient
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

			if (runError || !runRecord) {
				throw new Error(`Failed to insert run ${run.run_number}: ${runError?.message ?? 'unknown error'}`);
			}

			const runId = runRecord.id;
			const { error: gateError } = await persistenceClient.from('gate_runs').insert({
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
				throw new Error(`Failed to insert gate run ${run.run_number}: ${gateError.message}`);
			}

			if (run.timeSeries) {
				const { error: tsError } = await persistenceClient.from('run_timeseries').insert({
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
					timeseriesFailed++;
					const message = `Run ${run.run_number}: ${tsError.message || 'Unknown error'}`;
					timeseriesErrors.push(message);
					console.warn(`${logPrefix} timeseries insert failed:`, tsError);
				} else {
					timeseriesCount++;
				}
			}
		}
	} catch (runInsertError) {
		console.error(`${logPrefix} required evidence insert failed; rolling back session:`, runInsertError);
		await rollbackIncompleteSession(persistenceClient, sessionId);
		throw runInsertError;
	}

	const warnings = [...validation.warnings];
	if (timeseriesFailed > 0) {
		warnings.push(
			`${timeseriesFailed} run(s) had timeseries data that failed to import. Pitch/wheelie analytics may be limited for these runs.`
		);
	}

	try {
		await reconcilePerformanceSnapshot(reconciliationClient, userId);
	} catch (reconcileError) {
		console.warn(`${logPrefix} derived-state reconciliation failed:`, reconcileError);
	}

	return {
		outcome: 'created',
		sessionId,
		runsImported: ingestData.runs.length,
		timeseriesCount,
		timeseriesFailed,
		timeseriesErrors,
		warnings,
		bikeLinked: bikeId !== null,
		profileLinked: riderProfileId !== null
	};
}
