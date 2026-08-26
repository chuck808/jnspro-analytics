# AppGatePro Renovation Roadmap

> Living checkpoint for the analytics application renovation. Update this document as phases land so the reasoning, invariants, deliberate deferrals, and next starting point survive beyond any individual development conversation.

## North star

Turn the four-year analytics codebase into one coherent product without throwing away the depth that makes it valuable.

The application should work at several levels of curiosity:

- a young rider or parent should quickly understand what happened and what matters;
- an experienced rider should be able to investigate progression and context;
- a coach should be able to work efficiently with riders who have explicitly shared access;
- deeper analysis should remain available rather than being hidden behind artificial gates.

`Overview -> Analysis -> Deep Dive` is progressive disclosure, not permission gating.

## Product principles

1. **Trust the evidence.** Recorded source data is primary. Derived values must be clearly derived, reproducible, and reconciled when source evidence changes.
2. **Exclusions preserve history.** Warm-up, experimental, competition, and `exclude-from-stats` runs remain part of the historical session record but do not contaminate normal statistics. `best-effort` remains statistically eligible.
3. **Interpret before displaying more numbers.** The first layer should answer "what should I notice?"; richer analytics remain available below it.
4. **Do not confuse one session with a trend.** Narrative copy should be proportionate to the evidence.
5. **Video is optional supplementary evidence.** Sensor data and analytics form a complete experience without video. Video may enrich a run/session but must never replace charts or become a prerequisite for understanding it.
6. **Rider/parent ownership is the default.** Coaching access is invited/shared by the rider side and should not silently expand into unrestricted raw-data access.
7. **One truth model per concept.** Upload transports, pages, exports, coach/admin views, and research outputs should consume shared canonical rules rather than reimplementing them.
8. **A historical record should stay honest.** A session may contain excluded runs; show that distinction instead of pretending the session did not happen.
9. **Research data must be defensible.** The long-term aim is anonymised historical BMX data that can support researchers on request, especially outside elite/facility-only populations.
10. **Prefer coherent simplification over feature deletion.** The codebase accumulated useful ideas; renovation should establish hierarchy and ownership before deciding something has no value.

## Release 1 — Trust the Evidence — COMPLETE

Signed off after static checks, unit tests, code review, and live hosted-database exercises.

### Canonical statistical eligibility

`shouldExcludeFromStats()` is the canonical run policy.

Excluded from normal statistics:

- `warmup`
- `experimental`
- `competition`
- `exclude-from-stats`

Still eligible:

- `best-effort`
- untagged runs

Research export, Dashboard/Home, Analytics/Progress, Leaderboard/Compare, session summaries and related consumers were aligned to this rule. Regression tests cover the policy.

### Ingest idempotency and rollback

Manual/SD and device/Wi-Fi ingestion share checksum/deduplication/rollback behaviour.

Invariant: **a failed ingest must not consume the session identity.**

- duplicate source files are detected per rider;
- concurrent unique-constraint races are handled cleanly;
- partial failed sessions are deleted;
- if rollback deletion itself fails, the partial session is quarantined so its checksum cannot permanently block a retry;
- manual and Wi-Fi paths converge on the same behaviour.

Live failure/retry tests confirmed a failed mid-run insert leaves no zombie duplicate and a corrected retry succeeds.

### Derived-state reconciliation

All three relevant mutation paths converge on shared reconciliation:

- device/Wi-Fi ingest;
- manual/SD upload;
- later run-tag edits.

Session deletion also reconciles derived state.

Performance snapshots and persisted goal current values therefore follow the current eligible evidence rather than the transport that created it.

### Goal evidence model

Goal history/current progress is evidence-derived rather than trusting append-only milestone writes.

Semantics:

- `current_value` means **best verified progress since goal creation**, not current form;
- ordinary worse sessions do not make a PB-style goal bar regress;
- reclassifying the evidence can reverse progress correctly;
- completed goals freeze at `completed_at` in both persisted reconciliation and read-time projection;
- evidence after completion cannot rewrite a completed goal;
- peak-speed goals and distance-specific elapsed-time goals are handled by the projection.

The old session-detail milestone write path is non-mutating; opening a page must not change goal truth.

Potential later copy improvement: label `current_value` as **Best so far** in rider-facing Goals UI.

### Admin/export correctness

- goal completion uses `completed_at`, not the obsolete/ambiguous `completed` boolean;
- completion duration uses `created_at -> completed_at`, not mutable `updated_at`;
- high session frequency is identified neutrally as `high_session_frequency`, not diagnosed as overtraining;
- admin health-report export consumes the same identifier.

### Release 1 verification baseline

At sign-off:

- TypeScript: green;
- `svelte-check`: green apart from one longstanding unrelated warning;
- Vitest: 109/109 passing;
- multiple live hosted-DB round trips verified ingest rollback, evidence exclusion/restoration, completed-goal freeze, manual-upload reconciliation, and delete-PB fallback.

