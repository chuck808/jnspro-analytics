import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { ingestSessionEvidence } from '$lib/server/ingestSessionEvidence';

function duplicateResponse(existingSession: {
	id: string;
	timestamp: string;
	session_type: string | null;
	runs: { id: string }[] | null;
}) {
	const runCount = Array.isArray(existingSession.runs) ? existingSession.runs.length : 0;
	return json(
		{
			success: false,
			duplicate: true,
			existing_session: {
				id: existingSession.id,
				timestamp: existingSession.timestamp,
				session_type: existingSession.session_type,
				run_count: runCount
			},
			message: `This file was already uploaded on ${new Date(
				existingSession.timestamp
			).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})}`
		},
		{ status: 409 }
	);
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const { data: claimsData, error: claimsError } = await locals.supabase.auth.getClaims();
	if (claimsError || !claimsData?.claims) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let rawData: unknown;
	try {
		rawData = await request.json();
	} catch {
		throw error(400, 'Invalid JSON — could not parse file');
	}

	try {
		const result = await ingestSessionEvidence({
			persistenceClient: locals.supabase,
			reconciliationClient: createSupabaseAdminClient(),
			userId: claimsData.claims.sub,
			fileData: rawData,
			logPrefix: '[Upload]'
		});

		if (result.outcome === 'invalid') {
			return json(
				{ success: false, errors: result.errors, warnings: result.warnings },
				{ status: 422 }
			);
		}

		if (result.outcome === 'duplicate') {
			return duplicateResponse(result.existingSession);
		}

		return json({
			success: true,
			session_id: result.sessionId,
			runs_imported: result.runsImported,
			timeseries_count: result.timeseriesCount,
			timeseries_failed: result.timeseriesFailed,
			timeseries_errors:
				result.timeseriesErrors.length > 0 ? result.timeseriesErrors : undefined,
			warnings: result.warnings,
			bike_linked: result.bikeLinked,
			profile_linked: result.profileLinked
		});
	} catch (err) {
		console.error('Unexpected ingest error:', err);
		throw error(500, 'Unexpected error during import');
	}
};
