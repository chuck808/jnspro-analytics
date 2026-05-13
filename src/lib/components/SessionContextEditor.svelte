<script lang="ts">
    import { 
        WEATHER_OPTIONS, 
        SURFACE_OPTIONS, 
        FOCUS_OPTIONS,
        type WeatherCondition,
        type TrackSurface,
        type SessionFocus,
        getWeatherMeta,
        getSurfaceMeta,
        getFocusMeta
    } from '$lib/types/sessionContext';

    interface Props {
        sessionId: string;
        initialWeather?: WeatherCondition | null;
        initialSurface?: TrackSurface | null;
        initialFocus?: SessionFocus | null;
    }

    let { 
        sessionId,
        initialWeather = null,
        initialSurface = null,
        initialFocus = null
    }: Props = $props();

    let weather = $state<WeatherCondition | null>(null);
    let surface = $state<TrackSurface | null>(null);
    let focus = $state<SessionFocus | null>(null);
    
    let isEditing = $state(false);
    let isSaving = $state(false);

    // Sync state when props change
    $effect(() => {
        if (!isEditing) {
            weather = initialWeather;
            surface = initialSurface;
            focus = initialFocus;
        }
    });

    async function saveContext() {
        isSaving = true;
        
        const formData = new FormData();
        formData.set('sessionId', sessionId);
        if (weather) formData.set('weather', weather);
        if (surface) formData.set('surface', surface);
        if (focus) formData.set('focus', focus);

        try {
            const response = await fetch('?/updateSessionContext', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                isEditing = false;
            }
        } catch (error) {
            console.error('Failed to save session context:', error);
        } finally {
            isSaving = false;
        }
    }

    function cancelEdit() {
        weather = initialWeather;
        surface = initialSurface;
        focus = initialFocus;
        isEditing = false;
    }

    let weatherMeta = $derived(getWeatherMeta(weather));
    let surfaceMeta = $derived(getSurfaceMeta(surface));
    let focusMeta = $derived(getFocusMeta(focus));
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
    <div class="flex items-center justify-between mb-4">
        <div>
            <h3 class="text-sm font-semibold text-[#f0ece4]">Session Context</h3>
            <p class="text-xs text-[#6b5f4d]">Environmental conditions and session focus</p>
        </div>
        {#if !isEditing}
            <button
                onclick={() => isEditing = true}
                class="text-xs text-[#f5a623] hover:text-[#f0ece4] transition-colors
                       focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded px-2 py-1">
                {weather || surface || focus ? 'Edit' : '+ Add context'}
            </button>
        {/if}
    </div>

    {#if isEditing}
        <div class="space-y-4">
            <!-- Weather -->
            <div>
                <div class="block text-xs font-medium text-[#9a8f7a] mb-2">Weather Conditions</div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {#each WEATHER_OPTIONS as option}
                        <button
                            onclick={() => weather = weather === option.value ? null : option.value}
                            class="flex flex-col items-center gap-1 p-3 rounded-lg border transition-all
                                   {weather === option.value 
                                       ? 'bg-[#f5a623]/10 border-[#f5a623]/40 text-[#f5a623]' 
                                       : 'bg-[#0a0809] border-[#221c18] text-[#9a8f7a] hover:border-[#f5a623]/20'}
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                            <span class="text-2xl">{option.icon}</span>
                            <span class="text-xs font-medium">{option.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Track Surface -->
            <div>
                <div class="block text-xs font-medium text-[#9a8f7a] mb-2">Track Surface</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {#each SURFACE_OPTIONS as option}
                        <button
                            onclick={() => surface = surface === option.value ? null : option.value}
                            class="flex flex-col items-center gap-1 p-3 rounded-lg border transition-all
                                   {surface === option.value 
                                       ? 'bg-[#3de8c8]/10 border-[#3de8c8]/40 text-[#3de8c8]' 
                                       : 'bg-[#0a0809] border-[#221c18] text-[#9a8f7a] hover:border-[#3de8c8]/20'}
                                   focus:outline-none focus:ring-2 focus:ring-[#3de8c8]">
                            <span class="text-2xl">{option.icon}</span>
                            <span class="text-xs font-medium text-center">{option.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Session Focus -->
            <div>
                <div class="block text-xs font-medium text-[#9a8f7a] mb-2">Session Focus</div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {#each FOCUS_OPTIONS as option}
                        <button
                            onclick={() => focus = focus === option.value ? null : option.value}
                            class="flex flex-col items-center gap-1 p-3 rounded-lg border transition-all
                                   {focus === option.value 
                                       ? 'border-[2px]' 
                                       : 'bg-[#0a0809] border-[#221c18] hover:border-opacity-40'}
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                            style="
                                {focus === option.value 
                                    ? `background: ${option.color}15; border-color: ${option.color}80; color: ${option.color}` 
                                    : 'color: #9a8f7a'}
                            ">
                            <span class="text-2xl">{option.icon}</span>
                            <span class="text-xs font-medium text-center">{option.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-2 pt-2">
                <button
                    onclick={saveContext}
                    disabled={isSaving}
                    class="flex-1 px-4 py-2 bg-[#f5a623] hover:bg-[#c97e0a] disabled:bg-[#6b5f4d]
                           text-[#0a0809] text-sm font-semibold rounded-lg transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                    {isSaving ? 'Saving...' : 'Save Context'}
                </button>
                <button
                    onclick={cancelEdit}
                    disabled={isSaving}
                    class="px-4 py-2 bg-[#221c18] hover:bg-[#2a2320] disabled:opacity-50
                           text-[#9a8f7a] text-sm font-medium rounded-lg transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[#9a8f7a]">
                    Cancel
                </button>
            </div>
        </div>
    {:else}
        <!-- Display mode -->
        {#if weather || surface || focus}
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {#if weatherMeta}
                    <div class="flex items-center gap-2 p-3 bg-[#0a0809] rounded-lg border border-[#221c18]">
                        <span class="text-2xl">{weatherMeta.icon}</span>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs text-[#6b5f4d]">Weather</p>
                            <p class="text-sm font-medium text-[#f0ece4]">{weatherMeta.label}</p>
                        </div>
                    </div>
                {/if}
                {#if surfaceMeta}
                    <div class="flex items-center gap-2 p-3 bg-[#0a0809] rounded-lg border border-[#221c18]">
                        <span class="text-2xl">{surfaceMeta.icon}</span>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs text-[#6b5f4d]">Surface</p>
                            <p class="text-sm font-medium text-[#f0ece4]">{surfaceMeta.label}</p>
                        </div>
                    </div>
                {/if}
                {#if focusMeta}
                    <div class="flex items-center gap-2 p-3 bg-[#0a0809] rounded-lg border border-[#221c18]">
                        <span class="text-2xl">{focusMeta.icon}</span>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs text-[#6b5f4d]">Focus</p>
                            <p class="text-sm font-medium" style="color: {focusMeta.color}">{focusMeta.label}</p>
                        </div>
                    </div>
                {/if}
            </div>
        {:else}
            <p class="text-sm text-[#6b5f4d] italic">No context set for this session</p>
        {/if}
    {/if}
</div>
