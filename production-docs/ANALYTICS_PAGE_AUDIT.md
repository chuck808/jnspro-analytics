# Analytics Page Comprehensive Audit

**Date:** April 27, 2026  
**Context:** 21 Session files uploaded - ready for production audit  
**Scope:** Complete review of `/analytics` page implementation

---

## Executive Summary

The Analytics page is in **hybrid mode** - successfully combining the new Performance Engine (v7.2, v8.1, v8.2, v8.3) with legacy analytics utilities. This is by design during the transition period, but there are opportunities to improve consistency, add missing features, and leverage the full power of the Performance Engine.

**Status:** ✅ Functional • ⚠️ Optimization Needed • 🚀 Enhancement Opportunities

---

## 1. System Architecture Overview

### 1.1 Performance Engine Components (NEW SYSTEM)

**✅ IMPLEMENTED:**

- **v7.2 Session Intelligence** (`sessionIntelligence.ts`)
  - Repeatability analysis
  - Fatigue detection
  - Best vs average analysis
  - Drop-off detection
  - Set length suggestions
- **v8.1 Cross-Session Intelligence** (`crossSession/crossSessionIntelligence.ts`)
  - Performance progression tracking
  - Consistency trends
  - Fatigue progression
  - Overall trend determination
  - Cross-session recommendations

- **v8.2 Truth Rules** (`crossSession/truthRules.ts`)
  - Prevents contradictory messaging
  - Applied to cross-session reports

- **v8.3 Language System** (`language/`, `sessionNarrative.ts`)
  - Controlled coaching language
  - Consistent messaging
  - Trust context indicators
  - ⚠️ **NOT YET INTEGRATED** into Analytics page

- **BMX Thresholds** (`thresholds/`)
  - Rating system for metrics
  - Level-specific benchmarks (grom/rider/elite/coach)
  - ✅ **INTEGRATED** - Personal bests show ratings

### 1.2 Legacy Analytics Utilities (OLD SYSTEM)

**Still in use from** `src/lib/utils/analytics.ts`:

| Function              | Purpose             | Status                        | Recommendation        |
| --------------------- | ------------------- | ----------------------------- | --------------------- |
| `scoreConsistency()`  | CV calculation      | 🟡 Used                       | Keep - simple utility |
| `computeSpeedCurve()` | Speed integration   | ❌ Not used on Analytics page | N/A                   |
| `estimatePower()`     | Power estimation    | ❌ Not used on Analytics page | N/A                   |
| `analyseImpulse()`    | Impulse calculation | ❌ Not used on Analytics page | N/A                   |
| `scoreTechnique()`    | Technique scoring   | ❌ Not used on Analytics page | N/A                   |

**Note:** These old system functions are still used on individual session detail pages (`/sessions/[id]`), which is appropriate.

---

## 2. Current Implementation Analysis

### 2.1 What's Performance Engine Driven ✅

**Data Fetching:**

- `+page.server.ts` - 100% raw Supabase queries (appropriate for server-side)

**Intelligence & Insights:**

1. **TrainingInsightsPanel Component** (lines 322-330)
   - Session Intelligence (v7.2) - `analyseSessionIntelligence()`
   - Cross-Session Intelligence (v8.1) - `analyseCrossSessionIntelligence()`
   - Truth Rules applied (v8.2) - `applyTruthRulesToReport()`
   - Rendered via `TrainingInsightsPanel` component

2. **Threshold Ratings** (lines 231-244)
   - `rateSessionMetrics()` for personal bests
   - BMX-specific thresholds applied
   - Color-coded rating badges displayed

### 2.2 What's Old System / Manual ⚠️

1. **Charts** (lines 106-160)
   - Chart.js rendering - manual implementation
   - Reaction time trends
   - Peak speed trends
   - Consistency CV bars
   - ❌ Not using Performance Engine `chartSeries.ts`

2. **Consistency Scoring** (line 54)
   - Using `scoreConsistency()` from old analytics.ts
   - Could use Performance Engine repeatability analysis

