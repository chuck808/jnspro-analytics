/**
 * src/lib/server/coachLinks.ts
 *
 * The single write path for every coach_rider_links state transition.
 * coach_rider_links carries parent-consent token/status fields — the same
 * sensitivity class as profiles.parental_consent_* — so, exactly like that
 * flow (src/routes/auth/sign-up, src/routes/auth/parental-consent), every
 * write here goes through the service-role admin client. The table has no
 * client-writable RLS policy at all; nothing outside this file should ever
 * write to coach_rider_links.
 */

import { createSupabaseAdminClient } from '$lib/server/supabase';
import { generateConsentToken, requiresParentalConsent } from '$lib/server/consent';

export interface CoachLinkResult {
	error?: string;
}

export type AcceptOutcome =
	| { kind: 'active' }
	| { kind: 'pending_parent' }
	| { kind: 'blocked'; error: string };

/**
 * Pure decision logic for accepting a coach invite, extracted so the
 * safeguarding-critical branching (never silently skip the minor check,
 * never proceed without a parent email) is directly unit-testable without
 * a database. acceptInvite() below is the only caller.
 */
export function decideAcceptOutcome(
	dateOfBirth: string | null | undefined,
	parentGuardianEmail: string | null | undefined
): AcceptOutcome {
	if (!dateOfBirth) {
		return {
			kind: 'blocked',
			error: 'Please add your date of birth in Settings before accepting a coach invite.'
		};
	}

	if (!requiresParentalConsent(dateOfBirth)) {
		return { kind: 'active' };
	}

	if (!parentGuardianEmail) {
		return {
			kind: 'blocked',
			error:
				'A parent/guardian email is required on your account before accepting a coach invite — add one in Settings.'
		};
	}

	return { kind: 'pending_parent' };
}

/**
 * Coach invites a rider by exact email. Deliberately silent no-op — never
 * distinguishes "no account", "already linked", or "invited yourself" in
 * its return value — so callers show one generic message regardless and
 * this never becomes a way to enumerate accounts.
 */
export async function inviteRider(coachId: string, riderEmail: string): Promise<void> {
	const admin = createSupabaseAdminClient();

	const { data: rider } = await admin
		.from('profiles')
		.select('id')
		.eq('email', riderEmail)
		.is('deleted_at', null)
		.maybeSingle();

	if (!rider || rider.id === coachId) return;

	const { data: existing } = await admin
		.from('coach_rider_links')
		.select('id, status')
		.eq('coach_id', coachId)
		.eq('rider_id', rider.id)
		.maybeSingle();

	if (existing) {
		if (['active', 'pending_rider', 'pending_parent'].includes(existing.status)) {
			return; // already pending or active, nothing to do
		}
		// Re-invite after a terminal state (declined/denied/revoked) — reuse
		// the same row, clear every prior-cycle field.
		await admin
			.from('coach_rider_links')
			.update({
				status: 'pending_rider',
				invited_at: new Date().toISOString(),
				responded_at: null,
				parent_consent_token: null,
				parent_consent_requested_at: null,
				parent_consent_confirmed_at: null,
				revoked_at: null,
				revoked_by: null
			})
			.eq('id', existing.id);
		return;
	}

	await admin.from('coach_rider_links').insert({
		coach_id: coachId,
		rider_id: rider.id,
		status: 'pending_rider'
	});
}

/**
 * Rider accepts a pending invite. The minor check is re-derived fresh here
 * from the rider's current date_of_birth — not snapshotted at invite time —
 * since DOB could be added/corrected between invite and accept.
 */
