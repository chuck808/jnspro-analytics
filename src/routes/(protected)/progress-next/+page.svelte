<script lang="ts">
	import type { PageData } from './$types';
	import ProgressSnapshotRail from '$lib/components/progress-next/ProgressSnapshotRail.svelte';
	import ProgressPrimaryChart, { type ProgressView } from '$lib/components/progress-next/ProgressPrimaryChart.svelte';
	import ProgressBreakdown from '$lib/components/progress-next/ProgressBreakdown.svelte';
	import ProgressStartPerformance from '$lib/components/progress-next/ProgressStartPerformance.svelte';
	import ProgressRideQuality from '$lib/components/progress-next/ProgressRideQuality.svelte';
	import ProgressRiderDevelopment from '$lib/components/progress-next/ProgressRiderDevelopment.svelte';
	import ProgressPatterns from '$lib/components/progress-next/ProgressPatterns.svelte';
	import ProgressInvestigate from '$lib/components/progress-next/ProgressInvestigate.svelte';
	import ProgressStrengthsLimiters from '$lib/components/progress-next/ProgressStrengthsLimiters.svelte';
	import ProgressDeepEvidence from '$lib/components/progress-next/ProgressDeepEvidence.svelte';
	import ProgressGoals from '$lib/components/progress-next/ProgressGoals.svelte';
	import ProgressReports from '$lib/components/progress-next/ProgressReports.svelte';
	import ProgressReactionSynthesis from '$lib/components/progress-next/ProgressReactionSynthesis.svelte';
	import { buildReactionEvidence } from '$lib/components/progress-next/reactionEvidence';
	import { buildReactionContextEvidence } from '$lib/components/progress-next/reactionContextEvidence';
	import { buildReactionRepeatabilityEvidence } from '$lib/components/progress-next/reactionRepeatabilityEvidence';
	import { buildReactionSynthesisEvidence } from '$lib/components/progress-next/reactionSynthesisEvidence';
	import { buildPeakSpeedEvidence } from '$lib/components/progress-next/peakSpeedEvidence';
	import { buildRiderDevelopmentEvidence } from '$lib/components/progress-next/riderDevelopmentEvidence';

	let { data }: { data: PageData } = $props();
	let view = $state<ProgressView>('reaction');

	const latestSession = $derived(data.sessions.at(-1) ?? null);
	const latestAnalyzedSession = $derived(data.sessionAnalyses.at(-1) ?? null);
	const latestSessionAnalysis = $derived(latestAnalyzedSession?.analysis ?? null);
	const latestSessionQuality = $derived(latestSessionAnalysis?.intelligence?.sessionQuality ?? null);
	const latestRideScores = $derived(latestAnalyzedSession?.insightPack?.scores ?? null);
	const latestSessionId = $derived(latestSession?.id ?? null);
	const latestAnalyzedSessionId = $derived(latestAnalyzedSession?.sessionId ?? null);
	const reactionEvidence = $derived(buildReactionEvidence(data.sessions));
	const peakSpeedEvidence = $derived(buildPeakSpeedEvidence(data.sessions));
	const riderDevelopmentEvidence = $derived(buildRiderDevelopmentEvidence(data.sessionAnalyses));
	const reactionRepeatabilityEvidence = $derived(buildReactionRepeatabilityEvidence(data.sessions));
	const reactionSynthesisEvidence = $derived(
		buildReactionSynthesisEvidence(reactionEvidence, reactionRepeatabilityEvidence)
	);
	const reactionContextEvidence = $derived(
		buildReactionContextEvidence(
			data.correlationInsights ?? [],
			reactionEvidence.supportedSessionCount,
			data.sessionCount
		)
	);
	const reactionContextPatternSuppressions = $derived(
		reactionContextEvidence.selected ? [reactionContextEvidence.selected.id] : []
	);

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
			<div class="head-copy">
				<p class="eyebrow">Progress · clean-sheet preview</p>
				<h1>Your performance journey</h1>
				<span>See the story first. Open the evidence when you need it.</span>
			</div>
			<div class="head-utility">
				<div class="head-actions" aria-label="Progress actions">
					<a class="action action-primary" href="/analytics" aria-label="Open the Progress report builder and sharing options">
						<span aria-hidden="true">↗</span>
						Report &amp; share
					</a>
					{#if latestAnalyzedSessionId}
						<a class="action action-evidence" href={`/sessions/${latestAnalyzedSessionId}/analysis`}>
							<span aria-hidden="true">◎</span>
							Latest analysed evidence
						</a>
					{/if}
					<a class="action action-reference" href="/analytics">Reference view</a>
				</div>
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
			<ProgressSnapshotRail sessionCount={data.sessionCount} personalBests={data.personalBests} {reactionEvidence} {peakSpeedEvidence} {latestSessionQuality} />

			<section class="primary-grid" aria-label="Primary Progress evidence">
				<ProgressPrimaryChart
					sessions={data.sessions}
					{view}
					goalTargets={data.goalTargets}
					{reactionEvidence}
					{reactionContextEvidence}
					{reactionRepeatabilityEvidence}
					{peakSpeedEvidence}
				/>
				<ProgressBreakdown
					{view}
					{reactionEvidence}
					{peakSpeedEvidence}
					{reactionRepeatabilityEvidence}
					sessions={data.sessions}
					onSelect={(nextView) => (view = nextView)}
				/>
			</section>

			{#if view === 'reaction'}
				<ProgressReactionSynthesis evidence={reactionSynthesisEvidence} />
				<a class="reaction-depth-link" href="/progress-next/reaction">
					<span>Open Reaction Progress</span>
					<small>Follow the evidence from baseline to established depth</small>
					<strong aria-hidden="true">→</strong>
				</a>
			{:else if view === 'speed'}
				<a class="reaction-depth-link speed-depth-link" href="/progress-next/peak-speed">
					<span>Open Peak Speed Progress</span>
					<small>Inspect validated speed history and the comparison behind its direction</small>
					<strong aria-hidden="true">→</strong>
				</a>
			{/if}

			<section class="secondary-grid" aria-label="Start performance and ride quality">
				<ProgressStartPerformance sessions={data.sessions} personalBests={data.personalBests} {peakSpeedEvidence} />
				<ProgressRideQuality scores={latestRideScores} sessionAnalyses={data.sessionAnalyses} />
			</section>

			<ProgressRiderDevelopment evidence={riderDevelopmentEvidence} />

			<section class="lower-grid" aria-label="Context, investigation, strengths and limiters">
				<div class="patterns-slot"><ProgressPatterns insights={data.correlationInsights ?? []} sessionCount={data.sessionCount} suppressedInsightIds={reactionContextPatternSuppressions} /></div>
				<div class="investigate-slot"><ProgressInvestigate sessionAnalyses={data.sessionAnalyses} /></div>
				<div class="strengths-slot"><ProgressStrengthsLimiters sessionAnalyses={data.sessionAnalyses} /></div>
			</section>

			<section class="final-grid" aria-label="Deep evidence, goals and reports">
				<div class="deep-slot"><ProgressDeepEvidence {latestSessionId} {latestAnalyzedSessionId} sessionCount={data.sessionCount} /></div>
				<div class="goals-slot"><ProgressGoals goalTargets={data.goalTargets} /></div>
				<div class="reports-slot"><ProgressReports coachLinks={data.coachLinks ?? []} /></div>
			</section>
		{/if}
	</div>
</div>

<style>
	.progress-next-shell { min-height: calc(100vh - 5rem); margin: -2rem; background: radial-gradient(circle at 76% 8%, rgba(28,111,184,.12), transparent 28rem), linear-gradient(180deg,#07131f 0%,#05101a 100%); color:#f7fbff; }
	.workspace { width:100%; margin:0; padding:clamp(1.1rem,1.8vw,1.8rem); }
	.page-head { display:flex; align-items:end; justify-content:space-between; gap:1.5rem; margin-bottom:1.1rem; }
	.head-copy { min-width:0; }
	.eyebrow { margin:0; font-size:.62rem; font-weight:800; letter-spacing:.17em; text-transform:uppercase; color:#4ba3ff; }
	h1 { margin:.25rem 0 0; font-size:clamp(1.5rem,2.4vw,2.2rem); line-height:1; letter-spacing:-.035em; }
	.head-copy > span { display:block; margin-top:.42rem; font-size:.72rem; color:#7f93a8; }
	.head-utility { display:grid; justify-items:end; gap:.5rem; }
	.head-actions { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; justify-content:flex-end; }
	.action,.date-chip { display:inline-flex; min-height:2.4rem; align-items:center; justify-content:center; gap:.35rem; border:1px solid #203b53; border-radius:.7rem; background:rgba(12,29,45,.82); padding:0 .85rem; font-size:.66rem; font-weight:700; color:#b7c7d5; text-decoration:none; transition:border-color 120ms ease,background 120ms ease,color 120ms ease,transform 120ms ease; }
	.action:hover { transform:translateY(-1px); }
	.action:focus-visible { outline:2px solid #4ba3ff; outline-offset:2px; }
	.action-primary { border-color:rgba(141,229,30,.45); background:linear-gradient(135deg,rgba(141,229,30,.18),rgba(48,101,39,.13)); color:#dfffb4; }
	.action-primary:hover { border-color:#8de51e; background:rgba(141,229,30,.22); color:#fff; }
	.action-evidence { border-color:rgba(75,163,255,.42); color:#bdddff; }
	.action-evidence:hover { border-color:#4ba3ff; background:rgba(75,163,255,.12); color:#fff; }
	.action-reference { color:#7e93a7; font-weight:600; }
	.action-reference:hover { border-color:#4c667c; color:#d8e4ed; }
	.date-chip { min-height:1.8rem; border-color:transparent; background:transparent; padding:0 .15rem; font-size:.56rem; font-weight:600; color:#627a90; }
	.primary-grid { display:grid; grid-template-columns:minmax(0,1.85fr) minmax(18rem,.72fr); gap:.75rem; margin-top:.75rem; }
	.secondary-grid { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(22rem,1fr); gap:.75rem; margin-top:.75rem; }
	.lower-grid { display:grid; grid-template-columns:minmax(0,1.12fr) minmax(17rem,.72fr) minmax(19rem,.9fr); gap:.75rem; margin-top:.75rem; align-items:stretch; }
	.final-grid { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(17rem,.72fr) minmax(18rem,.78fr); gap:.75rem; margin-top:.75rem; align-items:stretch; }
	.patterns-slot,.investigate-slot,.strengths-slot,.deep-slot,.goals-slot,.reports-slot { min-width:0; }
	.empty-state { display:grid; min-height:32rem; place-items:center; align-content:center; text-align:center; padding:2rem; border:1px solid #1d3449; border-radius:1.2rem; background:rgba(10,27,43,.82); }
	.empty-mark { color:#8de51e; font-size:2rem; }
	.empty-state p { margin:.8rem 0 0; color:#8de51e; font-size:.7rem; font-weight:750; text-transform:uppercase; letter-spacing:.13em; }
	.empty-state h2 { max-width:35rem; margin:.8rem 0 0; color:#f7fbff; font-size:clamp(1.35rem,3vw,2.4rem); line-height:1.15; letter-spacing:-.03em; }
	.empty-state a { margin-top:1.5rem; border-radius:.7rem; background:#4ba3ff; padding:.75rem 1rem; color:#04101a; font-size:.72rem; font-weight:800; text-decoration:none; }
	.reaction-depth-link { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:.2rem 1rem; align-items:center; margin-top:.55rem; border:1px solid rgba(75,163,255,.32); border-radius:.8rem; background:rgba(75,163,255,.07); padding:.7rem .9rem; color:#d8eaff; text-decoration:none; }
	.reaction-depth-link span { font-size:.68rem; font-weight:800; }
	.reaction-depth-link small { grid-column:1; color:#7f98ad; font-size:.56rem; }
	.reaction-depth-link strong { grid-column:2; grid-row:1 / span 2; color:#8de51e; font-size:1rem; }
	.reaction-depth-link:hover { border-color:rgba(141,229,30,.48); background:rgba(141,229,30,.07); }
	.reaction-depth-link:focus-visible { outline:2px solid #4ba3ff; outline-offset:2px; }
	.speed-depth-link { border-color:rgba(255,117,85,.35); background:rgba(255,117,85,.07); }
	.speed-depth-link strong { color:#ff7555; }
	.speed-depth-link:hover { border-color:rgba(255,117,85,.58); background:rgba(255,117,85,.1); }
	@media (max-width:1180px) { .lower-grid,.final-grid { grid-template-columns:1fr 1fr; } .patterns-slot,.deep-slot { grid-column:1 / -1; } }
	@media (max-width:980px) { .primary-grid,.secondary-grid { grid-template-columns:1fr; } }
	@media (max-width:720px) { .lower-grid,.final-grid { grid-template-columns:1fr; } .patterns-slot,.deep-slot { grid-column:auto; } }
	@media (max-width:640px) { .progress-next-shell { margin:-1rem; } .workspace { padding:1rem; } .page-head { align-items:flex-start; flex-direction:column; } .head-utility { width:100%; justify-items:stretch; } .head-actions { justify-content:flex-start; width:100%; } .action { flex:1 1 auto; } .date-chip { justify-content:flex-start; } }
</style>