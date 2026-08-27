<script lang="ts">
	import type { TechniqueScoreBreakdown } from '$lib/performance-engine/techniqueScoring';

	interface Props {
		scores: TechniqueScoreBreakdown | null;
	}

	let { scores }: Props = $props();

	const dimensions = $derived.by(() => {
		if (!scores) return [];
		return [
			{ key: 'launch', label: 'Launch quality', value: scores.launchQuality, tone: '#8de51e' },
			{ key: 'explosive', label: 'Explosiveness', value: scores.explosiveness, tone: '#35d4df' },
			{ key: 'timing', label: 'Impulse timing', value: scores.impulseTiming, tone: '#4ba3ff' },
			{ key: 'carry', label: 'Speed carry', value: scores.speedCarry, tone: '#31d2b2' },
			{ key: 'smooth', label: 'Smoothness', value: scores.smoothness, tone: '#bc78f2' },
			{ key: 'repeat', label: 'Repeatability', value: scores.repeatability, tone: '#f0a719' }
		].filter((item): item is { key: string; label: string; value: number; tone: string } => typeof item.value === 'number');
	});

	function band(value: number) {
		if (value >= 80) return 'Strong';
		if (value >= 65) return 'Developing';
		return 'Needs focus';
	}
</script>

<section class="quality-layer" aria-labelledby="ride-quality-heading">
	<header>
		<div>
			<p class="eyebrow">3 · Ride quality</p>
			<h2 id="ride-quality-heading">How the start was produced</h2>
			<span>Performance Engine dimensions from supported run evidence. Missing dimensions stay missing.</span>
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
					<div class="topline"><span>{dimension.label}</span><small>{band(dimension.value)}</small></div>
					<div class="score"><strong>{Math.round(dimension.value)}</strong><span>/100</span></div>
					<div class="track" aria-hidden="true"><i style={`width:${Math.max(0, Math.min(100, dimension.value))}%`}></i></div>
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
	article { min-width: 0; border-radius: .72rem; background: rgba(15, 35, 52, .78); padding: .72rem; }
	.topline { display: flex; justify-content: space-between; gap: .35rem; font-size: .58rem; }
	.topline span { color: #a9bac8; font-weight: 700; }
	.topline small { color: var(--tone); font-size: .52rem; }
	.score { display: flex; align-items: baseline; gap: .1rem; margin-top: .48rem; }
	.score strong { color: #f7fbff; font-size: 1.35rem; line-height: 1; }
	.score span { color: #647b90; font-size: .55rem; }
	.track { height: .28rem; margin-top: .55rem; overflow: hidden; border-radius: 999px; background: #13293c; }
	.track i { display: block; height: 100%; border-radius: inherit; background: var(--tone); box-shadow: 0 0 .75rem color-mix(in srgb, var(--tone) 55%, transparent); }
	.developing { display: grid; gap: .25rem; margin-top: .85rem; border-radius: .75rem; background: #0d2437; padding: .85rem; }
	.developing strong { color: #dce8f1; font-size: .72rem; }
	.developing span { color: #70879b; font-size: .62rem; }
	@media (max-width: 820px) { .quality-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 540px) { .quality-grid { grid-template-columns: 1fr; } header { align-items: flex-start; } }
</style>
