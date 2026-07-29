import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { containsProfanity } from '$lib/utils/profanityFilter';
import { acceptInvite, declineInvite, revokeLinkAsRider } from '$lib/server/coachLinks';
import { submitApplication } from '$lib/server/coachApplications';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
	const { profile } = await parent();
	if (!profile)
		return {
			profile: null,
			preferences: null,
			pendingCoachInvites: [],
			pendingParentApproval: [],
			activeCoaches: [],
			latestCoachApplication: null
		};

	const { data: preferences } = await supabase
		.from('user_preferences')
		.select('*')
		.eq('user_id', profile.id)
		.maybeSingle();

	// Coach relationships — pending invites this rider can accept/decline,
	// active coaches this rider can remove. pending_parent is shown as
	// read-only ("waiting on your parent/guardian"), nothing to action here.
	const { data: coachLinks } = await supabase
		.from('coach_rider_links')
		.select('id, status, coach_id, invited_at')
		.eq('rider_id', profile.id)
		.in('status', ['pending_rider', 'pending_parent', 'active'])
		.order('invited_at', { ascending: false });

	const coachIds = (coachLinks ?? []).map((l) => l.coach_id);
	const { data: coachProfiles } =
		coachIds.length > 0
			? await supabase.from('profiles').select('id, name, email').in('id', coachIds)
			: { data: [] };

	const coachById = new Map((coachProfiles ?? []).map((c) => [c.id, c]));
	const coaches = (coachLinks ?? []).map((link) => ({
		linkId: link.id,
		status: link.status,
		invitedAt: link.invited_at,
		coachName: coachById.get(link.coach_id)?.name ?? 'Unknown coach',
		coachEmail: coachById.get(link.coach_id)?.email ?? null
	}));

	// Latest coach application, if any — drives the "Become a Coach" section
	// (none/rejected show the form, pending is read-only, approved links out).
	const { data: latestCoachApplication } = await supabase
		.from('coach_applications')
		.select('id, qualification_details, status, submitted_at, review_notes, reviewed_at')
		.eq('applicant_id', profile.id)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	return {
		profile,
		preferences,
		pendingCoachInvites: coaches.filter((c) => c.status === 'pending_rider'),
		pendingParentApproval: coaches.filter((c) => c.status === 'pending_parent'),
		activeCoaches: coaches.filter((c) => c.status === 'active'),
		latestCoachApplication
	};
};

