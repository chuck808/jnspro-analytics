
<script lang="ts">
  import type { FeedbackAnalyticsReport } from '$lib/performance-feedback-analytics';

  interface Props {
    report: FeedbackAnalyticsReport;
  }

  let { report }: Props = $props();

  // Calculate actionable insights
  const overallScore = $derived(report.overall.usefulnessScore);
  const confusionRate = $derived(
    report.overall.total > 0 
      ? (report.overall.confusing / report.overall.total) * 100 
      : 0
  );

  // Identify problem insights (< 60% useful or > 30% confusing)
  const problemInsights = $derived(
    report.byInsightType.filter(
      item => item.usefulnessScore < 60 || (item.confusing / item.total) * 100 > 30
    ).sort((a, b) => a.usefulnessScore - b.usefulnessScore)
  );

  // Find best performing insights
  const topInsights = $derived(
    report.byInsightType
      .filter(item => item.total >= 3) // Need at least 3 responses to be meaningful
      .sort((a, b) => b.usefulnessScore - a.usefulnessScore)
      .slice(0, 3)
  );

  // Calculate detail level performance
  const detailLevelIssues = $derived(
    Object.entries(report.byDetailLevel)
      .filter(([_, item]) => item.usefulnessScore < 60)
      .map(([level, item]) => ({ level, score: item.usefulnessScore }))
  );

  // Overall health status
  const healthStatus = $derived.by(() => {
    if (overallScore >= 75) return { label: 'Healthy', color: 'var(--color-jns-mint, #3de8c8)' };
    if (overallScore >= 60) return { label: 'Needs Attention', color: 'var(--color-jns-amber, #f5a623)' };
    return { label: 'Critical', color: '#ff4444' };
  });

  // Actionable recommendations
  const recommendations = $derived.by(() => {
    const recs: string[] = [];
    
    if (confusionRate > 20) {
      recs.push(`High confusion rate (${confusionRate.toFixed(1)}%). Review messaging clarity.`);
    }
    
    if (problemInsights.length > 0) {
      recs.push(`${problemInsights.length} insight type(s) performing poorly. Consider rewording.`);
    }
    
    if (detailLevelIssues.length > 0) {
      const levels = detailLevelIssues.map(i => i.level).join(', ');
      recs.push(`Detail level(s) ${levels} need messaging improvements.`);
    }
    
    if (report.overall.total < 50) {
      recs.push('Low feedback volume. Encourage more user responses.');
    }
    
    if (recs.length === 0) {
      recs.push('Insights performing well. Continue monitoring.');
    }
    
    return recs;
  });
</script>

