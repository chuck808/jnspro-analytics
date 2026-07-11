# Analytics Page Evaluation

**Date:** May 1, 2026  
**Page Location:** `/analytics`  
**Component:** `src/routes/(protected)/analytics/+page.svelte`  
**Server Load:** `src/routes/(protected)/analytics/+page.server.ts`

---

## Executive Summary

The Analytics page is a sophisticated, multi-layered performance dashboard that presents both **session-level intelligence** and **cross-session trend analysis**. The page architecture deliberately separates these two analysis types to avoid mixing single-session insights with longitudinal data.

The page features a **progressive unlock system** based on session count, revealing more advanced analytics as users build training history.

---

## 1. Data Sources & Database Queries

### Primary Data Sources

All data originates from **Supabase** (PostgreSQL) via server-side loading:

#### 1.1 Sessions Data
```sql
SELECT id, timestamp, session_type
FROM sessions
WHERE user_id = :profile_id
  AND archived = false
  AND session_type = 'gate'
ORDER BY timestamp ASC
```

#### 1.2 Runs Data
```sql
SELECT id, session_id, elapsed_time_ms, distance_m
FROM runs
WHERE session_id IN (:session_ids)
```

#### 1.3 Gate Runs Data (Performance Metrics)
```sql
SELECT 
  run_id, 
  reaction_time_ms, 
  max_g, 
  avg_g, 
  peak_speed_ms, 
  avg_speed_ms_calc,
  time_to_peak_speed_ms,
  analytics_valid,
  max_pitch_deg,
  front_wheel_lifted,
  bias_correction_ms2
FROM gate_runs
WHERE run_id IN (:run_ids)
```

#### 1.4 Training Goals Data
```sql
SELECT metric, target_value, start_value, current_value, deadline
FROM training_goals
WHERE user_id = :profile_id
  AND completed_at IS NULL
```

### Data Processing Pipeline

**Server-side (+page.server.ts):**
1. Fetches sessions, runs, and gate_runs
2. Joins data into `sessionsWithRuns` structure
3. Computes per-session summary statistics (best, avg, CV%)
4. Calculates overall personal bests
5. Computes trend percentages (comparing recent 5 vs previous 5 sessions)
6. Returns structured data package

**Client-side (+page.svelte):**
1. Applies performance engine intelligence layers
2. Generates session intelligence reports (v7.2)
3. Generates cross-session intelligence (v8.1/v8.2)
4. Applies BMX threshold ratings
5. Builds session narratives (v8.3)

---

## 2. Insights & Visualizations Presented

### 2.1 Progressive Unlock System

The page uses a **depth-based system** that unlocks features based on session count:

| Session Count | Depth Level | Features Unlocked |
|---------------|-------------|-------------------|
| 0 | `none` | Empty state only |
| 1-2 | `minimal` | Session summaries, personal bests |
| 3-9 | `basic` | + Trend charts, consistency scoring, session comparison |
| 10-19 | `full` | + Full rolling analytics |
| 20+ | `advanced` | + Statistical analysis |

**Unlock Thresholds Displayed:**
- ✓ Session summaries (1+ sessions)
- ✓ Session comparison (2+ sessions)
- ✓ Trend charts (3+ sessions)
- ✓ Consistency scoring (3+ sessions)
- ✓ Full rolling analytics (10+ sessions)
- ✓ Statistical analysis (20+ sessions)

### 2.2 Performance Overview Section

**Type:** Mixed (session-level + cross-session)  
**Component:** `PerformanceOverview.svelte`

**Data Presented:**

1. **Performance Status Headline**
   - Source: Cross-session intelligence report
   - Examples:
     - "Consistency improving — X% better"
     - "Peak speed improving — X% faster"
     - "Performance holding steady"
   - Confidence level badge (High/Medium/Low)

2. **Recommended Actions**
   - Source: Cross-session intelligence engine
   - Top 3 actionable recommendations

3. **Session Quality Trend Mini-Chart**
   - Shows last 10 sessions' quality scores (0-10 scale)
   - Color-coded: Green (7+), Amber (5-6.9), Red (<5)

4. **Personal Bests Cards** (3 cards)
   - Best Reaction Time (all-time)
   - Best Peak Speed (all-time, estimated)
   - Best Max G (all-time)
   - Each includes BMX threshold rating (Excellent/Good/Caution/Poor)

