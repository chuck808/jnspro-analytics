# Progress clean-sheet blueprint

Status: **DESIGN CONTRACT — IMPLEMENT AGAINST THIS, NOT THE OLD UI**

## Reset decision

The existing `/analytics` page remains intact as the reference/fallback implementation. It is valuable for validating calculations, evidence thresholds, provenance, edge cases and deeper analytical capability, but it is no longer the presentation template for Release 3.

The clean-sheet Progress experience will be developed in parallel at `/progress-next` and will consume the existing truthful data contracts while using a new component tree. Old visual components are not to be ported one-for-one.

The design target is the approved richer Progress mock-up: a rider-performance instrument that is immediately scannable, visually layered, and capable of deep investigation without presenting every analytical detail at once.

## Product grammar

The page must preserve the Release 3 depth model:

1. **Story** — what changed / what matters now?
2. **Explain** — which dimensions are driving that story?
3. **Investigate** — which longitudinal patterns, sessions and contexts support it?
4. **Evidence** — expose measurements, derivations, confidence, run evidence and later optional run-scoped video/telemetry.
5. **Share** — distil verified evidence back into a simple shareable moment.

Preserving evidence does **not** mean showing every evidence item at overview depth.

## Non-negotiable truth rules

- No invented split times, distances, scores or measurements.
- Reaction time is measured and lower-is-better.
- Peak speed is derived from validated IMU evidence and must retain that provenance.
- Peak G is measured evidence.
- Session quality is a Performance Engine score on a 0–100 scale.
- Cross-session headline evidence must use the typed `CrossSessionReport`, including its own lookback window and confidence.
- Full-history progression and recent-form evidence may legitimately differ, but their window/context must be visible enough that they do not appear contradictory.
- Technique, smoothness, power and six-dimension engine scores render only where trustworthy evidence exists.
- Contextual findings remain correlation/pattern evidence, not causal claims.
- Optional run-scoped video remains evidence, never a requirement.

## Existing data contract to keep

The current analytics server load already provides the clean-sheet route with the required raw material:

- `sessions` — eligible gate-session summaries in chronological order;
- `sessionCount` and evidence `depth`;
- `allRuns` — eligible run-level reaction, peak G, validated peak speed, bias correction and wheel-lift evidence;
- `personalBests` — all-time reaction, peak speed and max G;
- `trend` — recent-vs-previous reaction and speed percentage change;
- `goalTargets` and active goal metrics;
- `correlationInsights`;
- `sessionAnalyses` — Performance Engine analysis, technique scores, diagnostics and insight packs;
- bike / rider snapshot context and coach links.

The existing page also constructs typed `SessionPerformanceSummary[]` and a truth-ruled `CrossSessionReport`. New presentation code should reuse or extract that derivation rather than recreating incompatible trend semantics.

## Clean-sheet page architecture

### Layer 0 — compact orientation rail

Goal: tell the rider what this page is and provide secondary actions without consuming the viewport.

Visual target:

- `Progress` title + one-line purpose;
- Share / report / date-window controls where real functionality exists;
- no giant editorial hero;
- no duplicate PB card wall.

### Layer 1 — performance snapshot

This is the mock-up's compact six-item rail. It should be information-rich but shallow.

Candidate truthful items:

| Visual slot | Real source | Truth / sparse rule | Deeper action |
| --- | --- | --- | --- |
| Reaction PB | `personalBests.reaction_ms` | measured; show `—` if absent | Reaction evidence |
| Recent reaction change | `trend.reaction` or typed recent reaction trend | lower-is-better; label window | Performance over time |
| Eligible sessions | `sessionCount` | always truthful | Sessions |
| Peak speed PB | `personalBests.peak_speed_ms` | validated IMU only; provenance visible | Speed evidence |
| Session quality / repeatability | latest supported engine evidence | do not fabricate when analysis absent | Ride Quality |
| PB / milestone signal | existing achievement/PB evidence only | no synthetic monthly PB count unless derived from real timestamps | Share / evidence |

The mock-up values such as “Avg Time” or arbitrary PB counts are **not** copied unless the repo has a clear matching contract.

### Layer 2 — primary Performance Over Time workspace

This is the visual anchor of the first viewport.

Default view: **Reaction progression**, because it is a direct measured launch metric and universally understandable.

Available tabs/views:

- Reaction: session best + average, lower-is-better, optional goal target;
- Peak speed: validated IMU peak speed, higher-is-better, provenance explicit;
- Consistency: reaction CV / repeatability evidence where supported.

The dominant chart should occupy substantially more visual weight than its controls. Improvement state belongs next to the chart as a compact summary, not as another equally-sized chart.

### Layer 3 — Improvement Breakdown

Purpose: explain *why* the primary story is being told and act as navigation into deeper evidence.

Truthful rows may include:

