# Performance Engine - Implementation Roadmap

## Overview

This roadmap provides a step-by-step implementation order for exposing all Performance Engine capabilities. Organized by priority, dependencies, and effort.

**Total Estimated Effort:** 16-24 hours
**Phases:** 4
**Features:** 22

---

## 📋 PHASE 1: SESSION PAGE QUICK WINS
**Priority:** 🔴 CRITICAL - Start Here
**Effort:** 2-3 hours
**Dependencies:** None
**ROI:** ⭐⭐⭐⭐⭐ Highest

### Why Start Here:
- Data already computed ✅
- Zero blockers ✅
- Immediate user value ✅
- Builds momentum ✅

---

### Task 1.1: Add Performance Engine Exports to Session Layout
**File:** `src/routes/(protected)/sessions/[id]/+layout.svelte`
**Effort:** 15 minutes
**Priority:** CRITICAL

**Changes:**
```typescript
// Add imports (line ~10)
import { scoreRunTechnique, buildCoachDiagnostics, buildPerformanceInsightPack } from '$lib/performance-engine';

// Add derived values (after line 90, after analysisView creation)
let techniqueScoreBreakdown = $derived.by(() => {
  if (!performanceAnalysis.selectedRun) return null;
  return scoreRunTechnique(
    performanceAnalysis.selectedRun,
    performanceAnalysis,
    { riderLevel: (riderLevel as DetailLevel) || 'rider' }
  );
});

let coachDiagnostics = $derived.by(() => {
  if (!techniqueScoreBreakdown) return [];
  return buildCoachDiagnostics(performanceAnalysis, techniqueScoreBreakdown);
});

let insightPack = $derived(
  buildPerformanceInsightPack(
    performanceAnalysis,
    (riderLevel as DetailLevel) || 'rider'
  )
);

// Add to context (line ~308, in setContext)
setContext('session', {
  // ... existing context ...
  get techniqueScoreBreakdown() { return techniqueScoreBreakdown; },
  get coachDiagnostics()        { return coachDiagnostics; },
  get insightPack()             { return insightPack; },
});
```

**Acceptance Criteria:**
- [ ] Imports added without errors
- [ ] Three derived values computed correctly
- [ ] Context exposes new values
- [ ] No TypeScript errors

---

### Task 1.2: Create Coach Diagnostics Component
**File:** `src/lib/components/session/CoachDiagnosticsCard.svelte` (NEW)
**Effort:** 45 minutes
**Priority:** HIGH

**Component Structure:**
```svelte
<script lang="ts">
  import type { CoachDiagnostic } from '$lib/performance-engine/coachDiagnostics';
  
  interface Props {
    diagnostics: CoachDiagnostic[];
    compact?: boolean;
  }
  
  let { diagnostics, compact = false }: Props = $props();
  
  // Display logic: tone colors, icons, filtering
</script>

<!-- Card with diagnostics display -->
```

**Features:**
- Display all diagnostics with tone indicators
- Evidence bullets
- Prescription action items
- Collapsible for compact mode
- Audience level badge

**Acceptance Criteria:**
- [ ] Component renders without errors
- [ ] Shows all diagnostic fields
- [ ] Tone colors work (positive/warning/neutral)
- [ ] Icons display correctly
- [ ] Responsive on mobile

---

### Task 1.3: Display Coach Diagnostics on Analysis Page
**File:** `src/routes/(protected)/sessions/[id]/analysis/+page.svelte`
**Effort:** 15 minutes
**Priority:** HIGH

**Changes:**
```svelte
<script>
  // Add to imports
  import CoachDiagnosticsCard from '$lib/components/session/CoachDiagnosticsCard.svelte';
  
  // Get from context
  let coachDiagnostics = $derived(ctx.coachDiagnostics);
</script>

<!-- Add after Training Insights Panel (around line 400) -->
{#if coachDiagnostics && coachDiagnostics.length > 0}
  <CoachDiagnosticsCard diagnostics={coachDiagnostics} />
{/if}
```

