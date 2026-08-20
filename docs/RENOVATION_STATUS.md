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
- **Phase 9 — Goals: NEXT**

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

The specific `hasCalibrationWarning` state was not independently triggered in the live test, but its placement shares the same verified top-of-page evidence-quality branch as the missing-mass warning. Treat a future real-session calibration report as something to investigate directly rather than assuming the branch is broken.

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
- multi-bike history: identical motion traces with alternating 6.2 kg / 9.5 kg bikes produced different per-session physics power values (2420 W vs 2519 W), confirming historical bike linkage end-to-end;
- 390 px mobile: no horizontal overflow and charts remained intact;
- Progress Report: summary, consistency/fatigue diagnostics and Send to Coach / Print / Export actions remained available;
- deeper longitudinal evidence: Technique Score Trends, Strengths & Limiters Evolution and Session Data Quality remain available without duplicating the primary Progress hierarchy.

Phase 8 is therefore signed off.

## Non-obvious session-share invariant

`SocialShareModal` must always bind to the **persisted** achievement (`persistedAchievement`), never the first-time setup live preview.

The first-time `SessionSetupStrip` can preview how context/tag edits would change the hero achievement before save. That preview is deliberately not shareable. Sharing is only enabled for evidence that has actually been persisted and can therefore be reproduced later.

## Test-fixture caveat

Synthetic DB sessions without `chart_data` can make physics-derived hero values (notably peak speed) disappear because `analyseRun()` returns `physics: null`. Real device-ingested sessions include the raw trace. See `docs/notes/session-overview-test-fixtures.md`.

## Known test-data contamination

The long-used test rider contains a handful of corrupted legacy May reaction values in the tens/hundreds of seconds. Longitudinal aggregations can therefore look absurd even when feature logic is correct; this has surfaced in Home consistency and setup-change before/after comparison.

Prefer a clean dedicated visual/test rider for future longitudinal UI passes, or clean those rows before interpreting aggregate screenshots.

## Phase 9 — next exact starting point

Phase 9 is **Goals**.

Start with an inventory before changing presentation. Trace the current Goals page against the evidence model already rebuilt in Release 1 and classify each surface as keep / simplify / duplicate / misleading / missing.

Questions to resolve first:

1. Does the rider understand that `current_value` means **best verified progress since goal creation**, not current form?
2. Should rider-facing copy use **Best so far** instead of **Current value** wherever that improves clarity?
3. Are active-goal progress, milestone history and completed-goal history all reading the same evidence model?
4. Does the page explain why a goal can legitimately move backward after evidence is reclassified/excluded, while ordinary worse sessions do not make PB-style progress regress?
5. Are prediction/adaptation features clearly distinguished from recorded or evidence-derived progress?
6. Is the page useful to a young rider/parent first while preserving deeper detail for experienced riders/coaches?
7. Are completed goals clearly frozen at `completed_at` in presentation as well as in the underlying reconciliation/projection model?

Do not revisit the Release 1 goal truth model unless the audit finds an actual correctness contradiction.

## Standing constraints

- Overview -> Analysis -> Deep Dive is progressive disclosure, never rider-type gating.
- Video is optional supplementary evidence and must never replace required sensor analytics.
- Keep canonical run eligibility/exclusion semantics intact.
- Do not claim a trend from one session.
- Do not silently delete useful analytical capability while reorganising presentation.
- For Svelte changes, `svelte-check` is required; plain `tsc` is not enough.
