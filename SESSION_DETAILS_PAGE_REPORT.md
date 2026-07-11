# Session Details Page - Comprehensive Report

**Generated:** 5/1/2026  
**Page Location:** `src/routes/(protected)/sessions/[id]/+page.svelte`  
**Server Logic:** `src/routes/(protected)/sessions/[id]/+page.server.ts`

---

## 📋 Executive Summary

The Session details page is the most comprehensive and feature-rich page in the application. It provides an in-depth analysis of individual BMX gate training sessions, combining multiple analytics engines, data visualization layers, and intelligent reporting systems.

**Key Statistics:**
- **1,459 lines** of Svelte component code
- **330 lines** of server-side data processing
- **25+ distinct sections/components** displayed
- **4 analytics engines** integrated (Legacy, Performance Engine, Bridge System, Report Engine)
- **10+ data sources** (database tables, computed metrics, derived analytics)

---

## 🗂️ Page Structure Overview

### Navigation Flow
1. User navigates to `/sessions/[id]` where `[id]` is the session UUID
2. Server loads session data from database (`+page.server.ts`)
3. Page renders with all analytics computed client-side (`+page.svelte`)
4. Components reactively update based on selected run

---

## 📊 DATA SOURCES

### 1. Server-Side Data Loading (`+page.server.ts`)

#### Database Tables Queried:

**Sessions Table**
```sql
SELECT id, session_type, timestamp, notes, archived,
       bikes(...), rider_profiles(...)
FROM sessions
WHERE id = [sessionId] AND user_id = [userId]
```
- **Source:** Supabase `sessions` table
- **Related:** Joined with `bikes` and `rider_profiles`
- **Purpose:** Session metadata, bike configuration, rider demographics

**Runs Table**
```sql
SELECT id, run_number, elapsed_time_ms, distance_m, chart_data,
       gate_runs(...), run_timeseries(...)
FROM runs
WHERE session_id = [sessionId]
ORDER BY run_number ASC
```
- **Source:** Supabase `runs` table
- **Related:** Joined with `gate_runs` and `run_timeseries`
- **Purpose:** Individual run data, G-force timeseries, analytics results

**Training Goals**
```sql
SELECT id, metric, target_value, start_value, current_value, deadline
FROM training_goals
WHERE user_id = [userId] AND completed_at IS NULL
```
- **Source:** Supabase `training_goals` table
- **Purpose:** Active goals to check for improvements

**Recent Sessions (Advanced Analytics)**
```sql
SELECT id, timestamp FROM sessions
WHERE user_id = [userId] AND session_type = 'gate' AND archived = false
ORDER BY timestamp DESC LIMIT 30
```
- **Source:** Supabase `sessions` table
- **Purpose:** Cross-session trending and historical context

#### Computed Server-Side Metrics:

**Session Statistics** (`sessionStats` object):
- `run_count` - Total runs in session
- `best_reaction_ms` - Fastest reaction time across all runs
- `avg_reaction_ms` - Mean reaction time
- `best_peak_speed_ms` - Highest peak speed (if analytics valid)
- `avg_peak_speed_ms` - Mean peak speed
- `best_max_g` - Highest G-force recorded
- `reaction_cv` - Coefficient of variation for consistency
- `wheelie_count` - Number of runs with front wheel lift
- `has_valid_speed` - Boolean flag for speed data availability

**Goal Progress** (`goalProgress` array):
- Calculates improvements from this session
- Determines if improvements are significant (≥0.5%)
- Auto-creates milestones via `processGoalImprovements()`
- Returns progress percentages toward goal targets

**Advanced Analytics Data** (`advancedAnalytics` object):
- `sessions` - Summary metrics for last 30 sessions
- `allRuns` - Flattened array of all runs from recent sessions
- `sessionCount` - Total sessions available for analysis

---

### 2. Client-Side Computed Data (`+page.svelte`)

#### Reactive Derived State ($derived):