**Acceptance Criteria:**
- [ ] Coach diagnostics display on analysis page
- [ ] Shows for sessions with data
- [ ] Hides when no diagnostics available
- [ ] Styling matches app theme

---

### Task 1.4: Create Technique Score Breakdown Component
**File:** `src/lib/components/session/TechniqueScoreBreakdown.svelte` (NEW)
**Effort:** 45 minutes
**Priority:** HIGH

**Component Structure:**
```svelte
<script lang="ts">
  import type { TechniqueScoreBreakdown } from '$lib/performance-engine/techniqueScoring';
  
  interface Props {
    scores: TechniqueScoreBreakdown;
    showLabels?: boolean;
  }
  
  let { scores, showLabels = true }: Props = $props();
  
  const dimensions = [
    { key: 'launchQuality', label: 'Launch Quality', icon: '🚀' },
    { key: 'explosiveness', label: 'Explosiveness', icon: '💥' },
    { key: 'speedCarry', label: 'Speed Carry', icon: '⚡' },
    { key: 'smoothness', label: 'Smoothness', icon: '〰️' },
    { key: 'impulseTiming', label: 'Impulse Timing', icon: '⏱️' },
    { key: 'repeatability', label: 'Repeatability', icon: '🔁' },
  ];
  
  function getScoreColor(score: number | null) {
    if (!score) return '#6b5f4d';
    if (score >= 80) return '#3de8c8';
    if (score >= 60) return '#f5a623';
    if (score >= 40) return '#ff6b3d';
    return '#ff4444';
  }
</script>

<!-- Grid of 6 score cards or bars -->
```

**Features:**
- 6 score cards (one per dimension)
- Score value (0-100)
- Label (excellent/good/developing/needs-work)
- Color coding
- Icons for each dimension
- Optional compact mode

**Acceptance Criteria:**
- [ ] All 6 dimensions display
- [ ] Labels show correctly
- [ ] Colors match score ranges
- [ ] Responsive grid layout
- [ ] Works on mobile

---

### Task 1.5: Display Technique Breakdown on Analysis Page
**File:** `src/routes/(protected)/sessions/[id]/analysis/+page.svelte`
**Effort:** 15 minutes
**Priority:** HIGH

**Changes:**
```svelte
<script>
  import TechniqueScoreBreakdown from '$lib/components/session/TechniqueScoreBreakdown.svelte';
  let techniqueScoreBreakdown = $derived(ctx.techniqueScoreBreakdown);
</script>

<!-- Replace existing single technique gauge (around line 350) -->
{#if techniqueScoreBreakdown}
  <div class="themed-card rounded-xl p-5">
    <h3 class="text-sm font-semibold themed-text-primary mb-4">Technique Analysis</h3>
    <TechniqueScoreBreakdown scores={techniqueScoreBreakdown} />
  </div>
{/if}
```

**Acceptance Criteria:**
- [ ] Technique breakdown displays
- [ ] All 6 dimensions visible
- [ ] Labels and colors correct
- [ ] Replaces or enhances existing gauge

---

### Task 1.6: Create Strengths & Limiters Component
**File:** `src/lib/components/session/StrengthsLimiters.svelte` (NEW)
**Effort:** 30 minutes
**Priority:** HIGH

