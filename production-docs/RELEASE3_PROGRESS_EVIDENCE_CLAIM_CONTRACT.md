# Release 3 Progress — Evidence & Claim Contract

Status: proposed implementation contract

Companion architecture contract: [`docs/notes/progress-clean-sheet-blueprint.md`](../docs/notes/progress-clean-sheet-blueprint.md). The clean-sheet blueprint governs the visual/component architecture and layered Progress workspace; this document governs the evidence, inference, and rider-facing claim semantics used within that architecture.

## Governing philosophy

> **Measurements become knowledge only when they are understood in context.**

Progress exists to preserve evidence, reveal patterns, and help riders, parents, and coaches understand development over time. It supports human judgement; it does not replace it.

Supporting rule:

> **Progress preserves significance; it does not manufacture significance.**

Complexity earns space only when it adds understanding.

## Product boundary

Progress is longitudinal. Sessions are evidential.

The intended disclosure path is:

**Progress → Investigation → Evidence → Session**

- **Progress** answers: what is changing in the rider's development?
- **Investigation** explains one longitudinal development story.
- **Evidence** explains why a claim is being shown and which observations support it.
- **Session** remains the detailed single-session/run source of truth.

Progress must not duplicate single-session analysis.

## Primary investigations

Release 3 has four investigation domains:

1. **Reaction** — What is changing in reaction performance, and is quicker performance becoming repeatable?
2. **Peak Speed** — What is changing in speed and explosive output, without assuming Peak G causes speed?
3. **Consistency & Capacity** — Can performance be reproduced, and for how long?
4. **Rider Development** — How is the broader supported performance profile changing?

Contextual Patterns are an earned intelligence layer woven into relevant investigations, not a peer metric. A standalone overview can remain for discovery.

## Evidence classes

### 1. Measured

A directly stored or deterministically calculated fact: PB, latest value, average, session count, run count, CV, score.

Rules:
- No confidence badge.
- Missing data is `—`, omitted, or explicitly building; never fabricated as zero.
- A PB is a fact, not an inference.

### 2. Observed history

Multiple supported observations presented chronologically without claiming what their direction means.

Rules:
- History can appear as soon as multiple observations exist.
- A line between two points does not authorize a trend claim.
- Show supported observation count and useful date/window context.

### 3. Early signal

A directional inference whose minimum evidence threshold has been met but whose evidence remains limited.

Permitted language includes:
- early signal
- appears to be improving/declining
- may be developing
- worth watching

Avoid declarative certainty.

### 4. Supported finding

A trend or other inference whose evidence contract is satisfied.

Rules:
- State or expose the evidence window.
- Use the metric's true direction semantics: lower-is-better and higher-is-better must never be inferred from generic number movement.
- Stable is a valid supported finding.

### 5. Contextual finding

A supported association between recorded context and performance.

Rules:
- Association is not causation.
- Prefer `occurred alongside`, `has tended to`, or `a pattern has emerged` according to evidence strength.
- Never say a condition caused a performance change unless a future causal evidence model genuinely supports that statement.
- Expose qualifying sample size and confidence/evidence strength.
- `No meaningful pattern detected` is a valid result.

### 6. Synthesis — “What the evidence suggests”

A human-readable combination of multiple supported signals.

Rules:
- Synthesis cannot be more certain than its weakest essential supporting claim.
- Conflicting signals should become a trade-off narrative rather than being averaged away.
- The system presents an observation for discussion, not an authoritative coaching verdict.

Example:

> Peak speed is improving while repeatability has declined. Your recent performance gain is not yet appearing as consistently across runs.

This is preferable to prescribing a training intervention.

## Progress maturity, evidence coverage, and claim confidence are different

### Progress maturity

A product-level description of how much overall longitudinal history exists:

- **Building:** 1–2 sessions
- **Emerging:** 3–4 sessions
- **Developing:** 5–9 sessions
- **Established:** 10+ sessions

This label does **not** confer confidence on individual claims.

### Evidence coverage

How many supported observations exist for the metric or relationship being discussed.

