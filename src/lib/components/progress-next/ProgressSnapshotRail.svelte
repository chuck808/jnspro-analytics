<script lang="ts">
	import type { PeakSpeedEvidenceModel } from './peakSpeedEvidence';
	import type { ReactionEvidenceModel } from './reactionEvidence';

	interface PersonalBests {
		max_g: number | null;
	}

	interface SessionPoint {
		timestamp: string;
		best_max_g: number | null;
	}

	interface SessionAnalysisPoint {
		timestamp: string;
		analysis: { intelligence?: { sessionQuality: number } | null };
	}

	interface Props {
		sessionCount: number;
		personalBests: PersonalBests;
		reactionEvidence: ReactionEvidenceModel;
		peakSpeedEvidence: PeakSpeedEvidenceModel;
		latestSessionQuality: number | null;
		sessions?: SessionPoint[];
		sessionAnalyses?: SessionAnalysisPoint[];
	}

	let {
		sessionCount,
		personalBests,
		reactionEvidence,
		peakSpeedEvidence,
		latestSessionQuality,
		sessions = [],
		sessionAnalyses = []
	}: Props = $props();

	const reactionChange = $derived.by(() => {
		const finding = reactionEvidence.finding;
		if (!finding) {
			return {
				value: '—',
				detail: `${reactionEvidence.presentation.label} · ${reactionEvidence.supportedSessionCount} supported`,
				tone: 'neutral'
			};
		}

		const window = `latest ${reactionEvidence.windowSize} supported`;
		if (finding.direction === 'stable') {
			return { value: 'Stable', detail: window, tone: 'neutral' };
		}

		const early = reactionEvidence.state === 'early-signal';
		const direction = finding.direction === 'improving' ? 'faster' : 'slower';
		return {
			value: `${Math.abs(finding.changePercent).toFixed(1)}%`,
			detail: `${early ? 'appears ' : ''}${direction} · ${window}`,
			tone: finding.direction === 'improving' ? 'good' : 'attention'
		};
	});

	// Same point-plotting shape ProgressBreakdown.svelte already uses for its
	// own sparklines: a literal visualization of already-frozen evidence
	// history, no inference or claim layered on top of the raw values.
	function sparkPoints(values: number[], lowerIsBetter = false) {
		if (values.length < 2) return '';
		const min = Math.min(...values);
		const max = Math.max(...values);
		const range = max - min;
		return values
			.map((value, index) => {
				const raw = range === 0 ? 0.5 : (value - min) / range;
				const score = lowerIsBetter ? 1 - raw : raw;
				const x = (index / (values.length - 1)) * 72;
				const y = 22 - score * 18;
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}

	function isFinite(value: number | null | undefined): value is number {
		return typeof value === 'number' && Number.isFinite(value);
	}

	const reactionPbPoints = $derived(
		sparkPoints(
			reactionEvidence.history.slice(-10).map((h) => h.bestReactionMs).filter(isFinite),
			true
		)
	);
	const reactionChangePoints = $derived(
		sparkPoints(reactionEvidence.history.slice(-10).map((h) => h.averageReactionMs), true)
	);
	const speedPbPoints = $derived(
		sparkPoints(peakSpeedEvidence.history.slice(-10).map((h) => h.bestSpeedMs))
	);
	const sessionQualityPoints = $derived(
		sparkPoints(
			sessionAnalyses
				.slice(-10)
				.map((s) => s.analysis.intelligence?.sessionQuality)
				.filter(isFinite)
		)
	);
	const peakGPoints = $derived(
		sparkPoints(sessions.slice(-10).map((s) => s.best_max_g).filter(isFinite))
	);

	// Real last-7-day session counts, matching the mock-up's bar treatment for
	// this card specifically — the only card whose natural shape is a discrete
	// daily count rather than a continuous trend.
	const last7Days = $derived.by(() => {
		const dayStart = (offsetDaysAgo: number) => {
			const d = new Date();
			d.setHours(0, 0, 0, 0);
			d.setDate(d.getDate() - offsetDaysAgo);
			return d.getTime();
		};
		const bins = Array.from({ length: 7 }, (_, i) => {
			const start = dayStart(6 - i);
			const end = start + 86400000;
			return sessions.filter((s) => {
				const t = new Date(s.timestamp).getTime();
				return t >= start && t < end;
			}).length;
		});
		return bins;
	});
	const last7DaysTotal = $derived(last7Days.reduce((a, b) => a + b, 0));
	const last7DaysMax = $derived(Math.max(1, ...last7Days));

	const cards = $derived([
		{
			key: 'reaction-pb',
			label: 'Reaction PB',
			value:
				reactionEvidence.bestReactionMs === null
					? '—'
					: `${(reactionEvidence.bestReactionMs / 1000).toFixed(3)}s`,
			detail:
				reactionEvidence.bestReactionMs === null
					? 'No measured reaction yet'
					: 'Measured · eligible gate evidence',
			tone: 'amber',
			glyph: '⚡',
			spark: { type: 'line' as const, points: reactionPbPoints }
		},
		{
			key: 'reaction-change',
			label: 'Recent reaction',
			value: reactionChange.value,
			detail: reactionChange.detail,
			tone:
				reactionChange.tone === 'good'
					? 'lime'
					: reactionChange.tone === 'attention'
						? 'coral'
						: 'blue',
			glyph: '↗',
			spark: { type: 'line' as const, points: reactionChangePoints }
		},
		{
			key: 'sessions',
			label: 'Eligible sessions',
			value: String(sessionCount),
			detail: `Account history · ${last7DaysTotal} in last 7 days`,
			tone: 'blue',
			glyph: '▥',
			spark: { type: 'bar' as const, bins: last7Days, max: last7DaysMax }
		},
		{
			key: 'speed-pb',
			label: 'Peak speed PB',
			value:
				peakSpeedEvidence.bestSpeedMs === null
					? '—'
					: `${(peakSpeedEvidence.bestSpeedMs * 3.6).toFixed(1)} km/h`,
			detail:
				peakSpeedEvidence.supportedSessionCount === 0
					? 'No validated IMU speed yet'
					: `Validated IMU · ${peakSpeedEvidence.supportedSessionCount} supported`,
			tone: 'cyan',
			glyph: '➤',
			spark: { type: 'line' as const, points: speedPbPoints }
		},
		{
			key: 'session-quality',
			label: 'Latest quality',
			value: latestSessionQuality === null ? '—' : `${Math.round(latestSessionQuality)}/100`,
			detail:
				latestSessionQuality === null ? 'Needs supported analysis' : 'Performance Engine',
			tone: 'violet',
			glyph: '◎',
			spark: { type: 'line' as const, points: sessionQualityPoints }
		},
		{
			key: 'peak-g',
			label: 'Peak G PB',
			value: personalBests.max_g === null ? '—' : `${personalBests.max_g.toFixed(2)}G`,
			detail: 'Measured · all time',
			tone: 'amber',
			glyph: '◉',
			spark: { type: 'line' as const, points: peakGPoints }
		}
	]);
</script>

<section class="snapshot" aria-label="Performance snapshot">
	{#each cards as card}
		<article class="snapshot-card" data-tone={card.tone}>
			<div class="card-top">
				<span class="glyph" aria-hidden="true">{card.glyph}</span>
				<span>{card.label}</span>
			</div>
			<strong>{card.value}</strong>
			<span class="detail">{card.detail}</span>

			{#if card.spark.type === 'bar'}
				<div class="spark-bars" aria-hidden="true">
					{#each card.spark.bins as count}
						<i style={`height:${Math.max((count / card.spark.max) * 100, count > 0 ? 14 : 4)}%`}></i>
					{/each}
				</div>
			{:else if card.spark.points}
				<svg class="spark-line" viewBox="0 0 72 26" preserveAspectRatio="none" aria-hidden="true">
					<line x1="0" y1="22" x2="72" y2="22"></line>
					<polyline points={card.spark.points}></polyline>
				</svg>
			{:else}
				<div class="spark-empty" aria-hidden="true"><i></i></div>
			{/if}
		</article>
	{/each}
</section>

<style>
	.snapshot {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 0.65rem;
	}

	.snapshot-card {
		--tone: #4ba3ff;
		position: relative;
		min-width: 0;
		overflow: hidden;
		padding: 1rem 1rem 0.8rem;
		border: 1px solid #1c3147;
		border-radius: 0.85rem;
		background: linear-gradient(180deg, rgba(13, 31, 49, 0.95), rgba(7, 21, 35, 0.98));
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
	}

	.snapshot-card[data-tone='amber'] {
		--tone: #ffb31a;
	}
	.snapshot-card[data-tone='lime'] {
		--tone: #8de51e;
	}
	.snapshot-card[data-tone='coral'] {
		--tone: #ff7354;
	}
	.snapshot-card[data-tone='cyan'] {
		--tone: #34d9ed;
	}
	.snapshot-card[data-tone='violet'] {
		--tone: #c178ff;
	}

	.card-top {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.69rem;
		font-weight: 750;
		letter-spacing: 0.02em;
		color: #d9e6f2;
		text-transform: uppercase;
	}

	.glyph {
		color: var(--tone);
		font-size: 0.88rem;
	}

	.snapshot-card > strong {
		display: block;
		margin-top: 0.7rem;
		font-size: clamp(1.15rem, 2vw, 1.55rem);
		line-height: 1;
		letter-spacing: -0.03em;
		color: #f7fbff;
	}

	.detail {
		display: block;
		margin-top: 0.32rem;
		font-size: 0.58rem;
		color: #72879a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.spark-line {
		display: block;
		width: 100%;
		height: 1.5rem;
		margin-top: 0.6rem;
		overflow: visible;
	}

	.spark-line line {
		stroke: #1d354a;
		stroke-width: 1;
	}

	.spark-line polyline {
		fill: none;
		stroke: var(--tone);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		vector-effect: non-scaling-stroke;
		opacity: 0.85;
	}

	.spark-bars,
	.spark-empty {
		display: flex;
		height: 1.5rem;
		align-items: end;
		gap: 0.18rem;
		margin-top: 0.6rem;
		opacity: 0.7;
	}

	.spark-bars i {
		width: 100%;
		border-radius: 999px 999px 0 0;
		background: var(--tone);
	}

	.spark-empty i {
		width: 100%;
		height: 1px;
		background: #23415a;
	}

	@media (max-width: 1100px) {
		.snapshot {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (max-width: 620px) {
		.snapshot {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
