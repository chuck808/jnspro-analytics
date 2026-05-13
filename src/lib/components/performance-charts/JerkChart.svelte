<script lang="ts">
  import type { SeriesPoint } from '$lib/performance-engine';
  import MiniLineChart from './MiniLineChart.svelte';
  
  let { data = [], smoothnessScore = null, compact = false }: { data?: SeriesPoint[]; smoothnessScore?: number | null; compact?: boolean } = $props();
</script>

<MiniLineChart
  title="Smoothness / Jerk"
  subtitle={smoothnessScore === null
    ? 'Acceleration change rate. Lower spikes usually mean smoother force application.'
    : `Acceleration change rate. Smoothness score: ${Math.round(smoothnessScore)}/100.`}
  unit="g/s"
  {data}
  {compact}
/>
