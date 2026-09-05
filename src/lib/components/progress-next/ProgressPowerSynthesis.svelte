<script lang="ts">
	import type { PowerSynthesisEvidenceModel } from './powerSynthesisEvidence';

	interface Props {
		evidence: PowerSynthesisEvidenceModel;
	}

	let { evidence }: Props = $props();

	function claimLabel(kind: PowerSynthesisEvidenceModel['supportingClaims'][number]['kind']) {
		return kind === 'power-direction' ? 'Average power direction' : 'Peak power direction';
	}
</script>

<section class="synthesis" data-state={evidence.state} aria-labelledby="power-synthesis-heading">
	<div class="copy">
		<p>What the evidence suggests</p>
		<h2 id="power-synthesis-heading">Power development</h2>
		<span>{evidence.statement}</span>
	</div>

	<details>
		<summary>Why is this shown?</summary>
		<div class="evidence-list">
			{#each evidence.supportingClaims as claim}
				<div class="claim">
					<strong>{claimLabel(claim.kind)}</strong>
					<span>{claim.evidenceState} · {claim.supportedSessionCount} supported session{claim.supportedSessionCount === 1 ? '' : 's'} · latest window {claim.windowSize}</span>
					<small>{claim.sourceSessionIds.length} source session ID{claim.sourceSessionIds.length === 1 ? '' : 's'} retained for evidence traceability.</small>
				</div>
			{/each}
		</div>
	</details>
</section>

<style>
	.synthesis {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(18rem, .65fr);
		gap: 1rem;
		align-items: center;
		margin-top: .75rem;
		border: 1px solid #1f3a51;
		border-radius: 1rem;
		background: linear-gradient(135deg, rgba(12,32,48,.96), rgba(8,24,38,.96));
		padding: 1rem 1.1rem;
	}

	.synthesis[data-state='early-synthesis'] { border-color: rgba(255,179,26,.32); }
	.synthesis[data-state='supported-synthesis'] { border-color: rgba(141,229,30,.32); }

	.copy p {
		margin: 0;
		font-size: .58rem;
		font-weight: 800;
		letter-spacing: .15em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	h2 { margin: .24rem 0 0; font-size: .98rem; letter-spacing: -.02em; color: #f3f8fc; }
	.copy span { display:block; margin-top:.34rem; color:#9fb1c1; font-size:.7rem; line-height:1.5; }

	details { border-left: 1px solid #1c374d; padding-left: 1rem; }
	summary { cursor:pointer; color:#a9bfd1; font-size:.64rem; font-weight:750; }
	summary:focus-visible { outline:2px solid #66b4ff; outline-offset:3px; }
	.evidence-list { display:grid; gap:.55rem; margin-top:.65rem; }
	.claim { display:grid; gap:.12rem; }
	.claim strong { color:#e8f2fa; font-size:.61rem; }
	.claim span { color:#8298aa; font-size:.56rem; text-transform:capitalize; }
	.claim small { color:#627b90; font-size: 0.55rem; line-height:1.4; }

	@media (max-width: 760px) {
		.synthesis { grid-template-columns:1fr; }
		details { border-left:0; border-top:1px solid #1c374d; padding: .75rem 0 0; }
	}
</style>
