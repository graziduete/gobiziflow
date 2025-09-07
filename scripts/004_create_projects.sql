-- Create projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'planning' check (status in ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  start_date date,
  end_date date,
  budget decimal(12,2),
  company_id uuid references public.companies(id) on delete cascade not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.projects enable row level security;

-- RLS policies for projects
create policy "projects_select_admin"
  on public.projects for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "projects_insert_admin"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "projects_update_admin"
  on public.projects for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "projects_delete_admin"
  on public.projects for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow clients to view projects from their companies
create policy "projects_select_client"
  on public.projects for select
  using (
    exists (
      select 1 from public.user_companies uc
      where uc.company_id = company_id and uc.user_id = auth.uid()
    )
  );
