# Session Individual Run Analysis Page - Comprehensive System Analysis

**Date:** 27 April 2026  
**Analyst:** Technical Review  
**Status:** Active Development - Dual System Architecture

---

## Executive Summary

The Session page currently operates with **three distinct analytics systems** running in parallel:

1. **Performance Engine** (New/Modern) - Lines 348-356
2. **Original System** (Legacy) - Lines 8-27, 51-109
3. **Bridge/Extended** (Transitional) - Lines 19-26, 69-108

This analysis maps every analytics component, identifies what's working, what needs attention, gaps, overlaps, and migration opportunities.

---

## 1. SYSTEM MAPPING BY SOURCE

### 1.1 Performance Engine (New System)

**Component:** `SessionPerformancePanel` (lines 348-356)

**Location:** `$lib/performance-engine/`

**What it provides:**

- Session-level intelligence via `analyseSession()`
- Multi-level detail system (grom/rider/elite/coach)
- Structured insights with tone (positive/neutral/warning)
- Next actions (prioritized recommendations)
- Advanced charts (conditional on detail level)
- Physics validation with diagnostics
- Profile completion awareness
- Chart series generation via `buildChartSeries()`

**Data flows:**

- Input: Full session object + runs + rider metadata
- Processing: `analyseSession()` → `createAnalysisView()` → structured output
- Output: Headline, summary, metrics, insights, next actions, chart data

**Charts available:**

- AccelerationChart (NEW)
- SpeedChart (NEW - dual axis with accel overlay)
- JerkChart (NEW)
- ImpulseChart (NEW)
- PowerChart (NEW - with reliability flag)

**Strengths:**
✅ Clean separation of concerns  
✅ Audience-appropriate detail levels  
✅ Tone-aware insights (positive/neutral/warning)  
✅ Built-in calibration warnings  
✅ Physics validation layer  
✅ Consistent formatting and presentation  
✅ Profile completion detection  
✅ Chart visibility control based on data quality

**What works:**

- The multi-level detail system (grom → coach) is excellent
- Insights are contextualized and actionable
- Clean component architecture
- Proper handling of missing data/incomplete profiles

**What needs attention:**

- ⚠️ Not integrated with original system recommendations
- ⚠️ No help tooltips yet (unlike Analytics page)
- ⚠️ Charts lack the polish of original system (simpler styling)

---

### 1.2 Original System (Legacy Analytics)

**Utility File:** `$lib/utils/analytics.ts`

**Functions in use:**

#### Core Metrics (lines 51-67)

```typescript
-computeSpeedCurve() - // Line 51
	calculateSpeedSplits() - // Line 52-53
	assessDataQuality() - // Line 54
	classifySpeedProfile() - // Line 55
	scoreTechnique() - // Line 58-59
	estimatePower() - // Line 66
	analyseImpulse() - // Line 67
	scoreConsistency(); // Line 95
```

**What it provides:**

1. **Speed Analysis** (lines 51-54, 375-390)
   - IMU integration-based speed curves
   - Bias correction quality assessment
   - Speed profile classification (early/mid/late peak)
   - Data quality badges (Excellent/Good/Fair/Poor)

2. **Technique Scoring** (lines 58-59, 456-496)
   - Overall composite score (0-100)
   - 4 component scores:
     - Reaction (30%)
     - Explosiveness (25%)
     - Smoothness (25%)
     - Efficiency (20%)
   - Rider-level benchmarked
   - Visual gauge + progress bars

3. **Power Estimation** (lines 66, 647-668)
   - Peak power (W)
   - Average power (W)
   - Requires rider + bike mass
   - P = F × v calculation
   - Mass-aware (shows total kg)

4. **Impulse Analysis** (lines 67, 670-697)
   - Total impulse (N·s)
   - Impulse efficiency (N·s/s)
   - Time to 50% impulse
   - Front-loaded ratio (0-1 scale)
   - Visual bar chart of distribution

5. **Speed Splits Table** (lines 52-53, 592-619)
   - Target speeds (30/40/50/60 km/h)
   - Time to reach each target
   - Distance at each milestone
   - Phase identification (drive/transition/velocity)

