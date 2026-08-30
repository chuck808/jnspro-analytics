<script lang="ts">
	import type { PeakSpeedEvidenceModel } from './peakSpeedEvidence';

	let { evidence }: { evidence: PeakSpeedEvidenceModel } = $props();

	function kmh(value: number): string {
		return `${(value * 3.6).toFixed(1)} km/h`;
	}
</script>

{#if evidence.finding}
	<section class="comparison-proof" aria-labelledby="peak-speed-comparison-title">
		<div>
			<p class="eyebrow">Direction proof</p>
			<h2 id="peak-speed-comparison-title">The comparison behind the direction</h2>
		</div>
		<div class="comparison-values">
			<div>
				<span>Earlier validated best</span>
				<strong>{kmh(evidence.finding.historicalBestSpeedMs)}</strong>
			</div>
			<span class="arrow">→</span>
			<div>
				<span>Recent validated best</span>
				<strong>{kmh(evidence.finding.recentBestSpeedMs)}</strong>
			</div>
			<div class="change">
				<span>Change</span>
				<strong>{evidence.finding.changePercent >= 0 ? '+' : ''}{evidence.finding.changePercent.toFixed(1)}%</strong>
			</div>
		</div>
		<p class="explanation">
			This is the frozen Peak Speed evidence comparison over the full supported history. It is not
			recomputed by this component.
		</p>
	</section>
{/if}

<style>
	.comparison-proof {
		border: 1px solid #1d3449;
		border-radius: 0.9rem;
		padding: 1rem 1.1rem;
		background: linear-gradient(180deg, rgba(10, 27, 43, 0.98), rgba(6, 18, 30, 0.98));
		color: #f7fbff;
	}

	.eyebrow {
		margin: 0 0 0.25rem;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #ff7555;
	}

	h2,
	p {
		margin-top: 0;
	}

	h2 {
		margin-bottom: 0.4rem;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	.comparison-values {
		display: grid;
		grid-template-columns: 1fr auto 1fr 1fr;
		gap: 0.55rem;
		align-items: center;
		margin: 0.9rem 0 0.75rem;
	}

	.comparison-values > div {
		display: grid;
		gap: 0.2rem;
		padding: 0.8rem;
		border: 1px solid #1b3449;
		border-radius: 0.7rem;
		background: rgba(7, 20, 32, 0.7);
	}

	.comparison-values span,
	.explanation {
		font-size: 0.54rem;
		color: #71889b;
	}

	.comparison-values strong {
		font-size: 0.92rem;
	}

	.arrow {
		font-size: 1.2rem !important;
		color: #ffc0b2 !important;
	}

	.change {
		border-color: rgba(255, 117, 85, 0.35) !important;
	}

	.explanation {
		margin-bottom: 0;
		line-height: 1.5;
		color: #91a7b8;
	}

	@media (max-width: 720px) {
		.comparison-values {
			grid-template-columns: 1fr;
		}

		.arrow {
			display: none;
		}
	}
</style>
