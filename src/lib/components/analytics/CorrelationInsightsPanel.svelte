<script lang="ts">
	import type { CorrelationInsight } from '$lib/analytics/correlationAnalysis';

	interface Props {
		insights: CorrelationInsight[];
		minSessionsRequired: number;
		currentSessionCount: number;
	}

	let { insights = [], minSessionsRequired = 10, currentSessionCount = 0 }: Props = $props();

	let expandedInsight = $state<string | null>(null);

	function toggleInsight(id: string) {
		expandedInsight = expandedInsight === id ? null : id;
	}

	function getStrengthColor(strength: string): string {
		switch (strength) {
			case 'very strong':
				return '#3de8c8';
			case 'strong':
				return '#56d9c0';
			case 'moderate':
				return '#f5a623';
			case 'weak':
				return '#9a8f7a';
			case 'very weak':
				return '#6b5f4d';
			default:
				return '#9a8f7a';
		}
	}

	function getPriorityIcon(priority: string): string {
		switch (priority) {
			case 'high':
				return '🔥';
			case 'medium':
				return '⚡';
			case 'low':
				return '💡';
			default:
				return '📊';
		}
	}

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'high':
				return '#ff4444';
			case 'medium':
				return '#f5a623';
			case 'low':
				return '#9a8f7a';
			default:
				return '#6b5f4d';
		}
	}
</script>

