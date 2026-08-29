# Release 3 — Progress & Sessions Continuation Handoff

**Purpose:** This is the continuity document for resuming Release 3 work in a fresh ChatGPT conversation without losing the product philosophy, evidence discipline, design direction, verified implementation history, or intended next steps.

**Read this first in a new conversation.** Then read:

1. [`RELEASE3_PROGRESS_EVIDENCE_CLAIM_CONTRACT.md`](./RELEASE3_PROGRESS_EVIDENCE_CLAIM_CONTRACT.md)
2. [`../docs/notes/progress-clean-sheet-blueprint.md`](../docs/notes/progress-clean-sheet-blueprint.md)

This document records where the work has reached and why. The Evidence & Claim Contract remains authoritative for claim semantics; the clean-sheet blueprint remains authoritative for Progress architecture/design.

---

## 1. The product we are building

JANSPro is not intended to be another activity feed, leaderboard, or dashboard that treats performance as a pile of numbers.

The governing product sentence is:

> **Measurements become knowledge only when they are understood in context.**

The product should preserve the story behind a rider's development: performance data, evidence quality, conditions, equipment, confidence, training decisions, and the human interpretation around them. It should reveal what the evidence supports without pretending the software knows more than it does.

The system supports decision-making; it does not replace riders, parents, or coaches.

A second governing rule developed during this Release 3 audit is:

> **Progress should preserve significance, not manufacture significance.**

The preferred intellectual grammar is:

**Evidence → Pattern → Context → Question / Observation → Human judgement**

Avoid an AI-oracle voice. Avoid unsupported prescriptions. Avoid causal language when the evidence only shows association. Complexity only earns space when it adds understanding.

The ambition is a longitudinal rider-development experience that is materially richer than conventional sports tracking: not by adding more decoration, but by retaining evidence and context well enough to explain a development journey.

---

## 2. Progress and Sessions are different products inside the same system

This distinction is load-bearing.

### Progress

Progress is **longitudinal rider development**.

It answers questions such as:

- What is changing over time?
- Is a gain becoming repeatable?
- Is headline performance becoming usable performance?
- Which changes are stable, early, mixed, or unsupported?
- What recorded context accompanies those changes?
- What kind of rider is developing across sessions?

The disclosure path is:

**Progress → Investigation → Evidence → Session**

Progress should lead from a development story down to its supporting evidence and then to the source Sessions.

### Sessions

Sessions is the **single-session / run evidence workspace**.

It owns detailed run evidence, mechanics, raw and derived traces, run-specific diagnostics, and future richer session context such as conditions, emotions/ride feel, run separation, onboarding/context capture, and deep evidence inspection.

Do not turn Progress into Sessions. If an element primarily explains one run or one session rather than development over time, it belongs in Sessions or the evidence drill-down.

Sessions will receive its own later audit/redesign after the Progress direction is established. Known Sessions truth problems are recorded below so they are not forgotten, but they must not pull the current Progress work sideways without an explicit scope decision.

---

## 3. Current Release 3 branch and working method

Working branch:

`release3-progress-clean-sheet`

Draft PR:

`#11` → `master`

The old `/analytics` route remains intact as fallback/reference. The clean-sheet route is `/progress-next` and currently reuses the exact server data pipeline:

```ts
// src/routes/(protected)/progress-next/+page.server.ts
export { load } from '../analytics/+page.server';
```

No cutover has happened.

### Verification discipline

Every slice has been deliberately small and independently falsifiable. Before making another write, fetch the current branch head rather than assuming this document's SHA is still current.

For each slice, verify:

- exact full 40-character commit SHA
- exact diff scope / numstat
- CI identity and status
- `svelte-check`
- `tsc --noEmit`
- full Vitest suite
- client/server build
- live seeded behavior where UI semantics are involved
- DOM/computed style/screenshots where presentation claims matter

CI has a known pre-existing repo-wide Prettier/lint backlog. `verify` can be green while `lint` continues to report that existing backlog. Never describe the workflow as unqualifiedly clean without preserving that distinction.

There is also a known Windows-only adapter-vercel EPERM during local build verification. Record it when encountered; do not confuse it with a product regression.