A rider may have 18 total sessions but only 6 sessions with supported speed data. The UI must use the relevant supported count for the claim.

### Claim confidence

The strength of evidence for a specific inference, according to that inference's calculation and evidence window.

A valid presentation can therefore be:

> Established history · 18 sessions
>
> Speed improvement · moderate confidence · 6 supported sessions

Measured facts do not need claim confidence.

## Session length, evidence coverage, and demonstrated persistence are different

Within a single session, especially for Consistency & Capacity evidence, three quantities must remain distinct:

- **Physical session length** — the number of physical runs recorded in the session before analytical filtering.
- **Evidence coverage** — the count and identity of runs that supplied usable observations to the specific calculation. Coverage may be complete, incomplete but contiguous, or incomplete and non-contiguous.
- **Demonstrated persistence** — what the supported observations actually establish about performance remaining within the calculation's defined threshold over an identified run sequence.

These quantities may happen to have the same numeric value. Numeric equality does not make them semantically interchangeable.

Required pairwise rules:

> **Evidence coverage must never be presented as demonstrated persistence.**
>
> **Demonstrated persistence must never be presented as physical session length.**
>
> **Evidence coverage must never be presented as physical session length.**

A metric that makes a `Run N` claim must preserve physical run identity through analytical filtering. A filtered-array position must never be reconstructed or presented as a physical run number.

For persistence/drop-off claims, preserve enough provenance to distinguish physical session length from the supported run-number sequence. A count alone is insufficient when missing evidence creates a gap.

Canonical counterexample:

- 6 physical runs were recorded.
- Only physical runs `[1, 3, 4, 5, 6]` supplied usable evidence to the calculation.
- No defined drop-off threshold was crossed in those 5 supported observations.

This evidence supports the measured facts `6 physical runs`, `5 supported observations`, and the identified supported sequence `[1, 3, 4, 5, 6]`. It does **not** by itself authorize an unqualified `5`, `6`, `optimal 5`, `capacity 6`, or equivalent statement of demonstrated persistence/session length.

When coverage is incomplete, the missing evidence must remain visible in the semantics: omit the stronger persistence claim, mark it as limited/building, or qualify it with the actual supported run identities/coverage as appropriate. Do not fill the gap by treating an unevaluated physical run as demonstrated performance.

`optimal set length` and physiological `capacity` are not justified names for the current deterministic drop-off rule. Until a separately specified evidence model supports those concepts, rider-facing Progress language should describe the measured threshold behavior or performance persistence without implying physiological capacity or prescribing a set length.

## Minimum claim eligibility

Default product grammar:

- **1 supported observation:** measured fact
- **2 supported observations:** observed history; no trend claim
- **3–4 supported observations:** early-signal territory where the underlying engine supports inference
- **5+ supported observations:** may support a finding if the actual calculation supports it
- **10+ total sessions:** Established Progress maturity only; does not automatically make a claim high confidence

Each analytical subsystem may impose stricter thresholds. Contextual findings must satisfy their own qualifying-group/sample requirements.

## Recent-window confidence

The current cross-session engine uses a default five-session lookback and derives report confidence from the lookback length. With the default options, this confidence cannot represent total-history maturity and cannot reach `high` merely because total session history reaches 10+.

Until intentionally changed, rider-facing use should treat this as **recent-window/recent-trend confidence**, separate from Progress maturity and contextual-pattern confidence.

Do not enlarge the analytical window merely to make a `high` badge achievable.

## Stable, absent, and no-pattern states

Progress is an understanding system, not a celebration engine.

First-class outcomes include:
- performance remained broadly stable
- no meaningful contextual relationship has emerged
- insufficient supported evidence exists
- recorded context does not currently explain an observed difference

The UI must not manufacture a positive, negative, or dramatic insight to fill space.

## Trade-offs and contradictions

Conflicting supported signals are often more meaningful than a single aggregate verdict.

Examples:
- Reaction PB improves while average reaction changes little and variability worsens.
- Peak speed improves while repeatability declines.
- Peak speed improves while drop-off occurs earlier or optimal set length declines.

