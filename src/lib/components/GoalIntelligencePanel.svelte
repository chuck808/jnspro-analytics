<script lang="ts">
	import {
		forecastGoalAchievement,
		suggestGoals,
		calculateGoalAlignment
	} from '$lib/utils/goalForecasting';

	interface Props {
		goals: any[];
		sessions: any[];
		currentValues: Record<string, number | null>;
	}

	let { goals, sessions, currentValues }: Props = $props();

	// Calculate forecasts for active goals
	let goalForecasts = $derived(
		goals
			.filter((g) => !g.completed_at)
			.map((goal) => {
				const current = currentValues[goal.metric] ?? goal.current_value;
				if (!current || !goal.target_value) return null;

				const forecast = forecastGoalAchievement(sessions, goal.metric, goal.target_value, current);

				const alignment = calculateGoalAlignment(sessions, goal.metric, goal.target_value, current);

				return {
					goalId: goal.id,
					metric: goal.metric,
					forecast,
					alignment
				};
			})
			.filter((f): f is NonNullable<typeof f> => f !== null)
	);

	// Get smart suggestions
	let suggestions = $derived(suggestGoals(sessions));

	function getMetricLabel(metric: string): string {
		const labels: Record<string, string> = {
			reactionTime: 'Reaction Time',
			peakSpeed: 'Peak Speed',
			maxG: 'Peak G-Force',
			consistency: 'Consistency',
			elapsedTime: 'Elapsed Time',
			accelerationPhase: 'Acceleration Phase',
			endurance: 'Gates per Session'
		};
		return labels[metric] ?? metric;
	}

	function formatValue(metric: string, value: number): string {
		if (metric === 'reactionTime') return `${(value / 1000).toFixed(3)}s`;
		if (metric === 'peakSpeed') return `${value.toFixed(1)} km/h`;
		if (metric === 'maxG') return `${value.toFixed(2)}G`;
		if (metric === 'consistency') return `${value.toFixed(1)}%`;
		return value.toFixed(2);
	}

	function confidenceColor(confidence: string): string {
		if (confidence === 'high') return '#3de8c8';
		if (confidence === 'medium') return '#f5a623';
		return '#9a8f7a';
	}

	function alignmentColor(score: number): string {
		if (score >= 80) return '#3de8c8';
		if (score >= 60) return '#f5a623';
		if (score >= 40) return '#ffcc44';
		return '#ff4444';
	}
</script>

{#if sessions.length >= 3}
	<div class="space-y-5">
		<!-- Goal Forecasts -->
		{#if goalForecasts.length > 0}
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
				<div class="mb-4">
					<h3 class="text-sm font-semibold text-[#f0ece4]">🔮 Goal Forecasts</h3>
					<p class="mt-1 text-xs text-[#6b5f4d]">
						AI-powered predictions based on your performance trends
					</p>
				</div>

				<div class="space-y-4">
					{#each goalForecasts as forecast}
						{@const goal = goals.find((g) => g.id === forecast.goalId)}
						{#if goal}
							<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
								<div class="mb-3 flex items-start justify-between gap-4">
									<div>
										<p class="text-sm font-semibold text-[#f0ece4]">
											{getMetricLabel(forecast.metric)}
										</p>
										<p class="mt-0.5 text-xs text-[#9a8f7a]">
											Target: {formatValue(forecast.metric, goal.target_value)}
										</p>
									</div>
									<span
										class="rounded px-2 py-1 text-xs"
										style="background:{confidenceColor(
											forecast.forecast.confidence
										)}20; color:{confidenceColor(forecast.forecast.confidence)}"
									>
										{forecast.forecast.confidence} confidence
									</span>
								</div>

								<!-- Forecast Message -->
								<div class="mb-3 flex items-start gap-2">
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
									<p class="text-xs text-[#9a8f7a]">{forecast.forecast.message}</p>
								</div>

								<!-- Alignment Score -->
								<div class="mt-3 border-t border-[#221c18] pt-3">
									<div class="mb-2 flex items-center justify-between">
										<span class="text-xs text-[#6b5f4d]">Goal Alignment</span>
										<span
											class="text-xs font-bold"
											style="color:{alignmentColor(forecast.alignment.score)}"
										>
											{forecast.alignment.score}/100
										</span>
									</div>
									<div class="mb-2 h-2 w-full rounded-full bg-[#221c18]">
										<div
											class="h-2 rounded-full transition-all"
											style="width:{forecast.alignment.score}%; background:{alignmentColor(
												forecast.alignment.score
											)}"
										></div>
									</div>
									<p class="text-xs text-[#9a8f7a]">{forecast.alignment.feedback}</p>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Smart Suggestions -->
		{#if suggestions.length > 0 && goals.filter((g) => !g.completed_at).length < 3}
			<div class="rounded-xl border border-[#f5a623]/20 bg-[#131010] p-5">
				<div class="mb-4">
					<h3 class="text-sm font-semibold text-[#f5a623]">💡 Smart Goal Suggestions</h3>
					<p class="mt-1 text-xs text-[#6b5f4d]">
						Personalized recommendations based on your training data
					</p>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each suggestions.slice(0, 2) as suggestion}
						<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
							<div class="mb-2 flex items-start justify-between gap-2">
								<p class="text-sm font-semibold text-[#f0ece4]">
									{getMetricLabel(suggestion.metric)}
								</p>
								<span
									class="rounded bg-[#f5a623]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#f5a623]"
								>
									{suggestion.confidence} conf.
								</span>
							</div>

							<div class="space-y-2 text-xs">
								<div class="flex justify-between">
									<span class="text-[#6b5f4d]">Current:</span>
									<span class="text-[#9a8f7a]"
										>{formatValue(suggestion.metric, suggestion.currentValue)}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-[#6b5f4d]">Suggested:</span>
									<span class="font-semibold text-[#3de8c8]"
										>{formatValue(suggestion.metric, suggestion.suggestedTarget)}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-[#6b5f4d]">Timeframe:</span>
									<span class="text-[#9a8f7a]">{suggestion.timeframe}</span>
								</div>
							</div>

							<p class="mt-3 text-xs text-[#9a8f7a] italic">{suggestion.rationale}</p>

							<button
								class="mt-3 w-full rounded-lg border border-[#f5a623]/20 bg-[#f5a623]/10
                                           px-3 py-2 text-xs font-semibold text-[#f5a623]
                                           transition-colors hover:border-[#f5a623]/40 hover:bg-[#f5a623]/20
                                           focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
							>
								Create this goal
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6 text-center">
		<p class="text-sm text-[#9a8f7a]">
			Complete 3+ sessions to unlock AI-powered goal forecasting and suggestions
		</p>
	</div>
{/if}
