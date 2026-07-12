<!--
  Performance Engine v8.1 — Example Component
  
  Shows how to use enhanced messaging and feedback
-->

<script lang="ts">
	import type { CrossSessionReport } from '$lib/performance-engine/crossSession';
	import {
		buildCrossSessionMessaging,
		buildEnhancedRecommendations
	} from '$lib/performance-engine/crossSession';
	import {
		sendInsightFeedback,
		buildHeadlineFeedback,
		buildRecommendationFeedback
	} from '$lib/performance-feedback';
	import type { FeedbackResponse } from '$lib/performance-feedback';

	interface Props {
		report: CrossSessionReport;
		detailLevel?: 'grom' | 'rider' | 'elite' | 'coach';
		riderId?: string;
	}

	let { report, detailLevel = 'rider', riderId }: Props = $props();

	// Use v8.1 messaging
	const messaging = $derived(buildCrossSessionMessaging(report));
	const recommendations = $derived(buildEnhancedRecommendations(report));

	// Filter recommendations by detail level
	const visibleRecommendations = $derived.by(() => {
		if (detailLevel === 'grom') return recommendations.slice(0, 1);
		if (detailLevel === 'rider') return recommendations.slice(0, 2);
		if (detailLevel === 'elite') return recommendations.slice(0, 3);
		return recommendations; // coach gets all
	});

	// Track feedback state
	let feedbackSubmitted = $state(false);

	// Handle feedback submission
	async function handleHeadlineFeedback(response: FeedbackResponse) {
		const payload = buildHeadlineFeedback(messaging.headline, response, {
			detailLevel,
			riderId,
			context: {
				overallTrend: report.overallTrend,
				confidence: report.confidence,
				priority: messaging.priority
			}
		});

		const result = await sendInsightFeedback(payload);

		if (result.success) {
			feedbackSubmitted = true;
			// Feedback submitted successfully - could show a toast notification here
		}
	}

	async function handleRecommendationFeedback(rec: string, response: FeedbackResponse) {
		const payload = buildRecommendationFeedback(rec, response, {
			detailLevel,
			riderId,
			context: {
				overallTrend: report.overallTrend
			}
		});

		await sendInsightFeedback(payload);
	}
</script>

