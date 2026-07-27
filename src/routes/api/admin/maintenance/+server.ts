import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/adminAuth';

export const POST: RequestHandler = async ({ request, locals }) => {
	await requireAdmin(locals.user?.id, locals.supabase);

	const body = await request.json();
	const { title, description, start_time, end_time } = body;

	const { data, error: dbError } = await locals.supabase
		.from('maintenance_schedules')
		.insert({
			title,
			description,
			start_time,
			end_time,
			created_by: locals.user?.id
		})
		.select()
		.single();

	if (dbError) {
		throw error(500, dbError.message);
	}

	return json(data);
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	await requireAdmin(locals.user?.id, locals.supabase);

	const body = await request.json();
	const { id, is_active } = body;

	const { data, error: dbError } = await locals.supabase
		.from('maintenance_schedules')
		.update({ is_active })
		.eq('id', id)
		.select()
		.single();

	if (dbError) {
		throw error(500, dbError.message);
	}

	return json(data);
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	await requireAdmin(locals.user?.id, locals.supabase);

	const body = await request.json();
	const { id } = body;

	const { error: dbError } = await locals.supabase
		.from('maintenance_schedules')
		.delete()
		.eq('id', id);

	if (dbError) {
		throw error(500, dbError.message);
	}

	return json({ success: true });
};
