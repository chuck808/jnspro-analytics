# Session Details Page - Current Assessment

## Overview
Generated: 5/2/2026, 3:50 PM
This is a comprehensive assessment of what currently exists on the Session Details page.

---

## Page Structure (In Order of Appearance)

### 1. **Session Header** (Lines 765-813)
- **Always Visible**
- **Data**: Session date, run count, bike name, UCI category
- **Controls**: Detail level dropdown (grom/rider/elite/coach), back to sessions link
- **Source**: Server-loaded session data

### 2. **Goal Progress Alert** (Lines 815-887)
- **Conditional**: Only when goals exist
- **Always Visible**: When condition met
- **Data**: Goal progress metrics, milestone indicators, progress bars
- **Source**: Server-loaded `data.goalProgress`

### 3. **Session Summary Stats** (Lines 889-922)
- **Grom View** (4 cards):
  - Total Runs, Wheelies, Best Max G, Avg Reaction
- **Rider/Elite/Coach View** (6 cards):
  - Best Reaction, Avg Reaction, Best Peak Speed, Best Max G, Consistency (CV%), Wheelie Runs
- **Source**: Server `data.sessionStats`

### 4. **Session Narrative** (Lines 924-1107)
- **Grom View**: Custom celebration layout
  - Hero metric (intelligent selection - reaction/speed/maxG/goal milestone)
  - Dynamic celebration badge (performance-based)
  - Session headline and impact
  - Next step action
- **Rider/Elite/Coach View**: Standard SessionNarrativeCard
  - Headline, impact, action
- **Source**: Performance Engine `sessionNarrative`

### 5. **Training Insights Panel** (Lines 1109-1127)
- **Gating**: rider/elite/coach only (hidden from grom)
- **Data**: Session intelligence from Performance Engine
  - Repeatability analysis
  - Fatigue detection
  - Best vs avg gap
  - Set length recommendations
  - Technique analysis
- **Source**: `performanceAnalysis.intelligence`
- **Component**: TrainingInsightsPanel (session + technique sections)

### 6. **All Runs Comparison Table** (Lines 1129-1172)
- **Gating**: Multi-run sessions only, rider/elite/coach only
- **Data**: Table showing all runs with reaction, elapsed, max G, peak speed, wheelie
- **Interactive**: Click row to select run
- **Source**: `data.runs`

### 7. **Run Selector** (Lines 1174-1205)
- **Gating**: Multi-run sessions only, rider/elite/coach only
- **Mobile**: Swipeable cards
- **Desktop**: Pill buttons
- **Function**: Select which run to view details for

### 8. **SessionPerformancePanel** (Lines 1209-1218) ⚠️ *I ADDED THIS*
- **Gating**: rider/elite/coach only
- **Data**: Full Performance Engine analysis
- **Features**:
  - Own detail level dropdown (grom/rider/elite/coach)
  - 4 key metrics with explanations
  - Insights section (tone-coded)
  - Next Actions
  - Charts (elite/coach only):
    - Acceleration Chart
    - Speed Chart (dual-axis)
    - Jerk Chart
    - Impulse Chart
    - Power Chart
- **Source**: Runs own `analyseSession()` call
- **Component**: SessionPerformancePanel.svelte

### 9. **G-Force Chart** (Lines 1237-1246)
- **Gating**: rider/elite/coach only
- **Data**: Chart showing G-force over time for selected run
- **Features**: Context insight card (elite/coach only)
- **Source**: `chartData` from Performance Engine
- **Rendering**: Chart.js canvas

### 10. **Performance Curves Chart** (Lines 1258-1271)
- **Gating**: elite/coach only, requires `analytics_valid`
- **Data**: Dual-axis showing speed (km/h) + acceleration (G) over time
- **Features**: 
  - Data quality badge
  - Context insight card
  - IMU estimation warning
- **Source**: `curve.speeds` and `chartData` from Performance Engine

### 11. **Force Application (Jerk) Chart** (Lines 1284-1309)
- **Gating**: elite/coach only, requires jerk data
- **Data**: Jerk profile over time with smoothness score
- **Features**:
  - Context insight card
  - Smoothness score progress bar
  - Insight text
- **Source**: `jerkProfile` from Performance Engine

### 12. **Run Metrics Panel** (Lines 1317-1345)
- **Gating**: rider/elite/coach only
- **Data**: 8 metric cards
  - Reaction time, Elapsed time
  - Max G-force, Avg G-force
  - Peak speed, End speed, Avg speed, Time to peak
- **Features**: Speed profile classification
- **Source**: Selected run data from Performance Engine

### 13. **Technique Scores Panel** (Lines 1347-1387)
- **Gating**: rider/elite/coach only, requires technique scores
- **Data**:
  - Overall score (gauge visualization)
  - 4 breakdown bars: Reaction, Explosiveness, Smoothness, Efficiency
- **Source**: `techniqueScores` from Performance Engine

### 14. **Technique Indicators Panel** (Lines 1389-1411)
- **Gating**: elite/coach only, requires pitch data
- **Data**: 6 metrics
  - Max pitch, Avg pitch, Pitch at peak G
  - Front wheel lift (yes/no), Time to wheelie, Wheelie duration
- **Source**: Selected gate run data

### 15. **Detailed Phase Analysis** (Lines 1416-1481)
- **Gating**: elite/coach only, requires phase metrics
- **Data**: 3 phase breakdown
  - Drive Phase: Duration, Peak accel, Time to peak, Efficiency
  - Transition Phase: Duration, Velocity at end, Efficiency
  - Velocity Phase: Duration, Peak velocity, Time to max, Maintenance
- **Features**: Technical assessment text
- **Source**: `phaseMetrics` (legacy phase analysis)

### 16. **Speed Splits Table** (Lines 1483-1509)
- **Gating**: elite/coach only, requires splits data
- **Data**: Acceleration splits table showing target speeds, times, distances, phases
- **Source**: `splits` from Performance Engine

---

## Key Observations

### Data Sources
1. **Performance Engine** (primary): ALL analytics data flows through `analyseSession()`
2. **Server**: Session metadata, goals, runs
3. **Legacy**: Only phase analysis (`phaseMetrics`) - marked TODO for migration

### Duplication Issues
1. **SessionPerformancePanel vs Standalone Charts**:
   - SessionPerformancePanel contains: Acceleration, Speed, Jerk, Impulse, Power charts
   - Standalone sections contain: G-Force (#9), Performance Curves (#10), Jerk (#11)
   - **Same data, duplicated presentation**

2. **Metrics**:
   - SessionPerformancePanel shows 4 dynamic metrics
   - Run Metrics Panel (#12) shows 8 fixed metrics
   - **Some overlap**

### Detail Level Gating
- **Grom**: Gets special views (celebration layout, simplified stats)
- **Rider**: Standard analytics views, no duplicate charts
- **Elite/Coach**: All charts and advanced analysis

### Missing from Assessment
Need to continue reading from line 1500+ to see:
- Cross-Run Progression
- Run Comparison  
- Performance Targets
- Data Drill Down
- G-Force Stability
- Power & Impulse panels
- Weaknesses
- Recommendations
- Advanced Analytics Section
- Report Generation

---

## Questions for User
1. Is SessionPerformancePanel supposed to be there, or was it removed in earlier work?
2. Should the duplicate charts (G-Force, Performance Curves, Jerk) be consolidated?
3. What was the original plan for merging/layering this data?
