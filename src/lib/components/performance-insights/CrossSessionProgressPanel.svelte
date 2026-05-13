<!--
  Performance Engine v8.0 — Cross-Session Progress Panel
  
  Turns cross-session intelligence into a compact, useful product experience.
  Engine calculates. UI selects and explains.
-->

<script lang="ts">
  import type {
    CrossSessionReport,
    TrendResult,
    OverallTrend
  } from '$lib/performance-engine/crossSession';
  import { submitInsightFeedback } from '$lib/utils/submitInsightFeedback';

  interface Props {
    report: CrossSessionReport;
    detailLevel?: 'grom' | 'rider' | 'elite' | 'coach';
    sessionId?: string;
  }

  let { report, detailLevel = 'rider', sessionId }: Props = $props();

  // Feedback state
  let feedbackSubmitted = $state(false);
  let feedbackLoading = $state(false);

  async function handleFeedback(response: 'useful' | 'not-useful' | 'confusing') {
    if (feedbackLoading || feedbackSubmitted) return;

    feedbackLoading = true;

    const result = await submitInsightFeedback({
      insightType: 'cross-session-headline',
      content: report.headline,
      response,
      detailLevel,
      sessionId,
      context: {
        overallTrend: report.overallTrend,
        confidence: report.confidence,
        status: report.status
      }
    });

    feedbackLoading = false;

    if (result.success) {
      feedbackSubmitted = true;
      // Reset after 3 seconds
      setTimeout(() => {
        feedbackSubmitted = false;
      }, 3000);
    }
  }

  // Overall trend visualization
  const trendIcon = (trend: OverallTrend): string => {
    switch (trend) {
      case 'improving':
        return '↗';
      case 'declining':
        return '↘';
      case 'mixed':
        return '↕';
      case 'stable':
        return '→';
      default:
        return '—';
    }
  };

  const trendLabel = (trend: OverallTrend): string => {
    switch (trend) {
      case 'improving':
        return 'Improving';
      case 'declining':
        return 'Declining';
      case 'mixed':
        return 'Mixed';
      case 'stable':
        return 'Stable';
      default:
        return 'Unknown';
    }
  };

  const trendColor = (trend: OverallTrend): string => {
    switch (trend) {
      case 'improving':
        return '#3de8c8';
      case 'declining':
        return '#ff4444';
      case 'mixed':
        return '#f5a623';
      case 'stable':
        return '#a0a0a0';
      default:
        return '#808080';
    }
  };

  // Format metric changes
  const formatChange = (value: number | null, unit: string, decimals = 1): string => {
    if (value === null || !Number.isFinite(value)) return '—';
    const sign = value >= 0 ? '+' : '';
    const formatted = value.toFixed(decimals);
    return `${sign}${formatted}${unit}`;
  };

  // Trend status icon
  const trendStatusIcon = (improving: boolean): string => {
    return improving ? '✓' : '⚠';
  };

  const trendStatusColor = (improving: boolean): string => {
    return improving ? '#3de8c8' : '#f5a623';
  };

  // Define insights with metadata for display
  interface InsightDisplay {
    label: string;
    trend: TrendResult;
    unit: string;
    decimals: number;
  }

  // Build all insights array
  const allInsights = $derived(
    [
      {
        label: 'Speed',
        trend: report.performance.speedTrend,
        unit: ' km/h',
        decimals: 1
      },
      {
        label: 'Reaction Time',
        trend: report.performance.reactionTrend,
        unit: 's',
        decimals: 3
      },
      {
        label: 'Peak G-Force',
        trend: report.performance.peakGTrend,
        unit: 'g',
        decimals: 1
      },
      {
        label: 'Repeatability',
        trend: report.consistency.repeatabilityTrend,
        unit: ' pts',
        decimals: 0
      },
      {
        label: 'Consistency Gap',
        trend: report.consistency.bestVsAverageGapTrend,
        unit: '%',
        decimals: 1
      },
      {
        label: 'Drop-off Point',
        trend: report.fatigue.dropOffTrend,
        unit: ' runs',
        decimals: 0
      },
      {
        label: 'Set Capacity',
        trend: report.fatigue.optimalSetLengthTrend,
        unit: ' runs',
        decimals: 0
      }
    ].filter((insight) => insight.trend.direction !== 'unknown')
  );

  // Detail level filtering
  const keyInsights = $derived.by(() => {
    if (detailLevel === 'grom') {
      // Show only speed trend
      return allInsights.slice(0, 1);
    } else if (detailLevel === 'rider') {
      // Show speed and reaction time
      return allInsights.slice(0, 2);
    } else {
      // Elite and Coach show all insights
      return allInsights;
    }
  });

  const visibleWarnings = $derived.by(() => {
    if (detailLevel === 'grom') {
      return [];
    } else if (detailLevel === 'rider') {
      return report.warnings.slice(0, 1);
    } else {
      // Elite and Coach show all warnings
      return report.warnings;
    }
  });

  const visibleRecommendations = $derived.by(() => {
    if (detailLevel === 'grom') {
      return report.recommendations.slice(0, 1);
    } else if (detailLevel === 'rider') {
      return report.recommendations.slice(0, 2);
    } else {
      // Elite and Coach show all recommendations
      return report.recommendations;
    }
  });

  // Simple headline for grom users
  const simpleHeadline = $derived.by(() => {
    if (report.status === 'insufficient-data') {
      return 'Keep logging sessions to unlock progress trends! 🚀';
    }

    switch (report.overallTrend) {
      case 'improving':
        return "You're getting faster! Keep it up! 🚀";
      case 'declining':
        return 'Time to review your approach 🤔';
      case 'mixed':
        return "You're making progress in some areas! 💪";
      case 'stable':
        return "You're staying consistent! 👍";
      default:
        return 'Keep training to see trends! 📊';
    }
  });

  const displayHeadline = $derived(detailLevel === 'grom' ? simpleHeadline : report.headline);
