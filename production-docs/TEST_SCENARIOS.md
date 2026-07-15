# Test Scenarios for Coaching System Validation

## 🎯 Purpose

This document defines realistic test scenarios for validating the coaching system behavior. Each scenario represents a real-world rider pattern with expected system outputs.

Use these to:

1. Validate coaching logic
2. Regression testing after changes
3. Demonstrate system capabilities
4. Train new developers on expected behaviors

---

## 📊 Scenario 1: Clean Improving Rider

### Input Characteristics

```json
{
	"runs": 8,
	"pattern": "progressive_improvement",
	"speed_trend": "increasing",
	"consistency": "high",
	"wheelie_pattern": "controlled",
	"data_quality": "excellent"
}
```

### Detailed Run Data

- Run 1: 42.3 km/h, wheelie 450ms @ 14°, controlled
- Run 2: 42.8 km/h, wheelie 420ms @ 13°, controlled
- Run 3: 43.1 km/h, wheelie 440ms @ 14°, controlled
- Run 4: 43.5 km/h, wheelie 430ms @ 13°, controlled
- Run 5: 43.8 km/h, wheelie 425ms @ 14°, controlled
- Run 6: 44.0 km/h, wheelie 435ms @ 13°, controlled
- Run 7: 44.2 km/h, wheelie 428ms @ 14°, controlled
- Run 8: 44.5 km/h, wheelie 432ms @ 13°, controlled

- Bias: 0.3 m/s²
- Phase consistency: 85-90% across all phases

### Expected Outputs

**Session Intelligence (v7.2)**

- Session Quality: 88-92/100
- Repeatability Score: 82-88/100
- Optimal Set Length: 8 runs
- Drop-off: None detected
- Fatigue Trend: Stable or Improving
- Best vs Average Gap: Small (< 5%)

**Technique Analysis**

- Data Quality: ✅ **Excellent** (0.3 m/s²)
- Wheelie Pattern: ✅ **Controlled** (8/8 detected)
- Phase Consistency: ✅ **88%** (highly repeatable)
- Confidence: ✅ **High** (Based on 8 runs)

**Coaching Message**

```
Impact: Consistent launch control observed

Why this matters: Consistent technique provides a stable foundation
for further improvements and better competition results

💡 Current technique appears effective

👁️ Watch for: maintaining this consistency while increasing overall speed
```

**Key Indicators**

- ✅ Positive messaging
- ✅ Reinforce what's working
- ✅ Encourage progression while maintaining consistency

---

## 📊 Scenario 2: Peak Chaser

### Input Characteristics

```json
{
	"runs": 10,
	"pattern": "high_variance",
	"speed_trend": "volatile",
	"consistency": "low",
	"wheelie_pattern": "mixed",
	"data_quality": "good"
}
```

### Detailed Run Data

- Run 1: 40.2 km/h, wheelie 650ms @ 16°, controlled
- Run 2: 43.8 km/h, wheelie 380ms @ 19° **← Peak run**, excessive
- Run 3: 41.1 km/h, wheelie 720ms, late-lift
- Run 4: 40.5 km/h, wheelie 690ms, late-lift
- Run 5: 42.9 km/h, wheelie 420ms @ 20°, excessive
- Run 6: 40.8 km/h, wheelie 680ms, late-lift
- Run 7: 41.4 km/h, wheelie 650ms, late-lift
- Run 8: 42.1 km/h, wheelie 550ms @ 17°, controlled
- Run 9: 40.6 km/h, wheelie 710ms, late-lift
- Run 10: 41.2 km/h, wheelie 640ms, late-lift

- Bias: 0.7 m/s²
- Phase consistency: 58-65% (high variance)
- Speed variance: 8.2% (high)

### Expected Outputs

**Session Intelligence (v7.2)**

- Session Quality: 62-68/100
- Repeatability Score: 54-60/100
- Optimal Set Length: 6-7 runs
- Best vs Average Gap: Large (7-9%)
- Fatigue Trend: Variable

**Technique Analysis**

- Data Quality: ✅ **Good** (0.7 m/s²)
- Wheelie Pattern: ⚠️ **Mixed** (6/10 late-lift, 2/10 excessive)
- Phase Consistency: ⚠️ **62%** (inconsistent execution)
- Confidence: ✅ **High** (Based on 10 runs)

