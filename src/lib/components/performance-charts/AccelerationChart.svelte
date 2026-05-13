<script lang="ts">
  import type { SeriesPoint } from '$lib/performance-engine';
  import MiniLineChart from './MiniLineChart.svelte';
  
  let { data = [], compact = false }: { data?: SeriesPoint[]; compact?: boolean } = $props();
</script>

<MiniLineChart
  title="Acceleration"
  subtitle="G-force over time. Useful for launch force and acceleration shape."
  unit="g"
  {data}
  {compact}
/>