**Component Structure:**
```svelte
<script lang="ts">
  interface Props {
    strengths: string[];
    limiters: string[];
    compact?: boolean;
  }
  
  let { strengths, limiters, compact = false }: Props = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <!-- Strengths column (green badges) -->
  <div>
    <h4 class="text-xs font-semibold text-[#3de8c8] uppercase mb-2">
      💪 Strengths
    </h4>
    {#each strengths as strength}
      <span class="inline-block px-3 py-1.5 rounded-full bg-[#3de8c8]/10 
                   text-[#3de8c8] text-sm mr-2 mb-2 border border-[#3de8c8]/30">
        {strength}
      </span>
    {/each}
  </div>
  
  <!-- Limiters column (amber/red badges) -->
  <div>
    <h4 class="text-xs font-semibold text-[#ff6b3d] uppercase mb-2">
      🎯 Focus Areas
    </h4>
    {#each limiters as limiter}
      <span class="inline-block px-3 py-1.5 rounded-full bg-[#ff6b3d]/10 
                   text-[#ff6b3d] text-sm mr-2 mb-2 border border-[#ff6b3d]/30">
        {limiter}
      </span>
    {/each}
  </div>
</div>
```

**Acceptance Criteria:**
- [ ] Two-column layout (strengths | limiters)
- [ ] Badge styling with colors
- [ ] Responsive (stacks on mobile)
- [ ] Empty state handling

---

### Task 1.7: Display Strengths & Limiters on Overview Page
**File:** `src/routes/(protected)/sessions/[id]/+page.svelte`
**Effort:** 15 minutes
**Priority:** HIGH

**Changes:**
```svelte
<script>
  import StrengthsLimiters from '$lib/components/session/StrengthsLimiters.svelte';
  let insightPack = $derived(ctx.insightPack);
</script>

<!-- Add after Session Narrative (around line 260) -->
{#if insightPack && (insightPack.strengths.length > 0 || insightPack.limiters.length > 0)}
  <div class="themed-card rounded-xl p-5">
    <h3 class="text-sm font-semibold themed-text-primary mb-4">Performance Summary</h3>
    <StrengthsLimiters 
      strengths={insightPack.strengths} 
      limiters={insightPack.limiters} 
    />
  </div>
{/if}
```

**Acceptance Criteria:**
- [ ] Displays on overview page
- [ ] Shows strengths and limiters
- [ ] Only shows when data available
- [ ] Styling matches theme

---

### 📊 Phase 1 Completion Checklist:
- [ ] Task 1.1: Performance Engine exports added
- [ ] Task 1.2: Coach Diagnostics component created
- [ ] Task 1.3: Coach Diagnostics displayed
- [ ] Task 1.4: Technique Breakdown component created
- [ ] Task 1.5: Technique Breakdown displayed
- [ ] Task 1.6: Strengths & Limiters component created
- [ ] Task 1.7: Strengths & Limiters displayed
- [ ] Manual testing: All session pages work
- [ ] Mobile testing: Components responsive
- [ ] No TypeScript errors
- [ ] No console errors

**Phase 1 Deliverables:**
✅ Session page shows coach diagnostics
✅ Session page shows 6-dimension technique breakdown
✅ Session page shows strengths & limiters
✅ ~3 hours of work = Massive UX improvement

---

## 📋 PHASE 2: ANALYTICS PAGE FOUNDATION
**Priority:** 🟡 HIGH - Required for all analytics features
**Effort:** 4-6 hours
**Dependencies:** None (parallel to Phase 1)
**ROI:** ⭐⭐⭐⭐⭐ Enables everything

### Why Phase 2:
- Unblocks all analytics features
- Can work in parallel with Phase 1
- Foundation for cross-session analysis

---

### Task 2.1: Update Analytics Server Query - Fetch chart_data
**File:** `src/routes/(protected)/analytics/+page.server.ts`
**Effort:** 30 minutes
**Priority:** CRITICAL

**Changes:**
```typescript
// Update runs query (around line 29)
const { data: runs, error: runsError } = await supabase
    .from('runs')
    .select(`
        id,
        session_id,
        elapsed_time_ms,
        distance_m,
        chart_data    // ← ADD THIS
    `)
    .in('session_id', sessionIds);
```

**Considerations:**
- `chart_data` can be large (200-400 values)
- Consider limiting to last 10 sessions
- May need pagination for users with many sessions