**From Server Data:**
- `selectedRun` - Currently selected run object
- `selectedGate` - Gate analytics for selected run
- `chartData` - G-force timeseries array
- `elapsedMs` - Run duration in milliseconds
- `riderLevel` - Rider skill level from profile
- `totalMassKg` - Rider weight + bike weight
- `profileComplete` - Boolean for weight/bike data presence

**Analytics Computations:**

1. **Speed Curve** (`curve`)
   - Function: `computeSpeedCurve()`
   - Source: `$lib/utils/analytics.ts`
   - Inputs: chartData, elapsedMs, bias_correction_ms2, peak_speed_ms
   - Returns: { times[], speeds[], distances[] }

2. **Speed Splits** (`splits`)
   - Function: `calculateSpeedSplits()`
   - Source: `$lib/utils/analytics.ts`
   - Inputs: curve, max speed
   - Returns: Array of { label, timeS, distanceM, phase }

3. **Data Quality** (`quality`)
   - Function: `assessDataQuality()`
   - Source: `$lib/utils/analytics.ts`
   - Inputs: bias_correction_ms2
   - Returns: { badge: 'excellent'|'good'|'fair'|'calibrate', color }

4. **Speed Profile** (`speedProfile`)
   - Function: `classifySpeedProfile()`
   - Source: `$lib/utils/analytics.ts`
   - Inputs: time_to_peak_speed_ms, elapsed_time_ms
   - Returns: String classification (e.g., "Front-loaded", "Balanced")

5. **Technique Scores** (`techniqueScores`)
   - Function: `scoreTechnique()`
   - Source: `$lib/utils/analytics.ts`
   - Inputs: reaction_time_ms, chartData, curve, riderLevel
   - Returns: { overall, reaction, explosiveness, smoothness, efficiency }

6. **Power Metrics** (`powerMetrics`)
   - Function: `estimatePower()`
   - Source: `$lib/utils/analytics.ts`
   - Inputs: chartData, curve, totalMassKg
   - Returns: { peakW, avgW }
   - **Blocked if:** No weight data available

7. **Impulse Analysis** (`impulse`)
   - Function: `analyseImpulse()`
   - Source: `$lib/utils/analytics.ts`
   - Inputs: chartData, elapsedMs, totalMassKg
   - Returns: { totalImpulse, timeToHalfImpulse, frontLoadedScore, impulseEfficiency }
   - **Blocked if:** No weight data available

8. **Jerk Profile** (`jerkProfile`)
   - Function: `computeJerk()`
   - Source: `$lib/utils/analyticsExtended.ts`
   - Inputs: chartData, elapsedMs
   - Returns: { data: { timeS, jerk }[], smoothnessScore, insight }

9. **Phase Metrics** (`phaseMetrics`)
   - Function: `computeDetailedPhases()`
   - Source: `$lib/utils/analyticsExtended.ts`
   - Inputs: chartData, elapsedMs
   - Returns: { drivePhase, transitionPhase, velocityPhase, technicalAssessment }

10. **Session Stability** (`sessionStability`)
    - Function: `computeSessionStability()`
    - Source: `$lib/utils/analyticsExtended.ts`
    - Inputs: All runs with chartData and elapsed_time_ms
    - Returns: Array of { runNumber, stability, isBest }

11. **Current Run Stability** (`currentStability`)
    - Function: `computeGForceStability()`
    - Source: `$lib/utils/analyticsExtended.ts`
    - Inputs: chartData, elapsedMs
    - Returns: Stability score for current run

12. **Stability Insight** (`stabilityInsight`)
    - Function: `getStabilityInsight()`
    - Source: `$lib/utils/analyticsExtended.ts`
    - Inputs: currentStability, sessionStability
    - Returns: Text insight about consistency

13. **Consistency Score** (`consistency`)
    - Function: `scoreConsistency()`
    - Source: `$lib/utils/analytics.ts`
    - Inputs: Array of reaction times
    - Returns: { cv: number, label: string }

#### Performance Engine Integration:

14. **Performance Analysis** (`performanceAnalysis`)
    - Function: `analyseSession()`
    - Source: `$lib/performance-engine`
    - Inputs: session object, rider config, selected run index
    - Returns: Comprehensive analysis object with runs[], summary, metrics

