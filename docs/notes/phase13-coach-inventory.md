# Phase 13 — Coach workspace inventory

**Branch:** `phase13-coach-inventory`

No runtime changes yet. This is the inventory/truth-model pass before redesigning the coach workspace.

## Product boundary

The coach relationship is deliberately narrower than rider ownership.

Current documented promise:

- approved coaches can invite riders;
- the rider explicitly accepts;
- minors require the parental-consent branch before activation;
- an active coach may view the rider's onboarding profile and training goals;
- profile/goals are read-only to the coach;
- coach and rider share a dedicated message/flag thread;
- private session notes remain rider-private;
- session/progress/diagnostic reports appear only when the rider explicitly sends one;
- nothing is pulled automatically;
- either side can revoke the relationship.

Do not silently broaden this into raw session/run access merely to make the coach dashboard more convenient.

## Current security/data model

### Link state

`coachLinks.ts` is the canonical mutation path for `coach_rider_links`.

States include pending rider acceptance, pending parent consent, active, declined/denied and revoked. Link writes use the admin client because the table contains safeguarding-sensitive consent fields.

Minor acceptance is re-evaluated from the rider's current DOB. A minor cannot activate a coach link without a parent/guardian email and parent confirmation.

### Read scope

Database RLS grants active coaches SELECT access to:

- linked rider `profiles`;
- linked rider `rider_profiles`;
- linked rider `training_goals`;
- linked rider `goal_milestones`.

There is deliberately no equivalent general coach SELECT policy for sessions/runs in this current model.

### Shared communication

`coach_rider_messages` is deliberately separate from `session_notes` so rider-private reflections do not leak into coaching.

On an active link, coach/rider can send messages. A coach can flag suspected onboarding-profile inaccuracies; the rider owns correction/resolution.

### Shared reports

`report_shares` is push-based. Rider explicitly creates a report share on an active link. `viewed_at IS NULL` doubles as the coach unread-notification mechanism.

The coach dashboard counts unread report shares per rider; opening a rider workspace marks those shares viewed.

## Current coach UI

### `/coach`

Current dashboard is primarily:

- invite rider by email;
- roster of link states;
- unread shared-report count.

It has no longitudinal coaching overview and no recent-training signal.

### `/coach/riders/[linkId]`

Current rider workspace exposes:

- rider identity/basic profile;
- latest onboarding profile, view-only;
- training goals, view-only;
- profile-inaccuracy flag action;
- shared coach/rider message thread;
- reports explicitly shared by the rider;
- revoke/remove-trainee action.

It does not show a session list, raw runs, automatic recent-training feed, or private notes.

## Core workflow gap

The coach experience is **push-only**.

An active coach has no way to know that a rider trained yesterday, improved, regressed, changed setup, accumulated enough evidence for a trend, or simply has new material worth discussing unless the rider deliberately generates and sends a report.

That explains the current product complaint precisely: the coach area is consent-safe, but operationally passive.

## What Phase 13 must not do

- Do not grant blanket sessions/runs RLS to coaches without an explicit new rider/parent sharing decision.
- Do not treat an active coach link as equivalent to account ownership.
- Do not expose private `session_notes` through a convenience query.
- Do not make this analytics app replace the separate hardware/live dashboard used during club sessions.
- Do not require riders to generate bespoke reports after every training session merely to keep a coach informed.

## Recommended product model

Separate **ongoing coaching awareness** from **deep report sharing**.

### Layer 1 — coach roster awareness

Make `/coach` answer:

- who has shared something new with me?;
- whose goals need attention?;
- who has no recent shared evidence?;
- which relationships are still pending/blocked?;

This can initially use already-permitted/link-owned data: report-share timestamps/unread state, goal state, messages and profile completeness. No new session access is required for this slice.

### Layer 2 — rider workspace

Reorganise each rider page around:

1. what needs attention;
2. goals/current evidence already permitted to coach;
3. latest explicitly shared reports;
4. shared conversation/profile flags;
5. onboarding/profile reference lower down.

This removes the current "profile-first" feel without widening access.

### Layer 3 — optional ongoing summary sharing

If the product should eliminate manual report generation for routine coaching, introduce an **explicit rider-controlled sharing scope** rather than reinterpreting `active`.

Candidate future scope:

- current default: `reports_only` (today's behaviour);
- optional: `training_summaries` — automatically expose a deliberately bounded derived summary after eligible sessions;
- still no raw runs/private notes unless separately designed and consented.

For minors, any widening of the sharing scope should be treated as part of the safeguarding/parent-consent model, not as a hidden UI preference.

Do not implement this permission expansion until the rider-side wording/data contract and parent-consent consequences are explicitly decided.

## First implementation slice

Do **not** change RLS/session access yet.

First restructure the existing coach dashboard/rider page using only already-authorized data:

- roster priority/status model from active/pending links, unread shares, latest shared-report date, unresolved profile flags and goal state;
- surface "Needs attention" before profile details;
- distinguish `new shared evidence` from ordinary messages;
- keep reports as immutable rider-pushed snapshots;
- keep profile/goals read-only;
- preserve revoke semantics.

Then live-test whether that materially improves the workflow. Only after that should Phase 13 decide whether an explicit `training_summaries` sharing scope is necessary.

## Verification targets for the first slice

- approved coach with 0 riders;
- pending rider invite;
- pending parent consent;
- active rider with no shared reports;
- active rider with unread shared report;
- active rider with read report history;
- active rider with active/completed goals;
- profile flag/message thread;
- coach revoke;
- rider revoke immediately removes coach route access;
- minor consent path remains unchanged;
- mobile roster/rider workspace.

## Next exact step

Implement a pure server-side coach-roster/rider-attention projection from the data already available under the existing RLS model, with focused tests before changing presentation.
