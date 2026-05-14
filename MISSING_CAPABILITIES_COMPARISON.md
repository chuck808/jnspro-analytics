# Performance Engine Capabilities - Missing Features by Section

## Overview

This document clearly separates what's missing from each section without duplication:
- **Session/Run Analysis** = Individual session deep dive (single-session context)
- **Analytics** = Trends over time (cross-session context)

---

## 🔵 SESSION/RUN ANALYSIS SECTION
### (Routes: `/sessions/[id]`, `/sessions/[id]/analysis`, `/sessions/[id]/detail`)

**Context:** Deep dive into a SINGLE session's performance
**Current Status:** ✅ Uses Performance Engine, ❌ Missing display features

### Missing Capabilities (Single-Session Focus):

#### 1. **Coach Diagnostics** ❌ HIGH PRIORITY
**What:** Evidence-based coaching insights for THIS session
- "Reaction is ahead of drive force - add first-pedal force drills"
- Tone indicators (positive/warning/neutral)
- Evidence list
- Prescription/next steps
- Tailored by rider level

**Why here:** Session-specific coaching feedback
**Not for Analytics:** Too detailed for cross-session view

---

#### 2. **Full Technique Score Breakdown** ❌ HIGH PRIORITY
**What:** All 6 dimensions for THIS session's best run
- Launch Quality: 85/100 (Excellent) 🟢
- Explosiveness: 72/100 (Good) 🟡
- Speed Carry: 68/100 (Developing) 🟠
- Smoothness: 58/100 (Needs Work) 🔴
- Impulse Timing: 78/100 (Good) 🟡
- Repeatability: 65/100 (Developing) 🟠

**Why here:** Detailed per-session technique analysis
**Not for Analytics:** Analytics should show TRENDS of these scores, not detailed breakdown

---

#### 3. **Strengths & Limiters (Session-Specific)** ❌ HIGH PRIORITY
**What:** What went well/poorly in THIS session
- Strengths: "Launch Reaction", "Speed Carry" (green badges)
- Limiters: "Smoothness", "First-drive force" (red badges)

**Why here:** Session-specific feedback
**Not for Analytics:** Analytics shows PATTERNS of strengths/weaknesses over time

---

#### 4. **Technique Score Labels** ❌ HIGH PRIORITY
**What:** Text descriptions for scores
- Instead of "82" show "82/100 — Excellent"
- Color coding by performance level
- Benchmarks context (e.g., "Excellent for Club level")

**Why here:** Help riders understand their single-session performance
**Not for Analytics:** Analytics uses labels differently (trend descriptions)

---

#### 5. **Run Comparison Table (Within Session)** ❌ MEDIUM PRIORITY
**What:** Matrix comparing ALL runs in THIS session

| Run | Overall | Launch | Explosive | Speed Carry | Smoothness |
|-----|---------|--------|-----------|-------------|------------|
| 1   | 78      | 85     | 72        | 80          | 68         |
| 2   | 82      | 87     | 78        | 84          | 72         |
| 3   | 76      | 83     | 70        | 78          | 70         |

**Why here:** Compare runs within single session
**Not for Analytics:** Analytics compares SESSIONS, not runs

---

#### 6. **Benchmark Comparison (Session Metrics)** ❌ MEDIUM PRIORITY
**What:** Show where THIS session's metrics fall on benchmark scale
- "Your reaction time: 0.245s (Excellent for Club level)"
- Visual bars showing position on scale

**Why here:** Contextualize single session performance
**Not for Analytics:** Analytics shows how benchmarks have been met OVER TIME

---

#### 7. **Speed Profile Badge** ❌ MEDIUM PRIORITY
**What:** Classification of THIS run's acceleration pattern
- "🚀 Front-loaded acceleration"
- "⚡ Late-phase acceleration"
- "📈 Sustained acceleration"

**Why here:** Describe specific run characteristics
**Not for Analytics:** Could track distribution of profiles over time

---