15. **Enhanced Analysis** (`enhancedAnalysis`)
    - Function: `integrateWithPerformanceEngine()`
    - Source: `$lib/performance-bridge/legacyIntegration.ts`
    - Purpose: Merges Performance Engine results with legacy analytics
    - Returns: Combined weaknesses and recommendations

16. **Session Intelligence** (`sessionIntelligence`)
    - Function: `analyseSessionIntelligence()`
    - Source: `$lib/performance-engine`
    - Inputs: Array of { reactionMs, peakSpeed, maxG }
    - Returns: { repeatability, fatigue, dropOff, bestVsAvg }

17. **Session Narrative** (`sessionNarrative`)
    - Function: `buildSessionNarrative()`
    - Source: `$lib/performance-engine/sessionNarrative.ts`
    - Inputs: Session metrics, quality ratings, feature flags
    - Returns: Natural language summary of session performance

18. **UCI Category** (`uciCategory`)
    - Function: `getUCICategory()`
    - Source: `$lib/utils/uciCategories.ts`
    - Inputs: date_of_birth
    - Returns: { name: string, ageRange: string }

#### Other Derived Data:

- `progressionData` - Per-run metrics for cross-run progression chart
- `comparisonRuns` - Formatted data for run comparison table
- `drillDownData` - Time-series data for drill-down component
- `weaknesses` - Areas scoring below threshold (from enhancedAnalysis)
- `recommendations` - Prioritized improvement actions (from enhancedAnalysis)
- `sessionDate` - Formatted date string for display

---

## 🎨 DISPLAYED SECTIONS

### Section 1: Session Header
**Location:** Lines 598-625  
**Purpose:** Session metadata and navigation  
**Data Sources:**
- `session.timestamp` → formatted as sessionDate
- `sessionStats.run_count`
- `session.bikes.name`
- `uciCategory.name` (if rider DOB available)

**Display:**
- "Gate Session" badge
- UCI category badge (if applicable)
- Session date (formatted: "Friday, 1st May 2026")
- Run count + bike name
- "All sessions" back link

---

### Section 2: Goal Progress Alert
**Location:** Lines 627-698  
**Purpose:** Show achievements and goal tracking  
**Data Sources:**
- Server: `data.goalProgress` array
- Server: `data.hasActiveGoals` boolean

**Conditional Display:**
- **If progress exists:** Green success banner with progress bars
  - Each goal shows: metric label, improvement amount, % to target, milestone badge (if significant)
  - Link to /goals page
- **If no active goals:** Amber call-to-action to create first goal
  - Link to /goals page with create button

---

### Section 3: Session Summary Stats
**Location:** Lines 701-716  
**Purpose:** 6 key metrics at-a-glance  
**Data Sources:**
- `sessionStats.best_reaction_ms`
- `sessionStats.avg_reaction_ms`
- `sessionStats.best_peak_speed_ms` (grayed if invalid)
- `sessionStats.best_max_g`
- `consistency.cv` (coefficient of variation)
- `sessionStats.wheelie_count`

**Display:** 2×3 grid (responsive) of metric cards

---

### Section 4: Session Narrative Card (v8.3)
**Location:** Lines 718-735  
**Purpose:** Natural language session summary  
**Data Sources:**
- `sessionNarrative` (derived from buildSessionNarrative)
- Inputs: runCount, consistencyScore, reactionCV%, dataQuality, speed/power blocked flags, fatigue detection

**Display:**
- "Session Summary" header
- Natural language message with headline, impact, action, watch-for items
- Confidence indicator
- Styled as conversational insight

**Only shows if:** `sessionNarrative` is not null

---

### Section 5: Training Insights Panel
**Location:** Lines 737-755  
**Purpose:** Performance Engine insights - session + technique only  
**Component:** `TrainingInsightsPanel` from `$lib/components/performance-insights`  
**Data Sources:**
- `sessionIntelligence` (from analyseSessionIntelligence)
- `data.runs` (mapped to simplified format)

