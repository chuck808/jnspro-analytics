import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { id, status, admin_notes } = await request.json();

		// Validate required fields
		if (!id || !status) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Get user and verify they are admin
		const supabase = locals.supabase;
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { data: profile } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (profile?.role !== 'admin') {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Update feedback using admin client
		const supabaseAdmin = createSupabaseAdminClient();

		const { error } = await supabaseAdmin
			.from('feedback')
			.update({
				status,
				admin_notes,
				updated_at: new Date().toISOString()
			})
			.eq('id', id);

		if (error) {
			console.error('Error updating feedback:', error);
			return json({ error: 'Failed to update feedback' }, { status: 500 });
		}

		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Feedback update error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