### 2.3 Session Narrative Card (v8.3)

**Type:** Session-level  
**Component:** `SessionNarrativeCard.svelte`

**Data Presented:**
- Natural language summary of latest session
- Considers:
  - Run count
  - Consistency score
  - Reaction CV%
  - Fatigue detection
  - Drop-off point
  - Best vs avg gap

### 2.4 Training Insights Panel

**Type:** Hybrid (session + cross-session)  
**Component:** `TrainingInsightsPanel.svelte`

Deliberately separates two intelligence systems:

**Section A: "Today's Session" (v7.2 - Session Intelligence)**
- **Repeatability scores**
  - Overall consistency metric
  - Reaction time repeatability
  - Speed repeatability
- **Fatigue analysis**
  - Trend detection (stable/declining)
  - Drop-off run identification
- **Best vs Average gap**
  - Gap percentage
  - Interpretation (excellent <5%, good <15%)
- **Optimal Set Length**
  - Recommended run count before fatigue

**Section B: "Progress Over Time" (v8.1 - Cross-Session Intelligence)**
- **Consistency trends** (improving/declining/stable)
- **Speed progression**
- **Fatigue progression patterns**
- **Recommendations for training adjustments**

**Section C: "Launch & Control Analysis" (Technique Layer)**
- Wheelie analysis
- Front wheel lift patterns
- Data quality metrics
- Phase consistency
- Technique → outcome correlations

### 2.5 Performance Patterns Section

**Type:** Over-time (cross-session)  
**Component:** `PerformancePatternsSection.svelte`  
**Requires:** 3+ sessions

**4 Interactive Charts:**

1. **Best vs Average Gap Trend**
   - Line chart showing gap % over time
   - Lower gap = better consistency
   - Color-coded points: Green (<5%), Amber (5-15%), Red (15%+)
   - Y-axis reversed (lower is better)

2. **Optimal Set Length Trend**
   - Bar chart showing runs before fatigue
   - Color-coded: Green (8+), Amber (5-7), Red (<5)

3. **Drop-Off Position Trend**
   - Line chart showing where performance deteriorates
   - Later run number = better fatigue resistance
   - Color-coded: Green (8+), Amber (5-7), Red (<5)

4. **Speed vs Consistency Trade-Off**
   - Dual-axis overlay chart
   - Left Y-axis: Peak speed (km/h) - higher better
   - Right Y-axis: Reaction CV% - lower better (reversed)
   - Shows relationship between pushing speed and maintaining consistency

### 2.6 Raw Performance Trends Section

**Type:** Over-time (cross-session)  
**Component:** `RawPerformanceTrendsSection.svelte`  
**Requires:** 3+ sessions

**3 Interactive Charts:**

1. **Reaction Time Trend**
   - Line chart: Best + Average reaction times
   - Y-axis reversed (lower is better)
   - Optional: Goal target overlay line
   - Trend indicator: "X% improving/declining/stable"
   - Compares last 5 vs previous 5 sessions

2. **Peak Speed Trend**
   - Line chart: Best peak speed
   - Warning: "Estimated from IMU"
   - Optional: Goal target overlay line
   - Trend indicator based on 5-session comparison

3. **Reaction Consistency per Session**
   - Bar chart: CV% per session
   - Color-coded: Green (<2%), Amber (2-5%), Red (5%+)
   - Overall consistency score across all sessions

### 2.7 Goal Creation CTAs

**Type:** Dynamic prompts based on trends  
**Condition:** Trend detected + no active goal for that metric

**Examples:**
- "📈 Reaction Time Improving — X% faster — set a goal to stay motivated!"
- "⚡ Speed Increasing — +X% improvement — track your progress with a goal!"

---

## 3. Session-Level vs Over-Time Analysis

### Session-Level Data (Single Session Analysis)

**Sources:**
- Latest session only
- Individual run metrics within that session
- v7.2 Performance Engine: `analyseSessionIntelligence()`

**Metrics:**
- ✅ Session Quality Score (0-10)
- ✅ Repeatability (overall, reaction, speed)
- ✅ Fatigue trend (stable/declining)
- ✅ Drop-off run (where performance deteriorates)
- ✅ Best vs Avg gap (consistency within session)
- ✅ Optimal set length (before fatigue hits)
- ✅ Technique analysis (wheelies, data quality)

