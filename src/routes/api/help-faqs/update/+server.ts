import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'admin') {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

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
                updated_by: session.user.id
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
