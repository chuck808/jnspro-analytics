import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import {
	generateConsentToken,
	isValidPastDate,
	requiresParentalConsent
} from '$lib/server/consent';
import { submitApplication } from '$lib/server/coachApplications';

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const email = form.get('email') as string;
		const password = form.get('password') as string;
		const confirmPassword = form.get('confirmPassword') as string;
		const name = form.get('name') as string;
		const dateOfBirth = form.get('dateOfBirth') as string;
		const parentEmail = (form.get('parentEmail') as string | null)?.trim() || null;

		if (!email || !password || !name || !dateOfBirth) {
			return fail(400, { error: 'All fields are required' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		if (!isValidPastDate(dateOfBirth)) {
			return fail(400, { error: 'Please enter a valid date of birth' });
		}

		const isMinor = requiresParentalConsent(dateOfBirth);

		if (isMinor && !parentEmail) {
			return fail(400, {
				error: "A parent or guardian's email is required for riders under 16"
			});
		}

		const { data, error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				data: { name },
				emailRedirectTo: `${url.origin}/auth/verify-email`
			}
		});

		if (error) {
			return fail(400, { error: error.message });
		}

		if (!data.user) {
			return fail(500, {
				error: 'Account created but could not be set up — please contact support'
			});
		}

		// Written via the admin client, never the session-scoped client — the
		// profiles_protect_consent_fields trigger rejects non-service-role
		// writes to these columns, so a rider can never self-approve consent.
		const admin = createSupabaseAdminClient();
		const consentToken = isMinor ? generateConsentToken() : null;

		const { error: profileError } = await admin
			.from('profiles')
			.update({
				date_of_birth: dateOfBirth,
				parent_guardian_email: parentEmail,
				parental_consent_status: isMinor ? 'pending' : 'not_required',
				parental_consent_token: consentToken,
				parental_consent_requested_at: isMinor ? new Date().toISOString() : null
			})
			.eq('id', data.user.id);

		if (profileError) {
			console.error('Failed to set date_of_birth / consent status on signup:', profileError);
			return fail(500, {
				error: 'Account created but could not be fully set up — please contact support'
			});
		}

		if (isMinor && parentEmail) {
			const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(parentEmail, {
				data: {
					riderId: data.user.id,
					riderName: name,
					consentToken
				},
				redirectTo: `${url.origin}/auth/parental-consent`
			});

			if (inviteError) {
				// Not fatal to signup — the rider's account exists but stays
				// gated as 'pending'. Log for a human to follow up / resend.
				console.error('Failed to send parental consent invite:', inviteError);
			}
		}

		// Gate on !isMinor server-side too — never trust the hidden checkbox
		// alone. A brand-new minor account is already gated behind parental
		// consent; layering coach vetting onto that moment is
		// safeguarding-nonsensical, so it's simply ignored here.
		const applyAsCoach = !isMinor && form.get('applyAsCoach') === 'on';
		if (applyAsCoach) {
			const club = (form.get('club') as string | null)?.trim() || null;
			const qualificationDetails =
				(form.get('qualificationDetails') as string | null)?.trim() ?? '';
			const { error: coachAppError } = await submitApplication(
				data.user.id,
				qualificationDetails,
				club
			);
			if (coachAppError) {
				// Not fatal to signup — same non-fatal precedent as the
				// parental-consent invite above.
				console.error('Failed to submit coach application at signup:', coachAppError);
			}
		}

		return { success: true, email, isMinor, appliedAsCoach: applyAsCoach };
	}
};
