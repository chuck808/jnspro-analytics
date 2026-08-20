# Phase 8 Progress workspace — implementation checkpoint

Status: **runtime restructure landed on `master`, awaiting independent verification**.

## What changed

`/analytics` no longer presents the historical `Overview / Trends / Insights` tab split. The page is now one progressively disclosed longitudinal workspace organised around rider questions:

1. **Where am I now?** — recent form / current baseline;
2. **Am I improving?** — recorded reaction/speed progression plus genuine engine-derived power/technique where available;
3. **How repeatable am I?** — consistency, stability and smoothness evidence;
4. **What context matters?** — correlation/context evidence and wheel-lift patterns when supported;
5. **Is anything worth investigating?** — truth-ruled cross-session interpretation and recurring diagnostics;
6. **Where do I drill down?** — explicit return to the session record for run-level Analysis/Deep Dive.

The denser longitudinal engine series remain reachable under **More longitudinal evidence** rather than occupying the first screen.

Progress Report and export capability remain available.

## Legacy proxy cleanup

The old page-local arrays that calculated or substituted:

- repeatability as technique;
- repeatability as smoothness;
- `G × 9.81 × mass` as watts;
- first-run-only session data quality;

have been removed from `/analytics/+page.svelte`.

The signed-off `buildProgressTrendEvidence()` adapter is now the page-level truth source for technique, smoothness, power and session-level data-quality evidence.

## Rider-profile / mass correction

Progress now loads biometric snapshots from `rider_profiles`, not the identity `profiles` row.

For historical Performance Engine analysis it uses the rider-profile snapshot linked to the session where available, and the bike linked to that session rather than blindly using the first bike returned for the rider. The latest rider-profile weight is also exposed separately for current W/kg display context.

This closes the pre-existing bug where the W/kg prompt could remain visible for riders who had already recorded their body weight.

## Verification focus

Before Phase 8 is signed off, run:

- `svelte-check`;
- TypeScript;
- Vitest;
- real multi-session desktop and 390 px mobile;
- 0 / 1 / 2 session evidence states;
- 3–9 and 10+ session histories;
- real power with rider weight present: confirm W/kg context appears and no “add body weight” prompt;
- rider weight absent: confirm the W/kg prompt still appears without suppressing watts;
- multi-bike history: confirm historical physics follows each session's linked bike;
- technique/smoothness present and absent;
- valid/invalid speed histories;
- context-rich and no-context histories;
- Progress Report generation and coach sharing;
- confirm all useful former Insights capability remains reachable under the new hierarchy.

Do not mark Phase 8 complete until these checks pass.