export async function acceptInvite(
	linkId: string,
	riderId: string,
	origin: string
): Promise<CoachLinkResult> {
	const admin = createSupabaseAdminClient();

	const { data: link } = await admin
		.from('coach_rider_links')
		.select('id, coach_id, status')
		.eq('id', linkId)
		.eq('rider_id', riderId)
		.maybeSingle();

	if (!link || link.status !== 'pending_rider') {
		return { error: 'This invite is no longer available.' };
	}

	const { data: rider } = await admin
		.from('profiles')
		.select('date_of_birth, parent_guardian_email, name')
		.eq('id', riderId)
		.single();

	const outcome = decideAcceptOutcome(rider?.date_of_birth, rider?.parent_guardian_email);

	if (outcome.kind === 'blocked') {
		return { error: outcome.error };
	}

	if (outcome.kind === 'active') {
		await admin
			.from('coach_rider_links')
			.update({ status: 'active', responded_at: new Date().toISOString() })
			.eq('id', linkId);
		return {};
	}

	const consentToken = generateConsentToken();
	const { data: coach } = await admin
		.from('profiles')
		.select('name')
		.eq('id', link.coach_id)
		.single();

	await admin
		.from('coach_rider_links')
		.update({
			status: 'pending_parent',
			responded_at: new Date().toISOString(),
			parent_consent_token: consentToken,
			parent_consent_requested_at: new Date().toISOString()
		})
		.eq('id', linkId);

	// decideAcceptOutcome only returns 'pending_parent' when parent_guardian_email
	// is present — safe to assert non-null here.
	const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
		rider!.parent_guardian_email!,
		{
			data: {
				linkId,
				riderId,
				riderName: rider!.name,
				coachName: coach?.name ?? 'Your coach',
				consentToken
			},
			redirectTo: `${origin}/auth/coach-consent`
		}
	);

	if (inviteError) {
		// Not fatal — the link stays pending_parent, same non-fatal precedent
		// as the signup parental-consent email. Log for follow-up.
		console.error('Failed to send coach-consent invite:', inviteError);
	}

	return {};
}

export async function declineInvite(linkId: string, riderId: string): Promise<CoachLinkResult> {
	const admin = createSupabaseAdminClient();

	const { data: link } = await admin
		.from('coach_rider_links')
		.select('id, status')
		.eq('id', linkId)
		.eq('rider_id', riderId)
		.maybeSingle();

	if (!link || link.status !== 'pending_rider') {
		return { error: 'This invite is no longer available.' };
	}

	await admin
		.from('coach_rider_links')
		.update({ status: 'declined', responded_at: new Date().toISOString() })
		.eq('id', linkId);

	return {};
}

/** Mirrors auth/parental-consent's respond() — token re-validated, idempotent no-op if already answered. */
export async function respondParentConsent(
	linkId: string,
	consentToken: string,
	decision: 'active' | 'denied'
): Promise<CoachLinkResult> {
	const admin = createSupabaseAdminClient();

	const { data: link } = await admin
		.from('coach_rider_links')
		.select('id, status, parent_consent_token')
		.eq('id', linkId)
		.maybeSingle();

	if (!link || link.parent_consent_token !== consentToken) {
		return { error: 'This consent link is invalid or has expired.' };
	}

	if (link.status !== 'pending_parent') {
		return {}; // already answered — idempotent, not an error
	}

	const { error } = await admin
		.from('coach_rider_links')
		.update({
			status: decision,
			parent_consent_confirmed_at: new Date().toISOString(),
			parent_consent_token: null
		})
		.eq('id', linkId);

	if (error) {
		console.error('Failed to record coach-link parental consent decision:', error);
		return { error: 'Something went wrong recording your response — please try again.' };
	}

	return {};
}

async function setRevoked(linkId: string, revokedBy: string): Promise<void> {
	const admin = createSupabaseAdminClient();
	await admin
		.from('coach_rider_links')
		.update({
			status: 'revoked',
			revoked_at: new Date().toISOString(),
			revoked_by: revokedBy
		})
		.eq('id', linkId);
}

export async function revokeLinkAsCoach(linkId: string, coachId: string): Promise<CoachLinkResult> {
	const admin = createSupabaseAdminClient();
	const { data: link } = await admin
		.from('coach_rider_links')
		.select('id')
		.eq('id', linkId)
		.eq('coach_id', coachId)
		.maybeSingle();

	if (!link) return { error: 'Link not found.' };
	await setRevoked(linkId, coachId);
	return {};
}

export async function revokeLinkAsRider(linkId: string, riderId: string): Promise<CoachLinkResult> {
	const admin = createSupabaseAdminClient();
	const { data: link } = await admin
		.from('coach_rider_links')
		.select('id')
		.eq('id', linkId)
		.eq('rider_id', riderId)
		.maybeSingle();

	if (!link) return { error: 'Link not found.' };
	await setRevoked(linkId, riderId);
	return {};
}

export async function revokeLinkAsAdmin(
	linkId: string,
	adminUserId: string
): Promise<CoachLinkResult> {
	const admin = createSupabaseAdminClient();
	const { data: link } = await admin
		.from('coach_rider_links')
		.select('id')
		.eq('id', linkId)
		.maybeSingle();

	if (!link) return { error: 'Link not found.' };
	await setRevoked(linkId, adminUserId);
	return {};
}
