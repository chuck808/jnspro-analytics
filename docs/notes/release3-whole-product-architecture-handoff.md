# Release 3 whole-product architecture handoff

**Status:** architecture/product checkpoint after whole-codebase archaeology  
**Branch baseline when written:** `6848afea55fd1529e5d7dfd81359a34ab8b8de52`  
**Purpose:** preserve the product/evidence/access/presentation conclusions needed to continue Release 3 without repeating archaeology or allowing older implementations to become accidental product truth.

## 1. Read this first

This document is a continuation authority, not a claim that every implementation seam below has already been fixed.

Use this evidence hierarchy when anything conflicts:

1. Current Release 3 contracts and recent implementation.
2. Current canonical services/data paths.
3. Current UI consumers.
4. Recent tests.
5. Recent design/audit notes, including this handoff.
6. Older implementations/docs only as archaeology.

Do **not** treat an older implementation as product intent merely because it exists. The codebase moved substantially. Classify discoveries as **current truth**, **current implementation seam**, **legacy residue**, or **unverified intent**.

The core product rule is:

> One rider-facing claim, one evidence authority.

Three authorities must remain independent:

- **Evidence authority:** what may JNSPRO truthfully say?
- **Access authority:** who may see it?
- **Presentation authority:** where and at what depth should it appear?

A valid Progress finding does not automatically mean Home should show it, a coach may see it, Social may publish it, a report should include it, research may export it, or a leaderboard may rank it.

## 2. Whole-product model

JNSPRO is not a collection of dashboard pages. The coherent product chain is:

**Rider + development context → Bike/setup → Training intent + conditions + RideFeel → Recorded runs + rider classification → Sensor/data-quality truth → Derived physics → Run interpretation → Session interpretation → Longitudinal development → Goals/personal targets → Peer context/benchmarks/optional leaderboard → Achievements/Social → Human coach collaboration → Reports/evidence sharing**

Privacy, safeguarding, consent, research and admin governance surround that chain.

Screen responsibilities:

- **Home:** orientation: what state is my JNSPRO training system in, what is ready now, what happened recently if usable evidence exists, what deserves attention, and where should I go next?
- **Sessions:** training record.
- **Overview:** explain a session.
- **Analysis:** explain a selected start/run.
- **Deep Dive:** technical proof/expert investigation.
- **Progress:** development over time.
- **Goals:** canonical evidence versus rider-owned targets.
- **Compare:** appropriate external context without replacing personal development.
- **Social:** meaningful evidence worth celebrating/sharing, with separate disclosure authority.
- **Coach:** human judgement/communication without blanket private-data access.
- **Reports:** audience-specific projections of the same authorities after Release 3 migration.

## 3. Coaching and language boundary

> JNSPRO may diagnose evidence patterns. It should not diagnose the person.

Claim grammar:

- Recorded/validated measurement → state directly.
- Evidence-model finding → use admitted certainty.
- Context association → association, never explanation/causation.
- Synthesis → only when all essential supporting findings are admitted; confidence cannot exceed the weakest essential support.
- Sparse/building evidence → say what is known and what evidence is still needed.
- Presentation adapter → wording only; it cannot strengthen truth.
- Audience level → vocabulary/depth, not stronger truth.
- Human coach → may add judgement beyond JNSPRO evidence.

Prefer **finding**, **development opportunity**, and **worth checking**. Reserve **coach note/recommendation** for an actual human coach.

Hard boundaries unless a separate validated authority is introduced:

- no unsupported physiology;
- no psychology/personality inference;
- no injury/medical inference;
- no inferred recovery/under-recovery from RideFeel;
- no causality from association;
- no exact automated training prescription.

RideFeel is one rider-authored subjective session experience. It does **not** independently establish physical readiness, mental readiness, resilience, adversity, psychology or physiology.

## 4. Release 3 Progress contract

`docs/notes/progress-depth-grammar.md` is an implementation-extracted current contract.

