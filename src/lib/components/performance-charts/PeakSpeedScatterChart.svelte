<script lang="ts">
  /**
   * Peak Speed Scatter Chart
   * Displays peak speed as scatter points across runs
   */

  export interface SpeedPoint {
    runIndex: number;
    speed: number;
    runNumber?: number;
  }

  let {
    points = [],
    height = 220,
    compact = false,
    title = 'Peak Speed Distribution',
    subtitle = 'Peak speed achieved in each run'
  }: {
    points?: SpeedPoint[];
    height?: number;
    compact?: boolean;
    title?: string;
    subtitle?: string;
  } = $props();

  const width = 720;
  const padding = { top: 24, right: 24, bottom: 24, left: 48 };

  const chartWidth = $derived(width - padding.left - padding.right);
  const chartHeight = $derived(height - padding.top - padding.bottom);

  const maxSpeed = $derived(points.length > 0 ? Math.max(...points.map(p => p.speed)) : 100);
  const minSpeed = $derived(points.length > 0 ? Math.min(...points.map(p => p.speed)) : 0);
  const speedRange = $derived(maxSpeed - minSpeed || 1);

  const avgSpeed = $derived(
    points.length > 0
      ? points.reduce((sum, p) => sum + p.speed, 0) / points.length
      : 0
  );

  function getX(index: number): number {
    if (points.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (points.length - 1)) * chartWidth;
  }

  function getY(speed: number): number {
    return padding.top + chartHeight - ((speed - minSpeed) / speedRange) * chartHeight;
  }
</script>

<section class:compact class="chart-card">
  <div class="chart-header">
    <div>
      <h3>{title}</h3>
      {#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
    </div>
    {#if avgSpeed > 0}
      <div class="stat-pill">Avg {avgSpeed.toFixed(1)} km/h</div>
    {/if}
  </div>

  {#if points.length === 0}
    <div class="empty-state">No speed data available to display.</div>
  {:else}
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
      <!-- Axes -->
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={height - padding.bottom}
        class="axis"
      />
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        class="axis"
      />

      <!-- Average line -->
      {#if avgSpeed > 0}
        <line
          x1={padding.left}
          y1={getY(avgSpeed)}
          x2={width - padding.right}
          y2={getY(avgSpeed)}
          class="avg-line"
        />
      {/if}

      <!-- Data points -->
      {#each points as point, i}
        <circle
          cx={getX(i)}
          cy={getY(point.speed)}
          r="6"
          class="point"
          role="img"
          aria-label={`Run ${point.runNumber ?? i + 1}: ${point.speed.toFixed(1)} km/h`}
        >
          <title>Run {point.runNumber ?? i + 1}: {point.speed.toFixed(1)} km/h</title>
        </circle>
      {/each}
    </svg>

    <div class="stats-grid">
      <div><span>Min</span><strong>{minSpeed.toFixed(1)} km/h</strong></div>
      <div><span>Avg</span><strong>{avgSpeed.toFixed(1)} km/h</strong></div>
      <div><span>Max</span><strong>{maxSpeed.toFixed(1)} km/h</strong></div>
      <div><span>Runs</span><strong>{points.length}</strong></div>
    </div>
  {/if}
</section>

<style>
  .chart-card {
    background: #131010;
    border: 1px solid #221c18;
    border-radius: 12px;
    padding: 1rem;
    color: #f0ece4;
  }
  .chart-card.compact {
    padding: 0.75rem;
  }
  .chart-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }
  h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #f0ece4;
  }
  .subtitle {
    margin: 0.25rem 0 0;
    color: #6b5f4d;
    font-size: 0.75rem;
  }
  .stat-pill {
    white-space: nowrap;
    border: 1px solid rgba(61, 232, 200, 0.35);
    color: #3de8c8;
    border-radius: 999px;
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
  }
  svg {
    width: 100%;
    height: auto;
    min-height: 160px;
    overflow: visible;
  }
  .axis {
    stroke: #221c18;
    stroke-width: 1;
    opacity: 0.5;
  }
  .avg-line {
    stroke: #f5a623;
    stroke-width: 1.5;
    stroke-dasharray: 5, 5;
    opacity: 0.6;
  }
  .point {
    fill: #3de8c8;
    stroke: #0a0809;
    stroke-width: 2;
    opacity: 0.9;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .point:hover {
    opacity: 1;
    fill: #3de8c8;
    filter: drop-shadow(0 0 8px rgba(61, 232, 200, 0.6));
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .stats-grid div {
    background: #0a0809;
    border-radius: 8px;
    padding: 0.5rem;
  }
  .stats-grid span {
    display: block;
    color: #6b5f4d;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .stats-grid strong {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #f0ece4;
    font-weight: 600;
  }
  .empty-state {
    padding: 2rem;
    text-align: center;
    color: #9a8f7a;
    border: 1px dashed #221c18;
    border-radius: 12px;
    font-size: 0.875rem;
  }
  @media (max-width: 640px) {
    .chart-header {
      flex-direction: column;
    }
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
