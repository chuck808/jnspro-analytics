# Schema Evolution Strategy

**Version:** 1.0  
**Date:** April 29, 2026  
**Current Schema Version:** 2

---

## Overview

This document defines the strategy for evolving the AppGatePro Analytics database schema while maintaining backward compatibility with existing SD card files and supporting seamless migrations.

---

## Schema Version Tracking

### Current Implementation

**SD Card Files:**
- `schemaVersion` field in JSON root (currently `2`)
- Validation in `src/lib/services/ingest.ts`:
  ```typescript
  const SUPPORTED_SCHEMA_VERSION = 2;
  if (version !== undefined && version !== SUPPORTED_SCHEMA_VERSION) {
      errors.push('Unsupported schema version...');
  }
  ```

**Database:**
- No explicit version tracking currently implemented
- Migrations tracked by filename timestamp in `supabase/migrations/`

### Recommended Enhancement

Add a `schema_version` table to track database schema state:

```sql
CREATE TABLE IF NOT EXISTS public.schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    migration_file TEXT NOT NULL,
    description TEXT
);

INSERT INTO public.schema_version (version, migration_file, description)
VALUES (2, '20260101_create_core_schema.sql', 'Initial core schema with sessions, runs, gate_runs, run_timeseries');
```

---

## Backward Compatibility Principles

### 1. **SD Card Files are Immutable**

SD card files represent the canonical raw archive and **must never require firmware updates** for past sessions to remain importable.

**Rule:** Once written to SD card, a session file should be importable by any future version of the analytics platform.

**Implementation:**
- Ingest service supports multiple schema versions
- Older schema versions are transformed to current internal format
- Validation warnings but never hard failures for old schemas

### 2. **Database Migrations are Forward-Only**

Database schema changes are additive and non-destructive.

**Rules:**
- ✅ Add new tables
- ✅ Add new columns with nullable or default values
- ✅ Add new indexes
- ❌ Never drop columns (deprecate instead)
- ❌ Never change column types destructively
- ⚠️ Rename columns only with migration script + view compatibility layer

### 3. **API Versioning**

Upload endpoint maintains compatibility across schema versions.

**Current:** `/api/upload` handles schema v2  
**Future:** Same endpoint handles v2, v3, v4+ transparently

---

## Schema Evolution Workflow

### Adding New Fields (Non-Breaking)

**Example:** Adding `max_power_w` field to `gate_runs`

```sql
-- Migration: 20260XXX_add_power_fields.sql
ALTER TABLE public.gate_runs 
ADD COLUMN IF NOT EXISTS max_power_w REAL DEFAULT NULL;

COMMENT ON COLUMN public.gate_runs.max_power_w IS 
    'Peak power estimate in watts (added schema v3)';

-- Update schema version
INSERT INTO public.schema_version (version, migration_file, description)
VALUES (3, '20260XXX_add_power_fields.sql', 'Added power estimation fields');
```

**Ingest Service Update:**
```typescript
// src/lib/services/ingest.ts
// v2 files don't have power fields - gracefully handled
max_power_w: safeNum(fa.maxPowerW), // undefined for v2 files
```

**SD Card Compatibility:**
- ✅ v2 files import successfully (`max_power_w` = null)
- ✅ v3 files populate new field
- ✅ No firmware update required for v2 devices

### Adding New Required Analytics (Breaking Change)

**Example:** Schema v3 requires additional pitch calibration data

**Problem:** v2 files lack this data

**Solution:** Multi-version ingest with fallback logic

```typescript
// src/lib/services/ingest.ts
export function transformSDFile(file: SDCardFile): IngestSession {
    const version = file.schemaVersion ?? 1;
    
    switch (version) {
        case 3:
            return transformSchemaV3(file);
        case 2:
            return transformSchemaV2(file);
        case 1:
            return transformSchemaV1(file);
        default:
            throw new Error(`Unsupported schema version: ${version}`);
    }
}

function transformSchemaV2(file: SDCardFileV2): IngestSession {
    // v2 transformation logic (current implementation)
    // Missing pitch calibration → analytics_valid may be false
}

function transformSchemaV3(file: SDCardFileV3): IngestSession {
    // v3 includes pitch_calibration_offset
    // Better analytics accuracy for pitch-based metrics
}
```

**Database Impact:**
- v2 and v3 files both insert successfully
- v2 files may have `analytics_valid: false` for pitch-dependent metrics
- UI shows appropriate fallback/warnings

---

## Migration Testing Protocol

### Before Deploying Schema Changes

1. **Create Test Dataset:**
   - Sample session files from v1, v2, v3
   - Edge cases (incomplete sessions, corrupted data)

2. **Test Ingestion:**
   ```bash
   # Run test suite
   npm run test:ingest
   
   # Manual validation
   curl -X POST /api/upload \
     -H "Content-Type: application/json" \
     -d @test_data/session_v2.json
   ```