**Display Sections:**
- Session Analysis: repeatability, fatigue, drop-off detection
- Technique Analysis: reaction quality, explosiveness, smoothness
- **NOT shown:** Progress section (showProgressSection={false})

**Only shows if:** `sessionIntelligence` is not null

---

### Section 6: All Runs Comparison Table
**Location:** Lines 758-800  
**Purpose:** Overview of all runs in session  
**Data Sources:**
- `data.runs` array
- Each run: run_number, reaction_time_ms, elapsed_time_ms, max_g, peak_speed_ms, front_wheel_lifted

**Display:**
- Table with columns: Run, Reaction, Elapsed, Max G, Peak Speed, Wheelie
- Rows are clickable/keyboard accessible to select run
- Selected run highlighted in amber
- Speed grayed out if analytics_invalid

**Only shows if:** `data.runs.length > 1`

---

### Section 7: Run Selector (Mobile Swipeable / Desktop Pills)
**Location:** Lines 803-833  
**Purpose:** Select which run to analyze in detail  
**Component:** `SwipeableRunSelector` (mobile) or button pills (desktop)  
**Data Sources:** `data.runs` array

**Display:**
- **Mobile (<640px):** Swipeable carousel
- **Desktop:** Horizontal pill buttons with run number + reaction time
- Selected run highlighted in amber

**Only shows if:** `data.runs.length > 1`

---

### Section 8: Performance Engine Panel
**Location:** Lines 838-846  
**Purpose:** Comprehensive Performance Engine analysis  
**Component:** `SessionPerformancePanel`  
**Data Sources:**
- `data.session`
- `data.runs`
- `data.riderWeight`, `data.bikeWeight`, `data.crankLength`
- `selectedRunIdx`

**Display:**
- Performance metrics from unified engine
- Contextual insights
- Benchmarked scores

**Only shows if:** `selectedRun && selectedGate` exist

---

### Section 9: Charts (Left Column)
**Location:** Lines 849-909  
**Purpose:** Visual representation of run data  
**Data Sources:**
- `chartData` - G-force array
- `curve` - Speed curve (if analytics valid)
- `jerkProfile` - Jerk analysis

**Charts Displayed:**

