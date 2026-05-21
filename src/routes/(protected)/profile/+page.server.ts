import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
    const { profile } = await parent();
    if (!profile) return { profile: null, riderProfile: null, bike: null, tyres: [], prefs: null };

    // Latest rider profile snapshot (biometric data)
    const { data: riderProfile } = await supabase
        .from('rider_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Active bike with tyre details
    const { data: bike } = await supabase
        .from('bikes')
        .select(`
            *,
            front_tire:tire_library!bikes_front_tire_id_fkey(id, brand, model, size, diameter_inches),
            rear_tire:tire_library!bikes_rear_tire_id_fkey(id, brand, model, size, diameter_inches)
        `)
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .maybeSingle();

    // Tyre library
    const { data: tyres } = await supabase
        .from('tire_library')
        .select('id, brand, model, size, diameter_inches')
        .order('brand')
        .order('model')
        .order('size');

    // User preferences
    const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

    return { profile, riderProfile, bike, tyres: tyres ?? [], prefs };
};

export const actions: Actions = {

    // Save identity fields (name, display_name, country, club, team)
    saveIdentity: async ({ request, locals: { supabase } }) => {
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
        if (claimsError || !claimsData?.claims) return fail(401, { error: 'Not authenticated' });

        const form = await request.formData();

        const { error } = await supabase
            .from('profiles')
            .update({
                name:         form.get('name') as string,
                display_name: (form.get('display_name') as string) || null,
                country:      (form.get('country') as string) || null,
                club:         (form.get('club') as string) || null,
                team:         (form.get('team') as string) || null,
            })
            .eq('id', claimsData.claims.sub);

        if (error) return fail(500, { identityError: error.message });
        return { identitySuccess: true };
    },

    // Save biometrics snapshot
    saveProfile: async ({ request, locals: { supabase } }) => {
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
        if (claimsError || !claimsData?.claims) return fail(401, { error: 'Not authenticated' });

        const form = await request.formData();
        const height_cm    = form.get('height_cm')    ? parseFloat(form.get('height_cm') as string)    : null;
        const weight_kg    = form.get('weight_kg')    ? parseFloat(form.get('weight_kg') as string)    : null;
        const rider_level  = (form.get('rider_level') as string) || null;
        const date_of_birth = (form.get('date_of_birth') as string) || null;
        const sex          = (form.get('sex') as string) || null;

        const years_racing  = form.get('years_racing')  ? parseInt(form.get('years_racing') as string)   : null;
        const dominant_leg  = (form.get('dominant_leg') as string) || null;

        const { error } = await supabase
            .from('rider_profiles')
            .insert({
                user_id:        claimsData.claims.sub,
                height_cm,
                weight_kg,
                rider_level:    rider_level as 'novice' | 'intermediate' | 'expert' | 'elite' | null,
                date_of_birth,
                sex:            sex as 'male' | 'female' | 'prefer_not_to_say' | null,
                years_racing:   years_racing,
                dominant_leg:   dominant_leg as 'left' | 'right' | 'prefer_not_to_say' | null,
                effective_from: new Date().toISOString()
            });

        if (error) return fail(500, { profileError: error.message });
        return { profileSuccess: true };
    },

    // Save bike setup
    saveBike: async ({ request, locals: { supabase } }) => {
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
        if (claimsError || !claimsData?.claims) return fail(401, { error: 'Not authenticated' });

        const userId = claimsData.claims.sub;
        const form = await request.formData();
        const name             = form.get('name') as string;
        const weight_kg        = form.get('weight_kg')        ? parseFloat(form.get('weight_kg') as string)        : null;
        const crank_length_mm  = form.get('crank_length_mm')  ? parseInt(form.get('crank_length_mm') as string)    : null;
        const chainring_teeth  = parseInt(form.get('chainring_teeth') as string);
        const sprocket_teeth   = parseInt(form.get('sprocket_teeth') as string);
        const front_tire_id    = form.get('front_tire_id')    ? parseInt(form.get('front_tire_id') as string)      : null;
        const rear_tire_id     = form.get('rear_tire_id')     ? parseInt(form.get('rear_tire_id') as string)       : null;
        const custom_wheel_diameter = form.get('custom_wheel_diameter')
            ? parseFloat(form.get('custom_wheel_diameter') as string) : null;
        const notes  = (form.get('notes') as string) || null;
        const bikeId = form.get('bike_id') ? parseInt(form.get('bike_id') as string) : null;

        if (!name || !chainring_teeth || !sprocket_teeth) {
            return fail(400, { bikeError: 'Name, chainring and sprocket teeth are required' });
        }

        if (bikeId) {
            const { error } = await supabase
                .from('bikes')
                .update({
                    name, weight_kg, crank_length_mm,
                    chainring_teeth, sprocket_teeth,
                    front_tire_id, rear_tire_id,
                    custom_wheel_diameter_inches: custom_wheel_diameter,
                    notes
                })
                .eq('id', bikeId)
                .eq('user_id', userId);

            if (error) return fail(500, { bikeError: error.message });
        } else {
            await supabase
                .from('bikes')
                .update({ is_active: false })
                .eq('user_id', userId)
                .eq('is_active', true);

            const { error } = await supabase
                .from('bikes')
                .insert({
                    user_id: userId,
                    name, weight_kg, crank_length_mm,
                    chainring_teeth, sprocket_teeth,
                    front_tire_id, rear_tire_id,
                    custom_wheel_diameter_inches: custom_wheel_diameter,
                    notes,
                    is_active: true
                });

            if (error) return fail(500, { bikeError: error.message });
        }

        return { bikeSuccess: true };
    },

    // Save research consent and participation type
    saveResearch: async ({ request, locals: { supabase } }) => {
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
        if (claimsError || !claimsData?.claims) return fail(401, { error: 'Not authenticated' });

        const form = await request.formData();
        const research_consent    = form.get('research_consent') === 'true';
        const participation_type  = (form.get('participation_type') as string) || null;
        const races_competitively = form.get('races_competitively') === 'true';

        // Only set consent timestamp when toggling ON; clear it when withdrawing
        const research_consent_at = research_consent ? new Date().toISOString() : null;

        const { error } = await supabase
            .from('profiles')
            .update({
                participation_type,
                races_competitively,
                research_consent,
                research_consent_at,
            } as any)
            .eq('id', claimsData.claims.sub);

        if (error) return fail(500, { researchError: error.message });
        return { researchSuccess: true };
    },

    // Save preferences
    savePrefs: async ({ request, locals: { supabase } }) => {
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
        if (claimsError || !claimsData?.claims) return fail(401, { error: 'Not authenticated' });

        const form = await request.formData();

        const { error } = await supabase
            .from('user_preferences')
            .update({
                measurement_unit:    (form.get('measurement_unit') as string) || 'metric',
                show_on_leaderboard: form.get('show_on_leaderboard') === 'true',
                share_stats:         form.get('share_stats') === 'true',
            })
            .eq('user_id', claimsData.claims.sub);

        if (error) return fail(500, { prefsError: error.message });
        return { prefsSuccess: true };
    }
};