3. **Speed Heatmap** (lines 456-488)
   - Manual binning and calculation
   - Not using Performance Engine utilities

4. **Quickness Correlation** (lines 74-95)
   - Manual Pearson correlation calculation
   - Custom interpretation logic
   - Not using Performance Engine math utilities

5. **Trend Calculations** (server-side, lines 104-119)
   - Manual rolling average calculations
   - Not using Performance Engine trend utilities

6. **Session Comparison** (lines 538-601)
   - Manual percentage change calculations
   - Not using Performance Engine comparison utilities

---

## 3. Missing Features & Opportunities

### 3.1 Critical Missing Features 🔴

1. **v8.3 Session Narrative NOT Integrated**
   - `buildSessionNarrative()` and `sessionNarrative.ts` fully implemented
   - Language system (`language/phrases.ts`) ready
   - Rendering functions available (`language/render.ts`)
   - **Missing:** Integration into Analytics page UI
   - **Impact:** Users get raw metrics without coaching context
   - **Recommendation:** Add narrative summary at top of page

2. **Data Quality Indicators Missing**
   - Performance Engine has `dataQuality.ts` module
   - No visual indication of which metrics are trustworthy
   - No calibration warnings surfaced
   - **Impact:** Users might trust unreliable data

3. **Coach vs Rider View Not Differentiated**
   - Threshold system has 4 levels (grom/rider/elite/coach)
   - Currently hardcoded to 'rider' (line 243)
   - No way to toggle detail level
   - **Impact:** Coach users don't get advanced diagnostics

### 3.2 Enhancement Opportunities 🟡

1. **Performance Charts Not Using Engine**
   - Performance Engine has `chartSeries.ts` module
   - Contains pre-built chart data transformers
   - Current implementation duplicates this logic
   - **Recommendation:** Migrate to `generateTrendChartSeries()`

2. **No Technique Layer on Analytics Page**
   - Individual sessions show technique analysis
   - Analytics page could show technique trends over time
   - Performance Engine has `technique.ts` and `techniqueScoring.ts`
   - **Opportunity:** Add wheelie frequency trend, consistency patterns

3. **No Front Wheel Lift Analysis**
   - Session data includes `front_wheel_lifted` boolean
   - Performance Engine has `frontWheelLift.ts` module
   - Could show wheelie trends across sessions
   - **Opportunity:** "Wheelie rate improving" or "Launch consistency with/without wheelies"

4. **No Phase Consistency Tracking**
   - Performance Engine has `phaseConsistency.ts`
   - Could show drive phase vs coast phase consistency trends
   - **Opportunity:** More granular performance insights

5. **Limited Feedback Integration**
   - Feedback system exists (`performance-feedback/`)
   - Analytics page doesn't show feedback submission prompts
   - Could leverage v8.1 recommendations for targeted feedback
   - **Opportunity:** "Does this match what you felt?" prompts

### 3.3 Data Transformation Issues 🟠

1. **Duplicate Calculations** (lines 196-227)
   - Server calculates session summaries
   - Client transforms again for Performance Engine
   - Estimating `sessionQuality` and `repeatabilityScore` from CV
   - **Issue:** Not using actual v7.2 session intelligence outputs
   - **Recommendation:** Run session intelligence server-side, pass results

2. **Unit Conversion Scattered**
   - Multiple places converting m/s ↔ km/h
   - Multiple places converting ms ↔ s
   - **Recommendation:** Standardize on internal units, convert only for display

3. **Missing Run Data**
   - Performance Engine needs full run-level data
   - Currently only passing session summaries for cross-session
   - Missing technique data, phase data, quality indicators
   - **Impact:** Can't do full cross-session technique analysis

---

## 4. Chart & Visualization Audit

### 4.1 Existing Charts ✅

| Chart               | Data Source          | Status     | Notes                              |
| ------------------- | -------------------- | ---------- | ---------------------------------- |
| Reaction Time Trend | Manual Chart.js      | ✅ Working | Shows best + avg with color coding |
| Peak Speed Trend    | Manual Chart.js      | ✅ Working | Shows warning for IMU estimated    |
| Consistency CV Bars | Manual Chart.js      | ✅ Working | Color coded by quality             |
| Speed Heatmap       | Custom div rendering | ✅ Working | Nice visual, shows distribution    |

