<script lang="ts">
	import type { ProgressView } from './ProgressPrimaryChart.svelte';
	import type { ReactionEvidenceModel } from './reactionEvidence';
	import type { ReactionRepeatabilityEvidenceModel } from './reactionRepeatabilityEvidence';

	interface SessionPoint {
		timestamp: string;
		best_peak_speed_ms: number | null;
	}

	interface Props {
		view: ProgressView;
		reactionEvidence: ReactionEvidenceModel;
		speedTrend: number | null;
		reactionRepeatabilityEvidence: ReactionRepeatabilityEvidenceModel;
		sessions?: SessionPoint[];
		onSelect: (view: ProgressView) => void;
	}

	let { view, reactionEvidence, speedTrend, reactionRepeatabilityEvidence, sessions = [], onSelect }: Props = $props();

	function pct(value: number | null, lowerIsBetter = false) {
		if (value === null) return { value: '—', label: 'building evidence', tone: 'neutral' };
		if (Math.abs(value) < 1) return { value: 'Stable', label: 'recent window', tone: 'neutral' };
		const improving = lowerIsBetter ? value < 0 : value > 0;
		return { value: `${Math.abs(value).toFixed(1)}%`, label: improving ? 'improving' : 'declining', tone: improving ? 'good' : 'attention' };
	}

	function reactionMetric(model: ReactionEvidenceModel) {
		const finding = model.finding;
		if (!finding) return { value: '—', label: model.presentation.label.toLowerCase(), tone: 'neutral' };
		if (finding.direction === 'stable') return { value: 'Stable', label: model.state === 'early-signal' ? 'early signal' : 'supported', tone: 'neutral' };
		return {
			value: `${Math.abs(finding.changePercent).toFixed(1)}%`,
			label: model.state === 'early-signal' ? `appears ${finding.direction}` : finding.direction,
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

	const recent = $derived(sessions.slice(-10));
	const recentReaction = $derived(reactionEvidence.history.slice(-10));
	const recentRepeatability = $derived(reactionRepeatabilityEvidence.history.slice(-10));
	const historyLabel = $derived.by(() => {
		if (sessions.length === 0) return 'No session history';
		const first = dateLabel(sessions[0].timestamp);
		const last = dateLabel(sessions.at(-1)!.timestamp);
		return `${sessions.length} session${sessions.length === 1 ? '' : 's'} · ${first}–${last}`;
	});

	const consistencyMetric = $derived.by(() => {
		const latestCv = reactionRepeatabilityEvidence.latestCv;
		if (latestCv === null) return { value: '—', label: 'building evidence', tone: 'neutral' };
		return { value: `${latestCv.toFixed(1)}%`, label: 'latest session CV', tone: 'neutral' };
	});

	const rows = $derived.by(() => [
		{
			key: 'reaction' as const,
			label: 'Reaction',
			provenance: 'Measured',
			glyph: 'R',
			metric: reactionMetric(reactionEvidence),
			points: sparkPoints(recentReaction.map((session) => session.averageReactionMs), true),
			evidenceCount: recentReaction.length
		},
		{
			key: 'speed' as const,
			label: 'Peak speed',
			provenance: 'Validated IMU',
			glyph: 'S',
			metric: pct(speedTrend),
			points: sparkPoints(recent.map((session) => session.best_peak_speed_ms).filter((value): value is number => value !== null)),
			evidenceCount: recent.filter((session) => session.best_peak_speed_ms !== null).length
		},
		{
			key: 'consistency' as const,
			label: 'Consistency',
			provenance: 'Reaction CV',
			glyph: 'C',
			metric: consistencyMetric,
			points: sparkPoints(recentRepeatability.map((session) => session.cv), true),
			evidenceCount: recentRepeatability.length
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
				<span class="metric" data-tone={row.metric.tone}><strong>{row.metric.value}</strong><small>{row.metric.label}</small></span>
				<span class="arrow" aria-hidden="true">›</span>
			</button>
		{/each}
	</div>

	<div class="footer">
		<span class="dot"></span>
		<p>Mini trajectories use up to the latest 10 supported sessions. Better performance always moves upward visually.</p>
	</div>
</aside>

<style>
	.breakdown {
		display: flex;
		min-width: 0;
		flex-direction: column;
		border: 1px solid #1d3449;
		border-radius: 1rem;
		background: linear-gradient(180deg, rgba(10,27,43,.98), rgba(6,18,30,.98));
		padding: 1.2rem;
	}

	.heading { display:flex; align-items:start; justify-content:space-between; gap:1rem; }
	.heading > div > span { font-size: .62rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: #4ba3ff; }
	.heading > small { color:#7890a4; font-size:.56rem; white-space:nowrap; }
	h2 { margin: .28rem 0 0; font-size: 1.2rem; color: #f7fbff; letter-spacing: -.025em; }
	.heading p { margin: .25rem 0 0; font-size: .68rem; line-height: 1.45; color: #8196a8; }

	.rows { display: grid; gap: .5rem; margin-top: 1rem; }
	button {
		display: grid;
		grid-template-columns: 2rem minmax(5.8rem,1fr) 5.2rem auto 1rem;
		align-items: center;
		gap: .65rem;
		width: 100%;
		padding: .78rem .7rem;
		border: 1px solid transparent;
		border-radius: .75rem;
		background: rgba(255,255,255,.025);
		text-align: left;
		color: #dce8f3;
		cursor: pointer;
		transition: border-color 120ms ease, background 120ms ease, transform 120ms ease;
	}

	button:hover, button.active { border-color: #315470; background: rgba(75,163,255,.08); }
	button:hover { transform:translateY(-1px); }
	button.active { box-shadow: inset 3px 0 #4ba3ff; }
	button:focus-visible { outline:2px solid #66b4ff; outline-offset:2px; }

	.glyph { display: grid; place-items: center; width: 1.9rem; height: 1.9rem; border-radius: .55rem; background: #122b42; color: #62b2ff; font-size: .68rem; font-weight: 850; }
	.name strong, .name small, .metric strong, .metric small { display: block; }
	.name strong { font-size: .74rem; color: #edf5fc; }
	.name small { margin-top: .15rem; color: #7890a4; font-size: .59rem; }
	.spark { display:grid; gap:.18rem; min-width:0; }
	.spark svg { width:100%; height:1.7rem; overflow:visible; }
	.spark line { stroke:#1f3b50; stroke-width:1; }
	.spark polyline { fill:none; stroke:#62b2ff; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
	.spark i { display:block; width:100%; height:1px; background:#294359; }
	.spark small { color:#7890a4; font-size:.48rem; text-align:right; }
	.metric { text-align: right; min-width:4.8rem; }
	.metric strong { font-size: .72rem; color: #b8c5d0; }
	.metric small { margin-top: .14rem; font-size: .57rem; color: #7890a4; }
	.metric[data-tone='good'] strong, .metric[data-tone='good'] small { color: #8fe12b; }
	.metric[data-tone='attention'] strong, .metric[data-tone='attention'] small { color: #ff7354; }
	.arrow { color: #7890a4; font-size: 1.2rem; }

	.footer { display: flex; gap: .55rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid #173047; }
	.footer p { margin: 0; font-size: .61rem; line-height: 1.5; color: #7890a4; }
	.dot { flex: 0 0 auto; width: .42rem; height: .42rem; margin-top: .22rem; border-radius: 999px; background: #38d9ca; }
	.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

	@media (max-width: 1100px) {
		button { grid-template-columns:2rem minmax(0,1fr) 4.4rem auto 1rem; }
		.heading > small { display:none; }
	}

	@media (max-width: 900px) {
		.footer { margin-top: 1rem; }
	}

	@media (max-width: 520px) {
		button { grid-template-columns:2rem minmax(0,1fr) auto 1rem; }
		.spark { grid-column:2 / 4; grid-row:2; }
		.metric { grid-column:3; grid-row:1; }
		.arrow { grid-column:4; grid-row:1; }
	}
</style>
