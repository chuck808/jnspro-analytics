-- Coach vetting gate (safeguarding). Until now any signed-in user could act
-- as a coach and invite riders (see the removed comment in
-- (protected)/(coach)/+layout.server.ts). This adds an admin-reviewed
-- application flow plus a direct admin-grant path for already-trusted
-- coaches, converging on one gating field: profiles.coach_status.
--
-- Unlike set_user_role/admin_role_audit (created directly in the Supabase
-- dashboard, no tracked migration -- a known pre-existing gap), this
-- feature's full schema is defined here per this session's discipline.

alter table public.profiles
  add column if not exists coach_status text not null default 'none';

alter table public.profiles
  add constraint profiles_coach_status_check
  check (coach_status in ('none', 'pending', 'approved', 'rejected'));

comment on column public.profiles.coach_status is
  'none = never applied; pending = application awaiting admin review; '
  'approved = may act as a coach (via review or admin direct grant); '
  'rejected = declined, may re-apply anytime (no cooldown). '
  'Gates (protected)/(coach)/* -- see src/lib/server/coachApplications.ts.';

-- Defense in depth: this field must only ever be written by
-- src/lib/server/coachApplications.ts using the service-role admin client
-- -- never by a user updating their own profile via the normal RLS-governed
-- client path. Mirrors protect_parental_consent_fields() exactly, kept as
-- its own function (single concern per trigger, matching this codebase's
-- convention of separate protect_* functions per sensitive-field group).
create or replace function public.protect_coach_status_field()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    if new.coach_status is distinct from old.coach_status then
      raise exception 'coach_status can only be modified by the server';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_coach_status on public.profiles;
create trigger profiles_protect_coach_status
  before update on public.profiles
  for each row execute function public.protect_coach_status_field();

-- Application + review trail. Append-only: re-applying after rejection
-- inserts a NEW row (never reuses/updates the old one), preserving full
-- history -- same "no cooldown" philosophy as coach_rider_links re-invite,
-- but here every attempt stays visible to admins forever.
create table if not exists public.coach_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'application'
    check (source in ('application', 'admin_grant')),
  qualification_details text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);

create index coach_applications_applicant_idx on public.coach_applications(applicant_id);
create index coach_applications_status_idx on public.coach_applications(status);

alter table public.coach_applications enable row level security;

create policy "Applicant can view own coach applications"
  on public.coach_applications for select
  using (auth.uid() = applicant_id);

create policy "Admins can view all coach applications"
  on public.coach_applications for select
  using (public.is_admin_user(auth.uid()));

-- No insert/update/delete policy at all -- every write (submit, approve,
-- reject, admin-grant) goes through src/lib/server/coachApplications.ts
-- using the service-role client. Mirrors coach_rider_links exactly.

comment on table public.coach_applications is
  'Coach vetting applications. Append-only -- re-applying after a rejection inserts a new row rather than reusing one. Current gate state lives on profiles.coach_status; this table is the review queue (status=''pending'') and full history. source=''admin_grant'' rows are pre-approved directly by an admin without a formal submission. All writes are server-only -- see src/lib/server/coachApplications.ts.';
