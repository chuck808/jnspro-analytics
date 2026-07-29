/**
 * src/lib/server/coachApplications.ts
 *
 * The single write path for profiles.coach_status and coach_applications.
 * coach_status is protected by the protect_coach_status_field() trigger
 * (supabase/migrations/20260729_add_coach_applications.sql) — only the
 * service-role client can change it, exactly like
 * profiles.parental_consent_* — so, mirroring src/lib/server/coachLinks.ts,
 * every write here goes through createSupabaseAdminClient(). Nothing
 * outside this file should ever write coach_status or coach_applications.
 */

import { createSupabaseAdminClient } from '$lib/server/supabase';

export interface CoachApplicationResult {
	error?: string;
}

export type SubmitOutcome = { kind: 'ok' } | { kind: 'blocked'; error: string };

/**
 * Pure decision logic for whether a new application may be submitted,
 * extracted the same way decideAcceptOutcome() is in coachLinks.ts so it's
 * directly unit-testable without a database.
 */
export function decideSubmitOutcome(currentStatus: string): SubmitOutcome {
	if (currentStatus === 'pending') {
		return { kind: 'blocked', error: 'You already have a coach application pending review.' };
	}
	if (currentStatus === 'approved') {
		return { kind: 'blocked', error: "You're already an approved coach." };
	}
	return { kind: 'ok' };
}

/** Only a still-pending application may be approved or rejected. */
export function canReviewApplication(status: string): boolean {
	return status === 'pending';
}

export async function submitApplication(
	applicantId: string,
	qualificationDetails: string,
	club: string | null
): Promise<CoachApplicationResult> {
	const admin = createSupabaseAdminClient();

	const { data: profile } = await admin
		.from('profiles')
		.select('coach_status')
		.eq('id', applicantId)
		.single();

	const outcome = decideSubmitOutcome(profile?.coach_status ?? 'none');
	if (outcome.kind === 'blocked') {
		return { error: outcome.error };
	}

	if (club !== null) {
		await admin.from('profiles').update({ club }).eq('id', applicantId);
	}

	const { error: insertError } = await admin.from('coach_applications').insert({
		applicant_id: applicantId,
		source: 'application',
		qualification_details: qualificationDetails,
		status: 'pending'
	});
	if (insertError) return { error: 'Failed to submit application — please try again.' };

	await admin.from('profiles').update({ coach_status: 'pending' }).eq('id', applicantId);
	return {};
}

export async function approveApplication(
	applicationId: string,
	adminId: string,
	notes?: string
): Promise<CoachApplicationResult> {
	const admin = createSupabaseAdminClient();
	const { data: application } = await admin
		.from('coach_applications')
		.select('id, applicant_id, status')
		.eq('id', applicationId)
		.maybeSingle();

	if (!application || !canReviewApplication(application.status)) {
		return { error: 'Application not found or already decided.' };
	}

	await admin
		.from('coach_applications')
		.update({
			status: 'approved',
			reviewed_by: adminId,
			reviewed_at: new Date().toISOString(),
			review_notes: notes ?? null
		})
		.eq('id', applicationId);

	await admin.from('profiles').update({ coach_status: 'approved' }).eq('id', application.applicant_id);
	return {};
}

export async function rejectApplication(
	applicationId: string,
	adminId: string,
	notes?: string
): Promise<CoachApplicationResult> {
	const admin = createSupabaseAdminClient();
	const { data: application } = await admin
		.from('coach_applications')
		.select('id, applicant_id, status')
		.eq('id', applicationId)
		.maybeSingle();

	if (!application || !canReviewApplication(application.status)) {
		return { error: 'Application not found or already decided.' };
	}

	await admin
		.from('coach_applications')
		.update({
			status: 'rejected',
			reviewed_by: adminId,
			reviewed_at: new Date().toISOString(),
			review_notes: notes ?? null
		})
		.eq('id', applicationId);

	await admin.from('profiles').update({ coach_status: 'rejected' }).eq('id', application.applicant_id);
	return {};
}

/**
 * Admin direct-grant path — for people already known/trusted, no formal
 * application. Idempotent: granting an already-approved coach is a no-op,
 * not an error, so admins can't accidentally break anything by re-clicking.
 */
export async function grantCoachStatus(
	targetUserId: string,
	adminId: string,
	reason?: string
): Promise<CoachApplicationResult> {
	const admin = createSupabaseAdminClient();
	const { data: profile } = await admin
		.from('profiles')
		.select('coach_status')
		.eq('id', targetUserId)
		.single();

	if (profile?.coach_status === 'approved') return {};

	const { error: insertError } = await admin.from('coach_applications').insert({
		applicant_id: targetUserId,
		source: 'admin_grant',
		status: 'approved',
		reviewed_by: adminId,
		reviewed_at: new Date().toISOString(),
		review_notes: reason ?? null
	});
	if (insertError) return { error: 'Failed to grant coach status — please try again.' };

	await admin.from('profiles').update({ coach_status: 'approved' }).eq('id', targetUserId);
	return {};
}