Key rules:

- Progress depth is earned by evidence, not page position or session count.
- Overall maturity and individual claim confidence are separate; page maturity cannot upgrade a claim.
- Building / Emerging / Developing / Established are presentation grammar.
- Layer grammar: Measurement → History → Direction → Secondary evidence → Context → Synthesis → Session-level proof → Provenance.
- Contextual evidence means admitted findings only; association never becomes causation.
- Supporting sessions preserve exact source-session membership. An adapter may join/provide provenance, but may not recalculate eligibility, trend, confidence or evidence window.
- No route-local thresholds.
- No second trend/confidence calculation in Svelte/routes.
- No total-session inference where supported-session membership exists.
- No null-to-zero coercion.
- No placeholder statistic presented as real.
- Missing evidence means unavailable/building, not poor performance.

Authority chain:

1. evidence model owns eligibility and semantics;
2. adapter reshapes and joins provenance;
3. component renders;
4. route gates from existing evidence state.

Reaction and Power are implementation proofs. Future metrics reuse architecture, not thresholds/wording by analogy.

## 5. Release 3 Sessions contract

`docs/notes/release3-progress-sessions-video-handoff.md` is a continuation/design-first contract.

- Sessions should be designed from rider journey, not route tree.
- Overview asks: **What happened in this training session, how trustworthy is that read, and what should I carry into the next set/session?**
- Analysis asks: **What happened in this start, and what evidence explains it?**
- Deep Dive asks: **How trustworthy is this run evidence, how was interpretation derived, and what technical detail supports it?**
- Reports remain on the previous engine until both Progress and Sessions evidence/presentation contracts are complete, then migrate.

### Overview

Hierarchy: identity/header → Session Read hero using canonical narrative/direct+supporting metrics/quality → denominator/context/setup/classification → how set unfolded → meaning → carry-forward → conditional goals/achievement/setup/notes → destinations.

Known seam: `buildSessionNarrative` has been called with `hasCalibrationWarnings: false` despite page calibration state. Wire real quality state before allowing dependent narrative claims.

Session quality is repeatability minus a performance-drop-off penalty. Call observed decline **performance drop-off**, not physiological fatigue.

### Analysis

Evidence ladder: **Recorded → Measured/validated → Derived → Interpreted**.

At-a-glance semantics:

- Reaction = recorded.
- Peak G = recorded.
- Peak speed = measured/validated.
- elapsed values = metadata.

Then quality, optional run video, recorded G trace, derived motion, force delivery, supported finding, six technique dimensions, exactly-two-run comparison without declaring a winner, wheel evidence independent of video, and Deep Dive destination.

Canonical technique dimensions:

1. Launch quality
2. Explosiveness
3. Impulse timing
4. Speed carry
5. Smoothness
6. Repeatability (session context)

Known seam: repeatability is session-level context injected into selected-run technique scoring.

### Deep Dive

Hierarchy: evidence status → recorded signal → force → derived motion → phases → technique → diagnostics → methodology/benchmark → supporting record.

Rename early-force “stability” to **Early force across the set** unless a true stability authority exists. Generic previous-session comparison belongs in Progress.

## 6. Recorded evidence, data quality and reconciliation

Canonical ingest is `src/lib/server/ingestSessionEvidence.ts`.

Current ingest model:

- manual SD and device/Wi-Fi ingest;
- validation/checksum duplicate protection;
- resolve active bike and latest effective rider profile;
- persist `bike_id` and `rider_profile_id` on session;
- insert runs/gate runs/timeseries;
- required failure rolls back; timeseries may degrade with warnings;
- reconcile performance snapshot.

Old sessions should use their session-linked setup/profile, not today's active profile/bike.

Firmware peak/average/end speed are single-number ground truth; IMU-integrated speed is estimated shape evidence. UI must distinguish them.

Diagnostics currently include sanity boundaries around speed/power/G and blocking calibration errors. Invalid speed cannot silently become trustworthy downstream evidence.

