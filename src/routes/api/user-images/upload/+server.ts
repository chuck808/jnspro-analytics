import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * API endpoint for uploading user images (profile icon or background)
 *
 * POST /api/user-images/upload
 *
 * Request body (FormData):
 * - file: File (image file)
 * - type: 'profile_icon' | 'background_image'
 *
 * Response:
 * - { url: string, type: string }
 */
export const POST: RequestHandler = async ({ request, locals: { supabase, user } }) => {
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const imageType = formData.get('type') as string;

		if (!file) {
			throw error(400, 'No file provided');
		}

		if (!imageType || !['profile_icon', 'background_image'].includes(imageType)) {
			throw error(400, 'Invalid image type. Must be "profile_icon" or "background_image"');
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
		if (!allowedTypes.includes(file.type)) {
			throw error(400, 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
		}

		// Validate file size (5MB max)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			throw error(400, 'File too large. Maximum size is 5MB');
		}

		// Generate filename based on type
		const fileExt = file.name.split('.').pop();
		const fileName =
			imageType === 'profile_icon' ? `profile-icon.${fileExt}` : `background.${fileExt}`;

		const filePath = `${user.id}/${fileName}`;

		// Delete existing image if it exists (to avoid orphaned files)
		const { data: existingFiles } = await supabase.storage.from('user-images').list(user.id);

		if (existingFiles) {
			const existingFile = existingFiles.find(
				(f) =>
					(imageType === 'profile_icon' && f.name.startsWith('profile-icon.')) ||
					(imageType === 'background_image' && f.name.startsWith('background.'))
			);

			if (existingFile) {
				await supabase.storage.from('user-images').remove([`${user.id}/${existingFile.name}`]);
			}
		}

		// Upload the new file
		const { error: uploadError } = await supabase.storage
			.from('user-images')
			.upload(filePath, file, {
				cacheControl: '3600',
				upsert: true
			});

		if (uploadError) {
			console.error('Upload error:', uploadError);
			throw error(500, `Upload failed: ${uploadError.message}`);
		}

		// user-images is a private bucket — store the storage path, not a public
		// URL. getPublicUrl() returns a URL that looks valid but never actually
		// grants access on a private bucket; every reader mints its own signed
		// URL from this path at read time instead (see (protected)/+layout.server.ts).
		const updateField =
			imageType === 'profile_icon'
				? { profile_icon_url: filePath, profile_icon_updated_at: new Date().toISOString() }
				: {
						background_image_url: filePath,
						background_image_updated_at: new Date().toISOString()
					};

		const { error: dbError } = await supabase
			.from('profiles')
			.update(updateField)
			.eq('id', user.id);

		if (dbError) {
			console.error('Database update error:', dbError);
			throw error(500, `Failed to update profile: ${dbError.message}`);
		}

		// Sign a URL for the immediate client-side preview (the page itself
		// mints its own on next load — this just avoids a broken-image flash
		// in the moment between upload and reload).
		const { data: signedUrlData, error: signError } = await supabase.storage
			.from('user-images')
			.createSignedUrl(filePath, 3600);

		if (signError) {
			console.error('Signed URL error:', signError);
			throw error(500, `Failed to sign preview URL: ${signError.message}`);
		}

		return json({
			url: signedUrlData.signedUrl,
			type: imageType,
			uploadedAt: new Date().toISOString()
		});
	} catch (err) {
		console.error('Upload error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Internal server error during upload');
	}
};