#### 8. **Impulse Metrics Summary Cards** ❌ MEDIUM PRIORITY
**What:** Key impulse stats for THIS session as stat cards (not just chart)
- Time to 50% impulse: 0.4s
- Time to 90% impulse: 1.2s
- Impulse efficiency: 87/100
- Front-loaded score: 82/100

**Why here:** Session-specific physics metrics
**Not for Analytics:** Analytics would show impulse trends, not absolute values

---

#### 9. **Phase Consistency (Within Session)** ❌ LOW PRIORITY
**What:** Consistency of phases across runs in THIS session
- Which phases (0-3m, 3-5m, 5-8m) were most consistent
- Identify where technique broke down

**Why here:** Within-session consistency analysis
**Not for Analytics:** Analytics would show how phase consistency evolves

---

#### 10. **Front Wheel Lift Detailed Analysis** ❌ LOW PRIORITY
**What:** Impact of wheelies in THIS session
- Did wheelies help or hurt performance?
- Controlled vs excessive lift
- Correlation with reaction time

**Why here:** Session-specific wheelie analysis
**Not for Analytics:** Analytics shows wheelie PATTERNS over time

---

### Session Section Summary:
**Focus:** Deep, detailed analysis of SINGLE session
**Missing:** Primarily DISPLAY issues - data is computed but not shown
**Effort:** Low (1-3 hours) - just expose computed data
**Impact:** High - much more actionable single-session insights

---

## 🟢 ANALYTICS SECTION
### (Route: `/analytics`)

**Context:** Trends and patterns ACROSS multiple sessions
**Current Status:** ❌ Doesn't use Performance Engine, ❌ Missing fundamental data

### Missing Capabilities (Cross-Session Focus):

#### 1. **Per-Session Full Analysis** ❌ CRITICAL BLOCKER
**What:** Run `analyseSession()` for EACH session (last 5-10)
- Currently: Only using session intelligence (lightweight)
- Needed: Full Performance Engine analysis per session

**Why here:** Foundation for all cross-session insights
**Not for Sessions:** Session page already does this for single session

**Blocker:** Need to fetch `chart_data` from database

---

#### 2. **Technique Score Trends** ❌ HIGH PRIORITY
**What:** Track technique scores OVER TIME across sessions
- Overall technique trend line
- Individual dimension trends (launch, explosiveness, speed carry, smoothness, impulse timing, repeatability)
- Identify which dimensions are improving/declining

**Why here:** Show progress over time
**Not for Sessions:** Session page shows single-session scores

**Example:**
```
Session 1: Overall 72, Launch 85, Explosive 65
Session 2: Overall 76, Launch 87, Explosive 70
Session 3: Overall 78, Launch 86, Explosive 75
→ Trend: Explosiveness improving (+15% over 3 sessions)
```

---

#### 3. **Coach Diagnostics Aggregation** ❌ HIGH PRIORITY
**What:** Common patterns in diagnostics across recent sessions
- "You've had 'Smoothness' warnings in 3 of last 5 sessions"
- Recurring strengths and weaknesses
- Persistent issues that need attention

**Why here:** Identify PATTERNS, not single-session issues
**Not for Sessions:** Session page shows session-specific diagnostics

---

#### 4. **Insight Builder Trends** ❌ HIGH PRIORITY
**What:** Track how strengths/limiters evolve
- Strengths that have become consistent
- Limiters that have been resolved
- New issues that have emerged
- "Speed Carry was a limiter 3 sessions ago, now it's a strength"

**Why here:** Show development over time
**Not for Sessions:** Session page shows current state only

---

#### 5. **Technique Score Distribution** ❌ MEDIUM PRIORITY
**What:** Histogram or heatmap of technique scores
- Which technique dimensions are most consistent
- Which are most variable
- Identify training focus areas

**Why here:** Pattern analysis across sessions
**Not for Sessions:** Too aggregated for single session

**Example:**
```
Launch Quality:    ████████████ (avg 82, CV 5%)  ← Consistent
Explosiveness:     ████████     (avg 68, CV 12%) ← Variable
Speed Carry:       ██████████   (avg 75, CV 8%)
Smoothness:        ██████       (avg 62, CV 15%) ← Most variable
```