Reconciliation rebuilds persisted benchmark/limited goal projections from non-archived gate sessions with canonical filtering. Historical global consistency CV is an older benchmark projection, not Progress/Home authority.

## 7. Rider/profile, bike/setup and context

Rider development context, age category, experience, participation, leaderboard consent and research consent are distinct concepts.

Current profile supports identity, biometrics/development context, bike setup, research choices and preferences. Rider profiles are append-only/versioned snapshots; bikes are versioned; sessions retain linked IDs.

Bike fields include weight, crank, chainring, sprocket, front/rear tire and custom wheel diameter. Rich analysis can also use rider height/crank/rear tire/custom wheel diameter.

Setup-change evidence is observational. Current detector tracks setup/profile changes, identifies the most recent monotonic regime change, requires at least three sessions either side, and can compare reaction/speed/consistency/session quality. Language must remain **associated with / averaged after**, never “caused by”.

Session context is rider-authored and editable: weather, surface, focus and RideFeel. Editing context changes interpretation inputs, not recorded measurement. Persisted derived consumers need dependency/invalidation discipline.

### Run classification

Tags include warmup, best-effort, experimental, competition and exclude-from-stats.

Canonical statistical eligibility currently excludes warmup, experimental, competition and explicit exclude-from-stats; best-effort is included.

**Critical semantic correction:** a `competition` run is a maximal/race-effort simulation in training. It does **not** prove an actual race occurred.

Excluded means excluded from relevant analytics, not deleted from historical evidence. Research can preserve recorded runs while exposing eligibility metadata.

The overlap between best-effort and competition remains a semantic decision worth tightening. Statistical exclusion policy and semantic naming are separate decisions.

## 8. Safeguarding and onboarding/lifecycle

Current under-16 safeguarding is a core capability:

- signup requires DOB;
- under-16 requires guardian email and cannot apply as coach at signup;
- account receives protected pending consent state/token/request timestamp;
- protected layout redirects pending/denied riders away from the app;
- guardian decision validates authenticated guardian metadata + token, is idempotent, records decision timestamp and clears token.

The shared threshold is technical product policy, not legal certification.

Important unresolved seams:

- guardian invite delivery can fail while account creation succeeds; no audited rider-accessible resend path was found, so a minor may become support-dependent;
- no audited age-out transition re-evaluates a pending minor when they later cross the threshold;
- safeguarding DOB lives in protected account/profile authority while versioned rider-profile DOB is also used for performance/category history. Those values can diverge and need an explicit correction/authority rule.

### Formal onboarding is NOT currently proven

There is sophisticated setup data, but the audit did not establish a canonical `onboarding_complete` state machine or dedicated protected onboarding flow. Much setup currently appears Profile-based plus signup.

Therefore distinguish:

- rider/bike/training setup = **current product capability**;
- formal step-based onboarding completion = **not evidenced as current capability**.

This matters directly for Home. Do not assume that an authenticated rider is session-ready simply because signup is complete.

Before Home implementation, define a **rider lifecycle/orientation model** based on genuinely required/valuable setup and evidence states. Do not invent a generic onboarding wizard merely to satisfy the design.

## 9. Goals

Canonical goal evidence is strong and should be retained.

- Read-time projection reconstructs current eligible evidence.
- Reclassification can remove previously contributing evidence/milestones while a goal is active.
- Completed goals freeze.
- `current_value` persistence must not outrank canonical projection when a current projection is available.

Ownership model:

> JNSPRO measures evidence against the target; the rider owns the ambition; a human coach may help decide the response.

Predictions may use robust trend evidence such as sessions remaining/confidence/r² where justified, but must not promise an outcome.

Older adaptive goal/health suggestion code is **legacy leakage/current implementation seam**, not current product intent. “Recovery session” as a rider-authored focus does not mean JNSPRO inferred a need for recovery.