- Reaction direction / change;
- Peak speed direction / change;
- Repeatability / consistency trend;
- Peak G / force trend where a typed cross-session trend exists;
- technique / smoothness / power only when the Performance Engine has supported longitudinal evidence.

Each row is an interaction target. Selecting it changes the primary evidence view or opens its deeper investigation page; it is not decorative copy.

### Layer 4 — Start Performance

Purpose: provide a compact launch snapshot using the latest eligible evidence while preserving all-time reference.

Initial truthful dimensions:

- Reaction — latest session best vs all-time PB;
- Peak speed — latest validated IMU best vs all-time PB;
- Peak G — latest measured best vs all-time PB.

Future richer launch dimensions should come from established engine outputs, not invented “first pedal” or gate-drop metrics unless those become explicit product measurements.

### Layer 5 — Ride Quality

Purpose: translate repeatability and technique evidence into a small set of rider-readable qualities.

Candidate sources:

- session quality (0–100);
- repeatability score;
- technique overall;
- smoothness;
- power only when physics inputs are sufficient.

This layer should use compact trajectories / gauges and link to a dedicated breakdown. It should not reproduce four large charts.

### Layer 6 — Rider Development

This is where the six Performance Engine dimensions belong visually:

- Launch Quality;
- Explosiveness;
- Speed Carry;
- Smoothness;
- Impulse Timing;
- Repeatability.

For each dimension show current supported score, longitudinal direction, confidence/evidence state and a micro-trajectory. Selecting a dimension opens an overview-first deep dive (e.g. Launch Quality), with coach/nerd evidence available one layer deeper.

### Layer 7 — Patterns around the riding

Candidate real contexts:

- track surface;
- weather;
- session focus;
- ride feel;
- bike/setup snapshot;
- wheel-lift incidence.

Only surface findings after existing minimum-evidence rules are met. Explicitly state that relationships are correlations/patterns, not causes.

### Layer 8 — Worth Investigating

Use real recurring diagnostics, fatigue/drop-off evidence, data-quality anomalies, strengths/limiters evolution and meaningful momentum signals.

This layer is a prioritised queue of questions, not another dashboard. Each item links to the evidence that triggered it.

### Layer 9 — Deeper Evidence

Link cards to existing deep evidence categories rather than placing every chart on the overview:

- Technique score trends / breakdown;
- data quality history;
- fatigue & regression;
- force / power evidence;
- context correlations;
- run evidence;
- future optional synchronized video + telemetry.

### Layer 10 — Goals, Reports and Share

Goals and report generation remain important but visually secondary to the training story.

Share should work in the opposite direction to investigation: take a verified PB, improvement, streak or supported insight and distil it into a simple social object without leaking private/deep evidence by default.

## Sparse-state contract

### 0 sessions

Keep an inviting upload-first state. Do not render empty charts.

### 1–2 sessions

Show measured/PB snapshot and latest-session evidence. Explain that longitudinal direction requires at least 3 eligible sessions. Do not fake trend lines.

### 3–9 sessions

Enable cross-session views but expose developing/low/moderate confidence accurately.

### 10+ sessions

Allow the full layered experience, while still omitting dimensions for which the rider lacks trustworthy evidence.

## Visual rules from the approved mock-up

- Compact information density; avoid both card-wall clutter and giant empty editorial whitespace.
- Strong dark performance-workspace composition for the clean-sheet surface.
- Bright semantic accents reserved for meaning: improving, attention, selected evidence, PB/milestone.
- Charts are visual explanations, not default containers for every metric.
- Micro-trajectories, bars, badges and icons should make the page scannable before reading labels.
- Clear numbered/depth cues are welcome where they help orientation, but the user should not feel they are reading a lab report.
- Desktop first viewport should expose the performance snapshot and most/all of the primary Performance Over Time workspace.
- Mobile preserves Story → Explain → Investigate order and must have zero horizontal overflow.

## Development strategy

1. Keep `/analytics` untouched as fallback/reference.
2. Add protected `/progress-next` using the same analytics server-load contract.
3. Build a brand-new `progress-next/` component tree; do not import old analytics presentation components.
4. Slice A: orientation + performance snapshot + Performance Over Time + Improvement Breakdown.
5. Live compare `/analytics` vs `/progress-next` with identical seeded riders.
6. Only after Slice A visually matches the approved direction, add Start Performance / Ride Quality.
7. Then Rider Development, Patterns, Investigations and Deep Evidence.
8. When accepted, switch the canonical Progress navigation to the new experience; retain the old route briefly for rollback.

## Slice A acceptance criteria

Slice A is accepted only if:

- it is unmistakably the approved mock-up language at first glance;
- the old `/analytics` code and visual component tree remain untouched;
- all displayed values map to real existing evidence;
- measured vs derived provenance is preserved;
- sparse 0/1/2 session states remain honest;
- desktop and 390 px mobile are deliberately composed;
- `svelte-check` reports 0 errors / 0 warnings;
- TypeScript is clean;
- Vitest passes;
- production build passes.
