<script lang="ts">
	import type { StrengthsLimitersEvidenceModel } from './strengthsLimitersEvidence';

	interface Props {
		evidence: StrengthsLimitersEvidenceModel;
	}

	let { evidence }: Props = $props();

	function pct(count: number) {
		return evidence.supportedAnalysisCount > 0
			? Math.round((count / evidence.supportedAnalysisCount) * 100)
			: 0;
	}

	function when(value: string) {
		return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}
</script>

<section class="evolution" aria-labelledby="evolution-heading">
	<header>
		<div>
			<p class="eyebrow">7 · Strengths &amp; limiters</p>
			<h2 id="evolution-heading">Which engine-generated themes recur?</h2>
			<span>{evidence.presentation.statement}</span>
		</div>
		{#if evidence.supportedAnalysisCount > 0}
			<span class="window">{evidence.supportedAnalysisCount} supported analyses</span>
		{/if}
	</header>

	<div class="columns">
		<div class="column strengths">
			<h3>Repeated strengths</h3>
			{#if evidence.strengths.length > 0}
				{#each evidence.strengths as item}
					<div class="row">
						<div class="row-head"><span>{item.name}</span><b>{item.occurrenceCount} sessions</b></div>
						<div class="tracks" aria-label={`${item.name} appeared in ${item.occurrenceCount} of ${item.supportedAnalysisCount} supported analyses`}>
							<i class="current" style={`width:${pct(item.occurrenceCount)}%`}></i>
						</div>
						<small>{pct(item.occurrenceCount)}% of supported analyses · latest {when(item.latestTimestamp)}</small>
					</div>
				{/each}
			{:else}<p class="empty">No strength label has repeated across supported analyses yet.</p>{/if}
		</div>

		<div class="column limiters">
			<h3>Repeated limiters</h3>
			{#if evidence.limiters.length > 0}
				{#each evidence.limiters as item}
					<div class="row">
						<div class="row-head"><span>{item.name}</span><b>{item.occurrenceCount} sessions</b></div>
						<div class="tracks" aria-label={`${item.name} appeared in ${item.occurrenceCount} of ${item.supportedAnalysisCount} supported analyses`}>
							<i class="current" style={`width:${pct(item.occurrenceCount)}%`}></i>
						</div>
						<small>{pct(item.occurrenceCount)}% of supported analyses · latest {when(item.latestTimestamp)}</small>
					</div>
				{/each}
			{:else}<p class="empty">No limiter label has repeated across supported analyses yet.</p>{/if}
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
	.tracks { position:relative; height:.32rem; margin-top:.38rem; overflow:hidden; border-radius:999px; background:#11293b; }
	.tracks i { position:absolute; inset-block:0; left:0; border-radius:999px; }
	.current { background:#44d5c8; }
	.limiters .current { background:#f3a84a; }
	.row small { display:block; margin-top:.23rem; color:#536d82; font-size:.48rem; }
	.empty { margin:.3rem 0 0; color:#71889d; font-size:.58rem; line-height:1.4; }
	@media (max-width:760px) { .columns { grid-template-columns:1fr; } header { align-items:flex-start; } }
</style>