## 10. Benchmarking and leaderboard

Keep three levels separate:

> **Personal development first → peer context second → optional competitive ranking third.**

### Peer benchmark

Current benchmarking service:

- uses eligible best rider evidence;
- minimum sample 30;
- cohort fallback: age × experience → age × all → all × experience → all × all;
- returns actual resolved cohort;
- returns no percentile when no defensible sample exists;
- does not require leaderboard opt-in.

Metrics include reaction, peak speed, max G and consistency.

### Competitive leaderboard

Current semantics:

- explicit opt-in;
- minimum competitive cohort 10;
- all-time best evidence;
- age default cohort;
- experience optional;
- experience is system-derived training-history classification, not licence/UCI race category;
- competition ranking ties (1,1,3);
- under-13 and 13–17 separated by default.

Open seams:

- no minor/guardian-specific leaderboard publication authority was found;
- all-ages browsing exists and needs an explicit distinction between exploratory browsing and canonical developmental competitive context;
- immediate opt-out is not proven from version-controlled DB/view authority. Settings updates current preferences while snapshots copy opt-in state during reconciliation. The checked-in migration tree did not establish that `leaderboard_view` independently joins current preferences. Treat immediate privacy revocation as a hardening requirement until proven otherwise;
- leaderboard/public alias is pseudonymous, not strictly anonymous. Avoid “anonymous” where a stable alias + performance is published.

Population percentile and admin-set qualitative threshold profiles are different authorities. Do not invent a combined JNSPRO score.

## 11. Social / achievements / disclosure

Social has substantial current functionality and should not be reduced to a share button.

Current achievement detector has run/session/longitudinal scopes, deterministic candidate selection, confidence/sensitivity/privacy concepts, data-quality/testing/recovery suppression, condition-PB evidence requirements and longitudinal minimums.

Good principle:

> Social is a canonical achievement projection; recognition is not permission to publish.

Current privacy seam is serious: `buildDetectorInput()` defaults privacy to private, but achievement `isShareable` is effectively based on confidence + sensitivity, and the share modal supports external networks/PNG/copy without a demonstrated privacy-mode publication gate. Thus a private achievement can reach a public sharing surface.

No Social-specific minor-publication authority was found. General guardian consent to use JNSPRO must not be treated as consent to publicly publish a child's performance/name/image.

Identity authorities must remain separate:

- profile presentation preference;
- leaderboard alias/identity;
- Social identity;
- Social disclosure consent.

Current detector also contains authority overreach:

- RideFeel `off` → low readiness;
- `dialled`/`peak` → high readiness;
- resulting “resilience”, “adversity”, “peak readiness” language;
- “No fade. That takes conditioning.”;
- an endurance-focus achievement with a hard-coded run-count assumption.

These are not current product truth. Replace the conceptual authority, not merely wording. Safer pattern:

> “Strong output on an ‘Off’ day — Rider marked the session Off; reaction remained within X% of their recorded PB.”

Desired publication chain:

**Canonical evidence → achievement eligibility → language boundary → sensitivity classification → identity policy → minor policy → explicit disclosure choice → rendered projection → external export**.

Only the final result should be shareable.

Current sharing appears primarily ephemeral/client-side: 1200×630 card rendering, PNG, network links and homepage copy-link. No persistent share object/history was established in this audit.

## 12. Coach ↔ rider

This is a deep current capability, not a generic “coach dashboard”.

Current relationship model includes:

- approved coach invites;
- rider acceptance;
- minor guardian branch;
- states `pending_rider`, `pending_parent`, `active`, `declined`, `denied`, `revoked`;
- either party may revoke;
- active coach gets limited rider onboarding/reference profile + training goals through RLS;
- separate coach/rider messages and flags;
- rider-private session notes remain private;
- coach may flag onboarding inaccuracies;
- session/progress/diagnostic reports are rider-pushed evidence snapshots;
- coach cannot generally browse private sessions/runs.