6. **Consistency Scoring** (lines 95, 252-266)
   - CV% calculation
   - Session-wide reaction time consistency
   - Color-coded badges
   - Displayed in summary stats

**Charts:**

- G-Force chart (line 364-373) - Single axis, area fill
- Performance Curves (lines 375-390) - Dual axis (speed + accel)
- Simple, battle-tested Chart.js implementation

**Strengths:**
✅ Mature, proven formulas  
✅ Well-documented thresholds  
✅ Clear visual presentation  
✅ Good balance of detail vs simplicity  
✅ Rider-level calibration  
✅ Speed profile classification is intuitive

**What works:**

- Technique scores are highly valued by users
- Speed splits table is excellent for tracking progress
- Impulse analysis front-load ratio is unique and useful
- Data quality assessment is transparent

**What needs attention:**

- ⚠️ No integration with Performance Engine insights
- ⚠️ Formula documentation scattered
- ⚠️ Some metrics duplicate Performance Engine
- ⚠️ No structured recommendations (just raw scores)

---

### 1.3 Bridge/Extended System (analyticsExtended.ts)

**Utility File:** `$lib/utils/analyticsExtended.ts`

**Functions in use:**

#### Advanced Analysis (lines 19-26, 69-108)

```typescript
-computeJerk() - // Line 69
	computeDetailedPhases() - // Line 70
	computeGForceStability() - // Lines 21-22 (unused in final render)
	computeSessionStability() - // Lines 71-75
	identifyWeaknesses() - // Lines 77-87
	generateRecommendations() - // Lines 97-108
	gaugeArcPath(); // Line 25, 469 (SVG gauge rendering)
```

**What it provides:**

1. **Jerk Analysis** (lines 69, 392-419)
   - Rate of change of acceleration (m/s³)
   - Smoothness score (0-100)
   - Insight text generation
   - Chart visualization
   - Interprets force application character

2. **Detailed Phase Analysis** (lines 70, 526-590)
   - 3-phase breakdown:
     - Drive Phase (duration, peak accel, time to peak, efficiency)
     - Transition Phase (duration, velocity at end, efficiency)
     - Velocity Phase (duration, peak velocity, time to max, maintenance)
   - Technical assessment text
   - Color-coded phase cards

3. **Session Stability** (lines 71-75, 621-644)
   - First 500ms G-force average per run
   - Visual bar comparison across all runs
   - Consistency indicator
   - Highlights best run + selected run

4. **Weaknesses Identification** (lines 77-87, 709-735)
   - Detects metrics below threshold
   - Rider-level calibrated
   - Generates specific advice per weakness
   - Prioritized by severity

5. **Recommendations System** (lines 97-108, 737-766)
   - Priority levels (high/medium/low)
   - Contextual advice
   - Data quality aware
   - Profile completion aware
   - 4 categories:
     - Reaction improvement
     - Power/explosiveness
     - Consistency
     - Profile completion

**Strengths:**
✅ Fills gaps between original and Performance Engine  
✅ Actionable weakness identification  
✅ Priority-based recommendations  
✅ Session-wide stability analysis  
✅ Jerk analysis is unique and valuable  
✅ Phase breakdown is more detailed than Performance Engine

**What works:**

- Jerk smoothness score is intuitive
- Detailed phases provide coaching-relevant breakdowns
- Weaknesses auto-detection saves analyst time
- Recommendations are contextual

**What needs attention:**

- ⚠️ Overlaps with Performance Engine recommendations
- ⚠️ No integration with Performance Engine insights
- ⚠️ computeGForceStability() computed but never displayed
- ⚠️ Thresholds hardcoded (not rider-level adaptive in all cases)
- ⚠️ Weaknesses use technique scores (ties to original system)

---

## 2. WHAT WORKS WELL

### 2.1 User Experience

