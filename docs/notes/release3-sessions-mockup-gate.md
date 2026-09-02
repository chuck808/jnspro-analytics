# Release 3 — Sessions rider journey + mock-up gate

Status: **mock-up proposal only. Production Sessions UI is intentionally unchanged.**

Audit baseline: `release3-progress-clean-sheet` at `4fb3bd2ec018555fd4285c13c538a881aa1c52e7`, plus the Progress audit commit immediately preceding this document.

This document is the review gate required by `release3-progress-sessions-video-handoff.md`. It inventories the current rider journey and proposes the presentation hierarchy/states that should be agreed before any production Sessions redesign.

## Product backbone

The working information architecture remains:

**Sessions list → Overview → Analysis → Deep Dive**

Each layer has one primary question:

- **Sessions list:** which session should I open, and what kind of record is it?
- **Overview:** what happened, under what context, and what deserves attention next?
- **Analysis:** which run am I investigating, and what evidence explains it?
- **Deep Dive:** how trustworthy is the evidence, how was it derived, and what technical detail supports the interpretation?

Video remains subordinate to this journey. A session and a run must remain fully understandable with no video attached.

## Current rider-journey audit

### What already works

- Sessions list already distinguishes recorded versus stats-eligible runs, has date filtering, first-session empty state, core reaction/speed summary, and routes directly into Overview.
- Overview already supports first-pass context/tag capture with live recalculation, context/setup display, session narrative, goal movement, setup-change evidence and strength/limiter interpretation.
- Analysis already owns run selection, tagging, comparison, primary traces, quality state, impulse/power physics and optional run video.
- Deep Dive already puts calibration/mass warnings ahead of raw signal and technical diagnostics, matching the evidence → derivation → interpretation order.
- The video subsystem already supports the three essential product states: absent, attached-unsynced, and attached-synchronised.

### What the mock-up gate needs to solve

The current implementation grew capability-first. The redesign should make the rider's next decision obvious without deleting capability:

1. context capture should feel like part of the session record, not a setup interruption;
2. run classification must explain immediately whether a tag changes statistics;
3. Analysis should have one run-selection model and one comparison model that remain legible on mobile;
4. optional video should occupy the evidence area only when it exists, with synced/unsynced state impossible to confuse;
5. Deep Dive should make quality limitations visually dominant before technical values;
6. sparse/first-session states should teach the hierarchy without manufacturing findings;
7. context and rider-state capture need a product contract before adding fields. The current schema provides weather, surface, focus and one `RideFeel` value; it does not yet model a separate emotional-state dimension.

## Visibility rules

These rules apply to every frame below.

- **Recorded evidence first.** Reaction/G-force and raw traces are not styled as equivalent to derived physics or interpretation.
- **Derived values carry provenance.** Speed, impulse, power, jerk and technique scores say when they are estimated/derived or unavailable.
- **No empty-card theatre.** A missing unsupported metric becomes a concise reason + next action, not a blank dashboard tile.
- **Context never rewrites sensor truth.** Editing weather/focus/feel or run tags may change eligibility/interpretation, but the original run record remains visible.
- **Classification effects are explicit.** `Warmup`, `Experimental`, `Competition`, and `Exclude from Stats` currently exclude a run from session statistics; `Best Effort` does not. The UI must say this before save.
- **Video never gates analysis.** No-video is the default complete state. Unsynced is a successful attachment state. Synced means only that the run clock can align to the detected leading edge of the ~120 ms full-white hardware pulse.
- **Comparison is opt-in.** A rider studies one selected run first; comparison adds a second run without turning every chart into a permanent two-run view.
- **Mobile preserves order, not density.** At ~390 px, hierarchy becomes a vertical evidence story with sticky/selectable run controls; no critical state is hidden behind desktop-only hover.

---

# Mock-up 1 — Sessions list, mature history

**Rider job:** scan history, recognise the relevant session, open Overview.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ SESSIONS                                                   [Export] [Upload]│
│ Your training record                                                        │
│ [From] [To]                                  [Newest first] [Filter]          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 02 Sep 2026 · 18:14    GATE · Race bike A                         Overview → │
│ Dry concrete · Reaction focus · Felt dialled                                │
│ 8 eligible / 10 recorded        Best reaction 0.287s   Peak speed 21.8 km/h │
│ 2 excluded: Warmup, Experimental                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 30 Aug 2026 · 10:06    GATE · Race bike A                         Overview → │
│ Context incomplete                                                          │
│ 6 eligible / 6 recorded         Best reaction 0.301s   Peak speed unavailable│
│                                             Needs speed-quality review       │
├─────────────────────────────────────────────────────────────────────────────┤
│ ...                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hierarchy decisions