**Acceptance Criteria:**
- [ ] chart_data fetched successfully
- [ ] No performance degradation
- [ ] Query completes in < 2 seconds
- [ ] Data structure correct

---

### Task 2.2: Add Performance Engine Analysis to Analytics Server
**File:** `src/routes/(protected)/analytics/+page.server.ts`
**Effort:** 1.5 hours
**Priority:** CRITICAL

**Changes:**
```typescript
// Add import
import { analyseSession, scoreRunTechnique, buildCoachDiagnostics, buildPerformanceInsightPack } from '$lib/performance-engine';

// After existing session summaries (around line 100)
// Limit to last 10 sessions for performance
const sessionsToAnalyze = sessions.slice(-10);

const sessionAnalyses = sessionsToAnalyze.map(session => {
    const sessionRuns = runs?.filter(r => r.session_id === session.id) ?? [];
    
    // Only analyze if we have chart_data
    if (sessionRuns.length === 0 || !sessionRuns[0].chart_data) {
        return null;
    }
    
    // Build session object for Performance Engine
    const sessionForAnalysis = {
        id: session.id,
        session_type: session.session_type,
        timestamp: session.timestamp,
        runs: sessionRuns.map(run => ({
            id: run.id,
            run_number: run.run_number,
            elapsed_time_ms: run.elapsed_time_ms,
            chart_data: run.chart_data,
            gate_runs: gateRuns?.find(g => g.run_id === run.id),
        })),
    };
    
    // Run full Performance Engine analysis
    const analysis = analyseSession(sessionForAnalysis, {
        riderWeightKg: profile.weight_kg,
        bikeWeightKg: bikes?.[0]?.weight_kg,
        riderLevel: profile.rider_level,
    });
    
    // Extract technique scores
    const techniqueScores = analysis.selectedRun?.technique;
    
    // Generate coach diagnostics
    const scoreBreakdown = analysis.selectedRun 
        ? scoreRunTechnique(analysis.selectedRun, analysis, { riderLevel: profile.rider_level || 'rider' })
        : null;
    const diagnostics = scoreBreakdown 
        ? buildCoachDiagnostics(analysis, scoreBreakdown)
        : [];
    
    // Build insight pack
    const insightPack = buildPerformanceInsightPack(analysis, profile.rider_level || 'rider');
    
    return {
        sessionId: session.id,
        timestamp: session.timestamp,
        analysis,
        techniqueScores,
        diagnostics,
        insightPack,
    };
}).filter(Boolean);

// Add to return
return {
    // ... existing returns ...
    sessionAnalyses,
};
```

**Performance Optimization:**
- Limit to 10 most recent sessions
- Consider caching results in database
- Add loading indicator on client

**Acceptance Criteria:**
- [ ] Analysis runs for last 10 sessions
- [ ] Technique scores extracted
- [ ] Coach diagnostics generated
- [ ] Insight packs created
- [ ] Page load time < 5 seconds
- [ ] No errors in server logs

---

### Task 2.3: Create Analytics Types
**File:** `src/routes/(protected)/analytics/+page.server.ts` (add to top)
**Effort:** 15 minutes
**Priority:** MEDIUM

**Changes:**
```typescript
interface SessionAnalysisResult {
    sessionId: string;
    timestamp: string;
    analysis: SessionAnalysis;
    techniqueScores: TechniqueAnalysis | null;
    diagnostics: CoachDiagnostic[];
    insightPack: PerformanceInsightPack;
}
```

**Acceptance Criteria:**
- [ ] Types defined correctly
- [ ] No TypeScript errors
- [ ] Exported for client use

---

### Task 2.4: Test Analytics Data Flow
**File:** Manual Testing
**Effort:** 30 minutes
**Priority:** HIGH

**Test Cases:**
1. User with no sessions → No errors
2. User with 1-2 sessions → Analyses generated
3. User with 10+ sessions → Only last 10 analyzed
4. User with sessions lacking chart_data → Graceful handling

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] No console errors
- [ ] Data structure as expected
- [ ] Performance acceptable

