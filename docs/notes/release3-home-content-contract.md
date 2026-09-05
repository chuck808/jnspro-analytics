# Release 3 Home content contract

Status: design contract / mock-up gate

Authority order for this contract:

1. Current Release 3 evidence contracts and recent implementation
2. Current canonical services and data paths
3. Current UI consumers
4. Recent tests and audit notes
5. Older implementations only as archaeology

Home is the rider's orientation layer over existing authorities. It owns no new performance truth.

## Product question

Home answers:

- What happened recently?
- What is changing over time, when evidence supports saying so?
- What am I working toward?
- Is there something genuinely worth looking at?
- Where should I go deeper?
- Has my coach actually communicated something?

Home does not calculate trends, confidence, consistency bands, rankings, readiness, training prescriptions, or generic engagement insights.

## Semantic order

The semantic order is stable across desktop and mobile:

1. Latest training
2. Development
3. Rider intent / active goal
4. Conditional attention
5. Recent training / destinations

Layout may place blocks side by side on larger screens, but visual composition must not change this authority order.

## State/content matrix

| Rider state | Primary story | Development | Goal | Conditional attention | Recent training |
| --- | --- | --- | --- | --- | --- |
| No sessions | Begin a gate-start record | Explain what evidence will build; no empty trend cards | Existing goal may appear | Setup/import help only when relevant | First-session upload action |
| 1–2 eligible sessions | Latest session | Building evidence | Canonical goal evidence if present | Material quality/setup issue only | Prominent |
| Sparse longitudinal evidence | Latest session + early development | Only admitted emerging findings | Active goal | Conditional | Compact |
| Established evidence | Current development story | Strongest 1–2 admitted findings | Active goal | Conditional | Compact |
| No recent session | Last supported state with dates | Do not describe stale evidence as current | Active goal if present | Evidence need may be surfaced without training prescription | Last sessions |
| No active goal | Normal Home | Normal | Small optional destination to Goals | None merely to fill space | Normal |
| Coach linked | Normal Home | Same evidence truth | Same goal truth | Actual unread message/report/flag may appear | Normal |
| No coach | Normal Home | Same | Same | No empty coach card | Normal |
| Achievement eligible | Normal Home | Same | Same | Achievement may appear temporarily | Normal |
| Setup comparison gathering | Normal Home | Relevant only when material | Same | May state exact evidence still needed | Normal |
| Setup comparison ready | Normal Home | Observational association may be projected | Same | Evidence-ready setup item | Normal |
| Material evidence warning | Latest session with qualified interpretation | Warning cannot upgrade a claim | Canonical goal evidence remains bounded | Warning outranks celebration when material | Preserve record |
| Peer cohort available | Personal development remains primary | Same | Same | Peer teaser is optional/secondary | Normal |
| Peer cohort insufficient | No fake benchmark | Same | Same | No empty percentile card | Normal |

Absence of evidence removes content; it does not create filler.

## Block contracts

### Latest training

Owner: Sessions / Overview.

May show:

- session identity/date
- eligible run coverage using the owning session semantics
- one concise admitted session read
- a small set of direct metrics whose quality state is already known
- evidence/data-quality state when material
- destination to the session

Must not:

- reinterpret raw runs
- infer the whole session from one selected run
- turn performance drop-off into physiology/fatigue state
- present invalid speed as measured truth

### Development

Owner: Progress.

May show at most one or two admitted longitudinal findings with:

- metric/domain
- admitted claim
- maturity
- confidence when the authority supplies it
- provenance/supporting-session destination

Must not:

- calculate a second trend
- calculate confidence
- use total session count to upgrade a claim
- turn association into explanation
- substitute lifetime PB cards for the longitudinal story

Building evidence is a first-class state. It should state what is known and what additional comparable evidence is required without treating missing evidence as poor performance.

### Rider intent / goal

Owner: canonical Goals evidence projection plus rider-authored goal definition.

May show:

- target
- canonical current evidence
- milestone/completion state
- deadline when useful
- an admitted Progress relationship when one exists

Must not:

