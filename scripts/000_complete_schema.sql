-- Complete Database Schema for Client Project Dashboard
-- This script creates all tables, policies, triggers, and indexes in the correct order

-- =============================================================================
-- 1. PROFILES TABLE
-- =============================================================================

-- Create profiles table that references auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'client' check (role in ('admin', 'client')),
  is_first_login boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS policies for profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow admins to view all profiles
create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow admins to update all profiles
create policy "profiles_update_admin"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =============================================================================
-- 2. COMPANIES TABLE
-- =============================================================================

-- Create companies table
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  website text,
  contact_email text,
  contact_phone text,
  address text,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.companies enable row level security;

-- RLS policies for companies
create policy "companies_select_admin"
  on public.companies for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "companies_insert_admin"
  on public.companies for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "companies_update_admin"
  on public.companies for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "companies_delete_admin"
  on public.companies for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =============================================================================
-- 3. USER_COMPANIES TABLE
-- =============================================================================

-- Create user_companies relationship table
create table if not exists public.user_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, company_id)
);

-- Enable RLS
alter table public.user_companies enable row level security;

-- RLS policies for user_companies
create policy "user_companies_select_admin"
  on public.user_companies for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "user_companies_insert_admin"
  on public.user_companies for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "user_companies_update_admin"
  on public.user_companies for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "user_companies_delete_admin"
  on public.user_companies for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow users to view their own company relationships
create policy "user_companies_select_own"
  on public.user_companies for select
  using (user_id = auth.uid());

-- Allow clients to view companies through user_companies
create policy "companies_select_client"
  on public.companies for select
  using (
    exists (
      select 1 from public.user_companies uc
      where uc.company_id = id and uc.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 4. PROJECTS TABLE
-- =============================================================================

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

-- =============================================================================
-- 5. TASKS TABLE
-- =============================================================================

-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'completed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  estimated_hours decimal(5,2),
  actual_hours decimal(5,2),
  project_id uuid references public.projects(id) on delete cascade not null,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.tasks enable row level security;

-- RLS policies for tasks
create policy "tasks_select_admin"
  on public.tasks for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "tasks_insert_admin"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "tasks_update_admin"
  on public.tasks for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "tasks_delete_admin"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow clients to view tasks from their company projects
create policy "tasks_select_client"
  on public.tasks for select
  using (
    exists (
      select 1 from public.projects p
      join public.user_companies uc on uc.company_id = p.company_id
      where p.id = project_id and uc.user_id = auth.uid()
    )
  );

-- Allow users to update tasks assigned to them
create policy "tasks_update_assigned"
  on public.tasks for update
  using (assigned_to = auth.uid());

-- =============================================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'client')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Create trigger for new user registration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Add updated_at triggers to all tables
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at
  before update on public.companies
  for each row
  execute function public.handle_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row
  execute function public.handle_updated_at();

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();

-- =============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Create indexes for better performance
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

create index if not exists idx_companies_created_by on public.companies(created_by);
create index if not exists idx_companies_name on public.companies(name);

create index if not exists idx_user_companies_user_id on public.user_companies(user_id);
create index if not exists idx_user_companies_company_id on public.user_companies(company_id);

create index if not exists idx_projects_company_id on public.projects(company_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_created_by on public.projects(created_by);

create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due_date on public.tasks(due_date);

-- =============================================================================
-- COMPLETED: All tables, policies, triggers, and indexes created successfully
-- =============================================================================
