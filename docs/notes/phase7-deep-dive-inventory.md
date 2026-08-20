# Phase 7 — Session Deep Dive Inventory

## Purpose

Phase 7 should make Deep Dive a coherent expert workspace rather than the place where every remaining technical card accumulates.

Deep Dive is still progressive disclosure available to any rider who wants it. It is not a coach/admin gate.

The core question is:

> **What does the underlying evidence show, how was it derived, and where should I investigate further?**

Analysis already owns the middle layer: selecting/comparing runs, primary traces, concise force-delivery evidence, run interpretation, and a compact technique summary.

## Current composition

The current `/sessions/[id]/detail` page contains:

1. `RunComparison` — side-by-side headline metrics for two runs;
2. `PerformanceTargets` — reaction/G/technique against rider-level benchmarks;
3. G-force stability over the first 0.5 s across runs;
4. missing-mass and calibration warnings;
5. `DataDrillDown` raw G-force series for the selected run;
6. Areas for Improvement;
7. Recommendations;
8. Session Notes;
9. Compare to Previous Session;
10. Generate Session Report.

Phase 6 additionally relocated expert material into `DeepDiveRunDiagnostics.svelte`, currently appended by `detail/+layout.svelte`:

- jerk / rate-of-change trace and smoothness score;
- Drive / Transition / Velocity phase analysis;
- acceleration splits;
- six-dimension technique breakdown;
- Coach Diagnostics.

This preserves capability but the current order is transitional rather than intentional.

## Classification

### Keep in Deep Dive

#### Raw G-force drill-down

**KEEP.** This is exactly the kind of trace-level evidence Deep Dive should own. It complements, rather than replaces, the readable G-force trace in Analysis.

Job: inspect the selected run's raw/derived trace data closely.

#### G-force stability

**KEEP, REFRAME.** Cross-run stability over the first 500 ms is a technical comparison that adds information beyond headline reaction/G/speed metrics.

Job: answer whether initial force application is repeatable and how the selected run differs from the session pattern.

#### Jerk / force-change trace

**KEEP.** Jerk is a second-order signal and belongs naturally in the expert layer.

Job: investigate abrupt versus smooth force application.

#### Detailed phase analysis

**KEEP.** Drive / Transition / Velocity phase metrics are derived expert diagnostics rather than first-layer interpretation.

Job: inspect where force/velocity development changes through the gate start.

#### Acceleration splits

**KEEP.** The split table is useful detail for experienced users and researchers/coaches, but too granular for Analysis.

Job: inspect when target velocities are reached and in which derived phase.

#### Detailed technique breakdown

**KEEP.** The six-dimension benchmark complements Analysis's compact technique summary.

Job: expose the full benchmark decomposition and rider-level context.

#### Coach diagnostics

**KEEP, PRESENT AS EXPERT DIAGNOSTICS.** The information should remain available to the rider as well as a coach; the name describes the interpretation style, not access control.

Job: surface evidence, diagnostic reasoning, and next-step observations.

#### Calibration / provenance warnings

**KEEP, MOVE EARLY.** Deep technical values should not be read before the page tells the user whether the physics is trustworthy.

Job: establish evidence quality before derived diagnostics are interpreted.

### Simplify / reposition

#### PerformanceTargets

**SIMPLIFY / KEEP AS BENCHMARK CONTEXT.** Useful in Deep Dive, but it should not be the second thing on the page. It belongs with detailed technique/benchmark interpretation rather than before evidence quality and traces.

Job: compare selected-run values with rider-level expectations.

#### Areas for Improvement + Recommendations

**CONSOLIDATE.** These two blocks are a single conceptual job: what the expert diagnostics suggest doing next. They should not read as two independent analysis engines.

Job: turn the technical evidence into prioritised follow-up without duplicating Overview/Analysis narrative.

#### Session Notes

**KEEP AS SUPPORTING CONTEXT, LATE.** Notes are useful in Deep Dive but are not technical evidence. They should sit after the analytical investigation, not interrupt it.

#### Generate Session Report

**KEEP AS ACTION, LATE.** Reporting is an output action, not part of the evidence hierarchy.

### Duplicate / wrong job

#### `RunComparison`

**DUPLICATE IN CURRENT FORM.** The component compares Reaction, Max G, Peak Speed, Technique Score and Elapsed Time — the same headline metric-comparison job that now belongs to Analysis.

The existing Deep Dive version also declares a simplistic winner by counting how many headline metrics each run is "better" on. That is not an expert technical comparison and can imply that unrelated metrics have equal weight.

Phase 7 direction:

- remove this headline metric table from Deep Dive;
- keep Analysis as the place for straightforward run comparison;
- let Deep Dive comparisons focus on technical evidence: stability, traces, phases, technique decomposition, or another clearly expert comparison if later justified.

#### Compare to Previous Session

**DUPLICATE / WRONG LAYER IN CURRENT FORM.** Longitudinal/session-to-session comparison belongs primarily in Progress (Phase 8) and, where immediately useful, Overview/Analysis. A generic previous-session modal is not inherently a Deep Dive diagnostic.

Phase 7 direction: remove it from the core Deep Dive hierarchy rather than treating it as expert evidence. Do not delete the underlying comparison capability until its proper Phase 8 destination is confirmed.

## Proposed Deep Dive hierarchy

1. **Deep Dive orientation** — explain that this layer exposes technical evidence, derivation and diagnostics;
2. **Evidence quality first** — calibration/mass/provenance warnings that affect interpretation;
3. **Selected-run raw evidence** — DataDrillDown / trace-level inspection;
4. **Force application detail** — jerk and early-force stability;
5. **Phase and acceleration detail** — Drive / Transition / Velocity plus splits;
6. **Technique decomposition and benchmarks** — detailed technique + PerformanceTargets;
7. **Expert diagnostics** — Coach Diagnostics plus consolidated areas/recommendations;
8. **Supporting context/actions** — notes and report generation.

This hierarchy deliberately moves from evidence -> derivation -> interpretation -> action.

## Video boundary

Video remains optional supplementary evidence. Phase 7 should not require a video to make any technical diagnostic understandable, nor use video as justification to remove sensor traces.

If video eventually gains a Deep Dive-specific synchronised inspection mode, it should sit alongside the relevant trace evidence, not become the page's organising principle.

## Implementation boundary for first Phase 7 slice

Do not redesign the technical calculations yet.

First structural slice should:

1. fold `DeepDiveRunDiagnostics` into the intentional Deep Dive hierarchy instead of appending it after the page via a transitional nested layout;
2. remove the duplicate headline `RunComparison` from Deep Dive;
3. move evidence-quality warnings ahead of detailed derived diagnostics;
4. preserve every expert capability relocated in Phase 6;
5. leave notes/report actions reachable at the bottom;
6. defer the broader longitudinal destination of `Compare to Previous Session` to Phase 8, while removing it from the core technical story once its capability is safely accounted for.

## Verification focus

- invalid/calibration-warning run;
- missing rider/bike mass;
- real multi-run device session with jerk/phases/splits/technique/coach diagnostics;
- single-run session;
- mobile at 390 px;
- report and notes remain reachable;
- Analysis still owns the straightforward headline run comparison;
- no expert block disappears during structural relocation.
