import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, parent }) => {
	// Get user from parent layout
	await parent();

	const supabase = locals.supabase;
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	// Check if user is admin (this is already checked in admin layout, but double-check)
	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	if (profile?.role !== 'admin') {
		throw error(403, 'Access denied. Admin privileges required.');
	}

	// Use admin client to fetch feedback (bypasses RLS for cleaner queries)
	const supabaseAdmin = createSupabaseAdminClient();

	// Fetch all feedback with user information
	const { data: feedback, error: feedbackError } = await supabaseAdmin
		.from('feedback')
		.select('*')
		.order('created_at', { ascending: false });

	// Manually fetch and merge profile data for each feedback
	if (feedback && feedback.length > 0) {
		const userIds = [...new Set(feedback.filter((f: any) => f.user_id).map((f: any) => f.user_id))];

		if (userIds.length > 0) {
			const { data: profiles } = await supabaseAdmin
				.from('profiles')
				.select('id, name, email')
				.in('id', userIds);

			// Create a map for quick lookup
			const profileMap = new Map(
				profiles?.map((p: any) => [p.id, { full_name: p.name, email: p.email }]) || []
			);

			// Merge profile data into feedback
			feedback.forEach((item: any) => {
				if (item.user_id && profileMap.has(item.user_id)) {
					item.profiles = profileMap.get(item.user_id);
				}
			});
		}
	}

	if (feedbackError) {
		console.error('Error fetching feedback:', feedbackError);
		throw error(500, 'Failed to load feedback');
	}

	return {
		feedback: feedback || []
	};
};