Rules:
- Do not average conflicts into an opaque overall score/verdict.
- Describe the supported trade-off.
- Introduce context only when recorded evidence qualifies.
- Do not invent an explanation for the conflict.

## Grounded questions only

“Worth exploring” questions must themselves be evidence-backed.

Allowed:

> Reaction has tended to be slower across recorded cold-weather sessions. Does the same difference persist as more cold-weather sessions are recorded?

Not allowed:

> Does hydration affect reaction?

unless hydration is actually recorded and relevant evidence triggered the question.

Rule: **The system may only ask an analytical question traceable to observed evidence or recorded context.**

## Claim provenance

Every inferred rider-facing claim should be capable of answering:

- **What?** What is the claim?
- **Based on what?** Which metric/evidence supports it?
- **Over what period?** What date/window was used?
- **Compared with what?** What is the comparison basis?
- **How strong?** What evidence/confidence state applies?
- **Which sessions?** Which session IDs contributed?
- **What calculation?** Which analytical rule produced it?

Not every field must be displayed by default. The product should progressively disclose provenance through `Why?` / evidence views and ultimately link to contributing Sessions.

## Presentation sequence inside an investigation

Use this intellectual sequence rather than a rigid identical component template:

1. **What we measured**
2. **What changed over time**
3. **How consistent that change appears**
4. **What recorded context accompanies it**
5. **What the evidence suggests**
6. **What may be worth exploring**
7. **Show me the evidence**

Reaction and Consistency & Capacity can use full depth. Peak Speed can be somewhat lighter where direct contextual evidence is narrower. Rider Development should remain a broader profile investigation rather than six independent metric deep-dives.

## Performance Engine / presentation boundary

The presentation layer should not independently reinterpret raw direction flags in multiple components.

Longer-term, an evidence-backed claim contract may normalize fields such as:

- domain
- claim type
- statement
- evidence state
- confidence
- direction
- supported session count
- period/window
- source session IDs
- supporting signals
- contextual evidence

Do not introduce this abstraction merely for architectural neatness. The Reaction reference implementation should demonstrate whether it is necessary.

## Known semantic prerequisites before prominent synthesis

### Unknown trends must not count as decline

`determineOverallTrend()` currently risks treating a non-stable trend with `improving === false` as declining even when its direction is `unknown`.

Required semantic rule:

> **Unknown contributes neither improvement nor decline.**

Tests should cover mixtures of supported and unknown trends before `overallTrend` drives prominent rider-facing language.

### Confidence naming must remain explicit

Current report confidence is bounded by the default recent lookback. Do not present it as global Progress confidence.

If the engine contract remains unchanged, name/use it as recent-window or recent-trend confidence in Progress.

## Smoothness caution

Do not make strong longitudinal Smoothness interpretations until the known discrepancy between single-session technique smoothness scoring and diagnostic/Progress smoothness scoring is reconciled. Unsupported or questionable evidence should be omitted or explicitly withheld rather than rationalized in presentation.

## Release 3 implementation order

1. Freeze and review this Evidence & Claim Contract.
2. Resolve/test unknown-trend contribution to `overallTrend`.
3. Confirm/document the intended semantics of five-session report confidence.
4. Audit exact session-level formulas before detailed copy for repeatability, best-v-average gap, drop-off run, and optimal set length.
5. Implement **Reaction Progress** as the reference investigation.
6. Verify it against 2 / 4 / 7 / 12-session evidence states.
7. Use the reference implementation to decide whether a normalized evidence-backed claim layer is justified.
8. Extend the proven grammar to Peak Speed, Consistency & Capacity, and Rider Development.

## Review test

Before adding any Progress element, ask:

1. Does it help explain rider development over time?
2. Is every measurement real and supported?
3. Is any inference proportionate to its evidence?
4. Is relevant context preserved without implying causation?
5. Can the rider understand why the claim is being shown?
6. Can the claim ultimately be traced back to Sessions?
7. Does the complexity add understanding?

If not, it does not earn space on Progress simply because it can be calculated.
