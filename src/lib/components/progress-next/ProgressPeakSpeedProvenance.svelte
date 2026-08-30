<section class="provenance" aria-labelledby="peak-speed-provenance-title">
	<p class="eyebrow">Evidence provenance</p>
	<h2 id="peak-speed-provenance-title">Why this page can make these claims</h2>
	<p>
		Peak Speed eligibility comes from the canonical session summary: speed is present only when a
		session contains analytics-valid gate-run speed. Progress direction then uses session best speed,
		higher-is-better semantics, and the shared trend primitive over the full supported history.
	</p>
	<p>
		This Progress surface does not read the legacy analytics loader's speed trend. Average speed is
		shown only as supporting measurement and never determines the direction claim.
	</p>
</section>

<style>
	.provenance {
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 1rem;
		padding: 1.25rem;
		background: var(--color-surface, #fff);
	}

	.eyebrow {
		margin: 0 0 0.25rem;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted, #6b7280);
	}

	h2,
	p {
		margin-top: 0;
	}

	h2 {
		margin-bottom: 0.4rem;
		font-size: 1.15rem;
	}

	p {
		color: var(--color-text-muted, #6b7280);
		line-height: 1.55;
	}

	p:last-child {
		margin-bottom: 0;
	}
</style>
