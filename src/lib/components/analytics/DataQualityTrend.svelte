<script lang="ts">
	/**
	 * Data Quality Trend Component
	 * Tracks sensor calibration and data reliability across sessions
	 */

	interface DataQualityPoint {
		sessionDate: string;
		sessionNumber: number;
		biasCorrection: number | null;
		qualityRating: 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown';
		analyticsValid: boolean;
	}

	interface Props {
		data: DataQualityPoint[];
		isMobile?: boolean;
	}

	let { data, isMobile: _isMobile = false }: Props = $props();

	const qualityColors = {
		excellent: '#3de8c8',
		good: '#f5a623',
		fair: '#ffcc44',
		calibrate: '#ff4444',
		unknown: '#6b5f4d'
	};

	// Calculate average bias correction trend
	let biasTrend = $derived.by(() => {
		const validBias = data.filter((d) => d.biasCorrection !== null);
		if (validBias.length < 2) return null;

		const first = validBias.slice(0, Math.min(5, validBias.length));
		const last = validBias.slice(-Math.min(5, validBias.length));

		const firstAvg = first.reduce((a, b) => a + Math.abs(b.biasCorrection!), 0) / first.length;
		const lastAvg = last.reduce((a, b) => a + Math.abs(b.biasCorrection!), 0) / last.length;

		const change = lastAvg - firstAvg;

		return {
			direction: change > 0.5 ? 'worsening' : change < -0.5 ? 'improving' : 'stable',
			current: lastAvg.toFixed(2),
			change: change.toFixed(2)
		};
	});

	// Quality distribution
	let qualityStats = $derived.by(() => {
		const ratings = data.map((d) => d.qualityRating);
		const total = ratings.length;

		return {
			excellent: Math.round((ratings.filter((r) => r === 'excellent').length / total) * 100),
			good: Math.round((ratings.filter((r) => r === 'good').length / total) * 100),
			fair: Math.round((ratings.filter((r) => r === 'fair').length / total) * 100),
			needsCalibration: Math.round((ratings.filter((r) => r === 'calibrate').length / total) * 100)
		};
	});
</script>

<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
	<div class="mb-4 flex items-start justify-between gap-4">
		<div>
			<h3 class="text-sm font-semibold text-[#f0ece4]">Sensor Data Quality</h3>
			<p class="mt-1 text-xs text-[#6b5f4d]">Calibration stability & data reliability</p>
		</div>
		{#if biasTrend}
			<div class="text-right">
				<div class="text-xs text-[#6b5f4d]">Avg Bias</div>
				<div
					class="text-lg font-bold"
					style="color:{biasTrend.direction === 'worsening'
						? '#ff4444'
						: biasTrend.direction === 'improving'
							? '#3de8c8'
							: '#f5a623'}"
				>
					{biasTrend.current} m/s²
				</div>
				<div
					class="text-xs {biasTrend.direction === 'worsening'
						? 'text-[#ff4444]'
						: biasTrend.direction === 'improving'
							? 'text-[#3de8c8]'
							: 'text-[#9a8f7a]'}"
				>
					{biasTrend.direction}
				</div>
			</div>
		{/if}
	</div>

	<!-- Quality trend visualization -->
	<div class="mb-4">
		<p class="mb-3 text-xs text-[#6b5f4d]">Quality trend over time</p>

		<!-- Visual timeline bar -->
		<div class="relative mb-3 h-12 overflow-hidden rounded-lg border border-[#221c18] bg-[#0a0809]">
			<div class="absolute inset-0 flex items-stretch">
				{#each data as session}
					<div
						class="group relative flex-1 transition-all hover:opacity-80"
						style="background:{qualityColors[session.qualityRating]}; opacity: 0.6;"
						title="{session.sessionDate}: {session.qualityRating}"
					>
						<!-- Tooltip on hover -->
						<div
							class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded border border-[#221c18] bg-[#0a0809] px-2 py-1 text-[10px] whitespace-nowrap text-[#f0ece4] opacity-0 transition-opacity group-hover:opacity-100"
						>
							<div class="font-semibold">{session.sessionDate}</div>
							<div class="text-[#9a8f7a]" style="color:{qualityColors[session.qualityRating]}">
								{session.qualityRating}
							</div>
							{#if session.biasCorrection !== null}
								<div class="text-[#6b5f4d]">Bias: {session.biasCorrection.toFixed(2)} m/s²</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Legend overlay -->
			<div
				class="absolute top-1 right-1 flex items-center gap-1.5 rounded bg-[#0a0809]/80 px-2 py-1 text-[9px] backdrop-blur-sm"
			>
				{#each [{ label: 'Exc', color: qualityColors.excellent }, { label: 'Good', color: qualityColors.good }, { label: 'Fair', color: qualityColors.fair }, { label: 'Cal', color: qualityColors.calibrate }] as legend}
					<div class="flex items-center gap-0.5">
						<div class="h-1.5 w-1.5 rounded-full" style="background:{legend.color}"></div>
						<span class="text-[#9a8f7a]">{legend.label}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Session range indicator -->
		<div class="flex items-center justify-between text-[10px] text-[#6b5f4d]">
			<span>Session 1</span>
			<span>{data.length} sessions</span>
			<span>Session {data.length}</span>
		</div>
	</div>

	<!-- Summary stats -->
	<div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
		{#each [{ label: 'Excellent', percent: qualityStats.excellent, color: qualityColors.excellent }, { label: 'Good', percent: qualityStats.good, color: qualityColors.good }, { label: 'Fair', percent: qualityStats.fair, color: qualityColors.fair }, { label: 'Needs Cal.', percent: qualityStats.needsCalibration, color: qualityColors.calibrate }] as stat}
			<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-2">
				<div class="mb-0.5 text-[10px] text-[#6b5f4d]">{stat.label}</div>
				<div class="text-lg font-bold" style="color:{stat.color}">{stat.percent}%</div>
			</div>
		{/each}
	</div>

	{#if biasTrend}
		<p class="text-xs text-[#9a8f7a] italic">
			{#if biasTrend.direction === 'worsening'}
				⚠️ Sensor bias increasing — check device mounting & calibration
			{:else if biasTrend.direction === 'improving'}
				✅ Sensor calibration improving — setup is stable
			{:else}
				➡️ Sensor calibration stable — consistent data quality
			{/if}
		</p>
	{/if}

	{#if qualityStats.needsCalibration > 20}
		<div class="mt-3 rounded-lg border border-[#ff4444]/20 bg-[#ff4444]/10 p-3">
			<p class="text-xs font-semibold text-[#ff4444]">
				⚠️ {qualityStats.needsCalibration}% of sessions need calibration
			</p>
			<p class="mt-1 text-xs text-[#9a8f7a]">
				Recalibrate your device or check sensor mounting consistency
			</p>
		</div>
	{/if}
</div>
