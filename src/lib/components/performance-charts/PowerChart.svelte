<script lang="ts">
  import type { SeriesPoint } from '$lib/performance-engine';
  import MiniLineChart from './MiniLineChart.svelte';
  
  let { data = [], reliable = false, compact = false }: { data?: SeriesPoint[]; reliable?: boolean; compact?: boolean } = $props();
</script>

{#if reliable}
  <MiniLineChart
    title="Estimated Power"
    subtitle="Estimated force × velocity. Display only when calibration diagnostics allow it."
    unit="W"
    {data}
    {compact}
  />
{:else}
  <section class="blocked-card">
    <h3>Estimated Power</h3>
    <p>Power is hidden until speed and calibration checks pass.</p>
  </section>
{/if}

<style>
  .blocked-card {
    background: var(--theme-surface);
    border: 1px dashed var(--theme-border);
    border-radius: 0.75rem;
    padding: 1.25rem;
    color: var(--theme-text-primary);
  }
  h3 { margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--theme-text-primary); }
  p { margin: 0.5rem 0 0; color: var(--theme-text-secondary); font-size: 0.875rem; }
</style>
