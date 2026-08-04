-- Completes the is_admin() -> is_admin_user() migration across the schema.
-- Fixed so far: profiles (20260728g), training_goals/goal_milestones/
-- rider_profiles (20260730_fix_coach_read_rls_recursion.sql) — both times
-- because a second non-owner SELECT policy got added on top of the existing
-- unsafe is_admin() bypass, re-arming the same recursion class.
--
-- This migration proactively converts every remaining is_admin() usage,
-- confirmed live via pg_policies, on: admin_role_audit, bikes, gate_runs,
-- pyramid_cadence_runs, quick_cadence_runs, run_timeseries, runs, sessions,
-- sprint_runs, user_preferences, user_subscriptions. None of these have
-- tripped the recursion yet (each currently has is_admin() as the only
-- non-owner bypass), but the coach feature has now added a second
-- non-owner policy twice, unprompted, on tables that used to be "just the
-- admin bypass" — waiting for it to happen a third time before fixing is
-- not a strategy. Converting everywhere now removes the landmine instead
-- of defusing it one table at a time after each new incident.
--
-- Fix is purely mechanical and already proven safe twice: swap is_admin()
-- for is_admin_user(auth.uid()) (SECURITY DEFINER, from 20260728e) in every
-- policy that calls it. Functionally identical check.
--
-- Note: several tables below (gate_runs, run_timeseries, runs, sessions)
-- also carry older, separately-named policies (e.g. "Users can view
-- gate_runs for their sessions") that duplicate the same ownership check
-- via an explicit join instead of the owns_*() helper functions, and never
-- used is_admin() at all — those are untouched here, left exactly as they
-- are; this migration only rewrites the is_admin()-using policies.

-- ── admin_role_audit ───────────────────────────────────────────────────────

drop policy if exists "admin_audit_select" on public.admin_role_audit;
create policy "admin_audit_select"
    on public.admin_role_audit for select
    using (is_admin_user(auth.uid()));

-- ── bikes ──────────────────────────────────────────────────────────────────

drop policy if exists "bikes_select" on public.bikes;
create policy "bikes_select"
    on public.bikes for select
    using (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "bikes_insert" on public.bikes;
create policy "bikes_insert"
    on public.bikes for insert
    with check (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "bikes_update" on public.bikes;
create policy "bikes_update"
    on public.bikes for update
    using (owns_user_id(user_id) or is_admin_user(auth.uid()))
    with check (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "bikes_delete" on public.bikes;
create policy "bikes_delete"
    on public.bikes for delete
    using (owns_user_id(user_id) or is_admin_user(auth.uid()));

-- ── gate_runs ──────────────────────────────────────────────────────────────

drop policy if exists "gate_runs_select" on public.gate_runs;
create policy "gate_runs_select"
    on public.gate_runs for select
    using (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "gate_runs_insert" on public.gate_runs;
create policy "gate_runs_insert"
    on public.gate_runs for insert
    with check (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "gate_runs_update" on public.gate_runs;
create policy "gate_runs_update"
    on public.gate_runs for update
    using (owns_run(run_id) or is_admin_user(auth.uid()))
    with check (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "gate_runs_delete" on public.gate_runs;
create policy "gate_runs_delete"
    on public.gate_runs for delete
    using (owns_run(run_id) or is_admin_user(auth.uid()));

-- ── pyramid_cadence_runs ───────────────────────────────────────────────────

drop policy if exists "pyramid_runs_select" on public.pyramid_cadence_runs;
create policy "pyramid_runs_select"
    on public.pyramid_cadence_runs for select
    using (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "pyramid_runs_insert" on public.pyramid_cadence_runs;
create policy "pyramid_runs_insert"
    on public.pyramid_cadence_runs for insert
    with check (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "pyramid_runs_update" on public.pyramid_cadence_runs;
create policy "pyramid_runs_update"
    on public.pyramid_cadence_runs for update
    using (owns_run(run_id) or is_admin_user(auth.uid()))
    with check (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "pyramid_runs_delete" on public.pyramid_cadence_runs;
create policy "pyramid_runs_delete"
    on public.pyramid_cadence_runs for delete
    using (owns_run(run_id) or is_admin_user(auth.uid()));

-- ── quick_cadence_runs ─────────────────────────────────────────────────────

drop policy if exists "quick_runs_select" on public.quick_cadence_runs;
create policy "quick_runs_select"
    on public.quick_cadence_runs for select
    using (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "quick_runs_insert" on public.quick_cadence_runs;
create policy "quick_runs_insert"
    on public.quick_cadence_runs for insert
    with check (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "quick_runs_update" on public.quick_cadence_runs;
create policy "quick_runs_update"
    on public.quick_cadence_runs for update
    using (owns_run(run_id) or is_admin_user(auth.uid()))
    with check (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "quick_runs_delete" on public.quick_cadence_runs;
create policy "quick_runs_delete"
    on public.quick_cadence_runs for delete
    using (owns_run(run_id) or is_admin_user(auth.uid()));

-- ── run_timeseries ─────────────────────────────────────────────────────────

drop policy if exists "timeseries_select" on public.run_timeseries;
create policy "timeseries_select"
    on public.run_timeseries for select
    using (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "timeseries_insert" on public.run_timeseries;
create policy "timeseries_insert"
    on public.run_timeseries for insert
    with check (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "timeseries_update" on public.run_timeseries;
create policy "timeseries_update"
    on public.run_timeseries for update
    using (owns_run(run_id) or is_admin_user(auth.uid()))
    with check (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "timeseries_delete" on public.run_timeseries;
create policy "timeseries_delete"
    on public.run_timeseries for delete
    using (owns_run(run_id) or is_admin_user(auth.uid()));

-- ── runs ───────────────────────────────────────────────────────────────────

drop policy if exists "runs_select" on public.runs;
create policy "runs_select"
    on public.runs for select
    using (owns_session(session_id) or is_admin_user(auth.uid()));

drop policy if exists "runs_insert" on public.runs;
create policy "runs_insert"
    on public.runs for insert
    with check (owns_session(session_id) or is_admin_user(auth.uid()));

drop policy if exists "runs_update" on public.runs;
create policy "runs_update"
    on public.runs for update
    using (owns_session(session_id) or is_admin_user(auth.uid()))
    with check (owns_session(session_id) or is_admin_user(auth.uid()));

drop policy if exists "runs_delete" on public.runs;
create policy "runs_delete"
    on public.runs for delete
    using (owns_session(session_id) or is_admin_user(auth.uid()));

-- ── sessions ───────────────────────────────────────────────────────────────

drop policy if exists "sessions_select" on public.sessions;
create policy "sessions_select"
    on public.sessions for select
    using (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "sessions_insert" on public.sessions;
create policy "sessions_insert"
    on public.sessions for insert
    with check (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "sessions_update" on public.sessions;
create policy "sessions_update"
    on public.sessions for update
    using (owns_user_id(user_id) or is_admin_user(auth.uid()))
    with check (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "sessions_delete" on public.sessions;
create policy "sessions_delete"
    on public.sessions for delete
    using (owns_user_id(user_id) or is_admin_user(auth.uid()));

-- ── sprint_runs ────────────────────────────────────────────────────────────

drop policy if exists "sprint_runs_select" on public.sprint_runs;
create policy "sprint_runs_select"
    on public.sprint_runs for select
    using (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "sprint_runs_insert" on public.sprint_runs;
create policy "sprint_runs_insert"
    on public.sprint_runs for insert
    with check (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "sprint_runs_update" on public.sprint_runs;
create policy "sprint_runs_update"
    on public.sprint_runs for update
    using (owns_run(run_id) or is_admin_user(auth.uid()))
    with check (owns_run(run_id) or is_admin_user(auth.uid()));

drop policy if exists "sprint_runs_delete" on public.sprint_runs;
create policy "sprint_runs_delete"
    on public.sprint_runs for delete
    using (owns_run(run_id) or is_admin_user(auth.uid()));

-- ── user_preferences ───────────────────────────────────────────────────────

drop policy if exists "prefs_select" on public.user_preferences;
create policy "prefs_select"
    on public.user_preferences for select
    using (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "prefs_insert" on public.user_preferences;
create policy "prefs_insert"
    on public.user_preferences for insert
    with check (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "prefs_update" on public.user_preferences;
create policy "prefs_update"
    on public.user_preferences for update
    using (owns_user_id(user_id) or is_admin_user(auth.uid()))
    with check (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "prefs_delete" on public.user_preferences;
create policy "prefs_delete"
    on public.user_preferences for delete
    using (owns_user_id(user_id) or is_admin_user(auth.uid()));

-- ── user_subscriptions ─────────────────────────────────────────────────────
-- Only a SELECT policy exists live today — no insert/update/delete policy
-- for this table currently. Not this migration's concern to add one; only
-- converting the is_admin() usage that already exists.

drop policy if exists "subs_select" on public.user_subscriptions;
create policy "subs_select"
    on public.user_subscriptions for select
    using (owns_user_id(user_id) or is_admin_user(auth.uid()));
