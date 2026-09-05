# Release 3 Home — signed-in dashboard contract

Status: product/design contract for the next Home visual and implementation.

## The correction

Home is not a lifecycle engine, an onboarding flow, a replacement for Progress, or a compressed version of every workspace.

Home is the signed-in user's landing page.

Its perspective is simply:

> I have signed in. Broadly, what does JNSPRO currently know about me and my training, is there anything I should notice, and where might I want to go next?

The same dashboard must make sense for a rider who created an account five minutes ago and a rider with years of uploaded history. The contents adapt to what is actually known; the fundamental page does not become a different product for each lifecycle state.

The capability/readiness audit remains useful as truth plumbing underneath Home. It determines whether a dashboard summary may be shown, qualified, omitted, or replaced by an empty state. It must not become the visible information architecture.

## Home's job

Home should do four things well:

1. **Orient** — make it immediately clear whose account this is and give a broad sense of current training status.
2. **Recap** — summarise the most useful current knowledge already owned by Sessions, Progress, Goals, Compare, etc.
3. **Notify** — surface genuinely noteworthy things that need awareness or action.
4. **Route** — provide sensible ways into the owning parts of JNSPRO without reproducing them on Home.

That is the dashboard.

## Core information architecture

The desktop page should be designed around a small number of regions rather than a grid of equal-weight feature cards.

### 1. Rider header / orientation

A compact signed-in identity and orientation area.

Potential content:

- rider name;
- short greeting/orientation;
- current broad training status based on available evidence;
- one obvious primary action where appropriate.

The header must not contain a fake setup percentage or declare the rider "not ready" because optional/enriching fields are absent.

For a brand-new rider, the obvious primary action is likely **Add first session**.

For an established rider, the header does not need to manufacture an action. It can simply orient and let the dashboard recap do the work.

### 2. Attention / notifications

A small, conditional region for things that are genuinely worth the rider noticing now.

Examples:

- latest session imported with limited detailed evidence;
- calibration/data-quality issue affecting current analysis;
- meaningful setup/provenance gap when it actually prevents a useful claim;
- goal reached or meaningful goal evidence change;
- coach/report activity that genuinely requires attention;
- other product notifications with a clear owner and destination.

This region should disappear when there is nothing useful to say. Home should not create warnings simply to fill space.

Optional feature non-participation is not a notification. No goal, no coach, no leaderboard opt-in, no research consent, no RideFeel, no Social publication and no video are not problems.

### 3. Recent training / Sessions recap

This is an important dashboard region because Sessions is the rider's actual training record.

The product hierarchy is:

**Home → Sessions index → individual Session**

The **Sessions index** is the page that lists uploaded sessions in the Sessions table/history.

An **individual Session** is the proper detailed session workspace where the rider examines that particular session and its analysis/evidence.

Home must respect both destinations.

A useful recent-training recap can contain:

- latest session date;
- session type/focus where known;
- run count;
- a very small number of trustworthy headline facts;
- perhaps the next one or two recent sessions when useful.

Actions should distinguish:

- **Open latest session** → individual Session;
- **View all sessions** → Sessions index;
- **Add session** → Upload/Add Session.

Home should not reproduce the Sessions table. The table already has an owner.

For a brand-new rider with no sessions, this region becomes a clean first-session empty state rather than disappearing.

### 4. Current knowledge / Progress recap

A broad recap of what JNSPRO currently knows longitudinally.

This is not a mini Progress page and must not calculate its own trends.

Where canonical Progress evidence supports it, Home can summarise a small number of useful things such as:

- whether recent reaction evidence is moving, stable, or still building;
- whether trustworthy speed evidence is moving/stable/building;
- a genuinely established repeatability/technique signal;
- a recent PB or other significant movement already established by the owning evidence authority.

The purpose is to answer "what do we broadly know right now?" and then route to **Progress** for the evidence and detail.

If the rider has too little trustworthy history, say that the picture is building. Do not invent a trend from raw session count.

### 5. Relevant current items

A secondary area for current product state that is useful but not universal.

Examples include:

- active goal and current evidence position;
- latest achievement/milestone;
- setup change worth investigating;
- benchmark context when a real cohort exists;
- coach relationship/report status;
- optional Social/leaderboard state when the rider has actually chosen to participate.

These modules are conditional. Their absence should tighten the dashboard rather than create empty boxes saying "Set up Goals", "Join leaderboard", "Connect coach", etc.

Home is not a feature-adoption checklist.

### 6. Navigation / useful destinations

The normal application navigation remains the primary way around JNSPRO. Home can additionally provide contextual links where the recap naturally creates intent.

Examples:

- recent training → Sessions;
- latest session → that Session;
- longitudinal recap → Progress;
- active goal → Goals;
- comparison summary → Compare;
- setup capability prompt → Profile;
- import → Add Session.

Do not create a large generic grid containing every feature merely because Home is a landing page.

## How the same dashboard adapts

