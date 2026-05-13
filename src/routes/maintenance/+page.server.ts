import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const supabase = locals.supabase;

    // Get current active maintenance
    const { data: maintenance } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('is_active', true)
        .lte('start_time', new Date().toISOString())
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

    return {
        maintenance
    };
};
