<script lang="ts">
	import type { WheeliePatternEvidenceModel } from './wheeliePatternEvidence';

	let { evidence }: { evidence: WheeliePatternEvidenceModel } = $props();

	function reactionValue(value: number) {
		return `${(value / 1000).toFixed(3)}s`;
	}
</script>

<section class="wheelie-pattern" aria-labelledby="wheelie-pattern-heading">
	<header>
		<p class="eyebrow">8 · Wheelie pattern</p>
		<h2 id="wheelie-pattern-heading">Does a wheelie start change your reaction?</h2>
		<span>
			Compares validated reaction time on wheelie starts against standard starts. Both sides must
			independently clear a minimum sample before any comparison is shown.
		</span>
	</header>

	{#if evidence.state === 'contextual-finding' && evidence.finding}
		<article data-state="contextual-finding">
			<div class="finding-head">
				<div>
					<p>Contextual finding</p>
					<h3>{evidence.presentation.label}</h3>
				</div>
				<span>{evidence.finding.direction === 'wheelie-faster' ? 'wheelie faster' : 'wheelie slower'}</span>
			</div>

			<dl>
				<div>
					<dt>Wheelie starts</dt>
					<dd>{reactionValue(evidence.finding.wheelieAverageReactionMs)}</dd>
					<small>{evidence.wheelieRunCount} runs · {evidence.wheelieSessionCount} sessions</small>
				</div>
				<div>
					<dt>Standard starts</dt>
					<dd>{reactionValue(evidence.finding.nonWheelieAverageReactionMs)}</dd>
					<small>{evidence.nonWheelieRunCount} runs · {evidence.nonWheelieSessionCount} sessions</small>
				</div>
				<div>
					<dt>Difference</dt>
					<dd>{Math.abs(evidence.finding.differencePercent).toFixed(1)}%</dd>
				</div>
			</dl>

			<footer>
				<p>{evidence.presentation.statement}</p>
			</footer>
		</article>
	{:else if evidence.state === 'no-pattern'}
		<article class="no-pattern" data-state="no-pattern">
			<div>
				<p>Comparison ran</p>
				<h3>{evidence.presentation.label}</h3>
			</div>
			<span>{evidence.presentation.statement}</span>
			<div class="sample-row">
				<span>{evidence.wheelieRunCount} wheelie runs · {evidence.wheelieSessionCount} sessions</span>
				<span>{evidence.nonWheelieRunCount} standard runs · {evidence.nonWheelieSessionCount} sessions</span>
			</div>
		</article>
	{:else}
		<article class="absent" data-state="absent">
			<div>
				<p>Not enough data</p>
				<h3>{evidence.presentation.label}</h3>
			</div>
			<span>{evidence.presentation.statement}</span>
			<dl class="counts">
				<div>
					<dt>Wheelie</dt>
					<dd>{evidence.wheelieRunCount} runs · {evidence.wheelieSessionCount} sessions</dd>
				</div>
				<div>
					<dt>Standard</dt>
					<dd>{evidence.nonWheelieRunCount} runs · {evidence.nonWheelieSessionCount} sessions</dd>
				</div>
			</dl>
		</article>
	{/if}
</section>

<style>
	.wheelie-pattern {
		margin-top: 0.75rem;
		padding: 1rem 1.1rem;
		border: 1px solid #1e3a52;
		border-radius: 1rem;
		background: linear-gradient(145deg, rgba(12, 30, 47, 0.96), rgba(8, 22, 35, 0.96));
	}

	.eyebrow {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	h2 {
		margin: 0.28rem 0 0;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	header > span {
		display: block;
		max-width: 46rem;
		margin-top: 0.25rem;
		font-size: 0.62rem;
		line-height: 1.45;
		color: #71889d;
	}

	article {
		margin-top: 0.9rem;
		padding: 0.9rem;
		border: 1px solid #1b3449;
		border-radius: 0.75rem;
		background: rgba(7, 20, 32, 0.7);
	}

	article[data-state='contextual-finding'] {
		border-color: rgba(56, 217, 202, 0.38);
		background: rgba(19, 53, 62, 0.5);
	}

	article[data-state='no-pattern'],
	article[data-state='absent'] {
		border-style: dashed;
	}

	.finding-head {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 0.8rem;
	}

	.finding-head p,
	.no-pattern p,
	.absent p {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	.finding-head h3,
	.no-pattern h3,
	.absent h3 {
		margin: 0.22rem 0 0;
		font-size: 0.88rem;
	}

	.finding-head > span {
		padding: 0.28rem 0.45rem;
		border-radius: 999px;
		background: rgba(56, 217, 202, 0.11);
		font-size: 0.55rem;
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
		font-size: 0.55rem;
		color: #6f8799;
	}

	dd {
		margin: 0.22rem 0 0;
		font-size: 0.72rem;
		font-weight: 800;
		color: #dce8f2;
	}

	dl > div > small {
		display: block;
		margin-top: 0.22rem;
		font-size: 0.55rem;
		color: #6f8799;
	}

	footer {
		margin-top: 0.75rem;
		padding-top: 0.7rem;
		border-top: 1px solid rgba(58, 91, 116, 0.4);
	}

	footer p {
		margin: 0;
		font-size: 0.62rem;
		line-height: 1.5;
		color: #91a6b7;
	}

	.no-pattern,
	.absent {
		display: grid;
		gap: 0.5rem;
	}

	.no-pattern > span,
	.absent > span {
		font-size: 0.62rem;
		line-height: 1.5;
		color: #91a6b7;
	}

	.sample-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		font-size: 0.55rem;
		color: #71889b;
	}

	.counts {
		grid-template-columns: repeat(2, minmax(0, 1fr));
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
