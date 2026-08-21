# Phase 10 — Compare truth-model implementation

Status: implemented on `phase10-compare-inventory`, awaiting independent static/live verification before merge.

## Runtime boundary now implemented

Compare now separates two different questions instead of presenting them as one leaderboard concept:

1. **Peer benchmark** — the rider's best eligible evidence against an anonymised aggregate distribution from `performance_aggregates`.
2. **Competitive leaderboard** — an optional all-time rank among riders who explicitly opted in.

These are deliberately labelled and calculated separately. Competitive rank is never described as a population percentile.

## Truth-model corrections

- Removed the fake week/month behaviour. Snapshots are all-time bests; the route now ignores legacy `period` query values and the UI no longer offers weekly/monthly ranking controls.
- Peer benchmark uses `fetchBenchmarkForMetric()` and the existing >=30-rider fallback chain.
- The resolved benchmark cohort is returned to the page so fallback is visible rather than implied away.
- Competitive ranking requires at least 10 riders in the **actual selected cohort**, not 10 globally.
- Competitive total is an exact cohort count, independent of the displayed top-100 rows.
- A user's competitive rank outside the displayed top 100 is calculated by counting every strictly better rider in the selected cohort.
- Competitive ranking uses competition-rank semantics for ties: equal values share a rank and the next rank skips the tied positions (`1, 1, 3`). This matches the cohort-wide "strictly better + 1" fallback used for riders outside the displayed top 100.
- Age is the default competitive cohort. `experience_level` remains an optional filter and is explicitly labelled as a system-derived training-history classification, not a race/UCI category.
- `ageGroup=all` is an explicit all-age browse mode; absence of an age parameter returns to the rider-relative default.
- Invalid metric/age/experience query values are normalised instead of being cast blindly.
- Removed duplicated/dead Sessions, personal-stats and Goals models from the leaderboard loader.
- Existing snapshot generation still uses canonical eligibility/exclusion rules, so excluded runs do not enter benchmark or leaderboard bests.

## Under-13 correction

The previous broad age helper put every rider younger than 18 into `13-17`. Phase 10 now introduces an explicit `under-13` benchmark age group.

- `determineAgeGroup(12)` => `under-13`
- `determineAgeGroup(13)` => `13-17`
- a regression test locks this boundary down;
- `supabase/migrations/20260821_separate_under13_benchmark_cohort.sql` backfills existing snapshots from the latest rider profile and refreshes aggregate distributions.

This migration should be applied to the hosted project before relying on live under-13 cohort results.

## Presentation boundary

The route now leads with **How does my best evidence compare?** using the aggregate peer benchmark. The opt-in leaderboard is secondary and explicitly described as a competitive rank, not a percentile.

The old early-access notice claiming cross-rider rows were placeholder data has been removed. The privacy/explanation copy now states that competitive rankings are all-time only.

## Verification matrix

Run the usual static gates first:

- `svelte-check`
- `tsc --noEmit`
- `vitest`

Then live-check:

1. rider with no performance snapshot / no usable metric evidence;
2. benchmark unavailable because all aggregate fallback cohorts are below 30;
3. exact benchmark cohort >=30;
4. exact cohort too small but broader fallback >=30 — resolved population must be shown honestly;
5. under-13 rider after applying the migration — must not appear in 13-17;
6. opted-out rider — peer benchmark available independently, leaderboard participation prompt shown;
7. opted-in rider in a competitive cohort with <10 riders — no rank;
8. opted-in rider in a competitive cohort with >=10 riders — rank/table shown;
9. tied competitive values — equal values must share rank (`1, 1, 3`), including consistency between displayed rows and the cohort-wide fallback path;
10. explicit all-age browse versus default rider-age cohort;
11. experience filter on/off;
12. stale `?period=week` / `?period=month` URLs — page must still state all-time and expose no fake period control;
13. >100 displayed-rank boundary if practical — total and current-user rank must remain cohort-wide, not top-page counts;
14. reaction / speed / max-G / consistency metric switching;
15. 390 px mobile layout.

Vercel preview remains red for the previously confirmed configuration reason: preview deployments do not receive the static Supabase environment exports. The latest build log fails on missing `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` before reaching this route, so it is not a meaningful code gate for this branch.
