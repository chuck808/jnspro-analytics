<script lang="ts">
	import type { ProgressView } from './ProgressPrimaryChart.svelte';

	interface SessionPoint {
		timestamp: string;
		best_reaction_ms: number | null;
		best_peak_speed_ms: number | null;
		reaction_cv: number | null;
	}

	interface Props {
		view: ProgressView;
		reactionTrend: number | null;
		speedTrend: number | null;
		latestReactionCv: number | null;
		sessions?: SessionPoint[];
		onSelect: (view: ProgressView) => void;
	}

	let { view, reactionTrend, speedTrend, latestReactionCv, sessions = [], onSelect }: Props = $props();

	function pct(value: number | null, lowerIsBetter = false) {
		if (value === null) return { value: '—', label: 'building evidence', tone: 'neutral' };
		if (Math.abs(value) < 1) return { value: 'Stable', label: 'recent window', tone: 'neutral' };
		const improving = lowerIsBetter ? value < 0 : value > 0;
		return { value: `${Math.abs(value).toFixed(1)}%`, label: improving ? 'improving' : 'declining', tone: improving ? 'good' : 'attention' };
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

	const recent = $derived(sessions.slice(-10));
	const historyLabel = $derived.by(() => {
		if (sessions.length === 0) return 'No session history';
		const first = dateLabel(sessions[0].timestamp);
		const last = dateLabel(sessions.at(-1)!.timestamp);
		return `${sessions.length} session${sessions.length === 1 ? '' : 's'} · ${first}–${last}`;
	});

	const rows = $derived.by(() => [
		{
			key: 'reaction' as const,
			label: 'Reaction',
			provenance: 'Measured',
			glyph: 'R',
			metric: pct(reactionTrend, true),
			points: sparkPoints(recent.map((session) => session.best_reaction_ms).filter((value): value is number => value !== null), true),
			evidenceCount: recent.filter((session) => session.best_reaction_ms !== null).length
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
			metric: latestReactionCv === null
				? { value: '—', label: 'building evidence', tone: 'neutral' }
				: { value: `${latestReactionCv.toFixed(1)}%`, label: latestReactionCv < 2 ? 'tight' : latestReactionCv < 5 ? 'developing' : 'variable', tone: latestReactionCv < 5 ? 'good' : 'attention' },
			points: sparkPoints(recent.map((session) => session.reaction_cv).filter((value): value is number => value !== null), true),
			evidenceCount: recent.filter((session) => session.reaction_cv !== null).length
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
	.heading > small { color:#5f778d; font-size:.56rem; white-space:nowrap; }
	h2 { margin: .28rem 0 0; font-size: 1.2rem; color: #f7fbff; letter-spacing: -.025em; }
	.heading p { margin: .25rem 0 0; font-size: .68rem; line-height: 1.45; color: #73889b; }

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
	.name small { margin-top: .15rem; color: #687f94; font-size: .59rem; }
	.spark { display:grid; gap:.18rem; min-width:0; }
	.spark svg { width:100%; height:1.7rem; overflow:visible; }
	.spark line { stroke:#1f3b50; stroke-width:1; }
	.spark polyline { fill:none; stroke:#62b2ff; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
	.spark i { display:block; width:100%; height:1px; background:#294359; }
	.spark small { color:#566e82; font-size:.48rem; text-align:right; }
	.metric { text-align: right; min-width:4.8rem; }
	.metric strong { font-size: .72rem; color: #aab9c7; }
	.metric small { margin-top: .14rem; font-size: .57rem; color: #63798e; }
	.metric[data-tone='good'] strong, .metric[data-tone='good'] small { color: #8fe12b; }
	.metric[data-tone='attention'] strong, .metric[data-tone='attention'] small { color: #ff7354; }
	.arrow { color: #63798e; font-size: 1.2rem; }

	.footer { display: flex; gap: .55rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid #173047; }
	.footer p { margin: 0; font-size: .61rem; line-height: 1.5; color: #657b8f; }
	.dot { flex: 0 0 auto; width: .42rem; height: .42rem; margin-top: .22rem; border-radius: 999px; background: #38d9ca; }

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
