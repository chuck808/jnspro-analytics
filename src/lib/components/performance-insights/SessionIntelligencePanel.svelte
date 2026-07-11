<script lang="ts">
	import type { SessionIntelligenceReport } from '$lib/performance-engine/sessionIntelligence';
	import type { SessionNarrative } from '$lib/performance-engine/language/types';
	import { submitInsightFeedback } from '$lib/utils/submitInsightFeedback';

	interface Props {
		report: SessionIntelligenceReport;
		narrative?: SessionNarrative | null;
		detailLevel?: 'grom' | 'rider' | 'elite' | 'coach';
		sessionId?: string;
	}

	let { report, narrative = null, detailLevel = 'rider', sessionId }: Props = $props();

	// v8.5: headline and recommendations come from the narrative when available.
	// Falls back to generic strings derived from the intelligence report so the
	// panel still renders sensibly when narrative is not passed.
	const displayHeadline = $derived(
		narrative?.message?.headline ??
			(report.dropOff
				? `Quality drops at run ${report.dropOff.dropOffRun}`
				: report.fatigue.trend === 'declining'
					? 'Performance drops across the set'
					: report.repeatability.overall > 80
						? 'Consistent session'
						: 'Mixed session quality')
	);

	const displayRecommendations = $derived(narrative?.recommendations ?? []);

	// Feedback state
	let feedbackSubmitted = $state(false);
	let feedbackLoading = $state(false);

	async function handleFeedback(response: 'useful' | 'not-useful' | 'confusing') {
		if (feedbackLoading || feedbackSubmitted) return;

		feedbackLoading = true;

		const result = await submitInsightFeedback({
			insightType: 'session-intelligence',
			content: displayHeadline,
			response,
			detailLevel,
			sessionId,
			context: {
				sessionQuality: report.sessionQuality,
				repeatabilityScore: report.repeatability.overall,
				optimalSetLength: report.setLength.optimal
			}
		});

		feedbackLoading = false;

		if (result.success) {
			feedbackSubmitted = true;
			setTimeout(() => {
				feedbackSubmitted = false;
			}, 3000);
		}
	}

	const qualityColor = $derived(
		report.sessionQuality >= 80 ? '#3de8c8' : report.sessionQuality >= 60 ? '#f5a623' : '#ff4444'
	);

</script>

