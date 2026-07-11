# Technique → Outcome Links

## 🧠 The Big Picture

This document explains how we're connecting **how a rider rides** (technique) to **what results they get** (outcome).

This is the evolution from "analytics tool" → "coaching system".

---

## 🔗 The Architecture

```
┌─────────────────────────────────────────────────────┐
│                Performance Engine                    │
│                                                      │
│  Run Level    → Physics + Technique                 │
│  Session      → Intelligence (v7.2)                 │
│  Multi-session→ Progress (v8.1)                     │
│  Technique    → NEW: Links HOW → WHAT              │
└─────────────────────────────────────────────────────┘
```

### The Flow

**Before this update:**

- We analyzed WHAT happened (speed, G-force, repeatability)
- Coaches had to manually connect technique issues

**After this update:**

- We analyze HOW the rider rides (wheelie control, launch timing)
- We connect technique patterns → performance outcomes
- We give specific, actionable advice

---

## 🎯 Technique → Outcome Relationships

### 1. Wheelie Control → Consistency

**Technique Input:**

```typescript
{
  front_wheel_lifted: true,
  wheelie_duration_ms: 850,
  max_pitch: 16.5,
  time_to_wheelie_ms: 450
}
```

**Analysis:**

- Classification: `'controlled'` | `'late-lift'` | `'excessive-lift'` | `'no-lift'`

**Outcome Link:**
| Pattern | Impact on Performance | Advice |
|---------|---------------------|--------|
| **Excessive** (>30% runs) | Likely contributing to acceleration inconsistency | Consider working on weight distribution and smoother power delivery |
| **Late** (>40% runs) | May indicate delayed power application | Consider working on explosive launch timing |
| **Controlled** (>60% runs) | Consistent launch control observed | Current technique appears effective |
| **Mixed** | May be affecting repeatability | Consider focusing on consistent launch technique |

**Real Coaching Value:**

- Before: "Your wheelies are inconsistent"
- After: "Excessive wheelies in 4/10 runs likely contributing to 12% speed variance → consider working on weight distribution"

---

### 2. Data Quality → Trust Level

**Technique Input:**

```typescript
{
	bias_correction_ms2: 0.35;
}
```

**Analysis:**

- Rating: `'excellent'` | `'good'` | `'fair'` | `'calibrate'`

**Outcome Link:**
| Rating | Bias Range | Trust Level | Action |
|--------|-----------|-------------|--------|
| **Excellent** | < 0.5 m/s² | High confidence in data | Use for fine-tuning |
| **Good** | < 1.0 m/s² | Reliable trends | Safe for training decisions |
| **Fair** | < 2.0 m/s² | Noisy but usable | Look for patterns, not absolutes |
| **Calibrate** | ≥ 2.0 m/s² | Do not trust derived metrics | Recalibrate before training. Raw data may still be useful for debugging |

**Real Coaching Value:**

- Before: "Something seems off with the numbers"
- After: "Bias 1.8 m/s² = fair quality → use for trends, not micro-optimization"

---

### 3. Phase Consistency → Weakness Detection

**Technique Input:**

```typescript
[
	{ phase: 'reaction', time: 250 },
	{ phase: 'acceleration', time: 1200 },
	{ phase: 'top-speed', time: 2100 }
];
```

**Analysis:**

```typescript
{
  phase: 'reaction',
  avg: 265,
  spread: 30,
  consistency: 88.68  // Higher = more consistent (0-100)
}
```

**Outcome Link:**
| Consistency | Spread | What It Means | Training Focus |
|-------------|--------|---------------|----------------|
| > 85% | Tight | Highly repeatable | Maintain/refine |
| 70-85% | Moderate | Some variation | Identify outliers |
| 50-70% | High | Inconsistent execution | Drill this phase |
| < 50% | Very high | Fundamental issue | Back to basics |

**Real Coaching Value:**

- Before: "Your reaction times are all over the place"
- After: "Reaction phase 68% consistent (spread 45ms) → drill gate starts, focus on anticipation"

---

## 🏗️ How It's Integrated

### In TrainingInsightsPanel.svelte

```svelte
<TrainingInsightsPanel
  sessionReport={sessionIntelligence}
  crossSessionReport={crossSessionProgress}
  runs={runs}  <!-- NEW: Pass runs for technique analysis -->
  detailLevel="coach"
  showTechniqueSection={true}  <!-- NEW: Toggle technique layer -->
/>
```

**The Panel Now Shows:**

1. **v7.2 (Session Intelligence)**
   - Session quality, repeatability, fatigue
   - What happened this session

2. **Technique Layer** ← NEW
   - Wheelie patterns → consistency impact
   - Data quality → trust level
   - Phase consistency → weakness detection
   - **Links: HOW affects WHAT**

3. **v8.1 (Cross-Session Progress)**
   - Long-term trends
   - Progression over time

---

## 📊 TechniqueAnalysisPanel Features

### For All Users

**Key Metrics:**

- Data Quality badge (always visible)
- Wheelie Pattern summary
- Analysis run count

**Technique Impact Card:**

- Shows the **link** between technique and outcome
- Gives specific advice
- Color-coded by severity

### For Advanced Users (Elite/Coach)

**Performance Distribution:**

- Peak speed scatter chart
- Visualize consistency vs. wheelie control

