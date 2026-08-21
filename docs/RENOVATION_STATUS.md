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
- Phase 7 — Session Deep Dive: DONE
- Phase 8 — Progress / longitudinal analytics: DONE
- **Phase 9 — Goals: DONE**
- **Phase 10 — Compare / leaderboard: NEXT**

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

Independent live verification confirmed the full hierarchy on real device data, clean mobile rendering, retained notes/report access, and green `svelte-check`, TypeScript and Vitest.

## Phase 8 sign-off

Progress now has one coherent longitudinal job: **help the rider understand where they are in their history without mixing recorded evidence, derived evidence and speculative proxies.**

Signed-off question-led hierarchy:

1. **Where am I now?** — recent form in context;
2. **Am I improving?** — longer-term recorded trends, goal overlays, and trustworthy engine-derived technique/power where available;
3. **How repeatable am I?** — consistency, set length, drop-off and smoothness evidence;
4. **What context matters?** — weather, track, setup, ride feel and other correlations only when evidence supports them;
5. **Is anything worth investigating?** — fatigue/regression/recurring diagnostics framed as prompts, not diagnoses;
6. **Where do I drill down?** — explicit hand-off to Sessions, Analysis and Deep Dive.

The old `Overview / Trends / Insights` grouping has been removed. Deeper longitudinal series remain available through progressive disclosure rather than being deleted.

### Phase 8 truth-model invariants

- Technique trend uses genuine Performance Engine technique evidence only.
- Smoothness trend uses genuine smoothness evidence only.
- Power uses Performance Engine physics output (`averageW` / `peakW`); G-force × mass is never presented as watts.
- Missing evidence remains missing rather than being replaced by a convenient proxy.
- Data-quality bias is aggregated across eligible runs for the session.
- Session validity represents the whole available eligible-run validity set.
- Historical Performance Engine analysis resolves the bike linked to each session rather than applying one current/first bike to all history.
- Historical rider mass/profile context resolves the session-linked `rider_profile_id`, with latest-profile fallback only for sessions that predate profile linkage.
- Current W/kg context uses rider weight from `rider_profiles`, not the base `profiles` table.

Shared truth-model adapter: `src/lib/analytics/progressTrendEvidence.ts`.

### Phase 8 verification

Independent verification after the final fixes:

- `svelte-check`: 0 errors;
- `tsc --noEmit`: clean;
- Vitest: 112/112 passing;
- 10+ session / advanced history: full hierarchy rendered correctly;
- W/kg present: no false weight prompt;
- W/kg absent: weight prompt shown correctly;
- 0–2 sessions: baseline-building state and no premature Progress Report action;
- 3–9 sessions: Progress Report appears at the intended 3-session threshold;
- multi-bike history: identical motion traces with alternating 6.2 kg / 9.5 kg bikes produced different per-session physics power values, confirming historical bike linkage end-to-end;
- 390 px mobile: no horizontal overflow and charts remained intact;
- Progress Report: summary, consistency/fatigue diagnostics and Send to Coach / Print / Export actions remained available;
- deeper longitudinal evidence remained available without duplicating the primary Progress hierarchy.

Phase 8 is therefore signed off.

## Phase 9 sign-off

Goals now owns **commitment and evidence-backed progress toward a chosen target**. Progress continues to own current form, longitudinal direction, repeatability and training-load/recovery investigation.

Signed-off hierarchy and semantics:

1. **Evidence** — Start / **Best so far** / Target, canonical evidence progress and reversible milestones;
2. **Interpretation** — target-date pace is explicitly labelled as interpretation rather than measurement;
3. **Estimate** — prediction is a model estimate, not a promise, and only serializable prediction data leaves the server;
4. **Action** — optional model-derived adjustments require rider approval, while closing/deleting remain explicit rider actions.

### Phase 9 correctness/trust fixes

