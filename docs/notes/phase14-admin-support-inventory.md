# Phase 14 — Admin, research, help and supporting surfaces inventory

Status: inventory complete; no runtime changes in this commit.

## Purpose

Phase 14 is the supporting-surface pass after the rider, session, progress, compare, upload/video and coach journeys were made coherent. The first question is deliberately not visual: **what does `/feedback` actually belong to?**

## `/feedback` ownership — resolved

`/feedback` is not a rider feedback page. It is an **admin feedback inbox/triage screen**.

Evidence from the current implementation:

- the route lives inside the `(admin)` route group and is therefore protected by the admin layout;
- its server loader uses `requireAdminFromProfile()` again for defence in depth and reads all rows from the `feedback` table with an admin client;
- the page exposes platform-wide feedback counts, filters, admin notes and status transitions;
- the only navigation link to the page is in the Admin sidebar under `Research & feedback`;
- ordinary riders submit feedback through the global `FeedbackButton` -> `POST /api/feedback`; they do not navigate to `/feedback` to manage it;
- `/admin/feedback-analytics` is a separate aggregate/insight surface over feedback, not the inbox itself.

Therefore the canonical route should be **`/admin/feedback`**. The current URL is an historical routing accident caused by putting an admin-only page in an `(admin)` route group without the `/admin` path segment.

### Why the current route is a real product seam

Workspace detection is intentionally path-based. `/feedback` does not start with `/admin`, so opening the admin-only feedback inbox makes the authenticated shell switch back to the Rider workspace even though the `(admin)` layout still enforces admin permission. The security boundary is correct; the navigation/product boundary is wrong.

### Planned correction

1. Move the inbox to `/admin/feedback` without changing its data contract or permissions.
2. Change the Admin sidebar destination to `/admin/feedback`.
3. Preserve `/feedback` as an admin-protected redirect to `/admin/feedback` for old bookmarks/history rather than silently turning it into a rider route.
4. Keep `FeedbackButton` and `POST /api/feedback` as the rider/public submission mechanism.
5. Keep `/admin/feedback-analytics` distinct: inbox = operational triage; analytics = aggregate patterns.

No database migration or RLS change is required for this ownership correction.

## Feedback model inventory

There are two different feedback concepts and they should not be conflated:

### Product/support feedback

- table: `feedback`;
- submission: `FeedbackButton` -> `/api/feedback`;
- types: bug, feature, feedback, question;
- admin workflow: new -> in progress -> resolved/closed, with admin notes;
- owner: Admin / support operations.

### Performance-insight feedback

- separate `insight_feedback` data and `performance-feedback` / `performance-feedback-analytics` code;
- used to evaluate the quality/usefulness of generated performance insights;
- owner: product/research quality, surfaced through feedback analytics rather than the support inbox.

The Phase 14 UI should make this distinction clearer rather than merging the datasets because both happen to contain the word “feedback”.

## Admin workspace — current shape

Current navigation is already grouped sensibly at a high level:

- Overview
- People & access
- Performance & benchmarking
- Research & feedback
- System

The main Phase 14 problem is less “missing pages” than **operational hierarchy and historical language**. The admin home still contains legacy feature-era framing such as “Quick Access to New Features”, “Phase 5 Features”, and product-development labels that describe when something was built rather than what an administrator needs to do now.

### Admin pass questions

For each admin surface classify it as:

- **operate** — something requiring routine action/attention;
- **inspect** — system/population evidence for diagnosis;
- **configure** — thresholds/templates/content/system controls;
- **research** — controlled export/data-quality work.

Then reorganise presentation around those jobs without changing permissions merely for convenience.

## Research boundary

The existing research goal remains: support legitimate controlled access to anonymised historical BMX data while preserving privacy and evidence quality.

Phase 14 must not turn the admin research screen into an unrestricted “download everything” convenience feature. Research export must continue to consume canonical eligibility/evidence rules established in Release 1. Any change to anonymisation, inclusion rules or access scope is a correctness/privacy change and must be tested separately from visual restructuring.

## Help/supporting/public surfaces

The remaining supporting surfaces should use the same product language as the renovated authenticated application:

- Help should answer tasks/questions rather than expose implementation history;
- About/public Home should describe the current product, not obsolete feature phases;
- feedback/support entry points should have one clear meaning;
- admin Help FAQ management is a content-management surface, while rider Help is a consumption surface;
- public/supporting pages should not imply video is required or replace the hardware live dashboard with the analytics application.

## First implementation slice

Keep the first slice intentionally small and falsifiable:

1. canonicalise the feedback inbox at `/admin/feedback` with a protected legacy redirect;
2. update Admin navigation so the workspace remains Admin throughout;
3. make no feedback data-model or permission changes;
4. verify admin/non-admin access, legacy redirect, active sidebar state, feedback filtering/update, desktop/mobile.

Only after that route-ownership seam is closed should the broader Admin home/navigation hierarchy be redesigned.