Core principle:

> Coach relationship = consent/safeguarding + limited reference data + explicit communication + rider-pushed evidence, not blanket sharing.

Coach audience means greater technical depth where appropriate, **not greater truth authority**.

Home may surface actual unread coach communication/report state. It must not invent “from your coach” content from JNSPRO analytics.

## 13. Reports

The current report engine is older and is **not Release 3 analytics authority**. Treat it as migration inventory/leakage risk.

Existing report types include coach-session, progress, diagnostic and rider-parent, with detail levels and sections for summary/findings/session quality/progress/technique/data quality/recommendations/watch-for/charts/appendix.

Known stale/unsafe areas include old four-dimension technique and RideFeel/readiness/resilience-style language.

`report_shares` stores the whole report object, so migration must explicitly decide snapshot/version/immutability semantics versus regeneration.

Do not migrate Reports until both Progress and Sessions contracts are complete. Then Reports should become audience-specific projections of those authorities, not an independent analytics engine.

## 14. Research

Current research export is a real supporting capability:

- admin-only export boundary;
- explicit current `research_consent = true` filtering;
- participation metadata required;
- session/run CSV projections;
- run export preserves all recorded runs and exposes canonical `is_stats_eligible` metadata.

It is **pseudonymised, not anonymous**. Exports omit direct identity/contact/DOB but include a stable rider UUID plus demographics/context/performance evidence, enabling longitudinal linkage.

Current profile copy saying “anonymised” is stronger than implementation.

Open research authority decisions/seams:

- withdrawal prevents future exports, but current export includes historical eligible sessions in the requested range when the rider is presently consented; decide whether consent covers all history or only evidence after latest consent;
- export maps latest rider profile to historical sessions rather than session-linked historical `rider_profile_id`, so historical height/weight/etc can be wrong;
- age-at-session is temporal, but UCI/category derivation can use current-year category for historical rows, creating contradictions;
- general minor guardian consent is not a separate research-disclosure consent; no guardian-specific research authority was found;
- admin Research dashboard “consented session count” query currently counts all non-archived gate sessions rather than only consented riders.

Disclosure authorities are separate acts:

**account consent → product processing**  
**research consent → research disclosure**  
**leaderboard opt-in → competitive publication**  
**Social action → external publication**  
**coach relationship → limited relationship access**  
**report push → explicit evidence disclosure to that coach**

None implies another.

## 15. Admin/support and public surfaces

Admin jobs are best understood as **operate / inspect / configure / research**.

Feedback has two distinct concepts:

- product/support `feedback` workflow (new → in progress → resolved/closed);
- `insight_feedback` on performance insight usefulness/quality.

Admin qualitative threshold profiles are configurable by rider level and can evolve. They are interpretation thresholds, not immutable universal facts and not peer percentiles.

Admin Goals Intelligence has a useful safety precedent: high session frequency is labelled as frequency, explicitly not injury-risk diagnosis.

Old advanced analytics contains unsafe/stale material such as account-tenure masquerading as age segmentation, placeholder reaction percentiles and simulated distributions. Treat as legacy.

Help/public audit already corrected stale CSV-first ingest, mandatory profile-before-upload, old leaderboard-window claims, deletion/export/offline claims, coach visibility, fixed performance bands and old technique dimension count. Hardware claims such as UCI compliance, 200Hz IMU and ±1ms accuracy still require device-side validation rather than UI archaeology.

## 16. Video

Video is run-level supplementary evidence, not required for sensor analysis.

Current contract:

- optional short clip per run;
- MP4/MOV, currently max 200MB;
- signed upload;
- upload and local sync can proceed in parallel;
- metadata finalization;
- synced playback when signed URL + offset exists, normal playback otherwise;
- replace/remove supported;
- sensor analysis remains complete without video.

Sync cue is approximately 120ms full-white pulse at gate-zero leading edge. `videoSync.ts` searches rising edges with coarse/fine passes and bounded timestamp decay. Playback must survive sync failure.

