-- Same recursion class fixed on profiles in 20260728g, now confirmed present
-- on the three other tables the coach feature's 20260728d migration added a
-- second non-owner SELECT policy to. Confirmed live via pg_policies: each of
-- training_goals, goal_milestones, and rider_profiles now OR's together the
-- pre-existing is_admin()-based bypass (NOT SECURITY DEFINER, so its own
-- internal query against profiles is itself subject to profiles' RLS) with
-- the new "Coach can view linked rider's ..." policy from 20260728d. That is
-- exactly the precondition ("a second non-owner-bypass policy on top of an
-- is_admin() one") that caused the profiles production outage — these three
-- tables are the same landmine already re-armed, not yet fixed.
--
-- Fix: swap is_admin() for is_admin_user(auth.uid()) (SECURITY DEFINER,
-- introduced in 20260728e for exactly this purpose) in every policy that
-- currently calls is_admin(), on all three tables. Functionally identical
-- check, safe to call from within these tables' own policies.
--
-- Note: is_admin() is still used the same unsafe way on ~11 other tables in
-- this schema (sessions, bikes, runs, gate_runs, etc.) — none of those have
-- a second non-owner policy today, so they aren't tripping this yet, but the
-- same landmine exists there too and is a separate follow-up, not this fix.

-- ── training_goals ─────────────────────────────────────────────────────────

drop policy if exists "goals_select" on public.training_goals;
create policy "goals_select"
    on public.training_goals for select
    using (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "goals_insert" on public.training_goals;
create policy "goals_insert"
    on public.training_goals for insert
    with check (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "goals_update" on public.training_goals;
create policy "goals_update"
    on public.training_goals for update
    using (owns_user_id(user_id) or is_admin_user(auth.uid()))
    with check (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "goals_delete" on public.training_goals;
create policy "goals_delete"
    on public.training_goals for delete
    using (owns_user_id(user_id) or is_admin_user(auth.uid()));

-- ── goal_milestones ────────────────────────────────────────────────────────

drop policy if exists "milestones_select" on public.goal_milestones;
create policy "milestones_select"
    on public.goal_milestones for select
    using (owns_goal(goal_id) or is_admin_user(auth.uid()));

drop policy if exists "milestones_insert" on public.goal_milestones;
create policy "milestones_insert"
    on public.goal_milestones for insert
    with check (owns_goal(goal_id) or is_admin_user(auth.uid()));

drop policy if exists "milestones_update" on public.goal_milestones;
create policy "milestones_update"
    on public.goal_milestones for update
    using (owns_goal(goal_id) or is_admin_user(auth.uid()))
    with check (owns_goal(goal_id) or is_admin_user(auth.uid()));

drop policy if exists "milestones_delete" on public.goal_milestones;
create policy "milestones_delete"
    on public.goal_milestones for delete
    using (owns_goal(goal_id) or is_admin_user(auth.uid()));

-- ── rider_profiles ─────────────────────────────────────────────────────────

drop policy if exists "rider_select" on public.rider_profiles;
create policy "rider_select"
    on public.rider_profiles for select
    using (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "rider_insert" on public.rider_profiles;
create policy "rider_insert"
    on public.rider_profiles for insert
    with check (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "rider_update" on public.rider_profiles;
create policy "rider_update"
    on public.rider_profiles for update
    using (owns_user_id(user_id) or is_admin_user(auth.uid()))
    with check (owns_user_id(user_id) or is_admin_user(auth.uid()));

drop policy if exists "rider_delete" on public.rider_profiles;
create policy "rider_delete"
    on public.rider_profiles for delete
    using (owns_user_id(user_id) or is_admin_user(auth.uid()));