**Coaching Message**

```
Impact: Variable wheelie control may be affecting repeatability

Why this matters: Inconsistent technique makes it harder to build
muscle memory and predict performance under pressure

💡 You might benefit from focusing on consistent launch technique

👁️ Watch for: more similar wheelie patterns across runs and
tighter speed grouping
```

**Key Indicators**

- ⚠️ Focus on consistency over peak performance
- ⚠️ Highlight best-vs-average gap
- ⚠️ Recommendation: consistent starts over chasing peak speed

---

## 📊 Scenario 3: Fatigue/Drop-off Session

### Input Characteristics

```json
{
	"runs": 12,
	"pattern": "fatigue_decline",
	"speed_trend": "declining_after_6",
	"consistency": "high_then_degrades",
	"wheelie_pattern": "controlled_then_late",
	"data_quality": "excellent"
}
```

### Detailed Run Data

**Runs 1-6: Strong performance**

- Run 1: 43.2 km/h, wheelie 440ms @ 14°, controlled
- Run 2: 43.5 km/h, wheelie 430ms @ 13°, controlled
- Run 3: 43.8 km/h, wheelie 425ms @ 14°, controlled
- Run 4: 44.1 km/h, wheelie 435ms @ 13°, controlled
- Run 5: 44.0 km/h, wheelie 440ms @ 14°, controlled
- Run 6: 43.9 km/h, wheelie 445ms @ 13°, controlled

**Runs 7-12: Fatigue pattern**

- Run 7: 43.2 km/h, wheelie 580ms @ 15°, late-lift **← Drop-off**
- Run 8: 42.8 km/h, wheelie 620ms, late-lift
- Run 9: 42.4 km/h, wheelie 650ms, late-lift
- Run 10: 42.1 km/h, wheelie 690ms, late-lift
- Run 11: 41.8 km/h, wheelie 710ms, late-lift
- Run 12: 41.5 km/h, wheelie 730ms, late-lift

- Bias: 0.4 m/s²
- Phase consistency: Starts 88%, drops to 65%

### Expected Outputs

**Session Intelligence (v7.2)**

- Session Quality: 72-78/100
- Repeatability Score: 70-76/100
- Optimal Set Length: **6 runs** ⚠️
- Drop-off: **Detected at run 7** ⚠️
- Fatigue Trend: **Declining** ⚠️
- Fatigue Detection: Early runs strong, late runs -5.8% speed

**Technique Analysis**

- Data Quality: ✅ **Excellent** (0.4 m/s²)
- Wheelie Pattern: ⚠️ **Late** (6/12 late-lift in runs 7-12)
- Phase Consistency: ⚠️ **72%** (degrades over session)
- Confidence: ✅ **High** (Based on 12 runs)

**Coaching Message**

```
Impact: Late wheelies may indicate delayed power application

Why this matters: Early power application is critical for competitive
gate starts - delays can compound into slower overall times

💡 You might benefit from working on explosive launch timing

👁️ Watch for: earlier wheel lift timing (closer to gate drop)
and faster initial acceleration
```

**Key Indicators**

- ⚠️ **Critical**: Drop-off after run 6
- ⚠️ Recommendation: Stop at 6 runs next session
- ⚠️ Late wheelies = fatigue indicator
- ⚠️ Message: Quality > Quantity

---

## 📊 Scenario 4: Excessive Wheelie Pattern

### Input Characteristics

```json
{
	"runs": 8,
	"pattern": "technique_issue",
	"speed_trend": "inconsistent",
	"consistency": "low",
	"wheelie_pattern": "excessive",
	"data_quality": "good"
}
```

### Detailed Run Data

- Run 1: 41.2 km/h, wheelie 980ms @ 22° **← Excessive**, excessive-lift
- Run 2: 40.5 km/h, wheelie 1050ms @ 24° **← Excessive**, excessive-lift
- Run 3: 42.1 km/h, wheelie 920ms @ 21° **← Excessive**, excessive-lift
- Run 4: 39.8 km/h, wheelie 1120ms @ 25° **← Excessive**, excessive-lift
- Run 5: 41.8 km/h, wheelie 890ms @ 20° **← Excessive**, excessive-lift
- Run 6: 40.2 km/h, wheelie 1000ms @ 23° **← Excessive**, excessive-lift
- Run 7: 41.5 km/h, wheelie 950ms @ 22° **← Excessive**, excessive-lift
- Run 8: 40.9 km/h, wheelie 980ms @ 21° **← Excessive**, excessive-lift

