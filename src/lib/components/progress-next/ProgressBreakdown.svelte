<script lang="ts">
	import type { ProgressView } from './ProgressPrimaryChart.svelte';

	interface Props {
		view: ProgressView;
		reactionTrend: number | null;
		speedTrend: number | null;
		latestReactionCv: number | null;
		onSelect: (view: ProgressView) => void;
	}

	let { view, reactionTrend, speedTrend, latestReactionCv, onSelect }: Props = $props();

	function pct(value: number | null, lowerIsBetter = false) {
		if (value === null) return { value: '—', label: 'building evidence', tone: 'neutral' };
		if (Math.abs(value) < 1) return { value: 'Stable', label: 'recent window', tone: 'neutral' };
		const improving = lowerIsBetter ? value < 0 : value > 0;
		return { value: `${Math.abs(value).toFixed(1)}%`, label: improving ? 'improving' : 'declining', tone: improving ? 'good' : 'attention' };
	}

	const rows = $derived([
		{ key: 'reaction' as const, label: 'Reaction', provenance: 'Measured', glyph: 'R', metric: pct(reactionTrend, true) },
		{ key: 'speed' as const, label: 'Peak speed', provenance: 'Validated IMU', glyph: 'S', metric: pct(speedTrend) },
		{
			key: 'consistency' as const,
			label: 'Consistency',
			provenance: 'Reaction CV',
			glyph: 'C',
			metric: latestReactionCv === null
				? { value: '—', label: 'building evidence', tone: 'neutral' }
				: { value: `${latestReactionCv.toFixed(1)}%`, label: latestReactionCv < 2 ? 'tight' : latestReactionCv < 5 ? 'developing' : 'variable', tone: latestReactionCv < 5 ? 'good' : 'attention' }
		}
	]);
</script>

<aside class="breakdown" aria-label="Improvement breakdown">
	<div class="heading">
		<span>Improvement breakdown</span>
		<h2>What is moving?</h2>
		<p>Select a signal to bring its evidence into the main view.</p>
	</div>

	<div class="rows">
		{#each rows as row}
			<button class:active={view === row.key} onclick={() => onSelect(row.key)}>
				<span class="glyph">{row.glyph}</span>
				<span class="name"><strong>{row.label}</strong><small>{row.provenance}</small></span>
				<span class="metric" data-tone={row.metric.tone}><strong>{row.metric.value}</strong><small>{row.metric.label}</small></span>
				<span class="arrow" aria-hidden="true">›</span>
			</button>
		{/each}
	</div>

	<div class="footer">
		<span class="dot"></span>
		<p>Recent signals explain the overview; deeper evidence keeps the full history available.</p>
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

	.heading > span { font-size: .62rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: #4ba3ff; }
	h2 { margin: .28rem 0 0; font-size: 1.2rem; color: #f7fbff; letter-spacing: -.025em; }
	.heading p { margin: .25rem 0 0; font-size: .68rem; line-height: 1.45; color: #73889b; }

	.rows { display: grid; gap: .45rem; margin-top: 1rem; }
	button {
		display: grid;
		grid-template-columns: 2rem minmax(0,1fr) auto 1rem;
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
	}

	button:hover, button.active { border-color: #315470; background: rgba(75,163,255,.08); }
	button.active { box-shadow: inset 3px 0 #4ba3ff; }

	.glyph { display: grid; place-items: center; width: 1.9rem; height: 1.9rem; border-radius: .55rem; background: #122b42; color: #62b2ff; font-size: .68rem; font-weight: 850; }
	.name strong, .name small, .metric strong, .metric small { display: block; }
	.name strong { font-size: .74rem; color: #edf5fc; }
	.name small { margin-top: .15rem; color: #687f94; font-size: .59rem; }
	.metric { text-align: right; }
	.metric strong { font-size: .72rem; color: #aab9c7; }
	.metric small { margin-top: .14rem; font-size: .57rem; color: #63798e; }
	.metric[data-tone='good'] strong, .metric[data-tone='good'] small { color: #8fe12b; }
	.metric[data-tone='attention'] strong, .metric[data-tone='attention'] small { color: #ff7354; }
	.arrow { color: #63798e; font-size: 1.2rem; }

	.footer { display: flex; gap: .55rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid #173047; }
	.footer p { margin: 0; font-size: .61rem; line-height: 1.5; color: #657b8f; }
	.dot { flex: 0 0 auto; width: .42rem; height: .42rem; margin-top: .22rem; border-radius: 999px; background: #38d9ca; }

	@media (max-width: 900px) {
		.footer { margin-top: 1rem; }
	}
</style>
