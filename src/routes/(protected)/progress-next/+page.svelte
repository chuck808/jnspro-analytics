<script lang="ts">
	import type { PageData } from './$types';
	import ProgressSnapshotRail from '$lib/components/progress-next/ProgressSnapshotRail.svelte';
	import ProgressPrimaryChart, { type ProgressView } from '$lib/components/progress-next/ProgressPrimaryChart.svelte';
	import ProgressBreakdown from '$lib/components/progress-next/ProgressBreakdown.svelte';
	import ProgressStartPerformance from '$lib/components/progress-next/ProgressStartPerformance.svelte';
	import ProgressRideQuality from '$lib/components/progress-next/ProgressRideQuality.svelte';

	let { data }: { data: PageData } = $props();
	let view = $state<ProgressView>('reaction');

	const latestSession = $derived(data.sessions.at(-1) ?? null);
	const latestSessionAnalysis = $derived(data.sessionAnalyses.at(-1)?.analysis ?? null);
	const latestSessionQuality = $derived(latestSessionAnalysis?.intelligence?.sessionQuality ?? null);
	const latestReactionCv = $derived(latestSession?.reaction_cv ?? null);
	const latestRideScores = $derived(data.sessionAnalyses.at(-1)?.insightPack?.scores ?? null);

	const dateWindow = $derived.by(() => {
		if (data.sessions.length === 0) return 'No sessions yet';
		const first = new Date(data.sessions[0].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
		const last = new Date(data.sessions.at(-1)!.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
		return `${first} – ${last}`;
	});
</script>

<svelte:head>
	<title>Progress Next — AppGatePro</title>
</svelte:head>

<div class="progress-next-shell">
	<div class="workspace">
		<header class="page-head">
			<div>
				<p class="eyebrow">Progress · clean-sheet preview</p>
				<h1>Your performance journey</h1>
				<span>See the story first. Open the evidence when you need it.</span>
			</div>
			<div class="head-actions">
				<a class="reference" href="/analytics">Reference view</a>
				<div class="date-chip" aria-label="Session history date range">{dateWindow}</div>
			</div>
		</header>

		{#if data.sessionCount === 0}
			<section class="empty-state">
				<span class="empty-mark">↗</span>
				<p>Progress starts with a real gate session.</p>
				<h2>Upload your first session and this workspace will build from measured evidence.</h2>
				<a href="/upload">Upload session</a>
			</section>
		{:else}
			<ProgressSnapshotRail
				sessionCount={data.sessionCount}
				personalBests={data.personalBests}
				reactionTrend={data.trend.reaction}
				{latestSessionQuality}
			/>

			<section class="primary-grid" aria-label="Primary Progress evidence">
				<ProgressPrimaryChart sessions={data.sessions} {view} goalTargets={data.goalTargets} />
				<ProgressBreakdown
					{view}
					reactionTrend={data.trend.reaction}
					speedTrend={data.trend.speed}
					{latestReactionCv}
					onSelect={(nextView) => (view = nextView)}
				/>
			</section>

			<section class="secondary-grid" aria-label="Start performance and ride quality">
				<ProgressStartPerformance sessions={data.sessions} personalBests={data.personalBests} />
				<ProgressRideQuality scores={latestRideScores} />
			</section>

			<div class="next-layer" aria-hidden="true">
				<span>Next layer</span>
				<div></div>
				<strong>Rider Development · Patterns · Investigate</strong>
			</div>
		{/if}
	</div>
</div>

<style>
	.progress-next-shell {
		min-height: calc(100vh - 5rem);
		margin: -2rem;
		background:
			radial-gradient(circle at 76% 8%, rgba(28, 111, 184, 0.12), transparent 28rem),
			linear-gradient(180deg, #07131f 0%, #05101a 100%);
		color: #f7fbff;
	}

	.workspace {
		width: min(100%, 96rem);
		margin: 0 auto;
		padding: clamp(1.25rem, 2.4vw, 2.4rem);
	}

	.page-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 1.1rem;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.17em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	h1 {
		margin: 0.25rem 0 0;
		font-size: clamp(1.5rem, 2.4vw, 2.2rem);
		line-height: 1;
		letter-spacing: -0.035em;
	}

	.page-head > div > span {
		display: block;
		margin-top: 0.42rem;
		font-size: 0.72rem;
		color: #7f93a8;
	}

	.head-actions {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.reference,
	.date-chip {
		display: inline-flex;
		min-height: 2.4rem;
		align-items: center;
		border: 1px solid #203b53;
		border-radius: 0.7rem;
		background: rgba(12, 29, 45, 0.82);
		padding: 0 0.85rem;
		font-size: 0.66rem;
		color: #b7c7d5;
		text-decoration: none;
	}

	.reference:hover { border-color: #4ba3ff; color: #fff; }

	.primary-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.85fr) minmax(18rem, 0.72fr);
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.secondary-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);
		gap: .75rem;
		margin-top: .75rem;
		align-items: stretch;
	}

	.next-layer {
		display: grid;
		grid-template-columns: auto minmax(3rem, 1fr) auto;
		align-items: center;
		gap: 0.8rem;
		margin-top: 0.85rem;
		font-size: 0.58rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #536c81;
	}

	.next-layer div { height: 1px; background: #183047; }
	.next-layer strong { color: #70879b; font-weight: 650; }

	.empty-state {
		display: grid;
		min-height: 32rem;
		place-items: center;
		align-content: center;
		text-align: center;
		padding: 2rem;
		border: 1px solid #1d3449;
		border-radius: 1.2rem;
		background: rgba(10, 27, 43, 0.82);
	}

	.empty-mark { color: #8de51e; font-size: 2rem; }
	.empty-state p { margin: 0.8rem 0 0; color: #8de51e; font-size: 0.7rem; font-weight: 750; text-transform: uppercase; letter-spacing: 0.13em; }
	.empty-state h2 { max-width: 35rem; margin: 0.8rem 0 0; color: #f7fbff; font-size: clamp(1.35rem, 3vw, 2.4rem); line-height: 1.15; letter-spacing: -0.03em; }
	.empty-state a { margin-top: 1.5rem; border-radius: 0.7rem; background: #4ba3ff; padding: 0.75rem 1rem; color: #04101a; font-size: 0.72rem; font-weight: 800; text-decoration: none; }

	@media (max-width: 980px) {
		.primary-grid,
		.secondary-grid { grid-template-columns: 1fr; }
	}

	@media (max-width: 640px) {
		.progress-next-shell { margin: -1rem; }
		.workspace { padding: 1rem; }
		.page-head { align-items: flex-start; flex-direction: column; }
		.head-actions { justify-content: flex-start; width: 100%; }
		.date-chip { flex: 1; justify-content: center; }
		.next-layer { grid-template-columns: auto 1fr; }
		.next-layer strong { display: none; }
	}
</style>