- Bias: 0.6 m/s²
- Phase consistency: 56% (high variance in acceleration phase)
- Speed variance: 10.5%

### Expected Outputs

**Session Intelligence (v7.2)**

- Session Quality: 58-64/100
- Repeatability Score: 52-58/100
- Best vs Average Gap: Moderate (6-8%)

**Technique Analysis**

- Data Quality: ✅ **Good** (0.6 m/s²)
- Wheelie Pattern: ❌ **Excessive** (8/8 excessive-lift)
- Phase Consistency: ❌ **56%** (high variance)
- Confidence: ✅ **High** (Based on 8 runs)

**Coaching Message**

```
Impact: Excessive wheelies likely contributing to acceleration inconsistency

Why this matters: Uncontrolled wheel lift can reduce traction and make
power delivery unpredictable, affecting both speed and repeatability

💡 You might benefit from focusing on weight distribution and
smoother power delivery

👁️ Watch for: reduced wheel lift duration and more consistent
acceleration phases
```

**Key Indicators**

- ❌ **Clear technique issue**: 100% excessive wheelies
- ❌ Direct link: wheelies → speed variance
- ❌ Specific advice: weight distribution
- ❌ Observable target: reduced wheel lift duration

---

## 📊 Scenario 5: Late Lift / Delayed Launch Pattern

### Input Characteristics

```json
{
	"runs": 9,
	"pattern": "delayed_power",
	"speed_trend": "below_potential",
	"consistency": "moderate",
	"wheelie_pattern": "late",
	"data_quality": "excellent"
}
```

### Detailed Run Data

- Run 1: 40.8 km/h, wheelie 780ms @ 15°, late-lift
- Run 2: 41.1 km/h, wheelie 750ms @ 14°, late-lift
- Run 3: 40.5 km/h, wheelie 820ms @ 16°, late-lift
- Run 4: 40.9 km/h, wheelie 770ms @ 15°, late-lift
- Run 5: 41.3 km/h, wheelie 740ms @ 14°, late-lift
- Run 6: 40.7 km/h, wheelie 800ms @ 15°, late-lift
- Run 7: 41.0 km/h, wheelie 760ms @ 14°, late-lift
- Run 8: 40.6 km/h, wheelie 810ms @ 16°, late-lift
- Run 9: 41.2 km/h, wheelie 745ms @ 15°, late-lift

- Bias: 0.35 m/s²
- Phase consistency: 72% (moderate - consistent timing, just late)
- Reaction phase: 280ms avg (slightly slow)

### Expected Outputs

**Session Intelligence (v7.2)**

- Session Quality: 68-74/100
- Repeatability Score: 70-76/100
- Potential for improvement: High (technique issue, not talent limit)

**Technique Analysis**

- Data Quality: ✅ **Excellent** (0.35 m/s²)
- Wheelie Pattern: ⚠️ **Late** (9/9 late-lift)
- Phase Consistency: ⚠️ **72%** (moderate variation)
- Confidence: ✅ **High** (Based on 9 runs)

**Coaching Message**

```
Impact: Late wheelies may indicate delayed power application

Why this matters: Early power application is critical for competitive
gate starts - delays can compound into slower overall times

💡 You might benefit from working on explosive launch timing

👁️ Watch for: earlier wheel lift timing (closer to gate drop) and
faster initial acceleration
```

**Key Indicators**

- ⚠️ **Consistent issue**: 100% late wheelies
- ⚠️ Not inconsistent, just late → fixable technique
- ⚠️ Link to reaction phase timing
- ⚠️ High potential for improvement with focused work

---

## 📊 Scenario 6: Poor Data Quality / Calibration Issue

### Input Characteristics

```json
{
	"runs": 7,
	"pattern": "sensor_issue",
	"speed_trend": "unreliable",
	"consistency": "appears_poor_but_sensor",
	"wheelie_pattern": "unreliable_readings",
	"data_quality": "calibrate"
}
```

### Detailed Run Data

