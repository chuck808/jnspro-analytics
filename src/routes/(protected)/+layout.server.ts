import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase, session, user } }) => {
	// The authGuard in hooks.server.ts already validates and redirects if no session
	// So by the time we get here, we know session and user exist
	// No need to check or redirect again - that was causing the loop

	// Get user profile from database
	// user is guaranteed to exist here because authGuard already validated it
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user!.id)
		.single();

	// Log error if profile fetch fails (for debugging)
	if (profileError) {
		console.error('Failed to fetch profile:', profileError);
	}

	// user-images is a private bucket — profile_icon_url/background_image_url
	// store a storage path, not a working URL. Sign a fresh URL here, once,
	// so every route under (protected) gets a working image without each
	// having to know about the private-bucket signing step itself.
	if (profile) {
		const signUserImage = async (stored: string | null): Promise<string | null> => {
			if (!stored) return null;
			// Defensive: extract the path from a legacy full-URL value, in case
			// this row predates the getPublicUrl() -> storage-path fix.
			const path = stored.includes('/user-images/') ? stored.split('/user-images/')[1] : stored;
			if (!path) return null;
			const { data, error: signError } = await supabase.storage
				.from('user-images')
				.createSignedUrl(path, 3600);
			if (signError) {
				console.error('Failed to sign user image URL:', signError);
				return null;
			}
			return data.signedUrl;
		};

		const [signedProfileIconUrl, signedBackgroundImageUrl] = await Promise.all([
			signUserImage(profile.profile_icon_url),
			signUserImage(profile.background_image_url)
		]);
		profile.profile_icon_url = signedProfileIconUrl;
		profile.background_image_url = signedBackgroundImageUrl;
	}

	// Minors' data gate: block the whole app until a parent/guardian has
	// confirmed consent (or explicitly declined it). See src/lib/consent.ts.
	if (
		profile?.parental_consent_status === 'pending' ||
		profile?.parental_consent_status === 'denied'
	) {
		throw redirect(303, '/auth/pending-consent');
	}

	return { session, user, profile };
};
