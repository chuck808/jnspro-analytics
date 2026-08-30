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
		border: 1px solid #1d3449;
		border-radius: 0.9rem;
		padding: 1rem 1.1rem;
		background: linear-gradient(180deg, rgba(10, 27, 43, 0.98), rgba(6, 18, 30, 0.98));
		color: #f7fbff;
	}

	.eyebrow {
		margin: 0 0 0.25rem;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #ff7555;
	}

	h2,
	p {
		margin-top: 0;
	}

	h2 {
		margin-bottom: 0.4rem;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	p {
		font-size: 0.68rem;
		line-height: 1.55;
		color: #93a8b9;
	}

	p:last-child {
		margin-bottom: 0;
	}
</style>
