# Phase 5: Analytics Page Refactoring Plan

**Date:** April 27, 2026  
**Status:** In Progress  
**Goal:** Break monster +page.svelte into focused, reusable components

---

## ✅ Completed

### 1. SessionHistoryPanel.svelte (53 lines)

**Location:** `src/lib/components/analytics/SessionHistoryPanel.svelte`

**Extracted:**

- Session history list
- Date formatting
- Click handlers for individual sessions

**Props:**

```typescript
sessions: SessionSummary[]
```

---

### 2. RawPerformanceTrendsSection.svelte (236 lines)

**Location:** `src/lib/components/analytics/RawPerformanceTrendsSection.svelte`

**Extracted:**

- Reaction time trend chart
- Peak speed trend chart
- Consistency CV chart
- Chart.js rendering logic
- Trend arrows and colors

**Props:**

```typescript
sessions: SessionSummary[]
trend: { reaction: number | null; speed: number | null }
isMobile: boolean
onOpenHelp: (key: string) => void
```

---

## 🔄 Next Steps (Remaining Components)

### 3. AdvancedAnalyticsSection.svelte

Should contain:

- Speed heatmap panel
- Quickness correlation panel
- Session comparison panel
- Rolling analytics panel (10+ sessions)
- Statistical analysis panel (20+ sessions)

**Estimated:** ~400 lines

---

### 4. Update +page.svelte

Transform from ~700 lines → ~150 lines

**Before:**

```svelte
<script>
	// 700+ lines of logic, charts, derived values
</script>

<!-- Massive template with all panels inline -->
```

**After:**

```svelte
<script>
	import SessionHistoryPanel from '$lib/components/analytics/SessionHistoryPanel.svelte';
	import RawPerformanceTrendsSection from '$lib/components/analytics/RawPerformanceTrendsSection.svelte';
	import AdvancedAnalyticsSection from '$lib/components/analytics/AdvancedAnalyticsSection.svelte';

	// Minimal page-level state
</script>

<AnalyticsHeader />
<AnalyticsUnlocks />
<PerformanceOverview />
<TrainingInsightsSection />
<RawPerformanceTrendsSection />
<AdvancedAnalyticsSection />
<SessionHistoryPanel />
```

---

## 📁 Suggested Final Structure

```
src/lib/components/analytics/
  ├── index.ts                          # Export all components
  ├── SessionHistoryPanel.svelte        ✅ Created (53 lines)
  ├── RawPerformanceTrendsSection.svelte ✅ Created (236 lines)
  └── AdvancedAnalyticsSection.svelte   ⏳ TODO (~400 lines)
      ├── SpeedHeatmapPanel
      ├── QuicknessCorrelationPanel
      ├── SessionComparisonPanel
      ├── RollingAnalyticsPanel
      └── StatisticalAnalysisPanel
```

---

## 🎯 Benefits of Refactoring

### Code Quality

- **Maintainability:** Each component has single responsibility
- **Testability:** Easier to unit test individual components
- **Reusability:** Components can be used elsewhere
- **Readability:** Page structure clear at a glance

### Developer Experience

- **Faster debugging:** Isolate issues to specific components
- **Easier feature additions:** Add new panels without touching others
- **Better collaboration:** Multiple devs can work on different panels
- **Type safety:** Clear prop interfaces

### Performance

- **Code splitting:** Components can be lazy-loaded
- **Selective re-rendering:** Only affected components update
- **Smaller bundles:** Unused components can be tree-shaken

---

## 📊 Metrics

| Metric             | Before    | After (Target) |
| ------------------ | --------- | -------------- |
| +page.svelte lines | ~700      | ~150           |
| Largest component  | N/A       | ~400 lines     |
| Components count   | 0         | 3              |
| Reusability        | Low       | High           |
| Testability        | Difficult | Easy           |

---

## 🔍 Design Principles Applied

### 1. Single Responsibility

Each component does ONE thing:

- SessionHistoryPanel → Shows session list
- RawPerformanceTrendsSection → Charts for trends
- AdvancedAnalyticsSection → Advanced analysis panels

### 2. Props Down, Events Up

Components receive data via props, emit events via callbacks:

```typescript
<Component
  data={sessions}
  onEvent={() => handleEvent()}
/>
```

### 3. Composition Over Inheritance