The page should adapt through content availability and priority, not through six independently designed Home variants.

### Brand-new rider

Known:

- signed-in identity;
- no training history yet;
- perhaps some rider/bike information, perhaps none.

Home emphasis:

- welcome/orientation;
- **Add first session**;
- concise explanation that JNSPRO starts learning from recorded sessions;
- Sessions recap area shown as the first-session empty state;
- targeted setup information only if it names a real capability unlock and is useful now.

Do not show a graveyard of empty Progress, Goals, Compare, Coach, Social and leaderboard cards.

### Rider with first few sessions

Known:

- recent sessions;
- trustworthy direct metrics where available;
- limited longitudinal evidence.

Home emphasis:

- latest session and route into it;
- View all sessions;
- broad "picture is building" longitudinal recap;
- any genuine quality issue;
- perhaps a real PB/milestone if an owning service establishes it.

Do not overstate trend confidence.

### Established rider

Known:

- meaningful session history;
- established longitudinal evidence for at least some metrics;
- potentially goals, comparisons, setup changes, achievements or coach state.

Home emphasis:

- recent training;
- compact current-knowledge recap;
- meaningful changes/noteworthy items;
- conditional current items that matter to this rider;
- routes into Sessions, Progress and other owning workspaces.

This is the richest version of the same dashboard, not a different dashboard.

### Rider with a recent evidence-quality problem

Home remains the same dashboard.

The relevant recent-session recap and/or attention region should explain that some evidence is limited while preserving unaffected evidence. The rider can open the session for detail.

Do not replace the whole dashboard with an error state.

### Returning rider with old history

Home can recap historical knowledge but should qualify recency rather than pretending it describes current form.

A natural next action may be to add a new session and refresh the picture.

Again, this is the same dashboard with different content priority.

## What belongs where

| Question / content | Home | Sessions index | Individual Session | Progress |
|---|---|---|---|---|
| What has happened recently? | Broad recap | Full uploaded-session history/table | One session only | Longitudinal history only as evidence input |
| Show me all my sessions | Link only | **Owner** | No | No |
| What happened in this session? | Tiny latest-session summary/link | Row summary/link | **Owner** | No |
| Show run-level evidence | No | No | **Owner** | No |
| What does JNSPRO currently know across sessions? | Broad recap | No | Session-local context only | **Owner** |
| Am I improving over time? | One restrained summary if authoritative | No | No | **Owner** |
| Is something worth my attention? | **Owner of cross-product notification/orientation** | Session-list issues only | Session-specific issue | Progress-specific issue |
| Where do I go next? | Contextual routing | Open selected session | Analysis/deep-dive routes | Longitudinal investigation routes |

## Dashboard hierarchy recommendation

For the first visual, use this hierarchy rather than treating every module equally:

**Top:** rider orientation + primary action only when there is a natural one.

**Immediately below:** conditional attention/notification strip if anything genuinely needs attention.

**Main left / primary column:** Recent training / latest Sessions recap.

**Main right / supporting column:** Current knowledge / Progress recap.

**Below:** conditional current items — goal, achievement, setup comparison, benchmark, coach/report, etc. Only render what is relevant.

On mobile, preserve the same priority order rather than simply stacking a desktop feature grid arbitrarily.

## Suggested first visual content

The next mock-up should use an **established-but-normal rider** as the main populated example because it demonstrates the dashboard's full shape without turning the design into an edge case.

It should include approximately:

- rider greeting/orientation;
- no fake readiness score;
- a compact notification only if the example needs one;
- a prominent **Recent training** area with latest session, **Open session**, **View all sessions**, and **Add session** affordances;
- a **Current picture** area containing only a few authoritative longitudinal summaries and a clear **View Progress** route;
- one or two relevant secondary items such as an active goal or recent achievement/setup observation;
- normal global application navigation.

Then test the same composition with a brand-new rider by replacing the data-driven content rather than inventing another layout.

## Hard rules for the Home implementation

1. Home is a dashboard/landing page, not an evidence engine.
2. Home consumes authoritative summaries; it does not independently calculate analytics or trends.
3. Sessions index and individual Session are distinct destinations and must both be represented correctly.
4. Recent training deserves first-class Home space because uploaded Sessions are the core training record.
5. Missing optional participation is not an error and does not require an empty feature card.
6. Setup prompts must name a real capability unlock; no generic profile-completion nagging.
7. Quality problems qualify the affected evidence rather than invalidating the whole rider/dashboard.
8. A new rider and an old hand use the same dashboard structure; density and content adapt to available knowledge.
9. Home may broadly recap knowledge owned elsewhere, but the detail remains with the owning workspace.
10. Empty space is preferable to filler cards.

## Next step

Proceed to the visual Home design from this contract.

Do not perform another broad architecture/dependency investigation first. The existing Release 3 handoff plus capability map are sufficient truth constraints for the dashboard visual. The design should now answer the normal product-design question: **what should a signed-in rider actually see when they land here?**