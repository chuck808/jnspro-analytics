# Phase 11 — Upload and session enrichment inventory

Status: inventory complete on `phase11-upload-enrichment-inventory`; no runtime changes yet.

## Product job

Treat **manual/SD upload, direct Wi-Fi/device ingest, and the first post-session enrichment pass as one journey**:

> get trustworthy session evidence into the system with minimal friction, then invite the rider to add context that improves interpretation without making that context a prerequisite for ingest.

Release 1 ingest invariants remain non-negotiable: per-rider checksum deduplication, concurrent duplicate handling, rollback of partial sessions, canonical derived-state reconciliation, and reversible run exclusions.

## Current transport model

### Manual / SD

`POST /api/upload`

- authenticates the signed-in rider;
- calculates the same session checksum used by device ingest;
- returns a rider-facing 409 with the existing session when the same file already exists;
- validates and transforms the SD JSON;
- links the current active bike and latest rider-profile snapshot;
- inserts session -> runs -> gate_runs, with optional timeseries warnings;
- rolls the whole session back if required run/gate data fails;
- reconciles performance snapshots/goals after successful source ingest.

The `/upload` page is currently entirely framed as an SD-card/manual upload page.

### Direct Wi-Fi / device

`POST /api/device-ingest`

- authenticates the trusted ingest bridge with `DEVICE_INGEST_SECRET`;
- accepts `userId` + the same SD-format `fileData`;
- uses the same checksum namespace as manual upload, so an SD retry after Wi-Fi ingest is detected as the same session;
- treats device-side duplicate retries as a successful no-op;
- links the same active bike/latest rider profile;
- inserts the same required evidence model and rolls back partial sessions;
- runs the same derived-state reconciliation.

This means cross-transport deduplication is already fundamentally correct. The rider-facing upload page, however, does not explain that Wi-Fi sessions may already have arrived, nor does it surface recent automatic arrivals.

## Current enrichment model

The first enrichment surface is not `/upload`; it lives on Session Overview through `SessionSetupStrip`.

It offers two distinct evidence/context jobs:

1. **Session context** — weather, track surface, session focus, and ride feel via `SessionContextEditor`.
2. **Run classification** — warmup / exclude / experimental / competition etc. via `RunTagSelector`.

The design already respects the key product invariant: context is optional, while exclusion tags can change statistical eligibility. Session Overview previews how draft context/tagging would affect interpretation before persistence. Persisted run-tag changes reconcile downstream derived state.

## What is already good

- Manual and Wi-Fi uploads share the same checksum identity, so accidental SD upload after successful Wi-Fi ingest is caught.
- Required source evidence is atomic at the session level; optional timeseries failures degrade with warnings rather than destroying otherwise-valid evidence.
- Bike/rider-profile snapshots are linked at ingest time for later historical physics/context correctness.
- Enrichment is post-ingest and optional rather than blocking data capture.
- Run tagging preserves the original historical run while controlling whether it contributes to normal statistics.
- Tag edits trigger canonical reconciliation rather than leaving PB/goal/leaderboard state stale.

## Seams / defects found

### 1. The two ingest endpoints still duplicate almost the entire persistence pipeline

Release 1 successfully shared checksum/dedup/rollback helpers, but `api/upload/+server.ts` and `api/device-ingest/+server.ts` still separately implement:

- active-bike/latest-profile lookup;
- session insert;
- run insert;
- gate-run insert;
- optional timeseries insert;
- counters/warnings;
- reconciliation call.

This is now the largest correctness risk in the upload subsystem. The two implementations are already not byte-for-byte identical (manual exposes timeseries error detail and validation warnings; device does not). Another schema field or ingest rule can easily drift between transports.

**Phase 11 should extract one canonical server-side session persistence function and leave only authentication/transport-specific response semantics in the two routes.**

### 2. Upload UI presents manual SD as if it were the only arrival path

The page says "Copy the JSON file from your AppGatePro SD card and upload it here." That is now incomplete product language because direct Wi-Fi ingest is a real supported path.

This does not require making Wi-Fi primary. The page should explain two paths calmly:

- automatic/direct device upload when configured;
- manual SD upload as fallback/import.

The user should also understand that uploading the SD copy of an already-arrived Wi-Fi session is safe and will resolve to the existing session rather than duplicate it.