### 4.2 Chart Improvements Needed 🔧

1. **No Loading States**
   - Charts render on mount
   - No skeleton or loading indicator
   - **Fix:** Add loading state while Chart.js loads

2. **No Error Boundaries**
   - If chart rendering fails, page breaks
   - **Fix:** Wrap charts in error boundaries

3. **Accessibility Issues**
   - Charts are canvas elements (not screen reader friendly)
   - Speed heatmap has `role="img"` ✅ but others don't
   - **Fix:** Add aria-labels and table alternatives

4. **Mobile Responsiveness**
   - Charts adjust pointRadius for mobile ✅
   - Legend hidden on mobile ✅
   - Could improve axis label sizing
   - **Enhancement:** Consider swipeable charts on mobile

### 4.3 Missing Visualizations 🆕

1. **Power Trend Chart**
   - Data exists (calculated in session details)
   - Not shown in analytics overview
   - **Opportunity:** Show estimated power progression

2. **G-Force Trend**
   - Max G collected per session
   - No visualization showing G-force progression
   - **Opportunity:** "Explosiveness over time" chart

3. **Session Quality Score Chart**
   - Performance Engine calculates session quality
   - Not visualized on analytics page
   - **Opportunity:** Quality trend shows training effectiveness

4. **Fatigue Pattern Heatmap**
   - Drop-off detection available
   - Could show 2D heatmap: session x run number
   - **Opportunity:** Visual pattern of when fatigue typically hits

5. **Best vs Average Gap Trend**
   - Calculated by Performance Engine
   - Not visualized
   - **Opportunity:** Consistency improvement tracking

---

## 5. User Experience Review

### 5.1 Information Architecture ✅ Mostly Good

**Current Structure:**

```
1. Header + Export
2. Analytics Unlocked Progress Bar
3. Training Insights Panel (v7.2 + v8.1) ✅
4. Personal Bests with Ratings ✅
5. Session History List ✅
6. Trend Charts (≥3 sessions)
7. Consistency Chart
8. Speed Heatmap
9. Quickness Correlation
10. Session Comparison (≥2 sessions)
11. Rolling Analytics (≥10 sessions)
12. Statistical Analysis (≥20 sessions - placeholder)
```

**Strengths:**

- Progressive disclosure (features unlock with more data) ✅
- Clear visual hierarchy ✅
- Consistent styling ✅
- Mobile-first design ✅

**Weaknesses:**

- Too much scrolling on desktop
- No "jump to section" navigation
- Training Insights Panel could be more prominent
- No summary/overview at top

### 5.2 Recommended Restructure 🎨

```
┌─────────────────────────────────────────┐
│ 📊 Performance Overview                 │
│ ┌─────────────────┐ ┌────────────────┐ │
│ │ Latest Session  │ │ Progress Trend │ │
│ │ Coach Narrative │ │ (v8.3)         │ │
│ └─────────────────┘ └────────────────┘ │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🎯 Personal Bests + Context             │
│ (with threshold ratings - keep current) │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📈 Training Insights Panel              │
│ - Session Intelligence (v7.2)           │
│ - Cross-Session Progress (v8.1)         │
│ - Technique Analysis (new)              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📊 Performance Charts (tabbed/swipeable)│
│ - Reaction Trends                       │
│ - Speed Trends                          │
│ - G-Force Progression                   │
│ - Consistency                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🔍 Advanced Analytics (collapsible)     │
│ - Session Comparison                    │
│ - Speed Distribution                    │
│ - Quickness Correlation                 │
│ - Rolling Analytics                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📜 Session History                      │
│ (table view with filters)               │
└─────────────────────────────────────────┘
```

### 5.3 Messaging & Language 📝

**Current Issues:**

1. **Too Technical**
   - "CV %" might confuse casual users
   - "Pearson r" correlation coefficient shown
   - **Fix:** Add explainers or simplify for 'rider' level

