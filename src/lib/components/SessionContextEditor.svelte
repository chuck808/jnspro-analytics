<script lang="ts">
    import { 
        WEATHER_OPTIONS, 
        SURFACE_OPTIONS, 
        FOCUS_OPTIONS,
        RIDE_FEEL_OPTIONS,
        type WeatherCondition,
        type TrackSurface,
        type SessionFocus,
        type RideFeel,
        getWeatherMeta,
        getSurfaceMeta,
        getFocusMeta,
        getRideFeelMeta
    } from '$lib/types/sessionContext';

    interface Props {
        sessionId: string;
        initialWeather?: WeatherCondition | null;
        initialSurface?: TrackSurface | null;
        initialFocus?: SessionFocus | null;
        initialFeel?: RideFeel | null;
    }

    let { 
        sessionId,
        initialWeather = null,
        initialSurface = null,
        initialFocus = null,
        initialFeel = null
    }: Props = $props();

    // Initialize state without directly referencing props
    // The $effect below will sync them immediately and whenever props change
    let weather = $state<WeatherCondition | null>(null);
    let surface = $state<TrackSurface | null>(null);
    let focus   = $state<SessionFocus | null>(null);
    let feel    = $state<RideFeel | null>(null);
    
    let isEditing = $state(false);
    let isSaving  = $state(false);

    // Keep state in sync with props (runs immediately and whenever props change)
    $effect(() => {
        if (!isEditing) {
            weather = initialWeather ?? null;
            surface = initialSurface ?? null;
            focus   = initialFocus ?? null;
            feel    = initialFeel ?? null;
        }
    });

    async function saveContext() {
        isSaving = true;
        const formData = new FormData();
        formData.set('sessionId', sessionId);
        if (weather) formData.set('weather', weather);
        if (surface) formData.set('surface', surface);
        if (focus)   formData.set('focus', focus);
        if (feel)    formData.set('feel', feel);
        try {
            const response = await fetch('?/updateSessionContext', { method: 'POST', body: formData });
            if (response.ok) isEditing = false;
        } catch (error) {
            console.error('Failed to save session context:', error);
        } finally {
            isSaving = false;
        }
    }

    function cancelEdit() {
        weather = initialWeather;
        surface = initialSurface;
        focus   = initialFocus;
        feel    = initialFeel;
        isEditing = false;
    }

    let weatherMeta = $derived(getWeatherMeta(weather));
    let surfaceMeta = $derived(getSurfaceMeta(surface));
    let focusMeta   = $derived(getFocusMeta(focus));
    let feelMeta    = $derived(getRideFeelMeta(feel));

    let hasContext  = $derived(!!(weather || surface || focus || feel));
</script>