<section class="progress-panel">
	<!-- Header with v8.1 Messaging -->
	<div class="panel-header">
		<div class="header-text">
			<p class="section-label">Cross-Session Intelligence • v8.1</p>
			<h3 class="panel-title">Progress Overview</h3>

			<!-- Use messaging.headline instead of report.headline -->
			<p class="headline">{messaging.headline}</p>

			{#if detailLevel === 'elite' || detailLevel === 'coach'}
				<p class="summary">{messaging.summary}</p>
			{/if}
		</div>

		{#if report.status === 'ready'}
			<div class="trend-badge" class:priority-high={messaging.priority === 'high'}>
				<p class="badge-label">Priority</p>
				<p class="badge-value">{messaging.priority}</p>
			</div>
		{/if}
	</div>

	<!-- Why This Matters (Elite/Coach only) -->
	{#if (detailLevel === 'elite' || detailLevel === 'coach') && report.status === 'ready'}
		<div class="why-matters">
			<h4>Why This Matters</h4>
			<p>{messaging.whyThisMatters}</p>
		</div>
	{/if}

	<!-- Enhanced Recommendations -->
	{#if visibleRecommendations.length > 0}
		<div class="recommendations-section">
			<h4>Recommended Focus</h4>

			{#each visibleRecommendations as rec}
				<div class="recommendation-card" class:priority-high={rec.priority === 'high'}>
					<div class="rec-header">
						<span class="rec-text">{rec.text}</span>
						<span class="rec-priority">{rec.priority}</span>
					</div>

					{#if detailLevel === 'elite' || detailLevel === 'coach'}
						<p class="rec-reason">{rec.reason}</p>
						<p class="rec-category">Category: {rec.category}</p>
					{/if}

					<!-- Feedback buttons (example) -->
					{#if detailLevel === 'coach'}
						<div class="feedback-actions">
							<button onclick={() => handleRecommendationFeedback(rec.text, 'useful')}>
								👍 Useful
							</button>
							<button onclick={() => handleRecommendationFeedback(rec.text, 'not-useful')}>
								👎 Not useful
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Feedback Section (optional, shows at bottom) -->
	{#if !feedbackSubmitted && (detailLevel === 'rider' || detailLevel === 'elite' || detailLevel === 'coach')}
		<div class="feedback-section">
			<p class="feedback-prompt">Was this insight helpful?</p>
			<div class="feedback-buttons">
				<button class="feedback-btn useful" onclick={() => handleHeadlineFeedback('useful')}>
					👍 Yes, helpful
				</button>
				<button
					class="feedback-btn not-useful"
					onclick={() => handleHeadlineFeedback('not-useful')}
				>
					👎 Not helpful
				</button>
				<button class="feedback-btn confusing" onclick={() => handleHeadlineFeedback('confusing')}>
					🤔 Confusing
				</button>
			</div>
		</div>
	{:else if feedbackSubmitted}
		<div class="feedback-thanks">
			<p>✓ Thanks for your feedback!</p>
		</div>
	{/if}
</section>

<style>
	.progress-panel {
		background: var(--theme-surface, #131010);
		border: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
		border-radius: 18px;
		padding: 1.5rem;
		color: var(--theme-text-primary, #ffffff);
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}

	.section-label {
		margin: 0;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-jns-amber, #f5a623);
		font-weight: 600;
	}

	.panel-title {
		margin: 0.25rem 0 0;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.headline {
		margin: 0.5rem 0 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-jns-mint, #3de8c8);
	}

	.summary {
		margin: 0.75rem 0 0;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.6;
	}

	.trend-badge {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 1rem;
		text-align: center;
		min-width: 120px;
	}

	.trend-badge.priority-high {
		background: rgba(245, 166, 35, 0.15);
		border: 1px solid rgba(245, 166, 35, 0.3);
	}

	.badge-label {
		margin: 0;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.badge-value {
		margin: 0.5rem 0 0;
		font-size: 1.125rem;
		font-weight: 700;
		text-transform: capitalize;
	}

	.why-matters {
		background: rgba(61, 232, 200, 0.1);
		border: 1px solid rgba(61, 232, 200, 0.2);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.why-matters h4 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		color: var(--color-jns-mint, #3de8c8);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.why-matters p {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.8);
	}

	.recommendations-section {
		margin-top: 1.5rem;
	}

	.recommendations-section h4 {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		color: var(--color-jns-amber, #f5a623);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.recommendation-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 0.75rem;
	}

	.recommendation-card.priority-high {
		border-color: rgba(245, 166, 35, 0.3);
		background: rgba(245, 166, 35, 0.05);
	}

	.rec-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.rec-text {
		flex: 1;
		font-weight: 600;
		font-size: 0.9375rem;
	}

	.rec-priority {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		text-transform: capitalize;
	}

	.rec-reason {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.5;
	}

	.rec-category {
		margin: 0.5rem 0 0;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: capitalize;
	}

	.feedback-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.feedback-actions button {
		font-size: 0.75rem;
		padding: 0.25rem 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: white;
		cursor: pointer;
	}

	.feedback-actions button:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.feedback-section {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.feedback-prompt {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.feedback-buttons {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.feedback-btn {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.05);
		color: white;
		cursor: pointer;
		transition: all 0.2s;
	}

	.feedback-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.feedback-thanks {
		margin-top: 2rem;
		padding: 1rem;
		background: rgba(61, 232, 200, 0.1);
		border-radius: 8px;
		text-align: center;
	}

	.feedback-thanks p {
		margin: 0;
		color: var(--color-jns-mint, #3de8c8);
		font-weight: 600;
	}
</style>
