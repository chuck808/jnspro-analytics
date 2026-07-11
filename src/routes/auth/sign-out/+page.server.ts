import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ locals }) => {
		// Sign out from Supabase - this will automatically clear cookies
		// through the Supabase client's cookie management
		await locals.supabase.auth.signOut();

		// Redirect to sign-in page
		throw redirect(303, '/auth/sign-in');
	}
};
