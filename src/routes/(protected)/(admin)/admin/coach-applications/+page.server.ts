import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdminFromProfile } from '$lib/server/adminAuth';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { approveApplication, rejectApplication } from '$lib/server/coachApplications';

export const load: PageServerLoad = async ({ parent }) => {
	const { profile } = await parent();
	requireAdminFromProfile(profile);

	const admin = createSupabaseAdminClient();

	const { data: applications } = await admin
		.from('coach_applications')
		.select(
			'id, applicant_id, source, qualification_details, status, submitted_at, reviewed_by, reviewed_at, review_notes'
		)
		.order('submitted_at', { ascending: false });

	const applicantIds = [...new Set((applications ?? []).map((a) => a.applicant_id))];
	const { data: applicants } =
		applicantIds.length > 0
			? await admin.from('profiles').select('id, name, email, club').in('id', applicantIds)
			: { data: [] };
	const applicantById = new Map((applicants ?? []).map((p) => [p.id, p]));

	const enriched = (applications ?? []).map((a) => ({
		...a,
		applicantName: applicantById.get(a.applicant_id)?.name ?? 'Unknown',
		applicantEmail: applicantById.get(a.applicant_id)?.email ?? null,
		applicantClub: applicantById.get(a.applicant_id)?.club ?? null
	}));

	return {
		pending: enriched.filter((a) => a.status === 'pending'),
		history: enriched.filter((a) => a.status !== 'pending')
	};
};

export const actions: Actions = {
	approve: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { reviewError: 'Not authenticated' });

		const form = await request.formData();
		const applicationId = form.get('applicationId') as string;
		const notes = (form.get('notes') as string | null)?.trim() || undefined;
		if (!applicationId) return fail(400, { reviewError: 'Missing application' });

		const { error } = await approveApplication(applicationId, locals.user.id, notes);
		if (error) return fail(400, { reviewError: error });

		return { reviewSuccess: true };
	},

	reject: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { reviewError: 'Not authenticated' });

		const form = await request.formData();
		const applicationId = form.get('applicationId') as string;
		const notes = (form.get('notes') as string | null)?.trim() || undefined;
		if (!applicationId) return fail(400, { reviewError: 'Missing application' });

		const { error } = await rejectApplication(applicationId, locals.user.id, notes);
		if (error) return fail(400, { reviewError: error });

		return { reviewSuccess: true };
	}
};