✅ **Progressive disclosure** - Summary stats → run selector → detailed analysis  
✅ **Multi-run comparison table** - Quick overview before diving in  
✅ **Swipeable run selector** - Mobile-optimized UX  
✅ **Help tooltips** - Available for key concepts (gForce, reactionTime, etc.)  
✅ **Visual hierarchy** - Clear separation of chart vs metrics vs insights  
✅ **Accessibility** - Proper ARIA labels, keyboard navigation, semantic HTML

### 2.2 Data Quality

✅ **Transparent IMU warnings** - Speed estimates clearly marked  
✅ **Quality badges** - Data quality assessment visible  
✅ **Profile completion detection** - Power locked until mass entered  
✅ **Validation layer** - Performance Engine diagnostics catch bad data

### 2.3 Multi-level Analysis

✅ **Audience adaptation** - grom/rider/elite/coach detail levels work  
✅ **Contextual help** - 3-level help content (grom/club/elite)  
✅ **Rider-level benchmarks** - Technique scores calibrated to rider level

### 2.4 Visual Design

✅ **Consistent color system** - Amber/teal/red/speed palette  
✅ **Score color coding** - Intuitive green→amber→red gradients  
✅ **Compact metric cards** - Good information density  
✅ **Chart polish** - Dual-axis, legends, proper scaling

---

## 3. WHAT NEEDS ATTENTION

### 3.1 Critical Issues

#### A. **System Fragmentation** 🔴

**Problem:** Three separate analytics systems with no integration  
**Impact:**

- Confusing for users (which insights to trust?)
- Maintenance burden (3 codebases for similar features)
- Inconsistent recommendations
- Overlapping metrics calculated differently

**Example:**

- Jerk analysis: Bridge system only
- Jerk smoothness: Performance Engine has it too (different calculation?)
- Phase analysis: Both Bridge (3-phase) and original (2-phase implied)

#### B. **Duplicate Metrics** 🔴

**Calculated in multiple places:**

- Power estimation: Original (`estimatePower`) + Performance Engine
- Phase boundaries: Original (implicit) + Bridge (explicit) + Performance Engine
- Smoothness scores: Technique scores + Jerk profile + Performance Engine
- Speed profiles: Original classification + Performance Engine

**Problem:** Same metric, different formulas = inconsistency

#### C. **Recommendation Conflicts** 🟡

**Problem:** Two recommendation systems:

1. Bridge: `generateRecommendations()` - priority-based, 4 categories
2. Performance Engine: `nextActions` - ordered list

**Impact:**

- Users see both, which to follow?
- Potentially contradictory advice
- Confusing prioritization

#### D. **Missing Integrations** 🟡

**Performance Engine isolated:**

- Doesn't use technique scores (original system)
- Doesn't use jerk analysis (bridge system)
- Doesn't reference speed splits (original system)
- Displayed in separate panel, feels disconnected

**Bridge System isolated:**

- Uses original technique scores as input
- Doesn't feed into Performance Engine
- Recommendations don't inform PE insights

### 3.2 Functional Gaps

#### A. **Help System Coverage** 🟡

- SessionPerformancePanel has NO help tooltips
- Performance Engine insights lack "why" explanations
- No help for jerk analysis
- No help for detailed phase breakdown
- Session stability chart unexplained

#### B. **Unused Computations** 🟡

- `computeGForceStability()` is calculated but never displayed (line 21-22)
- Why compute if not used? Remove or display.

#### C. **Profile Completeness** 🟡

- Power/impulse locked behind profile completion ✅ Good
- But no prompt to complete profile in summary stats
- Only shows warning deep in metrics section

#### D. **Data Quality Hierarchy** 🟡

- Data quality badge shown once (line 383)
- Not surfaced in Performance Engine panel
- Speed charts shown even with Poor quality (should they be?)

### 3.3 UX Issues

#### A. **Cognitive Load** 🟡

Three distinct analysis sections:

1. Session summary stats (lines 252-266)
2. Performance Engine panel (lines 348-356)
3. Original system charts + metrics (lines 359-707)
4. Bridge system insights (weaknesses, recommendations)

**Problem:** No clear hierarchy or "this is the main analysis"

#### B. **Mobile Experience** 🟡