**Detailed Launch Analysis:**

- Per-run wheelie breakdown
- Pitch, duration, timing metrics
- Classification per run

**Phase Consistency Breakdown:**

- Statistical analysis per phase
- Avg, spread, consistency score
- Identify specific weak phases

---

## 🎓 Coaching Scenarios

### Scenario 1: Excessive Wheelies

**Data:**

- 6/10 runs with excessive-lift
- Speed variance: 15%
- Repeatability score: 62/100

**Old System:**

- "Your repeatability is only 62/100"
- Coach has to watch video to figure out why

**New System:**

- "Excessive wheelies in 6/10 runs likely contributing to speed variance"
- "Consider working on weight distribution and smoother power delivery"
- Coach has evidence-based starting point

---

### Scenario 2: Late Power Application

**Data:**

- 7/10 runs with late-lift (>700ms)
- Slower reaction phase
- Phase consistency: 58%

**Old System:**

- "Your reaction times are inconsistent"
- Generic advice

**New System:**

- "Late wheelies in 7/10 runs may indicate delayed force application"
- "Consider reviewing launch timing and body position"
- Evidence-based starting point for technique analysis

---

### Scenario 3: Data Quality Issue

**Data:**

- Bias: 2.3 m/s² (calibrate rating)
- Inconsistent metrics
- Coach confused

**Old System:**

- Numbers don't make sense
- Frustration

**New System:**

- "Data Quality: CALIBRATE (2.3 m/s² bias)"
- "Don't trust absolute values → recalibrate before next session"
- Clear action item

---

## 🔮 Future Evolution (v7.x+)

### Next Steps:

1. **Context-Aware Thresholds**

   ```typescript
   // Instead of fixed thresholds:
   maxPitch > 18 → excessive

   // Context-aware:
   if (riderWeight > 75kg && crankLength < 170mm) {
     // Heavier rider, shorter cranks → different threshold
     maxPitch > 22 → excessive
   }
   ```

2. **Causal Analysis**

   ```typescript
   // Link chains:
   'Excessive wheelies → inconsistent speed → poor repeatability → dropped performance';

   // Root cause:
   'Fix: Weight distribution → controls wheelies → improves everything downstream';
   ```

3. **Phase Name Standardization**

   ```typescript
   // Current mixed system:
   - 'reaction', 'acceleration', 'top-speed'
   - 'Launch', 'Early acceleration', 'Peak power'

   // Unified system (future):
   - Canonical phases across all modules
   - Consistent naming = no bugs
   ```

4. **Predictive Links** _(Future / Experimental)_
   ```typescript
   // Future AI layer (experimental):
   'If wheelie control improves by 20% → expect 8% consistency gain';
   'Based on similar riders, focus on launch timing = biggest ROI';
   ```

---

## ✅ What This Achieves

### For Riders:

- Understand **why** their performance varies
- Get specific actions, not just data

### For Coaches:

- Evidence-based coaching decisions
- Connect technique observations → data outcomes
- Save time diagnosing issues

### For the System:

- Evolution from analytics → coaching platform
- Foundation for AI-assisted coaching (future)
- Complete feedback loop: data → insight → action → result

---

## 🧪 How to Use

### In Your Code:

```svelte
<script>
	import { TrainingInsightsPanel } from '$lib/components/performance-insights';

	// Your session data
	export let session;
	export let runs;

	// Build reports
	const sessionReport = buildSessionIntelligence(session, runs);
	const crossSessionReport = buildCrossSessionProgress(sessions);
</script>

<TrainingInsightsPanel
	{sessionReport}
	{crossSessionReport}
	{runs}
	detailLevel="coach"
	showTechniqueSection={true}
/>
```

### For Testing:

```typescript
// Test wheelie analysis
const wheelieData = {
	front_wheel_lifted: true,
	wheelie_duration_ms: 950,
	max_pitch: 19.5,
	time_to_wheelie_ms: 320
};

const analysis = analyseFrontWheelLift(wheelieData);
// Result: { classification: 'excessive-lift', ... }

// Test data quality
const quality = assessDataQuality(1.8);
// Result: { rating: 'fair', bias: 1.8 }

// Test phase consistency
const consistency = analysePhaseConsistency(runs);
// Result: [{ phase: 'reaction', consistency: 72.5, ... }]
```

---

## 📝 Key Takeaways

1. **Technique Layer = New**
   - Sits between run-level and session-level
   - Analyzes HOW, not just WHAT

2. **Links Are Explicit**
   - Not hidden in code
   - Visible to coaches
   - Actionable advice

3. **Architecture Is Clean**
   - Performance Engine → analysis
   - Components → visualization
   - Panels → composition
   - No logic mixing

4. **It's Production-Ready**
   - Fully typed
   - Properly styled
   - Integrated into existing flow
   - Optional (doesn't break existing features)

---

## 🎯 Success Metrics

**How to know this is working:**

1. Coaches spend less time diagnosing issues
2. Riders understand their technique impact
3. Feedback shows technique advice is actionable
4. Data quality warnings prevent confusion
5. Phase consistency guides training focus

**This is the difference between:**

- Tool: "Here's your data"
- System: "Here's what to do about it"

---

For implementation details, see `PERFORMANCE_MODULES_INTEGRATION.md`.
