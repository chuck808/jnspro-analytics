# Performance Engine Capabilities - Analytics Page Enhancement

## Executive Summary

The Performance Engine has significantly more analytical capabilities than currently exposed on the analytics page. This document outlines what's available, what's missing, and how to expose these features.

---

## 🚀 Available Performance Engine Capabilities

### 1. **Coach Diagnostics** (`coachDiagnostics.ts`)
**Status**: ✅ Built, ❌ Not Exposed

**What it does**:
- Analyzes technique scores and provides coach-level insights
- Identifies specific weaknesses (e.g., "Reaction is ahead of drive force")
- Provides evidence-based summaries
- Offers prescriptive next steps for improvement
- Tailored by audience level (grom, rider, elite, coach)

**Output Example**:
```typescript
{
  title: "Explosive start but poor speed carry",
  tone: "warning",
  summary: "The run creates force early, but speed is not being carried through...",
  evidence: ["Explosiveness 78/100", "Speed carry 52/100"],
  prescription: [
    "Work on drive-phase continuation after the first hit",
    "Use resisted starts followed by clean free-roll starts"
  ],
  audience: "elite"
}
```

**Why it's valuable**: 
- Provides actionable coaching insights automatically
- Goes beyond raw numbers to explain performance patterns
- Helps riders understand what to work on next

---

### 2. **Insight Builder** (`insightBuilder.ts`)
**Status**: ✅ Built, ❌ Not Exposed

**What it does**:
- Builds comprehensive performance insight packs
- Generates natural language headlines (e.g., "Strong technical run profile")
- Creates plain English summaries
- Identifies strengths and limiters
- Provides next actions based on analysis

**Output Example**:
```typescript
{
  headline: "Fast reaction, drive force needs work",
  plainEnglishSummary: "Profile summary: launch excellent, explosiveness developing, speed carry good.",
  strengths: ["Launch reaction", "Speed carry", "Repeatability"],
  limiters: ["First-drive force", "Smoothness"],
  nextActions: [
    "Keep gate reaction work ticking over",
    "Add first-pedal force drills",
    "Check device mounting first"
  ],
  scores: { overall: 72, launchQuality: 85, explosiveness: 58, ... },
  diagnostics: [ /* CoachDiagnostic objects */ ]
}
```

**Why it's valuable**:
- Translates complex metrics into understandable language
- Prioritizes what matters most
- Integrates multiple analysis layers into one cohesive view

---

### 3. **Phase Consistency** (`phaseConsistency.ts`)
**Status**: ✅ Built, ❌ Not Exposed

**What it does**:
- Analyzes consistency across different phases of multiple runs
- Calculates average, spread, and consistency score per phase
- Identifies which phases are most/least consistent
- Helps pinpoint specific technique breakdown points

**Output Example**:
```typescript
[
  {
    phase: "0-3m",
    avg: 0.82,      // seconds
    spread: 0.12,   // max - min
    consistency: 85  // 0-100 score
  },
  {
    phase: "3-5m",
    avg: 0.45,
    spread: 0.08,
    consistency: 82
  }
]
```

**Why it's valuable**:
- Shows where technique breaks down in the run
- Helps identify training focus areas
- Reveals patterns not visible in overall times

---

### 4. **Technique Scoring** (`techniqueScoring.ts`)
**Status**: ✅ Built, ⚠️ Partially Exposed

**What it does**:
- Scores individual runs on multiple dimensions
- Provides 0-100 scores for:
  - Launch quality (reaction time)
  - Explosiveness (peak acceleration)
  - Speed carry (maintaining speed)
  - Smoothness (force delivery)
  - Impulse timing (force application timing)
  - Repeatability
- Includes text labels (excellent, good, developing, needs-work)

**Current Status**: 
- Used internally for session intelligence
- NOT displayed as standalone scores on analytics page

**Why it's valuable**:
- Gives riders specific, measurable technique metrics
- Enables tracking technique improvement over time
- More actionable than raw sensor data

---

### 5. **Full Session Analysis** (`analyseSession.ts`)
**Status**: ✅ Built, ❌ Not Fully Utilized

**What it does**:
- Complete physics analysis per run (speed curves, power estimates, impulse, jerk)
- Speed splits (time to 3m, 5m, 8m, peak)
- Data quality assessment
- Physics diagnostics (calibration warnings, blocking issues)
- Technique analysis
- Weaknesses identification
- Recommendations generation

**Current Status**:
- Available but NOT being called on analytics page
- Only used on individual session pages

**Why it's valuable**:
- Most comprehensive analysis available
- Provides foundation for all other insights
- Required for technique scores, diagnostics, and insights

---

### 6. **Phase Analysis** (`phaseAnalysis.ts`)
**Status**: ✅ Built, ❌ Not Exposed

