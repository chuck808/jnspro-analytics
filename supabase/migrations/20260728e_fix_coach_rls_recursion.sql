-- Fixes infinite recursion (Postgres error 42P17) introduced by
-- 20260728d_add_coach_read_policies.sql.
--
-- The cycle: profiles' "Coach can view linked rider's profile" policy
-- queries coach_rider_links. coach_rider_links' "Admins can view all
-- coach-rider links" policy queries profiles again to check role='admin'.
-- Evaluating either policy re-triggers the other, forever.
--
-- Fix: move the admin check into a SECURITY DEFINER function. Such
-- functions run with the privileges of their owner, which bypasses RLS on
-- the tables they query internally (unless a table has FORCE ROW LEVEL
-- SECURITY set, which none here do) — so calling it from a policy can never
-- re-trigger that table's own RLS evaluation. This breaks the cycle at its
-- single point of contact (the three "admin bypass" policies below) without
-- touching the coach-read policies on profiles/training_goals/etc., since
-- those only become safe once coach_rider_links stops looping back.

create or replace function public.is_admin_user(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
	select exists (
		select 1 from public.profiles
		where profiles.id = check_user_id
		and profiles.role = 'admin'
	);
$$;

drop policy if exists "Admins can view all coach-rider links" on public.coach_rider_links;
create policy "Admins can view all coach-rider links"
	on public.coach_rider_links for select
	using (public.is_admin_user(auth.uid()));

drop policy if exists "Admins can view all coach-rider messages" on public.coach_rider_messages;
create policy "Admins can view all coach-rider messages"
	on public.coach_rider_messages for select
	using (public.is_admin_user(auth.uid()));

drop policy if exists "Admins can view all report shares" on public.report_shares;
create policy "Admins can view all report shares"
	on public.report_shares for select
	using (public.is_admin_user(auth.uid()));
