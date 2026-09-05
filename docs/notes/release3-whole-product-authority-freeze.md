# Release 3 whole-product authority freeze

Status: product-definition checkpoint before remaining Release 3 screen design.

This document records the current capability/authority model. It is not permission to preserve older implementations when they conflict with current Release 3 contracts.

## Authority hierarchy

1. Current Release 3 contracts / recent implementation
2. Current canonical services and data paths
3. Current UI consumers
4. Recent tests
5. Recent audit/design notes
6. Older implementations/docs only as archaeology

User/product-owner corrections override obsolete repository wording where appropriate.

## Three independent authorities

**Evidence authority** — what can JNSPRO truthfully say?

**Access authority** — who may see it?

**Presentation authority** — where and at what depth should it appear?

A valid evidence claim does not automatically imply Home shows it, a coach sees it, Social publishes it, a report includes it, research exports it, or leaderboard ranks it.

## Product chain

Rider + development context → Bike/setup → Training intent + conditions + RideFeel → Recorded runs + rider classification → Sensor/data-quality truth → Derived physics → Run interpretation → Session interpretation → Longitudinal development → Goals/personal targets → Peer context/benchmarks/optional leaderboard → Achievements/Social → Human coach collaboration → Reports/evidence sharing

Privacy, consent, safeguarding, research and admin governance surround this chain.

## Frozen capability matrix

| Capability | Current classification | Source truth / authority | Primary projections | Must not infer |
| --- | --- | --- | --- | --- |
| Minor account safeguarding | Core current safeguarding | Protected DOB + guardian consent state | Whole protected-app access | Coach-link, research, leaderboard or Social disclosure consent |
| Rider development context | Current supporting | Versioned rider profile snapshots | Profile, historical session context, cohort/category inputs | Rider level = age/race/ability/UI permission |
| Bike/setup | Current supporting | Versioned bike records + session-linked bike | Session physics, setup comparisons, Progress | Current bike = historical bike |
| Recorded gate evidence | Core current | Firmware/import source evidence | Analysis, Deep Dive, downstream projections | Derived values = recorded values |
| Data quality | Core current | Telemetry/calibration diagnostics | Sessions, Analysis, Deep Dive, claim gating | Invalid speed is trustworthy |
| Run classification | Core current | Rider-authored tags + canonical eligibility helper | Sessions and downstream eligibility | Excluded = deleted; competition tag = actual race |
| Session context | Current supporting | Rider-authored weather/surface/focus/RideFeel | Overview, Progress context, Social/Reports where safe | Context changes measurement; RideFeel = readiness/psychology |
| Session interpretation | Core current | Eligible session evidence + Session Intelligence/Narrative | Overview; bounded Home projection | One selected run = whole session |
| Run interpretation | Core current | Selected-run evidence + technique/diagnostics | Analysis/Deep Dive | Whole-session claim from one run |
| Longitudinal development | Core current | Canonical comparable history + Progress evidence model | Progress; bounded Home projection | Session count alone = development; association = causation |
| Setup effects | Current supporting | Historical setup regimes + canonical comparison requirements | Progress/Home when admitted | Setup caused change |
| Goals | Core current | Rider goal definition + canonical goal evidence projection | Goals; Home/Overview projections | Persisted current_value always truth; target = prescription |
| Peer benchmarking | Core current | Eligible population distribution + resolved cohort | Compare/Progress/secondary Home | Public consent; percentile when cohort insufficient |
| Qualitative benchmark thresholds | Current supporting/admin | Admin-managed level-relative threshold profiles | Analysis/Deep Dive/Progress where consumed | Universal immutable performance fact |
| Leaderboard | Core current optional competition | Eligible benchmark evidence + explicit opt-in + competitive cohort | Leaderboard/Compare | Benchmark eligibility = publication consent; fastest-overall is appropriate ranking |
| Achievement | Current supporting | Canonical eligible evidence + context/history + suppression | Rider acknowledgement/Social candidate | Every PB is share-worthy |
| Social publication | Current supporting; authority hardening required | Achievement plus language/privacy/identity/minor/disclosure policy | External card/export | Analytics existence = permission to publish; RideFeel = readiness/resilience/psychology |
| Coach relationship | Current supporting | Explicit safeguarded consent link | Coach/rider workspace | Blanket private-session access |
| Coach evidence sharing | Current supporting | Rider-pushed report snapshot | Coach workspace | Active coach may browse all rider evidence |
| Reports | Current capability; Release 3 migration deferred | Audience projection of canonical authorities after Progress + Sessions contracts | Rider/coach/parent export/share | Independent analytics truth; legacy report engine defines R3 semantics |
| Research participation | Current supporting | Explicit research consent + participation metadata | Research eligibility | Product-use/leaderboard/Social consent implies research consent |
| Research export | Current supporting; hardening required | Consented historical evidence | Admin research export | Latest profile describes historical session; stable UUID is anonymous |
| Admin/support | Current supporting | Operational/admin sources | Feedback, thresholds, research, system operation | Admin tooling defines rider-facing evidence truth |
| Coaching language | Cross-cutting boundary | Canonical evidence + admitted findings | All rider/coach surfaces | Causation, physiology, psychology, medical state, exact automated prescription without separate authority |
| Video | Current supporting | Optional run-level clip + sync metadata | Analysis/run evidence | Video required for sensor interpretation; clip proves unsupported technique cause |
| Notification preferences | Present UI; delivery unverified | Stored preferences only | Settings | Delivery system exists without evidence |
| Billing/subscription | Not currently evidenced | — | — | Premium/plan state |
| Feature-flag/experiment platform | Not currently evidenced | — | — | Parallel routes imply experimentation authority |
| Formal onboarding completion | Not currently evidenced | — | — | Profile richness implies onboarding state machine |