**What it does**:
- Computes detailed phase breakdowns
- Analyzes acceleration and speed by phase
- Provides phase-by-phase performance metrics

**Why it's valuable**:
- Helps identify specific weaknesses in run phases
- More granular than overall metrics

---

### 7. **Front Wheel Lift Analysis** (`frontWheelLift.ts`)
**Status**: ✅ Built, ⚠️ Partially Exposed

**What it does**:
- Analyzes front wheel lift patterns
- Correlates wheelies with performance
- Currently only shown in WheeliePatternAnalysis component

**Current Exposure**: Basic wheelie data shown, but not full analysis

---

## 📊 What's Currently Exposed on Analytics Page

### ✅ Currently Working:
1. **Session Intelligence** (v7.2) - repeatability, fatigue, dropoff, best vs avg
2. **Cross-Session Intelligence** (v8.1, v8.2) - trends across sessions
3. **Session Narrative** (v8.3) - natural language session summaries
4. **BMX Threshold Ratings** - performance level ratings
5. **Raw Performance Trends** - reaction time, speed, G-force charts
6. **Correlation Insights** - pattern discovery
7. **Basic Performance Engine Charts**:
   - Technique Quality Trend (proxy using repeatability)
   - Data Quality Trend
   - Power Output Trend
   - Smoothness Trend
   - Wheelie Pattern Analysis

### ❌ Missing/Not Exposed:
1. **Coach Diagnostics** - actionable coaching insights
2. **Insight Builder** - comprehensive performance insight packs
3. **Phase Consistency** - phase-by-phase consistency analysis
4. **Full Technique Scores** - individual technique dimension scores
5. **Detailed Physics Analysis** - speed curves, impulse, jerk per session
6. **Phase Analysis** - detailed phase breakdowns
7. **Per-Session Full Analysis** - complete analyseSession output

---

## 🔧 What Data is Missing from Server

### Current Data Fetched:
```typescript
// From gate_runs table
reaction_time_ms, max_g, avg_g, peak_speed_ms, avg_speed_ms_calc,
time_to_peak_speed_ms, analytics_valid, max_pitch_deg,
front_wheel_lifted, bias_correction_ms2

// From runs table
elapsed_time_ms, distance_m

// From sessions table
session_type, weather_conditions, track_surface, session_focus
```

### Missing Data Needed:
```typescript
// From runs table - CRITICAL
chart_data  // Array of acceleration values - needed for ALL physics analysis

// From gate_runs table - Optional but valuable
speed_chart_data  // For detailed speed analysis
splits_data       // For phase consistency analysis
jerk_analysis     // If pre-computed
power_estimate    // If pre-computed
```

**Why chart_data is Critical**:
- Required for `analyseSession()` to work
- Needed for speed curves, power estimates, impulse, jerk
- Foundation for technique scoring and diagnostics
- Without this, most Performance Engine features can't run

---

## 🎯 Implementation Plan

### Phase 1: Data Layer (Server-Side)
**File**: `src/routes/(protected)/analytics/+page.server.ts`

1. **Fetch chart_data for runs**
   - Add `chart_data` to runs query
   - Consider pagination/limits for large sessions
   
2. **Fetch splits data if available**
   - Add `splits_data` to gate_runs query for phase consistency

3. **Add rider context**
   - Fetch rider weight, bike weight for power calculations
   - Already have bikes data, need to pass rider weight

### Phase 2: Analysis Layer (Server-Side)
**File**: `src/routes/(protected)/analytics/+page.server.ts`

1. **Run Full Session Analysis**
   - Call `analyseSession()` for latest N sessions
   - Extract technique scores using `scoreRunTechnique()`
   - Generate coach diagnostics using `buildCoachDiagnostics()`
   - Build insight packs using `buildPerformanceInsightPack()`

2. **Compute Phase Consistency**
   - Use `analysePhaseConsistency()` on runs with splits
   - Store results for display

3. **Pass to Client**
   - Add new fields to return object:
     - `sessionAnalyses` - full analyseSession outputs
     - `techniqueScores` - per-session technique scores
     - `coachDiagnostics` - aggregated diagnostics
     - `insightPacks` - insight builder outputs
     - `phaseConsistency` - phase consistency results

### Phase 3: Display Layer (Client-Side)
**File**: `src/routes/(protected)/analytics/+page.svelte`

Create new sections:

1. **Coach Diagnostics Section**
   - Display actionable insights with tone indicators
   - Show evidence and prescriptions
   - Filter by audience level

2. **Technique Score Dashboard**
   - Show all 6 technique dimensions
   - Trend over time
   - Compare to benchmarks

3. **Phase Consistency View**
   - Table or chart showing consistency per phase
   - Identify weak phases
   - Track improvement

