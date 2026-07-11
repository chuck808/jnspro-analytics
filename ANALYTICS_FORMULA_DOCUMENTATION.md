# BMX Analytics Formula Documentation

**Version:** 8.3  
**Last Updated:** April 28, 2026  
**Purpose:** Centralized documentation for all analytics formulas used across the platform

---

## Table of Contents

1. [Speed Analysis](#speed-analysis)
2. [Technique Scoring](#technique-scoring)
3. [Power Estimation](#power-estimation)
4. [Impulse Analysis](#impulse-analysis)
5. [Consistency Scoring](#consistency-scoring)
6. [Jerk Analysis](#jerk-analysis)
7. [Phase Detection](#phase-detection)
8. [Data Quality Assessment](#data-quality-assessment)
9. [Speed Profile Classification](#speed-profile-classification)
10. [Formula Cross-Reference](#formula-cross-reference)

---

## Speed Analysis

### `computeSpeedCurve()`

**Location:** `src/lib/utils/analytics.ts:26-70`  
**Also in Performance Engine:** `src/lib/performance-engine/physics.ts`

**Purpose:** Calculates speed, acceleration, and distance over time from IMU acceleration data.

**Input Parameters:**
- `chartData: number[]` - Acceleration values in G-units (float, gravity-removed)
- `elapsedMs: number` - Total elapsed time in milliseconds
- `biasMs2: number` - Bias correction in m/s² (default: 0)
- `actualPeakSpeedKmh?: number | null` - Firmware-measured peak speed for scaling

**Physical Constants:**
```typescript
const GRAVITY = 9.80665; // m/s² (standard gravity)
const dt = (elapsedMs / 1000) / chartData.length; // seconds per sample
```

**Algorithm:**

1. **Integration from acceleration to velocity:**
   ```typescript
   const accelMs2 = g * GRAVITY - biasMs2;
   velocity += accelMs2 * dt;  // m/s
   ```

2. **Integration from velocity to distance:**
   ```typescript
   distance += velocity * dt;  // meters
   ```

3. **Scaling to match firmware reality:**
   ```typescript
   const predictedPeak = Math.max(...speeds);
   const scaleFactor = actualPeakSpeedKmh / predictedPeak;
   scaledSpeeds = speeds.map(s => s * scaleFactor);
   ```

**Output:**
```typescript
interface SpeedCurve {
    times:      number[]; // seconds
    speeds:     number[]; // km/h
    accels:     number[]; // G-units (original)
    distances:  number[]; // metres (cumulative)
}
```

**Key Corrections from Legacy:**
- ✅ Sample rate: **200Hz** (was wrongly 9.3Hz in old app)
- ✅ Gravity constant: **9.80665** (was 0.00981 in old app)
- ✅ Bias correction applied correctly (subtracted from acceleration)

**Validation:**
- Empty data returns empty arrays
- Requires minimum 2 samples
- Scaling only applied if `actualPeakSpeedKmh > 0`

---

## Technique Scoring

### `scoreTechnique()`

**Location:** `src/lib/utils/analytics.ts:141-221`  
**Also in Performance Engine:** `src/lib/performance-engine/technique.ts`

**Purpose:** Provides a 0-100 composite score for gate start technique based on 4 components.

**Input Parameters:**
- `reactionMs: number` - Reaction time in milliseconds
- `chartData: number[]` - Acceleration trace
- `curve: SpeedCurve` - Pre-computed speed curve
- `riderLevel: string | null` - Rider skill level for benchmarking

**Component Breakdown:**

#### 1. Reaction Score (30% weight)
```typescript
function scoreReaction(reactionMs: number, riderLevel: string): number {
    const thresholds = {
        elite: { excellent: 250, good: 300, fair: 350 },
        club:  { excellent: 280, good: 330, fair: 380 },
        grom:  { excellent: 320, good: 370, fair: 420 }
    };
    
    if (reactionMs <= excellent) return 100;
    if (reactionMs <= good) return 85;
    if (reactionMs <= fair) return 70;
    return Math.max(0, 70 - ((reactionMs - fair) / 10) * 5);
}
```

**Rationale:** Elite riders should react sub-250ms, club riders sub-280ms, groms sub-320ms.

#### 2. Explosiveness Score (25% weight)
```typescript
function scoreExplosiveness(chartData: number[], elapsedMs: number): number {
    const first500ms = Math.floor((0.5 / (elapsedMs / 1000)) * chartData.length);
    const avgFirst500 = mean(chartData.slice(0, first500ms));
    const peakAccel = Math.max(...chartData);
    
    const ratio = avgFirst500 / peakAccel;
    
    if (ratio >= 0.75) return 100;
    if (ratio >= 0.65) return 85;
    if (ratio >= 0.55) return 70;
    return Math.max(0, 70 - ((0.55 - ratio) / 0.1) * 15);
}
```

**Rationale:** High average acceleration in first 500ms relative to peak indicates explosive power delivery.

#### 3. Smoothness Score (25% weight)
```typescript
function scoreSmoothness(chartData: number[], elapsedMs: number): number {
    const dt = (elapsedMs / 1000) / chartData.length;
    const jerk = chartData.map((a, i) => 
        i > 0 ? Math.abs((a - chartData[i-1]) * GRAVITY / dt) : 0
    );
    const meanJerk = mean(jerk);
    const peakAccel = Math.max(...chartData) * GRAVITY;
    
    const smoothnessRatio = 1 - (meanJerk / peakAccel);
    
    return Math.max(0, Math.min(100, smoothnessRatio * 100));
}
```

**Rationale:** Lower mean jerk (rate of change of acceleration) indicates smoother force application.

#### 4. Efficiency Score (20% weight)
```typescript
function scoreEfficiency(curve: SpeedCurve): number {
    const peakSpeed = Math.max(...curve.speeds);
    const timeToHalfPeak = curve.times.findIndex(t => 
        curve.speeds[t] >= peakSpeed * 0.5
    );
    
    const efficiency = peakSpeed / (timeToHalfPeak * dt);
    
    // Higher speed gained per unit time = more efficient
    if (efficiency >= 40) return 100;
    if (efficiency >= 30) return 85;
    return Math.max(0, (efficiency / 30) * 85);
}
```

**Rationale:** Efficient riders convert acceleration into speed quickly.

**Overall Composite Score:**
```typescript
const overall = (
    reaction * 0.30 +
    explosiveness * 0.25 +
    smoothness * 0.25 +
    efficiency * 0.20
);
```

**Output:**
```typescript
interface TechniqueScores {
    overall: number;       // 0-100
    reaction: number;      // 0-100
    explosiveness: number; // 0-100
    smoothness: number;    // 0-100
    efficiency: number;    // 0-100
}
```

**Rider-Level Benchmarks:**
| Level | Excellent | Good | Fair | Poor |
|-------|-----------|------|------|------|
| Elite | 85-100 | 70-84 | 55-69 | <55 |
| Club  | 75-100 | 60-74 | 45-59 | <45 |
| Grom  | 65-100 | 50-64 | 35-49 | <35 |

---

## Power Estimation

### `estimatePower()`

**Location:** `src/lib/utils/analytics.ts:268-301`  
**Also in Performance Engine:** `src/lib/performance-engine/physics.ts`

**Purpose:** Estimates peak and average power output during gate start.

**Physics Formula:**
```
P = F × v
where:
  F = m × a  (Force = mass × acceleration)
  v = velocity (m/s)
  
Therefore:
  P = m × a × v  (Watts)
```

**Input Parameters:**
- `chartData: number[]` - Acceleration in G-units
- `curve: SpeedCurve` - Speed curve
- `totalMassKg: number` - Rider + bike mass in kilograms

**Algorithm:**

1. **Calculate instantaneous power at each sample:**
   ```typescript
   for (let i = 0; i < chartData.length; i++) {
       const accelMs2 = chartData[i] * GRAVITY;
       const velocityMs = curve.speeds[i] / 3.6; // km/h → m/s
       const force = totalMassKg * accelMs2;
       const power = force * velocityMs;
       powerSeries.push({ timeS: curve.times[i], value: power });
   }
   ```

2. **Find peak power:**
   ```typescript
   const peakW = Math.max(...powerSeries.map(p => p.value));
   ```

3. **Calculate average power (first 2 seconds):**
   ```typescript
   const first2s = powerSeries.filter(p => p.timeS <= 2.0);
   const averageW = mean(first2s.map(p => p.value));
   ```

**Output:**
```typescript
interface PowerMetrics {
    peakW: number;      // Peak power in watts
    averageW: number;   // Average power over first 2s
    estimated: true;    // Flag indicating estimation
}
```

**Typical Values:**
- Elite riders: 800-1200W peak, 500-700W average
- Club riders: 600-900W peak, 400-550W average
- Groms: 400-700W peak, 250-400W average

**Important Notes:**
- ⚠️ This is an **estimate** based on IMU data, not a direct power meter measurement
- Requires accurate rider + bike mass
- Assumes horizontal motion (no grade correction)
- Ignores air resistance and rolling resistance (negligible at gate start speeds)

---

## Impulse Analysis

### `analyseImpulse()`

**Location:** `src/lib/utils/analytics.ts:303-361`  
**Also in Performance Engine:** `src/lib/performance-engine/physics.ts`

**Purpose:** Analyzes force impulse delivery characteristics.

**Physics Formula:**
```
Impulse = ∫ F dt = m × Δv
where:
  F = force (Newtons)
  t = time (seconds)
  m = mass (kg)
  Δv = change in velocity (m/s)
```

**Input Parameters:**
- `chartData: number[]` - Acceleration in G-units
- `elapsedMs: number` - Total elapsed time
- `totalMassKg: number` - Rider + bike mass

**Algorithm:**

1. **Calculate impulse at each sample:**
   ```typescript
   const dt = (elapsedMs / 1000) / chartData.length;
   let cumulativeImpulse = 0;
   
   for (let i = 0; i < chartData.length; i++) {
       const force = totalMassKg * chartData[i] * GRAVITY;
       const impulse = force * dt;
       cumulativeImpulse += impulse;
       impulseSeries.push({ timeS: i * dt, value: cumulativeImpulse });
   }
   ```

2. **Total impulse:**
   ```typescript
   const totalImpulseNs = cumulativeImpulse;
   ```

3. **Time to 50% impulse (front-loading metric):**
   ```typescript
   const halfImpulse = totalImpulseNs * 0.5;
   const timeToHalfIdx = impulseSeries.findIndex(p => p.value >= halfImpulse);
   const timeToHalfImpulseS = impulseSeries[timeToHalfIdx].timeS;
   ```

4. **Impulse efficiency:**
   ```typescript
   const impulseEfficiency = totalImpulseNs / (elapsedMs / 1000); // N·s per second
   ```

5. **Front-loaded score:**
   ```typescript
   // Ideal is <0.5s to reach 50% impulse
   const frontLoadedScore = Math.max(0, Math.min(100, 
       100 - ((timeToHalfImpulseS - 0.5) / 0.5) * 50
   ));
   ```

**Output:**
```typescript
interface ImpulseResult {
    totalImpulseNs: number;          // Total impulse (N·s)
    timeToHalfImpulseS: number;      // Time to 50% impulse (s)
    timeToNinetyPctImpulseS: number; // Time to 90% impulse (s)
    frontLoadedScore: number;        // 0-100, higher = better front-loading
    impulseEfficiency: number;       // N·s/s
    distribution: { timeS: number; percentOfTotal: number }[];
}
```

**Interpretation:**
- **Front-loaded** (timeToHalfImpulse < 0.5s): Explosive, powerful gate snap
- **Gradual** (timeToHalfImpulse > 0.8s): Slower power buildup, possibly late peak

---

## Consistency Scoring

### `scoreConsistency()`

**Location:** `src/lib/utils/analytics.ts:223-246`  
**Also in Performance Engine:** `src/lib/performance-engine/technique.ts`

**Purpose:** Scores session-wide consistency of reaction times using coefficient of variation.

**Statistical Formula:**
```
CV% = (σ / μ) × 100
where:
  σ = standard deviation
  μ = mean
```

**Input Parameters:**
- `values: number[]` - Array of reaction times (ms)

**Algorithm:**

1. **Calculate mean:**
   ```typescript
   const mean = values.reduce((a, b) => a + b, 0) / values.length;
   ```

2. **Calculate standard deviation:**
   ```typescript
   const variance = values.reduce((sum, val) => 
       sum + Math.pow(val - mean, 2), 0
   ) / values.length;
   const stdDev = Math.sqrt(variance);
   ```

3. **Calculate CV%:**
   ```typescript
   const cvPercent = (stdDev / mean) * 100;
   ```

4. **Convert to 0-100 score:**
   ```typescript
   let score: number;
   if (cvPercent <= 5)  score = 100;
   else if (cvPercent <= 8)  score = 85;
   else if (cvPercent <= 12) score = 70;
   else if (cvPercent <= 18) score = 55;
   else score = Math.max(0, 55 - ((cvPercent - 18) * 2));
   ```

**Output:**
```typescript
interface ConsistencyResult {
    score: number;        // 0-100
    label: string;        // "Excellent" | "Good" | "Fair" | "Poor"
    cvPercent: number;    // Raw CV%
    mean: number;         // Mean reaction time
    stdDev: number;       // Standard deviation
}
```

**Benchmarks:**
| CV% | Score | Label | Interpretation |
|-----|-------|-------|----------------|
| ≤5% | 100 | Excellent | Elite-level repeatability |
| 5-8% | 85 | Good | Solid consistency |
| 8-12% | 70 | Fair | Room for improvement |
| 12-18% | 55 | Poor | Inconsistent starts |
| >18% | 0-55 | Very Poor | Highly variable |

---

## Jerk Analysis

### `computeJerk()`

**Location:** `src/lib/utils/analyticsExtended.ts:54-103`  
**Also in Performance Engine:** `src/lib/performance-engine/physics.ts`

**Purpose:** Analyzes the rate of change of acceleration (jerk) to assess smoothness.

**Physics Definition:**
```
Jerk (j) = da/dt = d³x/dt³
where:
  a = acceleration (m/s²)
  x = position (m)
  t = time (s)
  
Units: m/s³
```

**Input Parameters:**
- `chartData: number[]` - Acceleration in G-units
- `elapsedMs: number` - Total elapsed time

**Algorithm:**

1. **Smooth acceleration data (5-point moving average):**
   ```typescript
   const smooth = (data: number[], w = 5) =>
       data.map((_, i) => {
           const start = Math.max(0, i - Math.floor(w / 2));
           const end = Math.min(data.length, i + Math.floor(w / 2) + 1);
           return data.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
       });
   ```

2. **Convert to m/s² and compute jerk:**
   ```typescript
   const dt = (elapsedMs / 1000) / chartData.length;
   const accelMs2 = smooth(chartData.map(g => g * GRAVITY));
   
   for (let i = 1; i < accelMs2.length; i++) {
       const da = accelMs2[i] - accelMs2[i - 1];
       const jerk = da / dt;  // m/s³
       data.push({ timeS: i * dt, jerk });
   }
   ```

3. **Calculate statistics:**
   ```typescript
   const peakPositive = Math.max(...jerks);
   const peakNegative = Math.min(...jerks);
   const meanAbsolute = mean(jerks.map(Math.abs));
   ```

4. **Smoothness score (0-100):**
   ```typescript
   const peakAccel = Math.max(...accelMs2);
   const smoothnessScore = Math.max(0, Math.min(100,
       100 - (meanAbsolute / (peakAccel * 0.5 || 1)) * 100
   ));
   ```

**Output:**
```typescript
interface JerkProfile {
    data:                JerkPoint[];       // Time series
    peakPositive:        number;            // Max jerk (m/s³)
    peakNegative:        number;            // Min jerk (m/s³)
    meanAbsolute:        number;            // Mean |jerk|
    smoothnessScore:     number;            // 0-100
    initialJerkPositive: boolean;           // Explosive vs gradual
    insight:             string;            // Text interpretation
}
```

**Interpretation:**
- **High smoothness score (>80):** Progressive, controlled force application
- **Low smoothness score (<60):** Jerky, uneven force delivery
- **Positive initial jerk:** Explosive start (rapid force increase)
- **Negative initial jerk:** Gradual start (slower force buildup)

---

## Phase Detection

### `computeDetailedPhases()`

**Location:** `src/lib/utils/analyticsExtended.ts:128-225`

**Purpose:** Divides gate start into 3 distinct phases with metrics for each.

**Phase Definitions:**

1. **Drive Phase:** Gate snap to 30% of peak acceleration
2. **Transition Phase:** 30% peak to 70% of peak speed
3. **Velocity Phase:** 70% peak speed to end

**Algorithm:**

1. **Smooth acceleration data:**
   ```typescript
   const accelMs2 = smooth(chartData.map(g => g * GRAVITY), 5);
   const peakAccel = Math.max(...accelMs2);
   const peakIdx = accelMs2.indexOf(peakAccel);
   ```

2. **Find drive phase end (30% of peak):**
   ```typescript
   let driveEnd = peakIdx;
   for (let i = peakIdx; i < accelMs2.length; i++) {
       if (accelMs2[i] < peakAccel * 0.3) {
           driveEnd = i;
           break;
       }
   }
   const driveDurationS = driveEnd * dt;
   ```

3. **Calculate drive phase metrics:**
   ```typescript
   const drivePhase = {
       durationS: driveDurationS,
       peakAccelMs2: peakAccel,
       timeToPeakS: peakIdx * dt,
       efficiency: Math.min(100, (peakAccel / driveDurationS) * 5)
   };
   ```

4. **Find transition phase end (70% of peak speed):**
   ```typescript
   const peakSpeed = Math.max(...speeds);
   let transitionEnd = speeds.findIndex(s => s >= peakSpeed * 0.7);
   const transitionDurationS = (transitionEnd - driveEnd) * dt;
   ```

5. **Calculate transition metrics:**
   ```typescript
   const transitionPhase = {
       durationS: transitionDurationS,
       velocityAtEndMs: speeds[transitionEnd] / 3.6,
       transitionEfficiency: Math.min(100, 
           (speeds[transitionEnd] / transitionDurationS) * 2
       )
   };
   ```

6. **Velocity phase:**
   ```typescript
   const velocityPhase = {
       durationS: (chartData.length - transitionEnd) * dt,
       peakVelocityMs: peakSpeed / 3.6,
       timeToMaxS: speeds.indexOf(peakSpeed) * dt,
       maintenanceScore: calculateMaintenance(speeds, transitionEnd)
   };
   ```

**Output:**
```typescript
interface PhaseMetrics {
    drivePhase: {
        durationS: number;
        peakAccelMs2: number;
        timeToPeakS: number;
        efficiency: number;        // 0-100
    };
    transitionPhase: {
        durationS: number;
        velocityAtEndMs: number;
        transitionEfficiency: number; // 0-100
    };
    velocityPhase: {
        durationS: number;
        peakVelocityMs: number;
        timeToMaxS: number;
        maintenanceScore: number;  // 0-100
    };
    technicalAssessment: string;
}
```

**Typical Phase Durations:**
- **Drive:** 0.4-0.8s (elite), 0.6-1.0s (club)
- **Transition:** 0.6-1.0s (elite), 0.8-1.4s (club)
- **Velocity:** 0.8-1.5s (elite), 1.0-2.0s (club)

---

## Data Quality Assessment

### `assessDataQuality()`

**Location:** `src/lib/utils/analytics.ts:109-122`

**Purpose:** Assesses IMU data quality based on bias correction magnitude.

**Input Parameters:**
- `biasMs2: number | null` - Bias correction in m/s²

**Quality Thresholds:**

```typescript
function assessDataQuality(biasMs2: number | null): DataQuality {
    if (biasMs2 === null) {
        return { 
            badge: 'Unknown', 
            color: 'gray',
            description: 'Speed data unavailable' 
        };
    }
    
    const absBias = Math.abs(biasMs2);
    
    if (absBias < 0.5) {
        return { 
            badge: 'Excellent', 
            color: 'green',
            description: 'High-quality IMU calibration' 
        };
    } else if (absBias < 1.5) {
        return { 
            badge: 'Good', 
            color: 'blue',
            description: 'Acceptable IMU calibration' 
        };
    } else if (absBias < 3.0) {
        return { 
            badge: 'Fair', 
            color: 'amber',
            description: 'IMU may need recalibration' 
        };
    } else {
        return { 
            badge: 'Poor', 
            color: 'red',
            description: 'IMU requires recalibration' 
        };
    }
}
```

**Output:**
```typescript
interface DataQuality {
    badge: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Unknown';
    color: 'green' | 'blue' | 'amber' | 'red' | 'gray';
    description: string;
}
```

**Interpretation:**
- **Excellent (<0.5 m/s²):** IMU is well-calibrated, speed estimates highly accurate
- **Good (0.5-1.5 m/s²):** Minor calibration drift, speed estimates reliable
- **Fair (1.5-3.0 m/s²):** Noticeable drift, speed estimates approximate
- **Poor (>3.0 m/s²):** Significant drift, speed estimates unreliable

---

## Speed Profile Classification

### `classifySpeedProfile()`

**Location:** `src/lib/utils/analytics.ts:124-139`

**Purpose:** Classifies acceleration profile as Early/Mid/Late peak.

**Input Parameters:**
- `timeToPeakMs: number | null` - Time to reach peak speed
- `elapsedMs: number` - Total elapsed time

**Algorithm:**

```typescript
function classifySpeedProfile(timeToPeakMs: number | null, elapsedMs: number): string {
    if (timeToPeakMs === null) return 'Unknown';
    
    const peakRatio = timeToPeakMs / elapsedMs;
    
    if (peakRatio < 0.6) {
        return 'Early Peak';
    } else if (peakRatio < 0.8) {
        return 'Mid Peak';
    } else {
        return 'Late Peak';
    }
}
```

**Output:** String literal

**Classification:**
| Ratio | Label | Interpretation |
|-------|-------|----------------|
| <60% | Early Peak | Explosive start, early acceleration dominance |
| 60-80% | Mid Peak | Balanced acceleration profile |
| >80% | Late Peak | Gradual buildup, late peak power |

**Coaching Implications:**
- **Early Peak:** Good gate snap, may need to work on maintaining velocity
- **Mid Peak:** Balanced profile, typical for most riders
- **Late Peak:** Slow out of gate, or excellent velocity maintenance

---

## Formula Cross-Reference

### Formula Usage Matrix

| Formula | Analytics.ts | AnalyticsExtended.ts | Performance Engine | Session Page |
|---------|-------------|---------------------|-------------------|--------------|
| `computeSpeedCurve` | ✅ Line 26 | Re-export | ✅ physics.ts | ✅ Used |
| `calculateSpeedSplits` | ✅ Line 81 | Re-export | ❌ | ✅ Used |
| `assessDataQuality` | ✅ Line 109 | Re-export | ✅ dataQuality.ts | ✅ Used |
| `classifySpeedProfile` | ✅ Line 124 | Re-export | ❌ | ✅ Used |
| `scoreTechnique` | ✅ Line 141 | Re-export | ✅ technique.ts | ✅ Used |
| `estimatePower` | ✅ Line 268 | Re-export | ✅ physics.ts | ✅ Used |
| `scoreConsistency` | ✅ Line 223 | Re-export | ✅ technique.ts | ✅ Used |
| `analyseImpulse` | ✅ Line 303 | Re-export | ✅ physics.ts | ✅ Used |
| `computeJerk` | ❌ | ✅ Line 54 | ✅ physics.ts | ✅ Used |
| `computeDetailedPhases` | ❌ | ✅ Line 128 | ❌ | ✅ Used |
| `identifyWeaknesses` | ❌ | ✅ Line 246 | ✅ recommendations.ts | ✅ Used |
| `generateRecommendations` | ❌ | ✅ Line 312 | ✅ recommendations.ts | ✅ Used |

### Migration Status

**Performance Engine Has:**
- ✅ Speed curve computation
- ✅ Technique scoring
- ✅ Power estimation
- ✅ Impulse analysis
- ✅ Jerk analysis
- ✅ Consistency scoring
- ✅ Weaknesses identification
- ✅ Recommendations generation

**Performance Engine Needs:**
- ❌ Speed splits calculation (scheduled for migration)
- ❌ Speed profile classification (scheduled for migration)
- ❌ Detailed 3-phase analysis (scheduled for migration)

---

## Validation & Testing

### Unit Test Coverage

All formulas have comprehensive unit tests in:
- `src/lib/utils/__tests__/analytics.test.ts`
- `src/lib/utils/__tests__/analyticsExtended.test.ts`
- `src/lib/performance-engine/__tests__/`

### Known Limitations

1. **Power Estimation:**
   - Does NOT account for air resistance
   - Does NOT account for rolling resistance
   - Assumes horizontal track (no grade compensation)
   - Estimates only, not direct measurement

2. **Speed Curve:**
   - Dependent on IMU calibration quality
   - Scaling relies on firmware peak speed accuracy
   - Integration drift over long durations

3. **Jerk Analysis:**
   - Requires smoothing (5-point MA) which can mask rapid changes
   - Sensitive to sample rate consistency

4. **Phase Detection:**
   - Threshold-based (30% and 70%) may not suit all riders
   - Fixed thresholds don't adapt to rider style

---

## Version History

### v8.3 (April 28, 2026)
- ✅ Integrated Performance Engine with legacy systems
- ✅ Unified recommendations across all systems
- ✅ Created centralized formula documentation

### v8.2 (Previous)
- Performance Engine launched
- Dual-system architecture (PE + legacy)

### v8.1 (Previous)
- Added jerk analysis
- Added detailed phase detection

### v8.0 (Previous)
- Core analytics functions established
- Technique scoring framework created

---

## References

1. **Physics Fundamentals:**
   - Newtonian mechanics: F = ma
   - Kinematic equations: v = u + at, s = ut + ½at²
   - Power: P = Fv
   - Impulse: J = ∫F dt

2. **Statistical Methods:**
   - Coefficient of Variation: CV = σ/μ
   - Standard deviation: σ = √(Σ(x-μ)²/n)

3. **BMX-Specific:**
   - Rider level benchmarks (Elite/Club/Grom)
   - Phase timing thresholds
   - Technique component weightings

---

**End of Documentation**
