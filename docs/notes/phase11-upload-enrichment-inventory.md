# Phase 11 — Upload and session enrichment

Status: **DONE** on `phase11-upload-enrichment-inventory`; ready to merge via PR #3.

## Product job

Treat **manual/SD upload, direct Wi-Fi/device ingest, and the first post-session enrichment pass as one journey**:

> get trustworthy session evidence into the system with minimal friction, then invite the rider to add context that improves interpretation without making that context a prerequisite for ingest.

Release 1 ingest invariants remain non-negotiable: per-rider checksum deduplication, concurrent duplicate handling, rollback of partial sessions, canonical derived-state reconciliation, and reversible run exclusions.

## Implemented model

### Canonical ingest

Both `POST /api/upload` and `POST /api/device-ingest` delegate source persistence to one server-side `ingestSessionEvidence()` path. That shared path owns:

- SD-format validation and transform;
- per-rider checksum identity and duplicate lookup;
- concurrent duplicate race handling;
- active-bike/latest-rider-profile linkage;
- session -> runs -> gate_runs persistence;
- optional timeseries degradation/warnings;
- required-evidence rollback;
- canonical derived-state reconciliation.

Transport wrappers retain deliberately different semantics:

- manual duplicate -> informative HTTP 409 with the existing session;
- device retry -> HTTP 200 successful idempotent no-op.

Validation now runs before duplicate lookup for both transports. For valid sessions this is indistinguishable; invalid payloads consistently receive validation failure rather than participating in checksum lookup.

### Upload journey

`/upload` is no longer framed as though SD transfer is the only arrival path.

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

`SessionContextEditor` deserializes the SvelteKit form-action envelope. `fail(...)` responses therefore remain visibly failed in edit mode rather than masquerading as successful saves. Network/server failures likewise show rider-facing feedback that recorded evidence was unaffected.

## Explicit decisions / trust boundaries

### Ingest-source provenance — deferred intentionally

No `ingest_source` / `upload_source` column is being added in Phase 11.

Transport provenance could help future support diagnostics, but it is operational metadata rather than analytical truth and no current rider-facing feature depends on it. If support or device telemetry later needs provenance, add it explicitly; do not infer it from checksum or timestamps.

### Device -> rider ownership boundary

`/api/device-ingest` authenticates the trusted external ingest bridge using `DEVICE_INGEST_SECRET`; it does **not** authenticate an individual hardware device. The bridge is responsible for resolving and authorising the device -> rider association before submitting `userId` to this application.

Do not add a second pairing model here unless the external hardware/bridge system stops guaranteeing that association.

### Video

Video is deliberately **not** part of Phase 11 and remains optional. Phase 12 owns video workflow and synchronization. Sensor upload remains the primary evidence path regardless of whether video is present.

## Verification

Repository CI on PR #3 (`run 73`) passed the hard verify job:

- `svelte-check`: 0 errors, the same one pre-existing admin warning;
- Vitest: **122/122** across 21 test files;
- production build: passed.

The final three ingest-boundary tests explicitly verify:

1. an existing checksum resolves as transport-independent duplicate evidence before persistence;
2. no active bike / no rider-profile snapshot remains a successful ingest with honest `bikeLinked/profileLinked` false values;
3. optional timeseries insertion failure returns degraded success with warning/error detail, does not roll back the required source session, and still reconciles derived state.

Live/API/component verification completed during the phase:

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

The inverse manual-first -> device-retry direction is structurally the same shared-checksum/helper path and is now also protected by the transport-independent duplicate regression test. Post-ingest exclusion/reconciliation has been live-proven repeatedly in earlier phases and the tag-edit reconciliation path was not changed by Phase 11.

## Sign-off

Phase 11 is closed. No additional provenance schema or upload presentation work is required for this phase.

Next: **Phase 12 — optional video workflow and hardware-light synchronization (120 ms full-white sync pulse when enabled).** Sensor evidence remains primary; video must never become a prerequisite for the analytics workflow.