2. **Inconsistent Coaching Voice**
   - Some sections very technical
   - Others more conversational
   - **Fix:** Use v8.3 language system throughout

3. **Warnings Not Prominent**
   - "⚠ IMU estimated" is small text
   - Could miss calibration issues
   - **Fix:** Surface data quality warnings more visibly

4. **No Actionable Guidance**
   - Charts show trends but "so what?"
   - Performance Engine generates recommendations but they're buried
   - **Fix:** Add recommendation cards after each major section

---

## 6. Performance Engine Integration Gaps

### 6.1 Server-Side (+page.server.ts)

**Current Approach:**

- Raw Supabase queries ✅
- Manual aggregation and CV calculation
- Returns session summaries

**Missing:**

- Not running v7.2 session intelligence per session
- Not caching Performance Engine outputs
- Not using Performance Engine utility functions
- Duplicating calculations client-side

**Recommendation:**

```typescript
// Option A: Run session intelligence server-side
const sessionSummaries = await Promise.all(
	sessions.map(async (session) => {
		const runs = transformRunsForEngine(session.runs);
		const intelligence = analyseSessionIntelligence(runs);
		return { ...session, intelligence };
	})
);

// Option B: Cache session intelligence in database
// Add `session_intelligence_json` column to sessions table
// Recalculate only when session changes
```

### 6.2 Client-Side (+page.svelte)

**Current Approach:**

- Transforms server data for Performance Engine
- Runs intelligence analysis client-side
- Estimates missing values (repeatabilityScore, sessionQuality)

**Issues:**

1. **Inaccurate Estimates** (lines 206-213)

```typescript
// ❌ Estimating from CV instead of using real analysis
sessionQuality: s.reaction_cv !== null ? Math.max(0, 100 - s.reaction_cv * 10) : null,
repeatabilityScore: s.reaction_cv !== null ? Math.max(0, 100 - s.reaction_cv * 10) : null,
```

2. **Missing Context**

```typescript
// ❌ Not passing technique data, fatigue analysis, etc.
// v8.1 needs full SessionIntelligenceReport, not estimates
```

**Recommendation:**

- Run full v7.2 analysis per session server-side
- Pass complete reports to client
- Client just displays, doesn't recalculate

---

## 7. Specific Code Issues

### 7.1 Type Safety 🟡

**Issue:** Derived state with complex transformations

```typescript
// Line 196: Complex derived calculation
let crossSessionReport = $derived.by(() => {
	if (data.sessionCount < 3) return null;
	// ... 30 lines of transformation
});
```

**Recommendation:**

- Extract to utility function with explicit types
- Add unit tests for transformation logic
- Consider computing server-side

### 7.2 Hardcoded Values 🔴

```typescript
// Line 243: Hardcoded user level
}, 'rider');

// Lines 167-174: Hardcoded thresholds
const THRESHOLDS = $derived([
  { count:1,  label:'Session summaries',      unlocked: true },
  { count:2,  label:'Session comparison',     unlocked: data.sessionCount >= 2 },
  // ...
]);
```

**Recommendation:**

- Get user level from profile (already available in parent layout)
- Move thresholds to configuration file

### 7.3 Inconsistent Null Handling 🟠

Multiple patterns for handling null/missing data:

```typescript
// Pattern 1: Optional chaining with nullish coalescing
selectedGate?.analytics_valid ?? false;

// Pattern 2: Ternary
session.reaction_cv !== null
	? session.reaction_cv.toFixed(1) + '%'
	: '—'

			// Pattern 3: Filter then map
			.filter((v): v is number => v !== null);
```

**Recommendation:** Standardize on pattern with type guards

### 7.4 Large Component 📏

`+page.svelte` is **650 lines** with:

- Data transformation logic
- Chart rendering
- Multiple derived calculations
- UI rendering

**Recommendation:**

- Extract chart components (ReactionTrendChart.svelte, etc.)
- Extract calculation logic to utilities
- Keep page component focused on layout

---

## 8. Missing Best Practices

### 8.1 Error Handling ❌

