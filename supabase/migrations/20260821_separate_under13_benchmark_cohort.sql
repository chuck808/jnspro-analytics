-- Phase 10: stop folding riders younger than 13 into the 13-17 benchmark cohort.
--
-- Application reconciliation now writes `under-13` for these riders. The
-- snapshot table's historical CHECK constraint did not allow that value, so
-- relax the constraint before backfilling existing rows. Then rebuild aggregate
-- distributions so 13-17 is no longer contaminated by younger riders.

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

WITH latest_rider_profile AS (
	SELECT DISTINCT ON (user_id)
		user_id,
		date_of_birth
	FROM rider_profiles
	WHERE date_of_birth IS NOT NULL
	ORDER BY user_id, effective_from DESC
)
UPDATE rider_performance_snapshots AS snapshot
SET
	age_group = 'under-13',
	updated_at = NOW()
FROM latest_rider_profile AS rider
WHERE snapshot.user_id = rider.user_id
	AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, rider.date_of_birth)) < 13
	AND snapshot.age_group IS DISTINCT FROM 'under-13';

SELECT refresh_performance_aggregates();