Still audit/harden replacement orphaning, cleanup, metadata and duration validation before treating lifecycle as closed.

## 17. Capabilities not currently evidenced

Do not design around these unless newer implementation proves them:

- billing/subscription;
- generic notification-delivery system;
- feature-flag/experimentation platform;
- formal onboarding-completion state machine.

Settings contains `email_alerts` and `progress_reports` preferences, but the audit did not establish a scheduler/delivery service consuming them. Existing coach unread/report state belongs to Coach, not a generic notification authority.

Principle:

> Attention belongs to the source capability. Home may aggregate orientation, but must not create a second truth engine called Notifications.

## 18. Legacy systems that must not define Release 3

Unless deliberately rebuilt behind current authorities, do not carry these forward as product truth:

- anomaly/health-style inference;
- old cross-session recommendation engine;
- old goal adaptation/health suggestions;
- prescriptive coach diagnostics/drills;
- recommendation messaging involving overtraining/recovery/deload/80–85% prescriptions/training volume;
- old report analytics;
- old fixed leaderboard/benchmark semantics;
- old advanced analytics placeholders/simulations;
- legacy rider-level-as-UI-detail permission.

Some older code contains useful maths or wording philosophy, but existence does not grant current authority.

## 19. Whole-product authority matrix

| Capability | Source truth | Authority / projection | Recalculation | Must not infer |
|---|---|---|---|---|
| Minor safeguarding | Protected account DOB + guardian state | Whole protected-app access gate | Guardian/lifecycle rule | research/social/leaderboard/coach consent |
| Rider development context | Versioned profile | Current + session-time context | New snapshot | level = age/race/ability |
| Bike/setup | Versioned bike, session link | Session/physics/setup evidence | Future sessions use new active bike | current bike = historical bike |
| Recorded gate evidence | Firmware/import | Immutable source evidence | Never rewritten by context | derived = measured |
| Data quality | telemetry/calibration | diagnostics authority | recomputed | invalid speed trustworthy |
| Run intent | rider tags | canonical eligibility helper | reclassification rebuilds | excluded = deleted; competition = actual race |
| Session context | rider-authored context | contextual interpretation | editable | context changes measurement; RideFeel = readiness |
| Session interpretation | eligible session evidence | Session Intelligence/Narrative | derived | one run = whole session |
| Run interpretation | selected-run evidence | technique/diagnostics | derived | selected run = session claim |
| Longitudinal development | canonical history | Progress | recomputed | count alone = development |
| Setup effects | historical setup regimes | observational before/after | >=3 sessions each side | causality |
| Goals | goal + canonical evidence | evidence-vs-target projection | reversible until completion | persisted current value always truth |
| Peer benchmark | eligible population | cohort percentile/context | population dependent | publication consent |
| Qualitative benchmark | admin thresholds | level-relative interpretation | threshold dependent | universal fact / peer percentile |
| Leaderboard | eligible evidence + opt-in | competitive cohort/rank | population/opt-in dependent | non-opted public; all-ages = canonical context |
| Achievement | canonical evidence + context/quality | deterministic detector | re-derived | share consent; psychology/physiology |
| Social | selected achievement | disclosure projection | explicit user control | analytics existence = publication permission |
| Coach relationship | explicit consent link | safeguarding/RLS state | revocable | blanket session access |
| Coach evidence | rider-pushed report | shared snapshot | explicit push | coach browses private evidence |
| Reports | canonical authorities | audience projection after migration | authority/version dependent | independent analytics truth |
| Research | explicit research consent + historical evidence | admin pseudonymised export | export-time/current consent rules | other consent implies research |
| Coaching language | admitted evidence | cross-cutting presentation boundary | evidence dependent | causation/physiology/psychology/medical/prescription |

## 20. Corrected Home conclusion

