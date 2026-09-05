<script lang="ts">
	import { progressDimensionPalette } from './progressDimensionPalette';
	import type { RiderDevelopmentEvidenceModel } from './riderDevelopmentEvidence';

	interface Props {
		evidence: RiderDevelopmentEvidenceModel;
	}

	let { evidence }: Props = $props();

	function sparkPoints(values: number[]) {
		if (!values.length) return '';
		if (values.length === 1) return '4,24 96,24';
		return values
			.map((value, index) => {
				const x = 4 + (index / (values.length - 1)) * 92;
				const y = 38 - Math.max(0, Math.min(100, value)) * 0.32;
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}

	function labelText(label: string) {
		return label === 'needs-work'
			? 'Needs work'
			: label === 'unknown'
				? 'Measured'
				: `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
	}

	const rows = $derived(
		evidence.dimensions.map((dimension) => ({
			...dimension,
			tone: progressDimensionPalette[dimension.key],
			values: dimension.history.map((point) => point.value)
		}))
	);
</script>

<section class="development-layer" aria-labelledby="rider-development-heading">
	<div class="development-main">
		<header>
			<div>
				<p class="eyebrow">4 · Rider development</p>
				<h2 id="rider-development-heading">Your measured launch profile</h2>
				<span>{evidence.presentation.statement}</span>
			</div>
			<span class="history-count">{evidence.supportedSessionCount} supported session{evidence.supportedSessionCount === 1 ? '' : 's'}</span>
		</header>

		{#if rows.length === 0}
			<div class="empty">{evidence.presentation.statement}</div>
		{:else}
			<div class="score-table">
				{#each rows as row}
					<div class="score-row" style={`--tone:${row.tone}`}>
						<div class="score-name">
							<span class="dot" aria-hidden="true"></span>
							<strong>{row.label}</strong>
						</div>
						<div class="current">
							<strong>{Math.round(row.current)}</strong><span>/100</span>
						</div>
						<svg class="trajectory" viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true">
							<line x1="4" y1="38" x2="96" y2="38"></line>
							<polyline points={sparkPoints(row.values)}></polyline>
						</svg>
						<div class="measurement">
							<span>{labelText(row.currentLabel)}</span>
							<small>{row.history.length} observation{row.history.length === 1 ? '' : 's'}</small>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<aside class="development-insight" aria-label="Rider Development evidence state">
		<p class="eyebrow">Evidence state</p>
		<h3>{evidence.presentation.label}</h3>
		<p class="summary">{evidence.presentation.statement}</p>
		{#if rows.length > 0}
			<div class="evidence-note">
				<strong>What this layer says</strong>
				<span>Scores and their engine-owned labels are measured facts. Lines show observed score history only.</span>
			</div>
			<div class="evidence-note">
				<strong>What it does not say</strong>
				<span>No strongest-quality ranking, focus-area ranking, training recommendation, or cross-session trend is inferred here.</span>
			</div>
		{/if}
	</aside>
</section>

<style>
	.development-layer {
		display: grid;
		grid-template-columns: minmax(0, 2.2fr) minmax(18rem, .72fr);
		gap: .75rem;
		margin-top: .75rem;
	}

	.development-main,
	.development-insight {
		border: 1px solid #1e3a52;
		border-radius: 1rem;
		background: linear-gradient(145deg, rgba(12, 30, 47, .96), rgba(8, 22, 35, .96));
	}

	.development-main { padding: 1rem; }
	.development-insight { padding: 1rem; background: linear-gradient(155deg, rgba(10, 31, 48, .98), rgba(7, 23, 37, .98)); }

	header { display: flex; justify-content: space-between; align-items: end; gap: 1rem; }
	.eyebrow { margin: 0; color: #4ba3ff; font-size: .58rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
	h2 { margin: .28rem 0 0; font-size: 1rem; letter-spacing: -.02em; }
	header div > span, .history-count { color: #71889d; font-size: .62rem; }
	header div > span { display: block; margin-top: .25rem; max-width: 48rem; line-height: 1.45; }
	.history-count { white-space: nowrap; }

	.score-table { margin-top: .85rem; border-top: 1px solid #18344c; }
	.score-row {
		display: grid;
		grid-template-columns: minmax(8rem, 1fr) 5.5rem minmax(15rem, 2.25fr) 7.4rem;
		align-items: center;
		gap: .8rem;
		min-height: 3.9rem;
		border-bottom: 1px solid #18344c;
	}

	.score-name { display: flex; align-items: center; gap: .55rem; min-width: 0; }
	.score-name strong { color: #dce9f4; font-size: .7rem; }
	.dot { width: .45rem; height: .45rem; border-radius: 50%; background: var(--tone); box-shadow: 0 0 0 .2rem color-mix(in srgb, var(--tone) 13%, transparent); }
	.current { display: flex; align-items: baseline; gap: .2rem; }
	.current strong { color: #f7fbff; font-size: 1.1rem; }
	.current span { color: #637c92; font-size: .55rem; }

	.trajectory { width: 100%; height: 2.55rem; color: var(--tone); overflow: visible; }
	.trajectory line { stroke: #1c394f; stroke-width: 1; vector-effect: non-scaling-stroke; }
	.trajectory polyline { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }

	.measurement { display: flex; flex-direction: column; align-items: flex-end; gap: .12rem; }
	.measurement span { color: #b8c9d8; font-size: .6rem; font-weight: 700; }
	.measurement small { color: #71889d; font-size: 0.55rem; }

	.development-insight h3 { margin: .9rem 0 0; color: #f7fbff; font-size: 1.15rem; line-height: 1.2; letter-spacing: -.025em; }
	.summary { margin: .7rem 0 0; color: #91a5b7; font-size: .68rem; line-height: 1.55; }
	.evidence-note { margin-top: .8rem; border: 1px solid #1a344b; border-radius: .75rem; padding: .75rem; background: rgba(7, 22, 35, .76); }
	.evidence-note strong, .evidence-note span { display: block; }
	.evidence-note strong { color: #dce8f3; font-size: .62rem; }
	.evidence-note span { margin-top: .3rem; color: #71889d; font-size: .58rem; line-height: 1.5; }
	.empty { margin-top: .85rem; border: 1px dashed #27445d; border-radius: .8rem; padding: 1rem; color: #71889d; font-size: .66rem; }

	@media (max-width: 980px) {
		.development-layer { grid-template-columns: 1fr; }
	}

	@media (max-width: 700px) {
		header { align-items: flex-start; flex-direction: column; }
		.score-row { grid-template-columns: minmax(0, 1fr) auto; gap: .35rem .65rem; padding: .65rem 0; }
		.trajectory { grid-column: 1 / -1; order: 3; }
		.measurement { align-items: flex-start; }
	}
</style>
