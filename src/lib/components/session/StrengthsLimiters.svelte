<script lang="ts">
	interface Props {
		strengths: string[];
		limiters: string[];
		compact?: boolean;
	}

	let { strengths, limiters, compact = false }: Props = $props();

	let primaryStrength = $derived(strengths[0] ?? null);
	let primaryFocus = $derived(limiters[0] ?? null);
	let extraStrengthCount = $derived(Math.max(0, strengths.length - 1));
	let extraFocusCount = $derived(Math.max(0, limiters.length - 1));
</script>

<div class="grid grid-cols-1 gap-3 {compact ? '' : 'md:grid-cols-2'}">
	<div class={compact ? '' : 'themed-nested-card rounded-lg p-4'}>
		<p class="mb-1 text-[11px] font-semibold tracking-wide text-[#3de8c8] uppercase">What worked</p>
		{#if primaryStrength}
			<p class="themed-text-primary text-sm font-semibold">{primaryStrength}</p>
			{#if extraStrengthCount > 0}
				<p class="themed-text-subtle mt-1 text-xs">+{extraStrengthCount} more strength{extraStrengthCount === 1 ? '' : 's'} in Analysis</p>
			{/if}
		{:else}
			<p class="themed-text-subtle text-sm">No clear strength stood out yet.</p>
		{/if}
	</div>

	<div class={compact ? 'mt-2' : 'themed-nested-card rounded-lg p-4'}>
		<p class="mb-1 text-[11px] font-semibold tracking-wide text-[#ff6b3d] uppercase">What to work on</p>
		{#if primaryFocus}
			<p class="themed-text-primary text-sm font-semibold">{primaryFocus}</p>
			{#if extraFocusCount > 0}
				<p class="themed-text-subtle mt-1 text-xs">+{extraFocusCount} more focus area{extraFocusCount === 1 ? '' : 's'} in Analysis</p>
			{/if}
		{:else}
			<p class="themed-text-subtle text-sm">No clear limiter stood out in this session.</p>
		{/if}
	</div>
</div>
