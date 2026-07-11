# Synced Video — Design Doc

**Status:** Proposed — not yet implemented. This document captures a design conversation; nothing described here exists in code yet, on either the firmware or web sides. Update the status line when work actually starts.

**Repos involved:**

- `jns-pro-controller` (firmware, M5Stack CoreS3 / ESP32-S3) — camera trigger, recording bracket, BLE integration.
- `jnspro-analytics` (this repo) — video attachment, storage, sync detection, playback UI.

---

## 1. Why

The platform's whole premise is capturing as much raw data as possible and letting the rider/coach decide what's useful, rather than deciding for them up front. Numeric analytics (reaction time, G-force, speed, technique score) already does this well, but a number alone doesn't show _what happened_ — synced video closes that gap, for the grom just learning wheel control as much as for the elite rider optimizing a 1.7-second start. This has been treated as a "vital option," not a nice-to-have, since the earliest product review in this engagement — the reason it stalled wasn't value, it was two open engineering questions: how do you trigger/sync a camera against a run that's over in under two seconds, and how do you avoid drowning the pipeline in video nobody asked for. Both are addressed below.

---

## 2. Camera integration

### 2.1 Why not ESP-NOW

ESP-NOW (used today to fan out to the Gate/Lights/Timer external units) is Espressif's proprietary protocol — it only works between ESP32/ESP8266 devices running the same stack. No commercial action camera can join that mesh. Camera control has to happen over a protocol the camera itself actually speaks.

### 2.2 Chosen path: GoPro, over Open GoPro (BLE)

