<script lang="ts">
	import { invalidateAll } from '$app/navigation';
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

	interface ContextDraft {
		weather: WeatherCondition | null;
		surface: TrackSurface | null;
		focus: SessionFocus | null;
		feel: RideFeel | null;
	}

	interface Props {
		sessionId: string;
		initialWeather?: WeatherCondition | null;
		initialSurface?: TrackSurface | null;
		initialFocus?: SessionFocus | null;
		initialFeel?: RideFeel | null;
		onDraftChange?: (draft: ContextDraft) => void;
	}

	let {
		sessionId,
		initialWeather = null,
		initialSurface = null,
		initialFocus = null,
		initialFeel = null,
		onDraftChange
	}: Props = $props();

	// Initialize state without directly referencing props
	// The $effect below will sync them immediately and whenever props change
	let weather = $state<WeatherCondition | null>(null);
	let surface = $state<TrackSurface | null>(null);
	let focus = $state<SessionFocus | null>(null);
	let feel = $state<RideFeel | null>(null);

	let isEditing = $state(false);
	let isSaving = $state(false);

	// Keep state in sync with props (runs immediately and whenever props change)
	$effect(() => {
		if (!isEditing) {
			weather = initialWeather ?? null;
			surface = initialSurface ?? null;
			focus = initialFocus ?? null;
			feel = initialFeel ?? null;
		}
	});

	// Report in-progress selections to a parent (e.g. a live hero preview) as
	// they change, before anything is actually saved.
	$effect(() => {
		if (isEditing) onDraftChange?.({ weather, surface, focus, feel });
	});

	async function saveContext() {
		isSaving = true;
		const formData = new FormData();
		formData.set('sessionId', sessionId);
		if (weather) formData.set('weather', weather);
		if (surface) formData.set('surface', surface);
		if (focus) formData.set('focus', focus);
		if (feel) formData.set('feel', feel);
		try {
			const response = await fetch('?/updateSessionContext', { method: 'POST', body: formData });
			if (response.ok) {
				isEditing = false;
				await invalidateAll();
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
		feel = initialFeel;
		isEditing = false;
	}

	let weatherMeta = $derived(getWeatherMeta(weather));
	let surfaceMeta = $derived(getSurfaceMeta(surface));
	let focusMeta = $derived(getFocusMeta(focus));
	let feelMeta = $derived(getRideFeelMeta(feel));

	let hasContext = $derived(!!(weather || surface || focus || feel));
</script>

{#if isEditing}
	<!-- ── EDIT MODE ── -->
	<div class="rounded-xl border border-[#f5a623]/30 bg-[#131010] p-5">
		<div class="mb-5 flex items-center justify-between">
			<div>
				<h3 class="text-sm font-semibold text-[#f0ece4]">Set session context</h3>
				<p class="mt-0.5 text-xs text-[#6b5f4d]">
					Context shapes the interpretation — the analysis adapts based on what you set here
				</p>
			</div>
			<button
				onclick={cancelEdit}
				class="rounded px-2 py-1 text-xs
                       text-[#6b5f4d] transition-colors hover:text-[#9a8f7a] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
			>
				Cancel
			</button>
		</div>

		<div class="space-y-5">
			<!-- Weather -->
			<div>
				<div class="mb-2 text-xs font-medium text-[#9a8f7a]">Weather conditions</div>
				<div class="grid grid-cols-4 gap-2 sm:grid-cols-8">
					{#each WEATHER_OPTIONS as option}
						<button
							onclick={() => (weather = weather === option.value ? null : option.value)}
							class="flex flex-col items-center gap-1 rounded-lg border p-2.5 transition-all
                                   {weather === option.value
								? 'border-[#f5a623]/40 bg-[#f5a623]/10 text-[#f5a623]'
								: 'border-[#221c18] bg-[#0a0809] text-[#9a8f7a] hover:border-[#f5a623]/20'}
                                   focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
						>
							<span class="text-xl">{option.icon}</span>
							<span class="text-center text-xs leading-tight font-medium">{option.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Surface -->
			<div>
				<div class="mb-2 text-xs font-medium text-[#9a8f7a]">Track surface</div>
				<div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
					{#each SURFACE_OPTIONS as option}
						<button
							onclick={() => (surface = surface === option.value ? null : option.value)}
							class="flex flex-col items-center gap-1 rounded-lg border p-2.5 transition-all
                                   {surface === option.value
								? 'border-[#3de8c8]/40 bg-[#3de8c8]/10 text-[#3de8c8]'
								: 'border-[#221c18] bg-[#0a0809] text-[#9a8f7a] hover:border-[#3de8c8]/20'}
                                   focus:ring-2 focus:ring-[#3de8c8] focus:outline-none"
						>
							<span class="text-xl">{option.icon}</span>
							<span class="text-center text-xs leading-tight font-medium">{option.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Focus -->
			<div>
				<div class="mb-2 text-xs font-medium text-[#9a8f7a]">Session focus</div>
				<div class="grid grid-cols-4 gap-2 sm:grid-cols-8">
					{#each FOCUS_OPTIONS as option}
						<button
							onclick={() => (focus = focus === option.value ? null : option.value)}
							class="flex flex-col items-center gap-1 rounded-lg border p-2.5 transition-all
                                   focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
							style={focus === option.value
								? `background: ${option.color}15; border-color: ${option.color}80; color: ${option.color}; border-width: 1px;`
								: 'background: var(--theme-bg); border-color: var(--theme-border); color: var(--theme-text-secondary);'}
						>
							<span class="text-xl">{option.icon}</span>
							<span class="text-center text-xs leading-tight font-medium">{option.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Feel -->
			<div>
				<div class="mb-2 text-xs font-medium text-[#9a8f7a]">How did it feel?</div>
				<div class="grid grid-cols-5 gap-2">
					{#each RIDE_FEEL_OPTIONS as option}
						<button
							onclick={() => (feel = feel === option.value ? null : option.value)}
							class="flex flex-col items-center gap-1 rounded-lg border p-2.5 transition-all
                                   focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
							style={feel === option.value
								? `background: ${option.color}15; border-color: ${option.color}80; color: ${option.color}; border-width: 1px;`
								: 'background: var(--theme-bg); border-color: var(--theme-border); color: var(--theme-text-secondary);'}
						>
							<span class="text-xl">{option.icon}</span>
							<span class="text-center text-xs leading-tight font-medium">{option.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Save -->
			<div class="flex items-center gap-2 pt-1">
				<button
					onclick={saveContext}
					disabled={isSaving}
					class="flex-1 rounded-lg bg-[#f5a623] px-4 py-2 text-sm
                           font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a] focus:ring-2
                           focus:ring-[#f5a623] focus:outline-none disabled:bg-[#6b5f4d]"
				>
					{isSaving ? 'Saving...' : 'Save and update analysis'}
				</button>
			</div>
		</div>
	</div>
{:else if hasContext}
	<!-- ── DISPLAY MODE — context set ── -->
	<!-- Compact receipt: takes up minimal space, shows what's set, offers edit -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] px-4 py-3">
		<div class="flex flex-wrap items-center gap-3">
			<span class="flex-shrink-0 text-sm font-semibold text-[#9a8f7a]">Context</span>
			<div class="flex flex-1 flex-wrap items-center gap-2">
				{#if weatherMeta}
					<span
						class="inline-flex items-center gap-1.5 rounded-lg border border-[#221c18] bg-[#0a0809] px-2.5 py-1 text-xs text-[#9a8f7a]"
					>
						<span>{weatherMeta.icon}</span>{weatherMeta.label}
					</span>
				{/if}
				{#if surfaceMeta}
					<span
						class="inline-flex items-center gap-1.5 rounded-lg border border-[#221c18] bg-[#0a0809] px-2.5 py-1 text-xs text-[#9a8f7a]"
					>
						<span>{surfaceMeta.icon}</span>{surfaceMeta.label}
					</span>
				{/if}
				{#if focusMeta}
					<span
						class="inline-flex items-center gap-1.5 rounded-lg border border-[#221c18] bg-[#0a0809] px-2.5 py-1 text-xs"
						style="color: {focusMeta.color}"
					>
						<span>{focusMeta.icon}</span>{focusMeta.label}
					</span>
				{/if}
				{#if feelMeta}
					<span
						class="inline-flex items-center gap-1.5 rounded-lg border border-[#221c18] bg-[#0a0809] px-2.5 py-1 text-xs"
						style="color: {feelMeta.color}"
					>
						<span>{feelMeta.icon}</span>{feelMeta.label}
					</span>
				{/if}
			</div>
			<button
				onclick={() => (isEditing = true)}
				class="flex-shrink-0 rounded px-2 py-1 text-xs
                       text-[#4a4038] transition-colors hover:text-[#9a8f7a] focus:ring-2 focus:ring-[#6b5f4d] focus:outline-none"
			>
				Edit
			</button>
		</div>
		<p class="mt-2 text-xs text-[#4a4038]">
			Analysis is adjusted for this context — session focus, conditions and feel are factored into
			interpretation
		</p>
	</div>
{:else}
	<!-- ── EMPTY STATE — context not yet set ── -->
	<!-- Prominent invitation: step 2 of the workflow -->
	<button
		onclick={() => (isEditing = true)}
		class="group w-full rounded-xl border border-[#f5a623]/20
               bg-[#131010] px-5 py-4 text-left transition-all hover:border-[#f5a623]/40
               focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
	>
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<div
					class="bg-[#f5a623]/08 flex h-9 w-9 flex-shrink-0 items-center
                            justify-center rounded-lg border border-[#f5a623]/20
                            transition-colors group-hover:bg-[#f5a623]/12"
				>
					<svg class="h-4 w-4 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
				</div>
				<div>
					<p class="text-sm font-medium text-[#f5a623]">Add session context</p>
					<p class="mt-0.5 text-xs text-[#6b5f4d]">
						Conditions, focus and how it felt — the analysis adapts when you add this
					</p>
				</div>
			</div>
			<svg
				class="h-4 w-4 flex-shrink-0 text-[#4a4038] transition-colors group-hover:text-[#f5a623]"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</div>
	</button>
{/if}
