# Phase 8 — Progress / longitudinal analytics inventory

## Purpose

Phase 8 should turn `/analytics` into a coherent longitudinal workspace rather than a collection of independently-added charts.

The rider questions are:

1. **Where am I now?**
2. **Am I improving?**
3. **How repeatable am I?**
4. **What context appears to matter?**
5. **Is fatigue / regression worth investigating?**
6. **Where should I drill down next?**

This is an inventory/classification pass. It does not assume every existing chart deserves to survive, but useful analytical capability should not be deleted merely to make the page shorter.

## Current page shape

`/analytics/+page.svelte` currently mixes several generations of the product in one route:

- a three-tab UI (`overview`, `trends`, `insights`);
- session-count unlock thresholds;
- headline overview / threshold ratings;
- cross-session intelligence and recommendations;
- performance-pattern charts;
- raw metric trends;
- goal CTAs;
- technique, smoothness, power, data-quality and wheelie trend components;
- newer Performance Engine technique trends / diagnostics / strengths-limiters evolution;
- correlation insights;
- progress-report generation and preview/export.

The result is analytically rich but the page does not currently establish which model is authoritative when old and new components overlap.

## Important truth-model findings before redesign

These must be resolved before styling around them.

### 1. `PowerOutputTrend` is currently fed a value that is not power

The legacy `powerData` block calculates:

`max_g × 9.81 × totalMassKg`

and labels the result `peakPowerW` / `avgPowerW`.

Dimensionally this is force (newtons), not power (watts). The page already has access to real Performance Engine physics power through `sessionAnalyses` / `progressChartPoints`, where `physics.power.averageW` is used.

**Classification: correctness blocker.** Do not preserve the legacy pseudo-power series. Replace it with real physics-derived power where available, or omit the chart when the required evidence is unavailable.

### 2. Legacy “Technique Quality” trend is a repeatability proxy

`techniqueData` explicitly sets `overall` from `intelligence.repeatability.overall`, while reaction/explosiveness/smoothness/efficiency are null, then feeds that into `TechniqueQualityTrend`.

The same page later renders genuine technique scores from `sessionAnalyses` via `TechniqueScoreTrends`.

**Classification: duplicate + misleading label.** Prefer the genuine Performance Engine technique series. Do not present repeatability as technique quality.

### 3. Legacy “Smoothness” trend is also a repeatability proxy

`smoothnessData` sets `smoothnessScore` from the same repeatability score and leaves `meanJerk` null, then feeds `SmoothnessTrend`.

The Performance Engine already derives actual technique smoothness / jerk-related evidence elsewhere.

**Classification: misleading proxy / duplicate.** Remove or replace with genuine smoothness evidence.

### 4. Data-quality trend samples the first eligible run only

`dataQualityData` uses the first run found for each session to represent session bias correction and validity. Elsewhere (`progressChartPoints`) the page already computes an average valid bias across all eligible session runs and an all-runs validity state.

**Classification: inconsistent aggregation.** Use a shared per-session data-quality summary rather than first-run sampling.

### 5. Multiple longitudinal truth models coexist

The page currently has:

- simple server `trend` comparing recent vs previous session blocks;
- `crossSessionReport` from the cross-session intelligence engine plus truth rules;
- `PerformancePatternsSection`;
- `RawPerformanceTrendsSection`;
- older proxy trend components;
- newer Performance Engine `sessionAnalyses` trends;
- report-engine chart series.

Not all of these disagree, but the user should not have to infer which one is the product’s longitudinal truth.

**Phase 8 rule:** establish one authoritative answer for each longitudinal question, then let secondary charts provide evidence/detail rather than independent conclusions.

## Classification by rider question

### A. Where am I now? — KEEP / SIMPLIFY

Useful inputs:

- latest canonical session summary;
- personal bests;
- active goals / target overlays;
- latest reliable technique / quality context when present.

Avoid turning this into another Home KPI wall. Home already answers “what should I notice?” for the latest session; Progress should anchor the rider within their history.

### B. Am I improving? — KEEP / CONSOLIDATE

Primary model should be cross-session intelligence / truth-rule output plus canonical raw trend evidence.

Keep:

- reaction progression;
- valid speed progression;
- peak G where useful;
- genuine technique progression;
- confidence / evidence sufficiency cues.

`RawPerformanceTrendsSection` is useful as evidence, but its job should be subordinate to the interpreted longitudinal answer rather than a parallel product model.

### C. How repeatable am I? — KEEP

Repeatability / consistency is a distinct question and should not be relabelled as technique or smoothness.