Vite/Svelte dev-server cache staleness has occurred during live verification. If runtime output contradicts verified source, clear `.vite` / `.svelte-kit` and restart before concluding the code is wrong.

---

## 4. Progress clean-sheet architecture already present

The current `/progress-next` page already contains a substantial clean-sheet shell. It is not a blank prototype.

### Snapshot rail

`ProgressSnapshotRail.svelte`

Six real-data KPI tiles:

- Reaction PB
- Recent Reaction
- Eligible Sessions
- Peak Speed PB
- Latest Quality
- Peak G PB

No invented values.

### Primary chart

`ProgressPrimaryChart.svelte`

Selectable:

- Reaction
- Peak Speed
- Consistency

Reaction uses a reversed Y-axis because lower reaction time is better.

Reaction has now begun diverging from the generic infrastructure through the dedicated evidence model described later in this document.

### What is moving?

`ProgressBreakdown.svelte`

Reaction / Peak Speed / Consistency only. Real last-10 sparklines. Lower-is-better inversion is handled for Reaction/CV. Uses `aria-pressed` and exposes an evidence window.

### Start performance

`ProgressStartPerformance.svelte`

Reaction, Peak Speed, Peak G cards with real history.

### Ride Quality

`ProgressRideQuality.svelte`

Six Performance Engine technique dimensions; unsupported dimensions are omitted. Shows score/status/trajectory and last-10 supported history.

Shared dimension palette:

- launchQuality `#8de51e`
- explosiveness `#59d25e`
- impulseTiming `#ff9d2f`
- speedCarry `#34d9ed`
- smoothness `#c178ff`
- repeatability `#3dd5c5`

### Rider Development

`ProgressRiderDevelopment.svelte`

Six dimension trajectories, strongest/focus callouts, and a real radar comparing current values with the earliest supported baseline. Omitted if fewer than three dimensions are supported.

The conceptual question is:

> **What kind of rider am I becoming?**

It should remain a broader profile investigation, not six duplicated metric deep-dives.

### Patterns

`ProgressPatterns.svelte`

Uses real `CorrelationInsight[]`, up to six sorted by strength. Numeric correlations expose Pearson `r`, sample, and significance. Categorical findings intentionally use `correlation: 0` because the relationship is categorical rather than Pearson numeric correlation. Sample wording is cautious.

Patterns are **earned intelligence**, not a fourth peer metric.

### Investigate

`ProgressInvestigate.svelte`

Aggregates real `session.diagnostics` and links Evidence to the most recent session occurrence using `lastSeenSessionId`.

### Strengths / Limiters

`ProgressStrengthsLimiters.svelte`

Uses real `insightPack.strengths/limiters`, earlier/recent halves, and share deltas.

### Deep evidence / goals / reports

- `ProgressDeepEvidence.svelte`: real links conditioned on latest session.
- `ProgressGoals.svelte`: real goals, correct lower-is-better math where appropriate, truthful no-data states.
- `ProgressReports.svelte`: handoff to the existing `/analytics` report builder.

Header actions include Report & share, conditional Latest evidence exact-session link, and a quiet Reference view. Mobile behavior and accessibility have already received targeted work.

---

## 5. Evidence & Claim Contract — the semantic foundation

The authoritative contract is `production-docs/RELEASE3_PROGRESS_EVIDENCE_CLAIM_CONTRACT.md`.

Evidence classes:

1. **Measured** — direct/deterministic fact; no confidence badge.
2. **Observed history** — multiple observations without directional inference.
3. **Early signal** — limited directional inference with appropriately cautious language.
4. **Supported finding** — threshold satisfied; expose evidence window and correct direction semantics.
5. **Contextual finding** — association only; sample/confidence; never causation without a genuine causal model.
6. **Synthesis — “What the evidence suggests”** — combines supported signals but cannot be more certain than its weakest essential support.

Never rename synthesis to an authoritative “Coach Interpretation.” The preferred rider-facing heading is:

> **What the evidence suggests**

Optional “Worth exploring” questions must themselves be triggered by recorded evidence/context. Do not invent generic coaching questions simply to fill UI space.

### Three different concepts

Do not conflate:

- **Progress maturity** — amount of overall longitudinal history.
- **Evidence coverage** — supported observations for the particular metric/claim.
- **Claim confidence** — strength of a specific inference.

Maturity ladder:

