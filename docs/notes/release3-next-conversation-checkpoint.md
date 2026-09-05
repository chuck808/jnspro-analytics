# Release 3 next-conversation checkpoint

Start with `docs/notes/release3-whole-product-architecture-handoff.md`. It preserves the whole-product archaeology and should prevent a broad re-audit.

## Non-negotiable interpretation rule

Current Release 3 contracts/recent implementation → canonical services/data → current consumers → recent tests → recent notes → older code/docs only as archaeology.

Do not conflate old implementations with current product truth.

## Current design checkpoint

Do **not** implement or redraw Home from the established-rider mock-up yet. It was too narrow: it assumed a fully configured rider immediately after a clean session.

Home's corrected question is:

> What state is my JNSPRO training system in, what is ready for me now, what happened recently if usable evidence exists, what genuinely deserves attention, and where should I go next?

Before another Home mock-up, establish the rider lifecycle/orientation model from current code:

- what account/safeguarding state permits protected access;
- which rider/profile fields are genuinely required versus enriching;
- which bike/setup fields are required for ingest versus richer physics;
- whether ingest can occur before profile/bike completion and how degradation is represented;
- how training context/run classification is captured and when;
- what setup gaps Home should surface versus leave to Profile;
- how no-session, building-evidence and established-evidence states differ;
- what is optional: Goals, coach link, benchmarking, leaderboard, research, Social/video.

Do not invent `onboarding_complete`: the archaeology did not establish a canonical formal onboarding state machine.

## Product boundaries to preserve

- Home owns orientation, not analytics truth.
- Overview owns session interpretation.
- Analysis owns selected-run evidence.
- Deep Dive owns technical proof.
- Progress owns longitudinal development.
- Goals owns target + canonical evidence projection.
- Compare separates personal development, peer benchmark and optional competitive leaderboard.
- Social recognition is not publication consent.
- Coach access is consent-limited and report sharing is rider-pushed.
- Reports remain old-engine migration inventory until Sessions + Progress contracts complete.
- Research consent is separate disclosure authority.
- RideFeel is subjective rider context, not readiness/resilience/psychology/physiology.
- Competition run means race-effort/maximal simulation in training, not proof an actual race occurred.

## Known privacy/correctness seams still open

- Social private/public share authority and minor sharing.
- Leaderboard minor publication policy and immediate opt-out propagation/view authority.
- Research historical profile/category authority, consent-history scope and minor-specific research consent.
- Guardian invite resend/failed-delivery recovery and age-out semantics.
- Safeguarding DOB versus versioned performance-profile DOB.
- Video replacement/orphan/metadata/duration lifecycle.
- Session narrative calibration-warning wiring.
- Old goal adaptation/health and recommendation engines leaking into current paths.

## Repo discipline

Always fetch `release3-progress-clean-sheet` head before writes. This checkpoint was created immediately after the comprehensive handoff; inspect branch movement before continuing. Do not claim CI green unless the exact final-head run completed successfully.