---

#### 6. **Best Session Analysis** ❌ MEDIUM PRIORITY
**What:** Identify and analyze BEST performing session
- What made it work?
- Conditions, technique scores, patterns
- "Your best session was [date] - here's why"

**Why here:** Learn from historical best performance
**Not for Sessions:** Each session analyzes itself

---

#### 7. **Consistency Trends** ❌ MEDIUM PRIORITY
**What:** Track consistency metrics over time
- Repeatability score trend
- Coefficient of variation trend
- Best vs average gap trend
- "Your consistency has improved 23% over last 10 sessions"

**Why here:** Long-term consistency development
**Not for Sessions:** Session page shows single-session consistency

---

#### 8. **Phase Consistency Evolution** ❌ LOW PRIORITY
**What:** How phase consistency changes over time
- Which phases have improved
- Which remain problematic
- Training effect visibility

**Why here:** Track phase-level progress
**Not for Sessions:** Session shows within-session phase consistency

---

#### 9. **Recommendations Evolution** ❌ MEDIUM PRIORITY
**What:** Track which recommendations have been acted on
- "You were advised to work on smoothness 3 sessions ago - it's improved 15%"
- Show cause-and-effect of following recommendations
- Adaptive recommendations based on progress

**Why here:** Close the feedback loop
**Not for Sessions:** Session gives point-in-time recommendations

---

#### 10. **Cross-Session Physics Patterns** ❌ LOW PRIORITY
**What:** Physics metric trends
- Impulse timing evolution
- Power output trends
- Speed profile distribution over time
- Jerk/smoothness improvement

**Why here:** Long-term physics development
**Not for Sessions:** Session shows single-session physics

---

#### 11. **Benchmark Achievement Tracking** ❌ MEDIUM PRIORITY
**What:** Track progress toward benchmark levels
- "You've achieved 'Excellent' reaction time in 7 of last 10 sessions"
- Show when new benchmark levels are consistently reached
- Performance level progression

**Why here:** Long-term achievement tracking
**Not for Sessions:** Session shows current benchmark status

---

#### 12. **Technique Correlation Analysis** ❌ LOW PRIORITY
**What:** Discover relationships between technique dimensions
- "Your explosiveness and speed carry are highly correlated"
- "Improving smoothness tends to improve repeatability"
- Data-driven training insights

**Why here:** Pattern discovery across many sessions
**Not for Sessions:** Can't find correlations from single session

---

### Analytics Section Summary:
**Focus:** Trends, patterns, and progress OVER TIME
**Missing:** Primarily DATA issues - not running Performance Engine
**Effort:** Medium-High (4-8 hours) - need to fetch data + run analysis + create displays
**Impact:** Very High - unlock unique AI coaching capabilities

---

## 📊 COMPARISON TABLE

| Capability | Session Page | Analytics Page | Reason for Placement |
|------------|--------------|----------------|---------------------|
| **Coach Diagnostics** | ✅ Single-session insights | ✅ Pattern aggregation | Different contexts: specific vs patterns |
| **Technique Scores** | ✅ Detailed 6D breakdown | ✅ Trends over time | Different views: depth vs breadth |
| **Strengths/Limiters** | ✅ Session-specific | ✅ Evolution tracking | Different purposes: current vs development |
| **Benchmarks** | ✅ Position on scale | ✅ Achievement tracking | Different focuses: status vs progress |
| **Phase Consistency** | ✅ Within-session | ✅ Evolution over time | Different scopes: single vs multiple |
| **Recommendations** | ✅ Point-in-time | ✅ Effectiveness tracking | Different goals: prescribe vs evaluate |
| **Run Comparison** | ✅ Runs within session | ❌ N/A | Only meaningful within session |
| **Session Comparison** | ❌ N/A | ✅ Sessions over time | Only meaningful across sessions |
| **Speed Profile** | ✅ Profile badge | ✅ Distribution chart | Different granularities: specific vs aggregate |
| **Impulse Metrics** | ✅ Absolute values | ✅ Trend lines | Different perspectives: what vs how changing |
| **Front Wheel Lift** | ✅ Impact analysis | ✅ Pattern analysis | Different analyses: effect vs frequency |

