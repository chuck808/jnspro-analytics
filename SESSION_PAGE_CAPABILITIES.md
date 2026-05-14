# Performance Engine Capabilities - Session Details Page

## Executive Summary

The Session Details page DOES use the Performance Engine (`analyseSession()`) but only exposes a subset of its capabilities. This document identifies what's available, what's currently shown, and what's missing.

---

## 🎯 Current Implementation Status

### ✅ What's Currently Working:

The session page calls `analyseSession()` in `+layout.svelte` (line 77-86), which gives access to ALL Performance Engine capabilities. However, only some are displayed:

**Currently Exposed:**
1. ✅ **Session Intelligence** (v7.2) - repeatability, fatigue, dropoff, best vs avg
2. ✅ **Session Narrative** - natural language session summary
3. ✅ **Technique Scores** - overall technique score per run
4. ✅ **Physics Charts** - G-force, speed curves, jerk profile
5. ✅ **Impulse & Power Charts** - impulse timing, power estimates
6. ✅ **Data Quality Badges** - calibration quality indicators
7. ✅ **Phase Metrics** - computed via `computeDetailedPhases()`
8. ✅ **Speed Splits** - time to 3m, 5m, 8m
9. ✅ **Cross-Run Progression** - run-by-run metrics
10. ✅ **Weaknesses & Recommendations** - identified issues and suggestions

**Architecture:**
- `+layout.server.ts` - Fetches ALL run data including `chart_data` ✅
- `+layout.svelte` - Runs full Performance Engine analysis ✅
- Child pages (`+page.svelte`, `analysis/+page.svelte`) - Display subsets of data

---

## ❌ What's Missing Despite Being Available

The Performance Engine analysis (`performanceAnalysis`) contains these features that are **computed but not displayed**:

### 1. **Coach Diagnostics** (`buildCoachDiagnostics`)
**Status**: ❌ Not Called, ❌ Not Displayed

**What it provides:**
- Specific coaching insights with evidence and prescriptions
- Example: "Reaction is ahead of drive force - add first-pedal force drills"
- Tailored by audience (grom, rider, elite, coach)

**Why it's valuable:**
- More actionable than generic technique scores
- Provides specific next steps
- Evidence-based coaching

**How to expose:**
```typescript
// In +layout.svelte, add:
import { scoreRunTechnique, buildCoachDiagnostics } from '$lib/performance-engine';

let coachDiagnostics = $derived.by(() => {
  const scores = scoreRunTechnique(
    performanceAnalysis.selectedRun,
    performanceAnalysis,
    { riderLevel: riderLevel as DetailLevel }
  );
  return buildCoachDiagnostics(performanceAnalysis, scores);
});
```

**Current workaround:** The page uses `analysisView.insights` (line 242, 262, 287) which are generic insights, NOT the full coach diagnostics.

---

### 2. **Insight Builder Pack** (`buildPerformanceInsightPack`)
**Status**: ❌ Not Called, ❌ Not Fully Displayed

