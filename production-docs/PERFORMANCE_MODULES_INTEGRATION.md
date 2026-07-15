# Performance Modules Integration Guide

This document explains how to use the newly integrated performance analysis modules and chart components.

## 📦 What Was Added

### Analysis Modules (TypeScript)

Located in `src/lib/performance-engine/`:

1. **frontWheelLift.ts** - Analyzes front wheel lift/wheelie behavior
2. **dataQuality.ts** - Assesses sensor data quality based on bias
3. **phaseConsistency.ts** - Analyzes consistency across run phases

### Chart Components (Svelte)

Located in `src/lib/components/performance-charts/`:

1. **PeakSpeedScatterChart.svelte** - Scatter plot of peak speeds across runs
2. **SpeedWithAverageLineChart.svelte** - Line chart with average reference
3. **SpeedHeatmapChart.svelte** - Heatmap visualization of speed intensity

---

## 🚀 Usage Examples

### 1. Front Wheel Lift Analysis

```typescript
import { analyseFrontWheelLift } from '$lib/performance-engine';

// Analyze wheelie behavior from gate run data
const wheelieAnalysis = analyseFrontWheelLift({
	front_wheel_lifted: true,
	wheelie_duration_ms: 850,
	max_pitch: 16.5,
	time_to_wheelie_ms: 450
});

// Result:
// {
//   detected: true,
//   maxPitch: 16.5,
//   timeToLift: 450,
//   duration: 850,
//   classification: 'controlled' // 'no-lift' | 'controlled' | 'late-lift' | 'excessive-lift'
// }
```

**Classification Logic:**

- `no-lift`: No front wheel lift detected
- `controlled`: Lift detected within normal parameters
- `late-lift`: Lift happened too late (>700ms)
- `excessive-lift`: Lift angle >18° or duration >900ms

---

### 2. Data Quality Assessment

```typescript
import { assessDataQuality } from '$lib/performance-engine';

// Check data quality from bias correction
const quality = assessDataQuality(0.35);

// Result:
// {
//   rating: 'excellent', // 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown'
//   bias: 0.35
// }
```

**Rating Scale:**

- `excellent`: bias < 0.5 m/s²
- `good`: bias < 1.0 m/s²
- `fair`: bias < 2.0 m/s²
- `calibrate`: bias ≥ 2.0 m/s² (needs calibration)
- `unknown`: bias is null/undefined

---

### 3. Phase Consistency Analysis

```typescript
import { analysePhaseConsistency } from '$lib/performance-engine';

// Analyze consistency across multiple runs
const runs = [
	{
		splits: [
			{ phase: 'reaction', time: 250 },
			{ phase: 'acceleration', time: 1200 },
			{ phase: 'top-speed', time: 2100 }
		]
	},
	{
		splits: [
			{ phase: 'reaction', time: 280 },
			{ phase: 'acceleration', time: 1180 },
			{ phase: 'top-speed', time: 2050 }
		]
	}
];

const consistency = analysePhaseConsistency(runs);

// Result: Array of consistency per phase
// [
//   {
//     phase: 'reaction',
//     avg: 265,
//     spread: 30,
//     consistency: 88.68 // Higher = more consistent (0-100 scale)
//   },
//   ...
// ]
```

---

## 📊 Chart Components

### Peak Speed Scatter Chart

```svelte
<script>
	import { PeakSpeedScatterChart } from '$lib/components/performance-charts';

	const speedData = [
		{ runIndex: 0, speed: 45.2, runNumber: 1 },
		{ runIndex: 1, speed: 46.8, runNumber: 2 },
		{ runIndex: 2, speed: 44.9, runNumber: 3 },
		{ runIndex: 3, speed: 47.1, runNumber: 4 }
	];
</script>

<PeakSpeedScatterChart
	points={speedData}
	title="Peak Speed Distribution"
	subtitle="Peak speed achieved in each run"
	height={220}
	compact={false}
/>
```

**Props:**

- `points` - Array of `{ runIndex, speed, runNumber? }`
- `title` - Chart title (default: "Peak Speed Distribution")
- `subtitle` - Chart subtitle
- `height` - Chart height in pixels (default: 220)
- `compact` - Compact mode (default: false)

---

### Speed With Average Line Chart

```svelte
<script>
	import { SpeedWithAverageLineChart } from '$lib/components/performance-charts';

	const speedSeries = [
		{ x: 0, y: 0 },
		{ x: 0.5, y: 25.3 },
		{ x: 1.0, y: 42.1 },
		{ x: 1.5, y: 46.8 },
		{ x: 2.0, y: 47.2 }
	];

	const averageSpeed = 32.28;
</script>

<SpeedWithAverageLineChart
	series={speedSeries}
	average={averageSpeed}
	title="Speed Over Time"
	subtitle="Speed progression with average reference"
	unit="km/h"
	height={220}
	compact={false}
/>
```

**Props:**

- `series` - Array of `{ x, y }` points
- `average` - Average value for reference line
- `title` - Chart title (default: "Speed Over Time")
- `subtitle` - Chart subtitle
- `unit` - Y-axis unit (default: "km/h")
- `height` - Chart height in pixels (default: 220)
- `compact` - Compact mode (default: false)

---

### Speed Heatmap Chart

