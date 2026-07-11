import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	if (!user) {
		throw redirect(303, '/auth/sign-in');
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('parental_consent_status, parent_guardian_email')
		.eq('id', user.id)
		.single();

	// Nothing to wait on — send them into the app rather than stranding them here.
	if (
		!profile ||
		profile.parental_consent_status === 'not_required' ||
		profile.parental_consent_status === 'approved'
	) {
		throw redirect(303, '/dashboard');
	}

	return {
		status: profile.parental_consent_status,
		parentEmail: profile.parent_guardian_email
	};
};
