<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { ReactionEvidenceModel } from './reactionEvidence';
	import type { ReactionContextEvidenceModel } from './reactionContextEvidence';
	import type { ReactionRepeatabilityEvidenceModel } from './reactionRepeatabilityEvidence';
	import type { PeakSpeedEvidenceModel } from './peakSpeedEvidence';
	import type { PowerEvidenceModel } from './powerEvidence';
	import type { PowerPeakEvidenceModel } from './powerPeakEvidence';
	import type { PowerContextEvidenceModel } from './powerContextEvidence';

	export type ProgressView = 'reaction' | 'speed' | 'consistency' | 'power';
	type ChartView = ProgressView | 'power-peak';

	interface SessionPoint {
		timestamp: string;
		best_reaction_ms: number | null;
		avg_reaction_ms: number | null;
		best_peak_speed_ms: number | null;
		reaction_cv: number | null;
	}

	interface Props {
		sessions: SessionPoint[];
		view: ChartView;
		goalTargets?: Record<string, any>;
		reactionEvidence?: ReactionEvidenceModel;
		reactionContextEvidence?: ReactionContextEvidenceModel;
		reactionRepeatabilityEvidence?: ReactionRepeatabilityEvidenceModel;
		peakSpeedEvidence?: PeakSpeedEvidenceModel;
		powerEvidence?: PowerEvidenceModel;
		powerPeakEvidence?: PowerPeakEvidenceModel;
		powerContextEvidence?: PowerContextEvidenceModel;
	}

	let {
		sessions,
		view,
		goalTargets = {},
		reactionEvidence,
		reactionContextEvidence,
		reactionRepeatabilityEvidence,
		peakSpeedEvidence,
		powerEvidence,
		powerPeakEvidence,
		powerContextEvidence
	}: Props = $props();
	let canvas: HTMLCanvasElement | null = $state(null);
	let chart: any = null;

	const meta = $derived.by(() => {
		if (view === 'speed') return { title: 'Peak speed progression', note: 'Validated IMU evidence · higher is better', accent: '#ff7555' };
		if (view === 'consistency') return { title: 'Reaction consistency', note: 'Session CV · lower means less within-session variation', accent: '#38d9ca' };
		if (view === 'power') return { title: 'Average power progression', note: 'Estimated physics · higher is better', accent: '#ffb31a' };
		if (view === 'power-peak') return { title: 'Peak power', note: 'Estimated physics · session peak', accent: '#ffb31a' };
		return { title: 'Reaction progression', note: 'Best + average reaction · lower is better', accent: '#96de27' };
	});

	const canRender = $derived(
		view === 'reaction'
			? (reactionEvidence?.history.length ?? 0) >= 2
			: view === 'consistency'
				? (reactionRepeatabilityEvidence?.history.length ?? 0) >= 2
				: view === 'power'
					? (powerEvidence?.history.length ?? 0) >= 2
					: view === 'power-peak'
						? (powerPeakEvidence?.history.length ?? 0) >= 2
						: (peakSpeedEvidence?.history.length ?? 0) >= 2
	);

	function labelDate(value: string) {
		return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}

	async function draw() {
		if (!canvas || !canRender) return;
		const { Chart, registerables } = await import('chart.js');
		Chart.register(...registerables);
		chart?.destroy();

		const reactionHistory = reactionEvidence?.history ?? [];
		const repeatabilityHistory = reactionRepeatabilityEvidence?.history ?? [];
		const speedHistory = peakSpeedEvidence?.history ?? [];
		const powerHistory = powerEvidence?.history ?? [];
		const powerPeakHistory = powerPeakEvidence?.history ?? [];
		const chartSessions =
			view === 'reaction'
				? reactionHistory
				: view === 'consistency'
					? repeatabilityHistory
					: view === 'power'
						? powerHistory
						: view === 'power-peak'
							? powerPeakHistory
							: speedHistory;
		const labels = chartSessions.map((session) => labelDate(session.timestamp));
		const commonDataset = {
			borderWidth: 2.4,
			pointRadius: 2.5,
			pointHoverRadius: 5,
			tension: 0.28,
			fill: true
		};
		let datasets: any[] = [];
		let reverse = false;
		let yLabel = '';

		if (view === 'speed') {
			datasets = [{
				...commonDataset,
				label: 'Peak speed (km/h)',
				data: speedHistory.map((session) => session.bestSpeedMs * 3.6),
				borderColor: '#ff7555',
				backgroundColor: 'rgba(255,117,85,.10)',
				pointBackgroundColor: '#ff7555'
			}];
			const target = goalTargets.peakSpeed?.target;
			if (target) datasets.push({ label: 'Goal', data: Array(speedHistory.length).fill(target * 3.6), borderColor: '#38d9ca', borderDash: [7, 6], borderWidth: 1.4, pointRadius: 0 });
			yLabel = 'km/h';
		} else if (view === 'consistency') {
			datasets = [{
				label: 'Reaction CV %',
				data: repeatabilityHistory.map((session) => session.cv),
				backgroundColor: 'rgba(56,217,202,.72)',
				borderRadius: 5,
				maxBarThickness: 30
			}];
			yLabel = 'CV %';
		} else if (view === 'power') {
			datasets = [{
				...commonDataset,
				label: 'Average power (W)',
				data: powerHistory.map((session) => session.averageW),
				borderColor: '#ffb31a',
				backgroundColor: 'rgba(255,179,26,.10)',
				pointBackgroundColor: '#ffb31a'
			}];
			yLabel = 'W';
		} else if (view === 'power-peak') {
			datasets = [{
				label: 'Peak power (W)',
				data: powerPeakHistory.map((session) => session.peakW),
				backgroundColor: 'rgba(255,179,26,.72)',
				borderRadius: 5,
				maxBarThickness: 30
			}];
			yLabel = 'W';
		} else {
			reverse = true;
			datasets = [
				{
					...commonDataset,
					label: 'Best reaction (s)',
					data: reactionHistory.map((session) => session.bestReactionMs === null ? null : session.bestReactionMs / 1000),
					borderColor: '#96de27',
					backgroundColor: 'rgba(150,222,39,.10)',
					pointBackgroundColor: '#96de27'
				},
				{
					label: 'Average reaction (s)',
					data: reactionHistory.map((session) => session.averageReactionMs / 1000),
					borderColor: 'rgba(255,255,255,.34)',
					borderDash: [5, 5],
					borderWidth: 1.2,
					pointRadius: 0,
					fill: false,
					tension: 0.28
				}
			];
			const target = goalTargets.reactionTime?.target;
			if (target) datasets.push({ label: 'Goal', data: Array(reactionHistory.length).fill(target / 1000), borderColor: '#38d9ca', borderDash: [7, 6], borderWidth: 1.4, pointRadius: 0 });
			yLabel = 'seconds';
		}

		chart = new Chart(canvas, {
			type: view === 'consistency' || view === 'power-peak' ? 'bar' : 'line',
			data: { labels, datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { intersect: false, mode: 'index' },
				plugins: {
					legend: { display: view !== 'consistency' && view !== 'power-peak', labels: { color: '#8fa4b7', boxWidth: 9, boxHeight: 9, usePointStyle: true, font: { size: 10 } } },
					tooltip: { backgroundColor: '#091522', titleColor: '#fff', bodyColor: '#d8e4ef', borderColor: '#284159', borderWidth: 1 }
				},
				scales: {
					x: { grid: { display: false }, ticks: { color: '#657b90', maxTicksLimit: 8, font: { size: 10 } }, border: { color: '#20374b' } },
					y: { reverse, grid: { color: 'rgba(91,121,148,.14)' }, ticks: { color: '#657b90', font: { size: 10 } }, border: { display: false }, title: { display: true, text: yLabel, color: '#657b90', font: { size: 10 } } }
				}
			} as any
		});
	}

	$effect(() => { sessions.length; view; goalTargets; reactionEvidence; reactionRepeatabilityEvidence; peakSpeedEvidence; powerEvidence; powerPeakEvidence; canRender; draw(); });
	onDestroy(() => chart?.destroy());
