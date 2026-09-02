# Release 3 — Progress → Sessions → Video continuation handoff

Status: **CONTINUATION CONTRACT / DESIGN-FIRST CHECKPOINT**

Baseline at creation: `97ad121a0af63ddef2fae7c2370270bff8812a83` on `release3-progress-clean-sheet`.

This document exists so the next implementation conversation does not have to reconstruct the Release 3 product model from a long chat history. It is intentionally broader than a technical TODO list. The remaining work is about semantic truth, rider journey, information architecture, interaction/state transitions, presentation richness, video lifecycle, and cross-product traceability together.

## 1. First rule for the next conversation: do not implement Sessions immediately

Before changing Sessions production code:

1. fetch the current branch head and treat it as source of truth;
2. re-read this handoff and the referenced inventory/contract notes;
3. re-audit the current repository because Progress and Sessions may have advanced independently;
4. complete the remaining Progress coverage audit;
5. inventory the full Sessions rider journey, not merely its route tree;
6. **produce mock-ups for each major Sessions section and agree the presentation hierarchy before implementing it.**

The mock-up step is mandatory unless explicitly waived by the product owner. Sessions should receive the same clean-sheet presentation attention as Progress: rich but calm hierarchy, meaningful visual storytelling, progressive disclosure, useful sparse states, clear evidence/provenance, and deep inspection without turning the top-level experience into an analytics dump.

Mock-ups are product-definition tools, not decoration. They should expose ordering problems, missing states, duplicated jobs and interaction conflicts before code hardens them.

## 2. What was proven during the Progress clean-sheet work

The strongest reusable rule is:

> One rider-facing claim has one evidence authority.

The evidence model owns eligibility, direction, confidence/state and supported counts. Presentation adapters may reshape or join already-owned provenance. Components render frozen fields. Routes gate layers from existing evidence states. Rendering code does not invent statistical thresholds, trends or confidence.

Other frozen rules:

- evidence depth is earned, not unlocked from total session count;
- missing evidence means unavailable/building, not poor performance;
- history is not automatically a trend;
- association is not causation;
- no null-to-zero coercion;
- no placeholder statistic should be rendered as a real statistic;
- no second trend/confidence calculation in Svelte;
- individual secondary layers may remain immature even when the overall page is mature;
- dense proof belongs behind progressive disclosure;
- supporting-session proof must preserve exact upstream membership rather than recompute eligibility/windows;
- latest recorded session and latest analysed/supported session are distinct concepts when the evidence differs.

See `docs/notes/progress-depth-grammar.md` for the implementation-extracted grammar.

## 3. Important correction: Progress semantic rigour was strong, coverage was incomplete

The clean-sheet Progress work rigorously rebuilt the claims it admitted, but that is not the same as covering the full rider-development metric space.

The earlier Phase 8 inventory explicitly anticipated a broader Progress product including reaction, valid speed, peak G, genuine technique progression, repeatability, best-vs-average behaviour, set-length/drop-off evidence, fatigue/regression, contextual/setup evidence, recurring diagnostics and longitudinal drill-down.

The branch has since begun filling that gap. At baseline `97ad121a`, the product owner added substantial work including:

- Power Output Development using real physics-derived average/peak power;
- a dedicated Power deep dive with evidence/context/synthesis/depth/supporting-session layers;
- Drop-Off Position evidence based on performance-persistence support and real run-number distribution;
- wheelie-pattern evidence with sample-size and analytics-valid boundaries;
- richer recurring diagnostic evidence;
- real snapshot sparklines rather than decorative repeated bars;
- readability/layout improvements.

Therefore do **not** describe Progress as globally complete merely because its authority seams were consolidated.

### Required Progress completion audit

Before Sessions implementation, classify the available longitudinal metric space into:

1. **authoritative and adequately surfaced**;
2. **authoritative but insufficiently surfaced/presented**;
3. **data exists but its Progress semantic contract still needs validation**;
4. **unsupported, misleading, redundant or not worth surfacing**.

Explicitly investigate, where the current engine/data support them:

- Reaction;
- Peak Speed;
- Peak G / force development;
- average and peak Power;
- acceleration/force-development timing;
- impulse timing;
- smoothness/jerk;
- genuine technique dimensions;
- repeatability/consistency;
- persistence, fatigue and drop-off position;
- wheelie behaviour;
- setup/context associations;
- conditions and rider-state/emotional context where longitudinally meaningful;
- goals;
- recurring strengths/limiters and diagnostics.

Do not add a metric merely because a field exists. Every new Progress claim must answer a rider question and have an evidence authority.

## 4. Progress presentation standard carries into Sessions

Release 3 is not a data-only migration.

The Progress work established the desired presentation quality:

- concise orientation before detail;
- visually rich metric storytelling;
- real charts/sparklines rather than decorative pseudo-data;
- evidence state communicated without overwhelming jargon;
- progressively deeper metric pages;
- concrete comparison proof;
- supporting-session traceability;
- contextual evidence framed cautiously;
- provenance available without dominating the page;
- mobile/readability considered as product requirements;
- sparse evidence states designed intentionally rather than treated as broken versions of mature states.

