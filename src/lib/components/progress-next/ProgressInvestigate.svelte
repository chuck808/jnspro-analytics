<script lang="ts">
	import type { InvestigateEvidenceModel } from './investigateEvidence';

	interface Props {
		evidence: InvestigateEvidenceModel;
	}

	let { evidence }: Props = $props();

	const maxCount = $derived(Math.max(1, ...evidence.signals.map((signal) => signal.occurrenceCount)));

	function when(value: string) {
		return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}
</script>

<section class="investigate" aria-labelledby="investigate-heading">
	<header>
		<p class="eyebrow">6 · Worth investigating</p>
		<h2 id="investigate-heading">Signals the engine has noticed more than once</h2>
		<span>{evidence.presentation.statement}</span>
	</header>

	{#if evidence.signals.length > 0}
		<div class="signal-list">
			{#each evidence.signals as signal}
				<article data-tone={signal.latestTone}>
					<div class="signal-icon" aria-hidden="true">{signal.latestTone === 'warning' ? '!' : signal.latestTone === 'positive' ? '↗' : '·'}</div>
					<div class="signal-copy">
						<strong>{signal.title}</strong>
						<span>{signal.occurrenceCount} occurrence{signal.occurrenceCount === 1 ? '' : 's'} across {signal.supportedAnalysisCount} supported analyses · latest {when(signal.latestTimestamp)}</span>
						<div class="frequency" aria-label={`${signal.occurrenceCount} occurrences`}>
							<i style={`width:${Math.max(8, (signal.occurrenceCount / maxCount) * 100)}%`}></i>
						</div>
					</div>
					<a href={`/sessions/${signal.latestSessionId}/analysis`} aria-label={`Open latest session evidence for ${signal.title}`}>Evidence</a>
				</article>
			{/each}
		</div>
	{:else}
		<div class="empty">
			<strong>No recurring diagnostic signal yet.</strong>
			<span>{evidence.presentation.statement}</span>
		</div>
	{/if}
</section>

<style>
	.investigate { min-width:0; border:1px solid #1e3a52; border-radius:1rem; background:linear-gradient(145deg,rgba(12,30,47,.96),rgba(8,22,35,.96)); padding:1rem; }
	.eyebrow { margin:0; color:#4ba3ff; font-size:.58rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
	h2 { margin:.28rem 0 0; font-size:1rem; letter-spacing:-.02em; }
	header span { display:block; margin-top:.25rem; color:#71889d; font-size:.62rem; }
	.signal-list { display:grid; gap:.45rem; margin-top:.85rem; }
	.signal-list article { --tone:#4ba3ff; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:.65rem; min-width:0; padding:.68rem; border:1px solid #19344a; border-radius:.72rem; background:rgba(7,22,35,.86); }
	.signal-list article[data-tone='warning'] { --tone:#ff8a3d; }
	.signal-list article[data-tone='positive'] { --tone:#47d789; }
	.signal-icon { display:grid; width:1.7rem; height:1.7rem; place-items:center; border-radius:.5rem; background:color-mix(in srgb,var(--tone) 12%,transparent); color:var(--tone); font-size:.7rem; font-weight:900; }
	.signal-copy { min-width:0; }
	.signal-copy strong { display:block; overflow:hidden; color:#e8f2fb; font-size:.66rem; text-overflow:ellipsis; white-space:nowrap; }
	.signal-copy span { display:block; margin-top:.15rem; color:#70879b; font-size:.52rem; }
	.frequency { height:.22rem; margin-top:.42rem; overflow:hidden; border-radius:999px; background:#132a3d; }
	.frequency i { display:block; height:100%; border-radius:inherit; background:var(--tone); opacity:.85; }
	article a { border:1px solid #29465d; border-radius:.48rem; padding:.35rem .48rem; color:#9cb1c3; font-size:.52rem; text-decoration:none; }
	article a:hover { border-color:var(--tone); color:#fff; }
	.empty { margin-top:.85rem; padding:1rem; border:1px dashed #244259; border-radius:.75rem; background:rgba(8,23,37,.55); }
	.empty strong { display:block; color:#cbd9e5; font-size:.7rem; }
	.empty span { display:block; margin-top:.25rem; color:#71889d; font-size:.58rem; line-height:1.4; }
	@media (max-width:620px) { .signal-list article { grid-template-columns:auto minmax(0,1fr); } article a { grid-column:2; justify-self:start; } }
</style>
