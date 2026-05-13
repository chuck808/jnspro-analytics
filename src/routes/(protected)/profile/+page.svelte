<script lang="ts">
    import type { PageData, ActionData } from './$types';
    import { getUCICategory, calculateAge } from '$lib/utils/uciCategories';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    type Tyre = typeof data.tyres[number];

    // Group tyres by brand
    let tyresByBrand = $derived(() => {
        const grouped: Record<string, Tyre[]> = {};
        for (const tyre of data.tyres) {
            if (!grouped[tyre.brand]) grouped[tyre.brand] = [];
            grouped[tyre.brand].push(tyre);
        }
        return grouped;
    });

    // UCI category from DOB
    let uciCategory = $derived(() => getUCICategory(data.riderProfile?.date_of_birth));
    let riderAge    = $derived(() => calculateAge(data.riderProfile?.date_of_birth));

    // Live gear ratio
    let chainring  = $state(44);
    let sprocket   = $state(16);
    
    // Sync with data.bike when it changes
    $effect(() => {
        chainring = data.bike?.chainring_teeth ?? 44;
        sprocket = data.bike?.sprocket_teeth ?? 16;
    });
    
    let gearRatio  = $derived((chainring / sprocket).toFixed(2));

    // Profile completeness
    let completeness = $derived(() => {
        let score = 0;
        if (data.riderProfile?.weight_kg)    score += 20;
        if (data.riderProfile?.height_cm)    score += 15;
        if (data.riderProfile?.date_of_birth) score += 15;
        if (data.riderProfile?.rider_level)  score += 10;
        if (data.bike?.crank_length_mm) score += 20;
        if (data.bike?.rear_tire_id || data.bike?.custom_wheel_diameter_inches) score += 20;
        return score;
    });

    let completenessLabel = $derived(() => {
        const c = completeness();
        if (c >= 80) return { text: 'Complete', color: 'text-[#3de8c8]', bar: 'bg-[#3de8c8]' };
        if (c >= 50) return { text: 'Partial',  color: 'text-[#f5a623]', bar: 'bg-[#f5a623]' };
        return { text: 'Incomplete', color: 'text-[#ff4444]', bar: 'bg-[#ff4444]' };
    });

    // Form loading states
    let identitySaving = $state(false);
    let profileSaving  = $state(false);
    let bikeSaving     = $state(false);
    let prefsSaving    = $state(false);

    // Section helpers
    function successFor(key: string) {
        return (form as any)?.[key] === true;
    }
    function errorFor(key: string) {
        return (form as any)?.[key] as string | undefined;
    }

    // Countries list (abbreviated — common BMX nations first)
    const countries = [
        { code: 'GBR', name: 'Great Britain' },
        { code: 'USA', name: 'United States' },
        { code: 'AUS', name: 'Australia' },
        { code: 'NED', name: 'Netherlands' },
        { code: 'FRA', name: 'France' },
        { code: 'GER', name: 'Germany' },
        { code: 'BEL', name: 'Belgium' },
        { code: 'CAN', name: 'Canada' },
        { code: 'NZL', name: 'New Zealand' },
        { code: 'RSA', name: 'South Africa' },
        { code: 'COL', name: 'Colombia' },
        { code: 'ARG', name: 'Argentina' },
        { code: 'JPN', name: 'Japan' },
        { code: 'OTHER', name: 'Other' },
    ];
</script>

<svelte:head>
    <title>Rider Profile — AppGatePro</title>
</svelte:head>

