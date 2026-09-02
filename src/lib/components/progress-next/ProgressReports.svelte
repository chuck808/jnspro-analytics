<script lang="ts">
	interface CoachLink {
		linkId: string;
		coachName: string;
	}

	interface Props {
		coachLinks: CoachLink[];
	}

	let { coachLinks }: Props = $props();
</script>

<section class="panel" aria-labelledby="reports-heading">
	<div>
		<p class="eyebrow">11 · Reports</p>
		<h2 id="reports-heading">Turn your history into something shareable</h2>
		<span class="intro">Reports remain on the previous analytics engine while the new Progress and Sessions evidence contracts are completed.</span>
	</div>

	<div class="report-card">
		<div class="icon" aria-hidden="true">▤</div>
		<div class="copy">
			<strong>Legacy progress report</strong>
			<span>Print or save the current analytics report as PDF. Its claims are not yet governed by the clean-sheet Progress evidence model.</span>
		</div>
	</div>

	<div class="capabilities" aria-label="Report capabilities">
		<span>Current analytics</span>
		<span>Print / PDF</span>
		{#if coachLinks.length > 0}<span>Coach share · {coachLinks.length}</span>{/if}
	</div>

	<a class="action" href="/analytics">Open current report builder <span aria-hidden="true">›</span></a>
	<p class="preview-note">The report engine will be updated after the clean-sheet Progress and Sessions contracts are complete, so this surface does not claim evidence parity yet.</p>
</section>

<style>
	.panel {
		height: 100%;
		border: 1px solid #1f3a51;
		border-radius: 1rem;
		background:
			radial-gradient(circle at 92% 95%, rgba(75, 163, 255, 0.1), transparent 11rem),
			linear-gradient(180deg, rgba(11, 30, 47, 0.96), rgba(8, 24, 38, 0.96));
		padding: 1rem;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	h2 { margin: 0.28rem 0 0; font-size: 0.92rem; letter-spacing: -0.02em; }
	.intro { display: block; margin-top: 0.32rem; color: #74899c; font-size: 0.58rem; line-height: 1.45; }

	.report-card {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.7rem;
		align-items: start;
		margin-top: 0.85rem;
		border: 1px solid #183249;
		border-radius: 0.75rem;
		background: rgba(8, 25, 40, 0.76);
		padding: 0.75rem;
	}

	.icon {
		display: grid;
		width: 2rem;
		height: 2rem;
		place-items: center;
		border-radius: 0.58rem;
		background: rgba(75, 163, 255, 0.12);
		color: #66b4ff;
		font-size: 0.9rem;
	}

	.copy strong { display: block; font-size: 0.72rem; }
	.copy span { display: block; margin-top: 0.2rem; color: #74899c; font-size: 0.55rem; line-height: 1.4; }
	.capabilities { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.65rem; }
	.capabilities span { border: 1px solid #1d3b55; border-radius: 999px; padding: 0.24rem 0.48rem; color: #8ba0b3; font-size: 0.55rem; }

	.action {
		display: flex;
		min-height: 2.3rem;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.75rem;
		border: 1px solid #28567a;
		border-radius: 0.65rem;
		padding: 0 0.7rem;
		color: #d9efff;
		font-size: 0.62rem;
		font-weight: 750;
		text-decoration: none;
	}

	.action:hover,
	.action:focus-visible { border-color: #55abf4; background: rgba(75, 163, 255, 0.08); outline: none; }
	.preview-note { margin: 0.62rem 0 0; color: #60768a; font-size: 0.55rem; line-height: 1.4; }
</style>
