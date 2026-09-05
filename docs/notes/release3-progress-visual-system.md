# Release 3 — Progress visual system

Status: **EXPLORATION / FIRST IMPLEMENTATION SLICE**

## Purpose

Release 3 starts by giving the existing JNSPRO evidence model a richer visual hierarchy rather than changing what the product believes.

The design grammar is:

1. **Story** — what should I know?
2. **Explain** — why is JNSPRO telling me this?
3. **Investigate** — which sessions, runs and patterns support it?
4. **Evidence** — show the underlying measurements, telemetry and optional run-scoped video.
5. **Share** — distil verified evidence back into a simple, meaningful moment.

Complexity is not removed. It appears only at the depth where it is useful.

## First proving ground: Progress

Progress is the first surface because its current data contract already contains the richest longitudinal evidence in the rider product:

- eligible session history and session count;
- all-time reaction, valid peak-speed and peak-G personal bests;
- recent-vs-previous reaction and speed direction;
- canonical raw reaction/speed progression and goal targets;
- repeatability, best-vs-average gap, set-length and drop-off evidence;
- genuine Performance Engine technique, smoothness and power evidence;
- the six insight dimensions: Launch Quality, Explosiveness, Speed Carry, Smoothness, Impulse Timing and Repeatability;
- contextual/correlation evidence and wheel-lift patterns;
- recurring diagnostics and strengths/limiters evolution;
- session-level data-quality evidence;
- progress-report generation/export and coach sharing.

The redesign must not invent measurements merely because they make an attractive chart. In particular, visual concepts such as arbitrary 10 m / 30 m / 60 m splits are not Progress data unless a future product change establishes them as measured evidence.

## Slice 1 — upper Progress experience

The first code slice is deliberately bounded to the upper Progress experience:

- retain the existing zero-session state;
- preserve all server/load logic, truth rules and evidence thresholds;
- make the orientation/current-state region visually stronger and less text/card-wall dependent;
- make the primary performance-over-time story dominant;
- retain PB provenance and the distinction between measured and derived evidence;
- keep report/export actions available but visually secondary;
- leave deeper repeatability, context, diagnostics, engine trends and reporting sections functionally intact beneath the redesigned upper region.

This slice should prove that JNSPRO can become substantially more visual without weakening its truth model.

## Visual direction

Use the recent mock-up direction as inspiration rather than a pixel specification:

- dark performance-workspace foundation;
- strong hierarchy and generous negative space around the primary story;
- restrained semantic accent colour rather than colour on every metric;
- compact micro-visualisation where it replaces explanatory prose cleanly;
- evidence/confidence cues close to the conclusion they qualify;
- stable visual regions whose detail can deepen through interaction instead of proliferating independent charts;
- mobile layout should preserve the story order rather than simply stack a desktop dashboard.

Do not introduce a site-wide component system in advance. Extract reusable visual primitives only after a pattern has proved useful in a real surface.

## Video direction

Video remains **optional run-scoped evidence**, not a requirement and not a general-purpose video-hosting feature.

The intended long-term evidence path is:

`Progress → performance dimension → session evidence → run evidence → optional synchronized video + telemetry`

A later advanced evidence surface may provide a scrubber that keeps short run video synchronized with telemetry and carefully selected overlays. That capability is intentionally not part of the first Progress slice.

## Verification discipline

Each implementation slice should be independently reviewable and should preserve the Release 2 verification standard:

- inspect the exact diff before proceeding;
- `svelte-check` with 0 errors / 0 warnings;
- `tsc --noEmit` clean;
- Vitest green;
- production build green;
- live desktop and 390 px mobile checks;
- sparse history (0 / 1 / 2 sessions);
- developing history (3–9 sessions);
- mature history (10+ sessions);
- missing technique/power evidence;
- invalid speed history;
- goal overlays present/absent.

Only after the upper Progress slice works across those states should the new visual language move into Rider Development, contextual evidence and investigation drill-downs.
