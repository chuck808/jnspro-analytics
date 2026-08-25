# Renovation Current Status

> Short current-state pointer for the AppGatePro renovation. `docs/RENOVATION_ROADMAP.md` remains the durable source for product invariants and phase intent; phase-specific notes under `docs/notes/` record implementation detail. When any checkpoint disagrees with the current code, inspect the code and update the checkpoint.

## Current position

**Release 2 — Make It Feel Like One Product**

- Phase 1 — Shared authenticated shell: DONE
- Phase 2 — Workspace-aware navigation: DONE
- Phase 3 — Rider Home: DONE
- Phase 4 — Sessions index: DONE
- Phase 5 — Single-session Overview: DONE
- Phase 6 — Session Analysis: DONE
- Phase 7 — Session Deep Dive: DONE
- Phase 8 — Progress / longitudinal analytics: DONE
- Phase 9 — Goals: DONE
- Phase 10 — Compare / leaderboard: DONE
- Phase 11 — Upload and session enrichment: DONE
- Phase 12 — Video experience: DONE
- Phase 13 — Coach workspace: DONE
- Phase 14 — Admin, research, help and public/supporting pages: DONE
- **Phase 15 — Final consolidation and release hardening: IN PROGRESS**

Phase 14 was merged to `master` in PR #8 at merge commit `d558a803ac8e04abcf4ffaa4e45658cca0150600` after independent verification of Help, Contact, `/docs`, Compare/session/upload guide accuracy, generated docs integrity, and the Admin Home icon cleanup.

## Current product architecture

### Rider workspace

The rider-facing application is organised around progressive disclosure rather than duplicate dashboards:

1. **Home** — first-layer interpretation and recent anchors;
2. **Sessions** — chronological historical record, including excluded-run context;
3. **Session Overview** — what happened in one session;
4. **Session Analysis** — run comparison and middle-layer analytical evidence;
5. **Session Deep Dive** — provenance, expert diagnostics and deeper traces;
6. **Progress** — longitudinal history and context;
7. **Goals** — evidence-backed commitment and best-so-far progress;
8. **Compare** — separate peer benchmarking and opt-in competitive ranking;
9. **Upload** — shared manual/device ingest journey with common evidence rules;
10. **Profile / Settings / Help** — rider identity, preferences and support surfaces.

### Coach workspace

Coach access is explicitly shared by the rider side. Coach views are intentionally narrower than rider ownership and consume shared report/evidence boundaries rather than unrestricted raw rider history.

### Admin and research workspace

Admin is organised around operations, access, platform evidence, research/export and feedback. Research/export surfaces must preserve canonical eligibility and anonymisation/privacy boundaries rather than reimplementing statistics locally.

### Public and documentation surfaces

Public Home, About, Contact, Privacy, Terms and the linked `/docs` guide have been audited for product consistency. Privacy/Terms are not rewritten merely for tone; changes require a demonstrable product/policy contradiction. Hardware-validation claims that cannot be proven from this analytics repository remain device-side validation questions.

## Core invariants that must survive Phase 15

- `shouldExcludeFromStats()` remains the canonical normal-statistics eligibility policy.
- Excluded runs stay in the historical record even when omitted from normal statistics.
- Manual/SD and direct Wi-Fi ingest share deduplication, rollback and derived-state reconciliation semantics.
- Failed ingest must not consume session identity.
- Goal `current_value` means **Best so far** from eligible evidence since goal creation, not current form.
- Completed-goal evidence remains frozen at `completed_at`.
- Overview -> Analysis -> Deep Dive is progressive disclosure, never rider-type permission gating.
- Video remains optional supplementary evidence; sensor analytics are complete without it.
- The intended hardware sync cue is the optional ~120 ms full-white Lights-unit pulse at gate-zero, anchored to its leading edge.
- Peer benchmarking and competitive ranking are separate concepts; competitive ranking is opt-in and all-time.
- Rider/parent ownership is the default; coach sharing must remain explicit and narrower than owner access.
- Derived and research-facing values must be reproducible from canonical evidence and clearly distinguished from recorded measurements.

## Phase 15 — exact starting point

Phase 15 is a consolidation and release-hardening pass, not another redesign phase. Work in small verified slices and remove something only when its lack of consumers or obsolete contract is demonstrated from the current repository.

Initial audit order:

1. identify dead components, unreferenced assets and legacy compatibility paths with no remaining consumer;
2. find repeated presentation primitives that can be consolidated without changing product behaviour;
3. audit accessibility and responsive behaviour on the renovated primary surfaces;
4. audit terminology/copy consistency across authenticated, coach/admin, public and docs surfaces;
5. audit empty/error/loading states, especially network/database boundaries;
6. run the full static/unit/browser/live-data verification matrix where the environment permits;
7. update architecture/supporting documentation so it describes the final system rather than old migration bridges.

The first documentation hardening item was this file itself: it had stopped at Phase 9/10 and incorrectly described Phase 10 as the next phase after Phases 10–14 had already landed.

## Verification baseline entering Phase 15

At the Phase 14 merge boundary:

- `svelte-check`: clean apart from the longstanding unrelated warning reported by independent verification;
- TypeScript: clean;
- Vitest: 128/128 passing;
- production build: passed in the required GitHub CI verify job;
- repository-wide Prettier/lint remains a known non-blocking historical backlog and should not be conflated with Phase 15 correctness work.

## Known environment boundary

Branch previews have lacked required Supabase/device-ingest environment variables in Vercel, so a failed preview build is not automatically evidence of an application regression. GitHub CI currently supplies format-valid placeholders for static/test/build verification. Live database/browser claims should only be made when the target environment actually starts and the relevant data boundary is exercised.

## Working rule

For every Phase 15 slice: inspect current consumers first, make the smallest justified change, run the relevant checks, inspect the resulting diff, and record deliberate deferrals. Do not use historical migration/bridge documents as proof of current architecture when live code says otherwise.
