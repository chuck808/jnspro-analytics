import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const body = await request.json();
	const { linkId, report } = body ?? {};

	if (!linkId || !report?.type) {
		throw error(400, 'Missing linkId or report');
	}

	// report_shares RLS already enforces this on insert, but checking here
	// first gives a clearer error than a generic RLS-denied failure.
	const { data: link } = await locals.supabase
		.from('coach_rider_links')
		.select('id')
		.eq('id', linkId)
		.eq('rider_id', locals.user.id)
		.eq('status', 'active')
		.maybeSingle();

	if (!link) throw error(403, 'Not an active coach link');

	const { error: insertError } = await locals.supabase.from('report_shares').insert({
		link_id: linkId,
		sender_id: locals.user.id,
		report,
		report_type: report.type
	});

	if (insertError) throw error(500, 'Failed to share report');

	return json({ success: true });
};
