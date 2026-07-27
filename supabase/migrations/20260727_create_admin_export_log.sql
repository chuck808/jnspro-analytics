-- Audit trail for research data exports (bulk CSV downloads of rider biomechanics data)
create table if not exists public.admin_export_log (
    id uuid primary key default gen_random_uuid(),
    admin_id uuid references auth.users(id) on delete set null,
    export_level text not null,
    date_from date,
    date_to date,
    row_count integer not null default 0,
    exported_at timestamptz not null default now()
);

alter table public.admin_export_log enable row level security;

-- Only admins can view the export log
create policy "Admins can view export log"
    on public.admin_export_log
    for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Inserts are written by the server using the service-role client, which
-- bypasses RLS, so no insert policy is needed for normal operation.

create index admin_export_log_exported_at_idx on public.admin_export_log(exported_at desc);
