import type { PageServerLoad } from './$types';
import { requireAdminFromProfile } from '$lib/server/adminAuth';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
	const { profile } = await parent();
	requireAdminFromProfile(profile);

	// Fetch all FAQs (including unpublished) for admin
	const { data: faqs, error } = await supabase
		.from('help_faqs')
		.select('*')
		.order('category')
		.order('display_order');

	if (error) {
		console.error('Error loading FAQs:', error);
		return { faqs: [] };
	}

	return {
		faqs: faqs || []
	};
};