### 3. No transport/source provenance is stored on the session

There is no `ingest_source` / `upload_source` field. Once a session exists, the application cannot tell whether it arrived by Wi-Fi or manual upload.

That is not required for analytical truth, but it limits useful rider support and diagnostics (for example, "uploaded automatically from device" vs "imported from SD") and makes transport troubleshooting harder.

Before adding schema, decide whether this provenance is worth retaining. Do not infer transport from checksum or timestamps.

### 4. Post-upload success jumps straight to analytics rather than acknowledging enrichment as optional next step

Manual upload success offers **View session analytics** and **Upload another**. Session Overview then separately nudges context/tagging.

The underlying sequence is sound, but the journey is disconnected. A better hand-off is likely:

> Session imported -> optional "Add context / check warmups" -> continue to Overview

This should remain optional and skippable. Do not turn weather/feel/tagging into a precondition for seeing the session.

### 5. Context save failures are effectively silent in the UI

`SessionContextEditor.saveContext()` only reacts visibly to `response.ok`. A non-OK SvelteKit action response leaves the editor open with no rider-facing error; only thrown/network errors reach `console.error`.

This is a real UX defect. Context is optional, but when a rider chooses to save it the result should be explicit.

### 6. Session-context values are not server-validated against the application enums

`updateSessionContext` accepts arbitrary strings from FormData and writes them directly. The migration uses free-text columns and does not constrain these values.

The current UI only submits known options, so normal use is fine, but the server contract is weaker than the rest of the evidence model. Phase 11 should validate against the canonical `sessionContext` option sets and reject invalid values rather than allowing taxonomy drift.

### 7. The enrichment action does not need performance reconciliation — and correctly does not do it

Weather/surface/focus/feel affect interpretation but not canonical PB/statistical eligibility. `updateSessionContext` therefore does not reconcile snapshots/goals. This is intentional and should stay that way.

Run tags are different: they alter eligibility and already trigger reconciliation. Preserve this separation.

### 8. Device ingest's trusted bridge can nominate any `userId`

The endpoint authenticates one shared `DEVICE_INGEST_SECRET` and then trusts the supplied `userId`. That may be exactly the intended external-hardware bridge model, but it means rider/device binding is enforced outside this route rather than by the analytics application.

Phase 11 should document the ownership/binding boundary explicitly. If the external system already guarantees device->rider association, do not duplicate pairing logic here. If it does not, this endpoint is too broad.

## Proposed Phase 11 hierarchy

1. **Arrival** — automatic Wi-Fi when configured or manual SD fallback.
2. **Receipt** — clear success / duplicate / warning state with link to the actual session.
3. **Optional enrichment** — context and run classification, explicitly skippable.
4. **Interpretation** — continue to Session Overview; richer Analysis/Deep Dive remain unchanged.

## First implementation slice

Correctness before visual polish:

1. extract a canonical server-side session-ingest persistence function used by both `/api/upload` and `/api/device-ingest`;
2. preserve manual duplicate = informative 409 and device retry = successful idempotent no-op as transport-specific wrappers;
3. preserve all Release 1 rollback/reconciliation semantics and timeseries-warning behaviour;
4. add enum validation to `updateSessionContext` and rider-visible save failure handling;
5. add focused regression tests around the shared ingest result shape / required-vs-optional failure boundary where practical.

Then restructure `/upload` copy and success hand-off around automatic-or-manual arrival plus optional enrichment. Do not make video part of this phase; Phase 12 owns video.

## Verification matrix for the implementation slice

Static first: `svelte-check`, `tsc --noEmit`, Vitest.

Live/hosted cases:

1. fresh manual SD upload;
2. same manual file repeated -> existing-session duplicate receipt;
3. fresh device/Wi-Fi upload;
4. device retry -> successful no-op;
5. device first, then same SD file manually -> one session only, manual route points to existing session;
6. manual first, then same device payload -> one session only;
7. forced required run/gate failure -> no zombie session/checksum reservation;
8. optional timeseries failure -> source session survives with warning;
9. missing active bike/profile -> ingest still succeeds and reports linkage honestly;
10. context save success and invalid-context rejection;
11. context save server failure produces visible feedback;
12. run exclusion after ingest still reverses downstream PB/goal/snapshot evidence;
13. 390 px upload/enrichment flow.
