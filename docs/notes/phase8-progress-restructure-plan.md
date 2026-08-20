# Phase 8 Progress restructure — implementation contract

This note records the runtime boundary for the Progress restructure after the truth-model correction was signed off.

## First cleanup slice

Before changing the visible hierarchy:

1. remove the now-dead proxy arrays for technique, smoothness, pseudo-power and first-run data quality from `/analytics/+page.svelte`;
2. fix rider-weight lookup so W/kg context uses the latest `rider_profiles` snapshot rather than the identity `profiles` row;
3. keep the already-signed-off canonical `progressTrendEvidence` adapter as the only source for those four longitudinal evidence families.

## Visible hierarchy to follow

Progress should answer, in order:

1. **Where am I now?** — recent form / current baseline without claiming a trend from one session.
2. **Am I improving?** — long-term reaction, speed and force progression.
3. **How repeatable am I?** — consistency / repeatability and best-vs-average gap.
4. **What context matters?** — rider-entered context and correlation evidence when sample size supports it.
5. **Is fatigue or regression worth investigating?** — proportionate, non-diagnostic use of the existing cross-session engines.
6. **Where do I drill down?** — links back to sessions and deeper evidence.

The old Overview / Trends / Insights tab split is implementation history, not a product requirement. The restructure may replace it with question-led sections as long as all useful capability remains reachable.
