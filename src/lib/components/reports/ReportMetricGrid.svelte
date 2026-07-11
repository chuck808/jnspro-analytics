<script lang="ts">
	import type { ReportMetric } from '$lib/report-engine/types';

	let { metrics }: { metrics: ReportMetric[] } = $props();

	function ratingColor(rating: string | undefined): string {
		if (!rating) return '#9a8f7a';
		const r = rating.toLowerCase();
		if (['excellent', 'good', 'outstanding'].includes(r)) return '#2db89e';
		if (['fair', 'moderate', 'variable'].includes(r)) return '#c97e0a';
		if (['poor', 'wide', 'invalid', 'inconsistent'].includes(r)) return '#e05d3a';
		return '#9a8f7a';
	}

	let visibleMetrics = $derived(
		metrics.filter((m) => m.value !== '—' && m.value !== 'Unknown' && m.value !== undefined)
	);
</script>

<div
	class="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#ede8e0] bg-[#ede8e0] sm:grid-cols-3"
>
	{#each visibleMetrics as metric}
		<div class="bg-white px-4 py-3">
			<p
				class="mb-1.5 text-[10px] leading-tight font-medium tracking-wider text-[#9a8f7a] uppercase"
			>
				{metric.label}
			</p>
			<div class="flex items-baseline gap-1.5">
				<p class="text-2xl leading-none font-black text-[#1a1410]">{metric.value}</p>
				{#if metric.unit}
					<span class="text-xs font-medium text-[#9a8f7a]">{metric.unit}</span>
				{/if}
			</div>
			{#if metric.rating}
				<p class="mt-1.5 text-[11px] font-semibold" style="color:{ratingColor(metric.rating)}">
					{metric.rating}
				</p>
			{:else if metric.note}
				<p class="mt-1 text-[11px] text-[#9a8f7a]">{metric.note}</p>
			{/if}
		</div>
	{/each}
</div>