<div class="overflow-hidden rounded-xl border border-[#221c18] bg-[#131010]">
	<!-- Header -->
	<div class="border-b border-[#221c18] px-5 py-4">
		<div class="mb-2 flex items-center gap-3">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3de8c8]/10">
				<svg class="h-4 w-4 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			</div>
			<div>
				<h3 class="text-sm font-semibold text-[#f0ece4]">🔍 Pattern Discovery</h3>
				<p class="text-xs text-[#6b5f4d]">How context affects your performance</p>
			</div>
		</div>

		{#if currentSessionCount < minSessionsRequired}
			<div class="mt-3 rounded-lg border border-[#f5a623]/20 bg-[#f5a623]/10 px-3 py-2">
				<p class="text-xs text-[#f5a623]">
					📊 <strong>{currentSessionCount} of {minSessionsRequired} sessions</strong> logged · Add {minSessionsRequired -
						currentSessionCount} more to unlock correlation insights
				</p>
			</div>
		{:else if insights.length === 0}
			<div class="mt-3 rounded-lg bg-[#221c18] px-3 py-2">
				<p class="text-xs text-[#9a8f7a]">
					✨ No significant correlations detected yet · Keep logging session context (weather,
					surface, etc.) to discover patterns
				</p>
			</div>
		{:else}
			<div class="mt-3 flex items-center gap-2">
				<div class="h-1.5 flex-1 rounded-full bg-[#3de8c8]/10">
					<div
						class="h-1.5 rounded-full bg-[#3de8c8] transition-all"
						style="width: {Math.min(100, (currentSessionCount / minSessionsRequired) * 100)}%"
					></div>
				</div>
				<span class="text-[10px] whitespace-nowrap text-[#6b5f4d]">
					{currentSessionCount} sessions analyzed
				</span>
			</div>
		{/if}
	</div>

	<!-- Insights List -->
	{#if insights.length > 0}
		<div class="divide-y divide-[#221c18]">
			{#each insights as insight}
				<div class="px-5 py-4 transition-colors hover:bg-[#171210]">
					<button
						onclick={() => toggleInsight(insight.id)}
						class="w-full rounded text-left focus:ring-2 focus:ring-[#3de8c8] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none"
					>
						<div class="flex items-start justify-between gap-4">
							<div class="flex flex-1 items-start gap-3">
								<!-- Priority Icon -->
								<div class="mt-0.5 flex-shrink-0 text-xl" aria-hidden="true">
									{getPriorityIcon(insight.priority)}
								</div>

								<!-- Content -->
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex flex-wrap items-center gap-2">
										<h4 class="text-sm font-semibold text-[#f0ece4]">{insight.title}</h4>
										<span
											class="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
											style="background: {getPriorityColor(
												insight.priority
											)}20; color: {getPriorityColor(insight.priority)}"
										>
											{insight.priority}
										</span>
										{#if insight.correlation.significant}
											<span
												class="rounded bg-[#3de8c8]/10 px-2 py-0.5 text-[10px] font-semibold text-[#3de8c8]"
											>
												p &lt; 0.05
											</span>
										{/if}
									</div>
									<p class="text-sm leading-relaxed text-[#9a8f7a]">{insight.description}</p>

									{#if insight.actionable && insight.example}
										<div class="mt-2 flex items-start gap-2 text-xs">
											<span class="flex-shrink-0 text-[#f5a623]">💡</span>
											<span class="text-[#f5a623]">{insight.example}</span>
										</div>
									{/if}
								</div>
							</div>

							<!-- Expand Toggle -->
							<svg
								class="mt-1 h-5 w-5 flex-shrink-0 text-[#6b5f4d] transition-transform
                                        {expandedInsight === insight.id ? 'rotate-180' : ''}"
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

					<!-- Expanded Details -->
					{#if expandedInsight === insight.id}
						<div class="mt-4 space-y-3 pl-11">
							<!-- Correlation Stats -->
							<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
								<h5 class="mb-3 text-xs font-semibold text-[#f0ece4]">Statistical Details</h5>
								<div class="grid grid-cols-2 gap-3">
									<div>
										<p class="mb-0.5 text-[10px] text-[#6b5f4d]">Correlation (r)</p>
										<div class="flex items-baseline gap-2">
											<p
												class="text-base font-bold"
												style="color: {getStrengthColor(insight.correlation.strength)}"
											>
												{insight.correlation.correlation.toFixed(3)}
											</p>
											<span class="text-xs text-[#9a8f7a]">{insight.correlation.strength}</span>
										</div>
									</div>
									<div>
										<p class="mb-0.5 text-[10px] text-[#6b5f4d]">Sample Size</p>
										<p class="text-base font-bold text-[#f0ece4]">
											n = {insight.correlation.sampleSize}
										</p>
									</div>
									<div>
										<p class="mb-0.5 text-[10px] text-[#6b5f4d]">Variables</p>
										<p class="text-xs text-[#9a8f7a]">
											{insight.correlation.variable1} × {insight.correlation.variable2}
										</p>
									</div>
									<div>
										<p class="mb-0.5 text-[10px] text-[#6b5f4d]">Direction</p>
										<div class="flex items-center gap-1">
											{#if insight.correlation.direction === 'positive'}
												<svg
													class="h-3 w-3 text-[#3de8c8]"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
													/>
												</svg>
												<span class="text-xs text-[#3de8c8]">Positive</span>
											{:else if insight.correlation.direction === 'negative'}
												<svg
													class="h-3 w-3 text-[#ff4444]"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
													/>
												</svg>
												<span class="text-xs text-[#ff4444]">Negative</span>
											{:else}
												<span class="text-xs text-[#9a8f7a]">None</span>
											{/if}
										</div>
									</div>
								</div>

								<!-- Interpretation Guide -->
								<div class="mt-3 border-t border-[#221c18] pt-3">
									<p class="text-[10px] leading-relaxed text-[#6b5f4d]">
										<strong>What this means:</strong>
										{#if insight.correlation.direction === 'positive'}
											As {insight.correlation.variable1} increases, {insight.correlation.variable2} tends
											to increase.
										{:else if insight.correlation.direction === 'negative'}
											As {insight.correlation.variable1} increases, {insight.correlation.variable2} tends
											to decrease.
										{:else}
											No clear linear relationship detected between these variables.
										{/if}
										{#if insight.correlation.significant}
											This pattern is <strong>statistically significant</strong> (p &lt; 0.05).
										{:else}
											This pattern is not statistically significant — may be due to chance.
										{/if}
									</p>
								</div>
							</div>

							<!-- Visual Strength Indicator -->
							<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-3">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-[10px] text-[#6b5f4d]">Correlation Strength</span>
									<span
										class="text-[10px] font-semibold"
										style="color: {getStrengthColor(insight.correlation.strength)}"
									>
										{insight.correlation.strength.toUpperCase()}
									</span>
								</div>
								<div class="h-2 w-full rounded-full bg-[#221c18]">
									<div
										class="h-2 rounded-full transition-all"
										style="width: {Math.abs(insight.correlation.correlation) * 100}%; 
                                                background: {getStrengthColor(
											insight.correlation.strength
										)}"
									></div>
								</div>
								<div class="mt-1 flex justify-between text-[9px] text-[#6b5f4d]">
									<span>Weak</span>
									<span>Strong</span>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Footer Info -->
		<div class="border-t border-[#221c18] bg-[#0a0809] px-5 py-3">
			<p class="text-[10px] leading-relaxed text-[#6b5f4d]">
				<strong>About Correlations:</strong> These insights are based on statistical analysis of
				your session data. Correlation does not imply causation — patterns may be influenced by
				factors not captured. Use insights as guidance to experiment with training conditions.
				Minimum {minSessionsRequired} sessions required for analysis.
			</p>
		</div>
	{/if}
</div>
