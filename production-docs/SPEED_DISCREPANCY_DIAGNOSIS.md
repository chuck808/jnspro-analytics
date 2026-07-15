# Speed Discrepancy Diagnosis

**Issue:** Performance Engine shows 165.3 km/h, Original System shows 43.9 km/h

**Ratio:** 165.3 / 43.9 = **3.76** ≈ **3.6** (km/h conversion factor!)

---

## Data Flow Analysis

### Ingest Layer (`src/lib/services/ingest.ts`)

```typescript
// Line 223: chartData conversion
const chartData = run.chartData.map((v) => v / 100); // int16 × 100 → float G-units

// Line 253: Stored to database
chart_data: chartData; // Float G-units
```

**Confirmed:** `chart_data` in database = **G-units** (NOT m/s² or km/h)

### Both Systems Use Identical Formula

**Original System** (`src/lib/utils/analytics.ts`, lines 44-50):

```typescript
chartData.forEach((g, i) => {
	const accelMs2 = g * GRAVITY - biasMs2; // G → m/s²
	velocity += accelMs2 * dt; // Integrate
	speeds.push(velocity * 3.6); // m/s → km/h
});
```

**Performance Engine** (`src/lib/performance-engine/physics.ts`, lines 64-70):

```typescript
chartData.forEach((g, i) => {
	const accelMs2 = g * GRAVITY_MS2 - biasMs2; // G → m/s²
	velocityMs += accelMs2 * dt; // Integrate
	speeds.push(velocityMs * 3.6); // m/s → km/h
});
```

**Both are identical!** So why the difference?

---

## Possible Root Causes

### 1. Double km/h Conversion (MOST LIKELY)

If the Performance Engine speed values are being converted again somewhere:

- Internal: 45.9 m/s → **165 km/h** (45.9 × 3.6)
- Display: Already km/h, but converted again → **165 km/h × 3.6 = 594 km/h** (would be even worse)

OR:

- Internal: 45.9 km/h (already converted)
- Display/Use: Treats as m/s, converts → **45.9 × 3.6 = 165 km/h** ✅

### 2. Different Input Data

- Original System using `chart_data` (G-units) ✅
- Performance Engine using something else?
  - `linear_accel_g`? (would give different values)
  - Pre-converted data?

### 3. Time Step (dt) Mismatch

- Original uses: `dt = (elapsedMs / 1000) / chartData.length`
- Engine uses: `dt = (elapsedMs / 1000) / chartData.length`
- **Should be identical**

### 4. Bias Correction Sign/Magnitude Error

Unlikely to cause 3.76× difference

---

## Diagnostic Steps

### Check #1: What data is Performance Engine receiving?

In `analyseSession.ts` line 103:

```typescript
const curve = computeSpeedCurve(chartData, elapsedMs, gate?.bias_correction_ms2 ?? 0);
```

Where does `chartData` come from?

- Line 77: `const chartData = Array.isArray(run.chart_data) ? run.chart_data : [];`

So it SHOULD be the same G-units data.

### Check #2: Are speed values being used/displayed incorrectly?

Need to check:

1. Where Performance Engine outputs its speed
2. If it's being re-converted somewhere
3. If the original system is applying additional corrections

### Check #3: Sample Rate / Time Calculation

- Firmware: 200 Hz (confirmed in ingest line 234)
- Both systems calculate: `dt = (elapsedMs / 1000) / chartData.length`
- Should be identical: ~0.005s per sample

---

## Most Likely Culprit

**Theory:** Performance Engine's speed curve is in **m/s internally** but being **treated as km/h** somewhere, then **converted again** to km/h for display.

**Evidence:**

- Ratio is exactly 3.6 (within rounding)
- Formulas are identical
- Input data is identical

**Where to look:**

1. How `SessionPerformancePanel` displays speed
2. How `analysis-views/createAnalysisView` formats speed
3. Any `* 3.6` conversions happening AFTER `computeSpeedCurve`

---

## Action Items

1. ✅ Confirm both systems use same input data (G-units from chart_data)
2. ✅ Confirm formulas are identical
3. ⚠️ CHECK: Is Performance Engine speed being converted twice?
4. ⚠️ CHECK: Are there any post-processing steps on speed values?
5. ⚠️ CHECK: How is speed displayed in Performance Engine vs Original?

---

## Quick Test

Add console.log to both systems:

**Original System** (sessions/[id]/+page.svelte, line 51):

```typescript
let curve = $derived(
	computeSpeedCurve(chartData, elapsedMs, selectedGate?.bias_correction_ms2 ?? 0)
);
// Add after:
console.log('Original - Peak m/s:', Math.max(...curve.speeds) / 3.6);
console.log('Original - Peak km/h:', Math.max(...curve.speeds));
```

**Performance Engine** (analyseSession.ts, line 103):

```typescript
const curve = computeSpeedCurve(chartData, elapsedMs, gate?.bias_correction_ms2 ?? 0);
// Add after:
console.log('Engine - Peak m/s:', Math.max(...curve.speeds) / 3.6);
console.log('Engine - Peak km/h:', Math.max(...curve.speeds));
```

If Engine shows:

- Peak m/s: 45.9 → Peak km/h: 165.3
- **Then speeds array is in m/s but labeled as km/h** ❌

If Engine shows:

- Peak m/s: 12.75 → Peak km/h: 45.9
- **Then speed is correct, display is wrong** ✅

---

## Next Steps

The user needs to help identify WHERE the 165 km/h value is coming from in the Performance Engine display. Once we know that, we can trace back to find the double conversion.
