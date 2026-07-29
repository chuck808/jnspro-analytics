import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { inviteRider } from '$lib/server/coachLinks';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { profile } = await parent();
	const coachId = profile!.id;

	const { data: links } = await locals.supabase
		.from('coach_rider_links')
		.select('id, rider_id, status, invited_at')
		.eq('coach_id', coachId)
		.order('invited_at', { ascending: false });

	const riderIds = (links ?? []).map((l) => l.rider_id);
	const { data: riders } =
		riderIds.length > 0
			? await locals.supabase.from('profiles').select('id, name, email').in('id', riderIds)
			: { data: [] };
	const riderById = new Map((riders ?? []).map((r) => [r.id, r]));

	const activeLinkIds = (links ?? []).filter((l) => l.status === 'active').map((l) => l.id);
	const { data: unreadShares } =
		activeLinkIds.length > 0
			? await locals.supabase
					.from('report_shares')
					.select('link_id')
					.in('link_id', activeLinkIds)
					.is('viewed_at', null)
			: { data: [] };

	const unreadByLink = new Map<string, number>();
	for (const s of unreadShares ?? []) {
		unreadByLink.set(s.link_id, (unreadByLink.get(s.link_id) ?? 0) + 1);
	}

	const roster = (links ?? []).map((l) => ({
		linkId: l.id,
		riderId: l.rider_id,
		riderName: riderById.get(l.rider_id)?.name ?? 'Unknown',
		riderEmail: riderById.get(l.rider_id)?.email ?? null,
		status: l.status,
		invitedAt: l.invited_at,
		unreadCount: unreadByLink.get(l.id) ?? 0
	}));

	return {
		roster,
		totalUnread: roster.reduce((sum, r) => sum + r.unreadCount, 0)
	};
};

export const actions: Actions = {
	invite: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { inviteError: 'Not authenticated' });

		// Defense in depth — don't rely on the (coach) layout gate alone for
		// a state-mutating action; re-check coach_status here directly.
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('coach_status')
			.eq('id', locals.user.id)
			.single();
		if (profile?.coach_status !== 'approved') {
			return fail(403, { inviteError: 'Your account is not an approved coach.' });
		}

		const form = await request.formData();
		const email = (form.get('email') as string)?.trim();
		if (!email) return fail(400, { inviteError: 'Email is required' });

		await inviteRider(locals.user.id, email);

		// Deliberately generic — never reveals whether an account exists for
		// that email, so this can't be used to enumerate accounts.
		return {
			inviteSuccess: true,
			inviteMessage: 'If an account exists for that email, an invite has been sent.'
		};
	}
};
