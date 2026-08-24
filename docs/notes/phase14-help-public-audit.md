# Phase 14 — Help and public/supporting pages audit

Status: implementation slice in review.

## Scope reviewed

- Protected `/help` FAQ and quick actions
- Public `/contact`
- Public landing page
- Public `/about`
- Public `/privacy` and `/terms` at a consistency level only
- Linked `/docs` guide as a separate follow-up surface
- Carried-forward Admin Home `Avg Sessions/User` SVG-path defect

## Corrections in this slice

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

The page now submits to the existing `/api/feedback` endpoint, which already supports unauthenticated feedback and feeds the canonical Admin feedback inbox. Contact topics map onto the existing feedback taxonomy (`bug`, `feature`, `question`, `feedback`). The UI reports success only after the endpoint accepts the message, shows an inline failure state otherwise, and points directly to `support@jnsprosystems.com` as fallback.

The unsupported `24–48 hours` response-time promise was removed rather than replaced by another arbitrary SLA.

## Reviewed, no change in this slice

### About

The About page is aligned with the current product philosophy: preserve evidence and context, expose uncertainty, support rather than replace rider/coach judgement, and progressively disclose analytical complexity.

### Privacy / Terms

No legal copy is being edited merely for stylistic consistency. A legal/privacy change needs a concrete product or policy contradiction, not a Phase 14 language preference.

### Public landing page

The overall product journey and direct-Wi-Fi/SD fallback language are current. Several hardware/validation claims require explicit device-side evidence before they should be strengthened or removed, notably `UCI-compliant`, `200Hz IMU`, `±1ms` reaction accuracy, and the exact metrics-per-run claim. They are recorded for hardware validation rather than silently rewritten from application-code inference.

## Separate follow-up: `/docs`

The linked full guide is materially stale and needs its own correction slice. Examples already confirmed:

- Upload chapter describes manual SD as the whole normal journey and says a required run can fail while the rest of a session still imports; Phase 11 instead uses a shared Wi-Fi/manual ingest path and rolls back the session on required run/gate failure.
- Leaderboard chapter still exposes Week/Month filters, raw-rank/percentile framing, and old opt-in assumptions that Phase 10 replaced with separate peer benchmarking and all-time competitive ranking.
- Session chapter contains pre-Phase-6/7 Analysis/Deep-Dive hierarchy and older video-sync wording.

Because `src/lib/docs/contents.ts` is generated from `docs/chapters/*.md`, that follow-up must update the chapter sources and regenerate the output together rather than hand-edit the generated file.

## Carried-forward cleanup

`src/routes/(protected)/(admin)/admin/+page.svelte` still contains the independently reproduced malformed SVG path for the `Avg Sessions/User` stat icon. It predates the Admin Home hierarchy PR and remains a small explicit cleanup item. It should be fixed without unrelated Admin formatting changes.

## Verification target for this slice

- `svelte-check`
- `tsc --noEmit`
- `vitest`
- production build in CI
- Help desktop/mobile and FAQ expansion
- Help stale-claim string check
- Help support links use `support@jnsprosystems.com`
- unauthenticated Contact success creates a real `feedback` row with `user_id = null` and submitted email
- authenticated Contact success records the signed-in user through the existing endpoint
- bug / feature / question / general topic mapping
- forced Contact endpoint failure stays on the form and shows an error instead of false success
- Contact mobile

No database, RLS, feedback-table, or Admin-inbox behavior is changed by this slice.