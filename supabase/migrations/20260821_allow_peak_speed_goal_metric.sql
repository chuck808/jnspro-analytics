-- Keep the database constraint aligned with the goal metrics offered by the app.
-- Peak Speed was restored to the Goals UI in Phase 9, but the legacy CHECK
-- constraint still rejected 'peakSpeed' inserts.

alter table public.training_goals
	drop constraint if exists training_goals_metric_check;

alter table public.training_goals
	add constraint training_goals_metric_check
	check (
		metric in (
			'reactionTime',
			'maxG',
			'peakSpeed',
			'consistency',
			'elapsedTime',
			'accelerationPhase',
			'endurance'
		)
	);