Build complex UI from simple components:

```svelte
<AdvancedAnalyticsSection>
	<SpeedHeatmapPanel />
	<QuicknessCorrelationPanel />
</AdvancedAnalyticsSection>
```

### 4. Co-location

Keep related logic together:

- Component logic in <script>
- Component template
- Component styles in <style>

---

## 🚧 Implementation Notes

### TypeScript Interfaces

Shared interfaces should be defined in each component or extracted to a shared types file:

```typescript
// Option 1: Component-local
interface SessionSummary { ... }

// Option 2: Shared types file
// src/lib/analytics/types.ts
export interface SessionSummary { ... }
```

### Chart.js Management

Each chart component manages its own Chart.js instances:

- Created in `$effect` hook
- Destroyed on cleanup
- Updated on prop changes

### Mobile Responsiveness

Components adapt to `isMobile` prop:

- Different chart sizes
- Conditional legend display
- Touch-friendly hit areas

---

## 🧪 Testing Strategy

### Unit Tests (Per Component)

```typescript
describe('SessionHistoryPanel', () => {
	it('renders list of sessions', () => {});
	it('formats dates correctly', () => {});
	it('links to session detail pages', () => {});
});

describe('RawPerformanceTrendsSection', () => {
	it('renders charts when sessions >= 3', () => {});
	it('shows trend arrows correctly', () => {});
	it('handles mobile view', () => {});
});
```

### Integration Tests

```typescript
describe('Analytics Page', () => {
	it('shows all sections when data available', () => {});
	it('progressively unlocks features', () => {});
});
```

---

## 📝 Remaining Work

### High Priority

1. ✅ Create SessionHistoryPanel
2. ✅ Create RawPerformanceTrendsSection
3. ⏳ Create AdvancedAnalyticsSection
4. ⏳ Update +page.svelte to use components
5. ⏳ Create index.ts export file
6. ⏳ Test all functionality still works

### Medium Priority

7. Extract AnalyticsHeader component
8. Extract AnalyticsUnlocks component
9. Extract PerformanceOverview component

### Low Priority (Future)

10. Extract sub-components from AdvancedAnalyticsSection
11. Create shared analytics types file
12. Add Storybook stories for components
13. Write unit tests

---

## 🎯 Success Criteria

- [x] SessionHistoryPanel extracted
- [x] RawPerformanceTrendsSection extracted
- [ ] AdvancedAnalyticsSection extracted
- [ ] +page.svelte reduced to ~150 lines
- [ ] All functionality preserved
- [ ] Zero TypeScript errors
- [ ] No runtime errors
- [ ] Charts still render correctly
- [ ] Mobile responsive still works

---

## 📊 Estimated Effort

| Task                                | Time       | Status            |
| ----------------------------------- | ---------- | ----------------- |
| Extract SessionHistoryPanel         | 10 min     | ✅ Done           |
| Extract RawPerformanceTrendsSection | 20 min     | ✅ Done           |
| Extract AdvancedAnalyticsSection    | 30 min     | ⏳ Next           |
| Update +page.svelte                 | 15 min     | ⏳ Next           |
| Testing & fixes                     | 15 min     | ⏳ After          |
| **Total**                           | **90 min** | **~40% complete** |

---

## 🔄 Migration Path

### Step 1: Extract (Current)

Move code from +page.svelte to new components WITHOUT changing logic

### Step 2: Test

Verify all functionality still works

### Step 3: Improve (Future)

Once extracted, can improve individual components:

- Better TypeScript types
- Improved accessibility
- Performance optimizations
- Unit tests

---

## 💡 Lessons Learned

### What Worked Well

- ✅ Extracting in order (small → large)
- ✅ Keeping prop interfaces simple
- ✅ Preserving exact logic during extraction
- ✅ Fixing TypeScript errors immediately

### Challenges

- Identifying all dependencies
- Managing Chart.js lifecycles
- Maintaining mobile responsiveness
- Keeping prop drilling manageable

---

**Status:** Phase 5 In Progress (40% complete)  
**Next:** Extract AdvancedAnalyticsSection + Update +page.svelte  
**ETA:** 45 minutes remaining

---

**Created:** April 27, 2026  
**Last Updated:** April 27, 2026, 5:23 PM  
**By:** Refactoring Team