**9a. G-Force Chart**
- Library: Chart.js
- Type: Line chart
- X-axis: Time (seconds)
- Y-axis: G-force
- Color: Amber (#f5a623)
- Always shown if chartData exists

**9b. Performance Curves (Speed + Acceleration)**
- Library: Chart.js
- Type: Dual-axis line chart
- Left Y-axis: Speed (km/h) - Orange
- Right Y-axis: Accel (G) - Amber (semi-transparent)
- Shows data quality badge
- Bias correction warning
- **Only if:** `analytics_valid === true`

**9c. Force Application (Jerk)**
- Library: Chart.js
- Type: Line chart
- Y-axis: Jerk (m/s³)
- Color: Teal (#3de8c8)
- Shows smoothness score (0-100) with progress bar
- Shows insight text
- **Only if:** `jerkProfile.data.length > 0`

---

### Section 10: Run Metrics (Right Column)
**Location:** Lines 916-944  
**Purpose:** Numeric metrics for selected run  
**Data Sources:**
- `selectedGate` object (all gate_runs fields)
- `selectedRun` object (elapsed_time_ms)

**Metrics Displayed (2×4 grid):**
1. Reaction time (highlighted in amber)
2. Elapsed time
3. Max G-force
4. Avg G-force
5. Peak speed (grayed if invalid)
6. End speed (grayed if invalid)
7. Avg speed (grayed if invalid)
8. Time to peak

**Plus:** Speed profile classification (if valid)

---

### Section 11: Technique Scores
**Location:** Lines 946-986  
**Purpose:** Multi-dimensional technique assessment  
**Data Sources:**
- `techniqueScores` (from scoreTechnique function)
- Benchmarked against `riderLevel`

**Display:**
- Circular gauge showing overall score (0-100)
- 4 horizontal progress bars:
  - Reaction
  - Explosiveness
  - Smoothness
  - Efficiency
- Color-coded by score threshold:
  - ≥80: Teal (excellent)
  - ≥60: Amber (good)
  - ≥40: Yellow (fair)
  - <40: Red (needs work)

**Only shows if:** `techniqueScores` exists (requires chartData)

---

### Section 12: Technique Indicators
**Location:** Lines 988-1010  
**Purpose:** IMU orientation data  
**Data Sources:**
- `selectedGate.max_pitch_deg`
- `selectedGate.avg_pitch_deg`
- `selectedGate.pitch_at_peak_g_deg`
- `selectedGate.front_wheel_lifted`
- `selectedGate.time_to_wheelie_ms`
- `selectedGate.wheelie_duration_ms`

**Display:** 2×3 grid of metrics with warning note

**Only shows if:** `max_pitch_deg !== null`

---

### Section 13: Detailed Phase Analysis
**Location:** Lines 1015-1080  
**Purpose:** Break down start into 3 phases  
**Data Sources:**
- `phaseMetrics` (from computeDetailedPhases)

**Display:** 3 cards (Drive / Transition / Velocity)

**Drive Phase (Amber):**
- Duration (s)
- Peak acceleration (m/s²)
- Time to peak (s)
- Efficiency (%)

**Transition Phase (Yellow):**
- Duration (s)
- Velocity at end (m/s)
- Efficiency (%)

**Velocity Phase (Teal):**
- Duration (s)
- Peak velocity (m/s)
- Time to max (s)
- Maintenance score (%)

**Plus:** Technical assessment text at bottom

**Only shows if:** `phaseMetrics` exists

---

### Section 14: Acceleration Splits Table
**Location:** Lines 1082-1109  
**Purpose:** Show time/distance to reach speed milestones  
**Data Sources:**
- `splits` array (from calculateSpeedSplits)

**Display:** Table with columns:
- Target (50%, 75%, 90%, 95%, 100% of peak speed)
- Time (seconds)
- Distance (meters)
- Phase classification

**Only shows if:** `splits.length > 0` (requires valid analytics)

---

### Section 15: Cross-Run Progression
**Location:** Lines 1114-1116  
**Purpose:** Visualize progression across all runs  
**Component:** `CrossRunProgression`  
**Data Sources:**
- `progressionData` (derived from all runs)
- Per run: runNumber, reactionMs, maxG, peakSpeedKmh

**Only shows if:** `data.runs.length > 1`

---

### Section 16: Run Comparison
**Location:** Lines 1119-1121  
**Purpose:** Compare runs side-by-side  
**Component:** `RunComparison`  
**Data Sources:**
- `comparisonRuns` (derived from all runs)
- Includes speedProfile classification per run

**Only shows if:** `data.runs.length > 1`

---

### Section 17: Performance Targets
**Location:** Lines 1124-1129  
**Purpose:** Show benchmarks vs current performance  
**Component:** `PerformanceTargets`  
**Data Sources:**
- `selectedGate.reaction_time_ms`
- `selectedGate.max_g`
- `techniqueScores.overall`
- `riderLevel`

**Display:** Comparison vs level-appropriate targets

**Always shown** (when run selected)

---

### Section 18: Data Drill-Down
**Location:** Lines 1132-1138  
**Purpose:** Downloadable/inspectable raw data  
**Component:** `DataDrillDown`  
**Data Sources:**
- `drillDownData` (time-series with timestamps)
- Metric: "G-Force"

**Always shown** (when run selected)

---

### Section 19: G-Force Stability
**Location:** Lines 1141-1169  
**Purpose:** Visual comparison of first 500ms across runs  
**Data Sources:**
- `sessionStability` array (from computeSessionStability)
- `stabilityInsight` text

**Display:**
- Bar chart showing average G in first 0.5s per run
- Amber = best run
- Highlighted = selected run
- Text insight explaining pattern

**Only shows if:** `sessionStability.length > 1`

---

### Section 20: Power Output & Impulse Analysis
**Location:** Lines 1172-1232  
**Purpose:** Estimate power and force distribution  
**Data Sources:**
- `powerMetrics` (from estimatePower)
- `impulse` (from analyseImpulse)
- `totalMassKg` (rider + bike weight)

**Display:** 2-column grid

**Power Output Card:**
- Peak power (W)
- Average power (W)
- Total mass note

**Impulse Analysis Card:**
- Total impulse (N·s)
- Efficiency (N·s/s)
- 50% impulse time (s)
- Front-load ratio (0-1)
- Visual slider showing distribution

**Blocked if:** No weight data available (shows CTA to complete profile)

**Only shows if:** Weight data exists OR shows locked message

---

### Section 21: Areas for Improvement (Weaknesses)
**Location:** Lines 1235-1260  
**Purpose:** Highlight below-threshold metrics  
**Data Sources:**
- `weaknesses` array (from enhancedAnalysis.legacyIntegration)
- Filtered to scores < threshold for rider level

**Display:**
- Card per weakness
- Area name
- Score (0-100) with color coding
- Advice bullets (actionable tips)

**Only shows if:** `weaknesses.length > 0`

---

### Section 22: Recommendations
**Location:** Lines 1263-1284  
**Purpose:** Prioritized action items  
**Data Sources:**
- `recommendations` array (from enhancedAnalysis.legacyIntegration)

**Display:**
- Card per recommendation
- Priority badge (HIGH/MEDIUM/LOW) with color coding
- Title
- Message (actionable text)

**Only shows if:** `recommendations.length > 0`

---

### Section 23: Advanced Analytics Panel
**Location:** Lines 1288-1294  
**Purpose:** Cross-session trending and context  
**Component:** `AdvancedAnalyticsSection`  
**Data Sources:**
- `data.advancedAnalytics.sessions` (last 30 sessions summary)
- `data.advancedAnalytics.allRuns` (all runs from recent sessions)
- `data.advancedAnalytics.sessionCount`

**Display:**
- Historical performance trends
- Personal bests context
- Improvement trajectories

**Always shown** (cross-session analysis)

---

### Section 24: Report Generation Button
**Location:** Lines 1296-1323  
**Purpose:** Trigger professional report creation  
**Display:**
- Large card button with icon
- "Generate Session Report" heading
- "Create professional coaching report" subtitle

**Opens:** Report options modal

**Always shown**

---

### Section 25: Report Options Modal
**Location:** Lines 1328-1437  
**Purpose:** Configure report settings  
**Component:** `ReportOptionsPanel`  
**Data Sources:**
- `data.goalProgress` (for includeGoals option)

**Options:**
- `reportType`: 'coach-session' (currently only option)
- `detailLevel`: 'simple' | 'standard' | 'coach' | 'technical'
- `includeCharts`: boolean
- `includeDiag`: boolean (diagnostics)
- `includeAppendix`: boolean (raw metrics)
- `includeGoals`: boolean (if active goals exist)

**What's Included Preview:**
- Executive summary
- Quality metrics
- Technique breakdown
- Optional: charts, diagnostics, appendix

**Shows if:** `showReportOptions === true`

---

### Section 26: Report Preview Modal
**Location:** Lines 1440-1457  
**Purpose:** Display generated report  
**Component:** `ReportPreview`  
**Data Sources:**
- `report` object (from buildCoachSessionReport)

**Generated via:** `generateReport()` function
- Uses `createAnalysisView()` for coaching language
- Merges Performance Engine + legacy analytics
- Builds structured report with sections

**Shows if:** `showReport === true && report !== null`

---

### Section 27: Help Panel
**Location:** Line 1459  
**Purpose:** Contextual help system  
**Component:** `HelpPanel`  
**Data Sources:** `helpKey` (topic identifier)

**Topics Available:**
- gForce
- speedAnalysis
- reactionTime
- techniqueScore
- phaseAnalysis
- powerEstimate

**Triggered by:** HelpButton clicks throughout page

---

## 🔧 ANALYTICS ENGINES & SYSTEMS

### 1. Legacy Analytics (`$lib/utils/analytics.ts`)
**Functions Used:**
- `computeSpeedCurve()` - Speed estimation from G-force
- `calculateSpeedSplits()` - Time/distance to speed milestones
- `assessDataQuality()` - IMU calibration quality
- `classifySpeedProfile()` - Acceleration pattern classification
- `scoreTechnique()` - Multi-factor technique scoring
- `estimatePower()` - Power estimation from acceleration
- `scoreConsistency()` - CV-based repeatability
- `analyseImpulse()` - Force-time analysis

**Purpose:** Original analytics layer, still used for detailed metrics

---

### 2. Extended Analytics (`$lib/utils/analyticsExtended.ts`)
**Functions Used:**
- `computeJerk()` - Rate of change of acceleration
- `computeDetailedPhases()` - Drive/Transition/Velocity breakdown
- `computeSessionStability()` - Cross-run consistency
- `computeGForceStability()` - First 500ms average G
- `getStabilityInsight()` - Natural language stability summary
- `gaugeArcPath()` - SVG path for circular gauges

**Purpose:** Advanced biomechanical analysis

---

### 3. Performance Engine (`$lib/performance-engine`)
**Functions Used:**
- `analyseSession()` - Comprehensive session analysis
- `analyseSessionIntelligence()` - Repeatability, fatigue, drop-off detection
- `buildSessionNarrative()` - Natural language summaries
- `createAnalysisView()` - Coaching language generator

**Purpose:** Unified analytics with intelligent insights

---

### 4. Performance Bridge (`$lib/performance-bridge/legacyIntegration.ts`)
**Functions Used:**
- `integrateWithPerformanceEngine()` - Merge Performance Engine + legacy
- `createUnifiedInsightSummary()` - Combined insights
- `extractPerformanceEngineDataForLegacy()` - Data adapter

**Purpose:** Bridge between old and new analytics systems

---

### 5. Report Engine (`$lib/report-engine`)
**Functions Used:**
- `buildCoachSessionReport()` - Generate professional reports

**Purpose:** Create shareable, printable coaching reports

---

## 📈 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────┐
│  SERVER LOAD (+page.server.ts)                      │
│                                                      │
│  1. Load session from DB                            │
│  2. Load runs + gate_runs + timeseries              │
│  3. Load training goals                             │
│  4. Load recent 30 sessions for advanced analytics  │
│  5. Compute session stats                           │
│  6. Check goal improvements → auto-create milestones│
│  7. Return PageData object                          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  CLIENT RENDER (+page.svelte)                       │
│                                                      │
│  REACTIVE LAYER ($derived)                          │
│  ├─ Select run (user choice)                        │
│  ├─ Extract chartData, elapsedMs                    │
│  │                                                   │
│  LEGACY ANALYTICS                                   │
│  ├─ computeSpeedCurve()                            │
│  ├─ calculateSpeedSplits()                         │
│  ├─ scoreTechnique()                               │
│  ├─ estimatePower()                                │
│  └─ analyseImpulse()                               │
│                                                     │
│  EXTENDED ANALYTICS                                 │
│  ├─ computeJerk()                                  │
│  ├─ computeDetailedPhases()                        │
│  └─ computeSessionStability()                      │
│                                                     │
│  PERFORMANCE ENGINE                                 │
│  ├─ analyseSession()                               │
│  ├─ analyseSessionIntelligence()                   │
│  └─ buildSessionNarrative()                        │
│                                                     │
│  BRIDGE LAYER                                       │
│  └─ integrateWithPerformanceEngine()               │
│      ├─ Combine weaknesses                         │
│      └─ Merge recommendations                      │
│                                                     │
│  COMPONENTS                                         │
│  ├─ Charts (Chart.js)                              │
│  ├─ SessionPerformancePanel                        │
│  ├─ TrainingInsightsPanel                          │
│  ├─ CrossRunProgression                            │
│  ├─ RunComparison                                  │
│  ├─ PerformanceTargets                             │
│  ├─ DataDrillDown                                  │
│  ├─ AdvancedAnalyticsSection                       │
│  └─ Report System                                  │
│                                                     │
│  USER INTERACTIONS                                  │
│  ├─ Select run → updates all derived values        │
│  ├─ Generate report → buildCoachSessionReport()    │
│  ├─ Open help → shows HelpPanel                    │
│  └─ Navigate back → /sessions                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 KEY FEATURES

### ✅ Multi-Level Analysis
- **Run-level:** Individual run detailed metrics
- **Session-level:** Cross-run patterns and consistency
- **Historical:** 30-session trending and context

### ✅ Intelligent Insights
- Natural language narratives
- Coaching recommendations
- Weakness detection
- Fatigue monitoring
- Drop-off detection

### ✅ Goal Integration
- Auto-detects improvements
- Creates milestones
- Shows progress alerts
- Links to goal management

### ✅ Professional Reporting
- Multiple detail levels (simple/standard/coach/technical)
- Customizable sections
- Print/PDF ready
- JSON export option

### ✅ Accessibility
- Keyboard navigation
- ARIA labels
- Screen reader support
- Focus management

### ✅ Responsive Design
- Mobile swipeable selectors
- Desktop multi-column layouts
- Adaptive chart sizes
- Touch-friendly controls

---

## 🚫 BLOCKED FEATURES

### Power & Impulse Analysis
**Requires:**
- Rider weight (from profile)
- Bike weight (from bike setup)

**Shows:** "Power analytics locked" CTA to complete profile

### Speed Metrics
**Requires:**
- Valid IMU calibration (`analytics_valid === true`)
- Bias correction within acceptable range

**Shows:** Grayed out values with "—" placeholder

---

## 📊 DATABASE SCHEMA DEPENDENCIES

### Required Tables:
1. `sessions` - Core session data
2. `runs` - Individual run records
3. `gate_runs` - Gate analytics results
4. `run_timeseries` - G-force timeseries data
5. `bikes` - Bike configuration
6. `rider_profiles` - Rider demographics and preferences
7. `training_goals` - Active goal tracking
8. `tire_library` - Tire specifications (via bikes FK)

### Optional but Enhanced:
- `goal_milestones` - Auto-created on improvements
- Historical session data for trending

---

## 🔄 REAL-TIME REACTIVITY

All analytics are computed **reactively** using Svelte's `$derived` runes:

1. User selects different run → `selectedRunIdx` changes
2. All derived values automatically recompute
3. Charts re-render via `$effect`
4. Components receive new props and update
5. No manual state management required

**Performance:** Efficient - only recomputes what changed

---

## 💡 FUTURE ENHANCEMENT OPPORTUNITIES

1. **Video Integration** - Sync video playback with chart timeline
2. **Comparison Mode** - Side-by-side run comparison
3. **Export Data** - CSV/JSON download of raw data
4. **Social Sharing** - Share achievements on social media
5. **Coach Comments** - Add coach feedback to reports
6. **AI Insights** - ML-powered pattern recognition
7. **Peer Benchmarking** - Compare with similar riders (anonymized)
8. **Training Plans** - Link weaknesses to training programs

---

## 📝 SUMMARY

The Session details page is a comprehensive, multi-layered analytics platform that combines:

- **4 analytics engines** working in harmony
- **25+ sections** providing different perspectives
- **10+ data sources** from database and computations
- **Real-time reactivity** for smooth user experience
- **Professional reporting** for coaches and riders
- **Goal integration** for progress tracking
- **Cross-session intelligence** for historical context

**Data originates from:**
1. Supabase database (sessions, runs, goals, bikes, profiles)
2. Client-side computations (speed curves, technique scores, power estimates)
3. Performance Engine (unified analysis, narratives, insights)This is a question not a code request. To merge the legacy, bridge and performance engine
4. Bridge system (integration of old + new analytics)
5. Report engine (professional document generation)

**All data flows reactively** from server → client → analytics → components → UI, with efficient updates when users interact with the page.

---

**Report Complete** ✅
