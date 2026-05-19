<script lang="ts">
  import type { SessionNarrative } from '$lib/performance-engine/language/types';

  interface Props {
    narrative: SessionNarrative;
    detailLevel?: 'grom' | 'rider' | 'elite' | 'coach';
  }

  let { narrative, detailLevel = 'rider' }: Props = $props();

  const priorityColor = $derived(
    narrative.message.priority === 'critical' ? '#ff4444' :
    narrative.message.priority === 'important' ? '#f5a623' :
    narrative.message.priority === 'watch' ? '#ffcc44' :
    '#3de8c8'
  );

  const confidenceColor = $derived(
    narrative.message.confidence === 'low' ? '#ffcc44' :
    narrative.message.confidence === 'moderate' ? '#f5a623' :
    '#3de8c8'
  );

  const showAdvanced = $derived(detailLevel === 'elite' || detailLevel === 'coach');
</script>

<section class="narrative-card" style="border-left: 4px solid {priorityColor}">
  <!-- Header with Confidence Badge -->
  <div class="narrative-header">
    <div class="headline-section">
      <h3 class="headline">{narrative.message.headline}</h3>
      <div class="badges">
        <span class="confidence-badge" style="background: {confidenceColor}20; color: {confidenceColor}">
          {narrative.message.confidence} confidence
        </span>
        {#if narrative.trust.basedOnRuns}
          <span class="data-badge">
            {#if narrative.trust.excludedRuns && narrative.trust.excludedRuns > 0}
              {narrative.trust.basedOnRuns} of {narrative.trust.basedOnRuns + narrative.trust.excludedRuns} runs
            {:else}
              {narrative.trust.basedOnRuns} run{narrative.trust.basedOnRuns !== 1 ? 's' : ''}
            {/if}
          </span>
        {/if}
        {#if narrative.trust.excludedRuns && narrative.trust.excludedRuns > 0}
          <span class="excluded-badge" title="Excluded from analysis: {narrative.trust.excludedReasons?.join(', ') ?? 'tagged runs'}">
            {narrative.trust.excludedRuns} excluded
          </span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Impact -->
  <div class="narrative-section">
    <p class="impact-text">{narrative.message.impact}</p>
  </div>

  <!-- Why This Matters -->
  {#if detailLevel !== 'grom'}
    <div class="narrative-section why-matters">
      <h4>Why this matters</h4>
      <p>{narrative.message.whyThisMatters}</p>
    </div>
  {/if}

  <!-- Action -->
  <div class="narrative-section action-box">
    <div class="action-icon">💡</div>
    <p class="action-text">{narrative.message.action}</p>
  </div>

  <!-- Watch For -->
  {#if narrative.message.watchFor}
    <div class="narrative-section watch-for">
      <div class="watch-icon">👁️</div>
      <div>
        <h4>Watch for</h4>
        <p>{narrative.message.watchFor}</p>
      </div>
    </div>
  {/if}

  <!-- Trust Context (Advanced View) -->
  {#if showAdvanced}
    <details class="trust-context">
      <summary>Data Trust & Quality</summary>
      <div class="trust-content">
        <!-- Trusted Metrics -->
        {#if narrative.trust.trustedMetrics.length > 0}
          <div class="trust-group">
            <span class="trust-label trusted">✓ Trusted:</span>
            <span class="trust-value">{narrative.trust.trustedMetrics.join(', ')}</span>
          </div>
        {/if}

        <!-- Caution Metrics -->
        {#if narrative.trust.cautionMetrics.length > 0}
          <div class="trust-group">
            <span class="trust-label caution">⚠ Use caution:</span>
            <span class="trust-value">{narrative.trust.cautionMetrics.join(', ')}</span>
          </div>
        {/if}

        <!-- Blocked Metrics -->
        {#if narrative.trust.blockedMetrics.length > 0}
          <div class="trust-group">
            <span class="trust-label blocked">✗ Blocked:</span>
            <span class="trust-value">{narrative.trust.blockedMetrics.join(', ')}</span>
          </div>
        {/if}

        <!-- Confidence Explanation -->
        <div class="confidence-explanation">
          <p class="explanation-text">
            {#if narrative.message.confidence === 'low'}
              Early signal - more data needed to confirm this pattern.
            {:else if narrative.message.confidence === 'moderate'}
              Trend developing - pattern is emerging with reasonable confidence.
            {:else}
              High confidence - clear pattern established across sufficient data.
            {/if}
          </p>
        </div>
      </div>
    </details>
  {/if}

  <!-- Warnings -->
  {#if narrative.warnings.length > 0}
    <div class="warnings-section">
      {#each narrative.warnings as warning}
        <div class="warning-item">
          <span class="warning-icon">⚠️</span>
          <span class="warning-text">{warning}</span>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .narrative-card {
    background: var(--theme-surface, #131010);
    border: 1px solid var(--theme-border, #221c18);
    border-radius: 16px;
    padding: 1.5rem;
    color: var(--theme-text-primary, #f0ece4);
  }

  .narrative-header {
    margin-bottom: 1rem;
  }

  .headline-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .headline {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--theme-text-primary, #f0ece4);
  }

  .badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .confidence-badge,
  .data-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .data-badge {
    background: rgba(107, 95, 77, 0.2);
    color: var(--theme-text-subtle, #9a8f7a);
  }

  .excluded-badge {
    background: rgba(245, 166, 35, 0.12);
    color: #f5a623;
    cursor: help;
  }

  .narrative-section {
    margin-bottom: 1rem;
  }

  .narrative-section:last-child {
    margin-bottom: 0;
  }

  .impact-text {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--theme-text-secondary, #9a8f7a);
  }

  .why-matters h4 {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--theme-text-subtle, #6b5f4d);
    font-weight: 600;
  }

  .why-matters p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--theme-text-secondary, #9a8f7a);
  }

  .action-box {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: rgba(245, 166, 35, 0.08);
    border: 1px solid rgba(245, 166, 35, 0.2);
    border-radius: 12px;
    padding: 1rem;
  }

  .action-icon {
    font-size: 1.5rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .action-text {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--theme-text-primary, #f0ece4);
    font-weight: 500;
  }

  .watch-for {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: rgba(61, 232, 200, 0.08);
    border: 1px solid rgba(61, 232, 200, 0.2);
    border-radius: 12px;
    padding: 1rem;
  }

  .watch-icon {
    font-size: 1.25rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .watch-for h4 {
    margin: 0 0 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #3de8c8;
  }

  .watch-for p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--theme-text-secondary, #9a8f7a);
  }

  .trust-context {
    border: 1px solid var(--theme-border, #221c18);
    border-radius: 12px;
    overflow: hidden;
    margin-top: 1rem;
  }

  .trust-context summary {
    padding: 0.75rem 1rem;
    cursor: pointer;
    background: var(--theme-bg, #0a0809);
    color: var(--theme-text-secondary, #9a8f7a);
    font-size: 0.875rem;
    font-weight: 600;
    user-select: none;
    transition: background 0.2s;
  }

  .trust-context summary:hover {
    background: var(--theme-surface-hover, #171210);
  }

  .trust-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .trust-group {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .trust-label {
    font-weight: 600;
    flex-shrink: 0;
  }

  .trust-label.trusted {
    color: #3de8c8;
  }

  .trust-label.caution {
    color: #f5a623;
  }

  .trust-label.blocked {
    color: #ff4444;
  }

  .trust-value {
    color: var(--theme-text-secondary, #9a8f7a);
  }

  .confidence-explanation {
    background: rgba(107, 95, 77, 0.1);
    border-radius: 8px;
    padding: 0.75rem;
    margin-top: 0.5rem;
  }

  .explanation-text {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--theme-text-secondary, #9a8f7a);
    font-style: italic;
  }

  .warnings-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .warning-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    background: rgba(255, 68, 68, 0.08);
    border: 1px solid rgba(255, 68, 68, 0.2);
    border-radius: 8px;
    padding: 0.75rem;
  }

  .warning-icon {
    flex-shrink: 0;
    font-size: 1rem;
  }

  .warning-text {
    font-size: 0.875rem;
    line-height: 1.4;
    color: var(--theme-text-secondary, #9a8f7a);
  }

  @media (max-width: 640px) {
    .narrative-card {
      padding: 1rem;
    }

    .headline {
      font-size: 1.1rem;
    }

    .action-box,
    .watch-for {
      padding: 0.75rem;
    }
  }
</style>