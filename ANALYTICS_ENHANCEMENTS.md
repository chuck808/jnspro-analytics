# Analytics Page Enhancements - Performance Engine Integration

## Overview

Five new analytics components that leverage Performance Engine data to show trends across multiple sessions. These provide insights into long-term development that aren't visible in single-session analysis.

---

## 🎯 1. Technique Quality Trend

**Component:** `TechniqueQualityTrend.svelte`

### What It Shows

- Overall technique score evolution across sessions
- Individual component trends (smoothness, explosiveness, reaction, efficiency)
- Direction of improvement/decline with point change

### Value to User

- **Objective measure** of whether practice is refining technique
- Shows if rider is getting better at **execution**, not just raw speed
- Identifies technique degradation before it impacts performance

### Data Required

```typescript
interface TechniqueDataPoint {
	sessionDate: string;
	sessionNumber: number;
	overall: number | null;
	reaction: number | null;
	explosiveness: number | null;
	smoothness: number | null;
	efficiency: number | null;
}
```

### Usage Example

```svelte
<TechniqueQualityTrend data={techniqueData} isMobile={false} />
```

### Data Source

From Performance Engine: `performanceAnalysis.selectedRun.technique`

- Aggregate best technique scores per session
- Track across time

---

## 🔧 2. Data Quality Trend

**Component:** `DataQualityTrend.svelte`

### What It Shows

- Sensor calibration quality distribution (excellent/good/fair/calibrate)
- Average bias correction trending over time
- Warning when >20% of sessions need calibration

### Value to User

- **Early hardware warning** before sensor degradation corrupts data
- Validates that setup/mounting is consistent
- Identifies when recalibration is needed

### Data Required

```typescript
interface DataQualityPoint {
	sessionDate: string;
	sessionNumber: number;
	biasCorrection: number | null;
	qualityRating: 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown';
	analyticsValid: boolean;
}
```

### Usage Example

```svelte
<DataQualityTrend data={qualityData} isMobile={false} />
```

### Data Source

From Performance Engine: `performanceAnalysis.selectedRun.physics.dataQuality`

- Track bias corrections across sessions
- Monitor calibration stability

---

## 💪 3. Power Output Trend

**Component:** `PowerOutputTrend.svelte`

### What It Shows

- Peak power (watts) trending over time
- Average power development
- Power-to-weight ratio if body weight tracked
- % change in power output

### Value to User

- Shows **strength development** independent of bike/gate setup
- Tracks effectiveness of gym/strength training
- Power-to-weight helps riders manage body composition

### Data Required

```typescript
interface PowerDataPoint {
	sessionDate: string;
	sessionNumber: number;
	peakPowerW: number | null;
	avgPowerW: number | null;
	riderWeightKg: number | null;
}
```

### Usage Example

```svelte
<PowerOutputTrend data={powerData} isMobile={false} />
```

### Data Source

From Performance Engine: `performanceAnalysis.selectedRun.physics.power`

- Requires rider weight + bike weight for calculation
- Estimated from mass × acceleration

---

## 🌊 4. Smoothness/Jerk Trend

**Component:** `SmoothnessTrend.svelte`

### What It Shows

- Force application smoothness score (0-100) trending
- Whether rider is getting smoother or rougher
- Educational context (what smoothness means, why it matters)

### Value to User

- **Objective measure** of technique refinement
- Shows efficiency gains (smooth = less wasted energy)
- Identifies abrupt force application patterns

### Data Required

```typescript
interface SmoothnessDataPoint {
	sessionDate: string;
	sessionNumber: number;
	smoothnessScore: number | null;
	meanJerk: number | null;
}
```

### Usage Example

```svelte
<SmoothnessTrend data={smoothnessData} isMobile={false} />
```

### Data Source

From Performance Engine: `performanceAnalysis.selectedRun.physics.jerk.smoothnessScore`

---

## 🚀 5. Wheelie Pattern Analysis

**Component:** `WheeliePatternAnalysis.svelte`

### What It Shows

- % of runs with front wheel lift across sessions
- Correlation between wheelies and reaction time performance
- Whether wheelies make rider faster/slower/neutral
- Recent trend (more/fewer wheelies)

### Value to User

- **Data-driven decision** on whether wheelie technique helps **this specific rider**
- Removes guesswork - shows actual performance impact
- Tracks if rider is becoming more/less aggressive

### Data Required

```typescript
interface WheelieDataPoint {
	sessionDate: string;
	sessionNumber: number;
	wheelieRate: number; // % of runs with front wheel lift
	avgReactionMs: number | null;
	avgReactionWithWheelieMs: number | null;
	avgReactionWithoutWheelieMs: number | null;
}
```

### Usage Example

```svelte
<WheeliePatternAnalysis data={wheelieData} isMobile={false} />
```

### Data Source

From database: `gate_runs.front_wheel_lifted`

- Calculate wheelie rate per session
- Compare reaction times with/without wheelies

---

## Integration Guide

### Step 1: Prepare Data from Performance Engine

