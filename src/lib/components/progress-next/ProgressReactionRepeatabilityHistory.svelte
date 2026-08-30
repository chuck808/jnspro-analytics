<script lang="ts">
	import ProgressPrimaryChart from './ProgressPrimaryChart.svelte';
	import type { ReactionRepeatabilityEvidenceModel } from './reactionRepeatabilityEvidence';

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
		evidence: ReactionRepeatabilityEvidenceModel;
	} = $props();
</script>

<section class="repeatability-history" aria-label="Reaction repeatability history">
	<header>
		<p>Repeatability history</p>
		<h2>How within-session variation has changed</h2>
		<span>
			This view uses only sessions with measured reaction CV. Lower CV means less within-session
			variation; no fixed quality benchmark is implied.
		</span>
	</header>

	<ProgressPrimaryChart
		{sessions}
		view="consistency"
		reactionRepeatabilityEvidence={evidence}
	/>
</section>

<style>
	.repeatability-history {
		display: grid;
		gap: 0.7rem;
		margin-top: 0.75rem;
	}

	.repeatability-history > header {
		padding: 0 0.1rem;
	}

	.repeatability-history > header p {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #38d9ca;
	}

	.repeatability-history > header h2 {
		margin: 0.25rem 0 0;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	.repeatability-history > header span {
		display: block;
		max-width: 46rem;
		margin-top: 0.35rem;
		font-size: 0.68rem;
		line-height: 1.5;
		color: #93a8b9;
	}
</style>