- Swipeable selector is great ✅
- But: 2-column metric grids may be cramped
- Charts could be larger on mobile
- Recommendations text-heavy

#### C. **Visual Consistency** 🟡

- Performance Engine charts: Different style than original charts
- Metric card designs: 3 different styles (summary, PE, original)
- Inconsistent spacing/padding between sections

---

## 4. GAPS & MISSING ANALYTICS

### 4.1 What Users Might Expect But Don't Have

#### A. **Cross-Run Progression Within Session**

**Missing:** Chart showing metric trends across run 1→2→3→4 etc.

- Does reaction time degrade? (fatigue detection)
- Does G-force drop off? (power endurance)
- Does consistency worsen? (mental fatigue)

**Currently:** Session stability shows first 500ms only (partial solution)

#### B. **Comparative View**

**Missing:** Select 2 runs, see side-by-side diff

- Currently: Only table comparison, but no detailed diff
- Would help answer "why was run 3 better than run 5?"

#### C. **Target Setting**

**Missing:** "Aim for X reaction time" or "Target 2.5G"

- Performance Engine gives insights, but no goals
- Original gives scores, but no targets
- Users left to infer what "good" means for their level

#### D. **Historical Context**

**Missing:** "This is your 3rd best reaction time ever"

- No link to all-time bests (available on Analytics page)
- No "trending up/down compared to last 5 sessions"

#### E. **Drill-Down Data**

**Missing:** Click on chart to see exact sample values

- Chart.js tooltips exist, but could be richer
- No table of raw acceleration samples
- No CSV export of run chart data

### 4.2 Analytics Available Elsewhere But Not Here

From **Analytics Page** that could help here:

- Quickness Correlation (best reaction = best G?)
- Best vs Average Gap % (session-level)
- Optimal Set Length (when did fatigue hit?)
- Drop-off Run (specific run where performance declined)

---

## 5. OVERLAPS & REDUNDANCIES

### 5.1 Direct Duplicates

| Metric               | Original System             | Bridge System                     | Performance Engine           |
| -------------------- | --------------------------- | --------------------------------- | ---------------------------- |
| **Jerk/Smoothness**  | Technique smoothness score  | computeJerk() with smoothness     | Physics.jerk.smoothnessScore |
| **Phase Analysis**   | Implicit (drive→transition) | computeDetailedPhases() (3-phase) | Physics phases               |
| **Power Estimation** | estimatePower()             | ❌                                | Physics.power                |
| **Recommendations**  | ❌                          | generateRecommendations()         | view.nextActions             |
| **Weaknesses**       | ❌                          | identifyWeaknesses()              | Insights (implicit)          |

### 5.2 Conceptual Overlaps

**Explosiveness:**

- Original: Technique explosiveness score (0-100)
- Bridge: Drive phase efficiency
- Performance Engine: Acceleration characteristics

**Consistency:**

- Original: scoreConsistency() for reactions
- Bridge: Session stability (G-force)
- Performance Engine: Repeatability metrics

**Speed Profile:**

- Original: classifySpeedProfile() → "Early/Mid/Late Peak"
- Performance Engine: Time-to-peak metrics, phase timing

---

## 6. MIGRATION OPPORTUNITIES

### 6.1 What Can Move from Original → Performance Engine

#### A. **Technique Scoring Framework** ✅ HIGHEST VALUE

**Why migrate:**

- Users love the 0-100 scores
- Simple, intuitive, benchmarked
- 4-component breakdown is coaching-relevant

**How:**

- Performance Engine already has physics data for all components
- Map PE data → technique score formula:
  - Reaction: PE has reaction time
  - Explosiveness: PE has acceleration profiles
  - Smoothness: PE has jerk data
  - Efficiency: PE has velocity curves
- Add `techniqueScore` to PE analysis output
- Display in PE metrics grid

**Benefit:** Unify the "what's my score?" question

#### B. **Speed Splits Table** ✅ HIGH VALUE

**Why migrate:**

- Unique to original system
- Excellent progress tracking tool
- Answers "when did I hit 40 km/h?"

**How:**

- PE already has speed curve data
- Add `speedSplits` function to PE
- Return milestone targets with time/distance/phase
- Display in PE metrics or separate table

