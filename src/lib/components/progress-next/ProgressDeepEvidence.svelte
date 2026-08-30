<script lang="ts">
	interface Props {
		latestSessionId: string | null;
		latestAnalyzedSessionId: string | null;
		sessionCount: number;
	}

	let { latestSessionId, latestAnalyzedSessionId, sessionCount }: Props = $props();

	const evidence = $derived([
		{
			label: 'Session analysis',
			detail: latestAnalyzedSessionId
				? 'Latest supported session intelligence'
				: 'No supported session analysis yet',
			href: latestAnalyzedSessionId ? `/sessions/${latestAnalyzedSessionId}/analysis` : '/sessions',
			mark: 'A'
		},
		{
			label: 'Run evidence',
			detail: latestSessionId ? 'Inspect the run-level measurements and curves' : 'Browse recorded sessions',
			href: latestSessionId ? `/sessions/${latestSessionId}/detail` : '/sessions',
			mark: 'R'
		},
		{
			label: 'Session history',
			detail: `${sessionCount} eligible gate session${sessionCount === 1 ? '' : 's'} in this Progress record`,
			href: '/sessions',
			mark: 'S'
		},
		{
			label: 'Reference evidence',
			detail: 'Open the retained longitudinal reference workspace',
			href: '/analytics',
			mark: '↗'
		}
	]);
</script>

<section class="panel" aria-labelledby="deep-evidence-heading">
	<div class="heading">
		<div>
			<p>8 · Deep evidence</p>
			<h2 id="deep-evidence-heading">Follow the story back to the proof</h2>
			<span>Overview stays shallow. Measurements and session-level detail remain one step away.</span>
		</div>
	</div>

	<div class="evidence-grid">
		{#each evidence as item}
			<a href={item.href} class="evidence-link">
				<span class="mark" aria-hidden="true">{item.mark}</span>
				<span class="copy">
					<strong>{item.label}</strong>
					<small>{item.detail}</small>
				</span>
				<span class="arrow" aria-hidden="true">›</span>
			</a>
		{/each}
	</div>

	<p class="future-note">Run-scoped video can join this evidence layer when attached; it remains optional, not required for Progress.</p>
</section>

<style>
	.panel {
		height: 100%;
		border: 1px solid #1f3a51;
		border-radius: 1rem;
		background: linear-gradient(180deg, rgba(11, 30, 47, 0.96), rgba(8, 24, 38, 0.96));
		padding: 1rem;
	}

	.heading p {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	h2 {
		margin: 0.28rem 0 0;
		font-size: 0.98rem;
		letter-spacing: -0.02em;
	}

	.heading span,
	.future-note {
		color: #778da1;
		font-size: 0.62rem;
		line-height: 1.45;
	}

	.heading span { display: block; margin-top: 0.3rem; }

	.evidence-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.55rem;
		margin-top: 0.9rem;
	}

	.evidence-link {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.65rem;
		min-height: 4.2rem;
		border: 1px solid #1a3349;
		border-radius: 0.75rem;
		background: rgba(10, 27, 43, 0.75);
		padding: 0.7rem;
		color: inherit;
		text-decoration: none;
		transition: border-color 120ms ease, transform 120ms ease, background 120ms ease;
	}

	.evidence-link:hover,
	.evidence-link:focus-visible {
		border-color: #3c8fd8;
		background: rgba(14, 38, 59, 0.95);
		transform: translateY(-1px);
		outline: none;
	}

	.mark {
		display: grid;
		width: 1.8rem;
		height: 1.8rem;
		place-items: center;
		border-radius: 0.55rem;
		background: rgba(75, 163, 255, 0.12);
		color: #66b4ff;
		font-size: 0.68rem;
		font-weight: 850;
	}

	.copy { min-width: 0; }
	.copy strong { display: block; font-size: 0.68rem; color: #edf7ff; }
	.copy small { display: block; margin-top: 0.18rem; color: #72889b; font-size: 0.56rem; line-height: 1.35; }
	.arrow { color: #557187; font-size: 1.1rem; }
	.future-note { margin: 0.75rem 0 0; padding-top: 0.65rem; border-top: 1px solid #173047; }

	@media (max-width: 640px) {
		.evidence-grid { grid-template-columns: 1fr; }
	}
</style>
