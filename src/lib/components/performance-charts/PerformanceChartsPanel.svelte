<script lang="ts">
	import type { ChartSeriesBundle, PerformanceDiagnostic } from '$lib/performance-engine';
	import { shouldShowPower } from '$lib/performance-engine';
	import AccelerationChart from './AccelerationChart.svelte';
	import SpeedChart from './SpeedChart.svelte';
	import ImpulseChart from './ImpulseChart.svelte';
	import JerkChart from './JerkChart.svelte';
	import PowerChart from './PowerChart.svelte';

	let {
		series,
		diagnostics = [],
		smoothnessScore = null,
		detailLevel = 'rider'
	}: {
		series: ChartSeriesBundle;
		diagnostics?: PerformanceDiagnostic[];
		smoothnessScore?: number | null;
		detailLevel?: 'grom' | 'rider' | 'elite' | 'coach';
	} = $props();

	const showAdvanced = $derived(detailLevel === 'elite' || detailLevel === 'coach');
	const showCoach = $derived(detailLevel === 'coach');
	const powerReliable = $derived(shouldShowPower(diagnostics));
</script>

<section class="charts-panel">
	<div class="panel-header">
		<h2>Performance charts</h2>
		<p>Display-only charts. All physics and analytics come from the Performance Engine.</p>
	</div>

	{#if detailLevel === 'grom'}
		<p class="gentle-note">Charts are hidden for grom view. Show simple feedback instead.</p>
	{:else}
		<div class="chart-grid">
			<SpeedChart speed={series.speed} acceleration={series.acceleration} />
			<AccelerationChart data={series.acceleration} />
			{#if showAdvanced}
				<ImpulseChart data={series.impulse} />
				<JerkChart data={series.jerk} {smoothnessScore} />
			{/if}
			{#if showCoach}
				<PowerChart data={series.power} reliable={powerReliable} />
			{/if}
		</div>
	{/if}
</section>

<style>
	.charts-panel {
		margin-top: 1.5rem;
	}
	.panel-header {
		margin-bottom: 1rem;
	}
	h2 {
		margin: 0;
		color: var(--theme-text-primary);
		font-size: 1.25rem;
	}
	p {
		margin: 0.35rem 0 0;
		color: var(--theme-text-secondary);
	}
	.gentle-note {
		background: rgba(61, 232, 200, 0.08);
		border: 1px solid rgba(61, 232, 200, 0.22);
		border-radius: 14px;
		padding: 1rem;
		color: var(--theme-text-secondary);
	}
	.chart-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}
	@media (max-width: 900px) {
		.chart-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
