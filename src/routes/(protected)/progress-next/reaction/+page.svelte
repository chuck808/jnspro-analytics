<script lang="ts">
	import type { PageData } from './$types';
	import ProgressPrimaryChart from '$lib/components/progress-next/ProgressPrimaryChart.svelte';
	import ProgressReactionComparisonProof from '$lib/components/progress-next/ProgressReactionComparisonProof.svelte';
	import ProgressReactionContextProof from '$lib/components/progress-next/ProgressReactionContextProof.svelte';
	import ProgressReactionRepeatabilityHistory from '$lib/components/progress-next/ProgressReactionRepeatabilityHistory.svelte';
	import ProgressReactionSupportingSessions from '$lib/components/progress-next/ProgressReactionSupportingSessions.svelte';
	import ProgressReactionSynthesis from '$lib/components/progress-next/ProgressReactionSynthesis.svelte';
	import { buildReactionEvidence } from '$lib/components/progress-next/reactionEvidence';
	import { buildReactionContextEvidence } from '$lib/components/progress-next/reactionContextEvidence';
	import { buildReactionDepthEvidence } from '$lib/components/progress-next/reactionDepthEvidence';
	import { buildReactionRepeatabilityEvidence } from '$lib/components/progress-next/reactionRepeatabilityEvidence';
	import { buildReactionSupportingSessions } from '$lib/components/progress-next/reactionSupportingSessions';
	import { buildReactionSynthesisEvidence } from '$lib/components/progress-next/reactionSynthesisEvidence';

	let { data }: { data: PageData } = $props();

	const reactionEvidence = $derived(buildReactionEvidence(data.sessions));
	const repeatabilityEvidence = $derived(buildReactionRepeatabilityEvidence(data.sessions));
	const contextEvidence = $derived(
		buildReactionContextEvidence(
			data.correlationInsights ?? [],
			reactionEvidence.supportedSessionCount,
			data.sessionCount
		)
	);
	const synthesisEvidence = $derived(
		buildReactionSynthesisEvidence(reactionEvidence, repeatabilityEvidence)
	);
	const depthEvidence = $derived(
		buildReactionDepthEvidence(
			reactionEvidence,
			repeatabilityEvidence,
			contextEvidence,
			synthesisEvidence
		)
	);
	const supportingSessions = $derived(
		buildReactionSupportingSessions(reactionEvidence, repeatabilityEvidence)
	);

	const stages = ['building', 'emerging', 'developing', 'established'] as const;
	const stageIndex = $derived(stages.indexOf(depthEvidence.stage));
	const latestHistory = $derived(reactionEvidence.history.at(-1) ?? null);
	const latestRepeatability = $derived(repeatabilityEvidence.history.at(-1) ?? null);

	function reactionValue(value: number | null) {
		return value === null ? '—' : `${(value / 1000).toFixed(3)}s`;
	}

	function dateLabel(value: string) {
		return new Date(value).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Reaction Progress — AppGatePro</title>
</svelte:head>

<div class="reaction-depth-shell" data-stage={depthEvidence.stage}>
	<div class="workspace">
		<header class="page-head">
			<div>
				<a class="back-link" href="/progress-next">← Back to Progress</a>
				<p class="eyebrow">Progress · Reaction deep dive</p>
				<h1>Reaction Progress</h1>
				<span>Depth grows only as the underlying Reaction evidence earns it.</span>
			</div>

			<div class="stage-summary">
				<strong>{depthEvidence.presentation.label}</strong>
				<span>
					{depthEvidence.supportedSessionCount} Reaction-supported session{depthEvidence.supportedSessionCount ===
					1
						? ''
						: 's'}
				</span>
				<small>
					{depthEvidence.totalSessionCount} total eligible session{depthEvidence.totalSessionCount ===
					1
						? ''
						: 's'}
				</small>
			</div>
		</header>

		<section class="maturity" aria-label="Reaction evidence maturity">
			<div class="maturity-copy">
				<p>{depthEvidence.presentation.label} evidence</p>
				<h2>{depthEvidence.presentation.headline}</h2>
				<span>{depthEvidence.presentation.guidance}</span>
			</div>

			<div
				class="maturity-track"
				aria-label={`Current Reaction depth: ${depthEvidence.presentation.label}`}
			>
				{#each stages as stage, index}
					<div class:reached={index <= stageIndex} class:current={index === stageIndex}>
						<i></i>
						<span>{stage}</span>
					</div>
				{/each}
			</div>
		</section>

		<section class="snapshot" aria-label="Reaction evidence snapshot">
			<article>
				<span>Best reaction</span>
				<strong>{reactionValue(reactionEvidence.bestReactionMs)}</strong>
				<small>Measured personal best</small>
			</article>

			<article>
				<span>Latest average</span>
				<strong>{reactionValue(reactionEvidence.latestAverageReactionMs)}</strong>
				<small>
					{latestHistory ? dateLabel(latestHistory.timestamp) : 'No supported average yet'}
				</small>
			</article>

			<article>
				<span>Latest repeatability</span>
				<strong>{latestRepeatability ? `${latestRepeatability.cv.toFixed(1)}%` : '—'}</strong>
				<small>
					{latestRepeatability
						? 'Reaction CV · lower means less variation'
						: 'Repeatability evidence building'}
				</small>
			</article>

			<article>
				<span>Direction evidence</span>
				<strong>{reactionEvidence.presentation.label}</strong>
				<small>Latest supported window: {reactionEvidence.windowSize}</small>
			</article>
		</section>

		<section class="primary-evidence" aria-label="Reaction progression evidence">
			<ProgressPrimaryChart
				sessions={data.sessions}
				view="reaction"
				goalTargets={data.goalTargets}
				{reactionEvidence}
				reactionContextEvidence={contextEvidence}
				reactionRepeatabilityEvidence={repeatabilityEvidence}
			/>
		</section>

		<section class="evidence-grid" aria-label="Reaction evidence layers">
			<article class="evidence-card" data-earned={depthEvidence.unlocks.direction}>
				<header>
					<div>
						<p>Direction</p>
						<h2>Is Reaction changing?</h2>
					</div>
					<span>{reactionEvidence.presentation.label}</span>
				</header>
				<p>{reactionEvidence.presentation.statement}</p>
				<footer>
					{reactionEvidence.supportedSessionCount} supported · window {reactionEvidence.windowSize}
				</footer>
			</article>

			<article class="evidence-card" data-earned={depthEvidence.unlocks.repeatabilityHistory}>
				<header>
					<div>
						<p>Repeatability</p>
						<h2>Is it becoming repeatable?</h2>
					</div>
					<span>{repeatabilityEvidence.presentation.label}</span>
				</header>
				<p>{repeatabilityEvidence.presentation.statement}</p>
				<footer>
					{repeatabilityEvidence.supportedSessionCount} CV-supported · window {repeatabilityEvidence.windowSize}
				</footer>
			</article>

			<article class="evidence-card" data-earned={depthEvidence.unlocks.context}>
				<header>
					<div>
						<p>Context</p>
						<h2>What has appeared alongside it?</h2>
					</div>
					<span>{contextEvidence.presentation.label}</span>
				</header>
				<p>{contextEvidence.presentation.statement}</p>
				{#if contextEvidence.selected}
					<footer>
						{contextEvidence.selected.variable} · {contextEvidence.selected.strength} evidence · n={contextEvidence
							.selected.sampleSize}
					</footer>
				{:else}
					<footer>No contextual cause is inferred.</footer>
				{/if}
			</article>
		</section>

		{#if depthEvidence.unlocks.repeatabilityHistory}
			<ProgressReactionRepeatabilityHistory
				sessions={data.sessions}
				evidence={repeatabilityEvidence}
			/>
		{/if}

		{#if depthEvidence.unlocks.direction || depthEvidence.unlocks.repeatabilityDirection}
			<ProgressReactionComparisonProof
				reaction={reactionEvidence}
				repeatability={repeatabilityEvidence}
			/>
		{/if}

		{#if depthEvidence.unlocks.context}
			<ProgressReactionContextProof evidence={contextEvidence} />
		{/if}

		{#if depthEvidence.unlocks.synthesis}
			<ProgressReactionSynthesis evidence={synthesisEvidence} />
		{:else}
			<section class="story-building" aria-label="Reaction synthesis building">
				<p>Reaction story</p>
				<h2>Direction and repeatability are still being kept separate.</h2>
				<span>{synthesisEvidence.statement}</span>
			</section>
		{/if}

		<ProgressReactionSupportingSessions evidence={supportingSessions} />

		<section class="proof" aria-label="Reaction evidence provenance">
			<div>
				<p>Evidence provenance</p>
				<h2>Why this page can say what it says</h2>
				<span>
					Every layer above consumes the frozen Reaction evidence boundaries. Overall depth never
					upgrades an individual statement by itself.
				</span>
			</div>

			<dl>
				<div>
					<dt>Reaction support</dt>
					<dd>{reactionEvidence.supportedSessionCount} sessions</dd>
				</div>
				<div>
					<dt>Repeatability support</dt>
					<dd>{repeatabilityEvidence.supportedSessionCount} sessions</dd>
				</div>
				<div>
					<dt>Context analysis</dt>
					<dd>{contextEvidence.state === 'absent' ? 'Building' : 'Run'}</dd>
				</div>
				<div>
					<dt>Synthesis</dt>
					<dd>{synthesisEvidence.state}</dd>
				</div>
			</dl>
		</section>
	</div>
</div>

<style>
	.reaction-depth-shell {
		min-height: calc(100vh - 5rem);
		margin: -2rem;
		background:
			radial-gradient(circle at 82% 7%, rgba(58, 112, 255, 0.14), transparent 28rem),
			linear-gradient(180deg, #07131f 0%, #05101a 100%);
		color: #f7fbff;
	}

	.workspace {
		width: 100%;
		padding: clamp(1.1rem, 1.8vw, 1.8rem);
	}

	.page-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 1rem;
	}

	.back-link {
		display: inline-flex;
		margin-bottom: 0.75rem;
		color: #9db3c6;
		font-size: 0.68rem;
		font-weight: 700;
		text-decoration: none;
	}

	.back-link:hover {
		color: #fff;
	}

	.eyebrow,
	.maturity-copy p,
	.evidence-card header p,
	.story-building p,
	.proof p {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	h1 {
		margin: 0.22rem 0 0;
		font-size: clamp(1.6rem, 2.5vw, 2.35rem);
		letter-spacing: -0.04em;
	}

	.page-head > div > span {
		display: block;
		margin-top: 0.38rem;
		font-size: 0.72rem;
		color: #8298aa;
	}

	.stage-summary {
		display: grid;
		justify-items: end;
		gap: 0.2rem;
		min-width: 13rem;
		padding: 0.8rem 1rem;
		border: 1px solid #233d54;
		border-radius: 0.8rem;
		background: rgba(8, 25, 39, 0.88);
	}

	.stage-summary strong {
		font-size: 0.9rem;
		color: #dfffb4;
	}

	.stage-summary span,
	.stage-summary small {
		font-size: 0.58rem;
		color: #8298aa;
	}

	.maturity {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(20rem, 0.8fr);
		gap: 1.25rem;
		align-items: center;
		padding: 1rem 1.1rem;
		border: 1px solid #24435d;
		border-radius: 1rem;
		background: linear-gradient(135deg, rgba(15, 39, 58, 0.96), rgba(8, 25, 39, 0.96));
	}

	.maturity-copy h2,
	.evidence-card h2,
	.story-building h2,
	.proof h2 {
		margin: 0.25rem 0 0;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	.maturity-copy span,
	.story-building span,
	.proof span {
		display: block;
		margin-top: 0.35rem;
		font-size: 0.68rem;
		line-height: 1.5;
		color: #93a8b9;
	}

	.maturity-track {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.55rem;
	}

	.maturity-track > div {
		display: grid;
		gap: 0.28rem;
		font-size: 0.52rem;
		font-weight: 700;
		text-transform: capitalize;
		color: #60788c;
	}

	.maturity-track i {
		height: 0.35rem;
		border-radius: 999px;
		background: #1c3448;
	}

	.maturity-track .reached {
		color: #a9bfd1;
	}

	.maturity-track .reached i {
		background: #4ba3ff;
	}

	.maturity-track .current {
		color: #f1f8fd;
	}

	.maturity-track .current i {
		background: #8de51e;
	}

	.snapshot {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.7rem;
		margin-top: 0.75rem;
	}

	.snapshot article,
	.evidence-card,
	.story-building,
	.proof {
		border: 1px solid #1d3449;
		border-radius: 0.9rem;
		background: linear-gradient(180deg, rgba(10, 27, 43, 0.98), rgba(6, 18, 30, 0.98));
	}

	.snapshot article {
		padding: 0.9rem 1rem;
	}

	.snapshot article > span,
	.snapshot article > small {
		display: block;
		font-size: 0.56rem;
		color: #7f95a7;
	}

	.snapshot article > span {
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.snapshot article strong {
		display: block;
		margin: 0.55rem 0 0.22rem;
		font-size: 1.2rem;
	}

	.primary-evidence {
		margin-top: 0.75rem;
	}

	.evidence-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.evidence-card {
		display: flex;
		min-height: 10rem;
		flex-direction: column;
		padding: 1rem;
	}

	.evidence-card[data-earned='false'] {
		border-style: dashed;
		background: rgba(8, 22, 35, 0.8);
	}

	.evidence-card header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 0.8rem;
	}

	.evidence-card header > span {
		border-radius: 999px;
		background: rgba(75, 163, 255, 0.12);
		padding: 0.3rem 0.5rem;
		font-size: 0.52rem;
		font-weight: 750;
		color: #a9d1ff;
		white-space: nowrap;
	}

	.evidence-card > p {
		margin: 0.75rem 0 0;
		font-size: 0.68rem;
		line-height: 1.55;
		color: #a6b7c5;
	}

	.evidence-card footer {
		margin-top: auto;
		padding-top: 0.75rem;
		font-size: 0.54rem;
		color: #61798c;
	}

	.story-building,
	.proof {
		margin-top: 0.75rem;
		padding: 1rem 1.1rem;
	}

	.story-building {
		border-style: dashed;
	}

	.proof {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(24rem, 0.9fr);
		gap: 1.2rem;
		align-items: center;
	}

	dl {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.45rem;
		margin: 0;
	}

	dl > div {
		padding: 0.65rem 0.75rem;
		border: 1px solid #1b3449;
		border-radius: 0.65rem;
		background: rgba(7, 20, 32, 0.7);
	}

	dt {
		font-size: 0.52rem;
		color: #6f8799;
	}

	dd {
		margin: 0.2rem 0 0;
		font-size: 0.65rem;
		font-weight: 750;
		color: #dce8f2;
		text-transform: capitalize;
	}

	@media (max-width: 980px) {
		.maturity,
		.proof {
			grid-template-columns: 1fr;
		}

		.snapshot {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.evidence-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.page-head {
			align-items: stretch;
			flex-direction: column;
		}

		.stage-summary {
			justify-items: start;
		}

		.snapshot,
		dl {
			grid-template-columns: 1fr;
		}

		.maturity-track {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