<section class="feedback-analytics-panel">
  <header class="panel-header">
    <div>
      <p class="section-label">Feedback Analytics</p>
      <h2 class="panel-title">Insight Performance</h2>
    </div>
    <div class="health-badge" style="--status-color: {healthStatus.color}">
      <span class="health-label">Status</span>
      <span class="health-status">{healthStatus.label}</span>
    </div>
  </header>

  <!-- Action Items -->
  <div class="action-section">
    <h3 class="action-heading">📋 Action Items</h3>
    <ul class="action-list">
      {#each recommendations as rec}
        <li class="action-item">{rec}</li>
      {/each}
    </ul>
  </div>

  <!-- Key Metrics -->
  <div class="metrics-grid">
    <div class="metric-card">
      <p class="metric-label">Total Responses</p>
      <p class="metric-value">{report.overall.total}</p>
      <p class="metric-hint">{report.byInsightType.length} insight types</p>
    </div>
    <div class="metric-card">
      <p class="metric-label">Useful</p>
      <p class="metric-value metric-useful">{report.overall.useful}</p>
      <p class="metric-hint">{((report.overall.useful / report.overall.total) * 100).toFixed(0)}% of total</p>
    </div>
    <div class="metric-card">
      <p class="metric-label">Confusing</p>
      <p class="metric-value metric-warning">{report.overall.confusing}</p>
      <p class="metric-hint">{confusionRate.toFixed(0)}% confusion rate</p>
    </div>
    <div class="metric-card">
      <p class="metric-label">Overall Score</p>
      <p class="metric-value" style="color: {healthStatus.color}">{overallScore.toFixed(1)}%</p>
      <p class="metric-hint">Target: 75%+</p>
    </div>
  </div>

  <!-- Problem Insights -->
  {#if problemInsights.length > 0}
    <div class="alert-section alert-warning">
      <div class="alert-header">
        <span class="alert-icon">⚠️</span>
        <h3 class="alert-title">Insights Needing Improvement</h3>
      </div>
      <div class="problem-list">
        {#each problemInsights as item}
          <div class="problem-item">
            <div class="problem-info">
              <span class="problem-name">{item.insightType}</span>
              <span class="problem-stats">{item.total} responses • {item.confusing} confusing</span>
            </div>
            <span class="problem-score" style="color: {item.usefulnessScore < 40 ? '#ff4444' : 'var(--color-jns-amber, #f5a623)'}">
              {item.usefulnessScore.toFixed(0)}%
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Top Performers -->
  {#if topInsights.length > 0}
    <div class="alert-section alert-success">
      <div class="alert-header">
        <span class="alert-icon">✓</span>
        <h3 class="alert-title">Top Performing Insights</h3>
      </div>
      <div class="top-list">
        {#each topInsights as item}
          <div class="top-item">
            <div class="top-info">
              <span class="top-name">{item.insightType}</span>
              <span class="top-stats">{item.total} responses • {item.useful} useful</span>
            </div>
            <span class="top-score">{item.usefulnessScore.toFixed(0)}%</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Detailed Breakdown (Collapsible) -->
  <details class="details-section">
    <summary class="details-summary">View Detailed Breakdown</summary>
    <div class="details-content">
      <div class="insight-section">
        <h3 class="section-heading">All Insight Types</h3>
        {#each report.byInsightType as item}
          <div class="insight-row">
            <div class="insight-info">
              <span class="insight-name">{item.insightType}</span>
              <span class="insight-stats">{item.total} responses</span>
            </div>
            <span class="insight-score" style="color: {item.usefulnessScore >= 75 ? 'var(--color-jns-mint, #3de8c8)' : item.usefulnessScore >= 60 ? 'var(--theme-text-primary, #fff)' : 'var(--color-jns-amber, #f5a623)'}">
              {item.usefulnessScore.toFixed(1)}%
            </span>
          </div>
        {/each}
      </div>

      <div class="insight-section">
        <h3 class="section-heading">By Detail Level</h3>
        {#each Object.entries(report.byDetailLevel) as [level, item]}
          <div class="insight-row">
            <div class="insight-info">
              <span class="insight-name">{level}</span>
              <span class="insight-stats">{item.total} responses</span>
            </div>
            <span class="insight-score" style="color: {item.usefulnessScore >= 75 ? 'var(--color-jns-mint, #3de8c8)' : item.usefulnessScore >= 60 ? 'var(--theme-text-primary, #fff)' : 'var(--color-jns-amber, #f5a623)'}">
              {item.usefulnessScore.toFixed(1)}%
            </span>
          </div>
        {/each}
      </div>
    </div>
  </details>
</section>

<style>
  .feedback-analytics-panel {
    background: var(--theme-surface, #131010);
    border: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
    border-radius: 18px;
    padding: 1.5rem;
    color: var(--theme-text-primary, #ffffff);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .panel-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  @media (min-width: 640px) {
    .panel-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
    }
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
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--theme-text-primary, #ffffff);
  }

  .health-badge {
    background: var(--theme-bg, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--status-color);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    min-width: 140px;
  }

  .health-label {
    font-size: 0.75rem;
    color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
  }

  .health-status {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--status-color);
  }

  /* Action Items */
  .action-section {
    background: rgba(61, 232, 200, 0.05);
    border: 1px solid rgba(61, 232, 200, 0.2);
    border-radius: 12px;
    padding: 1rem;
  }

  .action-heading {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-jns-mint, #3de8c8);
  }

  .action-list {
    margin: 0;
    padding-left: 1.25rem;
    list-style-type: disc;
  }

  .action-item {
    color: var(--theme-text-secondary, rgba(255, 255, 255, 0.8));
    margin-bottom: 0.5rem;
    line-height: 1.5;
    font-size: 0.875rem;
  }

  .action-item:last-child {
    margin-bottom: 0;
  }

  /* Metrics */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  @media (min-width: 768px) {
    .metrics-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .metric-card {
    background: var(--theme-bg, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
    padding: 0.75rem;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .metric-label {
    margin: 0;
    font-size: 0.75rem;
    color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
  }

  .metric-value {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--theme-text-primary, #ffffff);
  }

  .metric-hint {
    margin: 0;
    font-size: 0.7rem;
    color: var(--theme-text-subtle, rgba(255, 255, 255, 0.4));
  }

  .metric-useful {
    color: var(--color-jns-mint, #3de8c8);
  }

  .metric-warning {
    color: var(--color-jns-amber, #f5a623);
  }

  /* Alert Sections */
  .alert-section {
    border-radius: 12px;
    padding: 1rem;
  }

  .alert-warning {
    background: rgba(245, 166, 35, 0.05);
    border: 1px solid rgba(245, 166, 35, 0.2);
  }

  .alert-success {
    background: rgba(61, 232, 200, 0.05);
    border: 1px solid rgba(61, 232, 200, 0.2);
  }

  .alert-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .alert-icon {
    font-size: 1.25rem;
  }

  .alert-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--theme-text-primary, #ffffff);
  }

  /* Problem Items */
  .problem-list,
  .top-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .problem-item,
  .top-item {
    background: var(--theme-bg, rgba(255, 255, 255, 0.03));
    border-radius: 8px;
    padding: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .problem-info,
  .top-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .problem-name,
  .top-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--theme-text-primary, #ffffff);
    text-transform: capitalize;
  }

  .problem-stats,
  .top-stats {
    font-size: 0.75rem;
    color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
  }

  .problem-score,
  .top-score {
    font-size: 1rem;
    font-weight: 700;
  }

  .top-score {
    color: var(--color-jns-mint, #3de8c8);
  }

  /* Details Section */
  .details-section {
    border: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
    border-radius: 12px;
    overflow: hidden;
  }

  .details-summary {
    background: var(--theme-bg, rgba(255, 255, 255, 0.05));
    padding: 0.75rem 1rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--theme-text-secondary, rgba(255, 255, 255, 0.8));
    user-select: none;
    list-style: none;
  }

  .details-summary::-webkit-details-marker {
    display: none;
  }

  .details-summary:hover {
    background: var(--theme-surface-hover, rgba(255, 255, 255, 0.08));
  }

  .details-summary::before {
    content: '▶';
    display: inline-block;
    margin-right: 0.5rem;
    transition: transform 0.2s;
  }

  .details-section[open] .details-summary::before {
    transform: rotate(90deg);
  }

  .details-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .insight-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-heading {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--theme-text-primary, #ffffff);
  }

  .insight-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
    font-size: 0.875rem;
  }

  .insight-row:last-child {
    border-bottom: none;
  }

  .insight-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .insight-name {
    color: var(--theme-text-secondary, rgba(255, 255, 255, 0.8));
    text-transform: capitalize;
    font-weight: 500;
  }

  .insight-stats {
    font-size: 0.75rem;
    color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
  }

  .insight-score {
    font-weight: 600;
    font-size: 0.875rem;
  }
</style>