For each session in the analytics page dataset:

```typescript
import { analyseSession } from '$lib/performance-engine';

// For each session
const sessionAnalysis = analyseSession(session, riderContext, { selectedRunIndex: 0 });

// Extract technique data
const techniquePoint = {
	sessionDate: formatDate(session.timestamp),
	sessionNumber: i + 1,
	overall: sessionAnalysis.selectedRun?.technique?.overall ?? null,
	reaction: sessionAnalysis.selectedRun?.technique?.reaction ?? null,
	explosiveness: sessionAnalysis.selectedRun?.technique?.explosiveness ?? null,
	smoothness: sessionAnalysis.selectedRun?.technique?.smoothness ?? null,
	efficiency: sessionAnalysis.selectedRun?.technique?.efficiency ?? null
};

// Extract power data
const powerPoint = {
	sessionDate: formatDate(session.timestamp),
	sessionNumber: i + 1,
	peakPowerW: sessionAnalysis.selectedRun?.physics?.power?.peakW ?? null,
	avgPowerW: sessionAnalysis.selectedRun?.physics?.power?.averageW ?? null,
	riderWeightKg: riderContext.riderWeightKg ?? null
};

// Extract smoothness data
const smoothnessPoint = {
	sessionDate: formatDate(session.timestamp),
	sessionNumber: i + 1,
	smoothnessScore: sessionAnalysis.selectedRun?.physics?.jerk?.smoothnessScore ?? null,
	meanJerk: sessionAnalysis.selectedRun?.physics?.jerk?.meanAbsolute ?? null
};

// Extract data quality
const qualityPoint = {
	sessionDate: formatDate(session.timestamp),
	sessionNumber: i + 1,
	biasCorrection: session.runs[0]?.gate_runs?.bias_correction_ms2 ?? null,
	qualityRating: sessionAnalysis.selectedRun?.physics?.dataQuality?.badge ?? 'unknown',
	analyticsValid: sessionAnalysis.selectedRun?.analyticsValid ?? false
};

// Calculate wheelie data
const runsWithWheelies = session.runs.filter((r) => r.gate_runs?.front_wheel_lifted);
const runsWithoutWheelies = session.runs.filter((r) => !r.gate_runs?.front_wheel_lifted);

const wheeliePoint = {
	sessionDate: formatDate(session.timestamp),
	sessionNumber: i + 1,
	wheelieRate: (runsWithWheelies.length / session.runs.length) * 100,
	avgReactionMs: calculateAvg(session.runs.map((r) => r.gate_runs?.reaction_time_ms)),
	avgReactionWithWheelieMs: calculateAvg(
		runsWithWheelies.map((r) => r.gate_runs?.reaction_time_ms)
	),
	avgReactionWithoutWheelieMs: calculateAvg(
		runsWithoutWheelies.map((r) => r.gate_runs?.reaction_time_ms)
	)
};
```

### Step 2: Add Components to Analytics Page

```svelte
<script>
	import {
		TechniqueQualityTrend,
		DataQualityTrend,
		PowerOutputTrend,
		SmoothnessTrend,
		WheeliePatternAnalysis
	} from '$lib/components/analytics';

	// ... prepare data arrays ...
</script>

<!-- In your analytics page layout -->
<div class="space-y-5">
	<!-- Existing content -->

	<!-- New Performance Engine Analytics -->
	<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
		<TechniqueQualityTrend data={techniqueData} {isMobile} />
		<PowerOutputTrend data={powerData} {isMobile} />
	</div>

	<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
		<SmoothnessTrend data={smoothnessData} {isMobile} />
		<DataQualityTrend data={qualityData} {isMobile} />
	</div>

	<WheeliePatternAnalysis data={wheelieData} {isMobile} />
</div>
```

---

## Benefits Summary

| Component             | Primary Value                       | Secondary Value                      |
| --------------------- | ----------------------------------- | ------------------------------------ |
| **Technique Quality** | Track skill development objectively | Identify technique degradation early |
| **Data Quality**      | Hardware health monitoring          | Validate setup consistency           |
| **Power Output**      | Strength/fitness trending           | Power-to-weight tracking             |
| **Smoothness**        | Technique refinement measure        | Efficiency improvement tracking      |
| **Wheelie Analysis**  | Data-driven technique decision      | Performance impact validation        |

---

## Performance Considerations

- All components use `$derived` for reactive calculations
- Chart rendering is lazy (only when component mounts)
- Data aggregation should happen in `+page.server.ts` for SSR
- Minimum 2-3 sessions recommended for meaningful trends

---

## Future Enhancements

1. **Export trend data** as CSV for external analysis
2. **Configurable date ranges** (last 10 sessions, last 30 days, etc.)
3. **Comparison mode** to overlay multiple metrics
4. **Anomaly detection** to highlight unusual sessions
5. **Predictive insights** using trend lines

---

## Questions?

These components are ready to use but require data preparation from the Performance Engine. The single source of truth architecture ensures all analytics derive from the same calculations used in session analysis.
