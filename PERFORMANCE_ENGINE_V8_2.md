# Performance Engine v8.2 — Truth Rules

## Purpose

v8.2 prevents contradictory coaching output by applying priority-based logic.

**Core Rule:** If there is a problem, do not say everything is excellent.

## The Problem

During testing, we found cases like:

```text
Warning:
Speed improving but consistency declining

Recommendation:
Excellent progress - maintain current approach
```

This is confusing and damages trust. The warning should override the positive message.

## Solution

v8.2 applies truth rules before presenting coaching output:

1. **Evaluates report** for contradictions or mixed signals
2. **Applies priority-based override** if needed
3. **Ensures honest messaging** that matches the detected issues

## Implementation

### Files Created

```
src/lib/performance-engine/crossSession/
  ├── truthRules.ts           # Core truth rule logic
  ├── comparisonFormatting.ts # Metric comparison helpers
  └── types.ts                # (existing)
```

### Integration

Truth rules are applied automatically in the analytics page:

```typescript
import { applyTruthRulesToReport } from '$lib/performance-engine/crossSession/truthRules';

const rawReport = analyseCrossSessionIntelligence(sessionSummaries);
const crossSessionReport = applyTruthRulesToReport(rawReport); // v8.2 applied
```

## Truth Rule Priority

Rules are evaluated in this order (highest priority first):

### Priority 1: Mixed Trends (Early Signal Mode)

- **Trigger:** Speed/reaction improving BUT repeatability declining OR gap widening
- **Low Confidence Override:** "Early signal — speed improving but capacity needs watching"
- **Low Confidence Recommendations:**
  - Keep logging sessions to build confidence in this pattern
  - Watch whether speed gains are maintained across full sets
  - If the pattern persists, address capacity before chasing more speed
- **Higher Confidence Override:** "Mixed performance — peaks improving but consistency declining"
- **Prevents:** Celebrating unsustainable peak gains
- **Key:** Acknowledges detected pattern even with limited data, but flags the uncertainty

### Priority 2: Low Confidence (Generic)

- **Trigger:** `confidence === 'low'` (without mixed signals)
- **Override:** "Early trend signal — more sessions needed"
- **Recommendations:**
  - Keep logging sessions to build confidence in trend analysis
  - Initial patterns are detectable but need more data to confirm
- **Prevents:** False confidence OR excessive caution when early signals exist

### Priority 3: Major Decline

- **Trigger:** Any metric trending down (speed, reaction, power, consistency)
- **Override:** "Performance declining — [metrics] trending down"
- **Prevents:** Positive messaging during decline phase

### Priority 4: Contradictory Messaging

- **Trigger:** Warnings exist but headline contains "excellent" or "strong progress"
- **Override:** "Progress with areas to watch" + filtered recommendations
- **Prevents:** Mixed messages that confuse riders

## Example Outputs

### Before v8.2 (Contradictory)

```text
Headline: Excellent progress across all areas
Warnings: Consistency declining by 12%
Recommendations: Maintain current approach
```

### After v8.2 (Truthful)

```text
Headline: Mixed performance — peaks improving but consistency declining
Recommendations:
  • Peak outputs are rising, but repeatability is suffering
  • Focus on consistent execution over peak performance
  • Repeatable technique builds sustainable progress
```

## Comparison Formatting

The `comparisonFormatting.ts` helper prevents confusing metric displays, especially for "lower-is-better" metrics:

### Before (Confusing)

```text
Best reaction: ↑ 21.8% (worse)
```

### After (Clear)

```text
Best reaction: 0.190s → 0.243s (worse by 0.053s)
```

### Usage

```typescript
import { formatReactionComparison } from '$lib/performance-engine/crossSession/comparisonFormatting';

const comparison = formatReactionComparison(0.19, 0.243);
// {
//   fromValue: '0.190s',
//   toValue: '0.243s',
//   change: '0.053s',
//   isImproving: false,
//   percentChange: 27.89,
//   narrative: '0.190s → 0.243s (worse by 0.053s)'
// }
```

## Testing

v8.2 can be tested using the scenarios in `TEST_SCENARIOS.md`:

- **Scenario 4:** Excessive wheelie pattern (should warn, not praise)
- **Scenario 6:** Poor data quality (should flag, not claim progress)
- **Scenario 8:** Mixed signals (speed up, consistency down)

## Why This Matters

This is a **trust layer**. The system must not say:

```text
"Everything is excellent"
```

when it has already detected:

```text
"Something needs attention"
```

v8.2 keeps the coaching narrative honest and prevents erosion of rider trust.

## API Reference

### `applyTruthRulesToReport()`

Applies truth rules to a cross-session report, returning modified version if override needed.

```typescript
function applyTruthRulesToReport(report: CrossSessionReport | null): CrossSessionReport | null;
```

### `applyCrossSessionTruthRules()`

Evaluates a report and returns override details if rule triggered.

```typescript
function applyCrossSessionTruthRules(report: CrossSessionReport): TruthRuleResult | null;

interface TruthRuleResult {
	overrideHeadline?: string;
	overrideRecommendations?: string[];
	reason: string;
	priority: number;
}
```

### `detectContradiction()`

Checks if a report contains contradictory messaging.

```typescript
function detectContradiction(report: CrossSessionReport): string | null;
```

Returns reason string if contradiction found, null if report is truthful.

## Status

- ✅ Truth rules implemented
- ✅ Integrated into analytics page
- ✅ Zero TypeScript errors
- ✅ Comparison formatting helpers added
- ✅ Ready for production

v8.2 is live and protecting coaching integrity.