**Benefit:** Remove dependency on original system for this feature

#### C. **Speed Profile Classification** ✅ MEDIUM VALUE

**Why:**

- Simple label ("Early/Mid/Late Peak")
- Useful coaching shorthand

**How:**

- PE has time-to-peak data
- Add classification logic
- Display as metric in PE grid

**Benefit:** One less original system dependency

#### D. **Data Quality Assessment** ✅ MEDIUM VALUE

**Why:**

- Transparent about IMU limitations
- Badge system is clear

**How:**

- PE already has diagnostics/calibration warnings
- Map diagnostic severity → quality badge
- Display prominently in PE panel

**Benefit:** Consolidate data quality messaging

### 6.2 What Can Move from Bridge → Performance Engine

#### A. **Detailed Phase Analysis** ✅ HIGH VALUE

**Why migrate:**

- More granular than current PE phases
- 3-phase breakdown (Drive/Transition/Velocity) is coaching gold
- Efficiency scores per phase

**How:**

- PE already has phase detection
- Enhance PE phase analysis to match Bridge's detail level
- Add efficiency calculations per phase
- Add technical assessment text generation

**Benefit:** Remove Bridge dependency for phase analysis

#### B. **Weaknesses Auto-Detection** ✅ HIGH VALUE

**Why:**

- Saves users from interpreting scores manually
- Provides specific advice per weakness
- Rider-level calibrated

**How:**

- PE already has thresholds and benchmarks
- Add weakness detection to PE analysis
- Generate advice based on PE insights
- Include in PE `nextActions` or new `weaknesses` array

**Benefit:** Unify weakness detection with insights

#### C. **Priority-Based Recommendations** ✅ MEDIUM VALUE

**Why:**

- High/medium/low priority is clearer than ordered list
- Categories help structure advice

**How:**

- PE already has `nextActions`
- Add priority field to each action
- Group by priority in view layer
- Merge Bridge recommendation logic into PE

**Benefit:** Better recommendation UX

#### D. **Session Stability Visualization** ✅ LOW-MEDIUM VALUE

**Why:**

- Unique visual showing consistency across runs
- Helps spot outliers

**How:**

- PE has access to all run data
- Add session-wide stability metric to PE
- Create visualization component
- Include in PE charts section

**Benefit:** Cross-run analysis in PE

### 6.3 What Should Stay in Original System (For Now)

#### A. **Impulse Analysis**

**Reason:** Unique calculation, not critical to PE core mission  
**Action:** Keep, but add help tooltip

#### B. **G-Force Chart** (Simple visualization)

**Reason:** Basic chart, works fine  
**Action:** Eventually replace with PE AccelerationChart

#### C. **Technique Indicators** (lines 498-520)

**Pitch angles, wheelie detection**  
**Reason:** Niche metrics, IMU-specific  
**Action:** Keep as "raw data" section

---

## 7. RECOMMENDATIONS

### 7.1 Immediate Actions (This Sprint)

#### 1. **Add Help Tooltips to Performance Engine** 🔴 HIGH PRIORITY

**Task:** Create help content for:

- Performance Engine headline/summary
- Each metric in PE metrics grid
- Insights interpretation
- Next actions meaning

**File:** `src/lib/utils/helpContent.ts`  
**Estimate:** 2-3 hours (copy pattern from Analytics page)

#### 2. **Remove computeGForceStability() Dead Code** 🟡 LOW HANGING FRUIT

**Task:** Either use it or remove it  
**Lines:** 21-22 in +page.svelte  
**Estimate:** 15 minutes

#### 3. **Add Profile Completion Prompt to Summary Stats** 🟡 MEDIUM PRIORITY

**Task:** Show warning in summary stats section if profile incomplete  
**Location:** Lines 252-266  
**Estimate:** 30 minutes

### 7.2 Short-Term Refactoring (Next 2 Sprints)

#### 1. **Migrate Technique Scoring to Performance Engine** 🔴 HIGH PRIORITY

**Why:** Most visible user-facing metric, currently in original system  
**Tasks:**

