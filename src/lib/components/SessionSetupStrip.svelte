<script lang="ts">
    import SessionContextEditor from '$lib/components/SessionContextEditor.svelte';
    import RunTagSelector from '$lib/components/RunTagSelector.svelte';
    import { shouldExcludeFromStats, getTagMeta, type RunTag } from '$lib/types/runs';
    import type { WeatherCondition, TrackSurface, SessionFocus, RideFeel } from '$lib/types/sessionContext';

    interface RunSummary {
        id:            string;
        run_number:    number;
        tags:          RunTag[] | null;
        gate_runs?:    { reaction_time_ms: number } | null;
    }

    interface Props {
        sessionId:       string;
        runs:            RunSummary[];
        initialWeather?: WeatherCondition | null;
        initialSurface?: TrackSurface | null;
        initialFocus?:   SessionFocus | null;
        initialFeel?:    RideFeel | null;
    }

    let {
        sessionId,
        runs,
        initialWeather = null,
        initialSurface = null,
        initialFocus   = null,
        initialFeel    = null,
    }: Props = $props();

    // Track whether context has been set — derived from props so it updates
    // reactively when the context editor saves and the page reloads
    let hasContext = $derived(!!(initialWeather || initialSurface || initialFocus || initialFeel));

    // Track whether any run has been tagged — warmup/exclude are the analytically
    // significant ones. Best-effort, experimental, competition don't affect stats
    // so we don't count those as "tagging done" for nudge purposes.
    let hasAnyStatsTag = $derived(
        runs.some(r => shouldExcludeFromStats(r.tags ?? null))
    );

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
        const excluded = tags.find(t => t === 'warmup' || t === 'exclude-from-stats');
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
        <div class="flex items-start gap-3 px-4 py-3 bg-[#f5a623]/06 border border-[#f5a623]/20
                    rounded-xl text-sm">
            <svg class="w-4 h-4 text-[#f5a623] flex-shrink-0 mt-0.5" fill="none"
                 stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="themed-text-secondary leading-snug">
                <span class="text-[#f5a623] font-medium">Get more accurate analysis</span>
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
    />

    <!-- ── Run tagging strip ─────────────────────────────────────────────── -->
    {#if runs.length > 0}
        <div class="themed-card rounded-xl">

            <button
                onclick={() => tagsExpanded = !tagsExpanded}
                class="w-full flex items-center justify-between px-4 py-3 text-left
                       hover:bg-[color:var(--theme-surface-hover)] transition-colors
                       focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#f5a623]/40"
                aria-expanded={tagsExpanded}
            >
                <div class="flex items-center gap-3">
                    <span class="text-sm font-medium themed-text-secondary">Tag runs</span>

                    <!-- Compact tag summary badges when collapsed -->
                    {#if !tagsExpanded}
                        <div class="flex items-center gap-1.5 flex-wrap">
                            {#each runs as run}
                                {@const statsTag = getStatsTagLabel(run.tags ?? null)}
                                {#if statsTag}
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                                 border text-[10px] font-semibold"
                                          style="border-color:{statsTag.color}30; color:{statsTag.color}; background:{statsTag.color}10">
                                        {statsTag.icon} R{run.run_number}
                                    </span>
                                {/if}
                            {/each}
                            {#if !runs.some(r => r.tags && r.tags.length > 0)}
                                <span class="text-xs themed-text-faint">None tagged</span>
                            {/if}
                        </div>
                    {/if}
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-xs themed-text-faint">
                        {tagsExpanded ? 'Collapse' : 'Expand'}
                    </span>
                    <svg class="w-4 h-4 themed-text-faint transition-transform duration-200
                                {tagsExpanded ? 'rotate-180' : ''}"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </button>

            {#if tagsExpanded}
                <div class="border-t border-[color:var(--theme-border)] px-4 py-3 space-y-1">
                    <p class="text-xs themed-text-faint mb-3">
                        Warmup and excluded runs are removed from session averages, consistency scores,
                        and personal best calculations.
                    </p>
                    <div class="flex flex-wrap gap-2">
                        {#each runs as run}
                            {@const statsTag = getStatsTagLabel(run.tags ?? null)}
                            <div class="flex items-center gap-2 themed-nested-card border border-[color:var(--theme-border)]
                                        rounded-lg px-3 py-2 min-w-[80px]">
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs font-semibold themed-text-primary leading-none">
                                        Run {run.run_number}
                                    </p>
                                    <p class="text-[10px] themed-text-faint mt-0.5">
                                        {fmtReaction(run.gate_runs?.reaction_time_ms)}
                                    </p>
                                    {#if statsTag}
                                        <p class="text-[10px] mt-0.5 font-medium"
                                           style="color:{statsTag.color}">
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
                                />
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    {/if}

</div>