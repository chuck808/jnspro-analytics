-- Shared coach-rider thread. Deliberately separate from session_notes, which
-- stays rider-private (see report-generator work: session_notes RLS is
-- single-owner-only, and buildSessionReport.ts already aggregates every
-- note_type unfiltered into generated reports — reusing that table for
-- coach-shared content would leak private rider reflections to a coach).
--
-- "Flag this profile field as inaccurate" is modeled as a typed variant of a
-- message (message_type='profile_flag') rather than a separate table —
-- deliberate scope discipline, not an oversight.
create table if not exists public.coach_rider_messages (
    id uuid primary key default gen_random_uuid(),
    link_id uuid not null references public.coach_rider_links(id) on delete cascade,
    sender_id uuid not null references auth.users(id) on delete cascade,
    message_type text not null default 'message'
        check (message_type in ('message', 'profile_flag')),
    content text not null,
    flagged_field text,
    resolved_at timestamptz,
    created_at timestamptz not null default now(),
    constraint coach_rider_messages_flagged_field_check
        check (message_type = 'profile_flag' or flagged_field is null)
);

create index coach_rider_messages_link_idx on public.coach_rider_messages(link_id, created_at);

alter table public.coach_rider_messages enable row level security;

create policy "Coach or rider can view their thread"
    on public.coach_rider_messages for select
    using (
        exists (
            select 1 from public.coach_rider_links
            where coach_rider_links.id = coach_rider_messages.link_id
            and (coach_rider_links.coach_id = auth.uid() or coach_rider_links.rider_id = auth.uid())
        )
    );

create policy "Coach or rider can send messages on an active link"
    on public.coach_rider_messages for insert
    with check (
        sender_id = auth.uid()
        and exists (
            select 1 from public.coach_rider_links
            where coach_rider_links.id = coach_rider_messages.link_id
            and coach_rider_links.status = 'active'
            and (coach_rider_links.coach_id = auth.uid() or coach_rider_links.rider_id = auth.uid())
        )
    );

create policy "Rider can resolve a flag on their own thread"
    on public.coach_rider_messages for update
    using (
        message_type = 'profile_flag'
        and exists (
            select 1 from public.coach_rider_links
            where coach_rider_links.id = coach_rider_messages.link_id
            and coach_rider_links.rider_id = auth.uid()
        )
    );

create policy "Admins can view all coach-rider messages"
    on public.coach_rider_messages for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Defense in depth: the update policy above restricts which ROWS a rider may
-- touch, not which COLUMNS. Mirrors protect_parental_consent_fields() from
-- 20260711_add_parental_consent.sql.
create or replace function public.protect_coach_rider_message_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.role() <> 'service_role' then
        if new.link_id is distinct from old.link_id
           or new.sender_id is distinct from old.sender_id
           or new.message_type is distinct from old.message_type
           or new.content is distinct from old.content
           or new.flagged_field is distinct from old.flagged_field
           or new.created_at is distinct from old.created_at
        then
            raise exception 'only resolved_at may be updated on coach_rider_messages';
        end if;
    end if;
    return new;
end;
$$;

create trigger coach_rider_messages_protect_fields
    before update on public.coach_rider_messages
    for each row execute function public.protect_coach_rider_message_fields();

comment on table public.coach_rider_messages is
    'Shared coach-rider thread, distinct from session_notes (which stays rider-private). message_type=profile_flag lets a coach flag a suspected onboarding-profile inaccuracy without editing it directly; the rider resolves it themselves.';