**Current State:**

- No try-catch around chart rendering
- No error boundaries
- Server errors return empty arrays (silent failure)

**Recommendation:**

```typescript
// Add error boundaries
{#catch error}
  <ErrorMessage message="Unable to load analytics" />
{/try}

// Add chart error handling
try {
  const c = new Chart(reactionChartEl, {...});
} catch (e) {
  console.error('Chart render failed:', e);
  // Show fallback table view
}
```

### 8.2 Loading States ⏳

**Current State:**

- Charts render immediately (may flash)
- No skeleton loaders
- Data fetching on server (good) but no loading indicator

**Recommendation:**

```svelte
{#if loading}
	<SkeletonChart />
{:else if chartData}
	<canvas bind:this={reactionChartEl} />
{:else}
	<EmptyState />
{/if}
```

### 8.3 Accessibility ♿

**Current Issues:**

1. Canvas charts not accessible to screen readers
2. No keyboard navigation for chart interactions
3. Color-only differentiation (CV chart colors)
4. Missing ARIA labels on complex visualizations

**Recommendations:**

- Add aria-label to all canvas elements
- Provide data table alternatives
- Use patterns + colors for differentiation
- Test with screen reader

### 8.4 Testing 🧪

**Current State:**

- No unit tests for transformation logic
- No component tests
- No E2E tests for analytics page

**Recommendations:**

```typescript
// Unit tests for transformations
describe('crossSessionReport transformation', () => {
	it('should handle missing data gracefully', () => {
		// ...
	});
});

// Component tests
describe('Analytics Page', () => {
	it('should show Training Insights Panel when data available', () => {
		// ...
	});
});
```

---

## 9. Action Plan & Priorities

### 9.1 Critical (Do First) 🔴

1. **Integrate v8.3 Session Narrative** (2-3 hours)
   - Add narrative summary at top of Training Insights Panel
   - Use controlled language system
   - Surface trust indicators and warnings
2. **Fix Session Intelligence Calculations** (2 hours)
   - Stop estimating from CV
   - Run full v7.2 analysis server-side OR client-side correctly
   - Pass real repeatability scores to v8.1

3. **Add Data Quality Indicators** (1-2 hours)
   - Show which metrics are trustworthy
   - Surface calibration warnings
   - Use Performance Engine `dataQuality.ts`

### 9.2 High Priority (Do Soon) 🟠

4. **Migrate Charts to Performance Engine** (3-4 hours)
   - Use `chartSeries.ts` utilities
   - Reduce duplicate code
   - Add error boundaries

5. **Add Missing Visualizations** (4-5 hours)
   - G-Force progression chart
   - Session quality trend
   - Best vs Average gap visualization

6. **Extract Large Component** (2-3 hours)
   - Create separate chart components
   - Move calculations to utilities
   - Improve maintainability

7. **Improve User Experience** (3-4 hours)
   - Restructure information hierarchy
   - Add tabbed/collapsible sections
   - Improve mobile experience

### 9.3 Medium Priority (Nice to Have) 🟡

8. **Add Technique Trends** (4-5 hours)
   - Wheelie frequency over time
   - Phase consistency trends
   - Technique → outcome correlations

9. **Implement User Level Switching** (2 hours)
   - Allow toggling rider/elite/coach views
   - Surface advanced diagnostics for coaches

10. **Add Feedback Prompts** (2-3 hours)
    - Integrate with feedback system
    - Targeted "does this match?" questions
    - Close the learning loop

### 9.4 Low Priority (Future) 🔵

11. **Statistical Analysis Implementation** (5-6 hours)
    - Implement Welch t-test comparison
    - Cohen's d effect sizes
    - Statistical significance testing

12. **Export Enhancements** (2-3 hours)
    - PDF report generation
    - CSV export with more detail
    - Share analytics link

13. **Caching & Performance** (3-4 hours)
    - Cache Performance Engine outputs in DB
    - Implement incremental updates
    - Reduce recalculation overhead

---

## 10. Recommendations Summary

### 10.1 Architecture Recommendations ✅