---

## 🎯 PRIORITY IMPLEMENTATION PLAN

### Phase 1: Session Page Enhancements (HIGH ROI, LOW EFFORT)
**Effort:** 2-3 hours
**Impact:** Immediate high value

1. ✅ Add coach diagnostics display
2. ✅ Expand technique scores to 6 dimensions
3. ✅ Add strengths/limiters badges
4. ✅ Add technique score labels

**Rationale:** Data already computed, just needs display

---

### Phase 2: Analytics Foundation (HIGH ROI, MEDIUM EFFORT)
**Effort:** 4-6 hours
**Impact:** Unlocks all cross-session features

1. ✅ Fetch chart_data in analytics +page.server.ts
2. ✅ Run analyseSession() for last 5-10 sessions
3. ✅ Store results for client display

**Rationale:** Critical blocker - nothing else works without this

---

### Phase 3: Analytics Core Features (HIGH ROI, MEDIUM EFFORT)
**Effort:** 4-6 hours
**Impact:** Unique AI coaching value

1. ✅ Technique score trends (line charts)
2. ✅ Coach diagnostics aggregation (pattern cards)
3. ✅ Insight builder trends (strengths/limiters evolution)
4. ✅ Consistency trends

**Rationale:** Most valuable cross-session insights

---

### Phase 4: Advanced Features (MEDIUM ROI, MEDIUM EFFORT)
**Effort:** 6-8 hours
**Impact:** Advanced user features

1. ⚠️ Run comparison table (session page)
2. ⚠️ Best session analysis (analytics)
3. ⚠️ Benchmark achievement tracking (analytics)
4. ⚠️ Technique correlation analysis (analytics)

**Rationale:** Nice-to-have, not essential

---

## 🚀 QUICK START RECOMMENDATIONS

### For Session Page (Start Here - Easy Win):
```typescript
// In +layout.svelte, add 3 derived values:
let techniqueScoreBreakdown = $derived(/* scoreRunTechnique() */);
let coachDiagnostics = $derived(/* buildCoachDiagnostics() */);
let insightPack = $derived(/* buildPerformanceInsightPack() */);

// Then just display them - done!
```

### For Analytics Page (Requires Foundation First):
```typescript
// In +page.server.ts:
1. Fetch chart_data in runs query
2. Loop through last 5-10 sessions
3. Call analyseSession() for each
4. Return technique scores + diagnostics
5. Display as trends on client

// Then build on this foundation
```

---

## 📈 EXPECTED OUTCOMES

### Session Page After Implementation:
- Users see **specific** coaching insights for each session
- Users understand **exactly** what to work on
- Users see **detailed** technique breakdown
- Users can **compare runs** within session
- **Immediate actionability**

### Analytics Page After Implementation:
- Users see **progress** over time
- Users identify **patterns** in performance
- Users understand **what's working** long-term
- Users track **effectiveness** of training
- **Strategic planning** enabled

---

## ✅ FINAL SUMMARY

### Session Page:
- **Status:** Using Performance Engine ✅
- **Issue:** Not displaying computed data ⚠️
- **Fix:** Display components only
- **Effort:** LOW (2-3 hours)
- **Missing:** 10 features, mostly display

### Analytics Page:
- **Status:** NOT using Performance Engine ❌
- **Issue:** Missing fundamental analysis ❌
- **Fix:** Fetch data + run analysis + display
- **Effort:** MEDIUM-HIGH (8-12 hours)
- **Missing:** 12 features, mostly compute + display

### Key Distinction:
- **Session Page** = Deep dive (DETAIL) → Missing DEPTH of display
- **Analytics Page** = Overview (TRENDS) → Missing BREADTH of analysis

### No Overlap:
- Each section serves different purpose
- No duplication of features
- Clear separation of concerns