- Date/time + bike/session identity lead.
- Context is a single readable line, not four separate badges.
- “eligible / recorded” is always visible when counts differ.
- Two rider-recognisable facts are enough on the list: best reaction and validated peak speed. Do not turn the list into Progress.
- Data-quality absence is expressed as status (“Peak speed unavailable”), not `0` or an estimate without provenance.
- Delete/export remain utility actions, visually below navigation importance.

---

# Mock-up 2 — Sessions list, first session / sparse history

```text
┌──────────────────────────────────────────┐
│ SESSIONS                                 │
│ Your training record                    │
│                                          │
│        No gate sessions yet              │
│  Your first upload creates the record    │
│  used by Overview, Analysis and Progress.│
│                                          │
│          [ Upload a session ]            │
│                                          │
│  What happens next                       │
│  1. Review session context               │
│  2. Classify any warmup/test runs        │
│  3. Investigate a run in Analysis        │
└──────────────────────────────────────────┘
```

For one or two sessions, remove filters/pagination unless useful. The page should spend its space teaching the next step rather than showing controls with no leverage.

---

# Mock-up 3 — Overview, context-rich session

**Rider job:** understand the session before selecting a run.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Sessions        02 Sep 2026 · Gate session        [Overview][Analysis][Deep]│
├─────────────────────────────────────────────────────────────────────────────┤
│ SESSION READ                                                                  │
│ Fastest reaction improved inside the set; pace held through the late runs.   │
│ [0.287s best reaction] [21.8 km/h peak speed · validated] [8 eligible runs] │
│ mini progression:   r1  r2  r3  r4  r5  r6  r7  r8                           │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ CONTEXT                           │ RUN RECORD                               │
│ Dry concrete · Sunny             │ 10 recorded · 8 eligible                │
│ Focus: Reaction time              │ #1 Warmup            excluded           │
│ Ride feel: Dialled                │ #2 Training           included           │
│ Bike/profile snapshot linked      │ #3 Best Effort        included           │
│                          [Edit]   │ ...                         [Classify]   │
├───────────────────────────────────┴─────────────────────────────────────────┤
│ WHAT IT MEANS                                                               │
│ concise evidence-backed narrative                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ CARRY FORWARD             GOAL MOVEMENT / SETUP CHANGE only when supported │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visibility

- The context strip sits beside the run record because both explain the denominator of the summary.
- “Session read” is the hero; a social achievement only replaces/adds to it when a genuine achievement is detected.
- Goal/setup-change modules are conditional supporting evidence, never permanent empty slots.
- Overview does not display detailed impulse/jerk/phase diagnostics.

---

# Mock-up 4 — Overview, context-poor / first-pass classification

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ BEFORE WE SUMMARISE THIS SESSION                                             │
│ Two quick checks make the session record more useful.                        │
├────────────────────────────────────┬────────────────────────────────────────┤
│ 1 · SESSION CONTEXT                │ 2 · RUN CLASSIFICATION                 │
│ Weather     [Not set ▾]            │ #1 0.344s [Warmup ▾]   → excluded     │
│ Surface     [Not set ▾]            │ #2 0.306s [Training ▾] → included     │
│ Focus       [Not set ▾]            │ #3 0.295s [Best effort]→ included     │
│ Ride feel   [Not set ▾]            │ #4 0.410s [Experimental]→ excluded    │
│                                    │                                         │
│ [Save context]                     │ Eligible summary preview: 2 / 4 runs   │
├────────────────────────────────────┴────────────────────────────────────────┤
│ LIVE PREVIEW                                                                  │
│ Best reaction 0.295s · average … · the recorded runs themselves are unchanged│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Gate decision: rider state / emotion

Do **not** add production “emotion” controls from this mock-up alone. Current storage supports `RideFeel` only (`Off Day`, `Solid`, `Good`, `Dialled`, `Peak`). Product review should decide whether this single scale is enough or whether Release 3 needs separate physical readiness / mental state / emotion fields. If new fields are approved, define persistence and longitudinal semantics before implementation.

