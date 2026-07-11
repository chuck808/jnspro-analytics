# Performance Engine v8.3 — Controlled Language System

## Purpose

v8.3 creates consistent coaching language without needing AI.

**Core Principle:** Engine calculates. Language system explains. UI displays.

## The Problem

Session views can become noisy when old analytics and new Performance Engine run side by side. The new engine should avoid:

- Repeated warnings
- Conflicting advice
- Calibration-limited metrics being praised
- Multiple voices speaking at once

**Bridge mode duplication is expected.**
**New system should not duplicate itself.**

## Solution

v8.3 provides a controlled language dictionary that:

1. **Separates calculation from explanation**
2. **Ensures single coach voice**
3. **Provides consistent messaging across all views**
4. **Can be extended to AI rephrasing**

## Implementation

### Files Created

```
src/lib/performance-engine/
  ├── language/
  │   ├── types.ts        # Type definitions
  │   ├── phrases.ts      # Phrase dictionary
  │   ├── render.ts       # Rendering functions
  │   └── index.ts        # Exports
  └── sessionNarrative.ts # Narrative builder
```

### Usage

```typescript
import { buildSessionNarrative } from '$lib/performance-engine/sessionNarrative';

const narrative = buildSessionNarrative({
  runCount: 5,
  consistencyScore: 15,
  reactionCvPercent: 8.5,
  dataQualityRating: 'fair',
  speedBlocked: true,
  powerBlocked: true,
  hasCalibrationWarnings: true
});

// narrative.message contains the coach message
// narrative.trust contains trust indicators
// narrative.warnings contains any warnings
```

## Session Narrative Output

```typescript
interface SessionNarrative {
  message: {
    headline: string;
    impact: string;
    whyThisMatters: string;
    action: string;
    watchFor: string | null;
    confidence: 'low' | 'moderate' | 'high';
    priority: 'critical' | 'important' | 'watch' | 'info';
  };
  trust: {
    confidence: 'low' | 'moderate' | 'high';
    basedOnRuns: number;
    trustedMetrics: string[];
    cautionMetrics: string[];
    blockedMetrics: string[];
  };
  warnings: string[];
}
```

## Example Output

### Input
```typescript
{
  runCount: 5,
  reactionCvPercent: 8.5,
  dataQualityRating: 'fair',
  speedBlocked: true,
  hasCalibrationWarnings: true
}
```

### Output
```
[Based on 5 runs]

## Calibration limited — use technique patterns, not speed or power

**Impact:** Some derived metrics appear unreliable, so coaching should focus on trusted signals only.

**Why this matters:** Speed and power depend on calibration, time units and integration quality. If those are off, absolute values can mislead.

💡 Use this run for technique review, not absolute speed or power judgement.

👁️ **Watch for:** speed and power values returning to realistic ranges after calibration checks

⚠️ **Blocked metrics:** speed, power
```

## Message Priority System

Messages are selected in this priority order:

1. **Critical:** Calibration issues
2. **Important:** Fatigue detected
3. **Watch:** Poor consistency, wide best-vs-avg gap
4. **Info:** Low run count, good consistency

Higher priority messages override lower priority ones.

## Phrase Dictionary

### Headlines
- `calibrationLimited` - For data quality issues
- `excellentConsistency` - CV < 2%
- `goodConsistency` - CV 2-5%
- `variableConsistency` - CV > 5%
- `lowRunCount` - < 3 runs
- `fatigue` - Quality dropped mid-set
- `peaksWithoutRepeatability` - Best-avg gap > 15%

### Impacts
- Clear explanation of what the pattern means
- Evidence-based, not judgmental

### Why This Matters
- Connects pattern to rider goals
- Explains coaching relevance

### Actions
- Specific, actionable guidance
- Humble language: "Consider...", "Focus on..."

### Watch For
- Observable targets for improvement
- Helps close the feedback loop

## Integration Guidance

Place session narrative near the top of Performance Engine section:

```
Performance Engine
  ├── Coach Summary (v8.3 narrative)
  ├── Metrics
  ├── Charts
  ├── Detailed diagnostics
  └── Debug data
```

The narrative should be the **single coach voice**.

## Rendering

### Markdown Format
```typescript
import { renderCoachMessage } from '$lib/performance-engine/language';

const markdown = renderCoachMessage(narrative.message, narrative.trust);
```

### UI Colors
```typescript
import { getPriorityColor, getConfidenceColor } from '$lib/performance-engine/language';

const priorityColor = getPriorityColor(narrative.message.priority);
const confidenceColor = getConfidenceColor(narrative.message.confidence);
```

## Extension Points

The same language dictionary can be used by:

- Cross-session truth rules (v8.2)
- Technique outcome links
- Feedback analytics
- Future AI rephrasing
- Email/notification summaries

## Bridge Mode Rule

```
Old system may duplicate new system.
New system should not duplicate itself.
```

During transition:
- ✅ Old analytics can show alongside new engine
- ✅ Duplication is temporary and expected
- ❌ New engine should not generate multiple coach messages
- ❌ New engine should not contradict itself

## API Reference

### `buildSessionNarrative()`

```typescript
function buildSessionNarrative(input: SessionNarrativeInput): SessionNarrative

interface SessionNarrativeInput {
  runCount: number;
  consistencyScore?: number | null;
  reactionCvPercent?: number | null;
  dataQualityRating?: 'excellent' | 'good' | 'fair' | 'calibrate' | null;
  speedBlocked?: boolean;
  powerBlocked?: boolean;
  hasCalibrationWarnings?: boolean;
  fatigueDetected?: boolean;
  dropOffRun?: number | null;
  bestVsAvgGapPercent?: number | null;
}
```

### `renderCoachMessage()`

```typescript
function renderCoachMessage(
  message: CoachMessage,
  trust: TrustContext
): string
```

Returns markdown-formatted message.

### `renderTrustSummary()`

```typescript
function renderTrustSummary(trust: TrustContext): string
```

Returns concise trust summary: "✓ Trusted: reaction time • ✗ Blocked: speed, power"

## Status

- ✅ Language system implemented
- ✅ Session narrative builder created
- ✅ Rendering functions complete
- ✅ Zero TypeScript errors
- ✅ Ready for integration into session views

v8.3 provides the foundation for a single, consistent coach voice across the entire application.
