-- profiles_select/profiles_update (pre-existing policies, not created via a
-- tracked migration) OR in is_admin() -- a STABLE but non-SECURITY-DEFINER
-- function whose own body queries public.profiles, making it itself subject
-- to profiles_select/profiles_update's RLS. Adding the two new coach
-- cross-profile visibility policies in 20260728d/20260728f pushed this over
-- Postgres's max_stack_depth ("stack depth limit exceeded", error 54001)
-- whenever a non-owner queries a profiles row -- exactly the coach/rider
-- cross-profile lookups this feature needs.
--
-- Fix: point profiles_select/profiles_update at is_admin_user(), the
-- SECURITY DEFINER function already introduced in 20260728e specifically
-- because it bypasses RLS on its internal profiles lookup, breaking the
-- recursion. Functionally identical check (id = ... and role = 'admin'),
-- just safe to call from within a profiles policy.
--
-- Note: is_admin() itself is used by the same non-security-definer pattern
-- across most other tables in this schema (sessions, bikes, training_goals,
-- runs, gate_runs, sprint_runs, etc.). None of those currently have more
-- than one non-owner bypass SELECT policy, so they aren't tripping this
-- today -- but the same landmine exists there and is worth a dedicated
-- follow-up pass, separate from this coach-feature fix.

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
    on public.profiles for select
    using ((auth.uid() = id) or is_admin_user(auth.uid()));

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
    on public.profiles for update
    using ((auth.uid() = id) or is_admin_user(auth.uid()))
    with check ((auth.uid() = id) or is_admin_user(auth.uid()));
