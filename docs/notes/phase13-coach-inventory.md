# Phase 13 — Coach workspace inventory

**Branch:** `phase13-coach-inventory`

Inventory complete. The first truth-model and UI restructure slices are implemented and verified on this branch.

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

## Implemented Phase 13 model

`buildCoachRosterProjection()` is now the canonical roster-attention model, using only already-authorized data:

- unread rider-shared evidence;
- latest shared-report timestamp;
- unresolved profile flags;
- active-goal count;
- pending rider vs pending parent consent;
- active/no-shared-report/inactive state.

It deliberately does not infer training activity from sessions/runs.

## Implemented coach UI

### `/coach`

The coach dashboard is now structured around:

1. Needs attention;
2. All riders;
3. Invite rider.

The attention section surfaces unread rider-shared reports, unresolved shared profile flags, and pending consent states. It explicitly does not treat the absence of a shared report as evidence that the rider has not trained.

### `/coach/riders/[linkId]`

The rider workspace is now structured around:

1. shared evidence;
2. training goals;
3. shared conversation;
4. onboarding reference profile;
5. coaching relationship controls.

Profile/goals remain read-only. Reports remain rider-initiated. Private session notes and general session/run history remain outside the coach workspace.

## Verified live matrix

- roster with unread report;
- unresolved profile flag;
- pending rider;
- pending parent;
- quiet active rider;
- roster search;
- mobile roster;
- active rider with zero reports;
- multiple shared reports;
- active + completed goals;
- sending a message;
- sending a profile flag and seeing the open-flag count update;
- opening a shared report;
- removing a rider, which revokes the link without deleting rider data.

Rider-level display taxonomy was corrected to the actual stored values: `novice`, `intermediate`, `expert`, `elite`.

## Verification baseline

- `svelte-check`: 0 errors, 1 known unrelated warning;
- `tsc --noEmit`: clean;
- Vitest: 128/128;
- production build: green.

## Deferred design decision

The workspace is materially better while preserving today's consent model, so Phase 13 does not silently add automatic session access.

If routine coaching later needs automatic awareness of recent training, introduce an explicit rider-controlled sharing scope such as `training_summaries`, with safeguarding/parent-consent consequences designed deliberately. Do not reinterpret an active coach link as blanket session access.
