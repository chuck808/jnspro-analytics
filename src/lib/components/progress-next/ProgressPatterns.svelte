<script lang="ts">
	import type { CorrelationInsight } from '$lib/analytics/correlationAnalysis';
	import { buildVisiblePatternInsights, type ProgressPatternInsight } from './progressPatternInsights';

	interface Props {
		insights: CorrelationInsight[];
		suppressedInsightIds?: string[];
	}

	let { insights, suppressedInsightIds = [] }: Props = $props();

	const visible = $derived(buildVisiblePatternInsights(insights, suppressedInsightIds));

	function position(r: number) {
		return 50 + Math.max(-1, Math.min(1, r)) * 44;
	}

	function confidenceLabel(insight: ProgressPatternInsight) {
		if (insight.significant && insight.sampleSize >= 15) return `${insight.strength} evidence`;
		if (insight.sampleSize >= 10) return `${insight.strength} · developing`;
		return `${insight.strength} · early`;
	}
</script>

<section class="patterns" aria-labelledby="patterns-heading">
	<header>
		<div>
			<p class="eyebrow">5 · Patterns around your riding</p>
			<h2 id="patterns-heading">What context appears related to performance?</h2>
			<span>Associations and observed group differences, not causes. Linear findings show Pearson r; categorical findings do not.</span>
		</div>
		{#if visible.length > 0}<span class="history">supported n shown per finding</span>{/if}
	</header>

	{#if visible.length > 0}
		<div class="pattern-grid">
			{#each visible as insight}
				<article class="pattern-card">
					<div class="pattern-head">
						<div>
							<strong>{insight.title}</strong>
							<span>{confidenceLabel(insight)}</span>
						</div>
						{#if insight.kind === 'linear-association' && insight.correlation !== null}
							<b>r={insight.correlation >= 0 ? '+' : ''}{insight.correlation.toFixed(2)}</b>
						{:else}
							<b class="categorical">group difference</b>
						{/if}
					</div>
					{#if insight.kind === 'linear-association' && insight.correlation !== null}
						<div class="axis" aria-hidden="true">
							<i class="negative"></i>
							<i class="positive"></i>
							<span class="centre"></span>
							<span class="marker" style={`left:${position(insight.correlation)}%`}></span>
						</div>
						<div class="axis-labels"><span>negative</span><span>none</span><span>positive</span></div>
					{:else}
						<div class="categorical-note">Categorical comparison — no linear correlation coefficient applies.</div>
					{/if}
					<p>{insight.description}</p>
					<footer><span>supported n={insight.sampleSize}</span><span>{insight.strength}</span></footer>
				</article>
			{/each}
		</div>
	{:else}
		<div class="empty">
			<strong>Context needs more repeated evidence.</strong>
			<span>Useful patterns appear only when comparable sessions support them.</span>
		</div>
	{/if}
</section>

<style>
	.patterns { min-width: 0; border: 1px solid #1e3a52; border-radius: 1rem; background: linear-gradient(145deg, rgba(12,30,47,.96), rgba(8,22,35,.96)); padding: 1rem; }
	header { display:flex; align-items:end; justify-content:space-between; gap:1rem; }
	.eyebrow { margin:0; color:#4ba3ff; font-size:.58rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
	h2 { margin:.28rem 0 0; font-size:1rem; letter-spacing:-.02em; }
	header div > span, .history { color:#71889d; font-size:.62rem; }
	header div > span { display:block; margin-top:.25rem; }
	.history { white-space:nowrap; }
	.pattern-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.55rem; margin-top:.85rem; }
	.pattern-card { min-width:0; border:1px solid #19344a; border-radius:.8rem; background:rgba(7,22,35,.86); padding:.8rem; }
	.pattern-head { display:flex; justify-content:space-between; gap:.7rem; align-items:start; }
	.pattern-head strong { display:block; color:#e8f2fb; font-size:.68rem; line-height:1.25; }
	.pattern-head span { display:block; margin-top:.18rem; color:#70879b; font-size:.54rem; text-transform:capitalize; }
	.pattern-head b { color:#37d5df; font-size:.78rem; font-variant-numeric:tabular-nums; }
	.pattern-head b.categorical { max-width:6rem; color:#9bb1c3; font-size:.52rem; font-weight:700; line-height:1.2; text-align:right; text-transform:uppercase; }
	.axis { position:relative; height:.42rem; margin-top:.8rem; border-radius:999px; overflow:visible; background:#122a3d; }
	.axis > i { position:absolute; inset-block:0; width:50%; opacity:.35; }
	.negative { left:0; background:linear-gradient(90deg,#ff7354,transparent); border-radius:999px 0 0 999px; }
	.positive { right:0; background:linear-gradient(90deg,transparent,#8de51e); border-radius:0 999px 999px 0; }
	.centre { position:absolute; left:50%; top:-.18rem; width:1px; height:.78rem; background:#4c6478; }
	.marker { position:absolute; top:50%; width:.62rem; height:.62rem; border:2px solid #06111d; border-radius:50%; background:#f7fbff; transform:translate(-50%,-50%); box-shadow:0 0 0 1px #4ba3ff; }
	.axis-labels { display:flex; justify-content:space-between; margin-top:.28rem; color:#4f687d; font-size:.48rem; text-transform:uppercase; letter-spacing:.06em; }
	.categorical-note { margin-top:.72rem; border-radius:.45rem; background:#10293d; padding:.48rem .55rem; color:#71889d; font-size:.5rem; line-height:1.35; }
	.pattern-card p { min-height:3.1em; margin:.6rem 0 0; color:#93a8ba; font-size:.58rem; line-height:1.45; }
	.pattern-card footer { display:flex; justify-content:space-between; gap:.5rem; margin-top:.55rem; padding-top:.5rem; border-top:1px solid #162f43; color:#5f778d; font-size:.52rem; text-transform:capitalize; }
	.empty { margin-top:.85rem; padding:1.1rem; border:1px dashed #244259; border-radius:.8rem; background:rgba(8,23,37,.55); }
	.empty strong { display:block; color:#cbd9e5; font-size:.72rem; }
	.empty span { display:block; margin-top:.25rem; color:#71889d; font-size:.6rem; }
	@media (max-width:1100px) { .pattern-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
	@media (max-width:650px) { .pattern-grid { grid-template-columns:1fr; } header { align-items:flex-start; } }
</style>
