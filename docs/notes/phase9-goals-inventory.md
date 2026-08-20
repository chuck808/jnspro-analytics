# Phase 9 — Goals inventory

Phase 9 starts from the Release 1 evidence model rather than from the current Goals presentation.

## Intended job of Goals

Goals should answer a small set of rider questions without obscuring the evidence model:

1. What am I trying to achieve?
2. What is my **best verified progress so far** since this goal began?
3. What evidence moved the goal forward?
4. How far is the target from that verified evidence?
5. What is prediction/adaptation suggesting, and how uncertain is that suggestion?
6. What has been completed historically?

Recorded/evidence-derived progress and predictive/adaptive guidance must be visually and semantically distinct.

## Release 1 invariants that Phase 9 must preserve

- `current_value` semantics are **best verified progress since goal creation**, not current form.
- Read-time projection is canonical and reversible when source evidence is reclassified.
- Completed goals freeze at `completed_at`.
- Later evidence cannot rewrite completed goal history.
- Warm-up/testing/competition/excluded evidence must not move a goal.
- Milestones are evidence-derived and may disappear if their source evidence becomes ineligible.
- Distance-specific elapsed-time goals compare like-for-like distance evidence.

## Current route/data model

### Good / keep

- `+page.server.ts` already rebuilds goal truth through `buildGoalEvidenceProjections()` and only falls back to persisted values if projection is unavailable.
- Projection covers all goal metrics through shared `computeSessionGoalMetrics()` rather than page-specific calculations.
- Projection self-resolves `completed_at` defensively and applies the completed-goal cutoff.
- Active and completed goals are visually separable.
- Prediction and adaptation are already represented as separate fields from the evidence-derived `computed_current`.
- Goal creation uses recent eligible evidence as a convenience default for the starting value rather than requiring manual re-entry.

### Correctness seam — intelligence is computed but the active UI reads the wrong collection

The loader returns both:

- `goals`: `enrichedGoals` — evidence-derived current value + milestones;
- `goalsWithIntelligence`: the same goals plus `prediction`, `progressStatus`, `percentComplete`, and `adaptiveAnalysis`.

However `+page.svelte` currently derives both `activeGoals` and `completedGoals` from `data.goals`, then later reads `goal.prediction`, `goal.progressStatus`, `goal.percentComplete`, and `goal.adaptiveAnalysis` from those objects.

That means the prediction/status/adaptation UI is normally reading fields that were never attached to the collection it renders. The intelligence layer is calculated server-side but effectively disconnected from the goal cards.

**Classification: correctness blocker. Fix before visual redesign.**

Preferred shape: establish one canonical goal-view model returned to the page instead of maintaining parallel `goals` and `goalsWithIntelligence` collections that can drift.

### Terminology seam — `Current` is misleading

The active goal card labels the evidence-derived value as **Current**. That conflicts with the intentional Release 1 ratchet semantics.

The value means the rider's **best eligible evidence since the goal started**, not their latest-session form.

**Recommendation:** use **Best so far** (or equivalent) on rider-facing cards. Keep current form/trend in Progress rather than overloading Goals.

### Prediction/adaptation copy overclaims certainty

The page's feature explainer says prediction can tell the rider **"exactly when"** a goal will be reached, despite also displaying confidence intervals and model metadata.

That is stronger than the evidence supports and works against the product's recorded-vs-derived honesty principle.

Prediction should be framed as an estimate based on available progress evidence, with uncertainty visible. It must not be presented as recorded fact.

**Classification: trust/copy blocker.**

### Health/injury language is too diagnostic and too certain

Goals currently contains strong health claims including:

- "Injury Risk Detection"
- "Injury Prevention"
- detecting risk "before injury happens"
- "REST RECOMMENDED" / "Rest Required"
- named fatigue severity bands
- language claiming rest will prevent injury

The underlying model is derived from training/performance patterns, not a medical assessment. Phase 8 deliberately used language such as **prompts to investigate, not diagnoses**; Goals should not contradict that safer and more accurate framing.

This does not mean fatigue/training-load evidence has to disappear. It should be reframed around **training-load / recovery signals / repeated performance patterns** and uncertainty, with appropriate escalation language rather than medical diagnosis.

**Classification: trust/safety presentation blocker.**

### Health model input needs a later truth review

`performHealthCheck()` is gated to 10 sessions, which is sensible, but the loader currently constructs `performanceData.dataPoints` by flattening up to 50 runs and assigning each run to a session using `sessions[Math.floor(index / 10)]`. That mapping assumes ten runs per session and can associate a run with the wrong session/timestamp when actual run counts differ.

