# Phase 10 — Compare / leaderboard inventory

## Product question

Compare should answer **"what is useful context for this rider's performance?"** without pretending that one global rank is the same thing as a fair benchmark.

The intended first layer is rider-relative/category-relative context. An opt-in competitive leaderboard can remain available, but it is a separate concept with a different population and privacy contract.

## What the route actually does today

`/leaderboard` currently mixes two different benchmarking models:

1. **Competitive leaderboard ranking** — `leaderboard_view` ranks only riders who have opted in, using persisted all-time rider bests from `rider_performance_snapshots`.
2. **Peer benchmark distributions** — `performance_aggregates` and `fetchBenchmarkForMetric()` can provide percentile distributions with a minimum sample of 30 and fallback from age × experience to broader cohorts.

The second model exists in the benchmarking service but is not used by the `/leaderboard` page. The rider-facing page therefore defaults to a competitive rank, not to the population benchmark service that was designed for contextual percentile comparison.

## Evidence ownership

### Snapshot evidence

`reconcilePerformanceSnapshot()` rebuilds benchmarking snapshots from canonical eligible gate runs, so warm-up / experimental / competition / exclude-from-stats runs do not contaminate the snapshot.

- reaction: best eligible reaction time;
- peak speed: best valid eligible speed;
- max G: best eligible max G;
- consistency: `100 - reaction CV` when at least three eligible reactions exist;
- age group / UCI category / participation type are persisted as cohort metadata.

This part is aligned with Release 1 eligibility semantics.

### Competitive leaderboard

The page checks for at least 10 opted-in snapshots globally, then queries `leaderboard_view` for each metric and optionally filters by age group and experience level.

The rank shown is therefore **rank among opted-in riders returned by that filtered leaderboard query**, not a percentile against the full rider population.

### Peer benchmark service

`fetchBenchmarkForMetric()` reads `performance_aggregates`, requires `MIN_BENCHMARK_SAMPLE = 30`, and falls back through:

1. age × experience;
2. age × all experience;
3. all age × experience;
4. all age × all experience.

That is the stronger basis for a first-layer "how do I compare?" view because it knows its sample size and explicitly refuses to produce a benchmark when the population is too thin.

## Truth-model blockers before redesign

### 1. Default view is global competitive ranking, not rider-relative context

With no filters, the route ranks the rider against all opted-in riders with that metric. A young rider can therefore be placed directly in the same raw ranking as adults / elite riders until someone manually selects filters.

This conflicts with the renovation intent that the first comparison should be category/baseline context rather than youth-vs-elite raw ranking.

**Direction:** default the first layer to the rider's own defensible cohort/benchmark. Keep "all opted-in riders" as an explicit secondary competitive view if useful.

### 2. The time-period filters are not real

The server explicitly notes that snapshot-level week/month filtering is not implemented. `selectedPeriod` currently changes labels/options only; the ranking remains all-time because snapshots store all-time bests.

The UI and FAQ nevertheless state that all-time/month/week rankings are used to track recent improvement.

**Classification: correctness blocker.** Remove or disable week/month claims until real period-scoped evidence exists. Recent progress belongs primarily in Progress anyway.

### 3. Minimum-population protection is applied globally, not to the selected cohort

`MIN_LEADERBOARD_RIDERS = 10` is checked against the total opted-in population before age/experience filters are applied. A filtered cohort can therefore contain one or a handful of riders and still be rendered as a ranked table.

That is statistically weak and undermines the privacy/fair-comparison story.

**Direction:** apply a minimum to the actual comparison cohort, not only to the global opted-in pool. Peer benchmark distributions already use the stricter sample-size rule of 30.

### 4. Ranking is silently truncated at 200

Each metric query is ordered and `.limit(200)` before `shapeLeaderboard()` calculates `totalEntries`, user rank and top-percentage labels.

Once the opted-in population exceeds 200:

- `totalEntries` cannot mean total riders;
- riders outside the returned top 200 have no `userEntry` / rank;
- "Top X%" is calculated against the truncated set rather than the real cohort.

**Classification: scale correctness blocker.** Rank/count must be computed against the full selected cohort (or via DB rank/window/count logic), even if the visible table itself is paginated/limited.

### 5. Cohort taxonomy is weaker than the data already stored

Snapshots persist `uci_category` and `participation_type`, but the leaderboard query/view only exposes age group and an estimated experience level.

`reconcilePerformanceSnapshot()` currently calls `estimateExperienceLevel(sessionCount, 50)`. With the percentile argument hard-coded to 50, the stored experience label is largely a session-count heuristic rather than an onboarding/category truth:

- < 30 sessions => beginner;
- 30–99 sessions at percentile 50 => still beginner;
- 100+ sessions at percentile 50 => intermediate.

That should not be presented as though it were an authoritative rider category.

**Direction:** decide whether Compare's primary cohorts should use UCI/category/onboarding context, age, participation type, or an explicitly labelled derived training-history band. Do not call a derived session-count heuristic a rider's true "experience level" without explanation.

