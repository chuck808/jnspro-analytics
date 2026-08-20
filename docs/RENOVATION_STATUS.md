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
- **Phase 8 — Progress / longitudinal analytics: DONE**
- **Phase 9 — Goals: IN PROGRESS**

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

## Non-obvious session-share invariant

`SocialShareModal` must always bind to the **persisted** achievement (`persistedAchievement`), never the first-time setup live preview.

The first-time `SessionSetupStrip` can preview how context/tag edits would change the hero achievement before save. That preview is deliberately not shareable. Sharing is only enabled for evidence that has actually been persisted and can therefore be reproduced later.

## Test-fixture caveat

Synthetic DB sessions without `chart_data` can make physics-derived hero values (notably peak speed) disappear because `analyseRun()` returns `physics: null`. Real device-ingested sessions include the raw trace. See `docs/notes/session-overview-test-fixtures.md`.

## Known test-data contamination

The long-used test rider contains a handful of corrupted legacy May reaction values in the tens/hundreds of seconds. Longitudinal aggregations can therefore look absurd even when feature logic is correct; this has surfaced in Home consistency and setup-change before/after comparison.

Prefer a clean dedicated visual/test rider for future longitudinal UI passes, or clean those rows before interpreting aggregate screenshots.

## Phase 9 — inventory complete

Full inventory: `docs/notes/phase9-goals-inventory.md`.

Goals should own **commitment and evidence-backed progress toward a chosen target**. Progress should continue to own current form, longitudinal direction, repeatability, fatigue/regression investigation and contextual trends.

The audit found three blockers to fix before redesigning the cards:

1. **Disconnected intelligence model:** the server builds `goalsWithIntelligence` with prediction/status/adaptation, but the live page renders `data.goals` and then tries to read those intelligence fields from it. The expensive intelligence layer is therefore calculated but normally disconnected from the goal cards. Collapse this to one canonical page goal model.
2. **Training-health attribution:** the health-check loader flattens runs and reconstructs session attribution using `Math.floor(index / 10)`, implicitly assuming ten runs per session. It also supplies hard-coded `consistency: 0`. Fix the model input before surfacing strong recovery guidance.
3. **Trust language:** rider-facing copy currently promises predictions can tell the rider **"exactly when"** a goal will be reached and uses diagnostic/medical language such as Injury Risk Detection, Injury Prevention and Rest Required. Reframe prediction as uncertain estimation and training-health output as non-diagnostic recovery/training-load signals.

The active goal card also labels the canonical ratcheted evidence value as **Current**. Phase 9 should change this to **Best so far** so the UI matches the Release 1 semantic: best eligible evidence since goal creation, not latest form.

A further product decision is required around completion: `completed_at` currently cannot distinguish **target achieved by evidence** from **rider manually closed the goal**. Do not present all completed goals as evidence-proven achievements unless that distinction is added or derived safely.

`src/routes/(protected)/goals/page_enhanced.svelte` appears unreferenced and should be treated as a legacy/dead candidate, not as a second source of design truth.

## Phase 9 — next exact starting point

First implementation slice is correctness/trust, not visual polish:

1. unify `goals` / `goalsWithIntelligence` into one rendered goal collection;
2. fix health-check run-to-session attribution and remove the hard-coded consistency input;
3. rename **Current** to **Best so far**;
4. replace prediction certainty and injury/diagnostic language with evidence-proportionate wording;
5. only then restructure cards around **evidence -> interpretation -> prediction -> action**.

Verification focus: no goals, active/no-new-evidence, genuine improvement, excluded-evidence reversal, evidence-reached target, manual completion before target, completed-goal freeze, all supported metric types, prediction present/absent, <10 vs 10+ session health inputs, and 390 px mobile.

## Standing constraints

- Overview -> Analysis -> Deep Dive is progressive disclosure, never rider-type gating.
- Video is optional supplementary evidence and must never replace required sensor analytics.
- Keep canonical run eligibility/exclusion semantics intact.
- Do not claim a trend from one session.
- Do not silently delete useful analytical capability while reorganising presentation.
- For Svelte changes, `svelte-check` is required; plain `tsc` is not enough.