Sessions must be designed to the same standard. Correct calculations inside an old or cluttered page structure are not sufficient.

## 5. Sessions must be designed from the rider journey, not the current route tree

A session is not simply a collection of runs plus analytics. The next audit must trace the actual order of operations and state transitions across the repository, including all of the surrounding product complexity.

At minimum inventory:

- onboarding/profile prerequisites;
- rider and bike/setup context;
- session creation/import/upload;
- conditions/environment capture;
- rider emotions / ride feel / subjective state;
- session intent/focus;
- run types and run tags/classification;
- warm-up/testing/other exclusion semantics;
- recorded-run count versus eligible/supported-run count;
- reclassification after analysis and its downstream invalidation/reprojection effects;
- session editing and context editing;
- canonical session summary;
- run selection;
- recorded evidence;
- data-quality/calibration state;
- derived physics;
- technique/interpretation;
- run comparison;
- optional per-run video;
- notes;
- sharing/report actions;
- supporting links into/from Progress.

Do not assume the order currently presented in the UI is the correct rider order. Mock-ups should be used to resolve the choreography before implementation.

## 6. Working Sessions information architecture

The existing renovated documentation gives a useful backbone, subject to the new audit and mock-ups:

### Sessions list

Job: orient the rider across recorded sessions and make the next useful destination obvious.

It should not become a compressed Progress page. Session rows/cards should primarily identify the session, its usable evidence/context and important status, with enough richness to choose where to go.

### Session Overview

Core question:

> What happened in this session, what context matters, and what deserves attention next?

Overview should integrate session identity/context, conditions, rider state/feel, intent, run classification/eligibility, canonical session-level evidence, progression within the session, concise interpretation and obvious next investigation paths.

It must remain useful before deep analytics are available.

### Analysis

Core question:

> What happened in this selected run, and how was it delivered?

Analysis is run-focused. One selected run should drive headline evidence, traces, derived physics, comparison and optional video. Run switching must change all run-owned evidence coherently.

This is the natural home for straightforward run comparison and synchronized short-clip video.

### Deep Dive

Core question:

> What does the underlying evidence show, how was it derived, and where should I investigate further?

Preferred hierarchy from the existing Phase 7 inventory:

1. orientation;
2. evidence quality / calibration / mass provenance;
3. selected-run raw evidence;
4. force application / jerk / early stability;
5. phases and acceleration splits;
6. technique decomposition and benchmark context;
7. expert diagnostics and carefully framed follow-up;
8. supporting context/actions such as notes and report-related actions.

Deep Dive should not duplicate Analysis's basic headline run comparison.

This Overview → Analysis → Deep Dive backbone is a starting hypothesis, not permission to skip mock-ups or the rider-journey audit.

## 7. Mock-up gate before Sessions implementation

Before production implementation, create and review mock-ups for at least:

- Sessions list — mature and sparse/first-session states;
- Session Overview — context-rich and context-poor states;
- run classification/tagging/exclusion interactions;
- conditions + rider state/emotion capture/edit flow where it belongs in the journey;
- Analysis with no video;
- Analysis with an unsynced run clip;
- Analysis with a synchronized run clip;
- run switching/comparison;
- Deep Dive normal evidence;
- Deep Dive with calibration/data-quality warnings;
- mobile ~390 px versions of the primary flows.

Mock-ups should answer both **what is shown** and **when/why it appears**. They should include empty/building/error/reclassified states where those materially change the experience.

Do not begin by styling the current pages in place. First decide the rider hierarchy, then map existing capabilities into it.

## 8. Hard video product invariants

### Video unit = run, not session

The attachment model is one optional **short clip per run**.

A session may have:

- no clips;
- one clipped run;
- several clipped runs;
- a clip for every run.

The product is **not** designed around uploading one large continuous/full-session video and slicing/seeking it in the web app.

Attachment UX and validation should therefore be optimized for short run clips. Define sensible duration/file-size/type constraints during implementation and gracefully reject inappropriate full-session-sized uploads rather than accepting any large MP4/MOV merely because Storage can hold it.

### Video is supplementary evidence

Sensor evidence, Overview, Analysis and Deep Dive remain complete without video.

Selecting a run selects that run's measurements/traces and that run's optional clip. Replacement/removal belongs to the run attachment lifecycle.

### Synchronization event

The external hardware Lights unit shows a **full-white background for approximately 120 ms** at gate zero when enabled.

The synchronization point is the **leading edge** of that finite white pulse.

It is not a GoPro flash. The web application does not control the GoPro/camera.

If a trustworthy cue is found, synchronized playback may align telemetry to the run clock. If no trustworthy cue is found, attachment still succeeds as ordinary unsynchronized playback.

