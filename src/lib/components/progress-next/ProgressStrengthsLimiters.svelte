<script lang="ts">
	interface InsightPackLike {
		strengths?: string[];
		limiters?: string[];
	}

	interface SessionAnalysisLike {
		insightPack?: InsightPackLike;
	}

	interface Props {
		sessionAnalyses: SessionAnalysisLike[];
	}

	let { sessionAnalyses }: Props = $props();

	function tally(key: 'strengths' | 'limiters', sessions: SessionAnalysisLike[]) {
		const map = new Map<string, number>();
		for (const session of sessions) {
			for (const item of session.insightPack?.[key] ?? []) map.set(item, (map.get(item) ?? 0) + 1);
		}
		return map;
	}

	const comparison = $derived.by(() => {
		if (sessionAnalyses.length === 0) return { strengths: [], limiters: [], recentCount: 0 };
		const split = Math.max(1, Math.floor(sessionAnalyses.length / 2));
		const earlier = sessionAnalyses.slice(0, split);
		const recent = sessionAnalyses.slice(split);
		const recentWindow = recent.length ? recent : earlier;

		const build = (key: 'strengths' | 'limiters') => {
			const earlierMap = tally(key, earlier);
			const recentMap = tally(key, recentWindow);
			const names = new Set([...earlierMap.keys(), ...recentMap.keys()]);
			return [...names]
				.map((name) => {
					const recentShare = recentWindow.length ? (recentMap.get(name) ?? 0) / recentWindow.length : 0;
					const earlierShare = earlier.length ? (earlierMap.get(name) ?? 0) / earlier.length : 0;
					return { name, recentShare, earlierShare, delta: recentShare - earlierShare };
				})
				.filter((item) => item.recentShare > 0 || item.earlierShare > 0)
				.sort((a, b) => b.recentShare - a.recentShare)
				.slice(0, 4);
		};

		return {
			strengths: build('strengths'),
			limiters: build('limiters'),
			recentCount: recentWindow.length
		};
	});

	function pct(value: number) {
		return Math.round(value * 100);
	}

	function direction(delta: number, limiter = false) {
		if (Math.abs(delta) < 0.05) return 'steady';
		const rising = delta > 0;
		if (limiter) return rising ? 'more frequent' : 'easing';
		return rising ? 'more frequent' : 'less frequent';
	}
</script>

<section class="evolution" aria-labelledby="evolution-heading">
	<header>
		<div>
			<p class="eyebrow">7 · Strengths & limiters evolution</p>
			<h2 id="evolution-heading">Which themes are persisting?</h2>
			<span>Frequency across supported session analyses — recent half compared with the earlier half.</span>
		</div>
		{#if comparison.recentCount > 0}<span class="window">last {comparison.recentCount}</span>{/if}
	</header>

	<div class="columns">
		<div class="column strengths">
			<h3>Top strengths</h3>
			{#if comparison.strengths.length > 0}
				{#each comparison.strengths as item}
					<div class="row">
						<div class="row-head"><span>{item.name}</span><b>{direction(item.delta)}</b></div>
						<div class="tracks">
							<i class="previous" style={`width:${pct(item.earlierShare)}%`}></i>
							<i class="current" style={`width:${pct(item.recentShare)}%`}></i>
						</div>
						<small>{pct(item.recentShare)}% recent · {pct(item.earlierShare)}% earlier</small>
					</div>
				{/each}
			{:else}<p class="empty">No repeated strength label yet.</p>{/if}
		</div>

		<div class="column limiters">
			<h3>Key limiters</h3>
			{#if comparison.limiters.length > 0}
				{#each comparison.limiters as item}
					<div class="row">
						<div class="row-head"><span>{item.name}</span><b>{direction(item.delta, true)}</b></div>
						<div class="tracks">
							<i class="previous" style={`width:${pct(item.earlierShare)}%`}></i>
							<i class="current" style={`width:${pct(item.recentShare)}%`}></i>
						</div>
						<small>{pct(item.recentShare)}% recent · {pct(item.earlierShare)}% earlier</small>
					</div>
				{/each}
			{:else}<p class="empty">No repeated limiter label yet.</p>{/if}
		</div>
	</div>
</section>

<style>
	.evolution { min-width:0; border:1px solid #1e3a52; border-radius:1rem; background:linear-gradient(145deg,rgba(12,30,47,.96),rgba(8,22,35,.96)); padding:1rem; }
	header { display:flex; align-items:end; justify-content:space-between; gap:1rem; }
	.eyebrow { margin:0; color:#4ba3ff; font-size:.58rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
	h2 { margin:.28rem 0 0; font-size:1rem; letter-spacing:-.02em; }
	header div > span, .window { color:#71889d; font-size:.62rem; }
	header div > span { display:block; margin-top:.25rem; }
	.window { white-space:nowrap; }
	.columns { display:grid; grid-template-columns:1fr 1fr; gap:.7rem; margin-top:.85rem; }
	.column { min-width:0; border:1px solid #183349; border-radius:.78rem; background:rgba(7,22,35,.72); padding:.78rem; }
	h3 { margin:0 0 .6rem; color:#a9bfd0; font-size:.62rem; text-transform:uppercase; letter-spacing:.08em; }
	.row + .row { margin-top:.62rem; }
	.row-head { display:flex; justify-content:space-between; gap:.5rem; align-items:center; }
	.row-head span { min-width:0; overflow:hidden; color:#dce8f2; font-size:.62rem; font-weight:650; text-overflow:ellipsis; white-space:nowrap; }
	.row-head b { color:#71889d; font-size:.5rem; font-weight:600; white-space:nowrap; }
	.strengths .row-head b { color:#44d5c8; }
	.limiters .row-head b { color:#f3a84a; }
	.tracks { position:relative; height:.48rem; margin-top:.38rem; overflow:hidden; border-radius:999px; background:#11293b; }
	.tracks i { position:absolute; left:0; border-radius:999px; }
	.previous { top:0; height:.18rem; background:#456075; opacity:.8; }
	.current { bottom:0; height:.24rem; background:#44d5c8; }
	.limiters .current { background:#f3a84a; }
	.row small { display:block; margin-top:.23rem; color:#536d82; font-size:.48rem; }
	.empty { margin:.3rem 0 0; color:#71889d; font-size:.58rem; }
	@media (max-width:760px) { .columns { grid-template-columns:1fr; } header { align-items:flex-start; } }
</style>
