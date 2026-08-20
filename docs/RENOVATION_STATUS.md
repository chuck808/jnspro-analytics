# Renovation Current Status

> Short current-state pointer. Read this alongside `docs/RENOVATION_ROADMAP.md`; the roadmap contains the full 15-phase plan and product invariants, while this file records the latest signed-off phase and exact continuation point.

## Current position

**Release 2 — Make It Feel Like One Product**

- Phase 1 — Shared authenticated shell: DONE
- Phase 2 — Workspace-aware navigation: DONE
- Phase 3 — Rider Home: DONE
- Phase 4 — Sessions index: DONE
- **Phase 5 — Single-session Overview: DONE**
- **Phase 6 — Session Analysis: IN PROGRESS**

## Phase 5 sign-off

The single-session Overview is now intentionally the first analytical layer rather than a compressed copy of Analysis.

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

The old duplicate six-card metric wall and duplicate `CrossRunProgression` block were removed from Overview. Their deeper analytical purpose belongs in Analysis; underlying analytics were not deleted.

Verified live cases include ordinary sessions, PB/achievement sessions, no-valid-speed sessions, warm-up exclusion, goal progress, setup-change comparison, real `chart_data`, and mobile rendering. Static/unit baseline remained green with 109 Vitest tests.

## Non-obvious session-share invariant

`SocialShareModal` must always bind to the **persisted** achievement (`persistedAchievement`), never the first-time setup live preview.

The first-time `SessionSetupStrip` can preview how context/tag edits would change the hero achievement before the rider saves them. That preview is deliberately not shareable. Sharing is only enabled for evidence that has actually been persisted and can therefore be reproduced later.

If editing `src/routes/(protected)/sessions/[id]/+page.svelte`, preserve this distinction even if the local explanatory comment is moved or rewritten.

## Test-fixture caveat

Synthetic DB sessions without `chart_data` can make physics-derived hero values (notably peak speed) disappear because `analyseRun()` returns `physics: null`. Real device-ingested sessions include the raw trace. See `docs/notes/session-overview-test-fixtures.md`.

## Known test-data contamination

The long-used test rider contains a handful of corrupted legacy May reaction values (including values in the tens/hundreds of seconds). Aggregations over long history can therefore look absurd even when the feature logic is correct; this has already surfaced in Home consistency and setup-change before/after comparison.

Prefer a clean dedicated visual/test rider for future longitudinal UI passes, or clean those known legacy rows before interpreting aggregate screenshots.

## Phase 6 — inventory complete

The current `/sessions/[id]/analysis` page was audited section-by-section before redesign. Full classification is in `docs/notes/phase6-analysis-inventory.md`.

Analysis should answer: **why did this run/session behave that way, and how do the runs differ?**

Keep / simplify in Analysis:

- run selection and `RunTagSelector`;
- multi-run comparison entry;
- optional `RunVideoAttachment` as supplementary evidence;
- concise selected-run metrics and data-quality/provenance cues;
- primary G-force and valid speed/acceleration curves;
- reliable impulse/power, but as secondary force-delivery evidence rather than another chart tier;
- one understandable technique summary;
- one consolidated run-specific interpretation block.

Move to Deep Dive:

- jerk / rate-of-change-of-acceleration trace;
- detailed Drive / Transition / Velocity phase metrics;
- acceleration-splits table;
- detailed six-dimension technique benchmark;
- `CoachDiagnosticsCard`;
- raw/methodology-heavy material that complements the existing Deep Dive `DataDrillDown`, stability and technical comparison tools.

Duplicates/boundaries to resolve:

- Analysis `TrainingInsightsPanel` repeats the Overview session narrative and should be removed or radically scoped;
- Analysis currently shows both compact and detailed technique scoring;
- Analysis `RunComparisonSelector` and Deep Dive `RunComparison` need distinct jobs rather than becoming two comparison dashboards.

## Phase 6 — next exact starting point

Implement the hierarchy without changing calculations:

1. choose / compare runs;
2. selected run at a glance;
3. how the run unfolded — primary traces, with video optional;
4. how force was delivered — reliable impulse/power;
5. what this run suggests — consolidated interpretation;
6. technique summary;
7. clear hand-off to Deep Dive for jerk, phases, splits, detailed technique, diagnostics and raw data.

Preserve these constraints:

- Analysis remains available to every rider; it is progressive disclosure, not role gating.
- Do not remove a useful sensor chart merely because another visual or optional video can illustrate the same event.
- Video remains supplementary and absent-first.
- Keep canonical run eligibility and exclusion semantics intact.
- Avoid duplicating answers already given cleanly in Overview.
- Reserve methodology/provenance-heavy and trace-level expert material for Deep Dive where that separation improves comprehension.
