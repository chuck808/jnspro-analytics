<script lang="ts">
	import {
		analyseSession,
		buildChartSeries,
		shouldShowPower,
		type DetailLevel
	} from '$lib/performance-engine';
	import { createAnalysisView } from '$lib/analysis-views';
	import {
		AccelerationChart,
		SpeedChart,
		JerkChart,
		ImpulseChart,
		PowerChart
	} from '$lib/components/performance-charts';
	import HelpButton from '$lib/components/HelpButton.svelte';
	import { onMount } from 'svelte';

	interface Props {
		session: any;
		runs?: any[];
		riderWeight?: number | null;
		bikeWeight?: number | null;
		crankLength?: number | null;
		selectedRunIndex?: number;
		onOpenHelp?: (key: string) => void;
	}

	let {
		session,
		runs = [],
		riderWeight = null,
		bikeWeight = null,
		crankLength = null,
		selectedRunIndex = 0,
		onOpenHelp = () => {}
	}: Props = $props();

	let detailLevel: DetailLevel = $state('elite');

	// Reactive analysis
	let analysis = $derived(
		analyseSession(
			{ ...session, runs },
			{
				riderLevel: (session.rider_profiles as any)?.rider_level,
				riderWeightKg: riderWeight,
				bikeWeightKg: bikeWeight,
				crankLengthMm: crankLength
			},
			{ selectedRunIndex }
		)
	);

	let view = $derived(createAnalysisView(analysis, detailLevel));
	let chartSeries = $derived(buildChartSeries(analysis));
	let isMobile = $state(false);

	onMount(() => {
		isMobile = window.innerWidth < 640;
		const handleResize = () => {
			isMobile = window.innerWidth < 640;
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	function scoreColor(s: number | null | undefined): string {
		if (s === null || s === undefined) return '#9a8f7a';
		if (s >= 80) return '#3de8c8';
		if (s >= 60) return '#f5a623';
		if (s >= 40) return '#ffcc44';
		return '#ff4444';
	}

	function toneColor(tone: 'positive' | 'neutral' | 'warning'): string {
		if (tone === 'positive') return '#3de8c8';
		if (tone === 'warning') return '#ff4444';
		return '#f5a623';
	}
</script>

<section class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
	<!-- Header -->
	<div class="mb-5 flex flex-wrap items-start justify-between gap-4">
		<div>
			<div class="mb-2 flex items-center gap-2">
				<span
					class="rounded border border-[#3de8c8]/20 bg-[#3de8c8]/10 px-2 py-0.5 text-xs font-semibold text-[#3de8c8]"
				>
					Performance Engine
				</span>
				<HelpButton label="Performance Engine" onclick={() => onOpenHelp('performanceEngine')} />
				<span class="text-xs text-[#6b5f4d]">New analytics brain</span>
			</div>
			<h2 class="text-xl font-bold text-[#f0ece4]">{view.headline}</h2>
			<p class="mt-1 text-sm text-[#9a8f7a]">{view.summary}</p>
		</div>

		<div class="flex flex-col gap-2">
			<label for="detail-level" class="text-xs tracking-wider text-[#6b5f4d] uppercase">
				Detail Level
			</label>
			<select
				id="detail-level"
				bind:value={detailLevel}
				class="rounded-lg border border-[#221c18] bg-[#0a0809] px-3 py-2 text-sm text-[#f0ece4]
               transition-colors hover:border-[#f5a623]/20 focus:border-transparent focus:ring-2
               focus:ring-[#f5a623] focus:outline-none"
			>
				<option value="grom">Grom / Parent</option>
				<option value="rider">Rider</option>
				<option value="elite">Elite Athlete</option>
				<option value="coach">Coach</option>
			</select>
		</div>
	</div>

	<!-- Metrics Grid -->
	<div class="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		{#each view.metrics as metric}
			<article
				class="flex min-h-[100px] flex-col rounded-lg border border-[#221c18] bg-[#0a0809] p-4"
			>
				<p class="mb-2 text-xs font-medium tracking-wide text-[#6b5f4d] uppercase">
					{metric.label}
				</p>
				<p class="mb-auto text-2xl font-bold text-[#f5a623]">
					{metric.value}
				</p>
				{#if detailLevel !== 'grom' && metric.explanation}
					<p class="mt-2 text-xs leading-relaxed text-[#9a8f7a]">
						{metric.explanation}
					</p>
				{/if}
			</article>
		{/each}
	</div>

	<!-- Insights & Next Actions Grid -->
	<div class="grid gap-5 lg:grid-cols-2">
		<!-- Insights -->
		<div>
			<div class="mb-3 flex items-center gap-2">
				<h3 class="text-sm font-semibold tracking-wider text-[#f0ece4] uppercase">Insights</h3>
				<HelpButton label="Insights" onclick={() => onOpenHelp('performanceEngineInsights')} />
			</div>
			<div class="space-y-3">
				{#each view.insights as insight}
					{@const borderColor = toneColor(insight.tone)}
					<div class="rounded-lg border bg-[#0a0809] p-3.5" style="border-color: {borderColor}40">
						<div class="flex items-start gap-2">
							<div
								class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
								style="background-color: {borderColor}"
							></div>
							<div class="min-w-0 flex-1">
								<p class="mb-1 text-sm font-semibold text-[#f0ece4]">
									{insight.title}
								</p>
								<p class="text-sm leading-relaxed text-[#9a8f7a]">
									{insight.body}
								</p>
							</div>
						</div>
					</div>
				{/each}
				{#if view.insights.length === 0}
					<p class="text-sm text-[#6b5f4d] italic">No insights available for this run.</p>
				{/if}
			</div>
		</div>

		<!-- Next Actions -->
		<div>
			<div class="mb-3 flex items-center gap-2">
				<h3 class="text-sm font-semibold tracking-wider text-[#f0ece4] uppercase">Next Actions</h3>
				<HelpButton label="Next Actions" onclick={() => onOpenHelp('performanceEngineActions')} />
			</div>
			<ol class="list-none space-y-2.5">
				{#each view.nextActions as action, i}
					<li
						class="flex gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-3 text-sm leading-relaxed text-[#9a8f7a]"
					>
						<span class="w-5 flex-shrink-0 font-bold text-[#f5a623]">
							{i + 1}.
						</span>
						<span class="flex-1">{action}</span>
					</li>
				{/each}
				{#if view.nextActions.length === 0}
					<p class="text-sm text-[#6b5f4d] italic">No specific actions recommended.</p>
				{/if}
			</ol>
		</div>
	</div>

	<!-- Advanced charts indicator -->
	{#if detailLevel === 'elite' || detailLevel === 'coach'}
		<div class="mt-5 rounded-lg border border-[#3de8c8]/20 bg-[#0a0809] p-4">
			<div class="flex items-start gap-3">
				<svg
					class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#3de8c8]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				<div class="flex-1">
					<p class="mb-1 text-sm font-semibold text-[#3de8c8]">Advanced Charts Enabled</p>
					<p class="text-xs text-[#9a8f7a]">
						Acceleration: <span class="text-[#f0ece4]"
							>{view.showCharts.acceleration ? '✓' : '✗'}</span
						>, Speed: <span class="text-[#f0ece4]">{view.showCharts.speed ? '✓' : '✗'}</span>,
						Impulse: <span class="text-[#f0ece4]">{view.showCharts.impulse ? '✓' : '✗'}</span>,
						Power: <span class="text-[#f0ece4]">{view.showCharts.power ? '✓' : '✗'}</span>, Jerk:
						<span class="text-[#f0ece4]">{view.showCharts.jerk ? '✓' : '✗'}</span>
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Profile completion warning -->
	{#if !analysis.profileComplete}
		<div class="mt-5 rounded-lg border border-[#f5a623]/20 bg-[#0a0809] p-4">
			<div class="flex items-start gap-3">
				<svg
					class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#f5a623]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<div class="flex-1">
					<p class="mb-1 text-sm font-semibold text-[#f5a623]">Complete Your Profile</p>
					<p class="text-xs text-[#9a8f7a]">
						Add your weight and bike weight in
						<a
							href="/profile"
							class="rounded text-[#f5a623] hover:underline focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
						>
							your profile
						</a>
						to unlock power and impulse analysis.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Performance Charts (Elite/Coach only) -->
	{#if (detailLevel === 'elite' || detailLevel === 'coach') && analysis.selectedRun}
		{@const p = analysis.selectedRun.physics}
		{@const runNum = analysis.selectedRun.runNumber}

		<div class="mt-5 space-y-4">
			<h3 class="text-sm font-semibold tracking-wider text-[#f0ece4] uppercase">
				Performance Charts
			</h3>

			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<!-- Acceleration Chart -->
				{#if view.showCharts.acceleration && chartSeries.acceleration.length}
					<AccelerationChart data={chartSeries.acceleration} />
				{/if}

				<!-- Speed Chart -->
				{#if view.showCharts.speed && chartSeries.speed.length}
					<SpeedChart speed={chartSeries.speed} acceleration={chartSeries.acceleration} />
				{/if}

				<!-- Jerk Chart -->
				{#if view.showCharts.jerk && chartSeries.jerk.length}
					<JerkChart data={chartSeries.jerk} smoothnessScore={p?.jerk?.smoothnessScore} />
				{/if}

				<!-- Impulse Chart -->
				{#if view.showCharts.impulse && chartSeries.impulse.length}
					<ImpulseChart data={chartSeries.impulse} />
				{/if}

				<!-- Power Chart (only if calibration is ok) -->
				{#if view.showCharts.power && shouldShowPower(analysis.diagnostics) && chartSeries.power.length}
					<PowerChart data={chartSeries.power} reliable={shouldShowPower(analysis.diagnostics)} />
				{/if}
			</div>
		</div>
	{/if}

	<!-- Calibration Warnings -->
	{#if analysis.hasCalibrationWarning && (detailLevel === 'elite' || detailLevel === 'coach')}
		<div class="mt-5 rounded-lg border border-[#ff4444]/20 bg-[#0a0809] p-4">
			<div class="flex items-start gap-3">
				<svg
					class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#ff4444]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div class="flex-1">
					<p class="mb-1 text-sm font-semibold text-[#ff4444]">Calibration Warning</p>
					<p class="mb-2 text-xs text-[#9a8f7a]">
						Some physics values appear outside normal ranges. Power and speed estimates may be
						unreliable.
					</p>
					{#if detailLevel === 'coach'}
						<div class="space-y-1">
							{#each analysis.diagnostics.filter((d) => d.severity === 'error') as diag}
								<p class="text-xs text-[#9a8f7a]">
									<span class="text-[#ff4444]">•</span>
									{diag.message}
									{#if diag.suggestion}
										<span class="text-[#6b5f4d]">— {diag.suggestion}</span>
									{/if}
								</p>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Debug info (coach level only) -->
	{#if detailLevel === 'coach'}
		<details class="mt-5">
			<summary class="cursor-pointer text-xs text-[#6b5f4d] transition-colors hover:text-[#9a8f7a]">
				Debug: Raw analysis data
			</summary>
			<pre
				class="mt-2 max-h-64 overflow-auto rounded border border-[#221c18] bg-[#0a0809] p-3 text-[10px] text-[#6b5f4d]">{JSON.stringify(
					analysis,
					null,
					2
				)}</pre>
		</details>
	{/if}
</section>