## 9. Video correctness work required before relying on synchronized UX

The existing Phase 12 inventory identified concrete blockers:

1. replace flash/spike semantics with a finite ~120 ms white-pulse model;
2. refine to the pulse **leading edge**, not the brightest point inside the plateau;
3. make pulse qualification time-based rather than sample-count based;
4. regression-test finite pulse, noise, sustained lighting change and leading-edge accuracy;
5. use a unique Storage object path for each attachment attempt;
6. if metadata finalization fails, best-effort remove the newly uploaded object;
7. only remove the previous attachment object after successful replacement finalization;
8. strongly validate duration and sync metadata as finite and physically possible;
9. preserve unsynced ordinary playback;
10. preserve no-video analytical completeness;
11. verify run switching cannot leak one run's video/sync state into another.

See `docs/notes/phase12-video-inventory.md`.

## 10. Order of operations for the next implementation phase

### Phase A — Re-acquaintance and design

- fetch fresh branch head;
- audit current Progress additions and complete metric-coverage classification;
- inventory full Sessions rider journey and state machine;
- identify authoritative data/evidence owners;
- create/review Sessions mock-ups;
- freeze the agreed information architecture and interaction order.

**No broad Sessions production implementation before the mock-up gate.**

### Phase B — Sessions foundation

- establish list/session/run presentation adapters where needed;
- remove local interpretation that duplicates canonical engines;
- make run eligibility/classification provenance explicit;
- establish selected-run authority and reclassification behaviour;
- implement the agreed Sessions shell and Overview from the mock-ups.

### Phase C — Analysis

- implement the agreed run-focused Analysis experience;
- recorded evidence before derived physics before interpretation;
- coherent run selection and comparison;
- honest unavailable/invalid physics states;
- preserve direct versus derived evidence distinction.

### Phase D — Video correctness and integration

- fix pulse detector and storage/finalization lifecycle first;
- enforce short-run-clip product constraints;
- verify no-video and unsynced-video states;
- integrate synchronized video into the selected-run Analysis experience;
- add Deep Dive synchronized inspection only where it genuinely improves expert evidence inspection.

### Phase E — Deep Dive

- reorganize expert capability into evidence → derivation → interpretation → action;
- preserve useful raw/technical capability;
- remove duplicate headline comparison jobs;
- keep warnings/provenance ahead of derived diagnostics;
- preserve notes/supporting records.

### Phase F — Cross-product closure

- verify Progress supporting-session links land in meaningful Sessions evidence;
- verify Sessions changes/reclassifications propagate honestly into Progress;
- finish remaining Progress presentation/coverage seams exposed by Sessions;
- complete responsive/accessibility/sparse-state verification.

### Phase G — Reports migration

Reports remain on the previous analytics/report engine until **both Progress and Sessions evidence/presentation contracts are complete**.

Only then redesign the report engine to consume the new authorities. Do not maintain evidence-parity claims before that migration.

## 11. Verification discipline

Continue the evidence-first workflow used during Progress:

- always fetch current branch head before writes;
- larger bounded implementation batches are preferred over tiny slices once semantics are known;
- new semantic claims still require source investigation;
- counterexample-first tests;
- exact base/head SHA and diff inventory at checkpoints;
- separate semantic changes from presentation changes;
- inspect raw CI logs rather than trusting status summaries;
- do not call CI green until the relevant final head/merge containing it has completed;
- use live seeded personas when they can actually disprove the contract;
- reclassification is a particularly valuable live counterexample;
- verify mobile and sparse states, not only mature desktop accounts.

For Sessions/video specifically include:

- first/only session;
- single-run and multi-run sessions;
- excluded/reclassified run;
- context-rich/context-poor session;
- missing mass/calibration warning;
- valid/invalid derived physics;
- no video;
- valid short unsynced clip;
- valid short synchronized clip;
- replacement/removal/finalization failure;
- run switching with different video states;
- 390 px primary flows.

## 12. Key source notes to read in the next conversation

- `docs/notes/progress-depth-grammar.md`
- `docs/notes/phase8-progress-inventory.md`
- `docs/notes/phase7-deep-dive-inventory.md`
- `docs/notes/phase12-video-inventory.md`
- `docs/chapters/appgatepro_session_chapter.md`

These are inputs, not unquestionable current truth. The live repository at the fresh branch head wins when implementation has moved on.

## 13. Definition of success

Release 3 should feel like one coherent product rather than renovated islands.

A rider should be able to move naturally from:

**setup/context → session → runs → selected-run evidence → optional short run video → deeper technical proof → longitudinal Progress → report/share**

without encountering contradictory truth models or having to understand the internal engine architecture.

The ordinary experience should be clear and visually rich. The expert experience should remain deep. Evidence quality and provenance should be available whenever a claim needs defending. Optional complexity should reveal itself progressively rather than being removed.

The next implementation conversation should begin with **design/re-acquaintance and mock-ups**, not with editing the existing Sessions pages.