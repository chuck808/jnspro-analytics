<script lang="ts">
	import type { TechniqueScoreBreakdown } from '$lib/performance-engine/techniqueScoring';
	import { progressDimensionPalette, type ProgressDimensionKey } from './progressDimensionPalette';

	type ScoreKey = ProgressDimensionKey;

	interface SessionScorePoint {
		insightPack: {
			scores: TechniqueScoreBreakdown;
		};
	}

	interface Props {
		scores: TechniqueScoreBreakdown | null;
		sessionAnalyses?: SessionScorePoint[];
	}

	let { scores, sessionAnalyses = [] }: Props = $props();

	const definitions: Array<{ key: ScoreKey; label: string }> = [
		{ key: 'launchQuality', label: 'Launch quality' },
		{ key: 'explosiveness', label: 'Explosiveness' },
		{ key: 'impulseTiming', label: 'Impulse timing' },
		{ key: 'speedCarry', label: 'Speed carry' },
		{ key: 'smoothness', label: 'Smoothness' },
		{ key: 'repeatability', label: 'Repeatability' }
	];

	function valuesFor(key: ScoreKey) {
		return sessionAnalyses
			.map((item) => item.insightPack.scores[key])
			.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
			.slice(-10);
	}

	function sparkPoints(values: number[]) {
		if (values.length < 2) return '';
		return values
			.map((value, index) => {
				const x = 3 + (index / (values.length - 1)) * 94;
				const y = 30 - Math.max(0, Math.min(100, value)) * 0.24;
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}

	function movement(values: number[]) {
		if (values.length < 2) return null;
		return values.at(-1)! - values[0];
	}

	function band(value: number) {
		if (value >= 80) return 'Strong';
		if (value >= 65) return 'Developing';
		return 'Needs focus';
	}

	const dimensions = $derived.by(() => {
		if (!scores) return [];
		return definitions
			.map((definition) => {
				const value = scores[definition.key];
				if (typeof value !== 'number') return null;
				const history = valuesFor(definition.key);
				return {
					...definition,
					tone: progressDimensionPalette[definition.key],
					value,
					history,
					points: sparkPoints(history),
					delta: movement(history)
				};
			})
			.filter((item): item is NonNullable<typeof item> => item !== null);
	});
</script>

<section class="quality-layer" aria-labelledby="ride-quality-heading">
	<header>
		<div>
			<p class="eyebrow">3 · Ride quality</p>
			<h2 id="ride-quality-heading">How the start was produced</h2>
			<span>Latest Performance Engine scores with up to 10 supported-session trajectories. Missing dimensions stay missing.</span>
		</div>
		{#if typeof scores?.overall === 'number'}
			<div class="overall" aria-label={`Overall ride quality ${Math.round(scores.overall)} out of 100`}>
				<span>Overall</span>
				<strong>{Math.round(scores.overall)}</strong>
				<small>/100</small>
			</div>
		{/if}
	</header>

	{#if dimensions.length > 0}
		<div class="quality-grid">
			{#each dimensions as dimension}
				<article style={`--tone:${dimension.tone}`}>
					<div class="topline">
						<span>{dimension.label}</span>
						<small>{band(dimension.value)}</small>
					</div>

					<div class="scoreline">
						<div class="score"><strong>{Math.round(dimension.value)}</strong><span>/100</span></div>
						{#if dimension.delta !== null}
							<div class="delta" data-direction={dimension.delta >= 0 ? 'up' : 'down'}>
								<strong>{dimension.delta >= 0 ? '▲' : '▼'} {Math.abs(dimension.delta).toFixed(0)}</strong>
								<span>last {dimension.history.length}</span>
							</div>
						{:else}
							<div class="delta" data-direction="none"><span>building</span></div>
						{/if}
					</div>

					<div class="trajectory" aria-hidden="true">
						{#if dimension.points}
							<svg viewBox="0 0 100 34" preserveAspectRatio="none">
								<line x1="3" y1="30" x2="97" y2="30"></line>
								<line x1="3" y1="10.8" x2="97" y2="10.8" class="benchmark"></line>
								<polyline points={dimension.points}></polyline>
							</svg>
						{:else}
							<i></i>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<div class="developing">
			<strong>Ride-quality evidence is still developing.</strong>
			<span>These dimensions appear only when the Performance Engine has enough supported run data.</span>
		</div>
	{/if}
</section>

<style>
	.quality-layer { border: 1px solid #1e3a52; border-radius: 1rem; background: rgba(9, 25, 40, .94); padding: 1rem; }
	header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
	.eyebrow { margin: 0; color: #4ba3ff; font-size: .58rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
	h2 { margin: .28rem 0 0; font-size: 1rem; letter-spacing: -.02em; }
	header > div > span { display: block; margin-top: .25rem; color: #71889d; font-size: .62rem; }
	.overall { display: flex; align-items: baseline; gap: .15rem; color: #73899c; }
	.overall span { margin-right: .35rem; font-size: .56rem; text-transform: uppercase; letter-spacing: .1em; }
	.overall strong { color: #f7fbff; font-size: 1.8rem; line-height: 1; }
	.overall small { font-size: .58rem; }
	.quality-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .5rem; margin-top: .85rem; }
	article { min-width: 0; border: 1px solid rgba(91, 126, 154, .12); border-radius: .72rem; background: linear-gradient(160deg, rgba(15, 35, 52, .9), rgba(10, 27, 42, .78)); padding: .72rem; }
	.topline { display: flex; justify-content: space-between; gap: .35rem; font-size: .58rem; }
	.topline span { color: #a9bac8; font-weight: 700; }
	.topline small { color: var(--tone); font-size: .52rem; }
	.scoreline { display: flex; align-items: end; justify-content: space-between; gap: .6rem; margin-top: .48rem; }
	.score { display: flex; align-items: baseline; gap: .1rem; }
	.score strong { color: #f7fbff; font-size: 1.35rem; line-height: 1; }
	.score span { color: #647b90; font-size: .55rem; }
	.delta { display: grid; justify-items: end; gap: .05rem; min-width: 3.4rem; }
	.delta strong { font-size: .56rem; color: #8de51e; }
	.delta span { font-size: .48rem; color: #5f778d; }
	.delta[data-direction='down'] strong { color: #ff7354; }
	.trajectory { height: 2.2rem; margin-top: .45rem; }
	.trajectory svg { width: 100%; height: 100%; overflow: visible; }
	.trajectory line { stroke: #1d3a50; stroke-width: 1; }
	.trajectory .benchmark { stroke: color-mix(in srgb, var(--tone) 26%, transparent); stroke-dasharray: 3 4; }
	.trajectory polyline { fill: none; stroke: var(--tone); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
	.trajectory i { display: block; width: 100%; height: 1px; margin-top: 1.2rem; background: #294359; }
	.developing { display: grid; gap: .25rem; margin-top: .85rem; border-radius: .75rem; background: #0d2437; padding: .85rem; }
	.developing strong { color: #dce8f1; font-size: .72rem; }
	.developing span { color: #70879b; font-size: .62rem; }
	@media (max-width: 820px) { .quality-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 540px) { .quality-grid { grid-template-columns: 1fr; } header { align-items: flex-start; } }
</style>
