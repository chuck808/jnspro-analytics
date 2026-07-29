-- Coach-rider relationship. One row per (coach_id, rider_id) pair; re-invite
-- reuses the same row via UPDATE rather than inserting a new one.
--
-- This table carries parent-consent token/status fields — the same
-- sensitivity class as profiles.parental_consent_* — so it deliberately gets
-- NO client-writable RLS policy at all. Every transition goes through
-- src/lib/server/coachLinks.ts using the service-role client, mirroring how
-- profiles.parental_consent_* is only ever written by auth/sign-up and
-- auth/parental-consent's server actions, never by the RLS-governed client.
create table if not exists public.coach_rider_links (
    id uuid primary key default gen_random_uuid(),
    coach_id uuid not null references auth.users(id) on delete cascade,
    rider_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'pending_rider'
        check (status in ('pending_rider', 'pending_parent', 'active', 'declined', 'denied', 'revoked')),
    invited_at timestamptz not null default now(),
    responded_at timestamptz,
    parent_consent_token text,
    parent_consent_requested_at timestamptz,
    parent_consent_confirmed_at timestamptz,
    revoked_at timestamptz,
    revoked_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint coach_rider_links_coach_rider_unique unique (coach_id, rider_id),
    constraint coach_rider_links_not_self check (coach_id <> rider_id)
);

create index coach_rider_links_coach_idx on public.coach_rider_links(coach_id);
create index coach_rider_links_rider_idx on public.coach_rider_links(rider_id);
create index coach_rider_links_status_idx on public.coach_rider_links(status);

alter table public.coach_rider_links enable row level security;

create policy "Coach or rider can view their own link"
    on public.coach_rider_links for select
    using (auth.uid() = coach_id or auth.uid() = rider_id);

create policy "Admins can view all coach-rider links"
    on public.coach_rider_links for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- No insert/update/delete policy — all writes go through
-- src/lib/server/coachLinks.ts using the service-role client.

create or replace function public.handle_coach_rider_links_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger coach_rider_links_updated_at
    before update on public.coach_rider_links
    for each row
    execute function public.handle_coach_rider_links_updated_at();

comment on table public.coach_rider_links is
    'Coach-rider relationships. Status lifecycle: pending_rider -> (active | pending_parent | declined); pending_parent -> (active | denied); active -> revoked. Re-invite after a terminal state resets the same row to pending_rider. All writes are server-only (service-role client) — see src/lib/server/coachLinks.ts.';
