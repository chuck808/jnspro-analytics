-- Mirror of the coach-read policy from 20260728d: lets a rider see the
-- profile (name/email) of a coach who has invited or is linked to them.
-- Without this, every rider-facing surface that needs to display "who is
-- this coach" (the report-share picker on the session page, the "My
-- Coaches" list in Settings) silently falls back to a generic placeholder,
-- since the RLS-governed client used by those pages has no permission to
-- read another user's profile row otherwise.
--
-- Not restricted to status = 'active' — a rider should be able to identify
-- who's inviting them even before accepting (pending_rider/pending_parent).
--
-- Safe from the recursion fixed in 20260728e: this subquery touches
-- coach_rider_links, whose policies no longer reference profiles directly
-- (the admin-bypass policy now calls the SECURITY DEFINER is_admin_user()).

create policy "Rider can view their coach's profile"
    on public.profiles for select
    using (
        deleted_at is null
        and exists (
            select 1 from public.coach_rider_links
            where coach_rider_links.coach_id = profiles.id
            and coach_rider_links.rider_id = auth.uid()
        )
    );
