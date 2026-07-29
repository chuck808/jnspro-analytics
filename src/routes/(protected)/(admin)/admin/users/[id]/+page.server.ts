import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { revokeLinkAsAdmin } from '$lib/server/coachLinks';
import { grantCoachStatus } from '$lib/server/coachApplications';

export const load: PageServerLoad = async ({ params }) => {
	const admin = createSupabaseAdminClient();

	const [profileResult, sessionsResult, riderResult, bikeResult, auditResult, coachLinksResult] =
		await Promise.all([
			admin.from('profiles').select('*').eq('id', params.id).single(),
			admin
				.from('sessions')
				.select('id, session_type, timestamp, archived, runs(id)')
				.eq('user_id', params.id)
				.order('timestamp', { ascending: false }),
			admin
				.from('rider_profiles')
				.select('*')
				.eq('user_id', params.id)
				.order('effective_from', { ascending: false })
				.limit(1)
				.maybeSingle(),
			admin.from('bikes').select('*').eq('user_id', params.id).eq('is_active', true).maybeSingle(),
			admin
				.from('admin_role_audit')
				.select('*')
				.eq('target_id', params.id)
				.order('changed_at', { ascending: false }),
			// All statuses, not just active — this is safeguarding oversight,
			// admins should be able to see the full relationship history.
			admin
				.from('coach_rider_links')
				.select('id, coach_id, status, invited_at, responded_at, revoked_at')
				.eq('rider_id', params.id)
				.order('invited_at', { ascending: false })
		]);

	const coachIds = (coachLinksResult.data ?? []).map((l) => l.coach_id);
	const { data: coachProfiles } =
		coachIds.length > 0
			? await admin.from('profiles').select('id, name, email').in('id', coachIds)
			: { data: [] };
	const coachById = new Map((coachProfiles ?? []).map((c) => [c.id, c]));

	const coachLinks = (coachLinksResult.data ?? []).map((link) => ({
		linkId: link.id,
		status: link.status,
		invitedAt: link.invited_at,
		respondedAt: link.responded_at,
		revokedAt: link.revoked_at,
		coachName: coachById.get(link.coach_id)?.name ?? 'Unknown',
		coachEmail: coachById.get(link.coach_id)?.email ?? null
	}));

	return {
		profile: profileResult.data,
		sessions: sessionsResult.data ?? [],
		rider: riderResult.data,
		bike: bikeResult.data,
		auditLog: auditResult.data ?? [],
		coachLinks
	};
};

export const actions: Actions = {
	setRole: async ({ request, locals, params }) => {
		const form = await request.formData();
		const newRole = form.get('role') as string;
		const reason = (form.get('reason') as string) || undefined;

		if (!['admin', 'user'].includes(newRole)) {
			return fail(400, { roleError: 'Invalid role' });
		}

		const { error } = await locals.supabase.rpc('set_user_role', {
			p_target_id: params.id,
			p_new_role: newRole,
			p_reason: reason
		});

		if (error) return fail(500, { roleError: error.message });
		return { roleSuccess: true };
	},

	forceRevokeCoach: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { coachLinkError: 'Not authenticated' });

		const form = await request.formData();
		const linkId = form.get('linkId') as string;
		if (!linkId) return fail(400, { coachLinkError: 'Missing coach link' });

		const { error } = await revokeLinkAsAdmin(linkId, locals.user.id);
		if (error) return fail(400, { coachLinkError: error });

		return { coachLinkSuccess: true };
	},

	grantCoach: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { coachGrantError: 'Not authenticated' });

		const form = await request.formData();
		const reason = (form.get('reason') as string | null)?.trim() || undefined;

		const { error } = await grantCoachStatus(params.id, locals.user.id, reason);
		if (error) return fail(400, { coachGrantError: error });

		return { coachGrantSuccess: true };
	}
};
