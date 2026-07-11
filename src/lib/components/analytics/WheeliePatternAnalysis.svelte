<script lang="ts">
	/**
	 * Wheelie Pattern Analysis Component
	 * Shows front wheel lift patterns and their impact on performance
	 */

	interface WheelieDataPoint {
		sessionDate: string;
		sessionNumber: number;
		wheelieRate: number; // % of runs with front wheel lift
		avgReactionMs: number | null;
		avgReactionWithWheelieMs: number | null;
		avgReactionWithoutWheelieMs: number | null;
	}

	interface Props {
		data: WheelieDataPoint[];
		isMobile?: boolean;
	}

	let { data, isMobile = false }: Props = $props();

	// Calculate wheelie pattern insights
	let wheelieInsights = $derived.by(() => {
		if (data.length === 0) return null;

		const avgWheelieRate = data.reduce((sum, d) => sum + d.wheelieRate, 0) / data.length;

		// Check if wheelies correlate with better/worse performance
		const sessionsWithData = data.filter(
			(d) => d.avgReactionWithWheelieMs !== null && d.avgReactionWithoutWheelieMs !== null
		);

		let wheelieImpact: 'faster' | 'slower' | 'neutral' | null = null;
		let avgDifference = 0;

		if (sessionsWithData.length > 0) {
			const differences = sessionsWithData.map(
				(d) => d.avgReactionWithWheelieMs! - d.avgReactionWithoutWheelieMs!
			);
			avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;

			if (avgDifference < -10) wheelieImpact = 'faster';
			else if (avgDifference > 10) wheelieImpact = 'slower';
			else wheelieImpact = 'neutral';
		}

		return {
			avgWheelieRate: Math.round(avgWheelieRate),
			wheelieImpact,
			avgDifference: Math.abs(Math.round(avgDifference)),
			recentTrend:
				data.length >= 3
					? data.slice(-3).reduce((sum, d) => sum + d.wheelieRate, 0) / 3 -
						data.slice(0, 3).reduce((sum, d) => sum + d.wheelieRate, 0) / 3
					: null
		};
	});
</script>

<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
	<div class="mb-4 flex items-start justify-between gap-4">
		<div>
			<h3 class="text-sm font-semibold text-[#f0ece4]">Wheelie Pattern Analysis</h3>
			<p class="mt-1 text-xs text-[#6b5f4d]">Front wheel lift frequency & performance impact</p>
		</div>
		{#if wheelieInsights}
			<div class="text-right">
				<div class="text-xs text-[#6b5f4d]">Wheelie Rate</div>
				<div class="text-2xl font-bold text-[#f5a623]">{wheelieInsights.avgWheelieRate}%</div>
				<div class="text-xs text-[#9a8f7a]">of runs</div>
			</div>
		{/if}
	</div>

	{#if wheelieInsights}
		<!-- Wheelie rate visualization -->
		<div class="mb-4">
			<div class="flex h-32 items-end gap-1">
				{#each data as point}
					{@const height = (point.wheelieRate / 100) * 100}
					<div class="flex flex-1 flex-col items-center gap-1">
						<span class="text-[9px] text-[#6b5f4d]">{point.wheelieRate}%</span>
						<div
							class="w-full rounded-t bg-[#f5a623] transition-all"
							style="height:{height}%; min-height:4px"
						></div>
						<span
							class="mt-1 origin-top-left rotate-45 text-[9px] whitespace-nowrap text-[#6b5f4d]"
						>
							{point.sessionDate}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Performance impact analysis -->
		{#if wheelieInsights.wheelieImpact}
			<div class="space-y-3">
				<div
					class="rounded-lg p-3 {wheelieInsights.wheelieImpact === 'faster'
						? 'border border-[#3de8c8]/20 bg-[#3de8c8]/10'
						: wheelieInsights.wheelieImpact === 'slower'
							? 'border border-[#ff4444]/20 bg-[#ff4444]/10'
							: 'border border-[#f5a623]/20 bg-[#f5a623]/10'}"
				>
					<div class="flex items-start gap-2">
						<span class="text-lg">
							{#if wheelieInsights.wheelieImpact === 'faster'}🚀
							{:else if wheelieInsights.wheelieImpact === 'slower'}⚠️
							{:else}➡️
							{/if}
						</span>
						<div class="flex-1">
							<p
								class="text-sm font-semibold {wheelieInsights.wheelieImpact === 'faster'
									? 'text-[#3de8c8]'
									: wheelieInsights.wheelieImpact === 'slower'
										? 'text-[#ff4444]'
										: 'text-[#f5a623]'}"
							>
								{#if wheelieInsights.wheelieImpact === 'faster'}
									Wheelies correlate with faster reactions
								{:else if wheelieInsights.wheelieImpact === 'slower'}
									Wheelies correlate with slower reactions
								{:else}
									Wheelies have no clear performance impact
								{/if}
							</p>
							<p class="mt-1 text-xs text-[#9a8f7a]">
								{#if wheelieInsights.wheelieImpact === 'faster'}
									Runs with front wheel lift are ~{wheelieInsights.avgDifference}ms faster on
									average
								{:else if wheelieInsights.wheelieImpact === 'slower'}
									Runs with front wheel lift are ~{wheelieInsights.avgDifference}ms slower on
									average
								{:else}
									No significant difference in reaction times with/without wheelies
								{/if}
							</p>
						</div>
					</div>
				</div>

				{#if wheelieInsights.recentTrend !== null}
					<div class="grid grid-cols-2 gap-2 text-xs">
						<div class="rounded border border-[#221c18] bg-[#0a0809] p-2">
							<div class="mb-1 text-[#6b5f4d]">Recent trend</div>
							<div class="font-semibold text-[#f0ece4]">
								{#if wheelieInsights.recentTrend > 5}
									More wheelies lately
								{:else if wheelieInsights.recentTrend < -5}
									Fewer wheelies lately
								{:else}
									Consistent pattern
								{/if}
							</div>
						</div>
						<div class="rounded border border-[#221c18] bg-[#0a0809] p-2">
							<div class="mb-1 text-[#6b5f4d]">Recommendation</div>
							<div class="font-semibold text-[#f0ece4]">
								{#if wheelieInsights.wheelieImpact === 'faster'}
									Keep using wheelies
								{:else if wheelieInsights.wheelieImpact === 'slower'}
									Try controlled starts
								{:else}
									Test both techniques
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<p class="text-xs text-[#6b5f4d] italic">
				Need more varied session data to determine wheelie impact on performance
			</p>
		{/if}
	{/if}
</div>
