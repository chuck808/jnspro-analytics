# Phase 1 Task 1.1: Run Tagging - Completion Steps

**Status:** 75% Complete  
**Remaining Work:** 1-2 hours

---

## ✅ Completed

1. **Database Migration** ✅
   - File: `supabase/migrations/20260503_add_run_tags.sql`
   - Added `tags TEXT[]` column to runs table
   - Created GIN index

2. **TypeScript Types** ✅
   - File: `src/lib/types/runs.ts`
   - Defined RunTag type, RunTagMeta interface
   - Helper functions: shouldExcludeFromStats(), getTagMeta()

3. **UI Component** ✅
   - File: `src/lib/components/RunTagSelector.svelte`
   - Full-featured dropdown with tag selection
   - Mobile responsive

4. **Server Action** ✅
   - File: `src/routes/(protected)/sessions/[id]/+page.server.ts`
   - Added `updateRunTags` action
   - Security: Verifies session ownership

---

## 🔨 Remaining Work

### Step 5: Update Session Stats Calculation (30 mins)

**File:** `src/routes/(protected)/sessions/[id]/+page.server.ts`

**Current Issue:** Stats include ALL runs, even warmup runs

**Fix Required:**

```typescript
// Around line 88-131, UPDATE session stats calculation

import { shouldExcludeFromStats } from '$lib/types/runs';

// Filter runs BEFORE calculating stats
const allRuns = runs ?? [];
const includedRuns = allRuns.filter((r) => !shouldExcludeFromStats(r.tags as any));
const excludedCount = allRuns.length - includedRuns.length;

const gateRuns = includedRuns
	.map((r) => r.gate_runs)
	.flat()
	.filter(Boolean);

const validRuns = gateRuns.filter((g) => g!.analytics_valid);

const sessionStats = {
	run_count: allRuns.length,
	included_run_count: includedRuns.length,
	excluded_run_count: excludedCount,
	best_reaction_ms:
		gateRuns.length > 0 ? Math.min(...gateRuns.map((g) => g!.reaction_time_ms)) : null
	// ... rest of stats using FILTERED runs
};
```

**Why This Matters:**

- Currently: "Best reaction 0.285s" includes warmup runs (inflates average)
- After fix: "Best reaction 0.265s (8 of 10 runs, 2 warmup excluded)"
- This is THE WHOLE POINT of run tagging!

---

### Step 6: Session Page Integration (1 hour)

**File:** `src/routes/(protected)/sessions/[id]/+page.svelte`

#### 6.1: Import Component & Types

```typescript
// Add to imports at top of file
import RunTagSelector from '$lib/components/RunTagSelector.svelte';
import type { RunTag } from '$lib/types/runs';
```

#### 6.2: Add RunTagSelector to Desktop Run Selector

Find the desktop run selector (around line 689-714), update button to include tag selector:

```svelte
{#each data.runs as run, i}
    {@const g = run.gate_runs}
    {@const runTags = (run as any).tags as RunTag[] | null}
    <div class="flex items-center gap-2">
        <button
            onclick={() => selectedRunIdx = i}
            aria-pressed={selectedRunIdx === i}
            class="flex flex-col items-center px-3 py-2.5 rounded-lg border text-xs
                   transition-colors min-w-[64px] min-h-[44px] justify-center
                   {selectedRunIdx === i
                       ? 'bg-[#f5a623]/10 border-[#f5a623]/40 text-[#f5a623]'
                       : 'bg-[#0a0809] border-[#221c18] text-[#9a8f7a] hover:border-[#f5a623]/20'}"
        >
            <span class="font-bold">Run {run.run_number}</span>
            <span class="text-[10px] mt-0.5 opacity-75">{g ? fmtReaction(g.reaction_time_ms) : '—'}</span>
        </button>

        <!-- Tag selector -->
        <RunTagSelector
            runId={run.id}
            runNumber={run.run_number}
            currentTags={runTags ?? []}
            sessionId={data.session.id}
            compact={false}
        />
    </div>
{/each}
```

#### 6.3: Update Session Stats Display

Find session stats display (around line 647-665), add excluded run count:

```svelte
<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
	<div class="mb-1 flex items-start justify-between gap-4">
		<div class="min-w-0 flex-1">
			<!-- existing header content -->
		</div>
	</div>

	{#if data.sessionStats.excluded_run_count > 0}
		<p class="mt-2 text-xs text-[#9a8f7a]">
			Showing {data.sessionStats.included_run_count} of {data.sessionStats.run_count} runs ({data
				.sessionStats.excluded_run_count} warmup/excluded)
		</p>
	{/if}
</div>
```

#### 6.4: Mobile Run Selector (Optional Enhancement)

The SwipeableRunSelector component also needs tag integration, but can be done later.

---

## 🧪 Testing Checklist

Once integrated, test:

- [ ] **Deploy migration**: Run `supabase db push` or deploy via dashboard
- [ ] **Tag a run**: Click tag button, select "Warmup", save
- [ ] **Verify persistence**: Reload page, tag should still be there
- [ ] **Check stats**: Session stats should exclude the tagged run
- [ ] **Tag multiple runs**: Tag 2-3 runs as warmup
- [ ] **Verify exclusion message**: Should show "Showing 7 of 10 runs (3 warmup excluded)"
- [ ] **Analytics page**: Verify excluded runs don't affect trends
- [ ] **Mobile**: Test on mobile viewport
- [ ] **Multiple tags**: Add multiple tags to same run
- [ ] **Remove tag**: Un-check tag, verify it's removed

---

## 📊 Expected Behavior After Completion

### Before Run Tagging:

```
Session Stats:
Best Reaction: 0.285s  ← INCLUDES warmup runs
Avg Reaction: 0.310s   ← INFLATED by warmups
```

### After Run Tagging:

```
Session Stats:
Best Reaction: 0.265s  ← Warmups excluded!
Avg Reaction: 0.275s   ← TRUE performance average
Showing 8 of 10 runs (2 warmup excluded)
```

**This is critical for data integrity!**

---

## 🚀 Quick Start to Finish

```bash
# 1. Deploy database migration
cd jnspro-analytics
supabase db push

# 2. Update session stats calculation
# Edit: src/routes/(protected)/sessions/[id]/+page.server.ts
# Add: shouldExcludeFromStats import and filtering logic

# 3. Integrate into session page
# Edit: src/routes/(protected)/sessions/[id]/+page.svelte
# Add: RunTagSelector component to run buttons

# 4. Test locally
pnpm dev

# 5. Navigate to any session with multiple runs
# 6. Click "Tag" button on a run
# 7. Select "Warmup"
# 8. Verify stats update
```

---

## 📝 Notes

- **Security**: Server action verifies session ownership via `session_id` check
- **Performance**: GIN index on tags column ensures fast filtering
- **UX**: Tags display as colored badges with icons
- **Flexibility**: Users can add multiple tags per run
- **Reversible**: Tags can be added/removed anytime

---

## ✅ Completion Criteria

Task 1.1 is complete when:

- [ ] Database migration deployed
- [ ] Stats calculation filters excluded runs
- [ ] RunTagSelector integrated on session page
- [ ] Excluded run count displays correctly
- [ ] All tests passing
- [ ] User can tag runs end-to-end

**After completion, move to Task 1.2: Cross-Page Deep Linking**