export const actions: Actions = {
	updateAccount: async ({ request, locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401, { accountError: 'Not authenticated' });

		const form = await request.formData();
		const email = form.get('email') as string;

		if (!email) return fail(400, { accountError: 'Email is required' });

		const { error } = await supabase.auth.updateUser({ email });
		if (error) return fail(500, { accountError: error.message });

		return { accountSuccess: true };
	},

	updatePassword: async ({ request, locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401, { passwordError: 'Not authenticated' });

		const form = await request.formData();
		const newPassword = form.get('newPassword') as string;

		if (!newPassword || newPassword.length < 8) {
			return fail(400, { passwordError: 'Password must be at least 8 characters' });
		}

		const { error } = await supabase.auth.updateUser({ password: newPassword });
		if (error) return fail(500, { passwordError: error.message });

		return { passwordSuccess: true };
	},

	updateNotifications: async ({ request, locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401, { notificationsError: 'Not authenticated' });

		const form = await request.formData();

		const { error } = await supabase
			.from('user_preferences')
			.update({
				show_on_leaderboard: !!form.get('show_on_leaderboard'),
				share_stats: !!form.get('share_stats')
			} as any)
			.eq('user_id', session.user.id);

		if (error) {
			// Columns may not exist yet — handle gracefully
			console.warn('updateNotifications error:', error.message);
			return fail(500, { notificationsError: error.message });
		}
		return { notificationsSuccess: true };
	},

	updatePreferences: async ({ request, locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401, { preferencesError: 'Not authenticated' });

		const form = await request.formData();

		const { error } = await supabase
			.from('user_preferences')
			.update({
				show_decimal: form.get('show_decimal') === 'true'
			})
			.eq('user_id', session.user.id);

		if (error) return fail(500, { preferencesError: error.message });
		return { preferencesSuccess: true };
	},

	updateLeaderboard: async ({ request, locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401, { leaderboardError: 'Not authenticated' });

		const form = await request.formData();
		const showOnLeaderboard = form.get('show_on_leaderboard') === 'true';
		const displayName = form.get('leaderboard_display_name') as string;

		// Validate user-provided display name before saving.
		// Null/empty falls through to the auto-generated anonymous name at display time.
		const trimmed = displayName?.trim() || null;
		if (trimmed && containsProfanity(trimmed)) {
			return fail(400, {
				leaderboardError:
					'Display name contains inappropriate content. Please choose a different name.'
			});
		}

		const finalDisplayName = trimmed;

		const { error } = await supabase
			.from('user_preferences')
			.update({
				show_on_leaderboard: showOnLeaderboard,
				leaderboard_display_name: finalDisplayName
			} as any)
			.eq('user_id', session.user.id);

		if (error) {
			console.warn('updateLeaderboard error:', error.message);
			return fail(500, { leaderboardError: error.message });
		}
		return { leaderboardSuccess: true };
	},

	deleteAccount: async ({ locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401, { deleteError: 'Not authenticated' });

		// Soft delete — mark profile as deleted
		// Requires deleted_at column on profiles table:
		// ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
		const { error } = await supabase
			.from('profiles')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', session.user.id);

		if (error) {
			// Column may not exist yet — fall back to sign out only
			console.warn('deleteAccount soft-delete error:', error.message);
		}

		await supabase.auth.signOut();
		throw redirect(303, '/');
	},

	generateDeviceToken: async ({ locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401, { deviceError: 'Not authenticated' });

		// Generate a secure device secret
		const device_secret = crypto.randomUUID() + '-' + crypto.randomUUID();

		// Create device record
		const { data: device, error } = await supabase
			.from('devices')
			.insert({
				user_id: session.user.id,
				device_name: `AppGatePro-${Date.now()}`,
				device_secret
			})
			.select('id')
			.single();

		if (error || !device) {
			return fail(500, { deviceError: 'Failed to register device' });
		}

		return {
			deviceToken: {
				device_id: device.id,
				device_secret
			}
		};
	},

	acceptCoachInvite: async ({ request, locals, url }) => {
		if (!locals.user) return fail(401, { coachError: 'Not authenticated' });

		const form = await request.formData();
		const linkId = form.get('linkId') as string;
		if (!linkId) return fail(400, { coachError: 'Missing invite' });

		const { error } = await acceptInvite(linkId, locals.user.id, url.origin);
		if (error) return fail(400, { coachError: error });

		return { coachSuccess: true };
	},

	declineCoachInvite: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { coachError: 'Not authenticated' });

		const form = await request.formData();
		const linkId = form.get('linkId') as string;
		if (!linkId) return fail(400, { coachError: 'Missing invite' });

		const { error } = await declineInvite(linkId, locals.user.id);
		if (error) return fail(400, { coachError: error });

		return { coachSuccess: true };
	},

	removeCoach: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { coachError: 'Not authenticated' });

		const form = await request.formData();
		const linkId = form.get('linkId') as string;
		if (!linkId) return fail(400, { coachError: 'Missing coach link' });

		const { error } = await revokeLinkAsRider(linkId, locals.user.id);
		if (error) return fail(400, { coachError: error });

		return { coachSuccess: true };
	},

	// Distinct coachApp* keys — the three actions above all share
	// coachError/coachSuccess, so this must not collide with them.
	applyCoach: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { coachAppError: 'Not authenticated' });

		const form = await request.formData();
		const club = (form.get('club') as string | null)?.trim() || null;
		const qualificationDetails = (form.get('qualificationDetails') as string | null)?.trim() ?? '';

		const { error } = await submitApplication(locals.user.id, qualificationDetails, club);
		if (error) return fail(400, { coachAppError: error });

		return { coachAppSuccess: true };
	}
};
