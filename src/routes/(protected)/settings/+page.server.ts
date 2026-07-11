import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { containsProfanity } from '$lib/utils/profanityFilter';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
	const { profile } = await parent();
	if (!profile) return { profile: null, preferences: null };

	const { data: preferences } = await supabase
		.from('user_preferences')
		.select('*')
		.eq('user_id', profile.id)
		.maybeSingle();

	return { profile, preferences };
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
	}
};