- Building: 1–2 sessions
- Emerging: 3–4
- Developing: 5–9
- Established: 10+

Established history does not automatically create high-confidence claims.

### Minimum claim grammar

- 1 supported observation → measured fact
- 2 → observed history; **no trend claim**
- 3–4 → early-signal territory where the engine supports it
- 5+ → may support a finding if the actual calculation supports it
- 10+ total → Established maturity only

Stable, absent, insufficient-evidence, and no-pattern states are first-class outcomes. The UI must not manufacture drama to fill space.

---

## 6. Cross-session trend semantics already audited

Canonical cross-session defaults:

```ts
minSessions: 3,
lookbackSessions: 5
```

`calculateTrend()`:

- filters nulls
- fewer than two valid values → unknown
- recent count = `min(3, floor(validValues.length / 2))`
- recent average compared with preceding historical average
- stable within ±3%
- otherwise up/down
- `improving` respects higher-is-better vs lower-is-better

Reaction is lower-is-better.

### Unknown trend bug already fixed

Unknown trends previously counted as decline inside `determineOverallTrend()` because `improving === false` was enough to enter the declining count.

Fixed by excluding `direction === 'unknown'`.

Permanent regression test exists.

### Confidence semantics

`getConfidence(sessionCount)` currently maps:

- <5 low
- <10 moderate
- >=10 high

But the report normally passes the recent lookback length, and default lookback is capped at five. Therefore default report-level confidence is a **recent-window/recent-trend confidence**, not global Progress maturity, and cannot naturally reach high merely because the rider has 10+ total sessions.

Do not enlarge a lookback merely to manufacture a high badge.

`messaging.ts` still contains later-audit work, including prescriptive/causal copy such as recovery/training-volume claims unsupported by recorded recovery/load evidence. Keep that separate from current Reaction work unless deliberately scoped.

---

## 7. Performance persistence: a major truth audit already completed

This work began under the old “Consistency & Capacity / optimal set length” framing and uncovered a critical semantic distinction.

### Physical session length, evidence coverage, and demonstrated persistence are different

- **Physical session length** — physical runs recorded before analytical filtering.
- **Evidence coverage** — count and identity of runs supplying usable observations.
- **Demonstrated persistence** — what supported observations establish about performance staying within the calculation's threshold over an identified physical run sequence.

Frozen rules:

> **Evidence coverage must never be presented as demonstrated persistence.**
>
> **Demonstrated persistence must never be presented as physical session length.**
>
> **Evidence coverage must never be presented as physical session length.**

Any `Run N` claim must preserve the real physical run identity through filtering; never reconstruct physical run number from filtered-array position.

### Canonical gap example

Six physical runs, supported speed evidence from `[1,3,4,5,6]`, no threshold drop-off.

Supported facts:

- six physical runs
- five supported observations
- supported physical sequence `[1,3,4,5,6]`

Not authorized:

- unqualified persistence `5`
- unqualified persistence `6`
- `optimal 5`
- `capacity 6`
- equivalent physiological/session-length claim

### Provenance fix

`RunData` now carries optional `runNumber`.

`detectDropOff(values, runNumbers?)` returns the physical run number when provenance is supplied.

`sessionIntelligence.ts` builds paired speed observations before filtering and passes their run numbers to drop-off detection.

Tests cover both missing-speed and reaction-filter gaps and prove a physical Run 6 drop-off remains Run 6 after analytical filtering.

### New explicit persistence evidence model

`SessionIntelligenceReport` now includes `performancePersistence` with:

- `physicalRunCount`
- `supportedRunCount`
- `supportedRunNumbers`
- `coverage: complete | incomplete-contiguous | incomplete-non-contiguous`
- `dropOffRun`
- `demonstratedThroughRun`

`analyseSession.ts` passes `physicalRunCount: analysedRuns.length` separately from the reaction-filtered intelligence input.

Important taxonomy detail: `incomplete-contiguous` means the supported physical sequence is unbroken **starting at Run 1**. `[2,3,4,5,6]` is conservatively `incomplete-non-contiguous` for persistence semantics even though those numbers are internally consecutive.

### Legacy `setLength` is still live and unsafe as a Progress persistence concept

Do not assume this was globally repaired.

