<script lang="ts">
	import type { ShareableAchievement } from '$lib/social/types';
	import {
		getWeatherMeta,
		getSurfaceMeta,
		getFocusMeta,
		getRideFeelMeta
	} from '$lib/types/sessionContext';
	import MetricProgressionChart from './MetricProgressionChart.svelte';

	interface ProgressionPoint {
		runNumber: number;
		reactionMs: number | null;
		maxG: number | null;
		peakSpeedKmh: number | null;
		techniqueScore: number | null;
	}

	interface ConditionsContext {
		weatherCondition: string | null;
		trackSurface: string | null;
		sessionFocus: string | null;
		rideFeel: string | null;
	}

	interface Props {
		achievement: ShareableAchievement | null;
		isLivePreview: boolean;
		progressionData: ProgressionPoint[];
		hasValidSpeed: boolean;
		conditions: ConditionsContext;
		onShare: () => void;
	}

	let { achievement, isLivePreview, progressionData, hasValidSpeed, conditions, onShare }: Props =
		$props();

	// ── Conditions panel ────────────────────────────────────────────────────────
	let weatherMeta = $derived(getWeatherMeta(conditions.weatherCondition as any));
	let surfaceMeta = $derived(getSurfaceMeta(conditions.trackSurface as any));
	let focusMeta = $derived(getFocusMeta(conditions.sessionFocus as any));
	let feelMeta = $derived(getRideFeelMeta(conditions.rideFeel as any));
	let hasAnyCondition = $derived(!!(weatherMeta || surfaceMeta || focusMeta || feelMeta));

	// ── Chart data (display units) ──────────────────────────────────────────────
	let reactionPoints = $derived(
		progressionData.map((r) => ({
			runNumber: r.runNumber,
			value: r.reactionMs !== null ? r.reactionMs / 1000 : null
		}))
	);
	let speedPoints = $derived(
		progressionData.map((r) => ({ runNumber: r.runNumber, value: r.peakSpeedKmh }))
	);
	let maxGPoints = $derived(
		progressionData.map((r) => ({ runNumber: r.runNumber, value: r.maxG }))
	);

	// ── PB-run highlighting ──────────────────────────────────────────────────────
	// Only applies when the achievement is tied to one of the three charted,
	// run-level metrics. Session-wide achievements (quality, consistency,
	// resilience, etc.) communicate through the banner alone — no point marked.
	function findHighlightRun(): number | null {
		if (!achievement) return null;
		const raw = achievement.metric.rawValue;
		const close = (a: number, b: number) => Math.abs(a - b) < 0.5;

		if (achievement.metric.label === 'Reaction Time') {
			return progressionData.find((r) => r.reactionMs !== null && close(r.reactionMs, raw))
				?.runNumber ?? null;
		}
		if (achievement.metric.label === 'Peak Speed') {
			const rawKmh = raw * 3.6;
			return progressionData.find((r) => r.peakSpeedKmh !== null && close(r.peakSpeedKmh, rawKmh))
				?.runNumber ?? null;
		}
		if (achievement.metric.label === 'Peak G-Force') {
			return progressionData.find((r) => r.maxG !== null && close(r.maxG, raw))?.runNumber ?? null;
		}
		return null;
	}
	let highlightRunNumber = $derived(findHighlightRun());

	let headlineLines = $derived(achievement ? achievement.headlineTitle.split('\n') : []);
</script>

