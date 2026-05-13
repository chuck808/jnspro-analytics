<script lang="ts">
  /**
   * Speed With Average Line Chart
   * Displays speed series with average reference line
   */

  export interface SeriesPoint {
    x: number;
    y: number;
  }

  let {
    series = [],
    average = 0,
    height = 220,
    compact = false,
    title = 'Speed Over Time',
    subtitle = 'Speed progression with average reference',
    unit = 'km/h'
  }: {
    series?: SeriesPoint[];
    average?: number;
    height?: number;
    compact?: boolean;
    title?: string;
    subtitle?: string;
    unit?: string;
  } = $props();

  const width = 720;
  const padding = { top: 24, right: 24, bottom: 24, left: 48 };

  const chartWidth = $derived(width - padding.left - padding.right);
  const chartHeight = $derived(height - padding.top - padding.bottom);

  const maxY = $derived(series.length > 0 ? Math.max(...series.map(p => p.y), average) : 100);
  const minY = $derived(series.length > 0 ? Math.min(...series.map(p => p.y), 0) : 0);
  const yRange = $derived(maxY - minY || 1);

  const maxX = $derived(series.length > 0 ? Math.max(...series.map(p => p.x)) : 1);

  function getX(x: number): number {
    if (maxX === 0) return padding.left;
    return padding.left + (x / maxX) * chartWidth;
  }

  function getY(y: number): number {
    return padding.top + chartHeight - ((y - minY) / yRange) * chartHeight;
  }

  const pathData = $derived(
    series.length < 2
      ? ''
      : series
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.x)} ${getY(p.y)}`)
          .join(' ')
  );
</script>

<section class:compact class="chart-card">
  <div class="chart-header">
    <div>
      <h3>{title}</h3>
      {#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
    </div>
    {#if average > 0}
      <div class="stat-pill">Avg {average.toFixed(1)} {unit}</div>
    {/if}
  </div>

  {#if series.length === 0}
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
      {#if average > 0}
        <line
          x1={padding.left}
          y1={getY(average)}
          x2={width - padding.right}
          y2={getY(average)}
          class="avg-line"
        />
      {/if}

      <!-- Speed line -->
      {#if pathData}
        <path d={pathData} class="line primary" />
      {/if}

      <!-- Data points -->
      {#each series as point}
        <circle cx={getX(point.x)} cy={getY(point.y)} r="3" class="point" />
      {/each}
    </svg>

    <div class="stats-grid">
      <div><span>Min</span><strong>{minY.toFixed(1)} {unit}</strong></div>
      <div><span>Avg</span><strong>{average.toFixed(1)} {unit}</strong></div>
      <div><span>Max</span><strong>{maxY.toFixed(1)} {unit}</strong></div>
      <div><span>Points</span><strong>{series.length}</strong></div>
    </div>

    {#if average > 0}
      <p class="legend">
        <span class="legend-primary"></span>Speed
        <span class="legend-avg"></span>Average
      </p>
    {/if}
  {/if}
</section>

<style>
  .chart-card {
    background: var(--theme-surface);
    border: 1px solid rgba(245, 166, 35, 0.18);
    border-radius: 18px;
    padding: 1rem;
    color: var(--theme-text-primary);
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.22);
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
    font-size: 1rem;
    color: var(--theme-text-primary);
  }
  .subtitle {
    margin: 0.25rem 0 0;
    color: var(--theme-text-secondary);
    font-size: 0.85rem;
  }
  .stat-pill {
    white-space: nowrap;
    border: 1px solid rgba(61, 232, 200, 0.35);
    color: #3de8c8;
    border-radius: 999px;
    padding: 0.35rem 0.65rem;
    font-size: 0.8rem;
  }
  svg {
    width: 100%;
    height: auto;
    min-height: 180px;
    overflow: visible;
  }
  .axis {
    stroke: var(--theme-border);
    stroke-width: 1;
    opacity: 0.5;
  }
  .avg-line {
    stroke: var(--color-jns-amber);
    stroke-width: 2;
    stroke-dasharray: 5, 5;
    opacity: 0.7;
  }
  .line {
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .primary {
    stroke: #3de8c8;
  }
  .point {
    fill: #3de8c8;
    stroke: none;
    opacity: 0.7;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .stats-grid div {
    background: var(--theme-bg);
    border-radius: 12px;
    padding: 0.55rem;
  }
  .stats-grid span {
    display: block;
    color: var(--theme-text-subtle);
    font-size: 0.72rem;
  }
  .stats-grid strong {
    display: block;
    margin-top: 0.15rem;
    font-size: 0.86rem;
    color: var(--theme-text-primary);
  }
  .legend {
    font-size: 0.78rem;
    color: var(--theme-text-secondary);
    margin-top: 0.5rem;
  }
  .legend-primary,
  .legend-avg {
    display: inline-block;
    width: 18px;
    height: 3px;
    border-radius: 999px;
    margin: 0 0.35rem 0 0.75rem;
    vertical-align: middle;
  }
  .legend-primary {
    background: #3de8c8;
    margin-left: 0;
  }
  .legend-avg {
    background: var(--color-jns-amber);
  }
  .empty-state {
    padding: 2rem;
    text-align: center;
    color: var(--theme-text-secondary);
    border: 1px dashed var(--theme-border);
    border-radius: 14px;
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