**Where Displayed:**
- Session Narrative Card ("Latest Session Analysis")
- Training Insights Panel → "Today's Session" section
- Performance Overview → contributes to latest session ratings

**Engine:** Performance Engine v7.2

---

### Over-Time Analysis (Cross-Session Trends)

**Sources:**
- All sessions in chronological order
- Session summary statistics aggregated over time
- v8.1/v8.2 Performance Engine: `analyseCrossSessionIntelligence()`

**Metrics:**
- ✅ Consistency trends (improving/declining/stable)
- ✅ Speed progression patterns
- ✅ Fatigue progression over weeks/months
- ✅ Pattern recognition (best vs avg gaps over time)
- ✅ Set length evolution
- ✅ Drop-off position trends
- ✅ Speed vs consistency trade-offs
- ✅ Comparative statistics (recent 5 vs previous 5)

**Where Displayed:**
- Performance Overview → headline + recommendations
- Training Insights Panel → "Progress Over Time" section
- Performance Patterns Section → all 4 charts
- Raw Performance Trends Section → all 3 charts

**Engine:** Performance Engine v8.1/v8.2 with Truth Rules

**Truth Rules Applied (v8.2):**
- Ensures cross-session insights don't contradict single-session data
- Validates trend confidence levels
- Applies statistical significance thresholds

---

## 4. Performance Engine Architecture

### v7.2 - Session Intelligence
**File:** `src/lib/performance-engine/sessionIntelligence.ts`

**Purpose:** Analyze individual session quality

**Inputs:** Array of runs from a single session

**Outputs:**
- Session quality score
- Repeatability analysis
- Fatigue detection
- Drop-off identification
- Best vs average metrics
- Optimal set length

### v8.1 - Cross-Session Intelligence
**File:** `src/lib/performance-engine/crossSession/crossSessionIntelligence.ts`

**Purpose:** Identify patterns across multiple sessions

**Inputs:** Array of session summaries with intelligence outputs

**Outputs:**
- Pattern detection (consistency, speed, fatigue)
- Trend analysis (improving/declining/stable)
- Recommendations
- Confidence levels

### v8.2 - Truth Rules
**File:** `src/lib/performance-engine/crossSession/truthRules.ts`

**Purpose:** Ensure cross-session reports don't contradict session-level data

**Applied to:** Cross-session intelligence output before display

### v8.3 - Session Narrative
**File:** `src/lib/performance-engine/sessionNarrative.ts`

**Purpose:** Generate natural language session summaries

**Inputs:** Session intelligence + metadata

**Outputs:** Human-readable narrative text

### BMX Threshold Ratings
**File:** `src/lib/performance-engine/thresholds/rateSessionMetrics.ts`

**Purpose:** Rate metrics against BMX performance standards

**Categories:**
- Excellent (elite level)
- Good (competitive)
- Caution (needs work)
- Poor (significant attention needed)

**Metrics Rated:**
- Reaction time
- Peak speed
- Peak G-force
- Repeatability
- Best vs avg gap

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                        │
│  ┌──────────┐  ┌──────┐  ┌────────────┐  ┌───────────────┐ │
│  │ sessions │  │ runs │  │ gate_runs  │  │ training_goals│ │
│  └──────────┘  └──────┘  └────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              +page.server.ts (Server-Side)                   │
│  • Fetches & joins data                                      │
│  • Computes session summaries (best, avg, CV)               │
│  • Calculates personal bests                                 │
│  • Computes 5-session trends                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               +page.svelte (Client-Side)                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SESSION-LEVEL ANALYSIS (v7.2)                        │  │
│  │  • analyseSessionIntelligence() per session           │  │
│  │  • Latest session report                              │  │
│  │  • Session narrative                                  │  │
│  │  • BMX threshold ratings                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CROSS-SESSION ANALYSIS (v8.1 + v8.2)                 │  │
│  │  • analyseCrossSessionIntelligence()                  │  │
│  │  • Pattern recognition                                │  │
│  │  • Truth rules validation                             │  │
│  │  • Recommendations                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                         │
│  ┌────────────────────┐  ┌──────────────────────────────┐  │
│  │ Performance        │  │ Training Insights Panel       │  │
│  │ Overview           │  │  • Session (v7.2)             │  │
│  │  • Headline        │  │  • Technique                  │  │
│  │  • Personal Bests  │  │  • Progress (v8.1)            │  │
│  │  • Quality Chart   │  └──────────────────────────────┘  │
│  └────────────────────┘                                     │
│  ┌────────────────────┐  ┌──────────────────────────────┐  │
│  │ Performance        │  │ Raw Performance Trends        │  │
│  │ Patterns           │  │  • Reaction chart             │  │
│  │  • 4 pattern charts│  │  • Speed chart                │  │
│  └────────────────────┘  │  • Consistency chart          │  │
│                          └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Key Technical Findings

