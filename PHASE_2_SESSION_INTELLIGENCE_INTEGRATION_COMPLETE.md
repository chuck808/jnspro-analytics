# Phase 2: Session Intelligence Integration — COMPLETE

**Date:** May 1, 2026  
**Status:** ✅ Complete

## Executive Summary

Successfully integrated **Session Intelligence** insights into the Performance Engine's `SessionAnalysis` output. The engine now provides coaching-level intelligence about session patterns (drop-off detection, optimal set length, best vs average analysis) alongside physics and technique metrics in a single unified response.

---

## Problem Statement

Session Intelligence (`sessionIntelligence.ts`) was computing valuable insights that weren't exposed through the Performance Engine's main `analyseSession()` function:

- ❌ **Drop-off Detection** - When fatigue causes performance to fall apart
- ❌ **Optimal Set Length** - How many quality runs riders should do
- ❌ **Best vs Average Gap** - The coaching vs rider perspective difference

These insights were **separate** from the engine output, requiring:
- Multiple function calls
- Manual integration by consumers
- Inconsistent availability across UI components

---

## Solution: Unified Intelligence Output

Session Intelligence insights are now **built into** the Performance Engine's `SessionAnalysis` type as an optional `intelligence` field.

### New Structure

```typescript
interface SessionAnalysis {
  // ... existing fields
  intelligence?: {
    bestVsAvg: {
      best: number;
      average: number;
      gap: number;
      gapPercent: number;
      consistencyType: 'consistent' | 'moderate' | 'inconsistent';
    } | null;
    dropOff: {
      dropOffRun: number;     // Run number where performance drops >6%
      dropPercent: number;    // How much it dropped
    } | null;
    setLength: {
      optimal: number;        // Recommended set length
      message: string;        // Coaching message
    };
    sessionQuality: number;   // 0-100 composite quality score
    headline: string;         // Session summary headline
  } | null;
}
```

---

## What Was Integrated

### 1. **Best vs Average Analysis** (`analyseBestVsAverage`)
- **Purpose:** Highlights the gap between peak and typical performance
- **Key Insight:** Riders judge by best run, coaches judge by average
- **Consistency Types:**
  - `consistent` - Gap < 5% (reliable performance)
  - `moderate` - Gap 5-10% (some variability)
  - `inconsistent` - Gap > 10% (chasing peak runs)

### 2. **Drop-off Detection** (`detectDropOff`)
- **Purpose:** Finds when performance drops >6% from best-so-far
- **Key Insight:** Answers "When does fatigue hit?"
- **Returns:** Run number and percentage drop
- **Null if:** No significant drop detected

### 3. **Optimal Set Length** (`suggestSetLength`)
- **Purpose:** Recommends how many runs to do per set
- **Key Insight:** Stop before quality degrades
- **Logic:** 
  - If drop-off detected: suggest stopping 1 run before it
  - If no drop-off: current length is appropriate

### 4. **Session Quality Score**
- **Calculation:** `baseConsistency - (hasDropOff ? 20 : 0)`
- **Purpose:** Composite measure of session effectiveness
- **Range:** 0-100

### 5. **Session Headline**
- **Purpose:** One-line summary of session quality
- **Examples:**
  - "Performance drops after run 5"
  - "Very consistent session"
  - "Inconsistent session"
  - "Mixed session quality"

---

## Files Modified

### 1. **`performance-engine/types.ts`**
Added `intelligence` field to `SessionAnalysis` interface

### 2. **`performance-engine/analyseSession.ts`**
- Imported intelligence functions: `analyseBestVsAverage`, `detectDropOff`, `suggestSetLength`
- Added intelligence computation in `analyseSession()` after speed extraction
- Returns intelligence insights in SessionAnalysis output
- Only computed if peak speeds are available (guards against empty sessions)

### 3. **No changes to existing intelligence modules**
- `bestVsAverage.ts` - unchanged
- `dropoff.ts` - unchanged  
- `setLength.ts` - unchanged
- `sessionIntelligence.ts` - still available for direct use if needed

---

## Integration Logic

```typescript
// In analyseSession() after extracting peak speeds:

if (peakSpeeds.length > 0) {
  const bestVsAvg = analyseBestVsAverage(peakSpeeds);
  const dropOff = detectDropOff(peakSpeeds);
  const setLength = suggestSetLength(dropOff, runs.length);
  
  const sessionQuality = Math.max(0, baseQuality - (dropOff ? 20 : 0));
  
  let headline = 'Mixed session quality';
  if (dropOff) {
    headline = `Performance drops after run ${dropOff.dropOffRun}`;
  } else if (consistency.score > 80) {
    headline = 'Very consistent session';
  } else if (consistency.score < 60) {
    headline = 'Inconsistent session';
  }
  
  intelligence = { bestVsAvg, dropOff, setLength, sessionQuality, headline };
}
```

---

## Benefits

### ✅ Single API Call
**Before:**
```typescript
const analysis = analyseSession(session, rider);
const intelligence = analyseSessionIntelligence(runData); // separate call
```

**After:**
```typescript
const analysis = analyseSession(session, rider);
// intelligence included in analysis.intelligence
```

