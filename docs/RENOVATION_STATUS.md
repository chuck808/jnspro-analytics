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
- **Phase 8 — Progress / longitudinal analytics: NEXT**

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

Phase 7 structural decisions now landed:

- calibration/data-quality and missing-mass warnings appear before derived interpretation;
- the old Deep Dive headline `RunComparison` has been removed because Analysis owns headline run comparison;
- `DeepDiveRunDiagnostics` is integrated directly into the Deep Dive page rather than appended through a transitional nested layout;
- the temporary `detail/+layout.svelte` has been removed;
- raw drill-down, stability, jerk, phases, acceleration splits, six-dimension technique and coach diagnostics remain available;
- Performance Targets is contextual benchmark evidence rather than the page opener;
- Areas for Improvement and Recommendations share one expert follow-up section;
- Notes and Report remain late supporting actions;
- Compare to Previous Session remains reachable at the bottom for now, with an explicit Phase 8 decision still pending on its long-term home.

Independent live verification confirmed:

- `svelte-check`, TypeScript and Vitest all green with 109 tests;
- real multi-run device data renders the full expert hierarchy;
- Deep Dive no longer contains the duplicate headline run comparison;
- Analysis still owns `Compare Multiple Runs`;
- missing-mass evidence-quality warning renders first and links correctly to Profile;
- single-run sessions still render all per-run expert diagnostics;
- mobile layout is clean at 390 px;
- Notes, previous-session comparison and Report remain reachable;
- no expert capability disappeared during the relocation.

The specific `hasCalibrationWarning` state was not independently triggered in the live test, but its placement shares the same verified top-of-page evidence-quality branch as the missing-mass warning. Treat a future real-session calibration report as something to investigate directly rather than assuming the branch is broken.

## Non-obvious session-share invariant

`SocialShareModal` must always bind to the **persisted** achievement (`persistedAchievement`), never the first-time setup live preview.

The first-time `SessionSetupStrip` can preview how context/tag edits would change the hero achievement before save. That preview is deliberately not shareable. Sharing is only enabled for evidence that has actually been persisted and can therefore be reproduced later.

## Test-fixture caveat

Synthetic DB sessions without `chart_data` can make physics-derived hero values (notably peak speed) disappear because `analyseRun()` returns `physics: null`. Real device-ingested sessions include the raw trace. See `docs/notes/session-overview-test-fixtures.md`.

## Known test-data contamination

The long-used test rider contains a handful of corrupted legacy May reaction values in the tens/hundreds of seconds. Longitudinal aggregations can therefore look absurd even when feature logic is correct; this has surfaced in Home consistency and setup-change before/after comparison.

Prefer a clean dedicated visual/test rider for future longitudinal UI passes, or clean those rows before interpreting aggregate screenshots.

## Phase 8 — next exact starting point

Audit `/analytics` before rewriting it.

Phase 8 should turn Progress into a coherent longitudinal workspace rather than a collection of charts. Inventory every section and classify it around these questions:

1. **Where am I now?** — recent form/current baseline without pretending one session is a trend;
2. **Am I improving?** — longer-term reaction/speed/force progression using canonical eligible evidence;
3. **How repeatable am I?** — consistency and stability over time;
4. **What context matters?** — weather, track feel, bike/setup, session intent and other rider-entered context where evidence supports a useful comparison;
5. **Is there fatigue/regression worth investigating?** — use the existing trend/fatigue engines proportionately rather than turning warnings into diagnoses;
6. **Where do I drill down?** — session links and deeper analytical evidence.

Specific Phase 8 decisions to revisit during the audit:

- whether Deep Dive's generic **Compare to Previous Session** belongs in Progress and, if so, how to preserve that capability without duplicating other longitudinal comparisons;
- how recent-direction, long-term progression, consistency/fatigue and context should be separated visually;
- which current charts genuinely answer different questions and which are duplicates;
- how to protect longitudinal surfaces from excluded runs and known contaminated test data;
- how much interpretation belongs on the first Progress screen versus deeper reveals.

Do not start by adding more charts. Start by identifying the rider questions and mapping existing data/components to them.

## Standing constraints

- Overview -> Analysis -> Deep Dive is progressive disclosure, never rider-type gating.
- Video is optional supplementary evidence and must never replace required sensor analytics.
- Keep canonical run eligibility/exclusion semantics intact.
- Do not claim a trend from one session.
- Do not silently delete useful analytical capability while reorganising presentation.
- For Svelte changes, `svelte-check` is required; plain `tsc` is not enough.