3. **Verify Database State:**
   ```sql
   -- Check all schema versions imported correctly
   SELECT 
       sv.version,
       COUNT(DISTINCT s.id) as session_count,
       COUNT(r.id) as run_count
   FROM schema_version sv
   LEFT JOIN sessions s ON true  -- intentionally cartesian for count
   LEFT JOIN runs r ON r.session_id = s.id
   GROUP BY sv.version;
   ```

4. **UI Regression Test:**
   - View sessions from each schema version
   - Verify charts render correctly
   - Check for missing/broken analytics

### Rollback Strategy

**Database migrations are irreversible by design** (forward-only).

**If critical bug discovered:**

1. **Stop uploads** (maintenance mode)
2. **Deploy hotfix** to ingest service (fixes transformation)
3. **Re-import affected sessions** from SD card files (canonical source)
4. **Resume service**

**Prevention:** Thorough testing before migration, canary deployments

---

## Future Schema Version Roadmap

### Schema v3 (Planned)

**Target:** Q3 2026

**New Features:**
- Enhanced pitch calibration (`pitch_calibration_offset` in timeSeries)
- Lap timing data for track mode
- Cadence sensor integration

**Breaking Changes:** None (additive only)

**Migration Path:**
```sql
-- Add lap timing tables for track sessions
CREATE TABLE IF NOT EXISTS public.track_laps (...);

-- Add calibration fields to run_timeseries
ALTER TABLE public.run_timeseries 
ADD COLUMN pitch_calibration_offset REAL DEFAULT NULL;

-- Update schema version
INSERT INTO public.schema_version VALUES (3, ...);
```

### Schema v4 (Planned)

**Target:** Q1 2027

**New Features:**
- Multi-sensor fusion (GPS + IMU)
- Wind speed compensation
- Rider position tracking (seated/standing)

**Migration Considerations:**
- GPS data optional (not all devices have GPS)
- v2/v3 files remain fully compatible
- Enhanced analytics when GPS available

---

## Deprecation Policy

### When to Deprecate

- Field no longer used by any analytics
- Field replaced by improved metric
- Field caused data quality issues

### How to Deprecate

**Step 1: Mark as deprecated (Schema vN)**
```sql
COMMENT ON COLUMN public.gate_runs.old_field IS 
    'DEPRECATED (schema v4): Replaced by new_field. Will be removed in schema v6 (2028).';
```

**Step 2: Stop populating (Schema vN+1)**
```typescript
// Ingest service - don't write to deprecated field
// old_field: null, // DEPRECATED
```

**Step 3: Remove after grace period (Schema vN+2)**
```sql
-- Only after 2+ schema versions (typically 12+ months)
ALTER TABLE public.gate_runs DROP COLUMN IF EXISTS old_field;
```

**Grace Period:** Minimum 12 months, 2 schema versions

---

## Schema Validation Tests

### Automated Tests (Recommended Addition)

```typescript
// tests/schema/compatibility.test.ts

describe('Schema Compatibility', () => {
    test('v2 session files import successfully', async () => {
        const v2File = readTestFile('fixtures/session_v2.json');
        const result = await uploadSession(v2File);
        expect(result.success).toBe(true);
    });

    test('v1 session files import with warnings', async () => {
        const v1File = readTestFile('fixtures/session_v1.json');
        const result = await uploadSession(v1File);
        expect(result.success).toBe(true);
        expect(result.warnings).toContain('Legacy schema v1');
    });

    test('future schema version shows clear error', async () => {
        const v99File = { schemaVersion: 99, runs: [] };
        const result = await uploadSession(v99File);
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Unsupported schema version: 99');
    });
});
```

---

## Communication Strategy

### For Users

**Before Migration:**
- Changelog entry explaining new features
- Note that old session files remain compatible
- Beta testing with volunteer users

**After Migration:**
- Release notes highlighting improvements
- No action required notice (automatic migration)
- Support contact for issues

### For Firmware Team

**Schema Change Protocol:**
1. Analytics team proposes schema change
2. Firmware team reviews impact on device storage/bandwidth
3. Agreement on `schemaVersion` increment timing
4. Both teams update simultaneously (coordinated release)

---

## Emergency Procedures

### Corrupted Migration

**Symptoms:** Schema migration fails mid-execution

**Response:**
1. Supabase automatic rollback (transaction-based migrations)
2. Check logs: `SELECT * FROM public.schema_version ORDER BY version DESC;`
3. Fix migration SQL syntax
4. Re-deploy corrected migration

### Data Loss Prevention

**All session data is recoverable from SD card files.**

If database corrupted beyond repair:
1. Restore from Supabase point-in-time backup (7-day retention)
2. Or: Mass re-import from user SD card files (canonical source)
3. Update audit log and notify affected users

---

## Conclusion

This schema evolution strategy prioritizes:

1. ✅ **Backward compatibility** - old session files always work
2. ✅ **User confidence** - no data loss, graceful degradation
3. ✅ **Development velocity** - additive changes don't block innovation
4. ✅ **Data integrity** - SD card files are canonical, recoverable

**Key Principle:** The database is a performance-optimized view of the canonical SD card archive. It can always be rebuilt.


