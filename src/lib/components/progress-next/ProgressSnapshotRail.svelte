<script lang="ts">
	interface PersonalBests {
		reaction_ms: number | null;
		peak_speed_ms: number | null;
		max_g: number | null;
	}

	interface Props {
		sessionCount: number;
		personalBests: PersonalBests;
		reactionTrend: number | null;
		latestSessionQuality: number | null;
	}

	let { sessionCount, personalBests, reactionTrend, latestSessionQuality }: Props = $props();

	const reactionChange = $derived.by(() => {
		if (reactionTrend === null) return { value: '—', detail: 'More history needed', tone: 'neutral' };
		if (Math.abs(reactionTrend) < 1) return { value: 'Stable', detail: 'Recent window', tone: 'neutral' };
		return reactionTrend < 0
			? { value: `${Math.abs(reactionTrend).toFixed(1)}%`, detail: 'faster recently', tone: 'good' }
			: { value: `${Math.abs(reactionTrend).toFixed(1)}%`, detail: 'slower recently', tone: 'attention' };
	});

	const cards = $derived([
		{
			key: 'reaction-pb',
			label: 'Reaction PB',
			value: personalBests.reaction_ms === null ? '—' : `${(personalBests.reaction_ms / 1000).toFixed(3)}s`,
			detail: 'Measured · all time',
			tone: 'amber',
			glyph: '⚡'
		},
		{
			key: 'reaction-change',
			label: 'Recent reaction',
			value: reactionChange.value,
			detail: reactionChange.detail,
			tone: reactionChange.tone === 'good' ? 'lime' : reactionChange.tone === 'attention' ? 'coral' : 'blue',
			glyph: '↗'
		},
		{
			key: 'sessions',
			label: 'Eligible sessions',
			value: String(sessionCount),
			detail: sessionCount < 3 ? `${3 - sessionCount} to trend view` : 'Longitudinal record',
			tone: 'blue',
			glyph: '▥'
		},
		{
			key: 'speed-pb',
			label: 'Peak speed PB',
			value: personalBests.peak_speed_ms === null ? '—' : `${(personalBests.peak_speed_ms * 3.6).toFixed(1)} km/h`,
			detail: 'Validated IMU · all time',
			tone: 'cyan',
			glyph: '➤'
		},
		{
			key: 'session-quality',
			label: 'Latest quality',
			value: latestSessionQuality === null ? '—' : `${Math.round(latestSessionQuality)}/100`,
			detail: latestSessionQuality === null ? 'Needs supported analysis' : 'Performance Engine',
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

	.snapshot-card[data-tone='amber'] { --tone: #ffb31a; }
	.snapshot-card[data-tone='lime'] { --tone: #8de51e; }
	.snapshot-card[data-tone='coral'] { --tone: #ff7354; }
	.snapshot-card[data-tone='cyan'] { --tone: #34d9ed; }
	.snapshot-card[data-tone='violet'] { --tone: #c178ff; }

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

	strong {
		display: block;
		margin-top: 0.7rem;
		font-size: clamp(1.2rem, 2vw, 1.75rem);
		line-height: 1;
		letter-spacing: -0.035em;
		color: #f7fbff;
		white-space: nowrap;
	}

	.detail {
		display: block;
		min-height: 1.9em;
		margin-top: 0.38rem;
		font-size: 0.62rem;
		line-height: 1.35;
		color: #7f93a8;
	}

	.spark {
		display: flex;
		align-items: end;
		gap: 0.22rem;
		height: 1.35rem;
		margin-top: 0.6rem;
		opacity: 0.9;
	}

	.spark i {
		flex: 1;
		border-radius: 999px 999px 0 0;
		background: var(--tone);
		opacity: 0.55;
	}

	.spark i:nth-child(1) { height: 28%; }
	.spark i:nth-child(2) { height: 44%; }
	.spark i:nth-child(3) { height: 36%; }
	.spark i:nth-child(4) { height: 62%; }
	.spark i:nth-child(5) { height: 55%; }
	.spark i:nth-child(6) { height: 82%; opacity: 0.95; }

	@media (max-width: 1180px) {
		.snapshot { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	}

	@media (max-width: 640px) {
		.snapshot {
			display: flex;
			overflow-x: auto;
			scroll-snap-type: x proximity;
			padding-bottom: 0.3rem;
		}

		.snapshot-card {
			flex: 0 0 10.6rem;
			scroll-snap-align: start;
		}
	}
</style>
