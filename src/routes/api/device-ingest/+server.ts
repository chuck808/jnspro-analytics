import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { ingestSessionEvidence } from '$lib/server/ingestSessionEvidence';
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

	const supabase = createSupabaseAdminClient();

	try {
		const result = await ingestSessionEvidence({
			persistenceClient: supabase,
			reconciliationClient: supabase,
			userId,
			fileData,
			logPrefix: '[Device ingest]'
		});

		if (result.outcome === 'invalid') {
			return json(
				{ success: false, errors: result.errors, warnings: result.warnings },
				{ status: 422 }
			);
		}

		if (result.outcome === 'duplicate') {
			return json({
				success: true,
				duplicate: true,
				session_id: result.existingSession.id,
				runs_imported: 0,
				timeseries_count: 0,
				timeseries_failed: 0
			});
		}

		return json({
			success: true,
			duplicate: false,
			session_id: result.sessionId,
			runs_imported: result.runsImported,
			timeseries_count: result.timeseriesCount,
			timeseries_failed: result.timeseriesFailed
		});
	} catch (err) {
		console.error('Device ingest error:', err);
		throw error(500, 'Unexpected error during device ingest');
	}
};
