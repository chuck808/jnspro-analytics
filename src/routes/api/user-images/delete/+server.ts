import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * API endpoint for deleting user images
 *
 * DELETE /api/user-images/delete
 *
 * Request body (JSON):
 * - type: 'profile_icon' | 'background_image'
 *
 * Response:
 * - { success: boolean, type: string }
 */
export const DELETE: RequestHandler = async ({ request, locals: { supabase, user } }) => {
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { type: imageType } = await request.json();

		if (!imageType || !['profile_icon', 'background_image'].includes(imageType)) {
			throw error(400, 'Invalid image type. Must be "profile_icon" or "background_image"');
		}

		// Get the current image URL from the database
		const { data: profile } = await supabase
			.from('profiles')
			.select('profile_icon_url, background_image_url')
			.eq('id', user.id)
			.single();

		if (!profile) {
			throw error(404, 'Profile not found');
		}

		const stored =
			imageType === 'profile_icon' ? profile.profile_icon_url : profile.background_image_url;

		if (stored) {
			// Stored value is normally a bare storage path (e.g. "{user_id}/background.png").
			// Fall back to extracting the path from a legacy full-URL value, in case
			// this row predates the getPublicUrl() -> storage-path fix.
			const filePath = stored.includes('/user-images/') ? stored.split('/user-images/')[1] : stored;

			if (filePath) {
				// Delete the file from storage
				const { error: deleteError } = await supabase.storage
					.from('user-images')
					.remove([filePath]);

				if (deleteError) {
					console.error('Storage delete error:', deleteError);
					// Continue anyway to clear the database reference
				}
			}
		}

		// Update the profile table to remove the URL
		const updateField =
			imageType === 'profile_icon'
				? { profile_icon_url: null, profile_icon_updated_at: new Date().toISOString() }
				: { background_image_url: null, background_image_updated_at: new Date().toISOString() };

		const { error: dbError } = await supabase
			.from('profiles')
			.update(updateField)
			.eq('id', user.id);

		if (dbError) {
			console.error('Database update error:', dbError);
			throw error(500, `Failed to update profile: ${dbError.message}`);
		}

		return json({
			success: true,
			type: imageType,
			deletedAt: new Date().toISOString()
		});
	} catch (err) {
		console.error('Delete error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Internal server error during deletion');
	}
};
