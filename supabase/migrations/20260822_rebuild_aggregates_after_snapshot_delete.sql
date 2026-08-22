-- Phase 10: performance_aggregates is fully derived from rider snapshots.
--
-- refresh_performance_aggregates() historically only upserted cohorts that
-- currently qualified. If a rider/snapshot was deleted, extinct cohorts could
-- therefore remain in performance_aggregates with stale sample sizes and
-- percentiles. Rebuild the derived table after snapshot deletion so account
-- removal/cascade deletion cannot leave a phantom benchmark population.

CREATE OR REPLACE FUNCTION rebuild_performance_aggregates_after_snapshot_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	DELETE FROM performance_aggregates;
	PERFORM refresh_performance_aggregates();
	RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS rider_snapshots_rebuild_aggregates_after_delete
	ON rider_performance_snapshots;

CREATE TRIGGER rider_snapshots_rebuild_aggregates_after_delete
AFTER DELETE ON rider_performance_snapshots
FOR EACH STATEMENT
EXECUTE FUNCTION rebuild_performance_aggregates_after_snapshot_delete();
