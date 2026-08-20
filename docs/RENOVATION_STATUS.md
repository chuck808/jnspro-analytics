# Renovation Current Status

> Short current-state pointer. Read this alongside `docs/RENOVATION_ROADMAP.md`; the roadmap contains the full 15-phase plan and product invariants, while this file records the latest signed-off phase and exact continuation point.

## Current position

**Release 2 — Make It Feel Like One Product**

- Phase 1 — Shared authenticated shell: DONE
- Phase 2 — Workspace-aware navigation: DONE
- Phase 3 — Rider Home: DONE
- Phase 4 — Sessions index: DONE
- Phase 5 — Single-session Overview: DONE
- Phase 6 — Session Analysis: DONE
- **Phase 7 — Session Deep Dive: DONE**
- **Phase 8 — Progress / longitudinal analytics: IN PROGRESS**

## Phase 5 sign-off

The single-session Overview is intentionally the first analytical layer rather than a compressed copy of Analysis.

Signed-off hierarchy:

1. session identity / setup context;
2. **What happened?** hero with canonical eligible evidence;
3. three useful anchors (reaction, speed when valid, peak G);
4. conditions/context when present;
5. genuine achievement/share opportunity when detected;
6. concise run-by-run visual story;
7. **What it means** narrative;
8. goal movement and bike/setup-change context when relevant;
9. one primary strength and one primary focus;
10. explicit eligibility/exclusion context when runs are excluded;
11. **Explore the runs** hand-off into Analysis.

## Phase 6 sign-off

Session Analysis now has a distinct middle-layer job: **understand the selected run and how it differs, without becoming a catalogue of every diagnostic the system can calculate.**

Signed-off hierarchy:

1. choose / compare runs;
2. selected run at a glance;
3. optional video as supplementary evidence;
4. primary G-force and valid speed/acceleration traces;
5. reliable impulse/power force-delivery evidence;
6. consolidated run-specific interpretation;
7. compact technique summary;
8. explicit hand-off to Deep Dive.

The Overview-style `TrainingInsightsPanel`, repeated chart-adjacent insight callouts, jerk trace, detailed phase analysis, acceleration splits, detailed six-dimension technique block and coach diagnostics no longer clutter Analysis.

Expert capability was preserved rather than removed.

## Phase 7 sign-off

Session Deep Dive now has a coherent expert-layer job:

> **What does the underlying evidence show, how was it derived, and where should I investigate further?**

Signed-off hierarchy:

1. Deep Dive orientation;
2. evidence quality / provenance first;
3. selected-run raw G-force evidence;
4. early-force stability;
5. expert diagnostics — jerk, detailed phases, acceleration splits, detailed technique and Coach Insights;
6. rider-level benchmark context;
7. **What to investigate next** — weaknesses and prioritised recommendations;
8. supporting actions — notes, previous-session comparison and report generation.

The hierarchy is intentionally **evidence -> derivation -> interpretation -> action**.

Independent live verification confirmed the full hierarchy on real device data, clean mobile rendering, retained notes/report access, and green `svelte-check`, TypeScript and 109 Vitest tests.

The specific `hasCalibrationWarning` state was not independently triggered in the live test, but its placement shares the same verified top-of-page evidence-quality branch as the missing-mass warning. Treat a future real-session calibration report as something to investigate directly rather than assuming the branch is broken.

## Non-obvious session-share invariant

`SocialShareModal` must always bind to the **persisted** achievement (`persistedAchievement`), never the first-time setup live preview.

The first-time `SessionSetupStrip` can preview how context/tag edits would change the hero achievement before save. That preview is deliberately not shareable. Sharing is only enabled for evidence that has actually been persisted and can therefore be reproduced later.

## Test-fixture caveat

Synthetic DB sessions without `chart_data` can make physics-derived hero values (notably peak speed) disappear because `analyseRun()` returns `physics: null`. Real device-ingested sessions include the raw trace. See `docs/notes/session-overview-test-fixtures.md`.

## Known test-data contamination