---

# Mock-up 5 — Run classification / tagging detail

**Rider job:** label intent without accidentally changing statistics.

```text
┌────────────────────────────────────────────────────┐
│ Classify Run 4 · 0.410s                            │
│                                                    │
│ Intent tags                                        │
│ [ Warmup ] [ Best Effort ] [ Experimental ]        │
│ [ Competition ]                                    │
│                                                    │
│ Statistics                                         │
│ [ ] Exclude from stats explicitly                  │
│                                                    │
│ ⚠ Experimental runs are currently excluded from   │
│   session statistics. This changes the session     │
│   summary, not the recorded run.                   │
│                                                    │
│ Before: 3 eligible / 4 recorded                    │
│ After:  2 eligible / 4 recorded                    │
│                                      [Cancel][Save]│
└────────────────────────────────────────────────────┘
```

### Reclassified state

After save, show a short inline confirmation next to the run and recompute the session summary from the canonical path. If a prior achievement/narrative disappears because eligibility changed, say “Session summary updated after run classification” rather than making the change look like missing data.

### Contract seam to review

`Competition` currently excludes a run from stats even though it can be highly meaningful evidence, while `Best Effort` remains included. Keep current behaviour in production until explicitly changed, but make this rule visible in the gate review because it may be surprising to riders.

---

# Mock-up 6 — Analysis, no video

