<script lang="ts">
	import type { ProgressView } from './ProgressPrimaryChart.svelte';
	import type { ReactionEvidenceModel } from './reactionEvidence';
	import type { ReactionRepeatabilityEvidenceModel } from './reactionRepeatabilityEvidence';
	import type { PeakSpeedEvidenceModel } from './peakSpeedEvidence';
	import type { PowerEvidenceModel } from './powerEvidence';

	interface SessionPoint {
		timestamp: string;
		best_peak_speed_ms: number | null;
	}

	interface Props {
		view: ProgressView;
		reactionEvidence: ReactionEvidenceModel;
		peakSpeedEvidence: PeakSpeedEvidenceModel;
		reactionRepeatabilityEvidence: ReactionRepeatabilityEvidenceModel;
		powerEvidence: PowerEvidenceModel;
		sessions?: SessionPoint[];
		onSelect: (view: ProgressView) => void;
	}

	let {
		view,
		reactionEvidence,
		peakSpeedEvidence,
		reactionRepeatabilityEvidence,
		powerEvidence,
		sessions = [],
		onSelect
	}: Props = $props();

	function reactionMetric(model: ReactionEvidenceModel) {
		const finding = model.finding;
		if (!finding)
			return { value: '—', label: model.presentation.label.toLowerCase(), tone: 'neutral' };
		if (finding.direction === 'stable')
			return {
				value: 'Stable',
				label: model.state === 'early-signal' ? 'early signal' : 'supported',
				tone: 'neutral'
			};
		return {
			value: `${Math.abs(finding.changePercent).toFixed(1)}%`,
			label: model.state === 'early-signal' ? `appears ${finding.direction}` : finding.direction,
			tone: finding.direction === 'improving' ? 'good' : 'attention'
		};
	}

	function peakSpeedMetric(model: PeakSpeedEvidenceModel) {
		const finding = model.finding;
		if (!finding)
			return { value: '—', label: model.presentation.label.toLowerCase(), tone: 'neutral' };
		if (finding.direction === 'stable')
			return { value: 'Stable', label: 'supported', tone: 'neutral' };
		return {
			value: `${Math.abs(finding.changePercent).toFixed(1)}%`,
			label: finding.direction,
			tone: finding.direction === 'improving' ? 'good' : 'attention'
		};
	}

	function powerMetric(model: PowerEvidenceModel) {
		const finding = model.finding;
		if (!finding)
			return { value: '—', label: model.presentation.label.toLowerCase(), tone: 'neutral' };
		if (finding.direction === 'stable')
			return { value: 'Stable', label: 'supported', tone: 'neutral' };
		return {
			value: `${Math.abs(finding.changePercent).toFixed(1)}%`,
			label: finding.direction,
			tone: finding.direction === 'improving' ? 'good' : 'attention'
		};
	}

	function sparkPoints(values: number[], lowerIsBetter = false) {
		if (values.length < 2) return '';
		const min = Math.min(...values);
		const max = Math.max(...values);
		const range = max - min;
		return values
			.map((value, index) => {
				const raw = range === 0 ? 0.5 : (value - min) / range;
				const score = lowerIsBetter ? 1 - raw : raw;
				const x = (index / (values.length - 1)) * 72;
				const y = 22 - score * 18;
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}

	function dateLabel(value: string) {
		return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}

	function trajectoryLabel(label: string, count: number, metricLabel: string) {
		if (count < 2) return `${label} trajectory is still building.`;
		return `${label} trajectory across the latest ${count} supported sessions; current status is ${metricLabel}.`;
	}

	const recentReaction = $derived(reactionEvidence.history.slice(-10));
	const recentSpeed = $derived(peakSpeedEvidence.history.slice(-10));
	const recentRepeatability = $derived(reactionRepeatabilityEvidence.history.slice(-10));
	const recentPower = $derived(powerEvidence.history.slice(-10));
	const historyLabel = $derived.by(() => {
		if (sessions.length === 0) return 'No session history';
		const first = dateLabel(sessions[0].timestamp);
		const last = dateLabel(sessions.at(-1)!.timestamp);
		return `${sessions.length} session${sessions.length === 1 ? '' : 's'} · ${first}–${last}`;
	});

	const consistencyMetric = $derived.by(() => {
		const latestCv = reactionRepeatabilityEvidence.latestCv;
		if (latestCv === null)
			return { value: '—', label: 'building evidence', tone: 'neutral' };
		return { value: `${latestCv.toFixed(1)}%`, label: 'latest session CV', tone: 'neutral' };
	});

	const rows = $derived.by(() => [
		{
			key: 'reaction' as const,
			label: 'Reaction',
			provenance: 'Measured',
			glyph: 'R',
			metric: reactionMetric(reactionEvidence),
			points: sparkPoints(
				recentReaction.map((session) => session.averageReactionMs),
				true
			),
			evidenceCount: recentReaction.length
		},
		{
			key: 'speed' as const,
			label: 'Peak speed',
			provenance: 'Validated IMU',
			glyph: 'S',
			metric: peakSpeedMetric(peakSpeedEvidence),
			points: sparkPoints(recentSpeed.map((session) => session.bestSpeedMs)),
			evidenceCount: recentSpeed.length
		},
		{
			key: 'consistency' as const,
			label: 'Consistency',
			provenance: 'Reaction CV',
			glyph: 'C',
			metric: consistencyMetric,
			points: sparkPoints(
				recentRepeatability.map((session) => session.cv),
				true
			),
			evidenceCount: recentRepeatability.length
		},
		{
			key: 'power' as const,
			label: 'Power',
			provenance: 'Estimated physics',
			glyph: 'P',
			metric: powerMetric(powerEvidence),
			points: sparkPoints(recentPower.map((session) => session.averageW)),
			evidenceCount: recentPower.length
		}
	]);
</script>

<aside class="breakdown" aria-label="Improvement breakdown">
	<div class="heading">
		<div>
			<span>Improvement breakdown</span>
			<h2>What is moving?</h2>
			<p>Select a signal to bring its evidence into the main view.</p>
		</div>
		<small>{historyLabel}</small>
	</div>

	<div class="rows">
		{#each rows as row}
			<button
				type="button"
				class:active={view === row.key}
				aria-pressed={view === row.key}
				onclick={() => onSelect(row.key)}
			>
				<span class="glyph">{row.glyph}</span>
				<span class="name"><strong>{row.label}</strong><small>{row.provenance}</small></span>
				<span class="spark" aria-hidden="true">
					{#if row.points}
						<svg viewBox="0 0 72 26" preserveAspectRatio="none">
							<line x1="0" y1="22" x2="72" y2="22"></line>
							<polyline points={row.points}></polyline>
						</svg>
					{:else}
						<i></i>
					{/if}
					<small>{row.evidenceCount > 1 ? `last ${row.evidenceCount}` : 'building'}</small>
				</span>
				<span class="sr-only">{trajectoryLabel(row.label, row.evidenceCount, row.metric.label)}</span>
				<span class="metric" data-tone={row.metric.tone}
					><strong>{row.metric.value}</strong><small>{row.metric.label}</small></span
				>
				<span class="arrow" aria-hidden="true">›</span>
			</button>
		{/each}
	</div>

	<div class="footer">
		<span class="dot"></span>
		<p>
			Mini trajectories use up to the latest 10 supported sessions. Better performance always moves
			upward visually.
		</p>
	</div>
</aside>

<style>
	.breakdown {
		display: flex;
		min-width: 0;
		flex-direction: column;
		border: 1px solid #1d3449;
		border-radius: 1rem;
		background: linear-gradient(180deg, rgba(10, 27, 43, 0.98), rgba(6, 18, 30, 0.98));
		padding: 1.2rem;
	}

	.heading {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 1rem;
	}
	.heading > div > span {
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #4ba3ff;
	}
	.heading > small {
		color: #7890a4;
		font-size: 0.56rem;
		white-space: nowrap;
	}
	h2 {
		margin: 0.28rem 0 0;
		font-size: 1.2rem;
		color: #f7fbff;
		letter-spacing: -0.025em;
	}
	.heading p {
		margin: 0.25rem 0 0;
		font-size: 0.68rem;
		line-height: 1.45;
		color: #8196a8;
	}

	.rows {
		display: grid;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	button {
		display: grid;
		grid-template-columns: 2rem minmax(5.8rem, 1fr) 5.2rem auto 1rem;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.78rem 0.7rem;
		border: 1px solid #1c354b;
		border-radius: 0.75rem;
		background: #091827;
		color: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			border-color 120ms ease,
			background 120ms ease,
			transform 120ms ease;
	}
	button:hover {
		transform: translateY(-1px);
		border-color: #365b79;
	}
	button:focus-visible {
		outline: 2px solid #4ba3ff;
		outline-offset: 2px;
	}
	button.active {
		border-color: #4ba3ff;
		background: linear-gradient(90deg, rgba(75, 163, 255, 0.12), #091827 42%);
	}

	.glyph {
		display: grid;
		width: 1.8rem;
		height: 1.8rem;
		place-items: center;
		border: 1px solid #294862;
		border-radius: 0.5rem;
		background: #0c2032;
		font-size: 0.64rem;
		font-weight: 850;
		color: #8de51e;
	}
	.name {
		display: grid;
		gap: 0.12rem;
	}
	.name strong {
		font-size: 0.74rem;
		color: #f2f7fb;
	}
	.name small {
		font-size: 0.55rem;
		color: #60788d;
	}

	.spark {
		display: grid;
		gap: 0.12rem;
	}
	.spark svg {
		width: 4.5rem;
		height: 1.5rem;
		overflow: visible;
	}
	.spark line {
		stroke: #1d354a;
		stroke-width: 1;
	}
	.spark polyline {
		fill: none;
		stroke: #4ba3ff;
		stroke-width: 2;
		vector-effect: non-scaling-stroke;
	}
	.spark i {
		display: block;
		width: 4.5rem;
		height: 1px;
		background: #1d354a;
	}
	.spark small {
		font-size: 0.55rem;
		color: #597086;
	}

	.metric {
		display: grid;
		justify-items: end;
		gap: 0.08rem;
	}
	.metric strong {
		font-size: 0.78rem;
		color: #d9e5ef;
	}
	.metric small {
		font-size: 0.55rem;
		color: #71879a;
	}
	.metric[data-tone='good'] strong {
		color: #8de51e;
	}
	.metric[data-tone='attention'] strong {
		color: #ff7555;
	}
	.arrow {
		color: #536b80;
		font-size: 1rem;
	}

	.footer {
		display: flex;
		align-items: flex-start;
		gap: 0.45rem;
		margin-top: auto;
		padding-top: 0.9rem;
	}
	.footer p {
		margin: 0;
		font-size: 0.55rem;
		line-height: 1.45;
		color: #60778b;
	}
	.dot {
		width: 0.38rem;
		height: 0.38rem;
		flex: 0 0 auto;
		margin-top: 0.18rem;
		border-radius: 999px;
		background: #4ba3ff;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 720px) {
		button {
			grid-template-columns: 2rem minmax(0, 1fr) auto 1rem;
		}
		.spark {
			display: none;
		}
		.heading > small {
			display: none;
		}
	}
</style>
