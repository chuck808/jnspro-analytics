import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/adminAuth';

export const POST: RequestHandler = async ({ request, locals: { supabase, user } }) => {
	await requireAdmin(user?.id, supabase);

	try {
		const body = await request.json();
		const { id } = body;

		const { error } = await supabase.from('help_faqs').delete().eq('id', id);

		if (error) {
			console.error('Error deleting FAQ:', error);
			return json({ error: 'Failed to delete FAQ' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