<section class="intelligence-panel">
	<div class="panel-header">
		<h3>Session Intelligence</h3>
		<p>{displayHeadline}</p>
	</div>

	<div class="metrics-grid">
		<div class="metric-card">
			<span class="metric-label">Session Quality</span>
			<span class="metric-value" style="color: {qualityColor}">
				{Math.round(report.sessionQuality)}<span class="metric-unit">/100</span>
			</span>
		</div>

		<div class="metric-card">
			<span class="metric-label">Optimal Set Length</span>
			<span class="metric-value" style="color: {report.dropOff ? '#ff4444' : '#3de8c8'}">
				{report.setLength.optimal}<span class="metric-unit"> runs</span>
			</span>
			{#if report.dropOff}
				<span class="metric-hint">Drop-off at run {report.dropOff.dropOffRun}</span>
			{/if}
		</div>

		<div class="metric-card">
			<span class="metric-label">Repeatability</span>
			<span
				class="metric-value"
				style="color: {report.repeatability.overall >= 70 ? '#3de8c8' : '#f5a623'}"
			>
				{Math.round(report.repeatability.overall)}<span class="metric-unit">/100</span>
			</span>
		</div>
	</div>

	{#if report.bestVsAvg}
		<div class="best-vs-avg-card">
			<h4>Best vs Average Performance</h4>
			<div class="comparison-grid">
				<div>
					<span class="label">Best Run</span>
					<span class="value highlight">{report.bestVsAvg.best.toFixed(1)} km/h</span>
				</div>
				<div>
					<span class="label">Average</span>
					<span class="value">{report.bestVsAvg.average.toFixed(1)} km/h</span>
				</div>
				<div>
					<span class="label">Gap</span>
					<span
						class="value"
						style="color: {report.bestVsAvg.consistencyType === 'consistent'
							? '#3de8c8'
							: report.bestVsAvg.consistencyType === 'moderate'
								? '#f5a623'
								: '#ff4444'}"
					>
						{report.bestVsAvg.gapPercent.toFixed(1)}%
					</span>
				</div>
				<div>
					<span class="label">Type</span>
					<span class="value">{report.bestVsAvg.consistencyType}</span>
				</div>
			</div>
		</div>
	{/if}

	{#if displayRecommendations.length > 0}
		<div class="recommendations">
			<h4>Focus areas</h4>
			<ul>
				{#each displayRecommendations as rec}
					<li>
						<strong>{rec.title}</strong>
						{#if rec.body !== rec.title}
							— {rec.body}
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<details class="advanced-metrics">
		<summary>Advanced Metrics</summary>
		<div class="advanced-grid">
			<div>
				<span class="label">Reaction Std Dev</span>
				<span class="value">{report.repeatability.reactionStd.toFixed(3)}s</span>
			</div>
			<div>
				<span class="label">Speed Std Dev</span>
				<span class="value">{report.repeatability.speedStd.toFixed(2)} km/h</span>
			</div>
			<div>
				<span class="label">Reaction Score</span>
				<span class="value">{Math.round(report.repeatability.reactionScore)}/100</span>
			</div>
			<div>
				<span class="label">Speed Score</span>
				<span class="value">{Math.round(report.repeatability.speedScore)}/100</span>
			</div>
			{#if report.fatigue.diff !== undefined}
				<div>
					<span class="label">Performance Drift</span>
					<span class="value"
						>{report.fatigue.diff > 0 ? '+' : ''}{report.fatigue.diff.toFixed(2)} km/h</span
					>
				</div>
			{/if}
		</div>
	</details>

	<!-- Feedback Section -->
	<div class="feedback-section">
		{#if feedbackSubmitted}
			<p class="feedback-thanks">Thanks for your feedback! 👍</p>
		{:else}
			<p class="feedback-prompt">Was this session analysis helpful?</p>
			<div class="feedback-buttons">
				<button
					class="feedback-btn feedback-btn-useful"
					onclick={() => handleFeedback('useful')}
					disabled={feedbackLoading}
				>
					👍 Helpful
				</button>
				<button
					class="feedback-btn feedback-btn-confusing"
					onclick={() => handleFeedback('confusing')}
					disabled={feedbackLoading}
				>
					🤔 Confusing
				</button>
				<button
					class="feedback-btn feedback-btn-not-useful"
					onclick={() => handleFeedback('not-useful')}
					disabled={feedbackLoading}
				>
					👎 Not helpful
				</button>
			</div>
		{/if}
	</div>
</section>

<style>
	.intelligence-panel {
		background: var(--theme-surface);
		border: 1px solid var(--theme-border);
		border-radius: 18px;
		padding: 1.5rem;
		color: var(--theme-text-primary);
	}

	.panel-header {
		margin-bottom: 1.5rem;
	}

	h3 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--theme-text-primary);
	}

	.panel-header p {
		margin: 0.5rem 0 0;
		color: var(--theme-text-secondary);
		font-size: 0.95rem;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.metric-card {
		background: var(--theme-bg);
		border: 1px solid var(--theme-border);
		border-radius: 12px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.metric-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--theme-text-subtle);
		font-weight: 600;
	}

	.metric-value {
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1;
	}

	.metric-unit {
		font-size: 1rem;
		font-weight: 500;
		opacity: 0.7;
	}

	.metric-hint {
		font-size: 0.75rem;
		color: var(--theme-text-subtle);
		font-style: italic;
	}

	.best-vs-avg-card {
		background: var(--theme-surface);
		border: 1px solid var(--theme-border);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.best-vs-avg-card h4 {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		color: var(--theme-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.comparison-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
	}

	.comparison-grid > div {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.comparison-grid .label {
		font-size: 0.75rem;
		color: var(--theme-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.comparison-grid .value {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--theme-text-primary);
	}

	.comparison-grid .value.highlight {
		color: var(--color-jns-amber);
	}

	.recommendations {
		background: rgba(245, 166, 35, 0.08);
		border: 1px solid rgba(245, 166, 35, 0.2);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.recommendations h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		color: var(--color-jns-amber);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.recommendations ul {
		margin: 0;
		padding-left: 1.5rem;
		list-style-type: disc;
	}

	.recommendations li {
		color: var(--theme-text-secondary);
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}

	.recommendations li:last-child {
		margin-bottom: 0;
	}

	.advanced-metrics {
		border: 1px solid var(--theme-border);
		border-radius: 12px;
		padding: 0;
		overflow: hidden;
	}

	.advanced-metrics summary {
		padding: 0.75rem 1rem;
		cursor: pointer;
		background: var(--theme-bg);
		color: var(--theme-text-secondary);
		font-size: 0.875rem;
		font-weight: 600;
		user-select: none;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.advanced-metrics summary:hover {
		background: var(--theme-surface-hover);
	}

	.advanced-grid {
		padding: 1rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.75rem;
	}

	.advanced-grid > div {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.advanced-grid .label {
		font-size: 0.75rem;
		color: var(--theme-text-subtle);
	}

	.advanced-grid .value {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--theme-text-primary);
	}

	/* Feedback Section */
	.feedback-section {
		background: rgba(61, 232, 200, 0.05);
		border: 1px solid rgba(61, 232, 200, 0.2);
		border-radius: 12px;
		padding: 1rem;
		margin-top: 1rem;
	}

	.feedback-prompt {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--theme-text-primary);
		text-align: center;
	}

	.feedback-thanks {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-jns-mint);
		text-align: center;
		padding: 0.5rem 0;
	}

	.feedback-buttons {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.feedback-btn {
		background: var(--theme-bg);
		border: 1px solid var(--theme-border);
		color: var(--theme-text-primary);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.feedback-btn:hover:not(:disabled) {
		background: var(--theme-surface-hover);
		transform: translateY(-1px);
	}

	.feedback-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.feedback-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.feedback-btn-useful:hover:not(:disabled) {
		border-color: var(--color-jns-mint);
		background: rgba(61, 232, 200, 0.1);
	}

	.feedback-btn-confusing:hover:not(:disabled) {
		border-color: var(--color-jns-amber);
		background: rgba(245, 166, 35, 0.1);
	}

	.feedback-btn-not-useful:hover:not(:disabled) {
		border-color: #ff4444;
		background: rgba(255, 68, 68, 0.1);
	}

	@media (max-width: 640px) {
		.metrics-grid {
			grid-template-columns: 1fr;
		}

		.advanced-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
