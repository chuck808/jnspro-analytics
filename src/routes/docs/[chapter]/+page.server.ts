import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { slugs } from '$lib/docs/contents';

export const load: PageServerLoad = async ({ params }) => {
	if (!slugs.includes(params.chapter)) {
		throw error(404, `Documentation chapter "${params.chapter}" not found`);
	}
	return { chapter: params.chapter };
};
