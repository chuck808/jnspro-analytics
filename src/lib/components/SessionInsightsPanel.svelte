<script lang="ts">
	let { analysis }: { analysis: any } = $props();
</script>

<div>
	<h3>Session Quality</h3>
	<p>Consistency: {analysis.consistency.toFixed(1)}/100</p>
	<p>Fatigue: {analysis.fatigue.trend}</p>

	<h4>Recommendations</h4>
	<ul>
		{#each analysis.recommendation as r}
			<li>{r}</li>
		{/each}
	</ul>
</div>