---

### 📊 Phase 2 Completion Checklist:
- [ ] Task 2.1: chart_data fetched
- [ ] Task 2.2: Performance Engine integrated
- [ ] Task 2.3: Types defined
- [ ] Task 2.4: Testing complete
- [ ] Server-side works with 0-100+ sessions
- [ ] No performance issues
- [ ] Data available to client

**Phase 2 Deliverables:**
✅ Analytics page has full Performance Engine data
✅ Foundation for all cross-session features
✅ ~4-6 hours of work = Enables everything

---

## 📋 PHASE 3: ANALYTICS CORE FEATURES
**Priority:** 🟡 HIGH - High-value cross-session insights
**Effort:** 4-6 hours
**Dependencies:** Phase 2 must be complete
**ROI:** ⭐⭐⭐⭐ High value

---

### Task 3.1: Create Technique Score Trends Component
**File:** `src/lib/components/analytics/TechniqueScoreTrends.svelte` (NEW)
**Effort:** 1 hour
**Priority:** HIGH

**Component Structure:**
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  
  interface TechniqueScoreData {
    sessionDate: string;
    sessionNumber: number;
    overall: number | null;
    launchQuality: number | null;
    explosiveness: number | null;
    speedCarry: number | null;
    smoothness: number | null;
    impulseTiming: number | null;
    repeatability: number | null;
  }
  
  interface Props {
    data: TechniqueScoreData[];
    isMobile?: boolean;
  }
  
  let { data, isMobile = false }: Props = $props();
  
  // Chart.js implementation showing trends
</script>
```

**Features:**
- Line chart with 7 lines (overall + 6 dimensions)
- Toggle individual dimensions
- Show improving/declining trends
- Highlight latest session

**Acceptance Criteria:**
- [ ] Chart renders correctly
- [ ] All dimensions toggleable
- [ ] Responsive on mobile
- [ ] Shows trend direction

---

### Task 3.2: Display Technique Trends on Analytics Page
**File:** `src/routes/(protected)/analytics/+page.svelte`
**Effort:** 30 minutes
**Priority:** HIGH

**Changes:**
```svelte
<script>
  import TechniqueScoreTrends from '$lib/components/analytics/TechniqueScoreTrends.svelte';
  
  let techniqueData = $derived(
    data.sessionAnalyses?.map((s, i) => ({
      sessionDate: new Date(s.timestamp).toLocaleDateString(),
      sessionNumber: i + 1,
      overall: s.techniqueScores?.overall ?? null,
      launchQuality: s.insightPack?.scores?.launchQuality ?? null,
      explosiveness: s.insightPack?.scores?.explosiveness ?? null,
      speedCarry: s.insightPack?.scores?.speedCarry ?? null,
      smoothness: s.insightPack?.scores?.smoothness ?? null,
      impulseTiming: s.insightPack?.scores?.impulseTiming ?? null,
      repeatability: s.insightPack?.scores?.repeatability ?? null,
    })) ?? []
  );
</script>

<!-- Add to Performance Engine Deep Analytics section (around line 618) -->
<TechniqueScoreTrends data={techniqueData} {isMobile} />
```

**Acceptance Criteria:**
- [ ] Chart displays with data
- [ ] Shows on analytics page
- [ ] Updates when new sessions added
- [ ] Mobile responsive

---

### Task 3.3: Create Coach Diagnostics Pattern Card
**File:** `src/lib/components/analytics/DiagnosticPatternsCard.svelte` (NEW)
**Effort:** 45 minutes
**Priority:** HIGH

**Component Structure:**
```svelte
<script lang="ts">
  interface DiagnosticPattern {
    issue: string;
    occurrences: number;
    lastSeen: string;
    tone: 'positive' | 'warning' | 'neutral';
  }
  
  interface Props {
    patterns: DiagnosticPattern[];
  }
  
  let { patterns }: Props = $props();
