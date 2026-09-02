<script lang="ts">
	import ProgressPrimaryChart from './ProgressPrimaryChart.svelte';
	import type { PowerPeakEvidenceModel } from './powerPeakEvidence';

	interface SessionPoint {
		timestamp: string;
		best_reaction_ms: number | null;
		avg_reaction_ms: number | null;
		best_peak_speed_ms: number | null;
		reaction_cv: number | null;
	}

	let {
		sessions,
		evidence
	}: {
		sessions: SessionPoint[];
		evidence: PowerPeakEvidenceModel;
	} = $props();
</script>

<section class="peak-history" aria-label="Power peak history">
	<header>
		<p>Peak power history</p>
		<h2>How session-peak power has changed</h2>
		<span>
			This view uses only sessions with an analytics-valid measured peak power. It is a second,
			independently-gated summary statistic, not a variability measure.
		</span>
	</header>

	<ProgressPrimaryChart {sessions} view="power-peak" powerPeakEvidence={evidence} />
</section>

<style>
	.peak-history {
		display: grid;
		gap: 0.7rem;
		margin-top: 0.75rem;
	}

	.peak-history > header {
		padding: 0 0.1rem;
	}

	.peak-history > header p {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #ffb31a;
	}

	.peak-history > header h2 {
		margin: 0.25rem 0 0;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	.peak-history > header span {
		display: block;
		max-width: 46rem;
		margin-top: 0.35rem;
		font-size: 0.68rem;
		line-height: 1.5;
		color: #93a8b9;
	}
</style>
