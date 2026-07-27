import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/adminAuth';

export const POST: RequestHandler = async ({ request, locals: { supabase, user } }) => {
	await requireAdmin(user?.id, supabase);

	try {
		const body = await request.json();
		const { id, question, answer, category, display_order, is_published } = body;

		const { data, error } = await supabase
			.from('help_faqs')
			.update({
				question,
				answer,
				category,
				display_order,
				is_published,
				updated_by: user!.id
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error updating FAQ:', error);
			return json({ error: 'Failed to update FAQ' }, { status: 500 });
		}

		return json({ success: true, data });
	} catch (error) {
		console.error('Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