1. **Run Performance Engine Server-Side**
   - Calculate session intelligence during ingest or on-demand
   - Cache results in database
   - Pass complete reports to client
   - Reduces client-side computation

2. **Standardize on Performance Engine**
   - Migrate all calculations to Performance Engine modules
   - Deprecate ad-hoc calculations in components
   - Use consistent units and types throughout

3. **Component Extraction**
   - Analytics page → layout coordinator
   - Charts → separate components
   - Calculations → utility modules
   - Improves testability and reusability

### 10.2 User Experience Recommendations 🎨

1. **Information Hierarchy**
   - Coach narrative at top (v8.3)
   - Progress overview before details
   - Advanced analytics collapsible
   - Prioritize actionable insights

2. **Progressive Disclosure**
   - Keep unlock thresholds ✅
   - Add "Learn more" expandable sections
   - Tabs for different chart types
   - Adaptive detail level

3. **Coaching Language**
   - Use v8.3 language system throughout
   - Consistent terminology
   - Actionable recommendations
   - Humble, evidence-based tone

### 10.3 Technical Recommendations 🔧

1. **Testing Strategy**
   - Unit tests for transformations
   - Component tests for UI logic
   - E2E tests for key user flows
   - Visual regression tests for charts

2. **Error Handling**
   - Graceful degradation
   - Informative error messages
   - Fallback visualizations
   - Sentry integration for tracking

3. **Performance**
   - Lazy load Chart.js
   - Virtual scrolling for session list
   - Memoize expensive calculations
   - Consider server-side rendering for initial state

---

## 11. Estimated Effort

| Category        | Tasks        | Effort          | Priority |
| --------------- | ------------ | --------------- | -------- |
| Critical Fixes  | 3 tasks      | 5-7 hours       | 🔴       |
| High Priority   | 4 tasks      | 12-16 hours     | 🟠       |
| Medium Priority | 3 tasks      | 8-10 hours      | 🟡       |
| Low Priority    | 3 tasks      | 10-13 hours     | 🔵       |
| **Total**       | **13 tasks** | **35-46 hours** |          |

**Phased Approach:**

- **Phase 1 (Critical):** 1 week - v8.3 integration, fix calculations, data quality
- **Phase 2 (High):** 2 weeks - Chart migration, new visualizations, refactoring
- **Phase 3 (Medium):** 2 weeks - Technique trends, user level switching, feedback
- **Phase 4 (Low):** Ongoing - Statistical analysis, export enhancements, optimization

---

## 12. Comparison: Before vs After

### Current State 📊

- ✅ Functional analytics page
- ✅ Performance Engine partially integrated (v7.2, v8.1, v8.2)
- ⚠️ Mixing old and new systems
- ⚠️ Manual calculations duplicated
- ⚠️ v8.3 language system not used
- ⚠️ Missing key visualizations
- ⚠️ Large monolithic component

### Desired State 🚀

- ✅ Fully Performance Engine driven
- ✅ v8.3 coaching narrative prominent
- ✅ All calculations standardized
- ✅ Complete visualization suite
- ✅ Extracted, testable components
- ✅ Data quality indicators visible
- ✅ User level adaptability
- ✅ Technique trends included

---

## 13. Conclusion

The Analytics page is **functionally solid** but has significant opportunities for improvement. The Performance Engine infrastructure is excellent and mostly complete - the main work is integrating it fully into the UI and removing duplicate logic.

**Key Insights:**

1. v8.3 language system is ready but not integrated - **quick win**
2. Session intelligence estimations are inaccurate - **needs fixing**
3. Charts could use Performance Engine utilities - **reduces duplication**
4. Missing visualizations are impactful - **high user value**
5. Component is too large - **maintainability concern**

**Recommendation:** Focus on Phase 1 (critical fixes) immediately, then tackle Phase 2 (high priority improvements) over the next 2 sprints. The infrastructure is solid - we just need to fully leverage it in the UI.

---

**Generated:** April 27, 2026  
**Author:** System Audit  
**Status:** Ready for Review & Implementation Planning
