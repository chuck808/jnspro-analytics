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
				accent: 'var(--text-subtle)',
				confidence: 'low'
			};
		}

		const patterns = crossSessionReport.patterns || {};
		if (patterns.consistency?.trend === 'improving') {
			return {
				text: `Consistency improving — ${Math.abs(patterns.consistency.changePercent || 0).toFixed(1)}% better`,
				accent: 'var(--accent)',
				confidence: 'high'
			};
		}
		if (patterns.consistency?.trend === 'declining') {
			return {
				text: 'Consistency is variable — technique is the current limiter',
				accent: '#ff6b5f',
				confidence: 'high'
			};
		}
		if (patterns.speed?.trend === 'improving') {
			return {
				text: `Peak speed improving — ${Math.abs(patterns.speed.changePercent || 0).toFixed(1)}% faster`,
				accent: 'var(--accent)',
				confidence: 'medium'
			};
		}
		return {
			text: 'Performance is holding steady',
			accent: '#f5a623',
			confidence: 'medium'
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
			case 'excellent': return '#3de8c8';
			case 'good': return '#f5a623';
			case 'caution': return '#ffcc44';
			case 'poor': return '#ff6b5f';
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

<div class="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
	<div class="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
		<div class="p-5 sm:p-7 lg:p-8">
			<div class="flex flex-wrap items-center gap-2">
				<span class="themed-accent text-xs font-semibold tracking-[0.18em] uppercase">Current state</span>
				<span class="themed-text-subtle">·</span>
				<span class="themed-text-subtle text-xs">{getConfidenceBadge(headline.confidence)}</span>
			</div>

			<h2 class="themed-text-primary mt-4 max-w-3xl text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
				{headline.text}
			</h2>
			<p class="themed-text-secondary mt-3 max-w-2xl text-sm leading-6">
				This is your current training picture from {sessionCount} eligible session{sessionCount === 1 ? '' : 's'}. It is kept separate from the longer-term trend below.
			</p>

			{#if sessionQualityData.length >= 3}
				<div class="mt-7 max-w-2xl">
					<div class="mb-2 flex items-end justify-between gap-4">
						<div>
							<p class="themed-text-primary text-xs font-semibold tracking-[0.14em] uppercase">Recent session quality</p>
							<p class="themed-text-subtle mt-1 text-xs">A compact context signal, not a performance score.</p>
						</div>
						<span class="themed-text-subtle text-xs">latest {sessionQualityData.length}</span>
					</div>
					<div class="flex h-20 items-end gap-1.5" aria-label="Recent session quality history">
						{#each sessionQualityData as point}
							<div class="group flex h-full flex-1 items-end" title={`${point.date}: ${point.quality.toFixed(1)}/10`}>
								<div
									class="w-full rounded-sm bg-[color:var(--accent)] opacity-70 transition-opacity group-hover:opacity-100"
									style={`height:${Math.max(8, Math.min(100, (point.quality / 10) * 100))}%`}
								></div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if topRecommendations.length > 0}
				<div class="mt-7 border-t border-[color:var(--border)] pt-5">
					<p class="themed-text-subtle text-xs font-semibold tracking-[0.14em] uppercase">What to carry into the next session</p>
					<div class="mt-3 grid gap-3 sm:grid-cols-2">
						{#each topRecommendations as recommendation, index}
							<div class="flex gap-3">
								<span class="themed-accent mt-0.5 text-sm font-bold">0{index + 1}</span>
								<p class="themed-text-primary text-sm leading-6">{recommendation}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<aside class="border-t border-[color:var(--border)] bg-[color:var(--surface-raised,var(--surface))] p-5 sm:p-7 lg:border-t-0 lg:border-l lg:p-8">
			<p class="themed-text-subtle text-xs font-semibold tracking-[0.16em] uppercase">All-time reference</p>
			<div class="mt-5 divide-y divide-[color:var(--border)]">
				{#each [
					{ label: 'Reaction', value: fmtReaction(personalBests.reaction_ms), provenance: 'measured · PB', ratingKey: 'reactionTimeSec' },
					{ label: 'Peak speed', value: fmtSpeed(personalBests.peak_speed_ms), provenance: 'estimated from IMU · PB', ratingKey: 'peakSpeedKmh' },
					{ label: 'Peak G', value: fmtG(personalBests.max_g), provenance: 'measured · PB', ratingKey: 'peakG' }
				] as pb}
					{@const rating = latestSessionRatings?.find((item) => item.metric === pb.ratingKey)}
					<div class="py-4 first:pt-0 last:pb-0">
						<div class="flex items-start justify-between gap-3">
							<p class="themed-text-secondary text-sm">{pb.label}</p>
							{#if rating}
								<span class="text-[11px] font-semibold" style={`color:${getRatingColor(rating.rating)}`}>
									{getRatingLabel(rating.rating)}
								</span>
							{/if}
						</div>
						<p class="themed-text-primary mt-1 text-2xl font-bold tabular-nums">{pb.value}</p>
						<p class="themed-text-subtle mt-1 text-[11px]">{pb.provenance}</p>
					</div>
				{/each}
			</div>
		</aside>
	</div>
</div>