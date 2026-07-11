<script lang="ts">
	import type { SeriesPoint } from '$lib/performance-engine';
	import MiniLineChart from './MiniLineChart.svelte';

	let {
		speed = [],
		acceleration = [],
		compact = false
	}: { speed?: SeriesPoint[]; acceleration?: SeriesPoint[]; compact?: boolean } = $props();
</script>

<MiniLineChart
	title="Speed"
	subtitle="Integrated speed curve with optional acceleration overlay."
	unit="km/h"
	data={speed}
	secondaryData={acceleration}
	secondaryUnit="g"
	secondaryLabel="acceleration overlay"
	{compact}
/>