The old deterministic `setLength` field still exists. It can still conflate filtered evidence count with physical session length, particularly with a reaction-gap. It is also conceptually overnamed: the current >6% speed-drop rule does not justify physiological “capacity” or prescriptive “optimal set length.”

Known current consumers include:

- `SessionIntelligencePanel.svelte`
- generated session/rider-parent reports (`buildSessionReport.ts`, `buildRiderParentReport.ts`)
- `buildDetectorInput.ts` social achievement detection
- old `/analytics`
- session-detail routes

This wider legacy exposure is **real and rider/parent/coach-facing**, but it is a separate future compatibility/truth audit.

`/progress-next` must consume `performancePersistence`, never legacy `setLength`, when persistence is eventually wired into Progress.

Preferred concept/name:

> **Performance persistence**

Question:

> **Can I reproduce my performance, and for how long?**

Avoid physiological recovery/work-capacity claims unless a future model actually measures them.

---

## 8. Reaction is the reference investigation currently being built

Reaction was deliberately chosen as the first full investigation because it forces the evidence grammar to work across sparse and mature states.

Conceptual sequence:

**Reaction now → History → Repeatability → Relationships → What the evidence suggests → Evidence**

Run/gate mechanics and raw traces remain Sessions territory.

### Reaction aggregation facts

Reaction uses all gate runs with non-null `reaction_time_ms`, not only `analytics_valid` speed runs.

- best = minimum reaction
- average = mean
- CV requires more than one reaction and average > 0; population variance / average × 100

### Reaction evidence model

File:

`src/lib/components/progress-next/reactionEvidence.ts`

This is the rider-facing evidence boundary. It intentionally reuses the real cross-session `calculateTrend()` with:

```ts
{ higherIsBetter: false }
```

It does not reimplement direction semantics.

The model separates:

- total session count
- supported average-reaction session count
- measured PB
- latest average
- latest CV
- supported history
- evidence state
- finding
- rider-facing presentation

Evidence maturity is based on sessions with valid **average reaction**, because that is the evidence consumed by directional inference. Total session count does not inflate Reaction inference maturity.

PB measurement is deliberately independent: `bestReactionMs` is derived from all sessions with a finite best reaction, even when that session cannot contribute an average-reaction observation.

A regression test proves a session with `best_reaction_ms: 150` and `avg_reaction_ms: null` retains the 150 ms PB while inference remains based on only the supported average-reaction sessions.

### Pressure-tested boundaries

Tests cover:

- 1 supported session → measured only
- exactly 2 supported → observed history, no finding
- 4 supported → early signal
- 7 supported → supported finding over latest five
- 12 supported → still latest-five inference window; total maturity does not widen/inflate authority
- 7 total but only 2 supported → observed history, not seven-session finding
- PB remains measurable independently of average-reaction coverage
- lower-is-better declining wording is exercised

### The two-session UI mismatch was found and fixed

The old generic primary chart had an inconsistency:

- `draw()` was willing to render at two sessions
- the template withheld the canvas until three sessions

That contradicted the frozen contract's rule that two supported observations may show **history without a trend claim**.

Now, Reaction rendering uses:

`reactionEvidence.history.length >= 2`

while Speed and Consistency retain their existing three-session behavior.

A real seeded two-session account has been live-verified: Reaction shows a genuine two-point history chart; Speed on the identical account still shows its evidence-building state.

### Reaction evidence-class language is now model-owned

`reactionEvidence.ts` returns a presentation object. The Svelte chart displays it rather than deriving semantics inline.

Current ladder:

- 2 supported → **Observed history** / “2 supported sessions show reaction history. No trend claim yet.”
- 3–4 supported → **Early signal**, using cautious language such as “appears”
- 5+ supported → **Supported finding**, with the hedge removed while still naming the latest supported-session window

`ProgressPrimaryChart.svelte` consumes `presentation.label`, `presentation.statement`, and `supportedSessionCount`. It does not branch on `state` or `finding.direction` to generate rider-facing prose. `data-state` is styling only.

### Latest honesty issue and branch state

The most recent verified conversation finding was that the original `measured` presentation could falsely say measured reaction evidence “is available” when `buildReactionEvidence([])` or an all-null Reaction session actually contained no measurable Reaction fact.