`sessionHistory.consistency` is also hard-coded to `0` with a "Simplified for now" comment.

This makes the health/adaptation model less trustworthy than the polished UI suggests.

**Classification: correctness/trust blocker before surfacing strong recovery guidance.**

### Goal progress vs milestone presentation

The card currently puts Start / Current / Target / Status / percent, prediction, milestones and adjustment controls into one dense block. These are different truth classes:

1. **evidence:** start, best verified evidence, target, evidence milestones;
2. **interpretation:** percent-to-target / ahead-behind status;
3. **prediction:** sessions remaining / confidence range;
4. **action:** adapt target/deadline, complete, delete.

Phase 9 should visually separate those layers rather than make them look equally factual.

### Completed goals

Completed goals currently show only metric, target and completion date. They do not show the frozen best evidence / achieved value or evidence path that justified completion.

Phase 9 should make completed goals a useful historical record while respecting the `completed_at` cutoff. Do not recompute them using post-completion evidence.

### Manual completion semantics

The page exposes **Mark complete** regardless of whether target evidence has actually reached the target. This may be intentional (the rider owns the goal and may close it for non-performance reasons), but the UI currently does not distinguish:

- **target achieved by evidence**;
- **rider manually closed the goal**.

The schema has only `completed_at`, so those states are not distinguishable historically today.

**Decision needed during Phase 9:** either treat completion as user-owned closure and label it accordingly, or add explicit completion reason/status if the product wants "achieved" to mean evidence-proven attainment.

Do not silently infer "achieved" from `completed_at` alone.

### Goal metric semantics

- Reaction: measured, lower is better.
- Max G: measured, higher is better.
- Peak speed: derived IMU, higher is better, only valid analytics evidence.
- Consistency: derived reaction CV score, higher is better.
- Elapsed time: measured/run-derived time, lower is better; can be distance-specific.
- Acceleration phase: derived time-to-peak-speed, lower is better, valid analytics only.
- Endurance: currently run count, explicitly a **proxy** rather than a physiological endurance measure.

The UI currently labels this last metric "Gates per Session", which is better than calling the displayed value endurance, but server/service naming still says `endurance`. Preserve the rider-facing concrete label and avoid implying physiological endurance has been measured.

### Dead/legacy surface

`src/routes/(protected)/goals/page_enhanced.svelte` is not the active SvelteKit route and code search found no live import/consumer. Treat it as legacy/dead candidate, not a second design source. Delete only after the live route is settled and a final reference check is clean.

## Proposed Phase 9 hierarchy

1. **Goals orientation** — what active targets exist; create goal action.
2. **Active goal card — evidence first**
   - metric + target;
   - **Best so far**;
   - progress toward target;
   - evidence/milestone history where useful.
3. **Progress interpretation** — on-track/ahead/behind only when the model has enough evidence, with plain-language caveat.
4. **Prediction** — optional secondary layer with confidence/range; clearly estimated, never "exact".
5. **Adaptation suggestions** — optional actions, visually separated from evidence and never silently applied.
6. **Training/recovery signals** — if retained here at all, use non-diagnostic wording and trustworthy session mapping; otherwise link to Progress where cross-session fatigue/regression already has a clearer home.
7. **Completed history** — frozen historical record with completion date and best evidence at closure.

## First implementation slice

Do correctness before styling:

1. collapse `goals` / `goalsWithIntelligence` into one canonical page collection so prediction/status/adaptation actually reach the rendered cards;
2. fix health-check run-to-session attribution and stop feeding hard-coded consistency if the model relies on it;
3. rename rider-facing `Current` to **Best so far**;
4. remove/replace "exactly when", injury-detection/prevention and diagnostic rest language;
5. then restructure goal cards around evidence -> interpretation -> prediction -> action.

## Verification matrix

After the correctness slice:

- no goals;
- active goal with no post-creation evidence;
- active goal with genuine improvement;
- active goal whose best evidence is later excluded and therefore reverses;
- target reached by evidence;
- manually completed before target;
- completed goal with later better evidence (must stay frozen);
- reaction / peak speed / consistency / elapsed distance-specific / acceleration / Gates-per-Session metrics;
- prediction absent / present / low-confidence range;
- adaptation suggestion present / absent;
- <10 sessions vs 10+ training-health inputs;
- mobile 390px;
- create/edit-adjust/complete/delete actions.

## Phase boundary

Goals owns **commitment and evidence-backed progress toward a chosen target**.

Progress owns **current form, longitudinal direction, repeatability, fatigue/regression investigation and contextual trends**.

Do not duplicate a full longitudinal health dashboard inside Goals merely because the service is available there.