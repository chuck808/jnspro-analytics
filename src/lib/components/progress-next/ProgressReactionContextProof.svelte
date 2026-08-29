<script lang="ts">
	import type { ReactionContextEvidenceModel } from './reactionContextEvidence';

	let { evidence }: { evidence: ReactionContextEvidenceModel } = $props();

	function correlationValue(value: number) {
		return Math.abs(value).toFixed(2);
	}
</script>

<section class="context-proof" aria-label="Reaction context evidence proof">
	<header>
		<p>Context proof</p>
		<h2>What contextual analysis actually found</h2>
		<span>
			This layer only exposes the structured result already admitted by the Reaction context
			evidence boundary. It does not infer a cause or add recommendation prose.
		</span>
	</header>

	{#if evidence.state === 'contextual-finding' && evidence.selected}
		<article data-state="contextual-finding">
			<div class="finding-head">
				<div>
					<p>{evidence.selected.variable}</p>
					<h3>{evidence.presentation.label}</h3>
				</div>
				<span>{evidence.selected.strength} evidence</span>
			</div>

			<dl>
				{#if evidence.selected.direction !== 'none'}
					<div>
						<dt>Association</dt>
						<dd>r={correlationValue(evidence.selected.correlation)}</dd>
					</div>
				{/if}
				<div>
					<dt>Supported sample</dt>
					<dd>{evidence.selected.sampleSize} sessions</dd>
				</div>
				<div>
					<dt>Qualifying findings</dt>
					<dd>{evidence.qualifyingInsightCount}</dd>
				</div>
			</dl>

			<footer>
				<p>{evidence.selected.statement}</p>
				<small>Association only · no causal explanation is inferred.</small>
			</footer>
		</article>
	{:else if evidence.state === 'no-pattern'}
		<article class="no-pattern" data-state="no-pattern">
			<div>
				<p>Context analysis ran</p>
				<h3>{evidence.presentation.label}</h3>
			</div>
			<span>{evidence.presentation.statement}</span>
			<small>
				A no-pattern result is still evidence about the current record; it is not converted into a
				positive or negative relationship claim.
			</small>
		</article>
	{/if}
</section>

<style>
	.context-proof {
		margin-top: 0.75rem;
		padding: 1rem 1.1rem;
		border: 1px solid #1d3449;
		border-radius: 0.9rem;
		background: linear-gradient(180deg, rgba(10, 27, 43, 0.98), rgba(6, 18, 30, 0.98));
	}

	.context-proof > header p,
	.finding-head p,
	.no-pattern p {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	.context-proof > header h2 {
		margin: 0.25rem 0 0;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	.context-proof > header > span {
		display: block;
		max-width: 46rem;
		margin-top: 0.35rem;
		font-size: 0.68rem;
		line-height: 1.5;
		color: #93a8b9;
	}

	.context-proof article {
		margin-top: 0.9rem;
		padding: 0.9rem;
		border: 1px solid #203b53;
		border-radius: 0.75rem;
		background: rgba(7, 20, 32, 0.7);
	}

	.context-proof article[data-state='contextual-finding'] {
		border-color: rgba(56, 217, 202, 0.38);
		background: rgba(19, 53, 62, 0.5);
	}

	.context-proof article[data-state='no-pattern'] {
		border-style: dashed;
	}

	.finding-head {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 0.8rem;
	}

	.finding-head h3,
	.no-pattern h3 {
		margin: 0.22rem 0 0;
		font-size: 0.88rem;
	}

	.finding-head > span {
		padding: 0.28rem 0.45rem;
		border-radius: 999px;
		background: rgba(56, 217, 202, 0.11);
		font-size: 0.5rem;
		font-weight: 750;
		color: #a9f4ec;
		text-transform: capitalize;
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
		font-size: 0.5rem;
		color: #6f8799;
	}

	dd {
		margin: 0.22rem 0 0;
		font-size: 0.72rem;
		font-weight: 800;
		color: #dce8f2;
	}

	footer {
		margin-top: 0.75rem;
		padding-top: 0.7rem;
		border-top: 1px solid rgba(58, 91, 116, 0.4);
	}

	footer p,
	.no-pattern > span,
	.no-pattern small {
		margin: 0;
		font-size: 0.62rem;
		line-height: 1.5;
		color: #91a6b7;
	}

	footer small,
	.no-pattern small {
		display: block;
		margin-top: 0.35rem;
		color: #71889b;
	}

	.no-pattern {
		display: grid;
		gap: 0.5rem;
	}

	@media (max-width: 640px) {
		dl {
			grid-template-columns: 1fr;
		}

		.finding-head {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
