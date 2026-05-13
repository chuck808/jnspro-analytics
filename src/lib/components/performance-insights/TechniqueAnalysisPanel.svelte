<script lang="ts">
  /**
   * Technique Analysis Panel
   * Integrates wheelie analysis, data quality, and phase consistency
   * Links technique → performance outcomes
   */
  
  import {
    analyseFrontWheelLift,
    assessDataQuality,
    analysePhaseConsistency,
    type FrontWheelLiftAnalysis,
    type DataQualityAssessment,
    type PhaseConsistencyResult
  } from '$lib/performance-engine';
  
  import {
    PeakSpeedScatterChart,
    SpeedWithAverageLineChart
  } from '$lib/components/performance-charts';
  
  interface Run {
    id?: string;
    run_number?: number;
    gate_runs?: {
      front_wheel_lifted?: boolean | null;
      wheelie_duration_ms?: number | null;
      max_pitch?: number | null;
      time_to_wheelie_ms?: number | null;
      bias_correction_ms2?: number | null;
      max_g?: number | null;
      peak_speed_ms?: number | null;
    };
    splits?: Array<{ phase: string; time: number }>;
    max_speed_kmh?: number | null;
    elapsed_time_ms?: number | null;
  }
  
  interface Props {
    runs?: Run[];
    detailLevel?: 'grom' | 'rider' | 'elite' | 'coach';
    compact?: boolean;
  }
  
  let { runs = [], detailLevel = 'rider', compact = false }: Props = $props();
  
  // Analysis computations
  const wheelieAnalysis = $derived(
    runs.map(run => ({
      runNumber: run.run_number ?? 0,
      analysis: analyseFrontWheelLift(run.gate_runs ?? {})
    }))
  );
  
  const dataQuality = $derived(
    assessDataQuality(runs[0]?.gate_runs?.bias_correction_ms2)
  );
  
  const phaseConsistency = $derived(
    runs.length > 1 && runs.some(r => r.splits?.length)
      ? analysePhaseConsistency(runs as any)
      : []
  );
  
  // Chart data
  const speedPoints = $derived(
    runs.map((run, i) => ({
      runIndex: i,
      speed: run.gate_runs?.peak_speed_ms ? run.gate_runs.peak_speed_ms * 3.6 : 0,
      runNumber: run.run_number
    }))
  );
  
  // Derived insights
  const wheeliePattern = $derived(() => {
    const classifications = wheelieAnalysis.map(w => w.analysis.classification);
    const excessiveCount = classifications.filter(c => c === 'excessive-lift').length;
    const lateCount = classifications.filter(c => c === 'late-lift').length;
    const controlledCount = classifications.filter(c => c === 'controlled').length;
    const noLiftCount = classifications.filter(c => c === 'no-lift').length;
    
    if (excessiveCount > runs.length * 0.3) {
      return {
        pattern: 'excessive',
        impact: 'Excessive wheelies likely contributing to acceleration inconsistency',
        why: 'Uncontrolled wheel lift can reduce traction and make power delivery unpredictable, affecting both speed and repeatability',
        advice: 'You might benefit from focusing on weight distribution and smoother power delivery',
        watchFor: 'reduced wheel lift duration and more consistent acceleration phases'
      };
    }
    
    if (lateCount > runs.length * 0.4) {
      return {
        pattern: 'late',
        impact: 'Late wheelies may indicate delayed power application',
        why: 'Early power application is critical for competitive gate starts - delays can compound into slower overall times',
        advice: 'You might benefit from working on explosive launch timing',
        watchFor: 'earlier wheel lift timing (closer to gate drop) and faster initial acceleration'
      };
    }
    
    if (controlledCount > runs.length * 0.6) {
      return {
        pattern: 'controlled',
        impact: 'Consistent launch control observed',
        why: 'Consistent technique provides a stable foundation for further improvements and better competition results',
        advice: 'Current technique appears effective',
        watchFor: 'maintaining this consistency while increasing overall speed'
      };
    }
    
    return {
      pattern: 'mixed',
      impact: 'Variable wheelie control may be affecting repeatability',
      why: 'Inconsistent technique makes it harder to build muscle memory and predict performance under pressure',
      advice: 'You might benefit from focusing on consistent launch technique',
      watchFor: 'more similar wheelie patterns across runs and tighter speed grouping'
    };
  });
  
  // Confidence indicator
  const confidenceLevel = $derived(() => {
    if (runs.length >= 8) return { level: 'high', text: `Based on ${runs.length} runs` };
    if (runs.length >= 5) return { level: 'medium', text: `Based on ${runs.length} runs` };
    return { level: 'limited', text: 'Limited data - more runs recommended' };
  });
  
  const qualityColor = $derived(
    dataQuality.rating === 'excellent' ? '#3de8c8' :
    dataQuality.rating === 'good' ? '#82c91e' :
    dataQuality.rating === 'fair' ? '#f5a623' :
    dataQuality.rating === 'calibrate' ? '#ff4444' :
    'var(--theme-text-subtle)'
  );
  
  const wheelieColor = $derived(
    wheeliePattern().pattern === 'controlled' ? '#3de8c8' :
    wheeliePattern().pattern === 'late' ? '#f5a623' :
    '#ff4444'
  );
  
  const isAdvanced = $derived(detailLevel === 'elite' || detailLevel === 'coach');
  const showCharts = $derived(runs.length >= 3 && !compact);
