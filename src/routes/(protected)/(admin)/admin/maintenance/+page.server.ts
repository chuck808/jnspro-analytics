import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends, parent }) => {
    depends('admin:maintenance');
    
    const { profile } = await parent();
    if (profile?.role !== 'admin') {
        throw error(403, 'Access denied. Admin privileges required.');
    }

    // @ts-ignore - maintenance_schedules table types will be available after running migration
    const { data: schedules } = await locals.supabase
        .from('maintenance_schedules')
        .select('*')
        .order('start_time', { ascending: false });

    return {
        schedules: schedules as any[] || []
    };
};
