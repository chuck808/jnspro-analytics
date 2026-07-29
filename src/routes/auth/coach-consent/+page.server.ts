import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { respondParentConsent } from '$lib/server/coachLinks';

interface CoachConsentMetadata {
	linkId?: string;
	riderId?: string;
	riderName?: string;
	coachName?: string;
	consentToken?: string;
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	// Same @supabase/ssr cookie-exchange pattern as auth/parental-consent —
	// the invite link establishes a session as the invited (parent) account
	// by the time this loads.
	const {
		data: { user }
	} = await supabase.auth.getUser();

	const metadata = (user?.user_metadata ?? {}) as CoachConsentMetadata;
	const { linkId, riderName, coachName, consentToken } = metadata;

	if (!linkId || !consentToken) {
		return { valid: false as const, riderName: null, coachName: null, status: null };
	}

	const admin = createSupabaseAdminClient();
	const { data: link } = await admin
		.from('coach_rider_links')
		.select('status, parent_consent_token')
		.eq('id', linkId)
		.single();

	if (!link || link.parent_consent_token !== consentToken) {
		return { valid: false as const, riderName: null, coachName: null, status: null };
	}

	return {
		valid: true as const,
		riderName: riderName ?? null,
		coachName: coachName ?? null,
		status: link.status
	};
};

async function respond(
	supabase: App.Locals['supabase'],
	decision: 'active' | 'denied'
): Promise<{ error?: string }> {
	const {
		data: { user }
	} = await supabase.auth.getUser();

	const metadata = (user?.user_metadata ?? {}) as CoachConsentMetadata;
	const { linkId, consentToken } = metadata;

	if (!linkId || !consentToken) {
		return { error: 'This consent link is invalid or has expired.' };
	}

	return respondParentConsent(linkId, consentToken, decision);
}

export const actions: Actions = {
	approve: async ({ locals: { supabase } }) => {
		const { error } = await respond(supabase, 'active');
		if (error) return fail(400, { error });
		return { success: true, decision: 'approved' as const };
	},
	deny: async ({ locals: { supabase } }) => {
		const { error } = await respond(supabase, 'denied');
		if (error) return fail(400, { error });
		return { success: true, decision: 'denied' as const };
	}
};