- `goals` and the former parallel intelligence collection were collapsed into one canonical rendered goal view model.
- Goal health/adaptation inputs use real per-session attribution rather than `Math.floor(index / 10)` and use actual reaction-time CV instead of hard-coded `consistency: 0`.
- **Current** was renamed **Best so far**, matching the Release 1 ratchet semantic: best eligible evidence since the goal began, not latest form.
- Injury/diagnostic and "exactly when" language was removed; prediction and recovery language is evidence-proportionate and non-diagnostic.
- Prediction results are stripped to serializable fields before the SvelteKit load boundary; the model's `predict()` function never leaves the server.
- Closing a goal records a finish date but does not itself claim the target was achieved.
- Closed-goal history independently reports whether eligible evidence actually reached the target before closure.
- Completed-goal evidence remains frozen at `completed_at`.
- Peak Speed was restored as a supported goal metric end-to-end, including the database check constraint.
- Distance-specific elapsed-time goals retain like-for-like evidence filtering.

### Phase 9 schema note

Migration: `supabase/migrations/20260821_allow_peak_speed_goal_metric.sql`.

The hosted database had a stale `training_goals_metric_check` taxonomy containing `gateForm` / `peakPower` and omitting `peakSpeed`. The migration replaces it with the seven current supported metrics:

- `reactionTime`
- `maxG`
- `peakSpeed`
- `consistency`
- `elapsedTime`
- `accelerationPhase`
- `endurance`

The migration was applied directly to the linked hosted project rather than using a full `db push`, because the repository still contains historical migration-baseline drift that would otherwise attempt to replay already-existing schema objects.

### Phase 9 verification

Independent verification after the final fixes:

- `svelte-check`: 0 errors;
- `tsc --noEmit`: clean;
- Vitest: 112/112 passing;
- no-goal and no-new-evidence states render cleanly;
- genuine improvement updates Best so far and evidence milestones;
- reclassifying the best run as `warmup` reverses Best so far, removes the milestone, clears target-reached state and recalculates prediction;
- target-reached-by-evidence and manual-close-before-target are distinguished correctly;
- completed-goal freeze remains intact after later better evidence;
- prediction present/absent states render correctly with **Model estimate** wording;
- `reactionTime`, `maxG`, `peakSpeed`, `consistency`, `elapsedTime`, `accelerationPhase` and `endurance` goal types are supported end-to-end;
- Peak Speed creation/tracking verified live after the schema migration;
- distance-specific elapsed-time evidence ignores a faster run at the wrong distance;
- 390 px mobile renders cleanly with no horizontal overflow.

Phase 9 is therefore signed off.

## Non-obvious session-share invariant

`SocialShareModal` must always bind to the **persisted** achievement (`persistedAchievement`), never the first-time setup live preview.

The first-time `SessionSetupStrip` can preview how context/tag edits would change the hero achievement before save. That preview is deliberately not shareable. Sharing is only enabled for evidence that has actually been persisted and can therefore be reproduced later.

## Test-fixture caveat

Synthetic DB sessions without `chart_data` can make physics-derived hero values (notably peak speed) disappear because `analyseRun()` returns `physics: null`. Real device-ingested sessions include the raw trace. See `docs/notes/session-overview-test-fixtures.md`.

## Known test-data contamination

The long-used test rider contains a handful of corrupted legacy May reaction values in the tens/hundreds of seconds. Longitudinal aggregations can therefore look absurd even when feature logic is correct; this has surfaced in Home consistency and setup-change before/after comparison.

Prefer a clean dedicated visual/test rider for future longitudinal UI passes, or clean those rows before interpreting aggregate screenshots.

## Phase 10 — next exact starting point

Audit Compare / Leaderboard before redesigning it.

The intended product model is **benchmark context, not a raw youth-vs-elite ranking table**. Inventory the route and supporting benchmark services against these questions first:

1. what exactly is being ranked or percentile-scored today;
2. which rider/category/onboarding baseline determines the comparison population;
3. whether excluded evidence can leak into benchmark snapshots or leaderboards;
4. whether labels distinguish rider-relative benchmarking from raw absolute performance;
5. what a young rider/parent should understand at first glance versus what an experienced rider or coach may drill into;
6. whether admin baseline-reset/recompute tooling remains coherent as population evidence grows.

Do not redesign percentile cards until the population/baseline truth model is verified.

## Standing constraints

- Overview -> Analysis -> Deep Dive is progressive disclosure, never rider-type gating.
- Video is optional supplementary evidence and must never replace required sensor analytics.
- Keep canonical run eligibility/exclusion semantics intact.
- Do not claim a trend from one session.
- Do not silently delete useful analytical capability while reorganising presentation.
- For Svelte changes, `svelte-check` is required; plain `tsc` is not enough.
