<script lang="ts">
	import type { TechniqueScoreBreakdown } from '$lib/performance-engine/techniqueScoring';
	import { progressDimensionPalette, type ProgressDimensionKey } from './progressDimensionPalette';

	interface SessionScorePoint {
		timestamp: string;
		insightPack: {
			scores: TechniqueScoreBreakdown;
		};
	}

	interface Props {
		sessionAnalyses: SessionScorePoint[];
	}

	let { sessionAnalyses }: Props = $props();

	type ScoreKey = ProgressDimensionKey;

	const dimensions: Array<{ key: ScoreKey; label: string }> = [
		{ key: 'launchQuality', label: 'Launch Quality' },
		{ key: 'explosiveness', label: 'Explosiveness' },
		{ key: 'speedCarry', label: 'Speed Carry' },
		{ key: 'smoothness', label: 'Smoothness' },
		{ key: 'impulseTiming', label: 'Impulse Timing' },
		{ key: 'repeatability', label: 'Repeatability' }
	];

	function valuesFor(key: ScoreKey) {
		return sessionAnalyses
			.map((item) => item.insightPack.scores[key])
			.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
	}

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

	function change(values: number[]) {
		if (values.length < 2) return null;
		return values.at(-1)! - values[0];
	}

	function status(value: number) {
		if (value >= 80) return 'Strong';
		if (value >= 65) return 'Developing';
		return 'Needs focus';
	}

	const rows = $derived.by(() =>
		dimensions
			.map((dimension) => {
				const values = valuesFor(dimension.key);
				const current = values.at(-1) ?? null;
				return current === null
					? null
					: { ...dimension, tone: progressDimensionPalette[dimension.key], values, current, delta: change(values), status: status(current) };
			})
			.filter((row): row is NonNullable<typeof row> => row !== null)
	);

	const strongest = $derived.by(() => {
		if (!rows.length) return null;
		return [...rows].sort((a, b) => b.current - a.current)[0];
	});

	const focus = $derived.by(() => {
		if (!rows.length) return null;
		return [...rows].sort((a, b) => a.current - b.current)[0];
	});
</script>

<section class="development-layer" aria-labelledby="rider-development-heading">
	<div class="development-main">
		<header>
			<div>
				<p class="eyebrow">4 · Rider development</p>
				<h2 id="rider-development-heading">How your launch profile is changing</h2>
				<span>Performance Engine scores across supported sessions. Missing evidence stays missing.</span>
			</div>
			<span class="history-count">{sessionAnalyses.length} analysed session{sessionAnalyses.length === 1 ? '' : 's'}</span>
		</header>

		{#if rows.length === 0}
			<div class="empty">Rider Development will appear when enough supported run evidence is available.</div>
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
							<line x1="4" y1="12.4" x2="96" y2="12.4" class="benchmark"></line>
							<polyline points={sparkPoints(row.values)}></polyline>
						</svg>
						<div class="movement" data-direction={row.delta === null ? 'none' : row.delta >= 0 ? 'up' : 'down'}>
							{#if row.delta === null}
								<span>Building</span>
							{:else}
								<strong>{row.delta >= 0 ? '▲' : '▼'} {Math.abs(row.delta).toFixed(0)}</strong>
								<span>{row.status}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<aside class="development-insight" aria-label="Rider Development insight">
		<p class="eyebrow">Development insight</p>
		{#if strongest && focus}
			<h3>Your strongest supported quality is {strongest.label.toLowerCase()}.</h3>
			<p class="summary">{focus.label} is currently the clearest development opportunity. Use the deeper evidence before changing training around a single score.</p>
			<div class="insight-pair">
				<div><span>Strength</span><strong>{strongest.label}</strong><small>{Math.round(strongest.current)}/100</small></div>
				<div><span>Focus</span><strong>{focus.label}</strong><small>{Math.round(focus.current)}/100</small></div>
			</div>
		{:else}
			<h3>Development insight is still building.</h3>
			<p class="summary">Supported score history is needed before this layer can compare strengths and focus areas.</p>
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
	header div > span { display: block; margin-top: .25rem; }
	.history-count { white-space: nowrap; }

	.score-table { margin-top: .85rem; border-top: 1px solid #18344c; }
	.score-row {
		display: grid;
		grid-template-columns: minmax(8rem, 1fr) 5.5rem minmax(15rem, 2.25fr) 6.8rem;
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
	.trajectory line.benchmark { stroke: #36516a; stroke-dasharray: 2 3; opacity: .6; }
	.trajectory polyline { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }

	.movement { display: flex; flex-direction: column; align-items: flex-end; gap: .12rem; }
	.movement strong { font-size: .66rem; color: #8de51e; }
	.movement[data-direction='down'] strong { color: #ff7354; }
	.movement span { color: #71889d; font-size: .55rem; }

	.development-insight h3 { margin: .9rem 0 0; color: #f7fbff; font-size: 1.15rem; line-height: 1.2; letter-spacing: -.025em; }
	.summary { margin: .7rem 0 0; color: #91a5b7; font-size: .68rem; line-height: 1.55; }
	.insight-pair { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; margin-top: 1rem; }
	.insight-pair div { border: 1px solid #1a344b; border-radius: .75rem; padding: .7rem; background: rgba(7, 22, 35, .76); }
	.insight-pair span, .insight-pair strong, .insight-pair small { display: block; }
	.insight-pair span { color: #627b91; font-size: .53rem; text-transform: uppercase; letter-spacing: .1em; }
	.insight-pair strong { margin-top: .3rem; color: #dce8f3; font-size: .68rem; }
	.insight-pair small { margin-top: .18rem; color: #8de51e; font-size: .6rem; }
	.insight-pair div:last-child small { color: #ffb31a; }
	.empty { margin-top: .85rem; border: 1px dashed #27445d; border-radius: .8rem; padding: 1rem; color: #71889d; font-size: .66rem; }

	@media (max-width: 980px) {
		.development-layer { grid-template-columns: 1fr; }
	}

	@media (max-width: 700px) {
		header { align-items: flex-start; flex-direction: column; }
		.score-row { grid-template-columns: minmax(0, 1fr) auto; gap: .35rem .65rem; padding: .65rem 0; }
		.trajectory { grid-column: 1 / -1; order: 3; }
		.movement { display: none; }
	}
</style>
