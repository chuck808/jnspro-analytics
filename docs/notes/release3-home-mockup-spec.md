# Release 3 Home mock-up specification

Status: visual design input. This is not a production implementation contract beyond the authority rules linked from `release3-home-content-contract.md`.

## Mock-up A — established evidence

Purpose: show the intended production hierarchy without generic dashboard filler.

### Header

**Home**

Supporting line: **Your gate-start training, right now.**

Keep the header compact. The evidence begins immediately below it.

### Primary block — Latest training

Large full-width or dominant-width card.

Content shape:

- eyebrow: `LATEST TRAINING`
- date and eligible-start coverage
- one admitted Overview/session read, max 2 lines at normal desktop width
- three compact evidence facts at most
- `Open session →`

Representative content for visual composition only:

- `3 September · 6 eligible starts`
- `Reaction stayed tightly grouped through the set. Strongest supported start: Run 4.`
- `0.284 s — Best reaction`
- `18.7 km/h — Validated peak speed`
- `6 / 6 — Evidence coverage`

Values are illustrative mock-up content, not seeded-account claims.

### Development block

Dominant secondary block.

Heading: **Your development**

Finding 1 example structure:

- `Reaction · Developing`
- admitted finding sentence
- `Moderate confidence · 8 supported sessions`
- `See reaction evidence →`

Finding 2 only when it adds orientation rather than density.

Do not use three generic KPI cards.

### Goal block

Smaller supporting block adjacent to Development on wide screens.

Heading: **Working toward**

Show:

- goal metric
- canonical current evidence → rider target
- bounded progress visualization if valid
- destination to Goals

Avoid motivational/prescriptive language.

### Conditional attention block

Small but visually distinct supporting block. It must visibly name the authority/source.

Example:

`FROM JNSPRO EVIDENCE`

**Worth checking**

`Speed carry has been the weaker supported dimension across 4 of your last 5 comparable sessions.`

`Review supporting starts →`

Alternative mock-up can use a real coach-source variant:

`FROM COACH MAYA`

**New message about your shared report**

`Open coach workspace →`

Do not blend the two source types.

### Recent training

Compact table/list, normally three rows.

Each row prioritizes:

- date
- eligible starts
- one useful direct evidence anchor
- destination

Do not reproduce the full Sessions experience.

## Mock-up B — building evidence

Purpose: demonstrate that restraint is a designed state.

Latest session remains real and useful.

Development block changes to:

`BUILDING EVIDENCE`

**Building your reaction history**

`You have 2 comparable sessions. More evidence is needed before JNSPRO can make a supported directional claim.`

`View the evidence so far →`

Do not show disabled trend charts, fake percentages, zero PBs, or low-confidence directional language merely to fill the card.

Goal remains available if the rider has one.

Conditional attention is absent unless another authority genuinely supplies an item.

## Mock-up C — no sessions

Purpose: first-use orientation.

Primary content:

`FIRST SESSION`

**Your gate-start evidence starts here**

`Record or upload your first gate-start session. JNSPRO will preserve the starts, check the evidence quality, and build your training history from there.`

Primary action: `Upload a session`

Below it, a small explanatory row or stack:

- **Sessions** — understand each training set
- **Progress** — see development when enough comparable evidence exists
- **Goals** — measure evidence against targets you choose

If an active goal already exists, it may appear below the first-session action.

Do not render the established Home layout full of empty cards.

## Mobile order

The mobile mock-up must explicitly demonstrate:

1. Header
2. Latest training
3. Development
4. Goal, when present
5. Conditional attention, when present
6. Recent training

Desktop may compose Development/Goal/Attention into columns, but mobile order follows evidence semantics rather than desktop DOM convenience.

## Visual character

Use the current JNSPRO/AppGatePro visual language rather than generic fitness-dashboard imagery:

- dark product surface
- restrained orange emphasis for actions/important evidence
- teal only where already meaningful in the product language
- strong typography and evidence hierarchy
- compact metric treatments rather than decorative gauges
- no stock BMX photography required for Home
- no invented charts
- no generic AI sparkle/brain iconography
- no trophy treatment unless an actual eligible achievement is being shown

The page should feel like a rider opening a serious gate-start training instrument, not a social fitness feed.

## Desktop composition sketch

```text
HOME
Your gate-start training, right now

┌──────────────────────────────────────────────────────────────┐
│ LATEST TRAINING                                              │
│ 3 September · 6 eligible starts                             │
│                                                              │
│ Reaction stayed tightly grouped through the set.             │
│ Strongest supported start: Run 4.                            │
│                                                              │
│ 0.284s             18.7 km/h                 6 / 6           │
│ Best reaction      Validated peak speed       coverage       │
│                                                Open session → │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐ ┌─────────────────────┐
│ YOUR DEVELOPMENT                     │ │ WORKING TOWARD      │
│                                      │ │                     │
│ Reaction · Developing                │ │ Reaction time       │
│ [admitted Progress finding]          │ │ .302 → .280 target  │
│ Moderate confidence · 8 sessions     │ │ [bounded progress]  │
│ See evidence →                       │ │ View goal →         │
│                                      │ └─────────────────────┘
│ Speed carry · Emerging               │
│ [second finding if useful]           │ ┌─────────────────────┐
│                                      │ │ FROM JNSPRO EVIDENCE│
│ Explore Progress →                   │ │ Worth checking      │
└──────────────────────────────────────┘ │ [admitted finding]  │
                                         │ Review evidence →   │
┌──────────────────────────────────────┐ └─────────────────────┘
│ RECENT TRAINING                      │
│ 3 Sep    6 starts    .284            │
│ 29 Aug   5 starts    .291            │
│ 24 Aug   7 starts    .288            │
│ Training record →                    │
└──────────────────────────────────────┘
```

## Review gate

A visual mock-up is acceptable only if a reviewer can point at every rider-facing claim and identify its owning authority. Decorative labels may describe navigation or evidence state; they may not introduce new analytics semantics.
