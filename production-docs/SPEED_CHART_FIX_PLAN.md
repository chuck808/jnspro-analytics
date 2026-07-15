# Speed Chart Fix Plan

## The Problem

**Charts ARE valuable** - they show:
✅ Explosive G-force at gate drop
✅ G-force declining over time
✅ Speed building throughout
✅ The relationship between acceleration and velocity

**BUT the numbers are wrong:**
❌ Shows 165 km/h peak
❌ Should show 44 km/h peak (firmware measured)

## The Solution

**Scale the predicted curve to match reality!**

### Method

1. Integrate chart_data to get speed SHAPE (curve trajectory)
2. Get actual peak speed from firmware: `gate_runs.peak_speed_ms * 3.6`
3. Scale the entire predicted curve: `scaledSpeed = predictedSpeed * (actualPeak / predictedPeak)`

### Example

```typescript
// Predicted curve shows peak of 165 km/h
// Firmware measured actual peak of 44 km/h
// Scale factor = 44 / 165 = 0.267

scaledSpeeds = predictedSpeeds.map((s) => s * 0.267);
// Now chart shows realistic 44 km/h peak!
```

### Benefits

✅ Preserves the visualization value (shape, relationship)
✅ Shows realistic numbers (44 km/h not 165 km/h)
✅ Uses firmware's accurate measurement
✅ Charts remain useful for analysis

### Labels to Add

- "Speed trajectory (scaled to measured peak)"
- "Estimated acceleration profile"
- Note: "Speed curve adjusted to match sensor-measured peak speed"

## Implementation

Modify `computeSpeedCurve()` to accept `actualPeakSpeedKmh` parameter and apply scaling.
