# Phase 10 — Compare / leaderboard sign-off

Status: **DONE**

Merged to `master` via PR #2 as `0059a59` after independent static, code-review and live verification.

## Product boundary

Compare now separates two distinct questions:

1. **Peer benchmark** — how the rider's best eligible evidence compares with a sufficiently populated anonymised aggregate baseline.
2. **Competitive leaderboard** — an optional all-time rank among riders who explicitly opt in.

Competitive rank is never presented as a population percentile.

## Signed-off truth model

- Peer benchmarking uses `performance_aggregates` and the existing >=30-rider fallback chain.
- The actual resolved fallback cohort and sample size are shown to the rider.
- Missing/insufficient benchmark evidence stays missing rather than becoming a fabricated percentile.
- Competitive ranking requires at least 10 riders in the actual selected cohort.
- Total competitive population is cohort-wide and independent of the displayed top-100 rows.
- Riders outside the displayed top 100 receive a cohort-wide rank based on the number of strictly better riders.
- Ties use competition ranking consistently (`1, 1, 3...`) for both displayed and fallback ranks.
- Week/month leaderboard controls and claims were removed because the underlying snapshots are all-time bests.
- Age is the default competitive cohort; all-age browsing is explicit.
- Experience remains an optional system-derived training-history filter and is not presented as a UCI/race classification.
- Under-13 riders have their own cohort and are never silently folded into 13–17.
- Snapshot generation continues to consume canonical eligible evidence, so excluded runs do not contaminate benchmark or leaderboard bests.

## Schema / aggregate corrections

Hosted migrations applied and independently verified:

- `20260821_separate_under13_benchmark_cohort.sql`
- `20260822_allow_under13_snapshot_age_group.sql`
- `20260822_rebuild_aggregates_after_snapshot_delete.sql`

`rider_performance_snapshots_age_group_check` now allows `under-13`.

`performance_aggregates` is treated as fully derived state. Aggregate refresh clears stale rows before recomputation, and a statement-level snapshot-delete trigger rebuilds aggregates after account/snapshot deletion so extinct cohorts cannot survive as benchmark evidence.

## Verification baseline

Independent final verification:

- `svelte-check`: 0 errors;
- `tsc --noEmit`: clean;
- Vitest: 117/117 passing;
- no-snapshot/no-evidence state: honest empty benchmark;
- all fallback cohorts below 30: no fabricated percentile;
- exact cohort >=30: exact population used;
- exact cohort too small: broader fallback shown honestly;
- real age-12 rider: `under-13`, never `13-17`;
- opted-out rider: peer benchmark available independently, no competitive inclusion;
- competitive cohorts below 10: rank withheld;
- competitive cohort >=10: ranked table shown;
- tied reaction and speed values: competition ranks confirmed live;
- rider-age/default vs explicit all-age vs explicit cohort filter state confirmed after direct URL navigation;
- experience filter narrows the cohort and re-applies the minimum-population gate;
- stale `?period=week` / `?period=month` URLs remain all-time and expose no fake period control;
- reaction / peak speed / max-G metric switching confirmed live;
- 390 px mobile: no overflow;
- >100 boundary verified structurally: fallback rank uses a separate cohort-scoped count rather than the display-page limit;
- aggregate deletion regression: six riders produced four aggregate rows, deleting all six via `admin.auth.admin.deleteUser()` automatically removed the obsolete aggregates without manual cleanup.

## Next phase

**Phase 11 — Upload and session enrichment.**

Start inventory-first. Treat manual/SD upload, direct device/Wi-Fi upload and post-session context enrichment as one journey. Preserve Release 1 checksum/deduplication/rollback/reconciliation invariants. Context such as bike, weather, track/ride feel, notes and run tags should be encouraged where useful but must not become a barrier to getting sensor data safely into the system.
