-- Bugfix (pre-existing, not introduced this session): protect_profile_sensitive_fields()
-- unconditionally required auth.uid() to be non-null for ANY update to public.profiles,
-- not just changes to the role/email columns its own name and logic say it's guarding.
-- This silently blocked every service-role (admin client) write to profiles — confirmed
-- live via a real signup request, which failed with "Not authenticated" (P0001) trying
-- to set date_of_birth via createSupabaseAdminClient(). Nothing in the codebase had
-- exercised an admin-client profiles UPDATE before now, so this was a latent bug, not
-- a regression from anything else.
--
-- Fix: service_role is already Postgres/Supabase's standard trusted bypass context (RLS
-- itself grants it full access by design) — this trigger was adding a stricter, almost
-- certainly unintended restriction on top of that for legitimate server-side operations.
-- The role/email protection itself is untouched: anonymous or ordinary user-session
-- requests (auth.role() <> 'service_role') still hit the exact same checks as before.

create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins may change role';
  end if;

  if new.email is distinct from old.email and not public.is_admin() then
    raise exception 'Email is managed by authentication and cannot be edited here';
  end if;

  return new;
end;
$$;
