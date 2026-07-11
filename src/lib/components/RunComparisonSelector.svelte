<script lang="ts">
	import MultiRunOverlayChart from './charts/MultiRunOverlayChart.svelte';
	import { computeSpeedCurve, computeJerk, GRAVITY_MS2 } from '$lib/performance-engine/physics';

	interface Run {
		id: string;
		run_number: number;
		chart_data: number[];
		elapsed_time_ms: number;
		gate_runs?: {
			reaction_time_ms: number;
			peak_speed_ms?: number;
		} | null;
	}

	interface Props {
		runs: Run[];
	}

	let { runs }: Props = $props();

	// Predefined colors for up to 4 runs
	const CHART_COLORS = [
		'#3de8c8', // Teal
		'#f5a623', // Amber
		'#ff6b3d', // Orange
		'#9b87f5' // Purple
	];

	let selectedRunIds = $state<Set<string>>(new Set());
	let showComparison = $state(false);
	let metric = $state<'gForce' | 'speed' | 'jerk'>('gForce');

	// Derived selected runs with colors - data changes based on metric
	let selectedRuns = $derived.by(() => {
		const selected: Array<{
			runNumber: number;
			data: number[];
			elapsedMs: number;
			color: string;
		}> = [];

		let colorIndex = 0;
		for (const run of runs) {
			if (selectedRunIds.has(run.id)) {
				const chartData = run.chart_data as number[];
				const elapsedMs = run.elapsed_time_ms;

				// Transform data based on selected metric
				let dataToDisplay: number[];

				if (metric === 'speed') {
					// Compute speed from G-Force data
					const actualPeakSpeedKmh = run.gate_runs?.peak_speed_ms
						? run.gate_runs.peak_speed_ms * 3.6
						: null;
					const curve = computeSpeedCurve(chartData, elapsedMs, 0, actualPeakSpeedKmh);
					dataToDisplay = curve.speeds;
				} else if (metric === 'jerk') {
					// Compute jerk from G-Force data
					const jerkEstimate = computeJerk(chartData, elapsedMs);
					dataToDisplay = jerkEstimate?.series.map((s) => s.value) ?? [];
				} else {
					// Use raw G-Force data
					dataToDisplay = chartData;
				}

				selected.push({
					runNumber: run.run_number,
					data: dataToDisplay,
					elapsedMs: run.elapsed_time_ms,
					color: CHART_COLORS[colorIndex % CHART_COLORS.length]
				});
				colorIndex++;
			}
		}

		return selected;
	});

	function toggleRunSelection(runId: string) {
		const newSelection = new Set(selectedRunIds);

		if (newSelection.has(runId)) {
			newSelection.delete(runId);
		} else {
			// Max 4 runs
			if (newSelection.size < 4) {
				newSelection.add(runId);
			}
		}

		selectedRunIds = newSelection;

		// Auto-hide comparison if less than 2 runs selected
		if (newSelection.size < 2) {
			showComparison = false;
		}
	}

	function clearSelection() {
		selectedRunIds = new Set();
		showComparison = false;
	}

	function compareSelected() {
		if (selectedRunIds.size >= 2) {
			showComparison = true;
		}
	}

	// Get color for selected run
	function getRunColor(runId: string): string | null {
		const selectedArray = Array.from(selectedRunIds);
		const index = selectedArray.indexOf(runId);
		return index >= 0 ? CHART_COLORS[index % CHART_COLORS.length] : null;
	}

	function fmtReaction(ms: number | null) {
		return ms !== null ? (ms / 1000).toFixed(3) + 's' : '—';
	}
</script>

<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
	<!-- Header -->
	<div class="mb-4 flex items-center justify-between">
		<div>
			<h3 class="text-sm font-semibold text-[#f0ece4]">Compare Multiple Runs</h3>
			<p class="mt-0.5 text-xs text-[#6b5f4d]">
				Select 2-4 runs to overlay and analyze differences
			</p>
		</div>
		{#if selectedRunIds.size > 0}
			<button
				onclick={clearSelection}
				class="rounded px-2 py-1 text-xs
                       text-[#9a8f7a] transition-colors hover:text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
			>
				Clear ({selectedRunIds.size})
			</button>
		{/if}
	</div>

	<!-- Run Selection Grid -->
	<div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
		{#each runs as run}
			{@const isSelected = selectedRunIds.has(run.id)}
			{@const color = getRunColor(run.id)}
			{@const isDisabled = !isSelected && selectedRunIds.size >= 4}

			<button
				onclick={() => !isDisabled && toggleRunSelection(run.id)}
				disabled={isDisabled}
				class="flex min-h-[60px] flex-col items-center justify-center rounded-lg border px-3
                       py-2.5 text-xs transition-all
                       focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                       {isSelected
					? 'border-[2px]'
					: isDisabled
						? 'cursor-not-allowed border-[#221c18] bg-[#0a0809] text-[#6b5f4d] opacity-50'
						: 'border-[#221c18] bg-[#0a0809] text-[#9a8f7a] hover:border-[#f5a623]/20 hover:bg-[color:var(--theme-surface)]'}"
				style={isSelected && color
					? `border-color: ${color}; background: ${color}15; color: ${color}`
					: ''}
			>
				{#if isSelected && color}
					<div class="mb-1 h-3 w-3 rounded-full" style="background: {color}"></div>
				{/if}

				<span class="font-bold">Run {run.run_number}</span>
				<span class="mt-0.5 text-[10px] opacity-75">
					{fmtReaction(run.gate_runs?.reaction_time_ms ?? null)}
				</span>
			</button>
		{/each}
	</div>

	<!-- Action Buttons -->
	<div class="mb-4 flex items-center gap-3">
		<button
			onclick={compareSelected}
			disabled={selectedRunIds.size < 2}
			class="flex-1 rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold
                   text-[#0a0809] transition-colors hover:bg-[#c97e0a] focus:ring-2 focus:ring-[#f5a623]
                   focus:outline-none disabled:cursor-not-allowed disabled:bg-[#6b5f4d]"
		>
			{#if selectedRunIds.size < 2}
				Select at least 2 runs
			{:else if showComparison}
				Update Comparison
			{:else}
				Compare {selectedRunIds.size} Runs
			{/if}
		</button>

		<!-- Metric selector -->
		{#if showComparison}
			<div class="flex items-center gap-1 rounded-lg border border-[#221c18] bg-[#0a0809] p-1">
				{#each [{ value: 'gForce', label: 'G-Force' }, { value: 'speed', label: 'Speed' }, { value: 'jerk', label: 'Jerk' }] as option}
					<button
						onclick={() => (metric = option.value as any)}
						class="rounded px-3 py-1.5 text-xs font-medium transition-colors
                               focus:ring-2 focus:ring-[#f5a623] focus:outline-none
                               {metric === option.value
							? 'bg-[#f5a623] text-[#0a0809]'
							: 'text-[#9a8f7a] hover:text-[#f0ece4]'}"
					>
						{option.label}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Comparison Chart -->
	{#if showComparison && selectedRuns.length >= 2}
		<MultiRunOverlayChart runs={selectedRuns} {metric} height="h-80" />
	{/if}

	<!-- Hint when nothing selected -->
	{#if selectedRunIds.size === 0 && !showComparison}
		<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-6 text-center">
			<svg
				class="mx-auto mb-3 h-12 w-12 text-[#6b5f4d]"
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
			<p class="mb-1 text-sm font-medium text-[#9a8f7a]">Select runs to compare</p>
			<p class="text-xs text-[#6b5f4d]">
				Click on 2-4 run buttons above to overlay their data and identify technique variations
			</p>
		</div>
	{/if}
</div>