```svelte
<script>
	import { SpeedHeatmapChart } from '$lib/components/performance-charts';

	const heatmapData = [
		{ intensity: 0.2, value: 15.3, label: 'Segment 1' },
		{ intensity: 0.5, value: 32.1, label: 'Segment 2' },
		{ intensity: 0.8, value: 45.8, label: 'Segment 3' },
		{ intensity: 1.0, value: 52.3, label: 'Segment 4' }
		// ... more cells
	];
</script>

<SpeedHeatmapChart
	cells={heatmapData}
	columns={20}
	title="Speed Intensity Heatmap"
	subtitle="Speed intensity distribution across time segments"
	unit="km/h"
	height={220}
	compact={false}
/>
```

**Props:**

- `cells` - Array of `{ intensity, value?, label? }` (intensity: 0-1 range)
- `columns` - Number of columns in grid (default: 20)
- `title` - Chart title (default: "Speed Intensity Heatmap")
- `subtitle` - Chart subtitle
- `unit` - Value unit (default: "km/h")
- `compact` - Compact mode (default: false)

---

## 🎨 Styling

All components automatically use your app's theme variables:

- `var(--theme-surface)` - Card background
- `var(--theme-bg)` - Stats grid background
- `var(--theme-text-primary)` - Primary text color
- `var(--theme-text-secondary)` - Secondary text color
- `var(--theme-text-subtle)` - Subtle text color
- `var(--theme-border)` - Border color
- `var(--color-jns-amber)` - Amber accent (#f5a623)
- `#3de8c8` - Cyan accent for data points

The components are fully responsive with mobile breakpoints at 640px.

---

## 📍 Integration Example

Here's how to integrate into a panel component:

```svelte
<script lang="ts">
	import {
		analyseFrontWheelLift,
		assessDataQuality,
		analysePhaseConsistency
	} from '$lib/performance-engine';

	import {
		PeakSpeedScatterChart,
		SpeedWithAverageLineChart,
		SpeedHeatmapChart
	} from '$lib/components/performance-charts';

	// Your session/run data
	export let session;
	export let runs = [];

	// Process data
	$: speedPoints = runs.map((run, i) => ({
		runIndex: i,
		speed: run.max_speed_kmh ?? 0,
		runNumber: run.run_number
	}));

	$: wheelieAnalysis = runs.map((run) => analyseFrontWheelLift(run.gate_runs ?? {}));

	$: dataQuality = assessDataQuality(runs[0]?.gate_runs?.bias_correction_ms2);
</script>

<section class="performance-panel">
	<h2>Performance Analysis</h2>

	<!-- Data Quality Badge -->
	<div class="quality-badge {dataQuality.rating}">
		Data Quality: {dataQuality.rating}
	</div>

	<!-- Charts -->
	<div class="charts-grid">
		<PeakSpeedScatterChart points={speedPoints} />
		<SpeedWithAverageLineChart series={speedSeriesData} average={averageSpeed} />
		<SpeedHeatmapChart cells={heatmapCells} />
	</div>

	<!-- Wheelie Analysis -->
	<div class="analysis-cards">
		{#each wheelieAnalysis as analysis, i}
			<div class="card {analysis.classification}">
				<h3>Run {i + 1}</h3>
				<p>Classification: {analysis.classification}</p>
				{#if analysis.detected}
					<ul>
						<li>Max Pitch: {analysis.maxPitch}°</li>
						<li>Duration: {analysis.duration}ms</li>
						<li>Time to Lift: {analysis.timeToLift}ms</li>
					</ul>
				{/if}
			</div>
		{/each}
	</div>
</section>
```

---

## ✅ Type Safety

All modules include full TypeScript types:

```typescript
// Analysis Module Types
import type {
	FrontWheelLiftInput,
	FrontWheelLiftAnalysis,
	WheelieClassification,
	DataQualityRating,
	DataQualityAssessment,
	PhaseSplit,
	RunWithSplits,
	PhaseConsistencyResult
} from '$lib/performance-engine';

// Chart Component Types
import type { SpeedPoint, SeriesPoint, HeatmapCell } from '$lib/components/performance-charts';
```

---

## 🧪 Testing

Quick test to verify integration:

```typescript
import {
	analyseFrontWheelLift,
	assessDataQuality,
	analysePhaseConsistency
} from '$lib/performance-engine';

// Test 1: Wheelie detection
console.log(
	analyseFrontWheelLift({
		front_wheel_lifted: true,
		wheelie_duration_ms: 600,
		max_pitch: 15,
		time_to_wheelie_ms: 500
	})
);

// Test 2: Data quality
console.log(assessDataQuality(0.8));

// Test 3: Phase consistency
console.log(
	analysePhaseConsistency([
		{ splits: [{ phase: 'start', time: 100 }] },
		{ splits: [{ phase: 'start', time: 110 }] }
	])
);
```

---

## 📚 Notes

- All functions handle null/undefined inputs gracefully
- Chart components show empty states when no data is provided
- Consistency scores are clamped between 0-100
- All measurements use SI units (m/s², km/h, ms)
- Components are SSR-safe and work with SvelteKit

---

## 🎯 Next Steps

1. **Import where needed** - Add imports to your panel components
2. **Connect to data** - Wire up your session/run data
3. **Customize** - Adjust titles, heights, and styling as needed
4. **Test thoroughly** - Verify with real data from your sessions
5. **Monitor performance** - These are optimized but watch large datasets

For questions or issues, refer to the individual module/component source code with inline documentation.