- prefer stale persisted current_value over the canonical read-time projection
- promise goal completion
- convert the rider's target into an automated training prescription

### Conditional attention

Home has no generic insight engine. Attention is a projection from an owning capability.

Suggested priority:

1. Material evidence/data-quality issue
2. Actual coach communication or rider-pushed report state
3. Specific admitted Progress finding worth investigating
4. Goal milestone
5. Setup comparison becoming ready
6. Eligible achievement
7. Nothing

Every item identifies its source and destination. Examples of source labels include `From JNSPRO evidence` and `From Coach <name>` where appropriate.

No block is rendered merely because the layout has space.

### Recent training

Owner: Sessions.

Home provides a compact recent record, normally up to three sessions, plus a destination to the full training record. Sessions owns complete browsing/filtering/history.

### Peer context

Owner: Benchmarking.

Peer context is optional and secondary. It only appears when the canonical cohort has sufficient population. Personal development remains the primary Home story. Leaderboard participation/publication is a separate opt-in authority and must not be inferred from benchmark eligibility.

### Achievement

Owner: Achievement/Social after eligibility, language and privacy hardening.

Home may acknowledge an eligible achievement. Home must not make it public, infer public consent, or turn RideFeel into readiness/resilience/psychology.

### Coach attention

Owner: Coach relationship/message/report state.

Home may surface actual communication or a report-sharing state. It must not generate algorithmic content under a coach identity or imply that an active coach has browsed private sessions.

## Sparse-evidence behavior

### No sessions

Primary message: the rider's gate-start evidence begins with a recorded/imported session.

Do not render zero-valued performance cards or disabled longitudinal charts. Explain that Sessions, Progress and Goals deepen as evidence becomes available.

### Building evidence

After early sessions, Home may show session truth while Progress remains explicitly Building. Example grammar:

> You have 2 comparable sessions. More evidence is needed before JNSPRO can make a supported directional claim.

This is evidence restraint, not an error state.

### Established evidence

More history increases the set of claims that can become admissible; it does not increase Home density without limit. Home still projects only the small number of findings needed for orientation.

## Presentation rules

- Home is BMX gate-start specific, not a generic sports dashboard.
- Latest training normally carries the freshest evidence.
- Development is a Progress projection, not a KPI row.
- Rider level changes vocabulary/context where appropriate; it does not hide Deep Dive or strengthen truth.
- Mobile preserves semantic order rather than blindly stacking a desktop grid.
- Dates/provenance should prevent old evidence being described as current.
- Missing values remain unavailable/building; never coerce null to zero.
- No route-local qualitative thresholds.
- No generic motivation or engagement copy masquerading as evidence.

## Projection boundary

The eventual Home server adapter should compose projections from owning authorities. Conceptually:

```text
HomeProjection
  latestTraining
    sessionId
    date
    eligibleCoverage
    admittedRead
    directMetrics[]
    evidenceState

  development
    maturity
    findings[0..2]
      metric
      claim
      confidence
      provenance
      destination

  primaryGoal?
    canonicalEvidence
    target
    state
    relatedFinding?

  attention?
    source
    priority
    claim
    destination

  recentSessions[0..3]

  peerContext?
  achievement?
  coachAttention?
```

The adapter may reshape/join authoritative outputs. It may not introduce `calculateTrend`, `calculateConfidence`, route-local `calculateConsistency`, `recommendTraining`, `inferReadiness`, or a second insight-ranking engine.

## Existing dashboard-preview status

`dashboard-next` remains a useful presentation experiment, but its reuse of the existing dashboard loader is not the production Home authority boundary. The existing loader calculates lifetime PBs and reaction CV directly from raw eligible runs; the preview also assigns local repeatability labels. Those are current implementation seams for the redesign, not contracts to preserve.

Production Home should replace those local calculations with the projections above.

## Mock-up gate

The next visual mock-up should demonstrate at least:

1. Established evidence + active goal + one conditional attention item
2. Building-evidence state
3. No-session state
4. Mobile semantic order

No broad production Home implementation should begin until the mock-up is reviewed/approved, unless that gate is explicitly waived.
