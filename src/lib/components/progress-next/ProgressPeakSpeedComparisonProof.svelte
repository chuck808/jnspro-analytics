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
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 1rem;
		padding: 1.25rem;
		background: var(--color-surface, #fff);
	}

	.eyebrow {
		margin: 0 0 0.25rem;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted, #6b7280);
	}

	h2,
	p {
		margin-top: 0;
	}

	h2 {
		margin-bottom: 0.4rem;
		font-size: 1.15rem;
	}

	.comparison-values {
		display: grid;
		grid-template-columns: 1fr auto 1fr 1fr;
		gap: 1rem;
		align-items: center;
		margin: 1rem 0;
	}

	.comparison-values > div {
		display: grid;
		gap: 0.2rem;
	}

	.comparison-values span,
	.explanation {
		font-size: 0.8rem;
		color: var(--color-text-muted, #6b7280);
	}

	.comparison-values strong {
		font-size: 1.2rem;
	}

	.arrow {
		font-size: 1.2rem !important;
	}

	.change {
		padding-left: 1rem;
		border-left: 1px solid var(--color-border, #e5e7eb);
	}

	.explanation {
		margin-bottom: 0;
		line-height: 1.55;
	}

	@media (max-width: 720px) {
		.comparison-values {
			grid-template-columns: 1fr;
		}

		.arrow {
			display: none;
		}

		.change {
			padding-left: 0;
			padding-top: 0.75rem;
			border-left: 0;
			border-top: 1px solid var(--color-border, #e5e7eb);
		}
	}
</style>