**Default and complete state.**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ANALYSIS · Understand the run                                                │
│ Run 3 of 10  [‹] [Run 3 · 0.287s ▾] [›]          [Compare] [Classify]       │
├─────────────────────────────────────────────────────────────────────────────┤
│ SELECTED RUN                                                                 │
│ Reaction 0.287s     Peak G 1.42G     Peak speed 21.8 km/h · validated       │
│ Data quality: GOOD                                                [Add video]│
├─────────────────────────────────────────────────────────────────────────────┤
│ RECORDED G-FORCE TRACE                                                       │
│ [──────────────────────── chart ────────────────────────────────]             │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ DERIVED SPEED / ACCEL             │ FORCE DELIVERY                          │
│ [chart or reason unavailable]     │ Impulse / avg power / peak power        │
│                                   │ only when supported                     │
├───────────────────────────────────┴─────────────────────────────────────────┤
│ RUN INTERPRETATION · concise supported insights                              │
│ Technique summary · derived interpretation                                  │
│                                                   [Open Deep Dive →]         │
└─────────────────────────────────────────────────────────────────────────────┘
```

The Add video action is low-key and never occupies hero space when no clip exists.

---

# Mock-up 7 — Analysis, attached but unsynchronised video

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Run 3 · Analysis                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ VIDEO · attached                                                             │
│ [ ordinary video player                                                    ] │
│ UNSYNCHRONISED                                                               │
│ No trustworthy gate-zero cue was found. Playback is available, but telemetry│
│ is not aligned to this clip. Sensor analysis below is unchanged.             │
│ [Try sync again] [Replace clip] [Remove]                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ RECORDED EVIDENCE ...                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

Unsynchronised is not styled as a failed upload. Never show a merged video/telemetry scrubber or aligned event overlay in this state.

---

# Mock-up 8 — Analysis, synchronised run clip

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Run 3 · Analysis                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ VIDEO · SYNCHRONISED TO GATE ZERO                                            │
│ [ video                                      │ restrained telemetry overlay ]│
│ ────────────────●──────────────── merged scrub / run clock ────────────────   │
│ Gate 0.000s · sync based on leading edge of hardware white pulse             │
│ [Replace clip] [Remove]                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ SELECTED RUN + RECORDED TRACE / DERIVED EVIDENCE                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Video hierarchy rules

- Clip belongs to a **run**, not the session as a whole.
- UI says “hardware white pulse” / “gate-zero cue,” never “GoPro flash.”
- Synced telemetry is restrained; the clip must not replace the primary sensor trace.
- Run switching swaps the complete video state with the run. No attachment/sync state may leak between runs.

---

# Mock-up 9 — Analysis run comparison

**Rider job:** compare a chosen baseline run with one other run while retaining selected-run context.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ COMPARE RUNS                                      [Done comparing]           │
│ A: Run 3 · Best Effort  [change ▾]     B: Run 7 · Training [change ▾]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                      RUN 3             RUN 7              DIFFERENCE         │
│ Reaction             0.287s            0.302s             A 15ms faster      │
│ Peak G               1.42G             1.38G              +0.04G             │
│ Peak speed           21.8 validated    21.5 validated     +0.3 km/h          │
├─────────────────────────────────────────────────────────────────────────────┤
│ G-FORCE TRACE · A + B, clearly keyed                                         │
│ [────────────────────────────────────────────────────────────────────────]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Derived comparison only where both runs have support                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

Do not declare a single “winner” by counting unrelated metrics. Comparison should describe differences and provenance, leaving judgement to the rider/coach.

---

# Mock-up 10 — Deep Dive, normal evidence

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ DEEP DIVE · Run 3                                                            │
│ Inspect the evidence behind the interpretation                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ EVIDENCE QUALITY      GOOD · calibration and required inputs supported       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. RECORDED SIGNAL                                                           │
│    Raw G-force drill-down                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. FORCE APPLICATION                                                         │
│    Early-force stability · jerk / rate-of-change                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. DERIVED PHYSICS                                                           │
│    Drive / Transition / Velocity · acceleration splits · impulse             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. TECHNIQUE + BENCHMARK CONTEXT                                              │
│    Six-dimension derived score decomposition                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. EXPERT DIAGNOSTICS                                                        │
│    Evidence → reasoning → prioritised follow-up                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. SUPPORTING RECORD                                                         │
│    Notes · report/share actions                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

Generic previous-session comparison is not part of this core hierarchy; longitudinal questions belong primarily in Progress.

---

# Mock-up 11 — Deep Dive, calibration / data-quality warning

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ DEEP DIVE · Run 5                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ ⚠ EVIDENCE QUALITY — REVIEW BEFORE INTERPRETING                              │
│ Calibration appears outside the supported range.                             │
│ Recorded G-force remains available; speed/power/derived diagnostics may be   │
│ withheld or qualified.                         [How to fix / calibration help]│
├─────────────────────────────────────────────────────────────────────────────┤
│ RECORDED SIGNAL                                                              │
│ [raw G-force trace — still available]                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ DERIVED PHYSICS                                                              │
│ Peak speed: unavailable — calibration quality insufficient                    │
│ Power: unavailable — requires trustworthy acceleration + rider/bike mass     │
├─────────────────────────────────────────────────────────────────────────────┤
│ INTERPRETATION                                                               │
│ Only diagnostics whose inputs remain supported are shown.                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

For missing mass without calibration failure, use an amber informational state rather than a red corruption warning: recorded/kinematic evidence can remain valid while mass-dependent power/impulse is unavailable.

---

# Mock-up 12 — ~390 px primary mobile flow

## Sessions list

```text
┌──────────────────────────────┐
│ Sessions              Upload │
│ 02 Sep · 18:14               │
│ Gate · Race bike A           │
│ Dry · Reaction · Dialled     │
│                              │
│ 0.287s        21.8 km/h      │
│ reaction      peak speed     │
│ 8 eligible / 10 recorded    │
│ 2 excluded                   │
│                    Overview →│
├──────────────────────────────┤
│ next session ...             │
└──────────────────────────────┘
```

## Overview

```text
┌──────────────────────────────┐
│ ← Sessions        Overview ▾ │
│ 02 Sep · Gate                │
├──────────────────────────────┤
│ SESSION READ                 │
│ concise outcome              │
│ [0.287s] [21.8] [8 runs]     │
├──────────────────────────────┤
│ Context               Edit   │
│ Dry · Reaction · Dialled     │
├──────────────────────────────┤
│ Run record          Classify │
│ #1 Warmup       excluded     │
│ #2 Training     included     │
│ ...                          │
├──────────────────────────────┤
│ What it means                │
└──────────────────────────────┘
```

## Analysis

```text
┌──────────────────────────────┐
│ Analysis                     │
│ ‹  Run 3 · 0.287s  ›         │
│ [Compare] [Classify]         │
├──────────────────────────────┤
│ 0.287s  1.42G  21.8km/h     │
│ Quality GOOD                 │
│                  Add video   │
├──────────────────────────────┤
│ G-force trace                │
│ [chart]                      │
├──────────────────────────────┤
│ Derived evidence             │
│ [supported blocks]           │
├──────────────────────────────┤
│ Interpretation               │
│                  Deep Dive → │
└──────────────────────────────┘
```

When video exists, insert its synced/unsynced block **after the run selector and before the headline/trace evidence**, but preserve the same evidence order below it. A sticky compact run selector is acceptable; a sticky video player is not required.

---

# Empty, building, error and reclassified states

| Surface | State | Presentation rule |
|---|---|---|
| Sessions list | no history | explain first upload and next journey; no filters |
| Sessions list | filtered empty | preserve filters; offer Clear filter |
| Overview | one run | show measured facts; say comparison/repeatability needs more runs |
| Overview | context missing | invite completion; do not block access to the session |
| Overview | all runs excluded | show recorded runs, explain no eligible session aggregate, make classification repair obvious |
| Analysis | no chart data | show run record/headline facts that remain valid; explain why traces/derived views are absent |
| Analysis | derived speed invalid | keep recorded G-force; withhold speed/accel claim |
| Analysis | missing mass | withhold mass-dependent power/impulse; link to profile/setup fix |
| Analysis | video upload failed | sensor analysis remains unchanged; retry/remove upload state locally |
| Analysis | video attached, sync not found | ordinary playback + explicit Unsynchronised state |
| Analysis | sync found | aligned player/telemetry; state belongs to selected run only |
| Comparison | only one run | hide/disable comparison with plain reason |
| Deep Dive | calibration warning | warning first; selectively withhold/qualify derived evidence |
| Deep Dive | single run | raw evidence available; cross-run stability says not available |
| Classification | run retagged | recompute through canonical stats path; confirm denominator changed |
| Context | edited | update interpretation preview/persisted narrative without claiming sensor values changed |

# Proposed navigation and action hierarchy

Across Overview / Analysis / Deep Dive, keep a stable session header with:

1. back to Sessions;
2. session identity/date/bike;
3. three workspace tabs;
4. report/share in a secondary utility area, not as the primary task.

Run selection belongs in Analysis and may carry into Deep Dive as shared session state. Overview should show the run record but should not force a selected-run analytical workspace.

# Production contract decisions required before gate approval

The mock-up gate should be considered **open** until these are agreed:

1. **Rider state / emotion:** keep one `RideFeel`, rename it, or add separate physical/mental state fields? No production fields should be added before this decision.
2. **Competition-run eligibility:** current code excludes `competition` from stats. Confirm this is desired rider-facing semantics.
3. **Context editing timing:** allow editing at any time (recommended) while preserving a visible “session record updated” audit affordance, or limit edits after analysis/report sharing?
4. **Analysis video placement:** approve the proposed position between run selector and sensor evidence, with no-video remaining visually complete.
5. **Comparison scope:** approve exactly two runs at a time and no synthetic winner score.
6. **Deep Dive longitudinal comparison:** remove generic previous-session comparison from the core technical hierarchy and send longitudinal questions to Progress.
7. **Sparse-state tone:** approve teaching-oriented first-session screens rather than empty dashboard shells.

# Gate acceptance checklist

No Sessions production redesign should start until product review agrees that:

- [ ] mature and sparse Sessions list hierarchy is correct;
- [ ] context-rich and context-poor Overview hierarchy is correct;
- [ ] run classification communicates stat eligibility before save;
- [ ] context / rider-state capture contract is decided;
- [ ] Analysis no-video state is complete;
- [ ] unsynchronised video is successful ordinary playback, not an error;
- [ ] synchronised video uses the leading edge of the ~120 ms full-white gate cue and does not replace sensor traces;
- [ ] run comparison is evidence comparison, not a winner calculation;
- [ ] Deep Dive starts with quality/provenance and retains raw evidence when possible;
- [ ] calibration and missing-mass states are visually distinct;
- [ ] ~390 px flow preserves the same information hierarchy;
- [ ] empty/building/error/reclassified states above are accepted;
- [ ] production implementation may begin only after this checklist is explicitly approved.

## Implementation hold

**No files under `src/routes/(protected)/sessions`, `src/lib/components/session`, video components, or session context/tag production code are changed by this gate document.**

The next step is review/approval or edits to these mock-ups. Only after that approval should production Sessions UI work begin.