The branch has moved since the previous chat checkpoint. **At the time this handoff was written, the branch head fetched from GitHub is:**

`778369f82c497758bcae2eda9adf003fdd5d833c`

Commit message:

`test: prove empty reaction evidence stays honest`

Its parent is:

`c4880ffe5b29dd5c25fa330a2eace7e7962fde71`

Therefore the empty-evidence honesty correction appears to have been implemented/tested after the last narrated checkpoint. **A new chat must inspect these two commits and their CI before claiming the issue closed.** Do not rely on this handoff alone for their exact implementation or verification status.

The previous fully user-verified Reaction evidence-language head was:

`c6d9a2effc0cae74f5e207b0b2b835d80ecaf968`

At that point CI run `33176108563` was independently verified green for `verify`, with the same pre-existing lint backlog, 0/0 svelte-check, 143/143 tests, and build passed.

---

## 9. What Reaction still needs before calling the investigation grammar complete

Do not mistake “chart now has an evidence label” for a complete investigation.

The intended Reaction investigation remains deeper than the generic dashboard row. It should ultimately demonstrate the full grammar:

1. **What we measured** — PB/latest average/current repeatability facts.
2. **Observed history** — chronological supported values even at exactly two observations.
3. **What changed** — only once the inference threshold is met.
4. **How consistent that change appears** — CV/repeatability evidence without conflating within-session consistency with cross-session confidence.
5. **Recorded relationships/context** — only qualifying context, never invented explanation.
6. **What the evidence suggests** — synthesis proportionate to its weakest essential support.
7. **Worth exploring** — only evidence-triggered questions.
8. **Show evidence** — trace back to contributing Sessions.

Pressure-test the UI against **2 / 4 / 7 / 12 supported-session states**, plus the already-important coverage edge cases:

- total history larger than supported Reaction history
- best/PB evidence without average evidence
- no Reaction evidence at all
- stable finding
- declining finding
- missing contextual qualification

Reaction should become the reference implementation from which we decide whether a normalized evidence-backed claim layer is actually justified. Do not create an abstraction just because it sounds architecturally neat.

---

## 10. Peak Speed direction after Reaction

Peak Speed asks:

> **Am I becoming faster in a way I can actually sustain?**

`progressionAnalysis.ts` uses `bestSpeedKmh`; higher is better.

Peak G can be supporting evidence but must not be described as causing speed.

Likely architecture:

**Speed now → History → Explosive output → Trade-offs → What the evidence suggests → Evidence**

Important trade-offs:

- speed ↑ while repeatability ↓
- speed ↑ while performance persistence worsens
- speed ↑ while repeatability also improves

Peak Speed should be medium/full depth, not forced into identical symmetry with Reaction.

---

## 11. Consistency / Performance Persistence direction after Reaction

The old “Consistency & Capacity” label is semantically suspect because current evidence does not justify physiological capacity.

Preferred investigation concept:

> **Performance persistence**

Likely architecture:

**Consistency now → Repeatability → Performance gap → Performance persistence → Trade-offs → What the evidence suggests → Evidence**

Useful underlying deterministic evidence already exists:

### Repeatability

Population SD-based scoring for reaction and speed, with explicit tolerances. Overall score combines whichever supported domains exist.

### Best vs average gap

Speed:

- best = max
- average = mean
- gap = best − average
- gapPercent = gap / best × 100
- lower is better

### Drop-off

Requires at least four supported speed observations. Detects the first post-initial point below 94% of best-so-far. Physical run provenance is now preserved.

### Persistence

Use the new `performancePersistence` evidence model rather than `optimalSetLength`.

A strong product distinction may emerge here between **headline performance** and **usable/reproducible performance**.

---

## 12. Rider Development direction

Rider Development is not a fourth copy of the metric investigation template.

Question:

> **What kind of rider am I becoming?**

It should combine supported longitudinal dimensions and show profile evolution, strongest/focus areas, and meaningful trade-offs without manufacturing a single authoritative “rider score.”

The existing radar/current-v-baseline component is a starting point, not the final intellectual model.

Known Smoothness contradiction means Smoothness must be treated cautiously until the scoring systems are reconciled.

---

## 13. Context and correlation rules

Context is central to the product philosophy, but this makes overclaiming especially dangerous.

