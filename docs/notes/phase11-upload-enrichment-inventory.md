# Phase 11 — Upload and session enrichment inventory

Status: implementation substantially complete on `phase11-upload-enrichment-inventory`; ingest core and enrichment/UI slices verified live. Final whole-phase sign-off pending the remaining edge-case matrix below.

## Product job

Treat **manual/SD upload, direct Wi-Fi/device ingest, and the first post-session enrichment pass as one journey**:

> get trustworthy session evidence into the system with minimal friction, then invite the rider to add context that improves interpretation without making that context a prerequisite for ingest.

Release 1 ingest invariants remain non-negotiable: per-rider checksum deduplication, concurrent duplicate handling, rollback of partial sessions, canonical derived-state reconciliation, and reversible run exclusions.

## Implemented Phase 11 model

### Canonical ingest

Both `POST /api/upload` and `POST /api/device-ingest` now delegate source persistence to one server-side `ingestSessionEvidence()` path. That shared path owns:

- SD-format validation and transform;
- per-rider checksum identity and duplicate lookup;
- concurrent duplicate race handling;
- active-bike/latest-rider-profile linkage;
- session -> runs -> gate_runs persistence;
- optional timeseries degradation/warnings;
- required-evidence rollback;
- canonical derived-state reconciliation.

Transport wrappers retain their deliberately different rider/device semantics:

- manual duplicate -> informative HTTP 409 with the existing session;
- device retry -> HTTP 200 successful idempotent no-op.

Validation now runs before duplicate lookup for both transports. For valid sessions this is indistinguishable; invalid payloads now consistently receive validation failure rather than participating in checksum lookup.

### Upload journey

`/upload` is no longer framed as though SD transfer is the only supported arrival path.

The hierarchy is now:

1. direct Wi-Fi upload when enabled on the hardware;
2. manual SD import as fallback;
3. clear receipt/duplicate/warning state;
4. hand-off to Session Overview for optional context and run classification;
5. interpretation after evidence capture.

The page explicitly explains that Wi-Fi and SD share the same source-session fingerprint, so manually importing an SD copy of a session that already arrived over Wi-Fi resolves to the existing session instead of creating another one.

### Enrichment

Session context remains optional and interpretation-only. Run classification remains evidence-affecting where tags exclude runs from normal statistics.

Server-side context updates now:

- validate weather, surface, focus and ride-feel values against the canonical application taxonomies;
- reject forged/stale taxonomy values;
- reject session IDs that do not actually update an owned row;
- do not run performance reconciliation, because context does not change canonical PB/statistical eligibility.

`SessionContextEditor` now deserializes the SvelteKit form-action envelope. `fail(...)` responses therefore remain visibly failed in edit mode rather than masquerading as successful saves. Network/server failures likewise show rider-facing feedback that recorded evidence was unaffected.

## Explicit decisions / trust boundaries

### Ingest-source provenance — deferred intentionally

No `ingest_source` / `upload_source` column is being added in Phase 11.

Transport provenance could help future support diagnostics, but it is operational metadata rather than analytical truth and no current rider-facing feature depends on it. Adding schema immediately before trial access would increase migration/test surface without solving a present correctness problem. If support or device telemetry later needs provenance, add it explicitly; do not infer it from checksum or timestamps.

### Device -> rider ownership boundary

`/api/device-ingest` authenticates the trusted external ingest bridge using `DEVICE_INGEST_SECRET`; it does **not** authenticate an individual hardware device. The bridge is responsible for resolving and authorising the device -> rider association before submitting `userId` to this application.

This boundary is now documented next to the endpoint. Do not add a second pairing model here unless the external hardware/bridge system stops guaranteeing that association.

### Video

Video is deliberately **not** part of Phase 11 and remains optional. Phase 12 owns video workflow and synchronization. Sensor upload remains the primary evidence path regardless of whether video is present.

## Verified so far

Static gates after the latest second-slice fix:

- `svelte-check`: clean;
- `tsc --noEmit`: clean;
- Vitest: 119/119.

Live/API/component verification already completed:

- fresh manual SD upload;
- manual duplicate -> 409 existing-session receipt;
- fresh device ingest;
- device retry -> successful duplicate no-op;
- device first -> same SD manually -> same session ID;
- forced required-evidence failure -> no orphan/zombie checksum reservation;
- corrected retry after required-evidence failure -> succeeds;
- valid context save -> persisted and editor exits;
- invalid context action failure -> editor stays open, visible error, no DB mutation;
- forged session ID/context server guards;
- cross-transport duplicate presentation;
- incomplete-profile upload state;
- post-import hand-off into session context/tagging;
- desktop/mobile upload/enrichment presentation.

## Remaining whole-phase sign-off checks

These are edge-case confirmations rather than known defects:

1. manual first -> same payload through device ingest -> one session / device no-op;
2. optional timeseries insertion failure -> required source session survives with warning/degraded trace count;
3. no active bike and/or no rider-profile snapshot -> ingest succeeds and linkage receipt is honest;
4. post-ingest exclusion of a PB/goal-contributing run still reverses downstream snapshot/goal evidence through the existing reconciliation path.

The last behaviour has been verified repeatedly in earlier phases after tag edits, but retaining it here as a final Phase 11 regression is useful because Phase 11 changes the ingest journey around that enrichment action.

## Whole-phase sign-off rule

Phase 11 can be closed when the four remaining checks above are green and the static baseline remains clean. No additional upload presentation work, provenance schema, or video work is required for Phase 11.
