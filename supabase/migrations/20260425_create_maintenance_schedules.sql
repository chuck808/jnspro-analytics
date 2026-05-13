-- Create maintenance_schedules table
create table if not exists public.maintenance_schedules (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    start_time timestamptz not null,
    end_time timestamptz not null,
    is_active boolean default true,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Add RLS policies
alter table public.maintenance_schedules enable row level security;

-- Anyone can view active maintenance schedules
create policy "Anyone can view active maintenance schedules"
    on public.maintenance_schedules
    for select
    using (is_active = true);

-- Only admins can insert/update/delete
create policy "Admins can manage maintenance schedules"
    on public.maintenance_schedules
    for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Create updated_at trigger
create or replace function public.handle_maintenance_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger maintenance_schedules_updated_at
    before update on public.maintenance_schedules
    for each row
    execute function public.handle_maintenance_updated_at();

-- Add index for time-based queries
create index maintenance_schedules_time_idx on public.maintenance_schedules(start_time, end_time, is_active);
