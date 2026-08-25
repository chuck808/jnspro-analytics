# Phase 14 — Help and public/supporting pages audit

Status: implementation complete; CI verified. Live browser/database verification remains environment-dependent and is listed below.

## Scope reviewed

- Protected `/help` FAQ and quick actions
- Public `/contact`
- Public landing page
- Public `/about`
- Public `/privacy` and `/terms` at a consistency level only
- Linked `/docs` guide and generated docs bundle
- Carried-forward Admin Home `Avg Sessions/User` SVG-path defect

## Corrections completed

### Help accuracy

The Help page had accumulated several statements that no longer matched the verified product:

- manual SD import was described as CSV-first instead of the current JSON fallback to direct Wi-Fi ingest;
- profile completion was described as mandatory before upload;
- leaderboard copy described a last-30-days model that Phase 10 removed;
- session deletion was described as admin-only even though self-service deletion exists;
- CSV/JSON export claims did not match the current Sessions CSV export surface;
- an offline/cache mode was claimed despite there being no supported offline implementation;
- support used the obsolete `support@appgatepro.com` address and promised a fixed response time;
- coach visibility copy predated the Phase 13 consent boundary;
- fixed rider-performance bands were presented as universal truth despite the product now preferring eligible personal history and sufficiently populated peer cohorts;
- technique-score copy described four dimensions while the detailed product surface uses six.

The updated FAQ now describes current behavior and keeps evidence-quality caveats explicit.

### Public Contact form

The public Contact page looked functional but had no route action/backend. Its own footnote described it as a demo form. The enhanced POST therefore had no legitimate delivery path.

The page now submits to the existing `/api/feedback` endpoint, which supports unauthenticated feedback and feeds the canonical Admin feedback inbox. Contact topics map onto the existing feedback taxonomy (`bug`, `feature`, `question`, `feedback`). The UI reports success only after the endpoint accepts the message, shows an inline failure state otherwise, and points directly to `support@jnsprosystems.com` as fallback.

The endpoint attributes an authenticated submission to the signed-in user and otherwise stores `user_id = null` with the submitted email. No database, RLS, feedback-table, or Admin-inbox schema behavior was changed.

The unsupported `24–48 hours` response-time promise was removed rather than replaced by another arbitrary SLA.

### Full `/docs` guide

The stale guide follow-up is complete in both its markdown sources and generated application bundle.

- Upload now describes the shared device/manual JSON ingest path, source-evidence deduplication, required run/gate rollback, optional timeseries degradation, and non-blocking rider/bike profile linkage.
- Compare now separates anonymised peer benchmarking from opt-in competitive ranking, documents the all-time ranking model, removes Week/Month claims, and describes cohort/sample-size and eligibility boundaries.
- Session now reflects the renovated Overview / Analysis / Deep Dive responsibilities, evidence-first diagnostics, six technique dimensions, report/privacy boundary, and the Phase 12 video-sync contract: an optional ~120 ms full-white Lights-unit pulse at gate-zero whose leading edge is the sync anchor.

`src/lib/docs/contents.ts` was regenerated from `docs/chapters/*.md` with the repository's canonical `scripts/generate-docs.py`; the generated file was not hand-edited.

### Admin Home cleanup

The independently reproduced malformed SVG path for the `Avg Sessions/User` stat icon was replaced with a valid bar-chart path. No unrelated Admin Home formatting or behavior was changed.

## Reviewed, no change

### About

The About page remains aligned with the current product philosophy: preserve evidence and context, expose uncertainty, support rather than replace rider/coach judgement, and progressively disclose analytical complexity.

### Privacy / Terms

No demonstrable application-code contradiction was found that justified a legal-copy edit in this phase. The existing consent language is broad enough to cover user-directed sharing, account deletion and CSV portability remain supported, and the product continues to treat private session notes separately from coach-shared reports.

Legal copy was therefore left unchanged rather than edited for stylistic consistency.

### Public landing page

The overall product journey and direct-Wi-Fi/SD fallback language are current. Several hardware/validation claims still require explicit device-side evidence before they should be strengthened or removed, notably `UCI-compliant`, `200Hz IMU`, `±1ms` reaction accuracy, and the exact metrics-per-run claim. They remain recorded for hardware validation rather than being rewritten from application-code inference.

## Verification completed

GitHub CI on the completed implementation passed the required `verify` job:

- dependency install with the frozen lockfile;
- `pnpm check`;
- `pnpm test`;
- `pnpm build`.

The repository's separate informational lint job still fails at its Prettier stage across the existing formatting backlog. This job is intentionally `continue-on-error` and is not a Phase 14 merge gate. Phase 14 changed files appear among that broader backlog, so no repository-wide formatting pass was folded into this audit.

Static/source verification also confirmed:

- Help uses the current support address and current product semantics;
- Contact subject mapping and success/error behavior match `/api/feedback`;
- `/api/feedback` supports unauthenticated and authenticated attribution as described;
- generated docs contain the corrected Upload, Compare, and Session chapters;
- the Admin `Avg Sessions/User` icon now uses the repaired path;
- Privacy/Terms/About were re-read after the implementation slices rather than assumed from the earlier audit note.

## Live verification still environment-dependent

The branch's Vercel preview currently fails before application startup because the preview environment is missing required Supabase/device-ingest environment variables. That is separate from the application changes; GitHub CI supplies format-valid placeholders and completes check/test/build successfully.

Because the branch preview is not runnable in that environment, these interactive checks have not been claimed as completed:

- Help desktop/mobile rendering and FAQ expansion;
- Contact desktop/mobile rendering;
- a real unauthenticated Contact submission creating a `feedback` row;
- a real authenticated Contact submission recording the signed-in user;
- forced live endpoint failure presentation.

Those are deployment/live-environment verification items, not known implementation gaps in the Phase 14 source.