</script>

<div class="chart-shell">
	<div class="chart-heading">
		<div>
			<span>Performance over time</span>
			<h2>{meta.title}</h2>
			<p>{meta.note}</p>
		</div>
		<div class="live-mark"><i style={`background:${meta.accent}`}></i> live evidence</div>
	</div>

	{#if view === 'reaction' && reactionEvidence}
		<div class="reaction-evidence-stack">
			<div class="evidence-summary" data-state={reactionEvidence.state}>
				<div class="evidence-label">
					<span>{reactionEvidence.presentation.label}</span>
					<small>{reactionEvidence.supportedSessionCount} supported session{reactionEvidence.supportedSessionCount === 1 ? '' : 's'}</small>
				</div>
				<p>{reactionEvidence.presentation.statement}</p>
			</div>

			{#if reactionContextEvidence}
				<div class="context-summary" data-state={reactionContextEvidence.state}>
					<div class="context-label">
						<span>{reactionContextEvidence.presentation.label}</span>
						{#if reactionContextEvidence.selected}
							<small>{reactionContextEvidence.selected.strength} evidence · n={reactionContextEvidence.selected.sampleSize}</small>
						{:else}
							<small>recorded context only</small>
						{/if}
					</div>
					<p>{reactionContextEvidence.presentation.statement}</p>
				</div>
			{/if}
		</div>
	{/if}

	{#if view === 'speed' && peakSpeedEvidence}
		<div class="reaction-evidence-stack">
			<div class="evidence-summary" data-state={peakSpeedEvidence.state}>
				<div class="evidence-label">
					<span>{peakSpeedEvidence.presentation.label}</span>
					<small>{peakSpeedEvidence.supportedSessionCount} validated-speed session{peakSpeedEvidence.supportedSessionCount === 1 ? '' : 's'}</small>
				</div>
				<p>{peakSpeedEvidence.presentation.statement}</p>
			</div>
		</div>
	{/if}

	{#if view === 'consistency' && reactionRepeatabilityEvidence}
		<div class="reaction-evidence-stack">
			<div class="repeatability-summary" data-state={reactionRepeatabilityEvidence.state}>
				<div class="evidence-label">
					<span>{reactionRepeatabilityEvidence.presentation.label}</span>
					<small>{reactionRepeatabilityEvidence.supportedSessionCount} CV-supported session{reactionRepeatabilityEvidence.supportedSessionCount === 1 ? '' : 's'}</small>
				</div>
				<p>{reactionRepeatabilityEvidence.presentation.statement}</p>
			</div>
		</div>
	{/if}

	{#if view === 'power' && powerEvidence}
		<div class="reaction-evidence-stack">
			<div class="evidence-summary" data-state={powerEvidence.state}>
				<div class="evidence-label">
					<span>{powerEvidence.presentation.label}</span>
					<small>{powerEvidence.supportedSessionCount} supported session{powerEvidence.supportedSessionCount === 1 ? '' : 's'}</small>
				</div>
				<p>{powerEvidence.presentation.statement}</p>
			</div>

			{#if powerContextEvidence}
				<div class="context-summary" data-state={powerContextEvidence.state}>
					<div class="context-label">
						<span>{powerContextEvidence.presentation.label}</span>
						{#if powerContextEvidence.selected}
							<small>{powerContextEvidence.selected.strength} evidence · n={powerContextEvidence.selected.sampleSize}</small>
						{:else}
							<small>recorded context only</small>
						{/if}
					</div>
					<p>{powerContextEvidence.presentation.statement}</p>
				</div>
			{/if}
		</div>
	{/if}

	{#if view === 'power-peak' && powerPeakEvidence}
		<div class="reaction-evidence-stack">
			<div class="repeatability-summary" data-state={powerPeakEvidence.state}>
				<div class="evidence-label">
					<span>{powerPeakEvidence.presentation.label}</span>
					<small>{powerPeakEvidence.supportedSessionCount} peak-supported session{powerPeakEvidence.supportedSessionCount === 1 ? '' : 's'}</small>
				</div>
				<p>{powerPeakEvidence.presentation.statement}</p>
			</div>
		</div>
	{/if}

	<div class="chart-stage">
		{#if !canRender}
			<div class="empty">
				{#if view === 'reaction'}
					<strong>Reaction history needs another supported observation.</strong>
					<span>Two sessions with average reaction evidence unlock observed history. Direction is only described when enough supported evidence exists.</span>
				{:else if view === 'consistency'}
					<strong>Repeatability history needs another supported session.</strong>
					<span>Two sessions with measurable reaction CV unlock observed repeatability history. A session needs at least two usable reaction observations before CV can be measured.</span>
				{:else if view === 'power'}
					<strong>Power history needs another supported observation.</strong>
					<span>Two sessions with an analytics-valid measured average power unlock observed history. Direction is only described when enough supported evidence exists.</span>
				{:else if view === 'power-peak'}
					<strong>Peak power history needs another supported session.</strong>
					<span>Two sessions with an analytics-valid measured peak power unlock observed history.</span>
				{:else}
					<strong>Peak Speed history needs another validated-speed session.</strong>
					<span>Two sessions with validated IMU peak-speed evidence unlock the longitudinal view. Unsupported account sessions do not promote this evidence.</span>
				{/if}
			</div>
		{:else}
			<canvas bind:this={canvas}></canvas>
		{/if}
	</div>
</div>

<style>
	.chart-shell {
		min-width: 0;
		border: 1px solid #1d3449;
		border-radius: 1rem;
		background: linear-gradient(180deg, rgba(10,27,43,.98), rgba(6,18,30,.98));
		padding: 1.2rem 1.2rem 1rem;
		box-shadow: 0 20px 45px rgba(0,0,0,.2);
	}

	.chart-heading {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: start;
	}

	.chart-heading span:first-child {
		font-size: .62rem;
		font-weight: 800;
		letter-spacing: .16em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	h2 { margin: .28rem 0 0; font-size: 1.2rem; color: #f7fbff; letter-spacing: -.025em; }
	p { margin: .22rem 0 0; font-size: .68rem; color: #73889b; }

	.live-mark {
		display: flex;
		align-items: center;
		gap: .4rem;
		font-size: .62rem;
		color: #8196a9;
		text-transform: uppercase;
		letter-spacing: .08em;
	}

	.live-mark i { width: .45rem; height: .45rem; border-radius: 999px; box-shadow: 0 0 12px currentColor; }

	.reaction-evidence-stack { display:grid; gap:.5rem; margin-top:.9rem; }
	.evidence-summary,
	.context-summary,
	.repeatability-summary {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: .9rem;
		padding: .72rem .82rem;
		border: 1px solid #203b53;
		border-radius: .72rem;
		background: rgba(12,29,45,.72);
	}

	.evidence-summary[data-state='early-signal'],
	.repeatability-summary[data-state='early-signal'] { border-color: rgba(255,179,26,.35); }
	.evidence-summary[data-state='supported-finding'] { border-color: rgba(141,229,30,.35); }
	.evidence-summary[data-state='directional-finding'] { border-color: rgba(255,117,85,.38); }
	.repeatability-summary[data-state='supported-finding'] { border-color: rgba(56,217,202,.38); background: rgba(19,53,62,.5); }
	.context-summary[data-state='contextual-finding'] { border-color: rgba(56,217,202,.38); background: rgba(19,53,62,.5); }
	.context-summary[data-state='no-pattern'] { border-style: dashed; }

	.evidence-label,
	.context-label { display: grid; gap: .12rem; min-width: 7.4rem; }
	.evidence-label span,
	.context-label span { color: #dce9f4; font-size: .63rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
	.evidence-label small,
	.context-label small { color: #7890a4; font-size: 0.55rem; text-transform:capitalize; }
	.evidence-summary p,
	.context-summary p,
	.repeatability-summary p { margin: 0; color: #9fb1c1; font-size: .65rem; line-height: 1.45; }

	.chart-stage { height: 20rem; margin-top: .8rem; }
	.empty { display: flex; height: 100%; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #74899d; }
	.empty strong { color: #edf5fc; font-size: 1rem; }
	.empty span { margin-top: .35rem; max-width: 25rem; font-size: .72rem; line-height: 1.5; }

	@media (max-width: 640px) {
		.chart-stage { height: 16rem; }
		.chart-heading { align-items: flex-start; }
		.live-mark { display: none; }
		.evidence-summary,
		.context-summary,
		.repeatability-summary { grid-template-columns: 1fr; gap: .45rem; }
	}
</style>