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