The long-used test rider contains a handful of corrupted legacy May reaction values in the tens/hundreds of seconds. Longitudinal aggregations can therefore look absurd even when feature logic is correct; this has surfaced in Home consistency and setup-change before/after comparison.

Prefer a clean dedicated visual/test rider for future longitudinal UI passes, or clean those rows before interpreting aggregate screenshots.

## Phase 8 — inventory complete

Full classification: `docs/notes/phase8-progress-inventory.md`.

Progress should answer six rider questions:

1. **Where am I now?**
2. **Am I improving?**
3. **How repeatable am I?**
4. **What context appears to matter?**
5. **Is fatigue / regression worth investigating?**
6. **Where should I drill down next?**

The audit confirmed that `/analytics` currently contains several generations of longitudinal analytics at once: simple server trends, cross-session intelligence/truth rules, performance-pattern charts, raw trends, older proxy trend components, newer Performance Engine trends, correlations and report-engine series.

### Phase 8 truth-model blockers found

Before visual restructuring, close these seams:

- **Pseudo-power:** the legacy `PowerOutputTrend` input calculates `max_g × 9.81 × mass` and labels the result watts. That quantity is force, not power. Real physics-derived power already exists in Performance Engine outputs and must be used instead or the trend omitted.
- **Technique proxy:** legacy `TechniqueQualityTrend` is fed repeatability as a proxy for technique even though genuine technique scores are available later from `sessionAnalyses`.
- **Smoothness proxy:** legacy `SmoothnessTrend` is also fed repeatability while `meanJerk` is null. Do not present repeatability as smoothness.
- **Data quality inconsistency:** legacy `DataQualityTrend` represents a session using its first eligible run only, while newer code already aggregates bias/validity across all eligible runs.
- **Competing longitudinal models:** establish one authoritative interpreted answer per rider question; secondary charts should support that answer rather than create parallel conclusions.

These are correctness/trust issues, so Phase 8 follows the renovation rule: fix them before styling around them.

## Phase 8 — proposed hierarchy

1. Progress orientation — place the rider within their history and show evidence sufficiency;
2. Recent direction — truth-ruled reaction/speed/consistency movement with confidence;
3. Longer-term evidence — canonical raw trend charts and goal overlays;
4. Repeatability / fatigue — consistency, set length and drop-off evidence;
5. Technique development — genuine Performance Engine technique trends only;
6. Context and patterns — weather/surface/ride feel/setup correlations with evidence counts;
7. What to investigate next — recurring diagnostics / strengths-limiters / recommendations consolidated;
8. Progress report / export — supporting action.

The current three-tab `Overview / Trends / Insights` structure is considered implementation-history grouping rather than a settled product hierarchy and may change.

Deep Dive's current **Compare to Previous Session** remains reachable until Phase 8 decides whether that capability belongs as a Progress drill-down or is redundant once the longitudinal workspace is coherent.

## Phase 8 — next exact starting point

First runtime slice is truth-model cleanup, not visual redesign:

1. remove or replace pseudo-power with genuine physics-derived power;
2. remove repeatability-as-technique and repeatability-as-smoothness proxy series in favour of real engine outputs;
3. unify data-quality trend inputs around session-level eligible-run aggregation;
4. verify the headline longitudinal copy consumes one authoritative interpreted model;
5. then restructure the page around the question-led hierarchy.

Verification focus after that slice: 0/1/2 sessions, 3–9 sessions, 10+ sessions, valid/invalid speed histories, mass/no-mass, genuine technique present/absent, context-rich/no-context, and 390 px mobile.

## Standing constraints

- Overview -> Analysis -> Deep Dive is progressive disclosure, never rider-type gating.
- Video is optional supplementary evidence and must never replace required sensor analytics.
- Keep canonical run eligibility/exclusion semantics intact.
- Do not claim a trend from one session.
- Do not silently delete useful analytical capability while reorganising presentation.
- For Svelte changes, `svelte-check` is required; plain `tsc` is not enough.
