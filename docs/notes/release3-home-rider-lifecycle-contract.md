# Release 3 Home — rider lifecycle/orientation contract

**Status:** design contract to resolve before another Home mock-up.  
**Depends on:** `release3-whole-product-architecture-handoff.md`.

## Why this exists

The established-rider Home mock-up was too narrow. It assumed the rider was already fully configured and had just completed a clean session. That is one state, not Home.

The first-session wireframe is also only one state. It must not imply that signup automatically means the rider has supplied every piece of setup/context needed for the best JNSPRO experience.

Home must orient the rider across the whole product without inventing a formal onboarding system that current code does not have.

## Home's question

> **What state is my JNSPRO training system in, what is ready for me now, what happened recently if usable evidence exists, what genuinely deserves attention, and where should I go next?**

## Lifecycle dimensions

Do not collapse these into one `onboarding_complete` boolean unless a future implementation deliberately introduces such an authority.

### A. Account/safeguarding readiness

Possible states include adult/not-required consent, guardian pending, approved and denied. Protected access already has safeguarding authority and remains outside normal Home content when access is blocked.

### B. Rider context readiness

Determine from current implementation which profile attributes are:

- essential for core session evidence;
- required for particular derived physics/category/cohort projections;
- useful enrichment only;
- optional identity/presentation fields.

A missing enrichment field must not block training if the canonical ingest/evidence model can operate without it.

### C. Bike/setup readiness

Determine which bike fields are needed to:

- ingest/store a session;
- calculate particular physics/derived metrics;
- perform setup-change analysis;
- provide richer interpretation only.

Home should surface a missing setup item only when it meaningfully blocks or degrades something the rider is trying to use. Do not turn Profile completeness into a gamified percentage.

### D. Training evidence readiness

At minimum distinguish:

- no recorded sessions;
- recorded evidence but insufficient eligible/comparable history;
- building/emerging longitudinal evidence;
- developing/established evidence.

Use canonical evidence maturity; Home must not infer maturity from raw session count.

### E. Rider intent

Goals are optional rider-owned intent. No active goal is a valid state, not an incomplete account.

Session focus/run classification/context are evidence context, not global onboarding completion.

### F. Relationships/disclosure

Coach relationship, research participation, leaderboard opt-in and Social disclosure are separate optional/consent authorities. Their absence does not make the rider “incomplete”.

## Candidate Home state families

These are design families, not database enums.

### 1. Protected access not yet available

Handled by safeguarding routes, not ordinary Home.

### 2. Account ready; core training setup genuinely blocked

Only use this state if current ingest/analysis contracts prove a required setup dependency is absent.

Home priority: explain the exact missing prerequisite and destination to resolve it. Do not show fake performance content underneath.

### 3. Account ready; training possible but richer context incomplete

Home priority: training remains available. A small contextual setup prompt may explain what additional evidence/analysis the missing field would unlock. It must not dominate Home or pretend the rider is blocked.

### 4. Training-ready; no sessions

Home priority: first-session path. Existing Goals may appear if present. Explain what Sessions/Progress/Goals become as evidence accumulates. No zero PBs, empty charts or fabricated maturity.

### 5. Evidence building

Home priority: latest usable session + explicit Building/Emerging state from owning authority. Explain that more comparable evidence is needed before stronger directional claims are available.

### 6. Established evidence

Home priority: latest relevant training + small admitted Progress projection + canonical goal if active + conditional attention + recent record navigation.

### 7. Temporarily degraded evidence

When recent evidence has calibration/data-quality limitations, Home must qualify or suppress dependent interpretation rather than falling back to an upbeat established-rider template.

### 8. Returning rider with stale history

Do not describe old evidence as “right now”. Show last supported state/date and orient toward collecting current evidence if the rider wants a current read.

## Orthogonal conditional projections

These may appear inside appropriate lifecycle states but do not define the lifecycle themselves:

- active goal / milestone;
- real coach unread message or rider-shared report activity;
- setup comparison gathering/ready;
- meaningful achievement;
- peer benchmark available/insufficient;
- leaderboard opt-in status where contextually relevant;
- research choice where governance/product UX requires it;
- video availability on a run;
- evidence/data-quality warning.

## Home must not

- calculate its own trend/confidence/consistency;
- use route-local performance thresholds;
- infer readiness/resilience/recovery/psychology/physiology;
- prescribe training;
- turn every optional feature into a setup checklist;
- treat coach/research/leaderboard/Social consent as onboarding completion;
- treat current bike/profile as historical session truth;
- call missing evidence poor performance;
- create generic filler cards when an authority has nothing to say.

## Next evidence work

Before the next visual mock-up, audit only the current paths necessary to answer the lifecycle questions above, especially current ingest requirements and graceful-degradation behavior. This is a focused continuation, not another whole-codebase archaeology pass.

Then create a Home state/content matrix that crosses lifecycle readiness with evidence maturity and uses the same visual system for at least:

1. training setup genuinely blocked (if such a state exists);
2. training possible with optional/enriching setup missing;
3. first session;
4. building evidence;
5. established evidence;
6. degraded/recent-quality warning;
7. returning/stale evidence.

Only after those states make sense together should an established-rider visual be treated as representative Home design.