### Strengths

1. **Clear Separation of Concerns**
   - Session-level and cross-session analyses kept separate
   - Prevents confusion between "today's performance" and "long-term trends"

2. **Progressive Disclosure**
   - Unlock system prevents overwhelming new users
   - Advanced analytics appear as data volume justifies them

3. **Server-Side Efficiency**
   - Heavy data processing on server
   - Reduces client-side computational load
   - Pre-computed summaries and trends

4. **Truth Rules Validation**
   - Cross-checks prevent contradictory insights
   - Maintains analytical integrity

5. **Goal Integration**
   - Charts overlay goal targets
   - Dynamic CTAs based on detected trends

6. **BMX-Specific Context**
   - Threshold ratings provide sport-specific benchmarks
   - Helps users understand "is this good?"

### Potential Improvements

1. **Data Source Documentation**
   - Could benefit from inline comments explaining calculation methods
   - Some derived metrics (CV%, trends) could be more explicitly documented

2. **Real-Time Updates**
   - Currently requires page refresh after new session upload
   - Could implement reactive subscriptions

3. **Export Functionality**
   - Has export button but evaluation scope didn't cover export formats

4. **Mobile Optimization**
   - Charts adapt to mobile but could benefit from touch-optimized interactions

---

## 7. Summary: Session-Level vs Over-Time

| Aspect | Session-Level | Over-Time |
|--------|--------------|-----------|
| **Time Scope** | Single session | Multiple sessions |
| **Purpose** | "How did today go?" | "Am I improving?" |
| **Engine** | v7.2 Session Intelligence | v8.1/v8.2 Cross-Session |
| **Data Source** | Individual runs within session | Session summaries |
| **Examples** | Fatigue within session, repeatability | Consistency trends, speed progression |
| **Sections** | Session Narrative, "Today's Session" panel | Performance Overview headline, Pattern charts, Trend charts |
| **Minimum Data** | 1 session with runs | 3+ sessions for trends |
| **UI Label** | "single session" badge | "cross-session" badge |

---

## 8. Metrics Dictionary

### Session-Level Metrics

| Metric | Description | Source | Good Range |
|--------|-------------|--------|-----------|
| **Session Quality** | Overall score 0-10 | v7.2 engine | 7+ |
| **Repeatability** | Consistency within session | v7.2 engine | >0.8 |
| **Drop-Off Run** | Run number where fatigue hits | v7.2 engine | 8+ |
| **Best vs Avg Gap %** | How close avg is to best | v7.2 engine | <5% excellent, <15% good |
| **Optimal Set Length** | Runs before fatigue | v7.2 engine | 8+ |
| **Reaction CV %** | Coefficient of variation | Server calculation | <2% excellent, <5% good |

### Over-Time Metrics

| Metric | Description | Source | Interpretation |
|--------|-------------|--------|----------------|
| **Consistency Trend** | improving/declining/stable | v8.1 engine | Improving preferred |
| **Speed Progression** | Change % over time | Server (5-session comparison) | Positive = better |
| **Reaction Trend** | Change % over time | Server (5-session comparison) | Negative = better (lower time) |
| **Personal Bests** | All-time best values | Server aggregation | Individual benchmarks |

---

## 9. Conclusion

The Analytics page is a **sophisticated, multi-layered dashboard** that successfully balances:

- **Immediate feedback** (session-level)
- **Long-term insights** (cross-session trends)
- **Progressive complexity** (unlock system)
- **Sport-specific context** (BMX thresholds)

**Data Source:** 100% Supabase (sessions, runs, gate_runs, training_goals tables)

**Analysis Split:**
- **~40% Session-Level** (v7.2 engine, latest session focus)
- **~60% Over-Time** (v8.1/v8.2 engine, trend analysis, charts)

The architecture deliberately avoids mixing these two types to maintain clarity and analytical integrity, with clear visual badges ("single session" vs "cross-session") helping users understand the scope of each insight.