- Add technique score calculation to PE physics analysis
- Map PE physics data → 4-component scores
- Add to PE metrics grid
- Deprecate original technique scores section
- Update tests

**Estimate:** 1-2 days  
**Impact:** Removes major original system dependency

#### 2. **Migrate Speed Splits to Performance Engine** 🟡 MEDIUM PRIORITY

**Why:** Unique value, users love it, should be in PE  
**Tasks:**

- Add speedSplits calculation to PE
- Create table component in PE section
- Remove from original section
- Update help content

**Estimate:** 4-6 hours  
**Impact:** Another original system dependency removed

#### 3. **Unify Recommendation Systems** 🔴 HIGH PRIORITY

**Why:** Two competing systems confuse users  
**Tasks:**

- Merge Bridge `generateRecommendations()` logic into PE
- Add priority levels to PE nextActions
- Consolidate weaknesses into PE insights
- Remove Bridge recommendation section
- Update view layer to show unified recommendations

**Estimate:** 1 day  
**Impact:** Single source of truth for recommendations

#### 4. **Consolidate Jerk Analysis** 🟡 MEDIUM PRIORITY

**Why:** Overlap between Bridge and PE  
**Tasks:**

- Verify PE jerk calculation matches Bridge
- If different, choose one (prefer PE)
- Add Bridge's insight text generation to PE
- Display PE jerk chart + smoothness score
- Remove Bridge jerk section

**Estimate:** 4-6 hours

### 7.3 Long-Term Vision (3+ Sprints)

#### 1. **Full Performance Engine Migration** 🔴 STRATEGIC

**Goal:** PE becomes the only analytics system  
**Phases:**

1. ✅ Migrate technique scores → PE
2. ✅ Migrate speed splits → PE
3. ✅ Migrate recommendations → PE
4. ✅ Migrate phase analysis → PE
5. ✅ Migrate weaknesses → PE
6. Remove original analytics.ts entirely
7. Remove Bridge analyticsExtended.ts entirely
8. PE handles everything

**Estimate:** 3-4 sprints  
**Benefit:**

- Single codebase
- Consistent formulas
- Easier maintenance
- Better UX (one coherent analysis)

#### 2. **Add Missing Analytics** 🟡 ENHANCEMENT

**From gap analysis above:**

- Cross-run progression charts (fatigue detection)
- 2-run comparison view
- Target setting (personalized goals)
- Historical context (all-time PBs)
- Drill-down data tables

**Estimate:** 1-2 sprints  
**Benefit:** Feature completeness

#### 3. **Chart Consolidation** 🟡 POLISH

**Goal:** All charts use PE chart components  
**Tasks:**

- Replace original Chart.js charts with PE components
- Consistent styling
- Better accessibility
- Richer tooltips

**Estimate:** 1 sprint

---

## 8. RISK ASSESSMENT

### 8.1 Migration Risks

#### A. **Breaking User Expectations** 🟡

**Risk:** Users accustomed to technique scores, sudden change could confuse  
**Mitigation:**

- Migrate gradually
- Keep both for 1-2 releases
- Add "New!" badges
- Collect feedback

#### B. **Formula Inconsistencies** 🔴

**Risk:** PE formula ≠ original formula = different scores = user confusion  
**Mitigation:**

- Audit all formulas first
- Where possible, keep original formulas in PE
- Document any changes
- Explain differences in help text

#### C. **Performance** 🟡

**Risk:** Running 3 systems = slower page load  
**Current:** Not a problem (all client-side, fast)  
**Future:** As PE grows, monitor bundle size

#### D. **Testing Coverage** 🟡

**Risk:** Original system has more battle testing  
**Mitigation:**

- Comprehensive PE unit tests
- Beta test with real users
- A/B test PE vs original

---

## 9. METRICS TO TRACK

To measure success of consolidation:

### 9.1 Code Metrics

- Lines of code in analytics/\* (goal: reduce by 40%)
- Number of analytics functions (goal: reduce by 30%)
- Test coverage % (goal: maintain >80%)

### 9.2 User Metrics