<div class="space-y-6">

    <!-- Completeness banner -->
    <div class="themed-card rounded-xl p-5">
        <div class="flex items-start justify-between gap-4 mb-3">
            <div>
                <h2 class="text-base font-semibold themed-text-primary">Profile Completeness</h2>
                <p class="text-xs themed-text-secondary mt-0.5">
                    A complete profile unlocks power estimation and biomechanical analytics
                </p>
            </div>
            <div class="text-right flex-shrink-0">
                <span class="text-2xl font-bold {completenessLabel().color}">{completeness()}%</span>
                <p class="text-xs {completenessLabel().color}">{completenessLabel().text}</p>
            </div>
        </div>
        <div class="w-full bg-[#221c18] rounded-full h-2">
            <div class="h-2 rounded-full transition-all duration-500 {completenessLabel().bar}"
                 style="width: {completeness()}%"></div>
        </div>
        {#if completeness() < 80}
            <div class="mt-3 flex flex-wrap gap-2 text-xs text-[#4a4038]">
                {#if !data.riderProfile?.weight_kg}
                    <span class="px-2 py-1 bg-[#221c18] rounded">+ Weight</span>
                {/if}
                {#if !data.riderProfile?.height_cm}
                    <span class="px-2 py-1 bg-[#221c18] rounded">+ Height</span>
                {/if}
                {#if !data.riderProfile?.date_of_birth}
                    <span class="px-2 py-1 bg-[#221c18] rounded">+ Date of birth</span>
                {/if}
                {#if !data.bike?.crank_length_mm}
                    <span class="px-2 py-1 bg-[#221c18] rounded">+ Crank length</span>
                {/if}
                {#if !data.bike?.rear_tire_id && !data.bike?.custom_wheel_diameter_inches}
                    <span class="px-2 py-1 bg-[#221c18] rounded">+ Rear tyre</span>
                {/if}
            </div>
        {/if}
    </div>

    <!-- UCI category display (if DOB set) -->
    {#if uciCategory()}
        {@const cat = uciCategory()!}
        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-4 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                 style="background: {cat.color}20; border: 1px solid {cat.color}40">
                <span class="text-xs font-bold" style="color: {cat.color}">{cat.shortName}</span>
            </div>
            <div>
                <p class="text-sm font-semibold text-[#f0ece4]">{cat.name}</p>
                <p class="text-xs text-[#9a8f7a]">
                    UCI category · Age {cat.ageRange}
                    {#if riderAge()}· Current age: {riderAge()}{/if}
                </p>
            </div>
            <p class="ml-auto text-xs text-[#4a4038]">Calculated from date of birth</p>
        </div>
    {/if}

    <!-- Grid layout: two columns on large screens -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <!-- LEFT COLUMN -->
        <div class="space-y-6">

            <!-- Identity -->
            <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
                <h3 class="text-base font-semibold text-[#f0ece4] mb-1">Identity</h3>
                <p class="text-xs text-[#9a8f7a] mb-5">
                    Your name and public display details
                </p>

                {#if successFor('identitySuccess')}
                    <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                        Identity saved
                    </div>
                {/if}
                {#if errorFor('identityError')}
                    <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                        {errorFor('identityError')}
                    </div>
                {/if}

                <form method="POST" action="?/saveIdentity"
                      onsubmit={() => identitySaving = true}
                      class="space-y-4">

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="sm:col-span-2">
                            <label for="name" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Full name
                            </label>
                            <input id="name" name="name" type="text" required
                                   value={data.profile?.name ?? ''}
                                   class="input-field w-full" placeholder="Jamie Norris-Still" />
                        </div>

                        <div class="sm:col-span-2">
                            <label for="display_name" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Display name
                                <span class="text-[#4a4038] font-normal ml-1">— shown on leaderboard (defaults to first name)</span>
                            </label>
                            <input id="display_name" name="display_name" type="text"
                                   value={data.profile?.display_name ?? ''}
                                   class="input-field w-full" placeholder="Jamie N-S" />
                        </div>

                        <div>
                            <label for="country" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Country
                            </label>
                            <select id="country" name="country" class="input-field w-full">
                                <option value="">Select...</option>
                                {#each countries as c}
                                    <option value={c.code} selected={data.profile?.country === c.code}>
                                        {c.name}
                                    </option>
                                {/each}
                            </select>
                        </div>

                        <div>
                            <label for="club" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Club
                            </label>
                            <input id="club" name="club" type="text"
                                   value={data.profile?.club ?? ''}
                                   class="input-field w-full" placeholder="e.g. Mid Lancs BMX" />
                        </div>

                        <div class="sm:col-span-2">
                            <label for="team" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Team <span class="text-[#4a4038] font-normal">(optional)</span>
                            </label>
                            <input id="team" name="team" type="text"
                                   value={data.profile?.team ?? ''}
                                   class="input-field w-full" placeholder="e.g. TeamGB Development" />
                        </div>
                    </div>

                    <button type="submit" disabled={identitySaving} class="btn-primary">
                        {identitySaving ? 'Saving...' : 'Save identity'}
                    </button>
                </form>
            </div>

            <!-- Biometrics -->
            <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
                <h3 class="text-base font-semibold text-[#f0ece4] mb-1">Biometrics</h3>
                <p class="text-xs text-[#9a8f7a] mb-5">
                    Each save creates a versioned snapshot — historical sessions retain the
                    biometrics that were active at the time
                </p>

                {#if successFor('profileSuccess')}
                    <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                        Biometrics saved
                    </div>
                {/if}
                {#if errorFor('profileError')}
                    <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                        {errorFor('profileError')}
                    </div>
                {/if}

                <form method="POST" action="?/saveProfile"
                      onsubmit={() => profileSaving = true}
                      class="space-y-4">

                    <div class="grid grid-cols-2 gap-4">

                        <div>
                            <label for="date_of_birth" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Date of birth
                                <span class="text-[#4a4038] font-normal ml-1">— UCI category</span>
                            </label>
                            <input id="date_of_birth" name="date_of_birth" type="date"
                                   value={data.riderProfile?.date_of_birth ?? ''}
                                   class="input-field w-full" />
                        </div>

                        <div>
                            <label for="sex" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Sex
                            </label>
                            <select id="sex" name="sex" class="input-field w-full">
                                <option value="">Select...</option>
                                <option value="male"              selected={data.riderProfile?.sex === 'male'}>Male</option>
                                <option value="female"            selected={data.riderProfile?.sex === 'female'}>Female</option>
                                <option value="prefer_not_to_say" selected={data.riderProfile?.sex === 'prefer_not_to_say'}>
                                    Prefer not to say
                                </option>
                            </select>
                        </div>

                        <div>
                            <label for="height_cm" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Height <span class="text-[#4a4038]">(cm)</span>
                            </label>
                            <input id="height_cm" name="height_cm" type="number"
                                   min="50" max="250" step="0.1"
                                   value={data.riderProfile?.height_cm ?? ''}
                                   class="input-field w-full" placeholder="175" />
                        </div>

                        <div>
                            <label for="weight_kg" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Weight <span class="text-[#4a4038]">(kg)</span>
                                <span class="text-[#4a4038] font-normal ml-1">— power analytics</span>
                            </label>
                            <input id="weight_kg" name="weight_kg" type="number"
                                   min="20" max="200" step="0.1"
                                   value={data.riderProfile?.weight_kg ?? ''}
                                   class="input-field w-full" placeholder="72" />
                        </div>

                        <div class="col-span-2">
                            <label for="rider_level" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Rider level
                                <span class="text-[#4a4038] font-normal ml-1">— sets default analytics depth</span>
                            </label>
                            <select id="rider_level" name="rider_level" class="input-field w-full">
                                <option value="" disabled selected={!data.riderProfile?.rider_level}>Select level...</option>
                                {#each [
                                    { value: 'novice',       label: 'Novice — just getting started' },
                                    { value: 'intermediate', label: 'Intermediate — club level' },
                                    { value: 'expert',       label: 'Expert — regional / national' },
                                    { value: 'elite',        label: 'Elite — national team / professional' }
                                ] as level}
                                    <option value={level.value}
                                            selected={data.riderProfile?.rider_level === level.value}>
                                        {level.label}
                                    </option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <button type="submit" disabled={profileSaving} class="btn-primary">
                        {profileSaving ? 'Saving...' : 'Save biometrics'}
                    </button>
                </form>
            </div>

        </div>

        <!-- RIGHT COLUMN -->
        <div class="space-y-6">

            <!-- Bike setup -->
            <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
                <h3 class="text-base font-semibold text-[#f0ece4] mb-1">Bike Setup</h3>
                <p class="text-xs text-[#9a8f7a] mb-5">
                    Gear ratio and tyre diameter used for speed calculations.
                    Crank length and bike weight used for power estimation.
                </p>

                {#if successFor('bikeSuccess')}
                    <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                        Bike setup saved
                    </div>
                {/if}
                {#if errorFor('bikeError')}
                    <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                        {errorFor('bikeError')}
                    </div>
                {/if}

                <form method="POST" action="?/saveBike"
                      onsubmit={() => bikeSaving = true}
                      class="space-y-4">

                    {#if data.bike?.id}
                        <input type="hidden" name="bike_id" value={data.bike.id} />
                    {/if}

                    <div class="grid grid-cols-2 gap-4">

                        <div class="col-span-2">
                            <label for="bike_name" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Bike name
                            </label>
                            <input id="bike_name" name="name" type="text" required
                                   value={data.bike?.name ?? ''}
                                   class="input-field w-full" placeholder="Race Bike 2024" />
                        </div>

                        <div>
                            <label for="bike_weight_kg" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Bike weight <span class="text-[#4a4038]">(kg)</span>
                            </label>
                            <input id="bike_weight_kg" name="weight_kg" type="number"
                                   min="1" max="30" step="0.1"
                                   value={data.bike?.weight_kg ?? ''}
                                   class="input-field w-full" placeholder="8.5" />
                        </div>

                        <div>
                            <label for="crank_length_mm" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Crank length <span class="text-[#4a4038]">(mm)</span>
                            </label>
                            <input id="crank_length_mm" name="crank_length_mm" type="number"
                                   min="100" max="200"
                                   value={data.bike?.crank_length_mm ?? ''}
                                   class="input-field w-full" placeholder="165" />
                        </div>

                        <div>
                            <label for="chainring_teeth" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Chainring <span class="text-[#4a4038]">(teeth)</span>
                            </label>
                            <input id="chainring_teeth" name="chainring_teeth" type="number"
                                   min="20" max="60" required
                                   bind:value={chainring}
                                   class="input-field w-full" placeholder="44" />
                        </div>

                        <div>
                            <label for="sprocket_teeth" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                                Sprocket <span class="text-[#4a4038]">(teeth)</span>
                            </label>
                            <input id="sprocket_teeth" name="sprocket_teeth" type="number"
                                   min="8" max="30" required
                                   bind:value={sprocket}
                                   class="input-field w-full" placeholder="16" />
                        </div>
                    </div>

                    <!-- Live gear ratio -->
                    <div class="flex items-center gap-3 px-4 py-3 bg-[#0a0809] border border-[#221c18] rounded-lg">
                        <svg class="w-4 h-4 text-[#f5a623] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span class="text-xs text-[#9a8f7a]">Gear ratio</span>
                        <span class="text-sm font-bold text-[#f5a623]">{gearRatio} : 1</span>
                        <span class="text-xs text-[#4a4038] ml-auto">{chainring}T / {sprocket}T</span>
                    </div>

                    <!-- Tyre selection -->
                    <div class="pt-3 border-t border-[#221c18] space-y-3">
                        <p class="text-xs font-medium text-[#9a8f7a]">
                            Tyre selection
                            <span class="text-[#4a4038] font-normal ml-1">— measured diameters for speed accuracy</span>
                        </p>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label for="front_tire_id" class="block text-xs text-[#4a4038] mb-1">Front</label>
                                <select id="front_tire_id" name="front_tire_id" class="input-field w-full text-xs">
                                    <option value="">Select tyre...</option>
                                    {#each Object.entries(tyresByBrand()) as [brand, tyres]}
                                        <optgroup label={brand}>
                                            {#each tyres as tyre}
                                                <option value={tyre.id}
                                                        selected={data.bike?.front_tire_id === tyre.id}>
                                                    {tyre.model} {tyre.size} ({tyre.diameter_inches}")
                                                </option>
                                            {/each}
                                        </optgroup>
                                    {/each}
                                </select>
                            </div>

                            <div>
                                <label for="rear_tire_id" class="block text-xs text-[#4a4038] mb-1">Rear</label>
                                <select id="rear_tire_id" name="rear_tire_id" class="input-field w-full text-xs">
                                    <option value="">Select tyre...</option>
                                    {#each Object.entries(tyresByBrand()) as [brand, tyres]}
                                        <optgroup label={brand}>
                                            {#each tyres as tyre}
                                                <option value={tyre.id}
                                                        selected={data.bike?.rear_tire_id === tyre.id}>
                                                    {tyre.model} {tyre.size} ({tyre.diameter_inches}")
                                                </option>
                                            {/each}
                                        </optgroup>
                                    {/each}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label for="custom_wheel_diameter" class="block text-xs text-[#4a4038] mb-1">
                                Custom wheel diameter (inches) — if your tyre isn't listed
                            </label>
                            <input id="custom_wheel_diameter" name="custom_wheel_diameter"
                                   type="number" min="10" max="30" step="0.001"
                                   value={data.bike?.custom_wheel_diameter_inches ?? ''}
                                   class="input-field w-full sm:w-40" placeholder="e.g. 19.96" />
                        </div>
                    </div>

                    <div>
                        <label for="notes" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                            Notes <span class="text-[#4a4038] font-normal">(optional)</span>
                        </label>
                        <textarea id="notes" name="notes" rows="2"
                                  class="input-field w-full resize-none"
                                  placeholder="Tyre pressures, setup notes..."
                        >{data.bike?.notes ?? ''}</textarea>
                    </div>

                    <button type="submit" disabled={bikeSaving} class="btn-primary">
                        {bikeSaving ? 'Saving...' : 'Save bike setup'}
                    </button>
                </form>
            </div>

            <!-- Privacy & leaderboard preferences -->
            <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
                <h3 class="text-base font-semibold text-[#f0ece4] mb-1">Privacy & Sharing</h3>
                <p class="text-xs text-[#9a8f7a] mb-5">
                    Control what's visible publicly. Leaderboard features are coming soon.
                </p>

                {#if successFor('prefsSuccess')}
                    <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                        Preferences saved
                    </div>
                {/if}

                <form method="POST" action="?/savePrefs"
                      onsubmit={() => prefsSaving = true}
                      class="space-y-4">

                    <!-- Units -->
                    <fieldset>
                        <legend class="block text-xs font-medium text-[#9a8f7a] mb-2">
                            Measurement units
                        </legend>
                        <div class="flex gap-3">
                            {#each [{ value: 'metric', label: 'Metric (km/h, kg, cm)' },
                                    { value: 'imperial', label: 'Imperial (mph, lbs, ft)' }] as unit}
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="measurement_unit" value={unit.value}
                                           checked={data.prefs?.measurement_unit === unit.value}
                                           class="accent-[#f5a623]" />
                                    <span class="text-sm text-[#f0ece4]">{unit.label}</span>
                                </label>
                            {/each}
                        </div>
                    </fieldset>

                    <!-- Leaderboard opt-in -->
                    <div class="flex items-start gap-3 p-4 bg-[#0a0809] border border-[#221c18] rounded-lg">
                        <input type="checkbox" id="show_on_leaderboard"
                               name="show_on_leaderboard" value="true"
                               checked={data.prefs?.show_on_leaderboard}
                               class="mt-0.5 accent-[#f5a623]" />
                        <div>
                            <label for="show_on_leaderboard" class="text-sm font-medium text-[#f0ece4] cursor-pointer">
                                Show on leaderboard
                            </label>
                            <p class="text-xs text-[#4a4038] mt-0.5">
                                Your display name and best performances visible to other riders.
                                Leaderboard coming soon — opt in early to be ready.
                            </p>
                        </div>
                    </div>

                    <!-- Share stats -->
                    <div class="flex items-start gap-3 p-4 bg-[#0a0809] border border-[#221c18] rounded-lg">
                        <input type="checkbox" id="share_stats"
                               name="share_stats" value="true"
                               checked={data.prefs?.share_stats}
                               class="mt-0.5 accent-[#f5a623]" />
                        <div>
                            <label for="share_stats" class="text-sm font-medium text-[#f0ece4] cursor-pointer">
                                Share anonymised stats
                            </label>
                            <p class="text-xs text-[#4a4038] mt-0.5">
                                Contribute anonymised performance data to help improve
                                benchmark values for all riders.
                            </p>
                        </div>
                    </div>

                    <button type="submit" disabled={prefsSaving} class="btn-primary">
                        {prefsSaving ? 'Saving...' : 'Save preferences'}
                    </button>
                </form>
            </div>

        </div>
    </div>

    <!-- Summary strip -->
    {#if data.riderProfile || data.bike}
        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
            <p class="text-xs font-semibold text-[#4a4038] uppercase tracking-wider mb-4">Current Setup Summary</p>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
                {#each [
                    { label: 'Height',     value: data.riderProfile?.height_cm    ? `${data.riderProfile.height_cm} cm`  : '—' },
                    { label: 'Weight',     value: data.riderProfile?.weight_kg    ? `${data.riderProfile.weight_kg} kg`  : '—' },
                    { label: 'UCI Cat.',   value: uciCategory()?.shortName   ?? '—' },
                    { label: 'Crank',      value: data.bike?.crank_length_mm ? `${data.bike.crank_length_mm}mm` : '—' },
                    { label: 'Gear Ratio', value: data.bike ? `${(data.bike.chainring_teeth / data.bike.sprocket_teeth).toFixed(2)}:1` : '—' },
                    { label: 'Rear Tyre',  value: (data.bike as any)?.rear_tire?.size ?? (data.bike?.custom_wheel_diameter_inches ? `${data.bike.custom_wheel_diameter_inches}"` : '—') },
                ] as stat}
                    <div>
                        <p class="text-xs text-[#4a4038] mb-1">{stat.label}</p>
                        <p class="text-base font-bold text-[#f5a623]">{stat.value}</p>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

</div>

<style>
    :global(.input-field) {
        padding: 0.625rem 1rem;
        background: #0a0809;
        border: 1px solid #221c18;
        border-radius: 0.5rem;
        color: #f0ece4;
        font-size: 0.875rem;
        transition: border-color 0.15s, box-shadow 0.15s;
    }

    :global(.input-field:focus) {
        outline: none;
        border-color: #f5a623;
        box-shadow: 0 0 0 1px #f5a623;
    }

    :global(.input-field::placeholder) {
        color: #4a4038;
    }

    :global(.btn-primary) {
        padding: 0.625rem 1.25rem;
        background: #f5a623;
        color: #0a0809;
        font-weight: 600;
        font-size: 0.875rem;
        border-radius: 0.5rem;
        border: none;
        cursor: pointer;
        transition: background-color 0.15s;
    }

    :global(.btn-primary:hover) {
        background: #c97e0a;
    }

    :global(.btn-primary:disabled) {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