Older `correlationAnalysis.ts` can evaluate relationships such as:

- temperature vs reaction
- surface vs consistency
- run count vs consistency
- time of day vs reaction
- temperature vs Peak G

Numeric Pearson relationships require paired evidence. Existing Progress currently asks `generateCorrelationInsights(..., 10)`.

`contextualPatterns.ts` has its own group thresholds and confidence ladder.

Preferred contextual language:

- **Occurred alongside**
- **Has tended to**
- **A pattern has emerged**

Never turn association into causation.

Older synthesized narratives contain causal/physiological overclaims. Audit them before surfacing them prominently in the new Progress investigations.

“No meaningful pattern detected” is a successful truthful outcome.

---

## 14. Known Sessions/deep-evidence issue: Smoothness contradiction

Do not try to rationalize this away in Progress.

The same run can currently produce:

- Session Smoothness around 97 with “Strong launch, smooth transition”
- Progress diagnostics / Ride Quality Smoothness 0/100 with “Force application is choppy”

Root cause already traced:

1. `technique.ts` / `scoreTechnique()` averages raw unsmoothed frame deltas over the whole trace, normalized by `peakG * 200`; long traces dilute launch transients.
2. `physics.ts` `computeJerk()` used by `coachDiagnostics.ts` / Progress through `techniqueScoring.ts` uses five-sample smoothing and stricter normalization, making the launch transient dominant.

This is a **Sessions/deep-evidence scoring reconciliation problem**, not something Progress should hide with copy.

Until resolved, avoid strong longitudinal Smoothness interpretation. Omit questionable evidence or mark it unavailable/building rather than explaining away contradictory engines.

This should be part of the later Sessions audit.

---

## 15. Known legacy Sessions/report truth debt to revisit later

When Progress reaches a stable reference architecture, Sessions should receive a deliberate evidence audit rather than cosmetic redesign first.

Known items already on record:

1. **Legacy `setLength` / “optimal set length”** — current deterministic rule can misrepresent filtered coverage as physical session length and overstates physiological meaning. Used in UI, reports, social detector, legacy analytics.
2. **Smoothness scoring contradiction** — two different algorithms can tell opposing stories about the same run.
3. **Prescriptive narrative language** — existing messaging includes unsupported recovery/training-volume/intensity claims.
4. **Run provenance** — physical run identity must remain preserved through every filter for any `Run N` statement.
5. **Context capture** — future Sessions should better preserve the conditions/story around a session so Progress can use genuine context later.
6. **Evidence hierarchy** — Sessions should become the inspectable source of truth that Progress can link into, not merely a collection of dashboard cards.

Do not begin this wider Sessions work until Progress's evidence grammar has proved itself, unless a Sessions defect directly blocks truthful Progress output.

---

## 16. Important historical fixes / checkpoints

Useful verified SHAs from this work:

- `46fb52df1b3cc9dc405addc5849bc6574cd808df` — initial Evidence & Claim Contract
- `9dab7f58c014820d5ac185ecab3f0ee6c90310ba` — exclude unknown trends from overall decline
- `2a7d47fa57771bc5507026df85ce658ae213a72b` — accessibility audit
- `e66b53d3a71f5dd2a6be503338a7277c0a402e1b` — Progress header
- `97f144f19ee9ccd1975ff7f4e35248c64f54a44b` — permanent unknown-trend regression
- `00453e274a7f7eca6f63c0fdbdfdb51123af7c45` — confidence semantics tests
- `4b8f3d73f42f074a748a693443eb8b4c7fff57b8` — physical drop-off provenance tests
- `32ffb34b78b59dbb975a2d3eac9f583f4d9da7c6` — contract separates physical length / coverage / persistence
- `002a426f896abb41c4e32c6b2f9c2c56a7fc3cce` — persistence evidence implementation + canonical tests
- `7bc15f12c013e15d6957f377ab36693e9d7162b2` — contract clarifies contiguous-from-Run-1 topology and legacy exposure
- `194c44420e78e77fd5bddc857c0f458be1a6459f` — initial Reaction evidence model boundary
- `90bc95775342b32d7d2eb1096babe9267a7eca72` — PB independence correction
- `33c24a145f7f38071a5a838b65c9f2d5f6d23b38` — Reaction two-session chart wiring
- `c6d9a2effc0cae74f5e207b0b2b835d80ecaf968` — rider-facing Reaction evidence-class language; last fully user-verified checkpoint before empty-evidence correction
- `778369f82c497758bcae2eda9adf003fdd5d833c` — branch head observed while writing this handoff; empty-Reaction-evidence test commit, verification still to be established in the new chat