</script>

<div class="themed-card rounded-xl p-5">
  <h3 class="text-base font-bold themed-text-primary mb-4">
    Recurring Patterns (Last 10 Sessions)
  </h3>
  
  {#each patterns as pattern}
    <div class="border-l-4 rounded p-3 mb-3" class:border-[#ff6b3d]={pattern.tone === 'warning'}>
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold">{pattern.issue}</p>
        <span class="text-xs themed-text-subtle">
          {pattern.occurrences}x in last 10
        </span>
      </div>
      <p class="text-xs themed-text-secondary mt-1">
        Last seen: {pattern.lastSeen}
      </p>
    </div>
  {/each}
</div>
```

**Acceptance Criteria:**
- [ ] Aggregates diagnostics across sessions
- [ ] Shows frequency
- [ ] Highlights recurring issues
- [ ] Color codes by tone

---

### Task 3.4: Aggregate Coach Diagnostics on Analytics Page
**File:** `src/routes/(protected)/analytics/+page.svelte`
**Effort:** 30 minutes
**Priority:** HIGH

**Changes:**
```svelte
<script>
  import DiagnosticPatternsCard from '$lib/components/analytics/DiagnosticPatternsCard.svelte';
  
  let diagnosticPatterns = $derived.by(() => {
    if (!data.sessionAnalyses) return [];
    
    // Aggregate diagnostics by title
    const patterns = new Map();
    data.sessionAnalyses.forEach(s => {
      s.diagnostics?.forEach(d => {
        if (patterns.has(d.title)) {
          patterns.get(d.title).occurrences++;
          patterns.get(d.title).lastSeen = s.timestamp;
        } else {
          patterns.set(d.title, {
            issue: d.title,
            occurrences: 1,
            lastSeen: s.timestamp,
            tone: d.tone,
          });
        }
      });
    });
    
    return Array.from(patterns.values())
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5);
  });
</script>

<DiagnosticPatternsCard patterns={diagnosticPatterns} />
```

**Acceptance Criteria:**
- [ ] Aggregates correctly
- [ ] Shows top 5 patterns
- [ ] Sorted by frequency
- [ ] Displays on analytics page

---

### Task 3.5: Create Strengths/Limiters Evolution Component
**File:** `src/lib/components/analytics/StrengthsLimitersEvolution.svelte` (NEW)
**Effort:** 1 hour
**Priority:** MEDIUM

**Component Features:**
- Show which strengths have been consistent
- Show which limiters have been resolved
- Show new issues that emerged
- Timeline view

**Acceptance Criteria:**
- [ ] Tracks evolution over time
- [ ] Visual timeline
- [ ] Highlights changes
- [ ] Responsive design

---

### Task 3.6: Display Evolution on Analytics Page
**File:** `src/routes/(protected)/analytics/+page.svelte`
**Effort:** 30 minutes
**Priority:** MEDIUM

**Acceptance Criteria:**
- [ ] Component displayed
- [ ] Data flows correctly
- [ ] Shows meaningful insights
- [ ] Updates with new sessions

---

### 📊 Phase 3 Completion Checklist:
- [ ] Task 3.1: Technique trends component created
- [ ] Task 3.2: Technique trends displayed
- [ ] Task 3.3: Diagnostic patterns component created
- [ ] Task 3.4: Diagnostic patterns displayed
- [ ] Task 3.5: Evolution component created
- [ ] Task 3.6: Evolution displayed
- [ ] All charts render correctly
- [ ] Mobile responsive
- [ ] Data accurate

**Phase 3 Deliverables:**
✅ Technique score trends over time
✅ Coach diagnostic pattern detection
✅ Strengths/limiters evolution tracking
✅ ~4-6 hours of work = Core analytics features

---

## 📋 PHASE 4: ADVANCED FEATURES
**Priority:** 🟢 MEDIUM - Nice-to-have enhancements
**Effort:** 6-8 hours
**Dependencies:** Phases 1-3 complete
**ROI:** ⭐⭐⭐ Good for power users

---

### Task 4.1: Session Page - Run Comparison Table
**Effort:** 1.5 hours
**Priority:** MEDIUM

**Features:**
- Matrix table of all runs in session
- All 6 technique dimensions
- Sortable columns
- Highlight best/worst per dimension

---

### Task 4.2: Session Page - Benchmark Comparison Bars
**Effort:** 1 hour
**Priority:** MEDIUM

**Features:**
- Visual bars showing position on scale
- "Excellent / Good / Needs Work" regions
- Current position marker
- Contextual labels

---

### Task 4.3: Session Page - Impulse Metrics Summary Cards
**Effort:** 45 minutes
**Priority:** MEDIUM

**Features:**
- 4 stat cards (not just chart)
- Time to 50%, 90% impulse
- Efficiency score
- Front-loaded score

---

### Task 4.4: Analytics - Best Session Analysis
**Effort:** 1.5 hours
**Priority:** MEDIUM

**Features:**
- Identify best performing session
- Analyze what made it work
- Conditions, scores, patterns
- Actionable insights

---

### Task 4.5: Analytics - Consistency Trends
**Effort:** 1 hour
**Priority:** MEDIUM

**Features:**
- Repeatability score trend
- CV trend
- Best vs avg gap trend
- % improvement shown

---

### Task 4.6: Analytics - Benchmark Achievement Tracking
**Effort:** 1.5 hours
**Priority:** MEDIUM

**Features:**
- Track benchmark level progression
- "Achieved Excellent in 7/10 sessions"
- Performance level timeline
- Celebration of milestones

---

### Task 4.7: Analytics - Technique Correlation Analysis
**Effort:** 2 hours
**Priority:** LOW

**Features:**
- Discover dimension relationships
- Correlation matrix
- Training insights
- "Improving X tends to improve Y"

---

### 📊 Phase 4 Completion Checklist:
- [ ] Task 4.1: Run comparison table
- [ ] Task 4.2: Benchmark bars
- [ ] Task 4.3: Impulse cards
- [ ] Task 4.4: Best session analysis
- [ ] Task 4.5: Consistency trends
- [ ] Task 4.6: Benchmark tracking
- [ ] Task 4.7: Correlation analysis
- [ ] All features tested
- [ ] Documentation updated
- [ ] User feedback collected

**Phase 4 Deliverables:**
✅ Advanced session analysis features
✅ Power user analytics features
✅ Complete Performance Engine exposure
✅ ~6-8 hours of work = Polish and depth

---

## 🗓️ RECOMMENDED SCHEDULE

### Week 1: Foundation
- **Day 1-2:** Phase 1 (Session Page Quick Wins) - 2-3 hours
  - Immediate value
  - Build momentum
  - Test workflow
  
- **Day 3-4:** Phase 2 (Analytics Foundation) - 4-6 hours
  - Unblock analytics features
  - Critical infrastructure
  - Performance testing

- **Day 5:** Testing & Refinement - 2 hours
  - Test Phases 1 & 2
  - Fix bugs
  - Gather feedback

### Week 2: Core Features
- **Day 1-3:** Phase 3 (Analytics Core) - 4-6 hours
  - High-value features
  - Cross-session insights
  - User testing

- **Day 4-5:** Testing & Documentation - 2 hours
  - Test Phase 3
  - Update docs
  - User guides

### Week 3 (Optional): Advanced Features
- **Day 1-4:** Phase 4 (Advanced) - 6-8 hours
  - Power user features
  - Polish
  - Edge cases

- **Day 5:** Final testing & launch - 2 hours
  - Comprehensive testing
  - Performance check
  - Launch prep

---

## 📊 PROGRESS TRACKING

### Overall Progress
- [ ] Phase 1: Session Page Quick Wins (0/7 tasks)
- [ ] Phase 2: Analytics Foundation (0/4 tasks)
- [ ] Phase 3: Analytics Core Features (0/6 tasks)
- [ ] Phase 4: Advanced Features (0/7 tasks)

**Total:** 0/24 tasks complete (0%)

### Milestones
- [ ] 🏁 Milestone 1: Session page enhanced (Phase 1)
- [ ] 🏁 Milestone 2: Analytics has data (Phase 2)
- [ ] 🏁 Milestone 3: Core analytics features (Phase 3)
- [ ] 🏁 Milestone 4: All features complete (Phase 4)

---

## 🎯 SUCCESS CRITERIA

### Phase 1 Success:
- Session page shows coach diagnostics ✅
- Session page shows 6-dimension technique breakdown ✅
- Session page shows strengths & limiters ✅
- No performance degradation ✅
- Mobile responsive ✅

### Phase 2 Success:
- Analytics page fetches chart_data ✅
- Performance Engine runs for last 10 sessions ✅
- Page load time < 5 seconds ✅
- No errors with 0-100+ sessions ✅

### Phase 3 Success:
- Technique trends display correctly ✅
- Diagnostic patterns identified ✅
- Strengths/limiters evolution shown ✅
- Users find value in insights ✅

### Phase 4 Success:
- All advanced features working ✅
- Power users satisfied ✅
- Performance acceptable ✅
- Documentation complete ✅

---

## 🚨 RISK MITIGATION

### Risk 1: Performance with chart_data
**Impact:** HIGH
**Mitigation:**
- Limit to 10 most recent sessions
- Add pagination if needed
- Consider database caching
- Monitor query performance

### Risk 2: Mobile performance
**Impact:** MEDIUM
**Mitigation:**
- Test on real devices early
- Use Chart.js decimation
- Lazy load components
- Optimize rendering

### Risk 3: Type errors with Performance Engine
**Impact:** MEDIUM
**Mitigation:**
- Add type guards
- Handle null/undefined
- Test edge cases
- Clear error messages

### Risk 4: User confusion with new features
**Impact:** MEDIUM
**Mitigation:**
- Add help tooltips
- User testing after Phase 1
- Iterate based on feedback
- Clear documentation

---

## 📝 NOTES

### Development Tips:
1. **Start with Phase 1** - It's the easiest win and builds momentum
2. **Test incrementally** - Don't wait until the end
3. **Mobile first** - Check mobile after each task
4. **Ask for feedback** - Show progress early and often
5. **Document as you go** - Future you will thank you

### Code Quality:
- Follow existing code style
- Add TypeScript types
- Write reusable components
- Keep components small and focused
- Comment complex logic

### Performance:
- Monitor bundle size
- Lazy load when possible
- Use derived values efficiently
- Test with realistic data volumes

---

## ✅ FINAL CHECKLIST

Before marking complete:
- [ ] All 24 tasks implemented
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable (< 5s load)
- [ ] Documentation updated
- [ ] User testing complete
- [ ] Edge cases handled
- [ ] Error handling robust

---

## 🎉 COMPLETION

When all phases are complete:

**You will have:**
- ✅ Session page with full Performance Engine display
- ✅ Analytics page with cross-session insights
- ✅ Coach diagnostics (single-session & patterns)
- ✅ Full technique score breakdowns
- ✅ Strengths/limiters tracking
- ✅ Trend analysis over time
- ✅ Benchmark comparisons
- ✅ Advanced analytics features

**Impact:**
- 🚀 Unique AI coaching capabilities
- 📈 User engagement boost
- 💎 Premium feature differentiator
- ⭐ Best-in-class BMX analytics platform

**Total Effort:** 16-24 hours spread over 2-3 weeks
**Total Value:** Immeasurable - transforms the platform

---

Good luck with implementation! 🚀
