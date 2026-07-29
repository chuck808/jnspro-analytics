-- Push-based report sharing: a rider explicitly sends a generated report to
-- one of their linked coaches. viewed_at is null IS the "notification" — the
-- coach dashboard counts unread shares from this column; no separate
-- notifications table exists or is needed.
create table if not exists public.report_shares (
    id uuid primary key default gen_random_uuid(),
    link_id uuid not null references public.coach_rider_links(id) on delete cascade,
    sender_id uuid not null references auth.users(id) on delete cascade,
    report jsonb not null,
    report_type text not null
        check (report_type in ('coach-session', 'progress', 'diagnostic', 'rider-parent')),
    created_at timestamptz not null default now(),
    viewed_at timestamptz
);

create index report_shares_link_idx on public.report_shares(link_id, created_at desc);
create index report_shares_unread_idx on public.report_shares(link_id) where viewed_at is null;

alter table public.report_shares enable row level security;

create policy "Coach or rider can view shares on their link"
    on public.report_shares for select
    using (
        exists (
            select 1 from public.coach_rider_links
            where coach_rider_links.id = report_shares.link_id
            and (coach_rider_links.coach_id = auth.uid() or coach_rider_links.rider_id = auth.uid())
        )
    );

create policy "Rider can share a report on their own active link"
    on public.report_shares for insert
    with check (
        sender_id = auth.uid()
        and exists (
            select 1 from public.coach_rider_links
            where coach_rider_links.id = report_shares.link_id
            and coach_rider_links.rider_id = auth.uid()
            and coach_rider_links.status = 'active'
        )
    );

create policy "Coach can mark their shares viewed"
    on public.report_shares for update
    using (
        exists (
            select 1 from public.coach_rider_links
            where coach_rider_links.id = report_shares.link_id
            and coach_rider_links.coach_id = auth.uid()
        )
    );

create policy "Admins can view all report shares"
    on public.report_shares for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

create or replace function public.protect_report_share_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.role() <> 'service_role' then
        if new.link_id is distinct from old.link_id
           or new.sender_id is distinct from old.sender_id
           or new.report is distinct from old.report
           or new.report_type is distinct from old.report_type
           or new.created_at is distinct from old.created_at
        then
            raise exception 'only viewed_at may be updated on report_shares';
        end if;
    end if;
    return new;
end;
$$;

create trigger report_shares_protect_fields
    before update on public.report_shares
    for each row execute function public.protect_report_share_fields();

comment on table public.report_shares is
    'Rider-initiated report shares to a linked coach. viewed_at null = unread, drives the coach dashboard notification badge.';
