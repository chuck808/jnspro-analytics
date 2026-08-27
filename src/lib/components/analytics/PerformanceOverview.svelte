<script lang="ts">
	interface Props {
		sessionCount: number;
		crossSessionReport: any;
		latestSessionRatings: any[] | null;
		personalBests: {
			reaction_ms: number | null;
			peak_speed_ms: number | null;
			max_g: number | null;
		};
		isMobile: boolean;
	}

	let {
		sessionCount,
		crossSessionReport,
		latestSessionRatings,
		personalBests,
		isMobile: _isMobile
	}: Props = $props();

	let headline = $derived.by(() => {
		if (!crossSessionReport || sessionCount < 3) {
			return {
				text: 'Building your performance baseline',
				summary: 'Keep collecting clean starts. Progress will separate a real pattern from normal session-to-session variation once there is enough evidence.',
				confidence: 'low',
				tone: 'building'
			};
		}

		const patterns = crossSessionReport.patterns || {};
		if (patterns.consistency?.trend === 'improving') {
			return {
				text: 'Your starts are becoming more repeatable',
				summary: `Consistency is ${Math.abs(patterns.consistency.changePercent || 0).toFixed(1)}% better across the eligible history. The next question is whether that repeatability is carrying your best performance with it.`,
				confidence: 'high',
				tone: 'positive'
			};
		}
		if (patterns.consistency?.trend === 'declining') {
			return {
				text: 'Your best is there. Repeatability is the gap.',
				summary: 'The performance ceiling is visible, but the starts are not landing there consistently enough yet. Treat the best run as evidence of capability, not the whole story.',
				confidence: 'high',
				tone: 'attention'
			};
		}
		if (patterns.speed?.trend === 'improving') {
			return {
				text: 'You are carrying more speed out of the launch',
				summary: `Peak speed is ${Math.abs(patterns.speed.changePercent || 0).toFixed(1)}% better across the eligible history. Use the evidence below to see whether reaction and repeatability are moving with it.`,
				confidence: 'medium',
				tone: 'positive'
			};
		}
		return {
			text: 'Your performance is holding steady',
			summary: 'There is no strong directional signal in the current evidence. That is useful information: the deeper views below can show where gains are being won and lost without inventing a trend.',
			confidence: 'medium',
			tone: 'steady'
		};
	});

	let topRecommendations = $derived.by(() =>
		(crossSessionReport?.recommendations ?? [])
			.filter((recommendation: string) => recommendation?.trim().length > 0)
			.slice(0, 2)
	);

	let sessionQualityData = $derived.by(() => {
		if (!crossSessionReport?.sessions) return [];
		return crossSessionReport.sessions.slice(-10).map((session: any) => ({
			date: new Date(session.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
			quality: session.sessionQuality || 0
		}));
	});

	function fmtReaction(ms: number | null) {
		return ms !== null ? (ms / 1000).toFixed(3) + 's' : '—';
	}
	function fmtSpeed(ms: number | null) {
		return ms !== null ? (ms * 3.6).toFixed(1) + ' km/h' : '—';
	}
	function fmtG(g: number | null) {
		return g !== null ? g.toFixed(2) + 'G' : '—';
	}

	function getRatingColor(rating: string): string {
		switch (rating) {
			case 'excellent': return '#20b98b';
			case 'good': return '#d99000';
			case 'caution': return '#d99000';
			case 'poor': return '#e4564f';
			default: return 'var(--text-subtle)';
		}
	}

	function getRatingLabel(rating: string): string {
		switch (rating) {
			case 'excellent': return 'Excellent';
			case 'good': return 'Good';
			case 'caution': return 'Caution';
			case 'poor': return 'Needs attention';
			default: return 'Unrated';
		}
	}

	function getConfidenceBadge(level: string) {
		switch (level) {
			case 'high': return 'High confidence';
			case 'medium': return 'Medium confidence';
			case 'low': return 'Building baseline';
			default: return 'Evidence developing';
		}
	}
</script>

<div class="progress-story" data-tone={headline.tone}>
	<div class="story-glow" aria-hidden="true"></div>

	<section class="story-lead">
		<div class="story-kicker">
			<span class="story-dot" aria-hidden="true"></span>
			<span>Current form</span>
			<span class="story-separator">/</span>
			<span>{getConfidenceBadge(headline.confidence)}</span>
		</div>

		<div class="story-copy">
			<h2>{headline.text}</h2>
			<p>{headline.summary}</p>
		</div>

		{#if sessionQualityData.length >= 3}
			<div class="quality-thread" aria-label="Recent session quality history">
				<div class="quality-copy">
					<strong>Recent session quality</strong>
					<span>Context signal · latest {sessionQualityData.length}</span>
				</div>
				<div class="quality-bars" aria-hidden="true">
					{#each sessionQualityData as point}
						<span
							class="quality-bar"
							style={`height:${Math.max(10, Math.min(100, (point.quality / 10) * 100))}%`}
							title={`${point.date}: ${point.quality.toFixed(1)}/10`}
						></span>
					{/each}
				</div>
				<span class="sr-only">
					Recent session quality values: {sessionQualityData.map((point) => `${point.date} ${point.quality.toFixed(1)} out of 10`).join(', ')}.
				</span>
			</div>
		{/if}

		<div class="story-evidence">
			<div class="evidence-label">
				<span>Performance ceiling</span>
				<span>all-time evidence</span>
			</div>
			<div class="metric-grid">
				{#each [
					{ label: 'Reaction', value: fmtReaction(personalBests.reaction_ms), provenance: 'measured', ratingKey: 'reactionTimeSec' },
					{ label: 'Peak speed', value: fmtSpeed(personalBests.peak_speed_ms), provenance: 'estimated from IMU', ratingKey: 'peakSpeedKmh' },
					{ label: 'Peak G', value: fmtG(personalBests.max_g), provenance: 'measured', ratingKey: 'peakG' }
				] as pb}
					{@const rating = latestSessionRatings?.find((item) => item.metric === pb.ratingKey)}
					<div class="metric">
						<div class="metric-topline">
							<span>{pb.label}</span>
							<span class="pb-mark">PB</span>
						</div>
						<strong>{pb.value}</strong>
						<div class="metric-foot">
							<span>{pb.provenance}</span>
							{#if rating}
								<span class="rating" style={`color:${getRatingColor(rating.rating)}`}>{getRatingLabel(rating.rating)}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	{#if topRecommendations.length > 0}
		<aside class="next-session" aria-label="Next session focus">
			<div class="next-session-title">
				<span class="next-number">NEXT</span>
				<div>
					<strong>Take this to the gate</strong>
					<span>Two evidence-led cues for the next session</span>
				</div>
			</div>
			<div class="cue-grid">
				{#each topRecommendations as recommendation, index}
					<div class="cue">
						<span class="cue-index">0{index + 1}</span>
						<p>{recommendation}</p>
					</div>
				{/each}
			</div>
		</aside>
	{/if}
</div>

<style>
	.progress-story {
		--story-accent: var(--accent);
		position: relative;
		overflow: hidden;
		border-radius: 1.5rem;
		background:
			linear-gradient(125deg, color-mix(in srgb, var(--surface) 96%, var(--story-accent) 4%), var(--surface));
		box-shadow: 0 18px 55px color-mix(in srgb, var(--text-primary) 7%, transparent);
	}

	.progress-story[data-tone='attention'] { --story-accent: #e4564f; }
	.progress-story[data-tone='steady'] { --story-accent: #d99000; }
	.progress-story[data-tone='building'] { --story-accent: var(--text-subtle); }

	.story-glow {
		position: absolute;
		inset: -12rem auto auto -8rem;
		width: 34rem;
		height: 34rem;
		border-radius: 999px;
		background: radial-gradient(circle, color-mix(in srgb, var(--story-accent) 16%, transparent), transparent 68%);
		pointer-events: none;
	}

	.story-lead {
		position: relative;
		padding: clamp(1.5rem, 3.5vw, 3.75rem);
	}

	.story-kicker {
		display: flex;
		align-items: center;
		gap: .65rem;
		font-size: .68rem;
		font-weight: 700;
		letter-spacing: .16em;
		text-transform: uppercase;
		color: var(--text-subtle);
	}

	.story-dot {
		width: .55rem;
		height: .55rem;
		border-radius: 999px;
		background: var(--story-accent);
		box-shadow: 0 0 0 .3rem color-mix(in srgb, var(--story-accent) 13%, transparent);
	}

	.story-separator { opacity: .45; }

	.story-copy {
		display: grid;
		grid-template-columns: minmax(0, 1.45fr) minmax(15rem, .65fr);
		gap: clamp(1.5rem, 5vw, 5rem);
		align-items: end;
		margin-top: clamp(1.6rem, 3vw, 3rem);
	}

	.story-copy h2 {
		max-width: 15ch;
		margin: 0;
		font-size: clamp(2.25rem, 4.8vw, 5.25rem);
		line-height: .96;
		letter-spacing: -.055em;
		font-weight: 780;
		color: var(--text-primary);
	}

	.story-copy p {
		margin: 0 0 .35rem;
		max-width: 38rem;
		font-size: clamp(.92rem, 1.25vw, 1.08rem);
		line-height: 1.7;
		color: var(--text-secondary);
	}

	.quality-thread {
		display: grid;
		grid-template-columns: minmax(10rem, auto) minmax(12rem, 22rem);
		align-items: end;
		gap: 1.5rem;
		margin-top: clamp(1.75rem, 3vw, 2.75rem);
		max-width: 45rem;
	}

	.quality-copy strong,
	.quality-copy span { display: block; }
	.quality-copy strong { font-size: .74rem; color: var(--text-primary); }
	.quality-copy span { margin-top: .2rem; font-size: .64rem; color: var(--text-subtle); }

	.quality-bars {
		display: flex;
		align-items: end;
		gap: .28rem;
		height: 2.5rem;
		padding-bottom: .15rem;
		border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 12%, transparent);
	}

	.quality-bar {
		flex: 1;
		min-width: .2rem;
		border-radius: 999px 999px .15rem .15rem;
		background: color-mix(in srgb, var(--story-accent) 72%, var(--text-primary) 28%);
		opacity: .72;
	}

	.story-evidence {
		margin-top: clamp(2.25rem, 4vw, 4.25rem);
		padding-top: 1.1rem;
		border-top: 1px solid color-mix(in srgb, var(--text-primary) 15%, transparent);
	}

	.evidence-label {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: .9rem;
		font-size: .68rem;
		font-weight: 700;
		letter-spacing: .13em;
		text-transform: uppercase;
		color: var(--text-subtle);
	}

	.evidence-label span:last-child { font-weight: 500; letter-spacing: .06em; }

	.metric-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1px;
		background: color-mix(in srgb, var(--text-primary) 12%, transparent);
	}

	.metric {
		min-width: 0;
		padding: 1.15rem 1.25rem 1rem;
		background: color-mix(in srgb, var(--surface) 94%, transparent);
	}

	.metric-topline, .metric-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: .75rem;
	}

	.metric-topline {
		font-size: .72rem;
		font-weight: 650;
		color: var(--text-secondary);
	}

	.pb-mark {
		font-size: .58rem;
		font-weight: 800;
		letter-spacing: .08em;
		color: var(--story-accent);
	}

	.metric strong {
		display: block;
		margin-top: .55rem;
		font-size: clamp(1.65rem, 2.5vw, 2.65rem);
		line-height: 1;
		letter-spacing: -.035em;
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
	}

	.metric-foot {
		margin-top: .7rem;
		font-size: .64rem;
		color: var(--text-subtle);
	}

	.rating { font-weight: 700; }

	.next-session {
		position: relative;
		display: grid;
		grid-template-columns: minmax(12rem, .55fr) minmax(0, 1.45fr);
		gap: 1.5rem;
		padding: 1.25rem clamp(1.5rem, 3.5vw, 3.75rem);
		background: color-mix(in srgb, var(--story-accent) 9%, var(--surface));
		border-top: 1px solid color-mix(in srgb, var(--story-accent) 20%, transparent);
	}

	.next-session-title {
		display: flex;
		align-items: center;
		gap: .9rem;
	}

	.next-number {
		display: grid;
		place-items: center;
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 999px;
		background: var(--story-accent);
		font-size: .58rem;
		font-weight: 900;
		letter-spacing: .06em;
		color: var(--bg);
	}

	.next-session-title strong,
	.next-session-title span:last-child { display: block; }
	.next-session-title strong { font-size: .85rem; color: var(--text-primary); }
	.next-session-title span:last-child { margin-top: .15rem; font-size: .68rem; color: var(--text-subtle); }

	.cue-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.cue {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: .7rem;
		align-items: start;
	}

	.cue-index {
		font-size: .7rem;
		font-weight: 800;
		color: var(--story-accent);
	}

	.cue p {
		margin: 0;
		font-size: .76rem;
		line-height: 1.5;
		color: var(--text-primary);
	}

	@media (max-width: 760px) {
		.story-copy { grid-template-columns: 1fr; gap: 1rem; }
		.story-copy h2 { max-width: 12ch; }
		.quality-thread { grid-template-columns: 1fr; gap: .65rem; }
		.metric-grid { grid-template-columns: 1fr; }
		.metric { padding-inline: .25rem; background: transparent; }
		.metric + .metric { border-top: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent); }
		.next-session { grid-template-columns: 1fr; }
		.cue-grid { grid-template-columns: 1fr; }
	}
</style>