{#if isEditing}
    <!-- ── EDIT MODE ── -->
    <div class="bg-[#131010] border border-[#f5a623]/30 rounded-xl p-5">
        <div class="flex items-center justify-between mb-5">
            <div>
                <h3 class="text-sm font-semibold text-[#f0ece4]">Set session context</h3>
                <p class="text-xs text-[#6b5f4d] mt-0.5">
                    Context shapes the interpretation — the analysis adapts based on what you set here
                </p>
            </div>
            <button
                onclick={cancelEdit}
                class="text-xs text-[#6b5f4d] hover:text-[#9a8f7a] transition-colors
                       focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded px-2 py-1">
                Cancel
            </button>
        </div>

        <div class="space-y-5">
            <!-- Weather -->
            <div>
                <div class="text-xs font-medium text-[#9a8f7a] mb-2">Weather conditions</div>
                <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {#each WEATHER_OPTIONS as option}
                        <button
                            onclick={() => weather = weather === option.value ? null : option.value}
                            class="flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all
                                   {weather === option.value 
                                       ? 'bg-[#f5a623]/10 border-[#f5a623]/40 text-[#f5a623]' 
                                       : 'bg-[#0a0809] border-[#221c18] text-[#9a8f7a] hover:border-[#f5a623]/20'}
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                            <span class="text-xl">{option.icon}</span>
                            <span class="text-xs font-medium text-center leading-tight">{option.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Surface -->
            <div>
                <div class="text-xs font-medium text-[#9a8f7a] mb-2">Track surface</div>
                <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {#each SURFACE_OPTIONS as option}
                        <button
                            onclick={() => surface = surface === option.value ? null : option.value}
                            class="flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all
                                   {surface === option.value 
                                       ? 'bg-[#3de8c8]/10 border-[#3de8c8]/40 text-[#3de8c8]' 
                                       : 'bg-[#0a0809] border-[#221c18] text-[#9a8f7a] hover:border-[#3de8c8]/20'}
                                   focus:outline-none focus:ring-2 focus:ring-[#3de8c8]">
                            <span class="text-xl">{option.icon}</span>
                            <span class="text-xs font-medium text-center leading-tight">{option.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Focus -->
            <div>
                <div class="text-xs font-medium text-[#9a8f7a] mb-2">Session focus</div>
                <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {#each FOCUS_OPTIONS as option}
                        <button
                            onclick={() => focus = focus === option.value ? null : option.value}
                            class="flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                            style="{focus === option.value 
                                ? `background: ${option.color}15; border-color: ${option.color}80; color: ${option.color}; border-width: 1px;` 
                                : 'background: var(--theme-bg); border-color: var(--theme-border); color: var(--theme-text-secondary);'}">
                            <span class="text-xl">{option.icon}</span>
                            <span class="text-xs font-medium text-center leading-tight">{option.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Feel -->
            <div>
                <div class="text-xs font-medium text-[#9a8f7a] mb-2">How did it feel?</div>
                <div class="grid grid-cols-5 gap-2">
                    {#each RIDE_FEEL_OPTIONS as option}
                        <button
                            onclick={() => feel = feel === option.value ? null : option.value}
                            class="flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                            style="{feel === option.value 
                                ? `background: ${option.color}15; border-color: ${option.color}80; color: ${option.color}; border-width: 1px;` 
                                : 'background: var(--theme-bg); border-color: var(--theme-border); color: var(--theme-text-secondary);'}">
                            <span class="text-xl">{option.icon}</span>
                            <span class="text-xs font-medium text-center leading-tight">{option.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Save -->
            <div class="flex items-center gap-2 pt-1">
                <button
                    onclick={saveContext}
                    disabled={isSaving}
                    class="flex-1 px-4 py-2 bg-[#f5a623] hover:bg-[#c97e0a] disabled:bg-[#6b5f4d]
                           text-[#0a0809] text-sm font-semibold rounded-lg transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                    {isSaving ? 'Saving...' : 'Save and update analysis'}
                </button>
            </div>
        </div>
    </div>

{:else if hasContext}
    <!-- ── DISPLAY MODE — context set ── -->
    <!-- Compact receipt: takes up minimal space, shows what's set, offers edit -->
    <div class="bg-[#131010] border border-[#221c18] rounded-xl px-4 py-3">
        <div class="flex items-center gap-3 flex-wrap">
            <span class="text-sm font-semibold text-[#9a8f7a] flex-shrink-0">Context</span>
            <div class="flex items-center gap-2 flex-wrap flex-1">
                {#if weatherMeta}
                    <span class="inline-flex items-center gap-1.5 text-xs text-[#9a8f7a] bg-[#0a0809] border border-[#221c18] rounded-lg px-2.5 py-1">
                        <span>{weatherMeta.icon}</span>{weatherMeta.label}
                    </span>
                {/if}
                {#if surfaceMeta}
                    <span class="inline-flex items-center gap-1.5 text-xs text-[#9a8f7a] bg-[#0a0809] border border-[#221c18] rounded-lg px-2.5 py-1">
                        <span>{surfaceMeta.icon}</span>{surfaceMeta.label}
                    </span>
                {/if}
                {#if focusMeta}
                    <span class="inline-flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 bg-[#0a0809] border border-[#221c18]"
                          style="color: {focusMeta.color}">
                        <span>{focusMeta.icon}</span>{focusMeta.label}
                    </span>
                {/if}
                {#if feelMeta}
                    <span class="inline-flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 bg-[#0a0809] border border-[#221c18]"
                          style="color: {feelMeta.color}">
                        <span>{feelMeta.icon}</span>{feelMeta.label}
                    </span>
                {/if}
            </div>
            <button
                onclick={() => isEditing = true}
                class="text-xs text-[#4a4038] hover:text-[#9a8f7a] transition-colors flex-shrink-0
                       focus:outline-none focus:ring-2 focus:ring-[#6b5f4d] rounded px-2 py-1">
                Edit
            </button>
        </div>
        <p class="text-xs text-[#4a4038] mt-2">
            Analysis is adjusted for this context — session focus, conditions and feel are factored into interpretation
        </p>
    </div>

{:else}
    <!-- ── EMPTY STATE — context not yet set ── -->
    <!-- Prominent invitation: step 2 of the workflow -->
    <button
        onclick={() => isEditing = true}
        class="w-full bg-[#131010] border border-[#f5a623]/20 hover:border-[#f5a623]/40
               rounded-xl px-5 py-4 text-left transition-all group
               focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
        <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-[#f5a623]/08 border border-[#f5a623]/20
                            flex items-center justify-center flex-shrink-0
                            group-hover:bg-[#f5a623]/12 transition-colors">
                    <svg class="w-4 h-4 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M12 4v16m8-8H4"/>
                    </svg>
                </div>
                <div>
                    <p class="text-sm font-medium text-[#f5a623]">Add session context</p>
                    <p class="text-xs text-[#6b5f4d] mt-0.5">
                        Conditions, focus and how it felt — the analysis adapts when you add this
                    </p>
                </div>
            </div>
            <svg class="w-4 h-4 text-[#4a4038] group-hover:text-[#f5a623] transition-colors flex-shrink-0"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        </div>
    </button>

{/if}