<div class="session-hero-wrapper">
	<!-- ── Conditions panel — always shown when context is set ─────────────────── -->
	{#if hasAnyCondition}
		<div class="conditions-panel themed-card">
			{#if weatherMeta}
				<div class="conditions-panel__item">
					<span class="conditions-panel__icon">{weatherMeta.icon}</span>
					<span class="conditions-panel__label themed-text-secondary">{weatherMeta.label}</span>
				</div>
			{/if}
			{#if surfaceMeta}
				<div class="conditions-panel__item">
					<span class="conditions-panel__icon">{surfaceMeta.icon}</span>
					<span class="conditions-panel__label themed-text-secondary">{surfaceMeta.label}</span>
				</div>
			{/if}
			{#if focusMeta}
				<div class="conditions-panel__item">
					<span class="conditions-panel__icon">{focusMeta.icon}</span>
					<span class="conditions-panel__label themed-text-secondary">{focusMeta.label}</span>
				</div>
			{/if}
			{#if feelMeta}
				<div class="conditions-panel__item">
					<span class="conditions-panel__icon">{feelMeta.icon}</span>
					<span class="conditions-panel__label themed-text-secondary">{feelMeta.label}</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ── Achievement banner — only when something genuinely fired ───────────── -->
	{#if achievement}
		<div class="achievement-banner">
			<div class="achievement-banner__main">
				<div>
					{#each headlineLines as line, i}
						<div
							class="achievement-banner__headline"
							class:achievement-banner__headline--accent={i === headlineLines.length - 1}
						>
							{line}
						</div>
					{/each}
					<p class="achievement-banner__subtitle">{achievement.headlineSubtitle}</p>
				</div>
				<div class="achievement-banner__metric">
					<div class="achievement-banner__metric-label">{achievement.metric.label}</div>
					<div class="achievement-banner__metric-value">
						<span>{achievement.metric.value}</span>
						<span class="achievement-banner__metric-unit">{achievement.metric.unit}</span>
					</div>
					{#if achievement.metric.improvementDisplay}
						<div class="achievement-banner__metric-delta">{achievement.metric.improvementDisplay}</div>
					{/if}
				</div>
			</div>

			{#if achievement.conditionsBadge}
				<div class="achievement-banner__badge">
					<span class="achievement-banner__badge-icon">{achievement.conditionsBadge.icon}</span>
					<div>
						<div class="achievement-banner__badge-label">{achievement.conditionsBadge.label}</div>
						<div class="achievement-banner__badge-desc">{achievement.conditionsBadge.description}</div>
					</div>
				</div>
			{/if}

			<div class="achievement-banner__footer">
				{#if isLivePreview}
					<span class="achievement-banner__preview-note"
						>Preview — save your session setup to unlock sharing</span
					>
				{:else}
					<button class="achievement-banner__share-btn" onclick={onShare} title="Share this achievement">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
							<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
						</svg>
						Share
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- ── The always-present visual centerpiece ───────────────────────────────── -->
	<div class="charts-grid themed-card">
		<MetricProgressionChart
			label="Reaction Time"
			unit="s"
			color="#00b8d4"
			decimals={3}
			points={reactionPoints}
			highlightRunNumber={highlightRunNumber}
		/>
		{#if hasValidSpeed}
			<MetricProgressionChart
				label="Peak Speed"
				unit=" km/h"
				color="#3de8c8"
				decimals={1}
				points={speedPoints}
				highlightRunNumber={highlightRunNumber}
			/>
		{/if}
		<MetricProgressionChart
			label="Max G-Force"
			unit="G"
			color="#ff6b3d"
			decimals={2}
			points={maxGPoints}
			highlightRunNumber={highlightRunNumber}
		/>
	</div>
</div>

<style>
	.session-hero-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.conditions-panel {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		padding: 0.9rem 1.25rem;
	}
	.conditions-panel__item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.conditions-panel__icon {
		font-size: 1.4rem;
	}
	.conditions-panel__label {
		font-size: 0.8rem;
		font-weight: 600;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.25rem;
	}

	.achievement-banner {
		background: #060d1a;
		border-radius: 0.75rem;
		padding: 1.5rem 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border: 1px solid rgba(0, 229, 255, 0.2);
	}
	.achievement-banner__main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	.achievement-banner__headline {
		font-family: Impact, sans-serif;
		font-size: 2.25rem;
		line-height: 0.95;
		letter-spacing: 1px;
		color: #fff;
	}
	.achievement-banner__headline--accent {
		color: #00e5ff;
		text-shadow: 0 0 30px rgba(0, 229, 255, 0.3);
	}
	.achievement-banner__subtitle {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.55);
		margin-top: 0.4rem;
	}
	.achievement-banner__metric {
		text-align: right;
		flex-shrink: 0;
	}
	.achievement-banner__metric-label {
		font-size: 0.65rem;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.4);
	}
	.achievement-banner__metric-value {
		font-family: Impact, sans-serif;
		font-size: 2rem;
		color: #00e5ff;
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
		justify-content: flex-end;
	}
	.achievement-banner__metric-unit {
		font-size: 0.9rem;
		color: rgba(0, 229, 255, 0.7);
	}
	.achievement-banner__metric-delta {
		font-size: 0.75rem;
		font-weight: 700;
		color: #4ade80;
	}
	.achievement-banner__badge {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(245, 166, 35, 0.08);
		border: 1px solid rgba(245, 166, 35, 0.25);
		border-radius: 0.6rem;
		padding: 0.6rem 0.85rem;
	}
	.achievement-banner__badge-icon {
		font-size: 1.3rem;
	}
	.achievement-banner__badge-label {
		font-size: 0.85rem;
		font-weight: 700;
		color: #fff;
	}
	.achievement-banner__badge-desc {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
		font-style: italic;
	}
	.achievement-banner__footer {
		display: flex;
		justify-content: flex-end;
	}
	.achievement-banner__preview-note {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.35);
		font-style: italic;
	}
	.achievement-banner__share-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		background: rgba(0, 229, 255, 0.1);
		border: 1px solid rgba(0, 229, 255, 0.25);
		color: #00e5ff;
		transition: background-color 0.15s;
	}
	.achievement-banner__share-btn:hover {
		background: rgba(0, 229, 255, 0.18);
	}
</style>
