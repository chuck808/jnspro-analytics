import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/adminAuth';

export const POST: RequestHandler = async ({ request, locals: { supabase, user } }) => {
	await requireAdmin(user?.id, supabase);

	try {
		const body = await request.json();
		const { question, answer, category, display_order, is_published } = body;

		const { data, error } = await supabase
			.from('help_faqs')
			.insert({
				question,
				answer,
				category,
				display_order: display_order || 0,
				is_published: is_published ?? true,
				created_by: user!.id,
				updated_by: user!.id
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating FAQ:', error);
			return json({ error: 'Failed to create FAQ' }, { status: 500 });
		}

		return json({ success: true, data });
	} catch (error) {
		console.error('Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
