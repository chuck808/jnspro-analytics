# Phase 12 — Video experience — SIGNED OFF

Phase 12 is complete and merged to `master` as `30949d3`.

## Product invariant

Video remains optional supplementary evidence. Sensor data, charts, and analytics are complete without it.

## Synchronisation truth model

The sync cue is the external hardware Lights unit displaying a full-white background for approximately 120 ms at gate-zero. It is not a GoPro flash.

The web detector:

- detects a finite brightness pulse rather than a one-frame flash;
- validates return toward baseline using elapsed time rather than sample count;
- anchors `sync_offset_s` to the leading edge/onset of the white pulse;
- falls back to ordinary playback when no trustworthy cue is found.

Live verification used a real MP4 with a generated 120 ms white pulse beginning at exactly 2.000 s. The detector returned `sync_offset_s: 2.01`, within one 20 ms fine-scan step of the correct leading edge.

## Upload/auth architecture

The app uses httpOnly auth cookies, so browser JavaScript cannot perform ordinary authenticated Supabase Storage writes with the rider session.

Video upload therefore uses a server-issued signed upload token:

1. authenticated server route verifies run ownership and validates file metadata;
2. server issues a short-lived signed upload token for a unique object path;
3. browser sends video bytes directly to Supabase Storage with `uploadToSignedUrl()`;
4. metadata finalisation is performed through the authenticated application API.

This keeps large video bytes out of the Vercel request body without weakening the httpOnly-cookie security model.

## Lifecycle safety

- replacement uploads use unique object paths;
- a failed replacement cannot overwrite the currently working clip;
- failed metadata finalisation leaves the old DB row unchanged and cleans the new unfinalized Storage object through an authenticated server route;
- after successful replacement, metadata switches first and the previous object is retired afterward;
- delete failures keep the DB reference so deletion is retryable instead of knowingly orphaning bytes;
- invalid duration, negative sync offsets, and offsets beyond video duration are rejected.

## Verification baseline

- `svelte-check`: 0 errors, 1 pre-existing unrelated warning;
- `tsc --noEmit`: clean;
- Vitest: 124/124;
- production build: green.

Live matrix verified with a throwaway rider and real files:

- successful first attachment;
- 120 ms pulse leading-edge sync;
- replacement and old-object retirement;
- forced metadata-finalisation failure preserving the working attachment and cleaning the failed attempt;
- deletion;
- no-cue plain-playback fallback;
- run switching;
- mobile layout and playback.

Operational note: deleting an auth user does not cascade-delete Supabase Storage objects. Test teardown handled this manually. This is platform behaviour rather than a Phase 12 application regression.

## Next

Phase 13 — Coach workspace.

Start with an inventory of current coach access, rider-link/consent semantics, reports, navigation, and what coaches can already read or act on. Preserve rider/parent ownership and deliberately narrower coach access. The analytics application should complement, not replace, the separate hardware system's live club-session dashboard and per-device live report.