[Open GoPro](https://gopro.github.io/OpenGoPro/) is a genuinely open, documented BLE + WiFi control spec, explicitly designed for third-party devices to trigger it — this is the same mechanism FPV/motorsport rigs already use. DJI Osmo Action and Insta360 have no comparable embedded-friendly control API (their SDKs target mobile apps, not a BLE client on a microcontroller); chasing multi-brand support now would mean months of reverse-engineering for no real gain. Build against GoPro first; keep the trigger interface in firmware pluggable if other brands become worth it later.

The firmware already has the right building block: `lib/CommonBLEManager` is a working BLE _client_ (currently used for third-party GATT peripherals, e.g. cycling speed/cadence sensors). Adding GoPro control is a new peripheral type on a radio stack that's already proven, not new capability.

### 2.3 Pairing

New screen under **Gate Settings → Camera**, mirroring the existing BLE device-pairing flow: scan for Open GoPro BLE advertisements, connect, save for auto-reconnect — same UX pattern riders already know from pairing Gate/Lights/Timer.

---

## 3. Recording trigger and bracket

### 3.1 The core problem

A BLE "start recording" command has real latency/jitter (order of hundreds of ms, not deterministic). An elite run covers 10m in ~1.7s. Triggering "start" at the same instant as gate release (like the ESP-NOW fan-out to Gate/Lights/Timer) would risk missing the start of the run entirely. The fix is to stop treating this as a hard real-time trigger problem and split it into two separate concerns: **when to record** (loose timing, solved by pre-arming) and **when the run actually started** (frame-accurate, solved separately in §4).

### 3.2 Start: on `STATE_GATE_ARMED`

Fire the BLE start-recording command the moment the gate arms — before the random delay and light sequence even begin. Camera is rolling well before the run starts, so trigger jitter doesn't matter. Combine with GoPro's **HindSight** pre-roll buffer mode so even the arming moment itself is covered without needing perfect timing.

### 3.3 Stop: on beam break (`FinishRace()` / `HandleStateBeamBroken`)

Confirmed with the repo owner: "the rider triggers the stop" refers to the JNS_Timer beam break — i.e., stop recording automatically the instant `FinishRace()` fires, _before_ the 5-second results-screen delay and before the idle/chat period that follows (rider talking to a coach or parent between runs must never be recorded). This uses the existing state machine as-is; no new UI control needed.

### 3.4 Result: one clip per run, not one clip per session

Because start/stop bracket tightly to armed→beam-break, each gate produces its own short, discrete video file — not one long session recording with in/out markers. This also means video is naturally a **per-run** asset in the data model, not a per-session one (see §5).

---

## 4. Frame-accurate sync

### 4.1 Mechanism

The same ESP-NOW broadcast that fires Gate/Lights/Timer at gate release also fires a bright flash — either on the existing Lights unit or a small dedicated in-frame marker — for one frame, at the exact instant reaction time = 0. This is camera-agnostic (works with any camera, no API needed for the sync itself) and gives frame-accuracy that no BLE trigger command could guarantee anyway, since it's derived from the same hardware-timed event that produces the reaction-time measurement itself.

### 4.2 Detection: client-side, at attach time (v1)

When a rider/coach attaches a video clip on the website, detect the flash frame in-browser: decode via `<video>`/`<canvas>`, scan frames for a luminance spike, store the resulting offset (seconds from clip start) against the run. No new server-side video-processing infrastructure required for v1.

**Deferred, not required for v1**: server-side detection (more robust across devices/browsers, but real infrastructure — a processing pipeline, likely outside Supabase Edge Functions' Deno runtime given video decode needs). Revisit only if client-side detection proves unreliable in practice (mobile Safari's `<video>`/`<canvas>` behavior is the most likely source of trouble worth watching for).

---

## 5. Upload & storage model

- **Sensor data pipeline is unaffected.** The existing device → `request-upload-url` → Storage → `process-device-upload` → `/api/device-ingest` path (see `DATA_PIPELINE_TECHNICAL_SPECIFICATION.md` and `src/lib/services/ingest.ts`) keeps working exactly as it does today, uploading automatically every session.
- **Video does not travel that path.** It stays on the camera's own storage (SD card / GoPro's onboard media) and gets pulled selectively — at the track over the camera's own WiFi media API, or later at home — only for the runs someone actually wants to keep. This matches the "capture everything, let the user decide what's useful" principle, applied to _when_ the transfer happens rather than _whether_ the data exists at all.
- **Attachment is per-`run_id`**, matching the one-clip-per-run bracketing in §3.4. Rough schema shape (not a committed migration — needs its own review pass when this moves to build):
  - A storage bucket (e.g. `run-videos`), analogous to the existing `device-uploads` bucket.
  - A reference table/columns keyed by `run_id`: storage path, detected sync-offset-seconds, duration, maybe a thumbnail path (candidate: frame at peak-G, since that's likely to be a compelling poster image).

---

## 6. Web UI integration

### 6.1 Guiding constraint

Not everyone will use video, and those who do won't attach it to every run. The feature must be **additive-only**: zero cost (visually or functionally) to riders who never pair a camera, and no assumption of full-session coverage for those who use it selectively.

### 6.2 Sessions list (`/sessions`)

Unchanged, except a small camera-icon badge on rows where at least one run has video. Absent entirely for accounts that never use the feature.

### 6.3 Session overview (`RunComparison` table, `/sessions/[id]`)

Same treatment: a small play-icon per row, only where that specific run has video. No page-level "this session has video" framing that would imply uniform coverage.

### 6.4 Run detail (`/sessions/[id]/detail`)

**For a run with video attached**, the page leads with the video as its hero, ahead of today's `RunComparison` → `PerformanceTargets` → G-Force Stability → `DataDrillDown` ordering (which still follows below, unchanged, for anyone who wants to go deeper or compare runs).

The hero is not a plain player:

- **Merged scrub bar**: the video's seek control _is_ the G-force/speed trace rendered as its timeline background — scrubbing the video scrubs the chart and vice versa, because they're the same control, not two components kept in sync. This is genuinely new interactive plumbing (today's `DataDrillDown` is a static expandable table with no live time-cursor state) — worth calling out as real build effort, not just embedding a `<video>` tag.
- **HUD overlay, three tiers**, deliberately restrained:
  1. **Persistent corner stats** (visible throughout, max 3): reaction time, peak speed, technique score.
  2. **Live telemetry** (updates with scrub/playhead position, positioned near the merged scrub bar): current G-force, current speed.
  3. **Event-triggered callouts** (flash at the exact frame, using the frame-accurate sync from §4): e.g. "PEAK G: 1.87" at the `max_g` frame, "FRONT WHEEL LIFT" at the frame `front_wheel_lifted` becomes true.
- **Deliberately excluded from the HUD**: avg G, avg speed, avg pitch, impulse/jerk, power. These remain in the existing breakdown sections below the hero — adding them to the overlay would push it back toward clutter, which defeats the point of restraint.

**For a run with no video**, the page is today's layout, completely unchanged, plus a small, low-key **"+ Add video"** text link (not an empty-state hero box) — usable without being a nag.

### 6.5 Explicitly deferred to a later pass

- User-configurable HUD stat selection (fixed/curated set for v1).
- Multi-camera / multi-angle capture, and how this looks for the coach/club hardware variant specifically (that hardware SKU doesn't exist yet — see memory note on hardware ecosystem — revisit once it does).
- Session-level highlight-reel playback across multiple runs' clips.
- Server-side flash-frame detection (see §4.2).

---

## 7. Open risks worth validating during build, not before

- Real-world BLE trigger latency against actual Open GoPro hardware/firmware versions.
- Whether HindSight's buffer window reliably covers the full random-delay + light-sequence duration in practice.
- Client-side flash-detection reliability across browsers/devices, particularly mobile Safari's `<video>`/`<canvas>` quirks.
- Confirm the DataManager.h SD-schema field audit (see the `chartData` and `reactionTime` fixes already landed in `jns-pro-controller`) doesn't need a counterpart for whatever new fields the video-attachment metadata introduces — audit the contract again once that schema exists, the same way §4 of that earlier audit was done, rather than assuming it's fine.
