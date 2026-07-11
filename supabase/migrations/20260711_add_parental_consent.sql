-- Parental consent for minors' data collection.
--
-- AppGatePro's privacy policy explicitly targets riders who may be under 18
-- ("Children's Privacy" section), but until now the app collected and
-- processed their data with no age verification or consent gate at all —
-- only a reactive "contact us if you're aware we collected a minor's data"
-- clause. This adds the fields needed to (a) know a rider's age at signup
-- and (b) block access for minors until a parent/guardian has confirmed
-- consent.
--
-- The age threshold itself lives in application code
-- (src/lib/server/consent.ts, MINOR_CONSENT_AGE_THRESHOLD) rather than here,
-- so it's a one-line change to adjust without a migration. IMPORTANT: that
-- threshold has not been reviewed by a lawyer for any specific jurisdiction
-- — treat this migration as the technical mechanism, not a compliance
-- certification.

alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists parent_guardian_email text,
  add column if not exists parental_consent_status text not null default 'not_required',
  add column if not exists parental_consent_token text,
  add column if not exists parental_consent_requested_at timestamptz,
  add column if not exists parental_consent_confirmed_at timestamptz;

alter table public.profiles
  add constraint profiles_parental_consent_status_check
  check (parental_consent_status in ('not_required', 'pending', 'approved', 'denied'));

comment on column public.profiles.parental_consent_status is
  'not_required = rider at/above the minor-consent age threshold at signup; '
  'pending = under threshold, awaiting parent/guardian confirmation (access blocked); '
  'approved = parent/guardian confirmed; denied = parent/guardian declined (access blocked). '
  'Threshold: src/lib/server/consent.ts MINOR_CONSENT_AGE_THRESHOLD.';

-- Defense in depth: these fields must only ever be written by server code
-- using the service-role admin client (signup, and the parental-consent
-- confirmation endpoint), never by a rider updating their own profile via
-- the normal RLS-governed client path — a rider must not be able to
-- self-approve their own consent gate.
create or replace function public.protect_parental_consent_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    if new.parental_consent_status is distinct from old.parental_consent_status
       or new.parental_consent_token is distinct from old.parental_consent_token
       or new.parental_consent_confirmed_at is distinct from old.parental_consent_confirmed_at
       or new.parent_guardian_email is distinct from old.parent_guardian_email
    then
      raise exception 'parental consent fields can only be modified by the server';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_consent_fields on public.profiles;
create trigger profiles_protect_consent_fields
  before update on public.profiles
  for each row execute function public.protect_parental_consent_fields();
