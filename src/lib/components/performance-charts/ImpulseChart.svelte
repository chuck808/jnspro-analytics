<script lang="ts">
	import type { SeriesPoint } from '$lib/performance-engine';
	import MiniLineChart from './MiniLineChart.svelte';

	let { data = [], compact = false }: { data?: SeriesPoint[]; compact?: boolean } = $props();
</script>

<MiniLineChart
	title="Impulse"
	subtitle="Cumulative force over time. Useful for judging how early the start force is delivered."
	unit="N·s"
	{data}
	{compact}
/>