### ✅ Consistent Availability
- Intelligence always computed alongside physics/technique
- No risk of forgetting to call intelligence analysis
- UI components can rely on single data source

### ✅ Type Safety
- Intelligence structure fully typed
- IntelliSense support
- Compile-time validation

### ✅ Backward Compatible
- `intelligence` field is optional
- Null if no speed data available
- Doesn't break existing code

---

## Use Cases

### UI: Session Summary Card
```typescript
const { intelligence } = sessionAnalysis;

if (intelligence) {
  console.log(intelligence.headline);  // "Performance drops after run 5"
  
  if (intelligence.dropOff) {
    showWarning(`Stop sets around run ${intelligence.setLength.optimal}`);
  }
  
  if (intelligence.bestVsAvg.consistencyType === 'inconsistent') {
    showCoachingTip('Focus on repeatability, not peak runs');
  }
}
```

### UI: Best vs Average Badge
```typescript
if (intelligence?.bestVsAvg) {
  const { gapPercent, consistencyType } = intelligence.bestVsAvg;
  
  const color = {
    consistent: 'green',
    moderate: 'yellow',
    inconsistent: 'red'
  }[consistencyType];
  
  showBadge(`${gapPercent.toFixed(1)}% gap`, color);
}
```

### UI: Optimal Set Length Recommendation
```typescript
if (intelligence?.setLength.optimal < session.runs.length) {
  showRecommendation(
    `Optimal set length: ${intelligence.setLength.optimal} runs`,
    intelligence.setLength.message
  );
}
```

---

## Comparison: Old vs New Architecture

### Before Phase 2
```
analyseSession() ──> Physics + Technique
                     (no intelligence)

analyseSessionIntelligence() ──> Intelligence insights
                                 (separate call)
```

**Problems:**
- UI must call two functions
- Inconsistent data availability
- Manual coordination required

### After Phase 2
```
analyseSession() ──> Physics + Technique + Intelligence
                     (unified output)
```

**Benefits:**
- Single source of truth
- Always available
- Consistent across UI

---

## What Remains Separate

**`sessionIntelligence.ts`** still exists and provides:
- `analyseSessionIntelligence()` - standalone function
- `SessionIntelligenceReport` - includes fatigue & repeatability analysis
- Recommendations array building

**Why keep it?**
- ✅ Backward compatibility
- ✅ More detailed report if needed (includes repeatability metrics)
- ✅ Standalone use cases

**Future consideration:**
Could deprecate if the Performance Engine intelligence field covers all use cases.

---

## Testing Recommendations

### 1. **Unit Tests**
```typescript
test('intelligence included when speeds available', () => {
  const session = { runs: [/* runs with speeds */] };
  const result = analyseSession(session);
  
  expect(result.intelligence).toBeDefined();
  expect(result.intelligence?.bestVsAvg).toBeDefined();
});

test('intelligence null when no speeds', () => {
  const session = { runs: [] };
  const result = analyseSession(session);
  
  expect(result.intelligence).toBeNull();
});
```

### 2. **Integration Tests**
- Verify drop-off detection works with real session data
- Test optimal set length calculation
- Validate best vs average gap calculation

### 3. **Regression Tests**
- Ensure existing consumers still work
- Verify backward compatibility
- Check performance (no significant slowdown)

---

## Migration Checklist

- [x] Add intelligence field to SessionAnalysis type
- [x] Import intelligence functions in analyseSession
- [x] Integrate intelligence computation
- [x] Export intelligence in SessionAnalysis output
- [x] Document integration
- [ ] Update UI components to use intelligence field (Phase 3)
- [ ] Add unit tests for intelligence integration
- [ ] Deprecate standalone sessionIntelligence calls (Phase 3)

---

## Next Steps: Phase 3

### Update Bridge Layer & UI
Now that both legacy features and intelligence are in the Performance Engine:

1. **Simplify Bridge Layer**
   - Remove calls to legacy analytics
   - Remove calls to separate intelligence functions
   - Use engine's unified output directly

2. **Update UI Components**
   - Session pages: use `analysis.intelligence`
   - Run cards: use `analysis.physics.speedSplits`
   - Quality badges: use `analysis.physics.dataQuality`

3. **Deprecate Redundant Calls**
   - Mark legacy analytics as `@deprecated`
   - Mark standalone intelligence calls as `@deprecated`
   - Guide developers to use Performance Engine

---

## Code Quality Notes

All intelligence integration:
- ✅ Computed only when data available (guards against null)
- ✅ Maintains same logic as standalone functions
- ✅ Properly typed with TypeScript
- ✅ Null-safe (optional intelligence field)
- ✅ No breaking changes to existing API
- ✅ Clean separation of concerns

---

## Conclusion

Phase 2 successfully integrates Session Intelligence insights into the Performance Engine's unified output. The engine now provides:

1. **Physics & Technique** (Phase 0 - existing)
2. **Legacy Analytics Features** (Phase 1 - speed splits, quality, stability)
3. **Session Intelligence** (Phase 2 - drop-off, optimal sets, best vs avg)

All in a **single API call** with **type-safe**, **consistent** output.

**Key Achievement:** Unified all analytics layers into Performance Engine — one call, complete insights.