- Run 1: 45.2 km/h, wheelie 320ms @ 28°, excessive (unlikely)
- Run 2: 38.5 km/h, wheelie 890ms @ 8°, no-lift (inconsistent)
- Run 3: 47.1 km/h, wheelie 280ms @ 31°, excessive (extreme)
- Run 4: 39.2 km/h, wheelie 950ms @ 7°, no-lift (inconsistent)
- Run 5: 46.8 km/h, wheelie 290ms @ 29°, excessive (extreme)
- Run 6: 38.9 km/h, wheelie 920ms @ 9°, no-lift (inconsistent)
- Run 7: 45.5 km/h, wheelie 310ms @ 27°, excessive (unlikely)

- Bias: **2.4 m/s²** ❌
- G-force readings: Erratic, spiky
- Phase data: Inconsistent, unreliable

### Expected Outputs

**Session Intelligence (v7.2)**

- Session Quality: 45-55/100 (but unreliable)
- **Data Quality Warning** displayed prominently
- Analysis caveat: "Based on potentially unreliable data"

**Technique Analysis**

- Data Quality: ❌ **CALIBRATE** (2.4 m/s²) **← Primary issue**
- Wheelie Pattern: ⚠️ Unreliable readings
- Phase Consistency: Cannot determine accurately
- Confidence: ❌ **Limited data - calibration required**

**Coaching Message**

```
⚠️ DATA QUALITY ISSUE DETECTED

The sensor data shows high bias (2.4 m/s²) indicating a potential
calibration issue.

⚠️ Do not trust derived metrics until sensor is recalibrated.

Raw data may still be useful for debugging sensor placement/setup.

→ Action Required: Recalibrate sensor before next session
```

**Key Indicators**

- ❌ **Block analysis**: Don't provide coaching on bad data
- ❌ Clear warning: Calibrate first
- ❌ Protect trust: Don't give confident advice on unreliable data
- ❌ Actionable: Tell user exactly what to do

---

## 📊 Scenario 7: Stable Plateau

### Input Characteristics

```json
{
	"runs": 10,
	"pattern": "plateau",
	"speed_trend": "stable_no_improvement",
	"consistency": "high",
	"wheelie_pattern": "controlled",
	"data_quality": "excellent"
}
```

### Detailed Run Data

- Run 1: 43.8 km/h, wheelie 435ms @ 14°, controlled
- Run 2: 43.9 km/h, wheelie 440ms @ 13°, controlled
- Run 3: 43.7 km/h, wheelie 432ms @ 14°, controlled
- Run 4: 43.8 km/h, wheelie 438ms @ 13°, controlled
- Run 5: 43.9 km/h, wheelie 436ms @ 14°, controlled
- Run 6: 43.8 km/h, wheelie 434ms @ 13°, controlled
- Run 7: 43.7 km/h, wheelie 439ms @ 14°, controlled
- Run 8: 43.8 km/h, wheelie 437ms @ 13°, controlled
- Run 9: 43.9 km/h, wheelie 435ms @ 14°, controlled
- Run 10: 43.8 km/h, wheelie 436ms @ 13°, controlled

- Bias: 0.3 m/s²
- Phase consistency: 92% (extremely high)
- Speed variance: 1.2% (very tight)

### Expected Outputs

**Session Intelligence (v7.2)**

- Session Quality: 85-90/100
- Repeatability Score: 90-95/100 (excellent)
- Optimal Set Length: 10 runs (no fatigue)
- Best vs Average Gap: Minimal (< 1%)

**Technique Analysis**

- Data Quality: ✅ **Excellent** (0.3 m/s²)
- Wheelie Pattern: ✅ **Controlled** (10/10 controlled)
- Phase Consistency: ✅ **92%** (highly repeatable)
- Confidence: ✅ **High** (Based on 10 runs)

**Coaching Message**

```
Impact: Consistent launch control observed

Why this matters: Consistent technique provides a stable foundation
for further improvements and better competition results

💡 Current technique appears effective

👁️ Watch for: maintaining this consistency while increasing overall speed
```

**Key Indicators**

- ✅ High repeatability = mastered current level
- ✅ Stable plateau = ready for next challenge
- ✅ Message: technique solid, time to progress
- ✅ **Not negative**: Plateau is good if consistent

---

## 📊 Scenario 8: Mixed Signal (Speed Up, Consistency Down)

### Input Characteristics