There was one accidental overbroad intermediate edit during drop-off work (`a8a9210d14fd5be2603978c6ab2ee1779f45c960`), immediately restored by `8c085390876773c9cfed83ba681d298a1df9f442`. Do not mistake the intermediate diff for intended architecture.

---

## 17. Design language

The clean-sheet Progress experience should feel like a serious rider-development instrument, not a generic SaaS analytics dashboard.

Design principles:

- evidence-rich but calm
- hierarchy over card proliferation
- sparse states should feel intentional, not broken
- no fake disabled insight cards to imply intelligence that does not exist
- real history can be visible before inference is allowed
- measured facts should look different from interpreted findings
- confidence/evidence language should clarify, not decorate
- trade-offs deserve visual prominence when they explain development
- context should appear near the performance story it helps illuminate
- deeper evidence should progressively disclose rather than overwhelm the overview
- mobile must preserve intellectual hierarchy, not merely stack desktop cards
- accessibility is part of correctness: contrast, keyboard behavior, screen-reader trajectory descriptions, decorative SVG hiding

Primary investigations should not be artificially symmetrical. Reaction can be full-depth; Peak Speed medium/full; Performance Persistence full; Rider Development broad/profile-oriented.

The product should feel confident because its evidence is disciplined, not because its prose is loud.

---

## 18. The next actions in a fresh chat

Start with these steps, in this order:

1. Fetch `release3-progress-clean-sheet` and confirm the current full SHA. Do not assume `778369f82c497758bcae2eda9adf003fdd5d833c` is still current.
2. Inspect the commits after `c6d9a2effc0cae74f5e207b0b2b835d80ecaf968`, especially `c4880ffe5b29dd5c25fa330a2eace7e7962fde71` and `778369f82c497758bcae2eda9adf003fdd5d833c`.
3. Verify the empty-Reaction-evidence honesty fix: zero/all-null Reaction evidence must not claim that measured evidence “is available.” Fetch exact CI status/raw totals before declaring it closed.
4. Once that correction is independently closed, continue the Reaction reference investigation rather than jumping to Peak Speed.
5. Build the next Reaction slice around evidence completeness: measured-now/history/repeatability/context/synthesis/evidence disclosure, using the existing `buildReactionEvidence()` output rather than re-deriving semantics in Svelte.
6. Pressure-test 2 / 4 / 7 / 12 supported sessions plus zero evidence, coverage gaps, stable, declining, and context-absent states.
7. Only when Reaction proves the grammar, decide whether to normalize a reusable evidence-backed claim layer.
8. Extend the proven grammar to Peak Speed and then Performance Persistence.
9. Keep Rider Development broader rather than cloning the metric investigation.
10. After Progress is coherent and truthful, begin the separate Sessions/deep-evidence audit using the known debt recorded above.

### Immediate acceptance test inherited from this conversation

The last user-discovered issue was:

- `buildReactionEvidence([])` previously returned a rider-facing measured-state sentence claiming reaction evidence “is available” while `bestReactionMs` was `null`.
- An all-null session did the same.

The expected correction is a genuine no-evidence statement when no measured Reaction fact exists, while retaining the “measured evidence exists but average history is building” distinction when a best/PB fact exists without sufficient average-reaction history.

Do not call Reaction grammar complete until this distinction is verified.

---

## 19. Final decision test

Before adding any Progress element, ask:

1. Does it help explain rider development over time?
2. Is every measurement real and supported?
3. Is every inference proportionate to its evidence?
4. Is relevant context preserved without implying causation?
5. Can the rider understand why the claim is being shown?
6. Can the claim ultimately be traced back to Sessions?
7. Does the complexity add understanding?

If the answer is no, it does not earn space simply because it can be calculated.

And when work later moves into Sessions, invert the perspective: preserve the source evidence faithfully enough that Progress can tell the longitudinal story without guessing what happened.
