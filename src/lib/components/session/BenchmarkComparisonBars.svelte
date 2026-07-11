<script lang="ts">
	interface Props {
		scores: {
			reaction: number | null;
			explosiveness: number | null;
			smoothness: number | null;
			efficiency: number | null;
			overall: number | null;
		} | null;
	}

	let { scores }: Props = $props();

	const dimensions = [
		{ key: 'overall' as const, label: 'Overall', icon: '⭐' },
		{ key: 'reaction' as const, label: 'Reaction', icon: '⚡' },
		{ key: 'explosiveness' as const, label: 'Explosiveness', icon: '💥' },
		{ key: 'smoothness' as const, label: 'Smoothness', icon: '〰️' },
		{ key: 'efficiency' as const, label: 'Efficiency', icon: '⚙️' }
	];

	function getLabel(score: number) {
		if (score >= 80) return { text: 'Excellent', color: '#3de8c8' };
		if (score >= 60) return { text: 'Good', color: '#f5a623' };
		if (score >= 40) return { text: 'Developing', color: '#ff6b3d' };
		return { text: 'Needs Work', color: '#ff4444' };
	}
</script>

{#if scores}
	<div class="themed-card rounded-xl p-5">
		<div class="mb-4">
			<h3 class="themed-text-primary mb-2 text-base font-bold">Benchmark Comparison</h3>
			<p class="themed-text-subtle text-xs">See where you stand on each performance dimension</p>
		</div>

		<div class="space-y-4">
			{#each dimensions as dim}
				{@const score = scores[dim.key]}
				{#if score !== null}
					{@const label = getLabel(score)}

					<div>
						<div class="mb-2 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="text-base">{dim.icon}</span>
								<span class="themed-text-primary text-sm font-medium">
									{dim.label}
								</span>
							</div>
							<div class="flex items-center gap-2">
								<span
									class="rounded-full px-2 py-1 text-xs font-semibold"
									style="background-color: {label.color}20; color: {label.color};"
								>
									{label.text}
								</span>
								<span class="themed-text-primary text-sm font-bold">
									{score.toFixed(0)}
								</span>
							</div>
						</div>

						<!-- Benchmark bar with regions -->
						<div
							class="relative h-8 overflow-hidden rounded-lg border border-[color:var(--border)]"
						>
							<!-- Background regions -->
							<div class="absolute inset-0 flex">
								<div class="flex-1 bg-[#ff4444]/10"></div>
								<div class="flex-1 bg-[#ff6b3d]/10"></div>
								<div class="flex-1 bg-[#f5a623]/10"></div>
								<div class="flex-1 bg-[#3de8c8]/10"></div>
							</div>

							<!-- Score marker -->
							<div
								class="absolute top-0 bottom-0 w-1 transition-all duration-500"
								style="left: {score}%; background-color: {label.color}; box-shadow: 0 0 8px {label.color};"
							></div>

							<!-- Region labels -->
							<div
								class="pointer-events-none absolute inset-0 flex items-center justify-around text-[10px] font-semibold opacity-50"
							>
								<span class="text-[#ff4444]">Needs Work</span>
								<span class="text-[#ff6b3d]">Developing</span>
								<span class="text-[#f5a623]">Good</span>
								<span class="text-[#3de8c8]">Excellent</span>
							</div>
						</div>

						<!-- Scale markers -->
						<div class="themed-text-subtle mt-1 flex justify-between text-[10px]">
							<span>0</span>
							<span>25</span>
							<span>50</span>
							<span>75</span>
							<span>100</span>
						</div>
					</div>
				{/if}
			{/each}
		</div>

		<div class="mt-4 border-t border-[color:var(--border)] pt-4">
			<p class="themed-text-subtle text-xs">
				💡 <span class="font-semibold">Benchmark Guide:</span>
				Excellent (80+), Good (60-79), Developing (40-59), Needs Work (&lt;40)
			</p>
		</div>
	</div>
{/if}
