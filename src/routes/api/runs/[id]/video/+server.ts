import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * API endpoint for finalizing/removing an optional video on a specific run.
 *
 * Video bytes upload directly to Supabase Storage from the browser so they do
 * not pass through a Vercel request body. This endpoint owns the metadata
 * reference and replacement cleanup after the new object already exists.
 */

const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;

function finitePositiveNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validOptionalDuration(value: unknown): value is number | null | undefined {
	return value == null || (finitePositiveNumber(value) && Number.isInteger(value));
}

function validOptionalSyncOffset(value: unknown): value is number | null | undefined {
	return value == null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

export const POST: RequestHandler = async ({ request, params, locals: { supabase, user } }) => {
	if (!user) throw error(401, 'Unauthorized');

	const runId = params.id;

	try {
		const body = await request.json();
		const { storage_path, filename, mime_type, file_size_bytes, duration_ms, sync_offset_s } = body;

		if (!storage_path || !filename || !mime_type || file_size_bytes == null) {
			throw error(
				400,
				'Missing required fields: storage_path, filename, mime_type, file_size_bytes'
			);
		}

		if (!ALLOWED_MIME_TYPES.includes(mime_type)) {
			throw error(400, `Invalid mime type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
		}

		if (!finitePositiveNumber(file_size_bytes) || file_size_bytes > MAX_FILE_SIZE_BYTES) {
			throw error(400, 'Invalid file size. Maximum size is 200MB');
		}

		if (!validOptionalDuration(duration_ms)) {
			throw error(400, 'duration_ms must be a positive integer or null');
		}

		if (!validOptionalSyncOffset(sync_offset_s)) {
			throw error(400, 'sync_offset_s must be a finite non-negative number or null');
		}

		if (
			sync_offset_s != null &&
			duration_ms != null &&
			sync_offset_s * 1000 > duration_ms
		) {
			throw error(400, 'sync_offset_s must fall within the video duration');
		}

		if (!storage_path.startsWith(`${user.id}/${runId}/`)) {
			throw error(400, 'storage_path does not match the expected upload location');
		}

		// RLS proves that the requested run belongs to this rider.
		const { data: run } = await supabase.from('runs').select('id').eq('id', runId).maybeSingle();
		if (!run) throw error(404, 'Run not found');

		// Read the old object path before replacing the one-row-per-run metadata.
		// It is retired only after the DB points safely at the new object.
		const { data: previousVideo } = await supabase
			.from('run_videos')
			.select('storage_path')
			.eq('run_id', runId)
			.maybeSingle();

		const { data: video, error: dbError } = await supabase
			.from('run_videos')
			.upsert(
				{
					run_id: runId,
					storage_path,
					filename,
					mime_type,
					file_size_bytes,
					duration_ms: duration_ms ?? null,
					sync_offset_s: sync_offset_s ?? null
				},
				{ onConflict: 'run_id' }
			)
			.select()
			.single();

		if (dbError) {
			console.error('Database error saving run video:', dbError);
			throw error(500, `Failed to save video reference: ${dbError.message}`);
		}

		if (previousVideo?.storage_path && previousVideo.storage_path !== storage_path) {
			const { error: cleanupError } = await supabase.storage
				.from('run-videos')
				.remove([previousVideo.storage_path]);
			if (cleanupError) {
				// The newly finalized attachment is still valid. Keep the successful
				// metadata commit and surface the cleanup issue to server logs rather
				// than rolling back to a reference that may no longer be desired.
				console.warn('Failed to retire previous run video object:', cleanupError);
			}
		}

		return json({ video });
	} catch (err) {
		console.error('Run video upload error:', err);
		if (isHttpError(err)) throw err;
		throw error(500, 'Internal server error during video attachment');
	}
};

export const DELETE: RequestHandler = async ({ params, locals: { supabase, user } }) => {
	if (!user) throw error(401, 'Unauthorized');

	const runId = params.id;

	try {
		const { data: video } = await supabase
			.from('run_videos')
			.select('storage_path')
			.eq('run_id', runId)
			.maybeSingle();

		if (!video) throw error(404, 'No video attached to this run');

		// Do not deliberately orphan bytes by deleting the DB reference after a
		// genuine Storage failure. Keeping the row makes the removal retryable.
		const { error: storageError } = await supabase.storage
			.from('run-videos')
			.remove([video.storage_path]);

		if (storageError) {
			console.error('Storage delete error:', storageError);
			throw error(500, 'Failed to remove video from storage');
		}

		const { error: dbError } = await supabase.from('run_videos').delete().eq('run_id', runId);
		if (dbError) {
			console.error('Database delete error:', dbError);
			throw error(500, `Failed to remove video reference: ${dbError.message}`);
		}

		return json({ success: true });
	} catch (err) {
		console.error('Run video delete error:', err);
		if (isHttpError(err)) throw err;
		throw error(500, 'Internal server error during video deletion');
	}
};
