-- Phase 10: allow the explicit under-13 benchmark cohort in rider snapshots.
--
-- Application reconciliation now writes `under-13` for riders younger than 13.
-- Without this constraint update, snapshot upserts fail with 23514 and the
-- failure is only logged because benchmarking persistence is intentionally
-- non-fatal to session ingest.

ALTER TABLE rider_performance_snapshots
	DROP CONSTRAINT IF EXISTS rider_performance_snapshots_age_group_check;

ALTER TABLE rider_performance_snapshots
	ADD CONSTRAINT rider_performance_snapshots_age_group_check
	CHECK (
		age_group IN (
			'under-13',
			'13-17',
			'18-25',
			'26-35',
			'36-45',
			'46+',
			'unknown'
		)
	);
