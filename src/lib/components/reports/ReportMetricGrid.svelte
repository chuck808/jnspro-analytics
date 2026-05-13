<script lang="ts">
    import type { ReportMetric } from '$lib/report-engine/types';

    let { metrics }: { metrics: ReportMetric[] } = $props();

    function ratingColor(rating: string | undefined): string {
        if (!rating) return '#9a8f7a';
        const r = rating.toLowerCase();
        if (['excellent', 'good', 'outstanding'].includes(r)) return '#2db89e';
        if (['fair', 'moderate', 'variable'].includes(r))     return '#c97e0a';
        if (['poor', 'wide', 'invalid', 'inconsistent'].includes(r)) return '#e05d3a';
        return '#9a8f7a';
    }

    let visibleMetrics = $derived(
        metrics.filter(m => m.value !== '—' && m.value !== 'Unknown' && m.value !== undefined)
    );
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#ede8e0] border border-[#ede8e0] rounded-lg overflow-hidden">
    {#each visibleMetrics as metric}
        <div class="bg-white px-4 py-3">
            <p class="text-[10px] uppercase tracking-wider text-[#9a8f7a] font-medium mb-1.5 leading-tight">
                {metric.label}
            </p>
            <div class="flex items-baseline gap-1.5">
                <p class="text-2xl font-black text-[#1a1410] leading-none">{metric.value}</p>
                {#if metric.unit}
                    <span class="text-xs text-[#9a8f7a] font-medium">{metric.unit}</span>
                {/if}
            </div>
            {#if metric.rating}
                <p class="text-[11px] font-semibold mt-1.5"
                   style="color:{ratingColor(metric.rating)}">
                    {metric.rating}
                </p>
            {:else if metric.note}
                <p class="text-[11px] text-[#9a8f7a] mt-1">{metric.note}</p>
            {/if}
        </div>
    {/each}
</div>
