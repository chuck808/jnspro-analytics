<script lang="ts">
	import type { PowerEvidenceModel } from './powerEvidence';
	import type { PowerPeakEvidenceModel } from './powerPeakEvidence';

	let {
		power,
		peak
	}: {
		power: PowerEvidenceModel;
		peak: PowerPeakEvidenceModel;
	} = $props();

	function wattsValue(value: number) {
		return `${Math.round(value)}W`;
	}

	function percentValue(value: number) {
		return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
	}
</script>

<section class="comparison-proof" aria-label="Power direction comparison proof">
	<header>
		<p>Comparison proof</p>
		<h2>What the direction statements compare</h2>
		<span>
			These values come directly from the same frozen trend results used by the direction claims.
			No second comparison is calculated here.
		</span>
	</header>

	<div class="comparison-grid">
		<article data-earned={power.finding !== null}>
			<div class="card-head">
				<div>
					<p>Average power direction</p>
					<h3>{power.presentation.label}</h3>
				</div>
				<span>{power.windowSize} supported</span>
			</div>

			{#if power.finding}
				<dl>
					<div>
						<dt>Earlier comparison</dt>
						<dd>{wattsValue(power.finding.historicalAverageW)}</dd>
					</div>
					<div>
						<dt>Recent comparison</dt>
						<dd>{wattsValue(power.finding.recentAverageW)}</dd>
					</div>
					<div>
						<dt>Relative change</dt>
						<dd>{percentValue(power.finding.changePercent)}</dd>
					</div>
				</dl>
				<footer>{power.presentation.statement}</footer>
			{:else}
				<div class="not-earned">
					<strong>No directional comparison yet.</strong>
					<span>{power.presentation.statement}</span>
				</div>
			{/if}
		</article>

		<article data-earned={peak.finding !== null}>
			<div class="card-head">
				<div>
					<p>Peak power direction</p>
					<h3>{peak.presentation.label}</h3>
				</div>
				<span>{peak.windowSize} peak-supported</span>
			</div>

			{#if peak.finding}
				<dl>
					<div>
						<dt>Earlier comparison</dt>
						<dd>{wattsValue(peak.finding.historicalPeakW)}</dd>
					</div>
					<div>
						<dt>Recent comparison</dt>
						<dd>{wattsValue(peak.finding.recentPeakW)}</dd>
					</div>
					<div>
						<dt>Relative change</dt>
						<dd>{percentValue(peak.finding.changePercent)}</dd>
					</div>
				</dl>
				<footer>{peak.presentation.statement}</footer>
			{:else}
				<div class="not-earned">
					<strong>No peak-power comparison yet.</strong>
					<span>{peak.presentation.statement}</span>
				</div>
			{/if}
		</article>
	</div>
</section>

<style>
	.comparison-proof {
		margin-top: 0.75rem;
		padding: 1rem 1.1rem;
		border: 1px solid #1d3449;
		border-radius: 0.9rem;
		background: linear-gradient(180deg, rgba(10, 27, 43, 0.98), rgba(6, 18, 30, 0.98));
	}

	.comparison-proof > header p,
	.card-head p {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	.comparison-proof > header h2 {
		margin: 0.25rem 0 0;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	.comparison-proof > header > span {
		display: block;
		max-width: 46rem;
		margin-top: 0.35rem;
		font-size: 0.68rem;
		line-height: 1.5;
		color: #93a8b9;
	}

	.comparison-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.7rem;
		margin-top: 0.9rem;
	}

	.comparison-grid article {
		padding: 0.9rem;
		border: 1px solid #203b53;
		border-radius: 0.75rem;
		background: rgba(7, 20, 32, 0.7);
	}

	.comparison-grid article[data-earned='false'] {
		border-style: dashed;
		background: rgba(7, 20, 32, 0.45);
	}

	.card-head {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 0.8rem;
	}

	.card-head h3 {
		margin: 0.22rem 0 0;
		font-size: 0.88rem;
	}

	.card-head > span {
		padding: 0.28rem 0.45rem;
		border-radius: 999px;
		background: rgba(75, 163, 255, 0.12);
		font-size: 0.55rem;
		font-weight: 750;
		color: #a9d1ff;
		white-space: nowrap;
	}

	dl {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.45rem;
		margin: 0.8rem 0 0;
	}

	dl > div {
		padding: 0.65rem 0.7rem;
		border: 1px solid #1b3449;
		border-radius: 0.6rem;
		background: rgba(5, 17, 28, 0.72);
	}

	dt {
		font-size: 0.55rem;
		color: #6f8799;
	}

	dd {
		margin: 0.22rem 0 0;
		font-size: 0.72rem;
		font-weight: 800;
		color: #dce8f2;
	}

	footer {
		margin-top: 0.7rem;
		font-size: 0.6rem;
		line-height: 1.5;
		color: #879caf;
	}

	.not-earned {
		display: grid;
		gap: 0.3rem;
		margin-top: 0.8rem;
		padding: 0.72rem 0.75rem;
		border: 1px dashed #274158;
		border-radius: 0.65rem;
	}

	.not-earned strong {
		font-size: 0.66rem;
		color: #dce8f2;
	}

	.not-earned span {
		font-size: 0.6rem;
		line-height: 1.5;
		color: #71889b;
	}

	@media (max-width: 760px) {
		.comparison-grid,
		dl {
			grid-template-columns: 1fr;
		}
	}
</style>