</script>

<section class="progress-panel">
  <!-- Header -->
  <div class="panel-header">
    <div class="header-text">
      <p class="section-label">Cross-Session Intelligence</p>
      <h3 class="panel-title">Progress Overview</h3>
      <p class="headline">{displayHeadline}</p>
    </div>

    {#if report.status === 'ready'}
      <div class="trend-badge">
        <p class="badge-label">Overall Trend</p>
        <p class="badge-value" style="color: {trendColor(report.overallTrend)}">
          <span class="trend-icon">{trendIcon(report.overallTrend)}</span>
          {trendLabel(report.overallTrend)}
        </p>
        <p class="confidence-label">{report.confidence} confidence</p>
      </div>
    {/if}
  </div>

  <!-- Main Content -->
  {#if report.status === 'insufficient-data'}
    <!-- Insufficient data notice -->
    <div class="notice-card notice-warning">
      <p class="notice-icon">📊</p>
      <div>
        <p class="notice-title">Not enough data yet</p>
        <p class="notice-text">
          {report.warnings[0] || `Log at least 3 sessions to see progress trends.`}
        </p>
      </div>
    </div>
  {:else}
    <!-- Key Insights Grid -->
    <div class="insights-grid">
      {#each keyInsights as insight}
        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-label">{insight.label}</span>
            <span
              class="insight-status"
              style="color: {trendStatusColor(insight.trend.improving)}"
            >
              {trendStatusIcon(insight.trend.improving)}
            </span>
          </div>

          <p class="insight-change">
            {formatChange(insight.trend.change, insight.unit, insight.decimals)}
          </p>

          {#if insight.trend.changePercent !== null && detailLevel !== 'grom'}
            <p class="insight-percent">
              ({formatChange(insight.trend.changePercent, '%', 1)})
            </p>
          {/if}

          {#if detailLevel === 'elite' || detailLevel === 'coach'}
            <div class="insight-detail">
              <span class="detail-value">Recent: {insight.trend.recent?.toFixed(insight.decimals) ?? '—'}</span>
              <span class="detail-separator">•</span>
              <span class="detail-value"
                >Historical: {insight.trend.historical?.toFixed(insight.decimals) ?? '—'}</span
              >
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Warnings -->
    {#if visibleWarnings.length > 0}
      <div class="notice-card notice-warning">
        <p class="notice-icon">⚠️</p>
        <div class="notice-content">
          <p class="notice-title">Watch-outs</p>
          <ul class="notice-list">
            {#each visibleWarnings as warning}
              <li>{warning}</li>
            {/each}
          </ul>
        </div>
      </div>
    {/if}

    <!-- Recommendations -->
    {#if visibleRecommendations.length > 0}
      <div class="notice-card notice-recommendation">
        <p class="notice-icon">💡</p>
        <div class="notice-content">
          <p class="notice-title">Recommended Focus</p>
          <ol class="notice-list">
            {#each visibleRecommendations as recommendation}
              <li>{recommendation}</li>
            {/each}
          </ol>
        </div>
      </div>
    {/if}

    <!-- Feedback Section -->
    <div class="feedback-section">
      {#if feedbackSubmitted}
        <p class="feedback-thanks">Thanks for your feedback! 👍</p>
      {:else}
        <p class="feedback-prompt">Was this insight helpful?</p>
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

    <!-- Coach Detail (Coach level only) -->
    {#if detailLevel === 'coach'}
      <div class="coach-detail">
        <h4 class="coach-detail-title">Coach Detail</h4>
        <div class="coach-grid">
          <!-- Performance -->
          <div class="coach-section">
            <p class="coach-section-label">Performance</p>
            <div class="coach-metrics">
              <div class="coach-metric">
                <span class="coach-metric-name">Speed:</span>
                <span class="coach-metric-value">
                  {report.performance.speedTrend.direction}
                  {#if report.performance.speedTrend.change !== null}
                    ({formatChange(report.performance.speedTrend.change, ' km/h', 1)})
                  {/if}
                  <span
                    class="coach-status"
                    style="color: {trendStatusColor(report.performance.speedTrend.improving)}"
                  >
                    {trendStatusIcon(report.performance.speedTrend.improving)}
                  </span>
                </span>
              </div>
              <div class="coach-metric">
                <span class="coach-metric-name">Reaction:</span>
                <span class="coach-metric-value">
                  {report.performance.reactionTrend.direction}
                  {#if report.performance.reactionTrend.change !== null}
                    ({formatChange(report.performance.reactionTrend.change, 's', 3)})
                  {/if}
                  <span
                    class="coach-status"
                    style="color: {trendStatusColor(report.performance.reactionTrend.improving)}"
                  >
                    {trendStatusIcon(report.performance.reactionTrend.improving)}
                  </span>
                </span>
              </div>
              <div class="coach-metric">
                <span class="coach-metric-name">Peak G:</span>
                <span class="coach-metric-value">
                  {report.performance.peakGTrend.direction}
                  {#if report.performance.peakGTrend.change !== null}
                    ({formatChange(report.performance.peakGTrend.change, 'g', 1)})
                  {/if}
                  <span
                    class="coach-status"
                    style="color: {trendStatusColor(report.performance.peakGTrend.improving)}"
                  >
                    {trendStatusIcon(report.performance.peakGTrend.improving)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <!-- Consistency -->
          <div class="coach-section">
            <p class="coach-section-label">Consistency</p>
            <div class="coach-metrics">
              <div class="coach-metric">
                <span class="coach-metric-name">Repeatability:</span>
                <span class="coach-metric-value">
                  {report.consistency.repeatabilityTrend.direction}
                  {#if report.consistency.repeatabilityTrend.change !== null}
                    ({formatChange(report.consistency.repeatabilityTrend.change, ' pts', 0)})
                  {/if}
                  <span
                    class="coach-status"
                    style="color: {trendStatusColor(report.consistency.repeatabilityTrend.improving)}"
                  >
                    {trendStatusIcon(report.consistency.repeatabilityTrend.improving)}
                  </span>
                </span>
              </div>
              <div class="coach-metric">
                <span class="coach-metric-name">Best vs Avg Gap:</span>
                <span class="coach-metric-value">
                  {report.consistency.bestVsAverageGapTrend.direction}
                  {#if report.consistency.bestVsAverageGapTrend.change !== null}
                    ({formatChange(report.consistency.bestVsAverageGapTrend.change, '%', 1)})
                  {/if}
                  <span
                    class="coach-status"
                    style="color: {trendStatusColor(report.consistency.bestVsAverageGapTrend.improving)}"
                  >
                    {trendStatusIcon(report.consistency.bestVsAverageGapTrend.improving)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <!-- Capacity -->
          <div class="coach-section">
            <p class="coach-section-label">Capacity</p>
            <div class="coach-metrics">
              <div class="coach-metric">
                <span class="coach-metric-name">Drop-off Point:</span>
                <span class="coach-metric-value">
                  {report.fatigue.dropOffTrend.direction}
                  {#if report.fatigue.dropOffTrend.change !== null}
                    ({formatChange(report.fatigue.dropOffTrend.change, ' runs', 0)})
                  {/if}
                  <span
                    class="coach-status"
                    style="color: {trendStatusColor(report.fatigue.dropOffTrend.improving)}"
                  >
                    {trendStatusIcon(report.fatigue.dropOffTrend.improving)}
                  </span>
                </span>
              </div>
              <div class="coach-metric">
                <span class="coach-metric-name">Optimal Set Length:</span>
                <span class="coach-metric-value">
                  {report.fatigue.optimalSetLengthTrend.direction}
                  {#if report.fatigue.optimalSetLengthTrend.change !== null}
                    ({formatChange(report.fatigue.optimalSetLengthTrend.change, ' runs', 0)})
                  {/if}
                  <span
                    class="coach-status"
                    style="color: {trendStatusColor(report.fatigue.optimalSetLengthTrend.improving)}"
                  >
                    {trendStatusIcon(report.fatigue.optimalSetLengthTrend.improving)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
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

  /* Header */
  .panel-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (min-width: 768px) {
    .panel-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
    }
  }

  .header-text {
    flex: 1;
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
    color: var(--theme-text-primary, #ffffff);
  }

  .headline {
    margin: 0.5rem 0 0;
    font-size: 0.95rem;
    color: var(--theme-text-secondary, rgba(255, 255, 255, 0.7));
    line-height: 1.5;
  }

  .trend-badge {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
    min-width: 180px;
  }

  .badge-label {
    margin: 0;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .badge-value {
    margin: 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .trend-icon {
    font-size: 1.75rem;
  }

  .confidence-label {
    margin: 0;
    font-size: 0.75rem;
    text-transform: capitalize;
    color: rgba(255, 255, 255, 0.5);
  }

  /* Notice Cards */
  .notice-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .notice-warning {
    background: rgba(245, 166, 35, 0.1);
    border: 1px solid rgba(245, 166, 35, 0.3);
  }

  .notice-recommendation {
    background: rgba(61, 232, 200, 0.1);
    border: 1px solid rgba(61, 232, 200, 0.3);
  }

  .notice-icon {
    margin: 0;
    font-size: 1.5rem;
    line-height: 1;
  }

  .notice-content {
    flex: 1;
  }

  .notice-title {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .notice-warning .notice-title {
    color: var(--color-jns-amber, #f5a623);
  }

  .notice-recommendation .notice-title {
    color: var(--color-jns-mint, #3de8c8);
  }

  .notice-text {
    margin: 0;
    font-size: 0.875rem;
    color: var(--theme-text-secondary, rgba(255, 255, 255, 0.8));
    line-height: 1.5;
  }

  .notice-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.875rem;
    color: var(--theme-text-secondary, rgba(255, 255, 255, 0.8));
    line-height: 1.6;
  }

  .notice-list li {
    margin-bottom: 0.25rem;
  }

  .notice-list li:last-child {
    margin-bottom: 0;
  }

  /* Insights Grid */
  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 640px) {
    .insights-grid {
      grid-template-columns: 1fr;
    }
  }

  .insight-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
  }

  .insight-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .insight-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--theme-text-primary, #ffffff);
  }

  .insight-status {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .insight-change {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-jns-mint, #3de8c8);
  }

  .insight-percent {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .insight-detail {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .detail-value {
    flex: 1;
  }

  .detail-separator {
    opacity: 0.3;
  }

  /* Coach Detail */
  .coach-detail {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    margin-top: 1rem;
  }

  .coach-detail-title {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-jns-amber, #f5a623);
    font-weight: 700;
  }

  .coach-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    .coach-grid {
      grid-template-columns: 1fr;
    }
  }

  .coach-section-label {
    margin: 0 0 0.75rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 600;
  }

  .coach-metrics {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .coach-metric {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  .coach-metric-name {
    color: rgba(255, 255, 255, 0.6);
  }

  .coach-metric-value {
    color: var(--theme-text-primary, #ffffff);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .coach-status {
    font-size: 1rem;
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
    color: var(--theme-text-primary, #ffffff);
    text-align: center;
  }

  .feedback-thanks {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-jns-mint, #3de8c8);
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
    background: var(--theme-bg, rgba(255, 255, 255, 0.1));
    border: 1px solid var(--theme-border, rgba(255, 255, 255, 0.2));
    color: var(--theme-text-primary, #ffffff);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .feedback-btn:hover:not(:disabled) {
    background: var(--theme-surface-hover, rgba(255, 255, 255, 0.15));
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
    border-color: var(--color-jns-mint, #3de8c8);
    background: rgba(61, 232, 200, 0.1);
  }

  .feedback-btn-confusing:hover:not(:disabled) {
    border-color: var(--color-jns-amber, #f5a623);
    background: rgba(245, 166, 35, 0.1);
  }

  .feedback-btn-not-useful:hover:not(:disabled) {
    border-color: #ff4444;
    background: rgba(255, 68, 68, 0.1);
  }
</style>