### 6. Under-13 age handling is incorrect for a youth product

`determineAgeGroup(age)` returns `13-17` for every age below 18. Therefore riders younger than 13 are silently placed in the 13–17 group, while the UI exposes no under-13 category.

**Classification: correctness/product-safety blocker.** BMX youth categories need explicit handling rather than coercing younger riders into a teenage group.

### 7. Early-access copy contradicts the implementation

The page says cross-rider numbers are "placeholder data only", but when the global threshold is reached the server queries real `leaderboard_view` rows.

The old inline comment also refers to a mock generator that is no longer the active implementation.

**Direction:** replace with accurate population/sample language. Do not tell riders real peer data is placeholder, and do not imply a mature comparison pool when it is thin.

### 8. "Fair comparisons" and percentile language overstate what the rank means

The FAQ says data is aggregated by age and experience "to ensure fair comparisons", while the default view is all ages/all levels and the experience taxonomy is derived as above.

The "Top 10% / Top 25% / Top X%" badge is not a benchmark percentile; it is simply rank ÷ number of returned opted-in leaderboard entries.

**Direction:** reserve **percentile** language for defensible benchmark distributions. Competitive leaderboard position can be labelled **rank among opted-in riders in this selected cohort**.

### 9. Goal/current-history work in the leaderboard loader is stale and appears unused

The server still computes personal bests, recent sessions and active goals even though the current leaderboard page only consumes leaderboard/filter/privacy fields. The active-goal query also uses the old `completed = false` model instead of Phase 9's `completed_at` semantics.

**Direction:** remove dead loader work rather than repairing a second Goals projection inside Compare. Compare should link to Goals/Progress when needed instead of owning those models.

### 10. URL filter values are trusted by cast

`metric` and `period` are cast directly from query parameters to their union types. An invalid externally supplied value can therefore reach metric-column lookup logic without runtime validation.

**Direction:** normalize query parameters against allowed values before building DB queries.

## Keep / simplify / remove / move

### Keep

- explicit leaderboard opt-in;
- anonymous/custom display name;
- canonical eligible snapshot evidence;
- metric choices: reaction, valid peak speed, max G, consistency;
- sample-size-aware `performance_aggregates` benchmark infrastructure;
- admin aggregate refresh / threshold context;
- competitive ranking as an optional secondary view once the selected cohort is sufficiently populated.

### Simplify

- first screen should answer "how does my evidence compare with a relevant baseline?";
- show the comparison population and sample size plainly;
- explain whether a cohort is exact or a broader fallback;
- make all-rider competitive ranking secondary rather than the default product story;
- reduce medals/gamification emphasis for very small populations.

### Remove / disable until truthful

- week/month leaderboard filters while only all-time snapshots exist;
- placeholder-data notice that contradicts the real DB-backed implementation;
- percentile wording derived from truncated leaderboard rank;
- stale loader-only personal stats/recent sessions/goals data.

### Reconsider taxonomy

- age-group scheme, particularly under-13 riders;
- derived `experience_level` naming and role;
- whether UCI category and/or onboarding participation context should determine the default comparison cohort.

## Proposed Phase 10 hierarchy

1. **Your comparison context** — metric + rider's default cohort, with a one-sentence explanation of how the cohort was chosen.
2. **Where your best evidence sits** — benchmark percentile/band only when a sufficiently populated aggregate exists; otherwise say the cohort is still building.
3. **What that means** — restrained interpretation; avoid "needs improvement" judgement based solely on peer rank.
4. **Competitive leaderboard (optional)** — explicit opt-in ranking among opted-in riders, with selected cohort size and honest scope.
5. **Explore other cohorts / metrics** — deliberate filters, including an explicit "all riders" view rather than making it the default.
6. **Privacy and methodology** — what is shared, what is aggregated, minimum cohort sizes, and how category/fallback selection works.

## First implementation slice

Correct the truth model before redesigning the cards:

1. validate query params;
2. remove/disable fake week/month ranking;
3. enforce minimum population on the actual filtered competitive cohort;
4. remove the 200-row rank/count truncation from correctness calculations;
5. introduce a server-side peer-benchmark result using `fetchBenchmarkForMetric()` with explicit sample/cohort metadata;
6. resolve the under-13 and default-cohort taxonomy rather than silently using `13-17`/global-all;
7. remove dead personal/recent/goals loader work and the stale `completed` query;
8. rewrite early-access/FAQ copy only after the returned data tells us exactly which population was used.

## Verification matrix after the truth-model slice

- rider under 13;
- teenage rider;
- adult rider;
- unknown DOB/profile;
- cohort below minimum sample;
- exact cohort above minimum sample;
- fallback cohort above minimum sample;
- opted out vs opted in;
- filtered competitive cohort below minimum even when global population is above it;
- population over 200 riders;
- invalid metric/period query params;
- reaction / peak speed / max G / consistency directionality;
- warm-up/excluded evidence cannot move snapshot/rank;
- 390 px mobile;
- admin aggregate refresh remains coherent.
