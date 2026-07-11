<script lang="ts">
	interface Props {
		strengths: string[];
		limiters: string[];
		compact?: boolean;
	}

	let { strengths, limiters, compact = false }: Props = $props();
</script>

<div class="grid grid-cols-1 {compact ? 'gap-3' : 'gap-4 md:grid-cols-2'}">
	<!-- Strengths Column -->
	<div class={compact ? '' : 'themed-nested-card rounded-lg p-4'}>
		<div class="mb-3 flex items-center gap-2">
			<span class="text-lg">💪</span>
			<h4 class="text-sm font-semibold tracking-wider text-[#3de8c8] uppercase">Strengths</h4>
		</div>

		{#if strengths.length === 0}
			<p class="themed-text-subtle text-xs italic">Building strengths...</p>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each strengths as strength}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-[#3de8c8]/30
                                 bg-[#3de8c8]/10 px-3 py-1.5 text-sm
                                 font-medium text-[#3de8c8] transition-all hover:bg-[#3de8c8]/20"
					>
						<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>{strength}</span>
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Limiters Column -->
	<div class={compact ? 'mt-2' : 'themed-nested-card rounded-lg p-4'}>
		<div class="mb-3 flex items-center gap-2">
			<span class="text-lg">🎯</span>
			<h4 class="text-sm font-semibold tracking-wider text-[#ff6b3d] uppercase">Focus Areas</h4>
		</div>

		{#if limiters.length === 0}
			<p class="themed-text-subtle text-xs italic">Looking great across the board!</p>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each limiters as limiter}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-[#ff6b3d]/30
                                 bg-[#ff6b3d]/10 px-3 py-1.5 text-sm
                                 font-medium text-[#ff6b3d] transition-all hover:bg-[#ff6b3d]/20"
					>
						<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>{limiter}</span>
					</span>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if !compact && (strengths.length > 0 || limiters.length > 0)}
	<div class="themed-nested-card mt-4 rounded-lg border border-[color:var(--border)] px-4 py-3">
		<p class="themed-text-secondary text-xs">
			<span class="font-semibold">Performance summary:</span>
			{#if strengths.length > 0 && limiters.length > 0}
				Build on your {strengths.length} strength{strengths.length !== 1 ? 's' : ''} while focusing on
				{limiters.length} area{limiters.length !== 1 ? 's' : ''} for improvement.
			{:else if strengths.length > 0}
				Great work! You have {strengths.length} clear strength{strengths.length !== 1 ? 's' : ''} in this
				session.
			{:else if limiters.length > 0}
				Focus on improving {limiters.length} key area{limiters.length !== 1 ? 's' : ''} to level up your
				performance.
			{:else}
				Complete more runs to generate performance insights.
			{/if}
		</p>
	</div>
{/if}