For Svelte work, **`svelte-check` is required**; plain `tsc` does not type-check `.svelte` files sufficiently.

## Release 2 — Make It Feel Like One Product — COMPLETE

### Phase 1 — Shared authenticated shell — DONE

- authenticated shell now uses the same Barlow / Barlow Condensed family as the public product;
- top bar aligned to an 80px rhythm;
- page-title mappings corrected;
- shell spacing made more coherent.

### Phase 2 — Workspace-aware navigation — DONE

Routes were intentionally left unchanged while presentation was reorganised.

Rider workspace:

- Home
- Sessions
- Progress (`/analytics`)
- Goals
- Compare (`/leaderboard`)
- Upload session
- Profile
- Settings
- Help

Coach workspace:

- Back to rider
- Riders

Admin workspace:

- Back to rider
- Admin home
- People & access
- Performance & benchmarking
- Research & feedback
- System

Session navigation retains `Overview -> Analysis -> Deep Dive`.

Stale/duplicate sidebar destinations were removed. Coach/Admin context badges were later removed after the contextual shell was verified live.

Resolved later: `/feedback` is intentionally retained as a lightweight 308 compatibility redirect to `/admin/feedback`; the Admin workspace owns the live feedback UI.

### Phase 3 — Rider Home — DONE

Home was changed from a KPI wall into a first-layer interpretation surface.

Current hierarchy:

1. **What to notice** — latest-session narrative;
2. useful anchors such as best reaction, consistency and nearest active goal;
3. a restrained recent reaction progression visual;
4. recent training;
5. lifetime record lower down.

Narrative branches have been exercised for quicker, slower, steady (within +/-5 ms), and genuine PB cases. The slower branch explicitly avoids treating one session as a trend.

Reaction progression:

- uses canonical recent session summaries;
- lower reaction time plots visually higher, so improvement reads naturally as up/right;
- explicitly says "Lower is faster";
- makes no trend claim;
- only renders the whole card when at least two usable session points exist;
- no chart library was added.

### Phase 4 — Sessions index — DONE

Sessions is now a **trustworthy chronological training record**, not a second analytics page.

- canonical session summaries drive reaction/speed/G figures;
- excluded runs remain visible in recorded totals but not eligible statistics;
- rows can show e.g. `4 eligible runs · 5 recorded total`;
- all-excluded sessions remain in history and show insufficient eligible evidence rather than zero-valued fake metrics;
- date range, page size, newest/oldest ordering remain real controls;
- misleading page-local metric sorting was removed;
- the old `SessionFilter` was removed because it did not actually filter the parent list;
- session deletion reconciles downstream snapshots/goals.

A Svelte PageData widening issue in `sortDir` was fixed at the server contract by explicitly typing it as `'asc' | 'desc'`.

### Phase 5 — Single-session Overview — DONE

Goal: answer **"what happened in this session?"** before asking the rider to study analytics.

Current hierarchy work:

- `SessionHero` leads with **What happened?**, three useful anchors, context/conditions, a genuine achievement when detected, and the run-by-run visual story;
- no-valid-speed sessions omit speed rather than rendering a meaningless blank metric;
- warm-up/excluded runs remain outside the eligible hero evidence;
- lower Performance Summary now surfaces one primary strength and one primary focus, with overflow deferred to Analysis;
- the duplicate six-card session-stat grid has been removed from Overview;
- the second `CrossRunProgression` block has been removed from Overview because it repeated the hero's run-by-run story;
- the lower page now reads: **what it means -> what changed (goals/setup) -> what to carry forward -> evidence exclusions -> Explore the runs**;
- Analysis remains the destination for dense run comparisons, technique scores, phase breakdowns and detailed charts.

Constraints retained:

- preserve the existing Overview / Analysis / Deep Dive layering;
- do not delete deeper analytics simply because the Overview becomes simpler;
- use canonical eligible evidence;
- keep excluded runs visible as historical/contextual evidence;
- video must be absent-first and optional when present;
- avoid turning Overview into another metric wall;
- retain pathways to the deeper analytical material.

Test-fixture note: synthetic DB sessions without `chart_data` can make physics-derived hero values such as peak speed disappear because `analyseRun()` returns `physics: null`; real device-ingested sessions carry the raw trace. See `docs/notes/session-overview-test-fixtures.md`.


## Completed renovation phases

The following phase descriptions preserve the intent that guided implementation; current status is authoritative over their original future-tense wording.

### Phase 6 — Session Analysis — DONE

Reorganise the middle analytical layer around questions and comparisons rather than chart accumulation. Preserve useful charts; remove/rework only those that duplicate an answer without adding understanding.

### Phase 7 — Session Deep Dive — DONE

Make the expert layer coherent for experienced riders/coaches: detailed traces, derived metrics, methodology/provenance where useful, and optional synchronised video evidence when available.

### Phase 8 — Progress / longitudinal analytics — DONE

