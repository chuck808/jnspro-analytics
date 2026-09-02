<script lang="ts">
	import type { PageData } from './$types';
	import ProgressPeakSpeedComparisonProof from '$lib/components/progress-next/ProgressPeakSpeedComparisonProof.svelte';
	import ProgressPeakSpeedProvenance from '$lib/components/progress-next/ProgressPeakSpeedProvenance.svelte';
	import ProgressPeakSpeedSupportingSessions from '$lib/components/progress-next/ProgressPeakSpeedSupportingSessions.svelte';
	import { buildPeakSpeedDepthEvidence } from '$lib/components/progress-next/peakSpeedDepthEvidence';
	import { buildPeakSpeedEvidence } from '$lib/components/progress-next/peakSpeedEvidence';
	import { buildPeakSpeedSupportingSessions } from '$lib/components/progress-next/peakSpeedSupportingSessions';

	let { data }: { data: PageData } = $props();

	const evidence = $derived(buildPeakSpeedEvidence(data.sessions));
	const depth = $derived(buildPeakSpeedDepthEvidence(evidence));
	const supportingSessions = $derived(buildPeakSpeedSupportingSessions(evidence));
	const stages = ['unavailable', 'building', 'developing'] as const;
	const stageIndex = $derived(stages.indexOf(depth.stage));
	const latest = $derived(evidence.history.at(-1) ?? null);

	function speedValue(value: number | null) {
		return value === null ? '—' : `${(value * 3.6).toFixed(1)} km/h`;
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
	<title>Peak Speed Progress — AppGatePro</title>
</svelte:head>

<div class="speed-depth-shell" data-stage={depth.stage}>
	<div class="workspace">
		<header class="page-head">
			<div>
				<a class="back-link" href="/progress-next">← Back to Progress</a>
				<p class="eyebrow">Progress · Peak Speed deep dive</p>
				<h1>Peak Speed Progress</h1>
				<span>Only validated IMU speed contributes to this progression view.</span>
			</div>

			<div class="stage-summary">
				<strong>{depth.presentation.label}</strong>
				<span>{depth.supportedSessionCount} validated-speed session{depth.supportedSessionCount === 1 ? '' : 's'}</span>
				<small>{depth.totalSessionCount} total eligible session{depth.totalSessionCount === 1 ? '' : 's'}</small>
			</div>
		</header>

		<section class="maturity" aria-label="Peak Speed evidence maturity">
			<div class="maturity-copy">
				<p>{depth.presentation.label} evidence</p>
				<h2>{depth.presentation.headline}</h2>
				<span>{depth.presentation.guidance}</span>
			</div>

			<div class="maturity-track" aria-label={`Current Peak Speed depth: ${depth.presentation.label}`}>
				{#each stages as stage, index}
					<div class:reached={index <= stageIndex} class:current={index === stageIndex}>
						<i></i>
						<span>{stage}</span>
					</div>
				{/each}
			</div>
		</section>

		<section class="snapshot" aria-label="Peak Speed evidence snapshot">
			<article data-earned={depth.unlocks.measurement}>
				<span>Validated PB</span>
				<strong>{speedValue(evidence.bestSpeedMs)}</strong>
				<small>Best validated session speed</small>
			</article>

			<article data-earned={depth.unlocks.measurement}>
				<span>Latest validated best</span>
				<strong>{speedValue(evidence.latestBestSpeedMs)}</strong>
				<small>{latest ? dateLabel(latest.timestamp) : 'Validated speed evidence unavailable'}</small>
			</article>

			<article data-earned={depth.unlocks.direction}>
				<span>Direction evidence</span>
				<strong>{evidence.presentation.label}</strong>
				<small>{evidence.supportedSessionCount} supported validated-speed session{evidence.supportedSessionCount === 1 ? '' : 's'}</small>
			</article>
		</section>

		<section class="direction" data-earned={depth.unlocks.direction} aria-label="Peak Speed direction evidence">
			<header>
				<div>
					<p>Direction</p>
					<h2>Is validated Peak Speed changing?</h2>
				</div>
				<span>{evidence.presentation.label}</span>
			</header>
			<p>{evidence.presentation.statement}</p>
		</section>

		{#if depth.unlocks.measurement}
			<ProgressPeakSpeedSupportingSessions evidence={supportingSessions} />
		{:else}
			<section class="history-building" aria-label="Peak Speed history building">
				<p>Validated history</p>
				<h2>Validated speed evidence has not been measured yet.</h2>
				<span>{evidence.presentation.statement}</span>
			</section>
		{/if}

		{#if depth.unlocks.comparisonProof}
			<ProgressPeakSpeedComparisonProof {evidence} />
		{/if}

		<ProgressPeakSpeedProvenance />
	</div>
</div>

<style>
	.speed-depth-shell {
		min-height: calc(100vh - 5rem);
		margin: -2rem;
		background:
			radial-gradient(circle at 82% 7%, rgba(255, 117, 85, 0.13), transparent 28rem),
			linear-gradient(180deg, #07131f 0%, #05101a 100%);
		color: #f7fbff;
	}

	.workspace {
		width: 100%;
		max-width: 96rem;
		margin: 0 auto;
		padding: clamp(1.1rem, 1.8vw, 1.8rem);
		display: grid;
		gap: 0.75rem;
	}

	.page-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 0.25rem;
	}

	.back-link {
		display: inline-flex;
		margin-bottom: 0.75rem;
		color: #9db3c6;
		font-size: 0.68rem;
		font-weight: 700;
		text-decoration: none;
	}

	.back-link:hover { color: #fff; }

	.eyebrow,
	.maturity-copy p,
	.direction header p,
	.history-building p {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #ff7555;
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

	.stage-summary strong { font-size: 0.9rem; color: #ffd4ca; }
	.stage-summary span,
	.stage-summary small { font-size: 0.58rem; color: #8298aa; }

	.maturity {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 0.8fr);
		gap: 1.25rem;
		align-items: center;
		padding: 1rem 1.1rem;
		border: 1px solid #3f3d46;
		border-radius: 1rem;
		background: linear-gradient(135deg, rgba(38, 30, 38, 0.96), rgba(8, 25, 39, 0.96));
	}

	.maturity-copy h2,
	.direction h2,
	.history-building h2 {
		margin: 0.25rem 0 0;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	.maturity-copy span,
	.history-building span {
		display: block;
		margin-top: 0.35rem;
		font-size: 0.68rem;
		line-height: 1.5;
		color: #93a8b9;
	}

	.maturity-track {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.55rem;
	}

	.maturity-track > div {
		display: grid;
		gap: 0.28rem;
		font-size: 0.55rem;
		font-weight: 700;
		text-transform: capitalize;
		color: #60788c;
	}

	.maturity-track i { height: 0.35rem; border-radius: 999px; background: #1c3448; }
	.maturity-track .reached { color: #a9bfd1; }
	.maturity-track .reached i { background: #ff7555; }
	.maturity-track .current { color: #f1f8fd; }
	.maturity-track .current i { background: #ffd4ca; }

	.snapshot {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.7rem;
	}

	.snapshot article,
	.direction,
	.history-building {
		border: 1px solid #1d3449;
		border-radius: 0.9rem;
		background: linear-gradient(180deg, rgba(10, 27, 43, 0.98), rgba(6, 18, 30, 0.98));
	}

	.snapshot article { padding: 0.9rem 1rem; }
	.snapshot article[data-earned='false'],
	.direction[data-earned='false'],
	.history-building { border-style: dashed; }

	.snapshot article > span,
	.snapshot article > small { display: block; font-size: 0.56rem; color: #7f95a7; }
	.snapshot article > span { font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
	.snapshot article strong { display: block; margin: 0.55rem 0 0.22rem; font-size: 1.2rem; }

	.direction,
	.history-building { padding: 1rem 1.1rem; }

	.direction header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 1rem;
	}

	.direction header > span {
		border-radius: 999px;
		background: rgba(255, 117, 85, 0.12);
		padding: 0.3rem 0.5rem;
		font-size: 0.55rem;
		font-weight: 750;
		color: #ffc0b2;
		white-space: nowrap;
		text-transform: capitalize;
	}

	.direction > p {
		margin: 0.75rem 0 0;
		font-size: 0.68rem;
		line-height: 1.55;
		color: #a6b7c5;
	}

	@media (max-width: 900px) {
		.maturity { grid-template-columns: 1fr; }
		.snapshot { grid-template-columns: 1fr; }
	}

	@media (max-width: 640px) {
		.page-head { align-items: stretch; flex-direction: column; }
		.stage-summary { justify-items: start; }
		.maturity-track { grid-template-columns: 1fr; }
	}
</style>
