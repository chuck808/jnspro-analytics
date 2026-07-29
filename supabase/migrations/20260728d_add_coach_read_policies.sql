-- Additive SELECT-only policies granting a coach read access to their
-- linked riders' onboarding profile and goals. Postgres OR's permissive RLS
-- policies together, so these can only ever grant additional access — they
-- cannot reduce any policy already in place on these tables.
--
-- PRE-FLIGHT: profiles, training_goals, and rider_profiles have no CREATE
-- TABLE in this migrations folder (created directly against the live DB
-- before migration discipline was established here — same gap as the
-- set_user_role/refresh_performance_aggregates RPCs). Confirm via the
-- Supabase dashboard that RLS is actually enabled on all three before
-- applying this migration; if it isn't, these policies have no effect.
--
-- Every policy below excludes soft-deleted riders (profiles.deleted_at is
-- not null) and requires an active link — a coach must never retain access
-- via a stale/revoked/pending link.

create policy "Coach can view linked rider's profile"
    on public.profiles for select
    using (
        deleted_at is null
        and exists (
            select 1 from public.coach_rider_links
            where coach_rider_links.rider_id = profiles.id
            and coach_rider_links.coach_id = auth.uid()
            and coach_rider_links.status = 'active'
        )
    );

create policy "Coach can view linked rider's training goals"
    on public.training_goals for select
    using (
        exists (
            select 1 from public.coach_rider_links
            join public.profiles on profiles.id = coach_rider_links.rider_id
            where coach_rider_links.rider_id = training_goals.user_id
            and coach_rider_links.coach_id = auth.uid()
            and coach_rider_links.status = 'active'
            and profiles.deleted_at is null
        )
    );

create policy "Coach can view linked rider's goal milestones"
    on public.goal_milestones for select
    using (
        exists (
            select 1 from public.training_goals
            join public.coach_rider_links
                on coach_rider_links.rider_id = training_goals.user_id
            join public.profiles on profiles.id = coach_rider_links.rider_id
            where training_goals.id = goal_milestones.goal_id
            and coach_rider_links.coach_id = auth.uid()
            and coach_rider_links.status = 'active'
            and profiles.deleted_at is null
        )
    );

create policy "Coach can view linked rider's onboarding profile"
    on public.rider_profiles for select
    using (
        exists (
            select 1 from public.coach_rider_links
            join public.profiles on profiles.id = coach_rider_links.rider_id
            where coach_rider_links.rider_id = rider_profiles.user_id
            and coach_rider_links.coach_id = auth.uid()
            and coach_rider_links.status = 'active'
            and profiles.deleted_at is null
        )
    );
