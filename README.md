# AppGatePro Analytics

Gate start analytics for BMX riders and coaches. AppGatePro turns 200Hz IMU
data captured at the gate — reaction time, G-force, technique — into
session analysis that says what it can responsibly conclude from the data,
not just what happened.

Built with [SvelteKit](https://kit.svelte.dev), [Supabase](https://supabase.com)
(Postgres + Auth + RLS), and [Tailwind CSS](https://tailwindcss.com).

## Features

- **Session analytics** — reaction time, peak G-force, speed curve, technique
  scoring, and consistency metrics per run, with cross-session trend tracking.
- **Setup-change detection** — automatically flags when a rider's bike or
  biometrics changed since their last session, so performance shifts can be
  read in context.
- **Coaching** — an application/vetting flow for becoming a coach, rider
  invites and consent, rosters, and report sharing.
- **Goals & leaderboards** — rider-set training goals with progress tracking,
  opt-in club/team leaderboards.
- **Docs** — an in-app documentation site at `/docs` covering session data,
  analytics, goals, uploading, profile setup, coaching, and troubleshooting.

## Project structure

```
src/routes/
  (public)/        marketing site — home, about, contact, privacy, terms
                    (shared SiteHeader/SiteFooter, src/lib/components/public/)
  (protected)/      the logged-in app — dashboard, sessions, analytics,
                    goals, profile, settings, leaderboard
    (admin)/        admin-only routes, gated in +layout.server.ts
    (coach)/        coach-only routes, gated on profiles.coach_status
  auth/             sign-in / sign-up / password reset
  docs/             documentation site, own visual design
  api/              device ingest + server endpoints

src/lib/
  performance-engine/   session analysis, cross-session comparisons,
                        setup-change detection
  server/               server-only helpers (coach applications, etc.)
  components/           shared UI components
  docs/                 documentation content (chapters)

supabase/
  migrations/       Postgres schema, RLS policies, functions
  templates/        auth email templates (dev only — see below)
```

Route groups in parentheses (`(public)`, `(protected)`, `(admin)`, `(coach)`)
are organizational only and never appear in the URL — this is a standard
SvelteKit convention.

## Getting started

**Prerequisites:** Node 20+, [pnpm](https://pnpm.io), and a
[Supabase](https://supabase.com) project.

```bash
pnpm install
cp .env.example .env.local   # fill in your Supabase project's URL and keys
pnpm dev
```

The app runs at `http://localhost:5173`.

### Environment variables

See `.env.example` for the full list with descriptions. At minimum you need:

| Variable                     | Where it's used                          |
| ----------------------------- | ----------------------------------------- |
| `PUBLIC_SUPABASE_URL`         | client + server                           |
| `PUBLIC_SUPABASE_ANON_KEY`    | client + server                           |
| `SUPABASE_SERVICE_ROLE_KEY`   | server only — never expose to the client  |
| `DEVICE_INGEST_SECRET`        | authenticates device session uploads      |

`PUBLIC_SENTRY_DSN` and `PUBLIC_POSTHOG_KEY` are optional; the app runs fine
without them.

### Database

Schema and RLS policies live in `supabase/migrations/`. Apply them to your
Supabase project via the Supabase CLI or dashboard SQL editor, in order.

Auth email templates in `supabase/templates/` only take effect for the local
Supabase CLI dev stack (`supabase start`) — for a hosted project, copy their
content into **Authentication → Email Templates** in the Supabase dashboard
manually.

## Scripts

| Command            | Description                                  |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | Start the dev server                          |
| `pnpm build`        | Production build                              |
| `pnpm preview`      | Preview the production build locally          |
| `pnpm check`        | Type-check (`svelte-check`)                   |
| `pnpm lint`         | Check formatting and lint rules               |
| `pnpm format`       | Auto-format with Prettier                     |
| `pnpm test`         | Run the test suite (Vitest)                   |

## Deployment

Deployed via `@sveltejs/adapter-vercel` (see `vercel.json`). Set the same
environment variables in your Vercel project settings as in `.env.local`.