## Disclosure grants are independent

- Guardian/app consent authorizes normal product access/processing for the minor under the current safeguarding model.
- Research opt-in authorizes research inclusion according to the research policy.
- Leaderboard opt-in authorizes competitive publication under the leaderboard identity policy.
- Social requires its own explicit external-disclosure boundary.
- Coach relationship consent authorizes only the relationship/reference access defined by that model.
- Sending a report authorizes that report snapshot to that coach.

Consent to possess evidence is not consent to disclose evidence. Consent to one disclosure destination is not consent to another.

## Cross-screen ownership

- Home: orientation; no new performance truth
- Sessions: training record
- Overview: explains the session
- Analysis: explains the selected start using bounded evidence
- Deep Dive: technical proof and expert investigation
- Progress: longitudinal development
- Goals: canonical evidence versus rider-owned targets
- Compare/Benchmarking: appropriate external context
- Leaderboard: optional competitive publication within appropriate cohorts
- Social: rider-selected celebration/external disclosure after hardening
- Coach: human judgement and communication under explicit relationship boundaries
- Reports: audience-specific projections after migration

## Language boundary

JNSPRO may diagnose evidence patterns. It should not diagnose the person.

Use:

- finding
- development opportunity
- worth checking
- human-authored coach note/recommendation

Avoid algorithmic `Coach recommendation` framing when no human coach authored it.

RideFeel is a rider-authored description of one session experience. It does not independently establish physical readiness, mental readiness, adversity, resilience, conditioning, psychology or physiology.

## Known hardening seams that do not block Home mock-up design

- Social privacy mode is metadata rather than a proven share-access boundary.
- Social has unsupported RideFeel → readiness/resilience and conditioning language.
- Minor-specific Social/research/leaderboard disclosure policy is not separately modelled.
- Research export uses current/latest profile semantics for historical rows and present-day category derivation.
- Research admin session count does not currently prove consent filtering.
- Safeguarding DOB and editable performance-profile DOB can diverge; correction/age-out lifecycle needs a rule.
- Immediate leaderboard opt-out propagation is not proven from version-controlled database/view source.
- Reports still contain older semantic authority and must migrate after Progress + Sessions contracts complete.
- Overview currently needs calibration-warning state wired into narrative authority before stronger dependent claims.
- Video replacement/orphan/duration lifecycle remains a later implementation audit.

These are implementation/governance work items. They should not be silently solved by Home.

## Legacy boundary

Do not carry forward older recommendation, anomaly/health, goal-adaptation, report-analytics or prescriptive coaching engines merely because they exist in the repository. They are archaeology unless explicitly re-admitted into a current authority path.

## Home consequence

Home composes projections from Sessions/Overview, Progress, Goals and conditional supporting authorities. It does not calculate a second version of their evidence.

See `release3-home-content-contract.md` and `release3-home-mockup-spec.md`.