```json
{
	"runs": 8,
	"pattern": "speed_vs_control_tradeoff",
	"speed_trend": "increasing",
	"consistency": "decreasing",
	"wheelie_pattern": "becoming_excessive",
	"data_quality": "good"
}
```

### Detailed Run Data

**Early runs: Controlled but slower**

- Run 1: 41.2 km/h, wheelie 450ms @ 14°, controlled
- Run 2: 41.5 km/h, wheelie 460ms @ 13°, controlled
- Run 3: 41.8 km/h, wheelie 470ms @ 14°, controlled

**Mid runs: Transitioning**

- Run 4: 42.3 km/h, wheelie 620ms @ 17°, late-lift
- Run 5: 42.7 km/h, wheelie 880ms @ 20°, excessive

**Late runs: Faster but less controlled**

- Run 6: 43.1 km/h, wheelie 940ms @ 22°, excessive
- Run 7: 43.5 km/h, wheelie 1020ms @ 24°, excessive
- Run 8: 43.8 km/h, wheelie 980ms @ 23°, excessive

- Bias: 0.65 m/s²
- Phase consistency: Started 85%, ended 62%
- Speed variance: 11.2% (increasing)

### Expected Outputs

**Session Intelligence (v7.2)**

- Session Quality: 65-71/100
- Repeatability Score: 60-66/100 (declining trend)
- Pattern: Trading control for speed (not sustainable)

**Technique Analysis**

- Data Quality: ✅ **Good** (0.65 m/s²)
- Wheelie Pattern: ⚠️ **Excessive** (4/8 excessive in late runs)
- Phase Consistency: ⚠️ **68%** (declining)
- Confidence: ✅ **High** (Based on 8 runs)

**Coaching Message**

```
Impact: Excessive wheelies likely contributing to acceleration inconsistency

Why this matters: Uncontrolled wheel lift can reduce traction and make
power delivery unpredictable, affecting both speed and repeatability

💡 You might benefit from focusing on weight distribution and
smoother power delivery

👁️ Watch for: reduced wheel lift duration and more consistent
acceleration phases
```

**Key Indicators**

- ⚠️ **Complex pattern**: Speed ↑ but Consistency ↓
- ⚠️ Trading controlled technique for raw speed
- ⚠️ Not sustainable → technique breakdown under pressure
- ⚠️ Message: Return to controlled approach, **then** add speed

---

## 🧪 How to Use These Scenarios

### For Testing

```typescript
// Generate test data matching scenario characteristics
const cleanRiderData = generateTestSession({
	scenario: 'clean_improving_rider',
	runs: 8,
	speed_base: 42.3,
	speed_increment: 0.3,
	wheelie_pattern: 'controlled',
	bias: 0.3
});

// Run through coaching system
const sessionReport = buildSessionIntelligence(cleanRiderData);
const techniqueReport = analyzeTechnique(cleanRiderData);

// Assert expected outputs
expect(sessionReport.sessionQuality).toBeGreaterThan(88);
expect(techniqueReport.wheeliePattern).toBe('controlled');
expect(techniqueReport.dataQuality.rating).toBe('excellent');
```

### For Validation

1. Generate each scenario's data
2. Run through full coaching pipeline
3. Compare outputs against expected results
4. Flag any mismatches for review

### For Regression Testing

1. Run all scenarios before code changes
2. Capture baseline outputs
3. Run all scenarios after code changes
4. Compare differences
5. Verify intentional changes, catch regressions

### For Documentation

Use scenarios to demonstrate:

- How the system handles different rider patterns
- What messages users will see
- When interventions are recommended
- How confidence levels work

---

## 📝 Notes

- **Scenario independence**: Each scenario is independent and can be tested individually
- **Real-world based**: All scenarios based on actual rider patterns observed in BMX
- **Expected variance**: Ranges provided (e.g., 88-92) account for algorithm variance
- **Critical thresholds**: Exact thresholds may need tuning based on validation data
- **Message consistency**: Language should match across all scenarios
- **Trust preservation**: Even in poor performance scenarios, language stays humble

---

## 🔄 Maintenance

Update this document when:

1. New scenarios are identified from real data
2. Thresholds change based on validation
3. New features add analysis dimensions
4. User feedback reveals missed patterns
5. Edge cases are discovered

**Version:** 1.0  
**Last Updated:** 2026-04-27  
**Next Review:** After first 100 real sessions analyzed
