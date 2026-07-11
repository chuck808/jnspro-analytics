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

	// Generate headline based on cross-session intelligence
	let headline = $derived.by(() => {
		if (!crossSessionReport || sessionCount < 3) {
			return { text: 'Building your performance baseline', color: '#9a8f7a', confidence: 'low' };
		}

		const patterns = crossSessionReport.patterns || {};

		// Check for improving consistency
		if (patterns.consistency?.trend === 'improving') {
			return {
				text: `Consistency improving — ${Math.abs(patterns.consistency.changePercent || 0).toFixed(1)}% better`,
				color: '#3de8c8',
				confidence: 'high'
			};
		}

		// Check for declining consistency
		if (patterns.consistency?.trend === 'declining') {
			return {
				text: `Consistency variable — focus on technique`,
				color: '#ff4444',
				confidence: 'high'
			};
		}

		// Check speed trends
		if (patterns.speed?.trend === 'improving') {
			return {
				text: `Peak speed improving — ${Math.abs(patterns.speed.changePercent || 0).toFixed(1)}% faster`,
				color: '#3de8c8',
				confidence: 'medium'
			};
		}

		// Stable performance
		return {
			text: 'Performance holding steady — maintain current approach',
			color: '#f5a623',
			confidence: 'medium'
		};
	});

	// Extract top recommendations
	let topRecommendations = $derived.by(() => {
		if (!crossSessionReport?.recommendations) return [];
		return crossSessionReport.recommendations.slice(0, 3);
	});

	// Session quality trend data for mini chart
	let sessionQualityData = $derived.by(() => {
		if (!crossSessionReport?.sessions) return [];
		return crossSessionReport.sessions.map((s: any) => ({
			date: new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
			quality: s.sessionQuality || 0
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
			case 'excellent':
				return '#3de8c8';
			case 'good':
				return '#f5a623';
			case 'caution':
				return '#ffcc44';
			case 'poor':
				return '#ff4444';
			default:
				return '#6b5f4d';
		}
	}

	function getRatingLabel(rating: string): string {
		switch (rating) {
			case 'excellent':
				return 'Excellent';
			case 'good':
				return 'Good';
			case 'caution':
				return 'Caution';
			case 'poor':
				return 'Needs Attention';
			default:
				return 'Unknown';
		}
	}

	function getConfidenceBadge(level: string) {
		switch (level) {
			case 'high':
				return { label: 'High Confidence', color: '#3de8c8', bg: '#3de8c820' };
			case 'medium':
				return { label: 'Medium Confidence', color: '#f5a623', bg: '#f5a62320' };
			case 'low':
				return { label: 'Building Baseline', color: '#9a8f7a', bg: '#9a8f7a20' };
			default:
				return { label: 'Unknown', color: '#6b5f4d', bg: '#6b5f4d20' };
		}
	}
</script>

<div class="space-y-5">
	<!-- Headline + Confidence -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
		{#if headline}
			{@const badge = getConfidenceBadge(headline.confidence)}
			<div class="mb-4 flex items-start justify-between gap-4">
				<div class="flex-1">
					<p class="mb-2 text-xs tracking-wide text-[#6b5f4d] uppercase">Performance Status</p>
					<h2 class="mb-2 text-2xl font-bold" style="color:{headline.color}">{headline.text}</h2>
				</div>
				<div
					class="rounded-full px-3 py-1.5 text-xs font-medium"
					style="background:{badge.bg}; color:{badge.color}"
				>
					{badge.label}
				</div>
			</div>
		{/if}

		<!-- Recommendations -->
		{#if topRecommendations.length > 0}
			<div class="mt-4 border-t border-[#221c18] pt-4">
				<p class="mb-2 text-xs font-semibold tracking-wider text-[#f5a623] uppercase">
					Recommended Actions
				</p>
				<ul class="space-y-2">
					{#each topRecommendations as rec}
						<li class="flex items-start gap-2 text-sm text-[#f0ece4]">
							<span class="mt-0.5 text-[#3de8c8]">→</span>
							<span>{rec}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Mini Session Quality Trend Chart (if enough data) -->
		{#if sessionQualityData.length >= 3}
			<div class="mt-4 border-t border-[#221c18] pt-4">
				<p class="mb-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">
					Session Quality Trend
				</p>
				<div class="flex h-16 items-end gap-1">
					{#each sessionQualityData.slice(-10) as point}
						<div class="flex flex-1 flex-col items-center gap-1">
							<div
								class="w-full rounded-t transition-all"
								style="height:{(point.quality / 10) * 100}%; background:{point.quality >= 7
									? '#3de8c8'
									: point.quality >= 5
										? '#f5a623'
										: '#ff4444'}"
							></div>
							<span class="text-[10px] text-[#6b5f4d]">{point.date.split(' ')[0]}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Personal Bests with BMX threshold ratings -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		{#each [{ label: 'Best Reaction', value: fmtReaction(personalBests.reaction_ms), sub: 'all time', ratingKey: 'reactionTimeSec' }, { label: 'Best Peak Speed', value: fmtSpeed(personalBests.peak_speed_ms), sub: 'estimated · all time', ratingKey: 'peakSpeedKmh' }, { label: 'Best Max G', value: fmtG(personalBests.max_g), sub: 'all time', ratingKey: 'peakG' }] as pb}
			{@const rating = latestSessionRatings?.find((r) => r.metric === pb.ratingKey)}
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
				<div class="mb-2 flex items-center justify-between">
					<p class="text-xs tracking-wider text-[#6b5f4d] uppercase">{pb.label}</p>
					{#if rating}
						<span
							class="rounded-full px-2 py-0.5 text-xs font-medium"
							style="background:{getRatingColor(rating.rating)}20; color:{getRatingColor(
								rating.rating
							)}"
						>
							{getRatingLabel(rating.rating)}
						</span>
					{/if}
				</div>
				<p class="text-3xl font-bold text-[#f5a623]">{pb.value}</p>
				<p class="mt-1 text-xs text-[#6b5f4d]">{pb.sub}</p>
			</div>
		{/each}
	</div>
</div>
