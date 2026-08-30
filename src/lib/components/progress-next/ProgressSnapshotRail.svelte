<script lang="ts">
	import type { PeakSpeedEvidenceModel } from './peakSpeedEvidence';
	import type { ReactionEvidenceModel } from './reactionEvidence';

	interface PersonalBests {
		max_g: number | null;
	}

	interface Props {
		sessionCount: number;
		personalBests: PersonalBests;
		reactionEvidence: ReactionEvidenceModel;
		peakSpeedEvidence: PeakSpeedEvidenceModel;
		latestSessionQuality: number | null;
	}

	let {
		sessionCount,
		personalBests,
		reactionEvidence,
		peakSpeedEvidence,
		latestSessionQuality
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
			glyph: '⚡'
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
			glyph: '↗'
		},
		{
			key: 'sessions',
			label: 'Eligible sessions',
			value: String(sessionCount),
			detail: 'Account history',
			tone: 'blue',
			glyph: '▥'
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
			glyph: '➤'
		},
		{
			key: 'session-quality',
			label: 'Latest quality',
			value: latestSessionQuality === null ? '—' : `${Math.round(latestSessionQuality)}/100`,
			detail:
				latestSessionQuality === null ? 'Needs supported analysis' : 'Performance Engine',
			tone: 'violet',
			glyph: '◎'
		},
		{
			key: 'peak-g',
			label: 'Peak G PB',
			value: personalBests.max_g === null ? '—' : `${personalBests.max_g.toFixed(2)}G`,
			detail: 'Measured · all time',
			tone: 'amber',
			glyph: '◉'
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
			<div class="spark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
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
		font-size: 0.56rem;
		color: #72879a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.spark {
		display: flex;
		height: 1.5rem;
		align-items: end;
		gap: 0.18rem;
		margin-top: 0.6rem;
		opacity: 0.58;
	}

	.spark i {
		width: 100%;
		border-radius: 999px 999px 0 0;
		background: var(--tone);
	}
	.spark i:nth-child(1) { height: 35%; }
	.spark i:nth-child(2) { height: 52%; }
	.spark i:nth-child(3) { height: 44%; }
	.spark i:nth-child(4) { height: 70%; }
	.spark i:nth-child(5) { height: 62%; }
	.spark i:nth-child(6) { height: 90%; }

	@media (max-width: 1100px) {
		.snapshot { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	}
	@media (max-width: 620px) {
		.snapshot { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}
</style>
