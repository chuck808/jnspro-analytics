<script lang="ts">
	import { progressDimensionPalette } from './progressDimensionPalette';
	import type { RiderDevelopmentEvidenceModel } from './riderDevelopmentEvidence';

	interface Props {
		evidence: RiderDevelopmentEvidenceModel;
		overall: number | null;
	}

	let { evidence, overall }: Props = $props();

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

	function labelText(label: string) {
		return label === 'needs-work'
			? 'Needs work'
			: label === 'unknown'
				? 'Measured'
				: `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
	}

	const dimensions = $derived(
		evidence.dimensions.map((dimension) => ({
			...dimension,
			tone: progressDimensionPalette[dimension.key],
			points: sparkPoints(dimension.history.map((point) => point.value))
		}))
	);
</script>

<section class="quality-layer" aria-labelledby="ride-quality-heading">
	<header>
		<div>
			<p class="eyebrow">3 · Ride quality</p>
			<h2 id="ride-quality-heading">How the start was produced</h2>
			<span>Performance Engine measurements and engine-owned labels. Lines show observed score history, not a Progress trend claim.</span>
		</div>
		{#if typeof overall === 'number' && Number.isFinite(overall)}
			<div class="overall" aria-label={`Overall ride quality ${Math.round(overall)} out of 100`}>
				<span>Overall</span>
				<strong>{Math.round(overall)}</strong>
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
						<small>{labelText(dimension.currentLabel)}</small>
					</div>

					<div class="scoreline">
						<div class="score"><strong>{Math.round(dimension.current)}</strong><span>/100</span></div>
						<div class="observation-count">
							<strong>{dimension.history.length}</strong>
							<span>observation{dimension.history.length === 1 ? '' : 's'}</span>
						</div>
					</div>

					<div class="trajectory" aria-hidden="true">
						{#if dimension.points}
							<svg viewBox="0 0 100 34" preserveAspectRatio="none">
								<line x1="3" y1="30" x2="97" y2="30"></line>
								<polyline points={dimension.points}></polyline>
							</svg>
						{:else}
							<i></i>
						{/if}
					</div>
					<span class="sr-only">{dimension.label}: {Math.round(dimension.current)} out of 100, {labelText(dimension.currentLabel)}, across {dimension.history.length} supported observation{dimension.history.length === 1 ? '' : 's'}. No direction is inferred.</span>
				</article>
			{/each}
		</div>
	{:else}
		<div class="developing">
			<strong>Ride-quality evidence is still developing.</strong>
			<span>{evidence.presentation.statement}</span>
		</div>
	{/if}
</section>

<style>
	.quality-layer { border: 1px solid #1e3a52; border-radius: 1rem; background: rgba(9, 25, 40, .94); padding: 1rem; }
	header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
	.eyebrow { margin: 0; color: #4ba3ff; font-size: .58rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
	h2 { margin: .28rem 0 0; font-size: 1rem; letter-spacing: -.02em; }
	header > div > span { display: block; margin-top: .25rem; color: #8196a8; font-size: .62rem; }
	.overall { display: flex; align-items: baseline; gap: .15rem; color: #8196a8; }
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
	.score span { color: #8196a8; font-size: .55rem; }
	.observation-count { display: grid; justify-items: end; gap: .05rem; min-width: 3.4rem; }
	.observation-count strong { font-size: .56rem; color: #b7c9d8; }
	.observation-count span { font-size: .48rem; color: #7890a4; }
	.trajectory { height: 2.2rem; margin-top: .45rem; }
	.trajectory svg { width: 100%; height: 100%; overflow: visible; }
	.trajectory line { stroke: #1d3a50; stroke-width: 1; }
	.trajectory polyline { fill: none; stroke: var(--tone); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
	.trajectory i { display: block; width: 100%; height: 1px; margin-top: 1.2rem; background: #294359; }
	.developing { display: grid; gap: .25rem; margin-top: .85rem; border-radius: .75rem; background: #0d2437; padding: .85rem; }
	.developing strong { color: #dce8f1; font-size: .72rem; }
	.developing span { color: #8196a8; font-size: .62rem; }
	.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
	@media (max-width: 820px) { .quality-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 540px) { .quality-grid { grid-template-columns: 1fr; } header { align-items: flex-start; } }
</style>
