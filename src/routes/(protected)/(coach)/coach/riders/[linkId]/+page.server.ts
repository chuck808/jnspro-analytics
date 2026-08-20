import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { revokeLinkAsCoach } from '$lib/server/coachLinks';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	const { profile } = await parent();
	const coachId = profile!.id;

	const { data: link } = await locals.supabase
		.from('coach_rider_links')
		.select('id, rider_id, status')
		.eq('id', params.linkId)
		.eq('coach_id', coachId)
		.maybeSingle();

	if (!link || link.status !== 'active') {
		throw error(404, 'Rider not found');
	}

	const [riderResult, riderProfileResult, goalsResult, messagesResult, sharesResult] =
		await Promise.all([
			locals.supabase
				.from('profiles')
				.select('id, name, email, club, country, role')
				.eq('id', link.rider_id)
				.single(),
			locals.supabase
				.from('rider_profiles')
				.select('*')
				.eq('user_id', link.rider_id)
				.order('effective_from', { ascending: false })
				.limit(1)
				.maybeSingle(),
			locals.supabase
				.from('training_goals')
				.select('id, metric, target_value, start_value, current_value, deadline, completed_at')
				.eq('user_id', link.rider_id)
				.order('created_at', { ascending: false }),
			locals.supabase
				.from('coach_rider_messages')
				.select('id, sender_id, message_type, content, flagged_field, resolved_at, created_at')
				.eq('link_id', link.id)
				.order('created_at', { ascending: true }),
			locals.supabase
				.from('report_shares')
				.select('id, report_type, created_at, viewed_at')
				.eq('link_id', link.id)
				.order('created_at', { ascending: false })
		]);

	// Visiting this page is what "viewing" the shared reports means — clear
	// the unread badge shown on the roster page.
	const unreadIds = (sharesResult.data ?? []).filter((s) => !s.viewed_at).map((s) => s.id);
	if (unreadIds.length > 0) {
		const viewedAt = new Date().toISOString();
		await locals.supabase.from('report_shares').update({ viewed_at: viewedAt }).in('id', unreadIds);
		for (const share of sharesResult.data ?? []) {
			if (unreadIds.includes(share.id)) share.viewed_at = viewedAt;
		}
	}

	return {
		linkId: link.id,
		rider: riderResult.data,
		riderProfile: riderProfileResult.data,
		// Keep the existing UI's boolean field while reading the live completed_at model.
		goals: (goalsResult.data ?? []).map((goal) => ({
			...goal,
			completed: goal.completed_at !== null
		})),
		messages: messagesResult.data ?? [],
		reportShares: sharesResult.data ?? [],
		coachId
	};
};

export const actions: Actions = {
	sendMessage: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { messageError: 'Not authenticated' });

		const form = await request.formData();
		const content = (form.get('content') as string)?.trim();
		if (!content) return fail(400, { messageError: 'Message cannot be empty' });

		const { error: insertError } = await locals.supabase.from('coach_rider_messages').insert({
			link_id: params.linkId,
			sender_id: locals.user.id,
			message_type: 'message',
			content
		});

		if (insertError) return fail(500, { messageError: 'Failed to send message' });
		return { messageSuccess: true };
	},

	flagProfile: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { flagError: 'Not authenticated' });

		const form = await request.formData();
		const flaggedField = (form.get('flaggedField') as string)?.trim();
		const content = (form.get('content') as string)?.trim();
		if (!flaggedField || !content) {
			return fail(400, { flagError: 'Please describe what looks wrong' });
		}

		const { error: insertError } = await locals.supabase.from('coach_rider_messages').insert({
			link_id: params.linkId,
			sender_id: locals.user.id,
			message_type: 'profile_flag',
			flagged_field: flaggedField,
			content
		});

		if (insertError) return fail(500, { flagError: 'Failed to send flag' });
		return { flagSuccess: true };
	},

	removeTrainee: async ({ locals, params }) => {
		if (!locals.user) return fail(401, { removeError: 'Not authenticated' });

		const { error: revokeError } = await revokeLinkAsCoach(params.linkId, locals.user.id);
		if (revokeError) return fail(400, { removeError: revokeError });

		throw redirect(303, '/coach');
	}
};