4. **Insight Summary Cards**
   - Headline and summary from insight builder
   - Strengths and limiters lists
   - Next actions

### Phase 4: New Components (Optional)
Create reusable components if patterns emerge:
- `CoachDiagnosticsPanel.svelte`
- `TechniqueScoreCard.svelte`
- `PhaseConsistencyChart.svelte`
- `InsightSummaryCard.svelte`

---

## 📈 Expected Impact

### For Riders:
- **Clearer guidance**: Know exactly what to work on
- **Better tracking**: See technique improvements, not just times
- **Motivation**: Understand progress in multiple dimensions

### For Coaches:
- **Detailed insights**: Coach-level diagnostics without manual analysis
- **Pattern identification**: Spot technique issues automatically
- **Training planning**: Prescriptive recommendations

### For the Platform:
- **Differentiation**: Unique AI-powered coaching insights
- **Value proposition**: Far beyond basic timing systems
- **User engagement**: More reasons to upload and analyze sessions

---

## 🚦 Priority Recommendations

### High Priority (Do First):
1. ✅ **Fetch chart_data** - Enables everything else
2. ✅ **Run analyseSession** - Core analysis engine
3. ✅ **Display Coach Diagnostics** - Highest user value
4. ✅ **Show Technique Scores** - Clear, actionable metrics

### Medium Priority:
5. ⚠️ **Insight Builder Display** - Nice summary view
6. ⚠️ **Phase Consistency** - Advanced feature for serious users

### Lower Priority:
7. ⏸️ **Full Physics Dashboard** - Very technical, niche audience

---

## 💡 Quick Wins

### Minimum Viable Enhancement:
Just add these 3 things to the analytics page:

1. **Latest Session Coach Diagnostic** (1 card)
   - Run full analysis on most recent session
   - Show top diagnostic insight
   - Display evidence + next action

2. **Technique Score Trend** (1 chart)
   - Overall technique score over time
   - Simple line chart

3. **Strengths & Limiters** (2 lists)
   - From insight builder
   - Show top 3 of each

**Effort**: ~2-3 hours of implementation
**Impact**: Massive - exposes core AI coaching value

---

## 🔍 Example Use Cases

### Use Case 1: Rider Sees Diagnostic
**Current**: "Your best reaction time was 0.245s"
**Enhanced**: "⚠️ Reaction is ahead of drive force - You're reacting well, but first drive phase isn't producing enough acceleration. Next: Add first-pedal force drills."

### Use Case 2: Coach Reviews Analytics
**Current**: Manually review raw charts and calculate patterns
**Enhanced**: See automatic diagnostics like "Explosive start but poor speed carry" with evidence and prescriptions

### Use Case 3: Training Focus
**Current**: Guess what to work on based on best times
**Enhanced**: See specific limiters (e.g., "Smoothness: 58/100") and strengths to guide training

---

## 📋 Technical Considerations

### Performance:
- `analyseSession()` is compute-intensive
- Consider:
  - Only analyze latest 5-10 sessions
  - Cache results in database
  - Run analysis async if needed

### Data Volume:
- `chart_data` can be large (200-400 data points per run)
- Consider:
  - Lazy loading
  - Summary statistics instead of full arrays
  - Progressive enhancement

### User Experience:
- Phased rollout: Start with coach diagnostics
- Consider user level (show simpler insights to beginners)
- Progressive disclosure (expand to see details)

---

## ✅ Next Steps

1. **Decide scope**: Quick win vs. full implementation?
2. **Update server query**: Add chart_data fetch
3. **Integrate analyseSession**: Call on latest sessions
4. **Design display**: How to show diagnostics/insights?
5. **Implement**: Server changes, then client display
6. **Test**: Ensure performance is acceptable
7. **Document**: Update user guides with new features

---

## 📞 Questions to Answer

1. **Performance budget**: How many sessions to analyze? (Recommend: 5-10 latest)
2. **Audience level**: Default to 'rider' or make user-selectable?
3. **Display priority**: Which insights show first/most prominently?
4. **Mobile experience**: How to adapt dense information for mobile?
5. **Caching strategy**: Store analysis results in DB or compute on demand?

---

## Summary

The Performance Engine is a **powerful, underutilized asset**. The analytics page currently exposes maybe **30% of its capabilities**. The biggest missing pieces are:

1. **Coach Diagnostics** - The "AI coach" telling you what to work on
2. **Full Technique Scoring** - Six dimensions of technique, tracked over time
3. **Phase Consistency** - Where in the run are you inconsistent?

The **blocker** is that `chart_data` isn't being fetched from the database. Once that's available, the Performance Engine can provide genuinely unique, high-value insights that no competitor offers.

**Recommendation**: Start with a quick win - fetch chart_data, run analyseSession on the latest session, and display the top coach diagnostic. Then expand from there based on user feedback.
