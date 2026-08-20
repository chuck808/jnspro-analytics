# Renovation Current Status

> Short current-state pointer. Read this alongside `docs/RENOVATION_ROADMAP.md`; the roadmap contains the full 15-phase plan and product invariants, while this file records the latest signed-off phase and exact continuation point.

## Current position

**Release 2 — Make It Feel Like One Product**

- Phase 1 — Shared authenticated shell: DONE
- Phase 2 — Workspace-aware navigation: DONE
- Phase 3 — Rider Home: DONE
- Phase 4 — Sessions index: DONE
- Phase 5 — Single-session Overview: DONE
- **Phase 6 — Session Analysis: DONE**
- **Phase 7 — Session Deep Dive: IN PROGRESS**

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

The old duplicate six-card metric wall and duplicate `CrossRunProgression` block were removed from Overview. Underlying analytics were not deleted.

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

Expert capability was **preserved**, not removed. Jerk, phases, splits, detailed technique and coach diagnostics are grouped in `src/lib/components/session/DeepDiveRunDiagnostics.svelte` and currently surfaced under Deep Dive.

Independent live verification used a real five-run device-ingested session and confirmed:

- run switching/tagging works on desktop and mobile;
- valid-speed and no-valid-speed behaviour is correct;
- impulse/power renders when mass inputs are available;
- optional video remains non-blocking;
- Analysis contains no relocated expert material;
- every relocated expert block renders with real non-trivial data in Deep Dive;
- `svelte-check`, TypeScript and Vitest remained green with 109 tests.

## Non-obvious session-share invariant

`SocialShareModal` must always bind to the **persisted** achievement (`persistedAchievement`), never the first-time setup live preview.

The first-time `SessionSetupStrip` can preview how context/tag edits would change the hero achievement before save. That preview is deliberately not shareable. Sharing is only enabled for evidence that has actually been persisted and can therefore be reproduced later.

## Test-fixture caveat

Synthetic DB sessions without `chart_data` can make physics-derived hero values (notably peak speed) disappear because `analyseRun()` returns `physics: null`. Real device-ingested sessions include the raw trace. See `docs/notes/session-overview-test-fixtures.md`.

## Known test-data contamination

The long-used test rider contains a handful of corrupted legacy May reaction values in the tens/hundreds of seconds. Longitudinal aggregations can therefore look absurd even when the feature logic is correct; this has surfaced in Home consistency and setup-change before/after comparison.

Prefer a clean dedicated visual/test rider for future longitudinal UI passes, or clean those rows before interpreting aggregate screenshots.

## Phase 7 — inventory complete

Full classification: `docs/notes/phase7-deep-dive-inventory.md`.

Deep Dive should answer:

> **What does the underlying evidence show, how was it derived, and where should I investigate further?**

Current expert material includes raw G-force drill-down, early-force stability, jerk, detailed phases, acceleration splits, six-dimension technique benchmarking, coach-style diagnostics, calibration/provenance warnings, performance targets, weaknesses/recommendations, notes, previous-session comparison and report generation.

Key Phase 7 decisions from the audit:

- keep raw drill-down, stability, jerk, phases, splits, detailed technique and coach diagnostics;
- put evidence-quality/calibration warnings **before** derived technical interpretation;
- simplify Performance Targets into benchmark context rather than making it the page opening;
- consolidate Areas for Improvement + Recommendations into one expert follow-up job;
- keep Session Notes and report generation as late supporting actions;
- remove the current Deep Dive `RunComparison` headline-metric table because Analysis now owns that job;
- do not treat the generic previous-session comparison modal as core expert evidence; its longer-term destination belongs with Phase 8 Progress/longitudinal work.

## Phase 7 — proposed hierarchy

1. Deep Dive orientation;
2. evidence quality / provenance first;
3. selected-run raw evidence;
4. force-application detail — jerk and early-force stability;
5. phase and acceleration detail;
6. detailed technique decomposition and rider-level benchmarks;
7. expert diagnostics / prioritised follow-up;
8. notes and report actions.

This is intentionally **evidence -> derivation -> interpretation -> action**.

## Phase 7 — next exact starting point

First structural code slice:

1. fold `DeepDiveRunDiagnostics` into the intentional page hierarchy instead of appending it after the route through the transitional `detail/+layout.svelte`;
2. remove the duplicate headline `RunComparison` from Deep Dive;
3. move evidence-quality warnings ahead of derived diagnostics;
4. preserve every expert capability relocated during Phase 6;
5. keep notes/report actions reachable at the bottom;
6. account for the existing previous-session comparison before removing it from the technical story, with Phase 8 as its likely product destination.

Verification focus: calibration warning, missing mass, real multi-run expert data, single-run session, 390 px mobile, notes/report access, and confirmation that no expert block disappears during relocation.

## Standing constraints

- Overview -> Analysis -> Deep Dive is progressive disclosure, never rider-type gating.
- Video is optional supplementary evidence and must never replace required sensor analytics.
- Keep canonical run eligibility/exclusion semantics intact.
- Do not claim a trend from one session.
- Do not silently delete useful analytical capability while reorganising presentation.
- For Svelte changes, `svelte-check` is required; plain `tsc` is not enough.
