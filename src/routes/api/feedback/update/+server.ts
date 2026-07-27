import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { requireAdmin } from '$lib/server/adminAuth';

export const POST: RequestHandler = async ({ request, locals }) => {
	await requireAdmin(locals.user?.id, locals.supabase);

	try {
		const { id, status, admin_notes } = await request.json();

		// Validate required fields
		if (!id || !status) {
			return json({ error: 'Missing required fields' }, { status: 400 });
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
