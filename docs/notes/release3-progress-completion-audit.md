# Release 3 — Progress completion audit

Status: completion audit against `release3-progress-clean-sheet` HEAD `4fb3bd2ec018555fd4285c13c538a881aa1c52e7` before any Sessions production redesign.

This audit follows the handoff rule that a database field or component name is not enough to make a rider-facing longitudinal claim authoritative. A Progress surface needs a canonical evidence owner, explicit eligibility, an evidence-depth rule earned from supported observations, and a clear rider job.

## Executive result

Progress is materially closer to complete than the legacy `/analytics` surface suggests. Reaction, validated Peak Speed, estimated Power, Drop-Off, wheelie/reaction context, and goals now have explicit clean-sheet evidence adapters. The main remaining completion work is not to add more cards. It is to close semantic seams around Peak G/force development, technique dimensions, generic consistency, setup/context, and the fact that several clean-sheet adapters inherit `sessionAnalyses` from a loader that only analyses the latest 30 sessions at the legacy `advanced` depth.

The old Analytics loader remains a data supplier, not Release 3 evidence authority. Its total-session-count `depth` and its local recent-vs-previous `trend` must not become Progress claims.

## Classification

### 1. Authoritative and adequately surfaced

| Metric / rider question | Canonical owner | Current Progress job | Audit verdict |
|---|---|---|---|
| Reaction time — PB, history, recent direction | `sessionSummaryBuilder.ts` + `reactionEvidence.ts` | Snapshot, primary chart, breakdown, Reaction deep route | **Complete enough.** Supported observations, not total history, determine evidence class. PB remains a measured fact independent of trend maturity. |
| Reaction repeatability — reaction CV / repeatability evidence | canonical session reaction aggregation + `reactionRepeatabilityEvidence.ts` | Reaction evidence/depth | **Complete for reaction-specific repeatability.** Keep it distinct from generic “technique consistency.” |
| Peak Speed — validated IMU history and direction | `sessionSummaryBuilder.ts` + `peakSpeedEvidence.ts` | Snapshot, primary chart, breakdown, Peak Speed deep route | **Complete enough.** Only `analytics_valid` speed enters canonical summaries. |
| Average / peak Power | Performance Engine physics + `powerEvidence.ts` | Power primary view and Power deep route | **Complete enough with an important label invariant:** power is estimated physics, not directly measured. The adapter requires the selected run to be analytics-valid. |
| Persistence / Drop-Off | Performance Engine persistence/drop-off + `dropOffEvidence.ts` | Dedicated Drop-Off surface | **Complete enough.** The adapter distinguishes “no fade detected” from “too few supported runs to evaluate,” so absence is not misreported as success. |
| Wheelie behaviour vs reaction | `front_wheel_lifted` + validated reaction runs + `wheeliePatternEvidence.ts` | Dedicated contextual pattern | **Complete enough as association.** Both groups require run volume and session diversity; copy explicitly avoids causation. |
| Active goals / current goal evidence | `training_goals` + `goalEvidenceProjection` + `goalEvidence.ts` | Goals module | **Complete enough.** Projected current evidence is preferred to stale persisted current values. |

### 2. Authoritative but insufficiently surfaced / presented

| Metric / rider question | Evidence that exists | Why it is not complete yet | Completion direction |
|---|---|---|---|
| Peak G / force magnitude | Canonical `best_max_g` / `avg_max_g` in `sessionSummaryBuilder.ts` | Progress currently gives Peak G an all-time PB card and sparkline, but no claim-specific evidence boundary, evidence-depth language, or quality/provenance explanation comparable with Reaction/Speed/Power. | Give Peak G a small evidence adapter before making directional claims. Preserve it as measured force evidence; do not turn it into another technique score. |
| Recurring strengths / limiters | Engine-generated `insightPack` labels + `strengthsLimitersEvidence.ts` | Recurrence is handled carefully, but the upstream `sessionAnalyses` history can be capped at 30 sessions and that horizon is not part of the rider-facing contract. | Surface the supported-analysis horizon/count and decide whether “recurring” is latest-N or whole eligible history. |
| Rider-development score history | Performance Engine `TechniqueScoreBreakdown` + `riderDevelopmentEvidence.ts` | The current adapter correctly limits itself to observed score history and makes no trend claim. That restraint is good, but “Rider Development” reads stronger than what is currently guaranteed. | Keep the observed-history presentation, or rename/reframe until cross-session comparability of each dimension is explicitly frozen. |
| Session quality history | Performance Engine `sessionQuality` | Snapshot shows “Latest quality” and a history sparkline, but there is no dedicated longitudinal contract explaining what changes in the composite mean. | Treat as a supporting diagnostic until a stable longitudinal semantic contract exists. |

### 3. Data exists, but its Progress semantic contract still needs validation

These are valid inputs or derived diagnostics; they are **not** yet permission to add longitudinal claims.