The established-rider mock-up produced during the audit is visually useful but **not Home authority**. It accidentally modelled “fully configured established rider immediately after a clean recent session” as if that were Home itself.

Likewise the first-session wireframe at `docs/notes/release3-home-first-session-wireframe.svg` is a useful state reference, but it jumps from account to first session and should not be interpreted as proof that every authenticated rider is ready to upload.

The corrected Home question is:

> **What state is my JNSPRO training system in, what is ready for me now, what happened recently if I have usable evidence, what genuinely deserves attention, and where should I go next?**

Home is an orientation layer over existing authorities. It owns no new performance truth.

At minimum, model these lifecycle/evidence states before another Home mock-up:

1. **Account established, training setup incomplete** — orient through genuinely required/missing rider, bike or training context. Do not pretend a formal onboarding state machine exists if it does not.
2. **Training-ready, no evidence yet** — first-session path.
3. **Evidence building** — latest usable training plus explicit Building/Emerging maturity; no fake zero metrics or empty charts.
4. **Established evidence** — latest training + admitted Progress projections + Goals + genuinely conditional attention.

Orthogonal states include safeguarding/guardian state, bike/profile completeness, active/no goal, coach/no coach, coach unread state, benchmark availability, data-quality state, setup comparison state, achievement state and disclosure choices.

Home projection should eventually obtain small projections from owning systems rather than reuse a page loader or calculate its own analytics. It must not contain a second `calculateTrend`, `calculateConfidence`, `calculateConsistency`, recommendation engine, readiness inference or generic insight ranking.

A mature Home may project:

- latest session identity + admitted session read + evidence/coverage;
- 0–2 admitted Progress findings with maturity/confidence/provenance;
- canonical active goal evidence vs target;
- at most a small conditional attention projection from the owning system;
- compact recent-session navigation;
- optional peer context, achievement or real coach communication where appropriate.

But these are **not permanent dashboard cards**. Absence of evidence should remove content, not create filler.

### Home attention principle

Priority should follow source authority, for example material evidence/data-quality issue → actual coach communication → admitted Progress finding worth investigation → goal milestone → setup evidence ready → achievement. If nothing deserves attention, show nothing.

Do not label everything “AI insight”. Identify provenance: **From JNSPRO evidence**, **From Coach [name]**, setup evidence, goal evidence, etc.

## 21. Immediate continuation plan for a new conversation

Do **not** restart archaeology broadly.

1. Fetch current `release3-progress-clean-sheet` head before any work.
2. Read this handoff plus the current Release 3 Progress/Sessions contracts.
3. Reconcile only files that changed after this document's baseline or areas explicitly marked unresolved.
4. Before another Home visual, define the **rider lifecycle/orientation model** from current implementation: what setup is truly required for useful ingest/analysis, what is optional/enriching, what can be completed later, and what Home should surface when missing.
5. Then produce Home state/content specifications across lifecycle × evidence maturity, not only an established rider.
6. Use a mock-up gate before production Home implementation.
7. Keep Reports on the old engine until Progress + Sessions contracts are complete; then migrate Reports to the same authorities.
8. Separately harden privacy/disclosure seams: Social publication, minor disclosure, research historical authority/consent, leaderboard immediate opt-out.
9. Do not claim CI green without checking the exact final-head workflow/logs.

## 22. Working discipline

- Always fetch branch head before modifications.
- Do not force/update refs unsafely.
- Treat independent branch movement as new evidence; inspect before writing.
- Mock-up/design docs do not authorize production changes by themselves.
- Preserve exact source semantics and provenance.
- Prefer explicit unavailable/building states over fabricated certainty.
- When implementation and this handoff conflict, investigate using the hierarchy at the top rather than assuming either is automatically right.

The aim of Release 3 is not simply a cleaner UI. It is a coherent BMX gate-start product in which every important claim has an identifiable evidence owner, every disclosure has an identifiable access authority, and every screen presents that truth at the appropriate depth without silently inventing another analytics system.
