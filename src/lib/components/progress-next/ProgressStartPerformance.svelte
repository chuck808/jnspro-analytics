<script lang="ts">
	import type { PeakSpeedEvidenceModel } from './peakSpeedEvidence';
	import type { ReactionEvidenceModel } from './reactionEvidence';

	interface SessionPoint {
		timestamp: string;
		best_peak_speed_ms: number | null;
		best_max_g: number | null;
	}

	interface Props {
		sessions: SessionPoint[];
		personalBests: {
			max_g: number | null;
		};
		reactionEvidence: ReactionEvidenceModel;
		peakSpeedEvidence: PeakSpeedEvidenceModel;
	}

	let { sessions, personalBests, reactionEvidence, peakSpeedEvidence }: Props = $props();
	const latest = $derived(sessions.at(-1) ?? null);
	const latestReaction = $derived(reactionEvidence.history.at(-1) ?? null);

	function fmtReaction(value: number | null | undefined) {
		return typeof value === 'number' ? `${(value / 1000).toFixed(3)}s` : '—';
	}

	function fmtSpeed(value: number | null | undefined) {
		return typeof value === 'number' ? `${(value * 3.6).toFixed(1)} km/h` : '—';
	}

	function fmtG(value: number | null | undefined) {
		return typeof value === 'number' ? `${value.toFixed(2)}G` : '—';
	}

	function series(key: 'best_max_g') {
		return sessions
			.slice(-10)
			.map((session) => session[key])
			.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
	}

	function sparkPoints(values: number[], lowerIsBetter = false) {
		if (!values.length) return '';
		if (values.length === 1) return '4,22 96,22';
		const min = Math.min(...values);
		const max = Math.max(...values);
		const spread = Math.max(max - min, Math.abs(max || 1) * 0.04);
		return values
			.map((value, index) => {
				const x = 4 + (index / (values.length - 1)) * 92;
				const normalised = (value - min) / spread;
				const score = lowerIsBetter ? 1 - normalised : normalised;
				const y = 36 - score * 28;
				return `${x.toFixed(1)},${Math.max(6, Math.min(36, y)).toFixed(1)}`;
			})
			.join(' ');
	}

	const reactionSeries = $derived(
		reactionEvidence.history
			.slice(-10)
			.map((session) => session.bestReactionMs)
			.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
	);
	const speedSeries = $derived(
		peakSpeedEvidence.history.slice(-10).map((session) => session.bestSpeedMs)
	);
	const forceSeries = $derived(series('best_max_g'));
</script>

<section class="start-layer" aria-labelledby="start-performance-heading">
	<header>
		<div>
			<p class="eyebrow">2 · Start performance</p>
			<h2 id="start-performance-heading">What the latest gate session delivered</h2>
			<span>Measured outputs first. Recent shape adds context without pretending one session is a trend.</span>
		</div>
		{#if latest}
			<time datetime={latest.timestamp}>{new Date(latest.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
		{/if}
	</header>

	<div class="metric-grid">
		<article class="metric reaction">
			<div class="metric-head"><span>Reaction</span><small>latest supported</small></div>
			<strong>{fmtReaction(latestReaction?.bestReactionMs)}</strong>
			<p>PB {fmtReaction(reactionEvidence.bestReactionMs)}</p>
			<svg class="micro-line" viewBox="0 0 100 42" preserveAspectRatio="none" aria-hidden="true">
				<line x1="4" y1="36" x2="96" y2="36"></line>
				<polyline points={sparkPoints(reactionSeries, true)}></polyline>
			</svg>
		</article>
		<article class="metric speed">
			<div class="metric-head"><span>Peak speed</span><small>validated IMU</small></div>
			<strong>{fmtSpeed(latest?.best_peak_speed_ms)}</strong>
			<p>PB {fmtSpeed(peakSpeedEvidence.bestSpeedMs)}</p>
			<svg class="micro-line" viewBox="0 0 100 42" preserveAspectRatio="none" aria-hidden="true">
				<line x1="4" y1="36" x2="96" y2="36"></line>
				<polyline points={sparkPoints(speedSeries)}></polyline>
			</svg>
		</article>
		<article class="metric force">
			<div class="metric-head"><span>Peak force</span><small>measured max G</small></div>
			<strong>{fmtG(latest?.best_max_g)}</strong>
			<p>PB {fmtG(personalBests.max_g)}</p>
			<svg class="micro-line" viewBox="0 0 100 42" preserveAspectRatio="none" aria-hidden="true">
				<line x1="4" y1="36" x2="96" y2="36"></line>
				<polyline points={sparkPoints(forceSeries)}></polyline>
			</svg>
		</article>
	</div>
</section>

<style>
	.start-layer {
		border: 1px solid #1e3a52;
		border-radius: 1rem;
		background: linear-gradient(145deg, rgba(12, 30, 47, .96), rgba(8, 22, 35, .96));
		padding: 1rem;
	}
	header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
	.eyebrow { margin: 0; color: #4ba3ff; font-size: .58rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
	h2 { margin: .28rem 0 0; font-size: 1rem; letter-spacing: -.02em; }
	header span, time { color: #71889d; font-size: .62rem; }
	header span { display: block; margin-top: .25rem; }
	time { white-space: nowrap; }
	.metric-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .55rem; margin-top: .85rem; }
	.metric { --tone:#4ba3ff; min-width: 0; border: 1px solid #1a344b; border-radius: .82rem; background: rgba(8, 23, 37, .88); padding: .85rem; }
	.metric.reaction { --tone:#8de51e; }
	.metric.speed { --tone:#35d4df; }
	.metric.force { --tone:#f0a719; }
	.metric-head { display: flex; justify-content: space-between; gap: .5rem; color: #9db1c3; font-size: .62rem; font-weight: 700; }
	.metric-head small { color: #5f778d; font-size: .54rem; font-weight: 500; }
	.metric strong { display: block; margin-top: .55rem; color: #f7fbff; font-size: clamp(1.25rem, 2.5vw, 2rem); line-height: 1; letter-spacing: -.035em; }
	.metric p { margin: .28rem 0 0; color: #70879b; font-size: .57rem; }
	.micro-line { display: block; width: 100%; height: 2.25rem; margin-top: .5rem; overflow: visible; color: var(--tone); }
	.micro-line line { stroke: #1d3a51; stroke-width: 1; vector-effect: non-scaling-stroke; }
	.micro-line polyline { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
	@media (max-width: 700px) { .metric-grid { grid-template-columns: 1fr; } header { align-items: flex-start; } }
</style>