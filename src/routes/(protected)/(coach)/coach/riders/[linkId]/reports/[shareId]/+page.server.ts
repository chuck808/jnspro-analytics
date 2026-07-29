import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { GeneratedReport } from '$lib/report-engine/types';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	const { profile } = await parent();
	const coachId = profile!.id;

	// Confirm this link belongs to this coach before showing anything —
	// report_shares RLS already enforces this, but a 404 for the wrong
	// coach/link pairing is more useful than a raw 500 from a failed join.
	const { data: link } = await locals.supabase
		.from('coach_rider_links')
		.select('id')
		.eq('id', params.linkId)
		.eq('coach_id', coachId)
		.maybeSingle();

	if (!link) throw error(404, 'Not found');

	const { data: share } = await locals.supabase
		.from('report_shares')
		.select('id, report, report_type, created_at')
		.eq('id', params.shareId)
		.eq('link_id', params.linkId)
		.maybeSingle();

	if (!share) throw error(404, 'Report not found');

	return {
		linkId: params.linkId,
		report: share.report as unknown as GeneratedReport,
		sharedAt: share.created_at
	};
};