| Candidate | Existing source | Validation required before broader Progress surfacing |
|---|---|---|
| Acceleration / force-development timing | selected-run physics, phase analysis, acceleration splits, time-to-peak fields | Decide the canonical longitudinal grain: selected run, session best, session median, or another eligible aggregate. Freeze quality/calibration gates and polarity before comparing sessions. |
| Impulse timing | Performance Engine impulse physics; also contributes to `TechniqueScoreBreakdown.impulseTiming` | It is currently a selected-run derived value/score. Define mass requirements, calibration requirements, session aggregation, and whether raw seconds or benchmark score is the Progress quantity. |
| Smoothness / jerk | jerk physics and `smoothnessScore`; contributes to technique scoring | Keep raw jerk/diagnostic evidence in Deep Dive. Before Progress, validate sampling/calibration sensitivity and a stable cross-session aggregation. Do not resurrect the old generic `SmoothnessTrend` merely because it exists. |
| Technique dimensions: Launch Quality, Explosiveness, Speed Carry, Smoothness, Impulse Timing, Repeatability | `techniqueScoring.ts` | These are benchmark-derived scores from mixed measured/derived inputs, usually for the selected run. Cross-session comparability can be affected by rider-level benchmarks, data availability and selected-run semantics. Observed history is acceptable; improvement/decline claims need a frozen contract. |
| Generic repeatability / consistency | reaction CV, session consistency score, phase consistency, legacy consistency components | There are several meanings under one label. Keep reaction repeatability as the authoritative narrow metric. Do not collapse force stability, reaction CV and composite consistency into a single Progress trend without a product contract. |
| Setup changes | versioned bike/rider profile snapshots and setup-change analysis | Session-local before/after evidence exists, but Progress needs a stable setup-event model, enough sessions on both sides, and non-causal language. |
| Weather, surface, focus, ride feel | canonical session context fields + correlation/context analysis | Context is useful, but generic correlations must prove adequate sample support and association wording per field. Rider state is currently only `RideFeel`; there is no separate emotion/state schema to trend yet. |
| Fatigue beyond Drop-Off | Performance Engine fatigue/persistence modules | Drop-Off now has a clean contract. Any broader fatigue claim must explain whether it is intra-session persistence, set-length advice, or longitudinal recovery/fatigue; those are different jobs. |
| Diagnostics / investigation themes beyond exact recurring labels | `investigateEvidence`, diagnostics, insight packs | Validate identity/stability of generated labels and history horizon before claiming a theme is strengthening, resolving or worsening. |

### 4. Unsupported, misleading, redundant, or not worth surfacing in Release 3 Progress

- **Legacy total-session-count evidence depth.** `/analytics/+page.server.ts` assigns `minimal/basic/full/advanced` from total session count. Release 3 evidence depth must be earned by supported observations for the claim.
- **Legacy local `trend` from `/analytics`.** The clean-sheet Reaction and Peak Speed adapters own their own evidence semantics. Reusing the old recent-five versus previous slice would create a second authority.
- **Pseudo/synthetic power from old presentation code.** Release 3 now has mass-aware Performance Engine power. Any old power-like visualization that does not use that owner should remain out.
- **Generic “Technique Quality” or “Smoothness Trend” merely because legacy components exist.** A filename is not a semantic contract. The mixed technique score should not masquerade as a direct physical measurement.
- **A single generic “Consistency” trend.** Reaction repeatability, force stability, phase consistency and composite session consistency answer different questions.
- **Causal claims from context/wheelie/setup associations.** Existing contextual evidence may support association; it does not establish cause.
- **First-run-only or arbitrary-run quality aggregation.** Session and longitudinal claims must use an explicit supported-session grain.
- **Duplicate previous-session comparison inside Deep Dive as longitudinal Progress.** Deep Dive is technical evidence; longitudinal interpretation belongs in Progress or a deliberately scoped session comparison.

## Cross-cutting seams found in the re-audit

### The shared loader is not the authority boundary

`progress-next/+page.server.ts` currently delegates most loading to `analytics/+page.server.ts`. That is practical, but the latter still contains legacy `depth` and `trend` calculations. Clean-sheet adapters must remain the semantic boundary and should eventually receive a loader that exposes canonical facts without legacy presentation semantics.

### `sessionAnalyses` has a latest-30 ceiling at legacy advanced depth

Several Progress modules consume `sessionAnalyses`. The Analytics loader analyses at most the latest 30 sessions once the account reaches `advanced`. This means Power, Rider Development, Drop-Off, diagnostics and recurring strengths/limiters can become “latest analysed history” rather than whole-account history while Reaction and Peak Speed continue to use all canonical session summaries.

This is not automatically wrong, but it must be explicit. Before Progress is called complete, choose one of:

1. make each affected evidence adapter explicitly latest-N and surface that scope;
2. compute the needed longitudinal facts in a dedicated server projection across all eligible sessions; or
3. prove that 30 is the intentional product horizon and name it.

### Peak G eligibility is less explicit than speed eligibility

Canonical session summaries restrict speed to `analytics_valid` runs, but Reaction and G aggregates are built from stats-eligible gate runs regardless of the speed validity flag. That may be correct because `analytics_valid` is a derived-speed/calibration gate rather than a universal sensor-validity flag. The contract should be written down before Peak G receives directional claims.

## Progress completion gate

Progress can be considered functionally complete for Release 3 when:

- Reaction, Peak Speed, Power, Drop-Off, wheelie context and goals keep their current claim-specific authority;
- Peak G gets an explicit evidence/provenance contract before any trend language;
- every `sessionAnalyses`-based longitudinal module declares its history horizon;
- rider-development dimensions remain observed history until their cross-session comparability is frozen;
- generic setup/context, fatigue, smoothness/jerk and impulse/force-timing claims stay behind validation rather than being added as card-fill;
- legacy `/analytics` depth/trend and legacy synthetic trends are not imported into clean-sheet Progress semantics;
- Reports continue using the old report engine until Progress and Sessions contracts are deliberately reconciled.

## Next Progress implementation slice after review

The smallest high-value slice is contract work, not visual expansion:

1. document/encode the `sessionAnalyses` horizon for affected evidence adapters;
2. add a claim-specific Peak G evidence adapter and tests without yet adding a new deep route;
3. audit whether `ProgressRiderDevelopment` naming/copy sufficiently signals “observed score history, not proven development”;
4. leave smoothness, impulse timing, generic technique and setup/context expansion out until their longitudinal grains are frozen.
