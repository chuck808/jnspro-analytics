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
- **Phase 15 — Final consolidation and release hardening: DONE**

Phase 14 was merged to `master` in PR #8 at merge commit `d558a803ac8e04abcf4ffaa4e45658cca0150600`. Phase 15 is being completed in PR #9 from that exact boundary.

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

Admin is organised around operations, access, platform evidence, research/export and feedback. Research/export surfaces preserve canonical eligibility and anonymisation/privacy boundaries rather than reimplementing statistics locally.

### Public and documentation surfaces

Public Home, About, Contact, Privacy, Terms and the linked `/docs` guide have been audited for product consistency. Privacy/Terms are not rewritten merely for tone; changes require a demonstrable product/policy contradiction. Hardware-validation claims that cannot be proven from this analytics repository remain device-side validation questions.

## Core invariants preserved through Phase 15

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
- Rider/parent ownership is the default; coach sharing remains explicit and narrower than owner access.
- Derived and research-facing values remain reproducible from canonical evidence and clearly distinguished from recorded measurements.

## Phase 15 consolidation and hardening completed

Phase 15 stayed a consolidation pass rather than becoming another redesign. The branch now includes:

- consumer-backed removal of dead reusable components, orphaned helpers, obsolete duplicate routes, stale documentation assets, the unlinked runtime docs editor, and the false Help-FAQ management stack;
- preservation of low-cost compatibility behavior where it still has a purpose, including the `/feedback` redirect;
- correction of the Admin role-selector Svelte 5 reactivity warning, leaving `svelte-check` at zero diagnostics;
- recoverable mutation/error handling for Admin Maintenance and improved action-result semantics across Admin/coach surfaces;
- correction of unsupported or contradictory Leaderboard Administration copy without inventing legal/compliance claims;
- accessibility hardening across protected/public navigation, Admin result feedback, video/image upload errors, run-tag controls, global feedback, and live modal flows;
- focus-on-open and immediate-Escape behavior for Session Comparison, Social Share, Goal Adjustment Suggestions, global Feedback, and the public mobile navigation where applicable;
- explicit focus return for controls whose popup/dialog flow owns the opener;
- removal of stale Help/docs/support claims and unused screenshots inherited from prior phases.

### Presentation primitive judgment

Repeated presentation patterns were reviewed, including the small local focus-on-mount actions introduced during modal hardening. No additional extraction was made solely to satisfy a consolidation checkbox: these helpers are tiny, local to different ownership/dismissal models, and sharing them now would add coupling without reducing meaningful behavioral duplication. Consolidation remains appropriate only when it lowers real maintenance cost without obscuring interaction ownership.

## Final verification

Required GitHub CI on the current Phase 15 implementation repeatedly verifies the branch in small slices. The current strict baseline is:

- `svelte-check`: **0 errors / 0 warnings** in the raw CI Typecheck log;
- TypeScript: clean in independent/local verification during the phase;
- Vitest: **128/128 passing**;
- production build: passing in the required GitHub CI verify job;
- repository-wide Prettier/lint: still the known non-blocking historical backlog and not treated as Phase 15 correctness work.

Independent live/browser verification has exercised the repaired interaction paths, including Admin Maintenance failure recovery, Coach Application failure feedback, Admin role updates, protected and public navigation state/focus behavior, Session Comparison/Social Share/Goal Adjustment modal focus/Escape flows, Run Tag Escape/focus restoration, video/image async error announcements, and the global Feedback dialog including its public-header backdrop layer and post-success focus/Escape path. No outstanding Phase 15 issue remains from the final verification pass.

## Known environment boundary

Branch previews have lacked required Supabase/device-ingest environment variables in Vercel, so a failed preview build is not automatically evidence of an application regression. GitHub CI supplies format-valid placeholders for static/test/build verification. Live database/browser claims are made only where the relevant environment and data boundary have actually been exercised.

## Deliberate deferrals / non-blockers

- Historical database tables/migrations are not destructively cleaned up merely because their old UI consumer was removed.
- Repository-wide formatting debt is separate from Phase 15 correctness.
- Device-specific hardware validation claims remain outside this analytics repository unless device-side evidence is available.
- No broad visual refactor or speculative shared-component extraction is required before release when the current implementation is already coherent and verified.

## Next exact step

Phase 15 is complete. PR #9 can proceed through normal review and merge; any future work should start from the post-Phase-15 `master` state rather than reopening the renovation hardening scope.

## Working rule

For every Phase 15 slice: inspect current consumers first, make the smallest justified change, run the relevant checks, inspect the resulting diff, and record deliberate deferrals. Do not use historical migration/bridge documents as proof of current architecture when live code says otherwise.