**What it provides:**
- Comprehensive insight pack with:
  - Natural language headline
  - Plain English summary
  - Strengths list (what's working well)
  - Limiters list (what needs work)
  - Next actions (prioritized)
  - Full technique score breakdown
  - Coach diagnostics

**Currently shown:** Only `analysisView.headline` and `analysisView.summary` (partial)

**Missing:**
- Explicit strengths list
- Explicit limiters list
- Prioritized next actions
- Full technique score labels (excellent/good/developing/needs-work)

**How to expose:**
```typescript
import { buildPerformanceInsightPack } from '$lib/performance-engine';

let insightPack = $derived(
  buildPerformanceInsightPack(performanceAnalysis, riderLevel as DetailLevel)
);
```

**Display suggestions:**
- Show strengths as green badges
- Show limiters as amber/red badges
- Display next actions as ordered checklist
- Use score labels instead of raw numbers

---

### 3. **Full Technique Score Breakdown**
**Status**: ⚠️ Partially Displayed

**What's available in `performanceAnalysis.selectedRun.technique`:**
- Overall technique score ✅ (shown)
- Reaction quality ❌ (not shown)
- Explosiveness ❌ (not shown)
- Smoothness ❌ (not shown)
- Efficiency ❌ (not shown)
- Phase assessment ❌ (not shown)

**Currently shown:** Only overall score in CrossRunProgression

**Missing:** Individual dimension scores with labels

**How to improve:**
Display all 6 technique dimensions:
1. Launch Quality (reaction time)
2. Explosiveness (peak acceleration)
3. Speed Carry (maintaining speed)
4. Smoothness (force delivery)
5. Impulse Timing (force application timing)
6. Repeatability (consistency)

Each should show:
- 0-100 score
- Label (excellent/good/developing/needs-work)
- Color coding
- Comparison to benchmarks

---

### 4. **Technique Score Labels**
**Status**: ❌ Not Used

From `techniqueScoring.ts`, each score comes with text labels:
```typescript
{
  launchQuality: 82,
  labels: {
    launchQuality: "excellent",
    explosiveness: "good",
    speedCarry: "developing",
    smoothness: "needs-work",
    // ...
  }
}
```

**Currently:** Raw numbers only (e.g., "82")

**Should be:** "82/100 — Excellent" with color coding

---

### 5. **Phase Consistency Analysis** (`analysePhaseConsistency`)
**Status**: ❌ Not Called, ❌ Not Displayed

**What it does:**
- Analyzes consistency across run phases (0-3m, 3-5m, etc.)
- Shows which phases are most/least consistent
- Identifies where technique breaks down

**Why it's missing:**
Requires `splits_data` from database, which may not be stored per run

**How to add (if data available):**
```typescript
import { analysePhaseConsistency } from '$lib/performance-engine';

let phaseConsistency = $derived.by(() => {
  const runsWithSplits = data.runs
    .map(run => ({
      splits: run.gate_runs?.splits_data ?? [],
      ...run
    }))
    .filter(r => r.splits.length > 0);
  
  if (runsWithSplits.length < 2) return null;
  return analysePhaseConsistency(runsWithSplits);
});
```

---

### 6. **Per-Run Technique Scores**
**Status**: ⚠️ Computed but Not Fully Displayed

**What's available:**
`performanceAnalysis.runs` contains full technique analysis for EVERY run, not just the selected one.

**Currently shown:** Only overall score in progression chart

**Missing:**
- Dimension breakdown per run
- Run-by-run comparison table
- Technique trend charts
- Identify which runs were best/worst for each dimension

**How to expose:**
Create a "Run Comparison Table" showing:
| Run | Overall | Launch | Explosive | Speed Carry | Smoothness |
|-----|---------|--------|-----------|-------------|------------|
| 1   | 78      | 85     | 72        | 80          | 68         |
| 2   | 82      | 87     | 78        | 84          | 72         |

---

### 7. **Detailed Physics Metrics**
**Status**: ⚠️ Computed but Not Prominently Displayed

**Available in `performanceAnalysis.selectedRun.physics`:**
- ✅ Speed curve (shown in chart)
- ✅ Jerk profile (shown in chart)
- ⚠️ Impulse metrics (shown in chart, not in summary)
- ⚠️ Power estimate (shown in chart, not in summary)
- ❌ Speed profile classification (computed but not highlighted)
- ❌ G-force stability score (computed but not shown)

**Missing display:**
- Speed profile badge (e.g., "🚀 Front-loaded acceleration")
- Key impulse metrics as stats cards:
  - Time to 50% impulse
  - Time to 90% impulse
  - Impulse efficiency score
  - Front-loaded score

---

### 8. **Benchmarks Comparison**
**Status**: ❌ Not Displayed

`getBenchmarks()` provides performance benchmarks by rider level:
- Excellent thresholds
- Good thresholds
- Needs work thresholds

**Currently:** Technique scores shown without context

**Should add:**
- "Your reaction time: 0.245s (Excellent for Club level)"
- "Your peak G: 1.8G (Good - aim for 2.0G)"
- Visual indicators showing where user sits on the scale

---

### 9. **Front Wheel Lift Analysis**
**Status**: ⚠️ Partially Computed

`analyseFrontWheelLift()` can provide:
- Wheelie impact on performance
- Controlled vs excessive lift
- Correlation with reaction time

**Currently:** Just counts wheelie runs (line 186)

**Missing:**
- Whether wheelies helped or hurt performance
- Recommendation on technique
- Pattern analysis

---

### 10. **Recommendations Context**
**Status**: ⚠️ Generic, Not Contextualized

**Currently:** Shows generic recommendations from `enhancedAnalysis.recommendations`

**Missing:**
- Prioritization (high/medium/low)
- Evidence supporting each recommendation
- Expected impact ("Could improve your best time by 0.05s")
- Specific drills or exercises

---

## 📊 Display Organization Analysis

### Current Page Structure:

**Overview Page (`+page.svelte`):**
- Session context
- Hero metric (best result)
- Session narrative ✅
- Summary stats
- Cross-run progression

**Analysis Page (`analysis/+page.svelte`):**
- Run selector
- Impulse & Power charts ✅
- G-force chart ✅
- Performance curves ✅
- Jerk chart ✅
- Training Insights Panel ✅
- Speed splits table
- Phase metrics
- Technique scores (gauge)
- Session notes

**What could be reorganized:**
- Coach diagnostics (new section)
- Technique breakdown (expand existing)
- Benchmarks comparison (new section)
- Strengths & limiters (new cards)

---

## 🎨 Specific Missing UI Components

### 1. Coach Diagnostics Panel
**Location:** Should be on Analysis page
**Content:**
- Diagnostic title with tone icon (✓ positive, ⚠ warning, ○ neutral)
- Summary paragraph
- Evidence list (bullet points)
- Prescription list (action items)
- Audience indicator

### 2. Technique Scorecard (Detailed)
**Location:** Analysis page
**Current:** Single overall score gauge
**Should be:** 6 separate mini-gauges or score cards:
- Launch Quality: 85/100 (Excellent) 🟢
- Explosiveness: 72/100 (Good) 🟡
- Speed Carry: 68/100 (Developing) 🟠
- Smoothness: 58/100 (Needs Work) 🔴
- Impulse Timing: 78/100 (Good) 🟡
- Repeatability: 65/100 (Developing) 🟠

### 3. Strengths & Limiters Cards
**Location:** Overview or Analysis page
**Content:**
- Strengths (2-3 green badges): "Launch Reaction", "Speed Carry"
- Limiters (2-3 red badges): "Smoothness", "Repeatability"
- One-sentence explanation each

### 4. Benchmark Comparison Bars
**Location:** Analysis page, next to metrics
**Visual:** Horizontal bar showing:
```
Needs Work    Good    Excellent
    |-----------|◆-------|
              Your Score: 82
```

### 5. Run Comparison Table
**Location:** Analysis page or new "Compare" tab
**Content:** Matrix of all runs × all technique dimensions

### 6. Next Actions Checklist
**Location:** Overview or Analysis page
**Content:**
- ☐ Keep gate reaction work ticking over
- ☐ Add first-pedal force drills
- ☐ Check device mounting first
(Ordered by priority from insight builder)

---

## 🔍 Data Flow Analysis

### Current Flow:
1. `+layout.server.ts` → Fetches all run data including `chart_data` ✅
2. `+layout.svelte` → Runs `analyseSession()` ✅
3. Creates `performanceAnalysis` object with ALL capabilities ✅
4. Creates `analysisView` with simplified insights ⚠️
5. Child pages display subset of data ⚠️

### What's Happening:
- **Full analysis is computed** ✅
- **Only generic insights are formatted** (`createAnalysisView`)
- **Coach diagnostics are never called** ❌
- **Insight builder is never called** ❌
- **Technique score labels are ignored** ❌

### The Fix:
Add these derived values to `+layout.svelte`:

```typescript
// After line 90 (analysisView creation)
import { scoreRunTechnique, buildCoachDiagnostics, buildPerformanceInsightPack } from '$lib/performance-engine';

let techniqueScoreBreakdown = $derived(
  performanceAnalysis.selectedRun
    ? scoreRunTechnique(
        performanceAnalysis.selectedRun,
        performanceAnalysis,
        { riderLevel: riderLevel as DetailLevel || 'rider' }
      )
    : null
);

let coachDiagnostics = $derived(
  techniqueScoreBreakdown
    ? buildCoachDiagnostics(performanceAnalysis, techniqueScoreBreakdown)
    : []
);

let insightPack = $derived(
  buildPerformanceInsightPack(
    performanceAnalysis,
    (riderLevel as DetailLevel) || 'rider'
  )
);
```

Then add to context (line 308+):
```typescript
setContext('session', {
  // ... existing ...
  get techniqueScoreBreakdown() { return techniqueScoreBreakdown; },
  get coachDiagnostics()        { return coachDiagnostics; },
  get insightPack()             { return insightPack; },
});
```

---

## 💡 Quick Wins

### Minimum Viable Enhancement (1-2 hours):

**1. Display Coach Diagnostics (30 min)**
- Add coach diagnostics derivation to `+layout.svelte`
- Create simple card on Analysis page showing top diagnostic
- Include evidence + prescription

**2. Show Full Technique Scores (30 min)**
- Replace single gauge with 6 mini-gauges or score bars
- Show labels (excellent/good/developing/needs-work)
- Color code by performance level

**3. Add Strengths & Limiters (30 min)**
- Extract from insight pack
- Display as badge lists on Overview page
- 2-3 of each

**Impact:** Massive increase in actionable insights with minimal code changes

---

## 📈 Expected Impact

### For Riders:
- **Better understanding:** "I need to work on smoothness" vs "Your overall score is 72"
- **Clearer guidance:** Specific prescriptions instead of generic advice
- **Motivation:** See strengths celebrated, not just weaknesses

### For Coaches:
- **Detailed diagnostics:** Evidence-based coaching insights automatically
- **Time savings:** No need to manually interpret raw data
- **Better communication:** Share specific, actionable feedback with athletes

### For the Platform:
- **Differentiation:** No other system provides this level of AI coaching
- **User retention:** More value per session = more uploads
- **Premium feature:** Could be subscription tier differentiator

---

## 🚦 Priority Recommendations

### High Priority (Do First):
1. ✅ **Display Coach Diagnostics** - Already computed, just need to show it
2. ✅ **Full Technique Score Breakdown** - All data available, expand UI
3. ✅ **Strengths & Limiters Lists** - One function call, high UX value

### Medium Priority:
4. ⚠️ **Benchmark Comparisons** - Add context to scores
5. ⚠️ **Next Actions Checklist** - Prioritized action items
6. ⚠️ **Run Comparison Table** - Advanced users who want to see patterns

### Lower Priority:
7. ⏸️ **Phase Consistency** - Requires splits data, may not be available
8. ⏸️ **Advanced Physics Metrics** - Very technical, niche audience

---

## 🔧 Implementation Checklist

### Phase 1: Expose Existing Data (2-3 hours)
- [ ] Add `techniqueScoreBreakdown` to +layout.svelte
- [ ] Add `coachDiagnostics` to +layout.svelte  
- [ ] Add `insightPack` to +layout.svelte
- [ ] Expose via context to child pages
- [ ] Create CoachDiagnostic card component
- [ ] Create TechniqueScoreBreakdown component
- [ ] Create StrengthsLimiters component
- [ ] Add to Analysis page

### Phase 2: Enhance Existing Components (2-3 hours)
- [ ] Expand technique gauge to show all 6 dimensions
- [ ] Add labels to technique scores
- [ ] Add benchmark comparison bars
- [ ] Display next actions as checklist
- [ ] Add speed profile badge

### Phase 3: New Features (4-6 hours)
- [ ] Run comparison table
- [ ] Phase consistency analysis (if data available)
- [ ] Front wheel lift detailed analysis
- [ ] Recommendations with evidence and impact

---

## 📋 Technical Considerations

### Performance:
- ✅ No performance concerns - all data already computed
- The issue is **display**, not **computation**

### Data Availability:
- ✅ All main features available (chart_data is fetched)
- ⚠️ Phase consistency needs splits_data (may not be stored)

### User Experience:
- Risk: Information overload
- Mitigation: Progressive disclosure (tabs, expandable sections)
- Consider: User level filtering (show simpler view for groms)

---

## 📞 Key Questions

1. **Audience targeting:** Should diagnostics auto-adjust based on rider level?
2. **Information density:** How much to show by default vs. in expandable sections?
3. **Mobile experience:** How to adapt dense technique scorecard for mobile?
4. **Report integration:** Should coach diagnostics be in printed reports? (Already yes in code)

---

## Summary Table: What's Available vs. What's Shown

| Capability | Computed | Displayed | Priority | Effort |
|------------|----------|-----------|----------|--------|
| Session Intelligence | ✅ | ✅ | - | - |
| Session Narrative | ✅ | ✅ | - | - |
| Technique Scores (Overall) | ✅ | ✅ | - | - |
| **Technique Scores (Detailed)** | ✅ | ❌ | HIGH | Low |
| **Technique Score Labels** | ✅ | ❌ | HIGH | Low |
| **Coach Diagnostics** | ❌ | ❌ | HIGH | Low |
| **Insight Builder Pack** | ❌ | ❌ | HIGH | Low |
| **Strengths List** | ❌ | ❌ | HIGH | Low |
| **Limiters List** | ❌ | ❌ | HIGH | Low |
| **Next Actions (Prioritized)** | ⚠️ | ⚠️ | MED | Low |
| Physics Charts | ✅ | ✅ | - | - |
| Impulse Metrics (Chart) | ✅ | ✅ | - | - |
| **Impulse Metrics (Summary)** | ✅ | ❌ | MED | Low |
| Power Estimate (Chart) | ✅ | ✅ | - | - |
| **Speed Profile Badge** | ✅ | ❌ | MED | Low |
| Speed Splits | ✅ | ✅ | - | - |
| Phase Metrics | ✅ | ✅ | - | - |
| **Phase Consistency** | ❌ | ❌ | LOW | Med |
| **Benchmark Comparison** | ✅ | ❌ | MED | Med |
| **Run Comparison Table** | ✅ | ❌ | MED | Med |
| Front Wheel Lift (Count) | ✅ | ✅ | - | - |
| **Front Wheel Lift (Analysis)** | ❌ | ❌ | LOW | Med |

---

## Conclusion

The session page is in MUCH better shape than the analytics page. It's using the Performance Engine correctly and showing most key features. The missing pieces are:

**Top 3 Missing Capabilities:**
1. **Coach Diagnostics** - The most valuable feature, not being called
2. **Full Technique Score Breakdown** - Computed but only showing overall
3. **Insight Builder** - Strengths, limiters, and prioritized actions

**The Good News:**
All three can be added with < 3 hours of work since the analysis is already computed. It's purely a display issue, not a data or computation issue.

**Recommendation:**
Start with coach diagnostics. One function call, one new card component, instant high value. Then expand technique scores to show all 6 dimensions with labels. Finally, add strengths/limiters badges from insight builder.

This would elevate the session page from "good" to "exceptional" with minimal effort.
