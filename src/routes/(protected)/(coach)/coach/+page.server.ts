import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { inviteRider } from '$lib/server/coachLinks';
import { buildCoachRosterProjection } from '$lib/server/coachWorkspaceProjection';

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

	const activeLinks = (links ?? []).filter((l) => l.status === 'active');
	const activeLinkIds = activeLinks.map((l) => l.id);
	const activeRiderIds = activeLinks.map((l) => l.rider_id);

	const [{ data: shares }, { data: messages }, { data: goals }] = await Promise.all([
		activeLinkIds.length > 0
			? locals.supabase
					.from('report_shares')
					.select('link_id, created_at, viewed_at')
					.in('link_id', activeLinkIds)
			: Promise.resolve({ data: [] }),
		activeLinkIds.length > 0
			? locals.supabase
					.from('coach_rider_messages')
					.select('link_id, message_type, resolved_at')
					.in('link_id', activeLinkIds)
			: Promise.resolve({ data: [] }),
		activeRiderIds.length > 0
			? locals.supabase
					.from('training_goals')
					.select('user_id, completed_at')
					.in('user_id', activeRiderIds)
			: Promise.resolve({ data: [] })
	]);

	const roster = buildCoachRosterProjection({
		links: (links ?? []) as any,
		riders: (riders ?? []) as any,
		shares: (shares ?? []) as any,
		messages: (messages ?? []) as any,
		goals: (goals ?? []) as any
	});

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