- Time on session detail page (should stay flat or increase)
- Help tooltip usage (track which metrics need more help)
- Profile completion rate (should increase with better prompts)
- User feedback sentiment (survey after PE migration)

### 9.3 Performance Metrics

- Page load time (should stay <2s)
- Time to interactive (should stay <3s)
- Bundle size (monitor, flag if >+10%)

---

## 10. APPENDIX: DETAILED COMPONENT INVENTORY

### Current Components in Session Detail Page

| Component                   | Lines   | System   | Purpose                   | Keep/Migrate/Remove          |
| --------------------------- | ------- | -------- | ------------------------- | ---------------------------- |
| Session header              | 223-249 | UI       | Show date, stats, nav     | ✅ Keep                      |
| Summary stats grid          | 252-266 | Original | 6 key metrics             | ✅ Keep                      |
| All runs table              | 269-311 | UI       | Run comparison            | ✅ Keep                      |
| Run selector                | 314-344 | UI       | Swipeable/buttons         | ✅ Keep                      |
| **SessionPerformancePanel** | 348-356 | **PE**   | Main PE analysis          | ✅ **Keep & Enhance**        |
| G-Force chart               | 364-373 | Original | Basic accel chart         | 🔄 Replace with PE chart     |
| Performance curves chart    | 375-390 | Original | Speed + accel dual        | 🔄 Replace with PE chart     |
| Jerk chart                  | 392-419 | Bridge   | Force application         | 🔄 Migrate to PE             |
| Run metrics grid            | 426-454 | Original | 8 core metrics            | ✅ Keep (migrate data to PE) |
| Technique scores            | 456-496 | Original | 4-component scores        | 🔄 **Migrate to PE**         |
| Technique indicators        | 498-520 | Original | Pitch/wheelie data        | ✅ Keep (raw data)           |
| Detailed phase analysis     | 526-590 | Bridge   | 3-phase breakdown         | 🔄 **Migrate to PE**         |
| Speed splits table          | 592-619 | Original | Milestone targets         | 🔄 **Migrate to PE**         |
| Session stability           | 621-644 | Bridge   | Cross-run G-force         | 🔄 Migrate to PE             |
| Power output                | 647-668 | Original | Peak/avg power            | 🔄 PE already has this       |
| Impulse analysis            | 670-697 | Original | Force distribution        | ✅ Keep (unique)             |
| Profile incomplete warning  | 699-707 | UI       | Prompt profile completion | ✅ Keep                      |
| Weaknesses                  | 709-735 | Bridge   | Auto-detected issues      | 🔄 **Migrate to PE**         |
| Recommendations             | 737-766 | Bridge   | Priority advice           | 🔄 **Migrate to PE**         |

**Summary:**

- Keep: 8 components
- Migrate to PE: 7 components
- Replace with PE: 3 components

---

## 11. CONCLUSION

The Session detail page has **excellent analytics depth** but suffers from **architectural fragmentation**. Three systems (Performance Engine, Original, Bridge) overlap significantly, creating:

1. **Duplication** - Same metrics calculated differently
2. **Confusion** - Multiple recommendation sources
3. **Maintenance burden** - Three codebases to update
4. **Inconsistency** - Different formulas for similar concepts

**The path forward is clear:**

✅ **Short-term:** Add help tooltips to PE, remove dead code, unify recommendations  
✅ **Medium-term:** Migrate technique scores, speed splits, phase analysis to PE  
✅ **Long-term:** PE becomes the single analytics system

**The Performance Engine is solid.** It has the architecture to absorb all functionality from the original and bridge systems. The migration is **low-risk** if done incrementally with proper testing.

**Priority:**

1. 🔴 Help tooltips for PE (immediate)
2. 🔴 Technique scores → PE (high value, user-facing)
3. 🔴 Unify recommendations (eliminate confusion)
4. 🟡 Speed splits → PE (unique value)
5. 🟡 Phase analysis → PE (coaching value)
6. 🟡 Deprecate original/bridge systems

**Timeline:** 3-4 sprints to full consolidation.

---

**End of Analysis**
