# Phase 6 — Session Analysis inventory

Purpose: classify the current `/sessions/[id]/analysis` surface before redesigning it. Analysis should answer **why did this run/session behave that way, and how do the runs differ?** It sits between the plain-language Overview and the expert Deep Dive.

## Keep in Analysis

### Run selection and classification

- Mobile `SwipeableRunSelector`
- Desktop run selector
- `RunTagSelector`

Reason: Analysis is run-centric. Choosing the run and correcting its statistical classification must remain close to the evidence being inspected.

### Multi-run comparison entry

- `RunComparisonSelector`

Reason: comparing runs is a core Analysis task. Keep the ability to compare selected runs, but audit presentation against Deep Dive's `RunComparison` so the two layers do not answer the same question twice.

### Optional video attachment

- `RunVideoAttachment`

Reason: video is supplementary evidence for the selected run. It may enhance Analysis when present but must not be the primary structure and must never be required for the page to make sense.

### Core selected-run evidence

Keep a concise run evidence block containing the useful measured/derived anchors:

- reaction time
- elapsed time
- max/average G
- speed values only when analytics are valid
- time to peak / speed profile where useful
- visible data-quality/provenance cue for estimated speed

Reason: these numbers ground the charts and answer "what was different about this run?"

### G-force and performance curves

- G-force trace
- speed + acceleration performance curve when valid

Reason: these are the most direct visual explanation of the selected run and belong naturally in the middle analytical layer.

### Technique summary

Keep one understandable technique summary for the selected run.

Reason: a rider/coach should be able to connect reaction, explosiveness, smoothness and efficiency to the run without entering Deep Dive.

## Simplify in Analysis

### Impulse / power charts

Current: both can appear as another full-width chart row before the selected-run evidence.

Direction: keep when reliable, but present as a secondary question such as **How was force delivered?** rather than another unexplained chart tier. Do not make missing rider/bike mass break the rest of Analysis.

### Run metrics card

Current: eight metric tiles plus speed profile.

Direction: reduce visual weight and group related values. Reaction / elapsed / force / speed should read as evidence groups, not a mini dashboard.

### Inline analysis insights

Current: explosive/power, speed/carry and smoothness insights are inserted between individual charts.

Direction: consolidate into a small "What this run suggests" interpretation block rather than interrupting the chart flow three times.

### Technique scores

Current: compact `Technique Scores` is followed later by `Detailed Technique Breakdown`.

Direction: Analysis keeps the compact, understandable technique summary. The detailed six-dimension benchmark belongs in Deep Dive.

### TrainingInsightsPanel

Current: renders coach-detail session narrative and recommendations at the bottom of Analysis.

Direction: remove or radically scope it. Overview already answers "How this session went" and surfaces one strength/one focus. Analysis should provide run-specific interpretation, not repeat the Overview narrative in denser form.

## Move to Deep Dive

### Force Application (Jerk)

- raw jerk trace
- smoothness score derived from jerk
- jerk-specific interpretation

Reason: rate-of-change-of-acceleration is valuable expert evidence, but it is a technical diagnostic rather than the clearest middle-layer explanation.

### Detailed Phase Analysis

- Drive / Transition / Velocity phase cards
- phase durations
- peak acceleration
- efficiency scores
- technical assessment

Reason: useful, but methodology-heavy. This is exactly the expert layer Deep Dive exists for.

### Acceleration Splits table

- target speed
- time
- distance
- phase

Reason: detailed split table is excellent drill-down material after the rider has chosen to inspect the physics closely.

### Detailed Technique Breakdown

- six-dimension 0–100 benchmarked breakdown

Reason: keep the understandable technique summary in Analysis; move the diagnostic benchmark detail to Deep Dive.

### CoachDiagnosticsCard

Direction: move to Deep Dive unless a future coach-specific Analysis experience justifies a concise rider-safe derivative.

Reason: by name and purpose this is diagnostic/expert material and currently contributes to Analysis feeling like every level at once.

## Duplicate / boundary audit

### Analysis `RunComparisonSelector` vs Deep Dive `RunComparison`

Both are run-comparison concepts. They should not become duplicate comparison dashboards.

Intended distinction to verify during implementation:

- Analysis: choose/overlay runs to answer **where do these runs differ?**
- Deep Dive: detailed multi-metric comparison / stability / targets to answer **what does that difference imply technically?**

### Overview narrative vs Analysis `TrainingInsightsPanel`

Overview now owns the first-layer session story. Analysis should not repeat the same session narrative at `detailLevel="coach"` merely because more space is available.

### Analysis compact technique vs Analysis detailed technique

One page currently presents two levels of the same scoring system. Split them by disclosure layer.

### Analysis raw signal diagnostics vs Deep Dive `DataDrillDown`

Deep Dive already exposes raw G-force data and stability. Jerk, detailed phases and acceleration splits align with that expert/raw-data role better than with middle-layer Analysis.

## Proposed Analysis hierarchy

1. **Choose / compare runs** — selector, tags, optional comparison overlay.
2. **Selected run at a glance** — concise evidence anchors + data-quality cue.
3. **How the run unfolded** — G-force and valid speed/acceleration curves; optional video alongside, never required.
4. **How force was delivered** — impulse/power when reliable.
5. **What this run suggests** — consolidated run-specific interpretation.
6. **Technique summary** — understandable selected-run scoring.
7. **Go deeper** — clear CTA to Deep Dive for jerk, phases, splits, detailed technique, diagnostics and raw data.

## Non-goals

- Do not remove charts merely because video can show motion.
- Do not gate Analysis or Deep Dive by rider type.
- Do not hide estimated/derived provenance.
- Do not move basic run classification/tagging away from the evidence it changes.
- Do not turn Analysis into another session-level narrative page.

## Implementation order

1. Establish the new Analysis hierarchy without changing calculations.
2. Remove the repeated `TrainingInsightsPanel` session narrative from Analysis.
3. Consolidate chart-adjacent insight callouts into one run-specific interpretation area.
4. Move jerk / detailed phases / acceleration splits / detailed technique / coach diagnostics into Deep Dive, preserving capability.
5. Reconcile Analysis comparison UX with Deep Dive comparison so each layer has a distinct job.
6. Run `svelte-check`, `tsc`, Vitest, then browser-test selected-run switching, excluded tags, invalid speed, missing mass, optional video, mobile and multi-run comparison.
