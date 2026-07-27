<script lang="ts">
	import SessionContextEditor from '$lib/components/SessionContextEditor.svelte';
	import RunTagSelector from '$lib/components/RunTagSelector.svelte';
	import { shouldExcludeFromStats, getTagMeta, type RunTag } from '$lib/types/runs';
	import type {
		WeatherCondition,
		TrackSurface,
		SessionFocus,
		RideFeel
	} from '$lib/types/sessionContext';

	interface RunSummary {
		id: string;
		run_number: number;
		tags: RunTag[] | null;
		gate_runs?: { reaction_time_ms: number } | null;
	}

	interface Props {
		sessionId: string;
		runs: RunSummary[];
		initialWeather?: WeatherCondition | null;
		initialSurface?: TrackSurface | null;
		initialFocus?: SessionFocus | null;
		initialFeel?: RideFeel | null;
		onDraftContextChange?: (draft: {
			weather: WeatherCondition | null;
			surface: TrackSurface | null;
			focus: SessionFocus | null;
			feel: RideFeel | null;
		}) => void;
		onDraftRunTagsChange?: (runId: string, tags: RunTag[]) => void;
	}

	let {
		sessionId,
		runs,
		initialWeather = null,
		initialSurface = null,
		initialFocus = null,
		initialFeel = null,
		onDraftContextChange,
		onDraftRunTagsChange
	}: Props = $props();

	// Track whether context has been set — derived from props so it updates
	// reactively when the context editor saves and the page reloads
	let hasContext = $derived(!!(initialWeather || initialSurface || initialFocus || initialFeel));

	// Track whether any run has been tagged — warmup/exclude are the analytically
	// significant ones. Best-effort, experimental, competition don't affect stats
	// so we don't count those as "tagging done" for nudge purposes.
	let hasAnyStatsTag = $derived(runs.some((r) => shouldExcludeFromStats(r.tags ?? null)));

	// Show nudge when: no context at all AND no stats-affecting tags AND
	// there's more than one run (single run sessions are self-evidently clear)
	let showNudge = $derived(!hasContext && !hasAnyStatsTag && runs.length > 1);

	// Compact formatting
	function fmtReaction(ms: number | null | undefined): string {
		if (ms == null) return '—';
		return (ms / 1000).toFixed(3) + 's';
	}

	// Tag display for compact strip
	function getStatsTagLabel(tags: RunTag[] | null): { icon: string; color: string } | null {
		if (!tags) return null;
		const excluded = tags.find(
			(t) =>
				t === 'warmup' || t === 'exclude-from-stats' || t === 'experimental' || t === 'competition'
		);
		if (!excluded) return null;
		const meta = getTagMeta(excluded);
		return meta ? { icon: meta.icon, color: meta.color } : null;
	}

	// Section expand state for the run tags strip
	let tagsExpanded = $state(false);
</script>

<div class="space-y-2">
	<!-- ── Gentle nudge ──────────────────────────────────────────────────── -->
	{#if showNudge}
		<div
			class="bg-[#f5a623]/06 flex items-start gap-3 rounded-xl border border-[#f5a623]/20 px-4
                    py-3 text-sm"
		>
			<svg
				class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#f5a623]"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<p class="themed-text-secondary leading-snug">
				<span class="font-medium text-[#f5a623]">Get more accurate analysis</span>
				— add session context below and tag any warmup runs before reading the summary.
			</p>
		</div>
	{/if}

	<!-- ── Session context editor ─────────────────────────────────────────── -->
	<SessionContextEditor
		{sessionId}
		{initialWeather}
		{initialSurface}
		{initialFocus}
		{initialFeel}
		onDraftChange={onDraftContextChange}
	/>

	<!-- ── Run tagging strip ─────────────────────────────────────────────── -->
	{#if runs.length > 0}
		<div class="themed-card rounded-xl">
			<button
				onclick={() => (tagsExpanded = !tagsExpanded)}
				class="flex w-full items-center justify-between px-4 py-3 text-left
                       transition-colors hover:bg-[color:var(--theme-surface-hover)]
                       focus:ring-2 focus:ring-[#f5a623]/40 focus:outline-none focus:ring-inset"
				aria-expanded={tagsExpanded}
			>
				<div class="flex items-center gap-3">
					<span class="themed-text-secondary text-sm font-medium">Tag runs</span>

					<!-- Compact tag summary badges when collapsed -->
					{#if !tagsExpanded}
						<div class="flex flex-wrap items-center gap-1.5">
							{#each runs as run}
								{@const statsTag = getStatsTagLabel(run.tags ?? null)}
								{#if statsTag}
									<span
										class="inline-flex items-center gap-1 rounded-full border px-2
                                                 py-0.5 text-[10px] font-semibold"
										style="border-color:{statsTag.color}30; color:{statsTag.color}; background:{statsTag.color}10"
									>
										{statsTag.icon} R{run.run_number}
									</span>
								{/if}
							{/each}
							{#if !runs.some((r) => r.tags && r.tags.length > 0)}
								<span class="themed-text-faint text-xs">None tagged</span>
							{/if}
						</div>
					{/if}
				</div>

				<div class="flex flex-shrink-0 items-center gap-2">
					<span class="themed-text-faint text-xs">
						{tagsExpanded ? 'Collapse' : 'Expand'}
					</span>
					<svg
						class="themed-text-faint h-4 w-4 transition-transform duration-200
                                {tagsExpanded ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			</button>

			{#if tagsExpanded}
				<div class="space-y-1 border-t border-[color:var(--theme-border)] px-4 py-3">
					<p class="themed-text-faint mb-3 text-xs">
						Warmup and excluded runs are removed from session averages, consistency scores, and
						personal best calculations.
					</p>
					<div class="flex flex-wrap gap-2">
						{#each runs as run}
							{@const statsTag = getStatsTagLabel(run.tags ?? null)}
							<div
								class="themed-nested-card flex min-w-[80px] items-center gap-2 rounded-lg
                                        border border-[color:var(--theme-border)] px-3 py-2"
							>
								<div class="min-w-0 flex-1">
									<p class="themed-text-primary text-xs leading-none font-semibold">
										Run {run.run_number}
									</p>
									<p class="themed-text-faint mt-0.5 text-[10px]">
										{fmtReaction(run.gate_runs?.reaction_time_ms)}
									</p>
									{#if statsTag}
										<p class="mt-0.5 text-[10px] font-medium" style="color:{statsTag.color}">
											{statsTag.icon} excluded
										</p>
									{/if}
								</div>
								<RunTagSelector
									runId={run.id}
									runNumber={run.run_number}
									currentTags={run.tags ?? []}
									{sessionId}
									compact={true}
									onDraftChange={onDraftRunTagsChange}
								/>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
