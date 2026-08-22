# Phase 12 — Optional video experience inventory

Status: inventory complete on `phase12-video-inventory`; runtime correctness work next.

## Product invariant

Video is **optional supplementary evidence**. Sensor evidence, Overview, Analysis and Deep Dive must remain complete without a video. A rider may attach video to one run, several runs, or none.

The synchronization cue is the external hardware Lights unit showing a **full-white background for 120 ms**, when that feature is enabled. The cue begins at the same gate-zero event used by the recorded reaction-time clock. It is **not a GoPro flash** and must not be described or detected as one.

## Existing implementation

The web-side foundation is already substantial:

- `run_videos` stores one optional attachment per run;
- the private `run-videos` Storage bucket holds MP4/MOV files;
- `RunVideoAttachment.svelte` owns attach/replace/remove;
- `/api/runs/[id]/video` finalizes metadata and deletion;
- session layout loading mints signed URLs;
- `videoSync.ts` performs local browser luminance analysis;
- a non-null `sync_offset_s` enables `RunVideoHero`;
- the hero aligns the run clock with `currentTime - sync_offset_s`, overlays restrained telemetry, and uses a merged video/G-force scrub bar;
- unsynced video falls back to ordinary playback;
- Analysis remains complete without video and only surfaces video when the selected run has it.

This placement already respects the renovation principle: video does not replace charts or become a prerequisite.

## Correctness blockers found

### 1. The detector models a one-frame flash, not the real 120 ms full-white pulse

`videoSync.ts`, its tests, migration comments and `VIDEO_SYNC_DESIGN.md` still use "flash-frame" terminology and assumptions. The current pure detector looks for a large luminance rise followed by a quick decay, which is broadly compatible with a finite pulse, but the refinement step chooses the **brightest sampled frame**.

That is wrong for the actual hardware cue. Gate zero is the **leading edge** of the 120 ms full-white period. Choosing the brightest frame can land anywhere inside the white plateau and shift all video telemetry/event overlays later than the recorded run clock.

Phase 12 must detect/refine the leading edge of a finite white pulse and test the actual pulse shape, not an isolated spike.

### 2. The current decay rule is sample-count based

The coarse scan is 100 ms/sample and the fine scan is 20 ms/sample, while the cue lasts 120 ms. A fixed "decay within two samples" means different physical durations depending on scan resolution. A real pulse that spans several fine samples can therefore be rejected even though the same pulse passes coarse detection.

Pulse validation should be time-window based, using the sample timestamps, so the same hardware event has the same meaning at both resolutions.

### 3. Replacement can leak old Storage objects

Attachment uses `${userId}/${runId}/${file.name}` with Storage `upsert: true`. The metadata endpoint upserts the single `run_videos` row but does not remove the previous object's `storage_path` when a replacement uses a different filename.

Result: the database correctly points at one video while old bytes can remain indefinitely in the private bucket.

### 4. Metadata finalisation failure can orphan the newly uploaded object

The browser uploads video bytes first, then POSTs metadata. If that POST fails, the catch path shows an error but does not remove the object that was just uploaded. The database remains honest, but Storage accumulates an unreferenced file.

A replacement with the same filename is worse: `upsert: true` can overwrite the previously working bytes before metadata finalisation succeeds.

Use a unique object path per attachment attempt, finalize metadata, then clean the previous object only after the DB row points at the new one. If finalisation fails, best-effort delete the new object.

### 5. Metadata validation is weaker than the sync contract

The API only checks that `sync_offset_s` is a number. It does not require a finite, non-negative offset or ensure the offset is inside the decoded video duration. `duration_ms` is likewise not strongly validated.

The browser normally sends sensible values, but server metadata should not admit impossible sync state.

## Non-blocking seams / deliberate constraints

- Signed URLs expire after one hour; a very long-open tab may need reload before replay. This is not a Phase 12 correctness blocker for trial use.
- Client-side video decoding/Canvas seeking remains best-effort. A failed detector must continue to produce ordinary playback rather than block attachment.
- Camera BLE control/recording bracket belongs to the external hardware/firmware system. This analytics repo should consume an attached clip and the visible hardware cue; it should not pretend the web app controls the GoPro.
- `status`/thumbnail fields are currently lightly used/reserved. Do not expand them simply to make the schema look complete.

## Phase 12 hierarchy

1. **No video** — unchanged analytical experience plus a low-key Add video action.
2. **Attach** — validate file, upload safely, analyze the optional sync cue locally, finalize metadata.
3. **Unsynced attachment** — ordinary video playback, with no false claim of synchronized telemetry.
4. **Synced attachment** — video hero may align recorded evidence to the run using the detected hardware-pulse leading edge.
5. **Replace/remove** — transactional-enough lifecycle that leaves one referenced object and no avoidable orphan bytes.

## First implementation slice

Correctness before visual work:

1. replace flash/spike semantics with a 120 ms full-white pulse model;
2. make pulse qualification time-based and return the leading edge;
3. add regression tests for a finite ~120 ms plateau, noise, sustained lighting changes and leading-edge accuracy;
4. use unique Storage object paths for attachment attempts;
5. clean a failed new upload if metadata finalization fails;
6. after successful replacement, remove the old object if its path changed;
7. validate duration/sync metadata as finite and physically possible;
8. preserve unsynced plain playback and video-absent behaviour.

## Verification matrix

Static first: `svelte-check`, `tsc --noEmit`, Vitest, production build.

Then live/browser where practical:

1. no video — Analysis remains complete and low-key Add video affordance remains;
2. valid MP4 attach with detectable hardware-style white pulse;
3. detected offset aligns to the **start** of the white period, not its brightest/middle frame;
4. finite 120 ms pulse accepted;
5. sustained brightness change rejected;
6. no usable cue -> attachment still succeeds as unsynced plain playback;
7. replace with a different filename -> old Storage object removed after successful finalization;
8. forced metadata-finalization failure -> new object cleaned and prior attachment preserved;
9. remove attachment -> DB row and referenced Storage object removed;
10. invalid/negative/out-of-range sync metadata rejected by API;
11. 390 px playback/attachment flow;
12. run switching does not carry one run's video/sync state onto another run.