Turn `/analytics` into a clear longitudinal progression workspace rather than a collection of charts. Separate recent direction, longer-term progression, consistency/fatigue/context and drill-downs.

### Phase 9 — Goals — DONE

Align Goals presentation with the evidence model already rebuilt in Release 1. Clarify PB-style ratchet semantics (likely "Best so far"), milestone/history presentation, prediction/adaptation, and completed-goal history.

### Phase 10 — Compare / leaderboard — DONE

Present percentile/benchmarking in a way that reinforces the intended model: riders are compared using onboarding/category baselines rather than simply ranking a young rider against elite raw reaction times. Keep admin baseline-reset capability in mind as population evidence grows.

### Phase 11 — Upload and session enrichment — DONE

Review manual upload, direct Wi-Fi upload and post-session enrichment as one user journey. Preserve low-friction upload. Context such as weather, track feeling and notes should be encouraged without becoming a barrier before data reaches the system.

Variable inputs such as warm-up/testing/equipment conditions must continue to support exclusion from analytics so they do not contaminate statistical evidence.

### Phase 12 — Video experience — DONE

Video is optional supplementary evidence. Review upload/linking/synchronisation and presentation without making video primary.

Current intended sync cue: the external hardware lights show a **full-white background for 120 ms** when enabled. Synchronisation is based on that cue, **not a GoPro flash**.

### Phase 13 — Coach workspace — DONE

Evolve the recently-added coach area into a useful workflow rather than requiring the coach to wait for riders to manually send individual reports. Preserve rider/parent ownership and explicit sharing/consent. Coach access should be useful but deliberately narrower than rider ownership.

Remember the hardware system already has a live dashboard and produces a per-device session report during live club sessions; this analytics application is primarily for deeper understanding and longitudinal history, not a replacement for that live dashboard.

### Phase 14 — Admin, research, help and public/supporting pages — DONE

Make Admin operationally coherent; resolve the `/feedback` workspace question; bring Help, About, Home/public pages and other supporting surfaces into the same visual/product language instead of feeling bolted on.

Research goal: support controlled access to anonymised historical BMX racing data for legitimate research requests while preserving privacy and evidence quality.

### Phase 15 — Final consolidation and release hardening — DONE

- remove dead components/legacy compatibility paths once no consumers remain;
- consolidate repeated presentation primitives where that reduces real maintenance cost;
- accessibility/responsive pass;
- terminology/copy consistency;
- empty/error/loading states;
- full static/unit/browser/live-data audit;
- update documentation to describe the final architecture rather than historical migrations/bridges that are no longer relevant.

Final checkpoint: consumer-backed dead-code and obsolete-route cleanup is complete; concrete mutation-recovery, copy-consistency, navigation, modal, upload-feedback, and keyboard-accessibility defects found in the bounded hardening sweep were corrected. Small local focus helpers were deliberately not extracted into a shared abstraction because the interaction ownership differs and extraction would add coupling without meaningful maintenance benefit. Final independent verification covered the newest shared surfaces, including video/image error announcements, public mobile navigation, and the global Feedback dialog backdrop/focus/Escape paths. Required CI is at 0 Svelte errors / 0 warnings with 128/128 tests and a passing production build. Phase 15 and Release 2 are complete.

## Deliberate non-goals / do not accidentally undo

- Do **not** gate Analysis or Deep Dive by rider type; they are layers of disclosure available to anyone who wants them.
- Do **not** make video required or use it as justification to remove useful sensor charts.
- Do **not** silently discard excluded runs from the historical record.
- Do **not** use one poor session to claim a declining trend.
- Do **not** redefine goal `current_value` as current form; separate trend/fatigue engines handle recency/regression.
- Do **not** expand Coach access to unrestricted rider data merely to make the coach UI convenient.
- Do **not** trust old bridge/migration documentation as current architecture without checking live code; substantial older migration documentation is known to be obsolete/junk.
- Do **not** rely on README alone for detailed system behaviour; inspect live code.

## External hardware relationship

The analytics site is downstream of a separate BMX home-training/hardware system.

- hardware/live system captures rider + bike data and can upload directly over Wi-Fi;
- manual/SD upload remains supported;
- duplicate attempts across transports must be idempotently detected;
- the hardware live dashboard is valuable in its own right, especially in club/coach use;
- this application owns deeper interpretation, historical context and longitudinal analytics.

## Working method

For each meaningful phase:

1. inspect live code and data contract before redesigning;
2. fix any truth/correctness seam discovered before styling around it;
3. make a focused branch/change;
4. merge to `master` only after diff sanity review;
5. run `tsc`, **`svelte-check`**, and Vitest;
6. exercise relevant live/browser/DB boundary cases where practical;
7. update this roadmap with decisions, completion status, deliberate deferrals and the next exact starting point.

This document is a checkpoint, not a substitute for the code. When they disagree, inspect the current implementation and update the checkpoint.