</script>

<section class="technique-panel">
  <div class="panel-header">
    <div class="header-content">
      <span class="badge">Technique Layer</span>
      <h3>Launch & Consistency Analysis</h3>
      <p>How rider technique affects performance outcomes</p>
    </div>
    
    <!-- Data Quality Indicator -->
    <div class="quality-badge" style="border-color: {qualityColor}; color: {qualityColor}">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="6" cy="6" r="2" fill="currentColor"/>
      </svg>
      {dataQuality.rating}
    </div>
  </div>

  {#if runs.length === 0}
    <div class="empty-state">
      <p>No run data available for technique analysis.</p>
    </div>
  {:else}
    <!-- Key Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Data Quality</span>
        <span class="metric-value" style="color: {qualityColor}">
          {dataQuality.rating}
        </span>
        {#if dataQuality.bias !== undefined}
          <span class="metric-hint">{dataQuality.bias.toFixed(2)} m/s² bias</span>
        {/if}
      </div>

      <div class="metric-card">
        <span class="metric-label">Wheelie Pattern</span>
        <span class="metric-value" style="color: {wheelieColor}">
          {wheeliePattern().pattern}
        </span>
        <span class="metric-hint">{wheelieAnalysis.filter(w => w.analysis.detected).length}/{runs.length} detected</span>
      </div>

      {#if phaseConsistency.length > 0}
        <div class="metric-card">
          <span class="metric-label">Phase Consistency</span>
          <span class="metric-value" style="color: {phaseConsistency[0].consistency >= 80 ? '#3de8c8' : '#f5a623'}">
            {Math.round(phaseConsistency[0].consistency)}/100
          </span>
          <span class="metric-hint">{phaseConsistency[0].phase}</span>
        </div>
      {/if}

      <div class="metric-card">
        <span class="metric-label">Analysis Runs</span>
        <span class="metric-value" style="color: var(--theme-text-primary)">
          {runs.length}
        </span>
        <span class="metric-hint">runs analyzed</span>
      </div>
    </div>

    <!-- Technique → Outcome Link -->
    <div class="insight-card" style="border-left-color: {wheelieColor}">
      <div class="insight-header">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L14 8L8 14M2 8H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h4>Technique Impact</h4>
        <span class="confidence-badge {confidenceLevel().level}">
          {confidenceLevel().text}
        </span>
      </div>
      <p class="insight-impact">{wheeliePattern().impact}</p>
      {#if wheeliePattern().why}
        <p class="insight-why">Why this matters: {wheeliePattern().why}</p>
      {/if}
      <p class="insight-advice">💡 {wheeliePattern().advice}</p>
      <p class="insight-watch">👁️ Watch for: {wheeliePattern().watchFor}</p>
    </div>

    <!-- Charts Section (Advanced users only) -->
    {#if showCharts && isAdvanced}
      <div class="charts-section">
        <h4 class="section-title">Performance Distribution</h4>
        <div class="chart-container">
          <PeakSpeedScatterChart
            points={speedPoints}
            title="Speed Consistency"
            subtitle="Peak speed variation across runs"
            compact={true}
          />
        </div>
      </div>
    {/if}

    <!-- Detailed Wheelie Analysis (Coach level) -->
    {#if isAdvanced && wheelieAnalysis.length > 0}
      <details class="details-section">
        <summary>Detailed Launch Analysis ({wheelieAnalysis.length} runs)</summary>
        <div class="wheelie-grid">
          {#each wheelieAnalysis as { runNumber, analysis }}
            <div class="wheelie-card {analysis.classification}">
              <div class="wheelie-header">
                <span class="run-badge">Run {runNumber}</span>
                <span class="classification-badge">{analysis.classification}</span>
              </div>
              
              {#if analysis.detected}
                <div class="wheelie-metrics">
                  {#if analysis.maxPitch !== null}
                    <div class="wheelie-metric">
                      <span class="label">Pitch</span>
                      <span class="value">{analysis.maxPitch.toFixed(1)}°</span>
                    </div>
                  {/if}
                  {#if analysis.duration !== null}
                    <div class="wheelie-metric">
                      <span class="label">Duration</span>
                      <span class="value">{analysis.duration}ms</span>
                    </div>
                  {/if}
                  {#if analysis.timeToLift !== null}
                    <div class="wheelie-metric">
                      <span class="label">Time to Lift</span>
                      <span class="value">{analysis.timeToLift}ms</span>
                    </div>
                  {/if}
                </div>
              {:else}
                <p class="no-lift-text">No front wheel lift detected</p>
              {/if}
            </div>
          {/each}
        </div>
      </details>
    {/if}

    <!-- Phase Consistency Details (Coach level) -->
    {#if isAdvanced && phaseConsistency.length > 0}
      <details class="details-section">
        <summary>Phase Consistency Breakdown</summary>
        <div class="phase-grid">
          {#each phaseConsistency as phase}
            <div class="phase-card">
              <h5>{phase.phase}</h5>
              <div class="phase-stats">
                <div class="stat">
                  <span class="label">Avg</span>
                  <span class="value">{phase.avg.toFixed(0)}ms</span>
                </div>
                <div class="stat">
                  <span class="label">Spread</span>
                  <span class="value">{phase.spread.toFixed(0)}ms</span>
                </div>
                <div class="stat">
                  <span class="label">Consistency</span>
                  <span class="value" style="color: {phase.consistency >= 80 ? '#3de8c8' : phase.consistency >= 60 ? '#f5a623' : '#ff4444'}">
                    {Math.round(phase.consistency)}%
                  </span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </details>
    {/if}
  {/if}
</section>

<style>
  .technique-panel {
    background: var(--theme-surface, #131010);
    border: 1px solid rgba(245, 166, 35, 0.18);
    border-radius: 18px;
    padding: 1.5rem;
    color: var(--theme-text-primary);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .header-content {
    flex: 1;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(245, 166, 35, 0.15);
    border: 1px solid rgba(245, 166, 35, 0.3);
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #f5a623;
    margin-bottom: 0.75rem;
  }

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--theme-text-primary);
  }

  .panel-header p {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    color: var(--theme-text-secondary);
  }

  .quality-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--theme-bg);
    border: 1px solid;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
    white-space: nowrap;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .metric-card {
    background: var(--theme-bg);
    border-radius: 12px;
    padding: 0.875rem;
    display: flex;
    flex-direction: column;
  }

  .metric-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--theme-text-subtle);
    margin-bottom: 0.5rem;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .metric-unit {
    font-size: 0.875rem;
    font-weight: 400;
    opacity: 0.7;
  }

  .metric-hint {
    font-size: 0.7rem;
    color: var(--theme-text-subtle);
    margin-top: 0.25rem;
  }

  .insight-card {
    background: rgba(245, 166, 35, 0.05);
    border: 1px solid rgba(245, 166, 35, 0.2);
    border-left: 3px solid;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .insight-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .insight-header svg {
    stroke: currentColor;
    opacity: 0.8;
  }

  .insight-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--theme-text-primary);
    flex: 1;
  }

  .confidence-badge {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-weight: 500;
    white-space: nowrap;
  }

  .confidence-badge.high {
    background: rgba(61, 232, 200, 0.15);
    color: #3de8c8;
    border: 1px solid rgba(61, 232, 200, 0.3);
  }

  .confidence-badge.medium {
    background: rgba(245, 166, 35, 0.15);
    color: #f5a623;
    border: 1px solid rgba(245, 166, 35, 0.3);
  }

  .confidence-badge.limited {
    background: rgba(255, 255, 255, 0.05);
    color: var(--theme-text-subtle);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .insight-impact {
    font-size: 0.95rem;
    color: var(--theme-text-primary);
    margin: 0.5rem 0;
    font-weight: 500;
  }

  .insight-why {
    font-size: 0.85rem;
    color: var(--theme-text-secondary);
    margin: 0.75rem 0 0;
    padding-left: 1rem;
    border-left: 2px solid rgba(245, 166, 35, 0.3);
    font-style: italic;
  }

  .insight-advice {
    font-size: 0.875rem;
    color: var(--theme-text-secondary);
    margin: 0.75rem 0 0;
  }

  .insight-watch {
    font-size: 0.85rem;
    color: var(--theme-text-secondary);
    margin: 0.75rem 0 0;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 6px;
    border-left: 2px solid rgba(61, 232, 200, 0.4);
  }

  .charts-section {
    margin-bottom: 1.5rem;
  }

  .section-title {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--theme-text-subtle);
  }

  .chart-container {
    margin-bottom: 1rem;
  }

  .details-section {
    background: var(--theme-bg);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .details-section summary {
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--theme-text-secondary);
    user-select: none;
    list-style: none;
  }

  .details-section summary::-webkit-details-marker {
    display: none;
  }

  .details-section summary::before {
    content: '▶';
    display: inline-block;
    margin-right: 0.5rem;
    transition: transform 0.2s;
  }

  .details-section[open] summary::before {
    transform: rotate(90deg);
  }

  .wheelie-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .wheelie-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 0.75rem;
  }

  .wheelie-card.controlled {
    border-color: rgba(61, 232, 200, 0.3);
  }

  .wheelie-card.late-lift {
    border-color: rgba(245, 166, 35, 0.3);
  }

  .wheelie-card.excessive-lift {
    border-color: rgba(255, 68, 68, 0.3);
  }

  .wheelie-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .run-badge {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--theme-text-subtle);
  }

  .classification-badge {
    font-size: 0.65rem;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 999px;
    text-transform: capitalize;
  }

  .wheelie-metrics {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .wheelie-metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
  }

  .wheelie-metric .label {
    color: var(--theme-text-subtle);
  }

  .wheelie-metric .value {
    font-weight: 600;
    color: var(--theme-text-primary);
  }

  .no-lift-text {
    font-size: 0.75rem;
    color: var(--theme-text-subtle);
    font-style: italic;
    margin: 0;
  }

  .phase-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .phase-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 0.75rem;
  }

  .phase-card h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: capitalize;
    color: var(--theme-text-primary);
  }

  .phase-stats {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .phase-stats .stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
  }

  .phase-stats .label {
    color: var(--theme-text-subtle);
  }

  .phase-stats .value {
    font-weight: 600;
    color: var(--theme-text-primary);
  }

  .empty-state {
    padding: 3rem 1rem;
    text-align: center;
    color: var(--theme-text-secondary);
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }

  @media (max-width: 640px) {
    .panel-header {
      flex-direction: column;
    }

    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .wheelie-grid,
    .phase-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
