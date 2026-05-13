import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        throw redirect(303, '/auth/sign-in');
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'admin') {
        throw redirect(303, '/dashboard');
    }

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