Useful evidence:

- reaction CV / best-vs-average gap;
- repeatability trend from cross-session intelligence;
- set-length / drop-off evidence when sufficiently supported.

### D. What context matters? — KEEP, WITH CAUTION

Correlation/contextual analysis is valuable because riders record weather, surface, ride feel, focus, bike/setup and related context specifically for historical analysis.

Keep contextual patterns/correlations only with evidence-count/confidence cues. Avoid causal language.

This is also the natural longitudinal home for setup-change comparisons and other context-over-time questions.

### E. Is fatigue / regression worth investigating? — KEEP, CAREFULLY FRAMED

The cross-session engine already owns recency / fatigue / drop-off style evidence. Keep this separate from PB-style goals, whose `current_value` intentionally ratchets to best verified progress.

Use language such as “worth investigating” / “recent pattern” rather than diagnosis.

### F. Where should I drill down? — KEEP / SIMPLIFY

Recommendations, recurring diagnostics and strengths/limiters evolution can help route the rider into relevant sessions or metrics.

Do not present several independent recommendation engines one after another. Consolidate into a single follow-up area with provenance/confidence where useful.

## Existing component decisions

### Keep / likely retain

- canonical session-summary data;
- `RawPerformanceTrendsSection` as direct evidence;
- cross-session intelligence + truth rules;
- real `TechniqueScoreTrends` from `sessionAnalyses`;
- `CorrelationInsightsPanel`, with evidence/confidence framing;
- `DiagnosticPatternsCard` where recurrence is real;
- `StrengthsLimitersEvolution` if it answers change-over-time rather than repeating latest-session advice;
- progress-report generation/export as a supporting action, not the page hierarchy itself;
- goal overlays/context where they help interpret progression.

### Simplify / reorganise

- `PerformanceOverview` — should orient rather than become another metric wall;
- `PerformancePatternsSection` — retain only charts that answer a distinct question;
- tab architecture — current Overview / Trends / Insights buckets reflect implementation history more than rider questions;
- session-count thresholds — useful as evidence-sufficiency messaging, but avoid making deeper analytics feel permission-gated;
- goal-creation CTAs — keep if contextually helpful, but not repeated under every positive metric movement.

### Remove / replace from current longitudinal truth model

- legacy `TechniqueQualityTrend` fed by repeatability proxy;
- legacy `SmoothnessTrend` fed by repeatability proxy;
- legacy `PowerOutputTrend` fed by force mislabelled as watts;
- first-run-only `DataQualityTrend` input, unless rebuilt from a shared session-level quality summary.

### Rehome from Deep Dive

The current Deep Dive “Compare to Previous Session” modal is longitudinal rather than trace-level expert evidence. Phase 8 should decide whether its useful comparison capability becomes:

- a Progress drill-down / selected-session comparison, or
- redundant once the Progress longitudinal view is coherent.

Do not remove it until that decision is implemented.

## Proposed Progress hierarchy

1. **Progress orientation** — where the rider sits in their history and how much evidence is available;
2. **Recent direction** — interpreted, truth-ruled reaction/speed/consistency movement with confidence;
3. **Longer-term evidence** — canonical raw trend charts and goal overlays;
4. **Repeatability / fatigue** — consistency, set length and drop-off evidence;
5. **Technique development** — genuine Performance Engine technique trends only;
6. **Context and patterns** — weather/surface/ride feel/setup correlations with evidence counts;
7. **What to investigate next** — recurring diagnostics / strengths-limiters / recommendations consolidated;
8. **Progress report / export** — supporting action.

This hierarchy is question-led, not chart-led.

## First implementation slice

Before broad visual restructuring, close the truth-model seams:

1. remove the pseudo-power trend or replace it with real physics-derived power;
2. remove repeatability-as-technique and repeatability-as-smoothness proxy series in favour of genuine engine outputs;
3. unify session-level data-quality aggregation;
4. verify that the remaining headline trend copy uses one authoritative interpreted model;
5. only then restructure the visible page around the proposed hierarchy.

## Verification focus

- 0/1/2 sessions: calm evidence-sufficiency states without “locked feature” gatekeeping tone;
- 3–9 sessions: basic trend evidence without overclaiming;
- 10+ sessions: richer rolling evidence;
- valid and invalid speed histories;
- rider with and without mass data;
- genuine technique data present/absent;
- context-rich sessions vs no context;
- mobile 390 px;
- known contaminated legacy test rider should not be used to judge longitudinal visual quality unless its corrupted May rows are cleaned first.
