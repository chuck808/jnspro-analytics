# Progress depth grammar

Status: **IMPLEMENTATION-EXTRACTED CONTRACT**

This note captures the reusable depth grammar proven by the Reaction deep dive. It is not a second confidence model and it does not copy Reaction-specific thresholds into other metrics.

## Core principle

Progress depth is earned by evidence, not by page position or total session count.

The presentation may describe an overall maturity stage, but every deeper layer keeps its own evidence boundary. An established page can still contain building, observed-history or unavailable sublayers when those claims have less support.

## Overall maturity and individual claim confidence

These are related but separate concepts.

- **Overall maturity** answers: how much of this metric's deep-dive experience is currently available?
- **Individual claim confidence** answers: what may this specific statement say, and with what provenance?

Overall maturity must never upgrade an individual claim. Each layer is unlocked from the evidence model that owns it.

## Presentation stages

Use the same conceptual progression where it fits the metric:

1. **Building** — measured evidence exists; direction or interpretation may not.
2. **Emerging** — an early directional signal can be described cautiously.
3. **Developing** — the primary longitudinal direction is supported.
4. **Established** — the primary longitudinal story is supported and deeper analysis has run, while individual findings still retain their own confidence.

These labels are presentation grammar only. The underlying evidence model for each metric determines how and when a stage is reached.

## Layer grammar

A metric deep dive should be assembled from independently earned layers rather than one monolithic maturity switch.

### 1. Measurement

Show direct or validated measurements first. Sparse states should still be useful without pretending longitudinal evidence exists.

### 2. History

Show chronological measured history only when the owning evidence model says there is enough support for history. A history view is not itself a trend claim.

### 3. Direction

Show a directional claim only when the owning model exposes a finding. Do not recompute trend logic in the route or rendering component.

Where useful, expose the concrete values behind the comparison from the same frozen finding that owns the direction statement.

### 4. Secondary evidence dimensions

Repeatability, context, technique, quality or other dimensions keep independent evidence histories and direction boundaries. Page-level maturity does not promote them.

### 5. Context

Contextual evidence must expose only structured, admitted findings. Correlation or group-difference evidence is association evidence, never causal explanation.

Do not fabricate session-level provenance for a contextual finding unless the upstream evidence contract genuinely provides it.

### 6. Synthesis

Synthesis is earned only when its essential supporting claims are themselves available. Aggregate confidence is capped by the weakest essential claim. Clause-level confidence should remain visible where supporting claims mature at different rates.

### 7. Session-level proof

When a claim can be traced to supporting sessions, expose the exact source-session membership already supplied by the evidence boundary. A presentation adapter may join measurements to those IDs, but must not recalculate eligibility, trend, confidence or evidence windows.

### 8. Provenance

Provide a compact explanation of why the page can say what it says: support counts, evidence states, windows and traceability where available. Provenance should clarify authority, not introduce another interpretation layer.

## Rendering rules

Rendering components should be thin consumers of typed evidence models.

- No route-local statistical thresholds.
- No second trend or confidence calculation.
- No inference from total session count when a supported-session contract exists.
- No null-to-zero coercion for missing evidence.
- No numeric statistic should be shown when the upstream contract uses that field only as a placeholder for a different test type.
- Missing evidence should read as unavailable/building, not bad performance.
- Use progressive disclosure for dense proof so mature histories do not dominate the page.

## Evidence authority pattern

For each rider-facing claim, identify one authority:

1. the evidence model owns eligibility and semantics;
2. a presentation adapter may reshape or join already-owned provenance;
3. the component renders that contract;
4. the route gates the layer from an existing unlock or evidence state.

If a new component needs information the model does not expose, thread through the missing provenance explicitly rather than re-deriving it in Svelte.

## Acceptance personas

Representative sparse/deep personas are useful for live verification, but they are acceptance fixtures rather than universal thresholds. The evidence model remains authoritative.

For every metric deep dive, verify at least:

- a sparse measured state;
- an early directional state;
- a supported longitudinal state;
- a mature state where deeper analysis has run;
- at least one counterexample where a secondary evidence layer is materially less mature than the overall page.

That final counterexample is the strongest guard against accidental promotion by page maturity.

## Reaction implementation proof

Reaction established this grammar with independently gated measurement/history, direction, repeatability history and direction, context, synthesis, concrete comparison proof, session-level traceability and compact provenance. The 12-Reaction / 2-CV live persona proved that overall Established depth can coexist with only observed repeatability history and no repeatability direction.

Future metric implementations should reuse this architecture where their own evidence contracts support it, but must not inherit Reaction thresholds, windows or claim wording by analogy.
