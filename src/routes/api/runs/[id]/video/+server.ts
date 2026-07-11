import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * API endpoint for attaching/removing a video on a specific run.
 *
 * Upload itself happens client-side, directly to Supabase Storage (see
 * VIDEO_SYNC_DESIGN.md's foundation-slice plan for why: proxying video bytes
 * through a Vercel serverless function risks the platform's body-size limit,
 * which the much smaller user-images upload never has to worry about).
 * This endpoint only finalizes the metadata once the bytes already exist in
 * the `run-videos` bucket.
 *
 * POST /api/runs/[id]/video
 * Request body (JSON): { storage_path, filename, mime_type, file_size_bytes, duration_ms? }
 * Response: { video: RunVideoRow }
 *
 * DELETE /api/runs/[id]/video
 * Response: { success: true }
 */

const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // matches the run-videos bucket's file_size_limit

export const POST: RequestHandler = async ({ request, params, locals: { supabase, user } }) => {
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const runId = params.id;

	try {
		const body = await request.json();
		const { storage_path, filename, mime_type, file_size_bytes, duration_ms } = body;

		if (!storage_path || !filename || !mime_type || !file_size_bytes) {
			throw error(
				400,
				'Missing required fields: storage_path, filename, mime_type, file_size_bytes'
			);
		}

		if (!ALLOWED_MIME_TYPES.includes(mime_type)) {
			throw error(400, `Invalid mime type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
		}

		if (typeof file_size_bytes !== 'number' || file_size_bytes > MAX_FILE_SIZE_BYTES) {
			throw error(400, 'File too large. Maximum size is 200MB');
		}

		// Input hygiene, not the real security boundary — storage RLS is what
		// actually gates access. This just catches an obviously-wrong path
		// before it gets written to the DB.
		if (!storage_path.startsWith(`${user.id}/${runId}/`)) {
			throw error(400, 'storage_path does not match the expected upload location');
		}

		// RLS on `runs` already restricts SELECT to runs the user owns via the
		// sessions join — a run belonging to someone else (or that doesn't
		// exist) simply won't be visible here, no separate ownership query needed.
		const { data: run } = await supabase.from('runs').select('id').eq('id', runId).maybeSingle();

		if (!run) {
			throw error(404, 'Run not found');
		}

		const { data: video, error: dbError } = await supabase
			.from('run_videos')
			.upsert(
				{
					run_id: runId,
					storage_path,
					filename,
					mime_type,
					file_size_bytes,
					duration_ms: duration_ms ?? null
				},
				{ onConflict: 'run_id' }
			)
			.select()
			.single();

		if (dbError) {
			console.error('Database error saving run video:', dbError);
			throw error(500, `Failed to save video reference: ${dbError.message}`);
		}

		return json({ video });
	} catch (err) {
		console.error('Run video upload error:', err);
		if (isHttpError(err)) {
			throw err;
		}
		throw error(500, 'Internal server error during video attachment');
	}
};

export const DELETE: RequestHandler = async ({ params, locals: { supabase, user } }) => {
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const runId = params.id;

	try {
		const { data: video } = await supabase
			.from('run_videos')
			.select('storage_path')
			.eq('run_id', runId)
			.maybeSingle();

		if (!video) {
			throw error(404, 'No video attached to this run');
		}

		const { error: storageError } = await supabase.storage
			.from('run-videos')
			.remove([video.storage_path]);

		if (storageError) {
			console.error('Storage delete error:', storageError);
			// Continue anyway to clear the database reference
		}

		const { error: dbError } = await supabase.from('run_videos').delete().eq('run_id', runId);

		if (dbError) {
			console.error('Database delete error:', dbError);
			throw error(500, `Failed to remove video reference: ${dbError.message}`);
		}

		return json({ success: true });
	} catch (err) {
		console.error('Run video delete error:', err);
		if (isHttpError(err)) {
			throw err;
		}
		throw error(500, 'Internal server error during video deletion');
	}
};
