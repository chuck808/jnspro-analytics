import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;

function safeFilename(filename: string): string {
	return filename.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

async function assertOwnedRun(supabase: App.Locals['supabase'], runId: string) {
	const { data: run } = await supabase.from('runs').select('id').eq('id', runId).maybeSingle();
	if (!run) throw error(404, 'Run not found');
}

/**
 * POST issues a short-lived Supabase Storage upload token from the authenticated
 * server-side session. The browser can then send the video bytes directly to
 * Storage without relying on access to the app's httpOnly auth cookie.
 */
export const POST: RequestHandler = async ({ request, params, locals: { supabase, user } }) => {
	if (!user) throw error(401, 'Unauthorized');

	try {
		const body = await request.json();
		const { filename, mime_type, file_size_bytes } = body;

		if (!filename || !mime_type || file_size_bytes == null) {
			throw error(400, 'Missing required fields: filename, mime_type, file_size_bytes');
		}
		if (!ALLOWED_MIME_TYPES.includes(mime_type)) {
			throw error(400, `Invalid mime type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
		}
		if (
			typeof file_size_bytes !== 'number' ||
			!Number.isFinite(file_size_bytes) ||
			file_size_bytes <= 0 ||
			file_size_bytes > MAX_FILE_SIZE_BYTES
		) {
			throw error(400, 'Invalid file size. Maximum size is 200MB');
		}

		await assertOwnedRun(supabase, params.id);

		const attemptId = crypto.randomUUID();
		const storagePath = `${user.id}/${params.id}/${attemptId}-${safeFilename(filename)}`;
		const { data, error: signError } = await supabase.storage
			.from('run-videos')
			.createSignedUploadUrl(storagePath, { upsert: false });

		if (signError || !data?.token) {
			console.error('Failed to create run-video signed upload URL:', signError);
			throw error(500, 'Failed to authorize video upload');
		}

		return json({ storage_path: storagePath, token: data.token });
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('Run video upload-ticket error:', err);
		throw error(500, 'Internal server error while authorizing video upload');
	}
};

/**
 * DELETE cleans an uploaded-but-unfinalized attempt using the authenticated
 * server-side Storage client. This is intentionally separate from deleting an
 * attached video: no run_videos row exists yet for this failure path.
 */
export const DELETE: RequestHandler = async ({ request, params, locals: { supabase, user } }) => {
	if (!user) throw error(401, 'Unauthorized');

	try {
		const body = await request.json();
		const storagePath = body?.storage_path;
		if (typeof storagePath !== 'string' || !storagePath.startsWith(`${user.id}/${params.id}/`)) {
			throw error(400, 'Invalid storage_path');
		}

		await assertOwnedRun(supabase, params.id);

		const { error: removeError } = await supabase.storage.from('run-videos').remove([storagePath]);
		if (removeError) {
			console.error('Failed to clean unfinalized run video:', removeError);
			throw error(500, 'Failed to clean unfinalized video upload');
		}

		return json({ success: true });
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('Run video upload cleanup error:', err);
		throw error(500, 'Internal server error during video upload cleanup');
	}
};
