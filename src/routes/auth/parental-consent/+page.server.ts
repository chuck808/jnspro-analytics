import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

interface ConsentMetadata {
	riderId?: string;
	riderName?: string;
	consentToken?: string;
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	// Mirrors verify-email's pattern: the invite link's session is established
	// by the time this loads, via the same @supabase/ssr cookie exchange used
	// for the existing signup-confirmation email flow.
	const {
		data: { user }
	} = await supabase.auth.getUser();

	const metadata = (user?.user_metadata ?? {}) as ConsentMetadata;
	const { riderId, riderName, consentToken } = metadata;

	if (!riderId || !consentToken) {
		return { valid: false as const, riderName: null, status: null };
	}

	const admin = createSupabaseAdminClient();
	const { data: profile } = await admin
		.from('profiles')
		.select('parental_consent_status, parental_consent_token, name')
		.eq('id', riderId)
		.single();

	if (!profile || profile.parental_consent_token !== consentToken) {
		return { valid: false as const, riderName: null, status: null };
	}

	return {
		valid: true as const,
		riderName: riderName ?? profile.name,
		status: profile.parental_consent_status
	};
};

async function respond(
	supabase: App.Locals['supabase'],
	decision: 'approved' | 'denied'
): Promise<{ error?: string }> {
	const {
		data: { user }
	} = await supabase.auth.getUser();

	const metadata = (user?.user_metadata ?? {}) as ConsentMetadata;
	const { riderId, consentToken } = metadata;

	if (!riderId || !consentToken) {
		return { error: 'This consent link is invalid or has expired.' };
	}

	const admin = createSupabaseAdminClient();
	const { data: profile } = await admin
		.from('profiles')
		.select('parental_consent_status, parental_consent_token')
		.eq('id', riderId)
		.single();

	if (!profile || profile.parental_consent_token !== consentToken) {
		return { error: 'This consent link is invalid or has expired.' };
	}

	if (profile.parental_consent_status !== 'pending') {
		// Already responded — treat as success (idempotent), don't error.
		return {};
	}

	const { error } = await admin
		.from('profiles')
		.update({
			parental_consent_status: decision,
			parental_consent_confirmed_at: new Date().toISOString(),
			parental_consent_token: null
		})
		.eq('id', riderId);

	if (error) {
		console.error('Failed to record parental consent decision:', error);
		return { error: 'Something went wrong recording your response — please try again.' };
	}

	return {};
}

export const actions: Actions = {
	approve: async ({ locals: { supabase } }) => {
		const { error } = await respond(supabase, 'approved');
		if (error) return fail(400, { error });
		return { success: true, decision: 'approved' as const };
	},
	deny: async ({ locals: { supabase } }) => {
		const { error } = await respond(supabase, 'denied');
		if (error) return fail(400, { error });
		return { success: true, decision: 'denied' as const };
	}
};
