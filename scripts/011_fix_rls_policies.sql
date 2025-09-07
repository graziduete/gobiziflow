-- Fix RLS policies to prevent infinite recursion
-- Drop existing problematic policies
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "companies_select_admin" on public.companies;
drop policy if exists "companies_insert_admin" on public.companies;
drop policy if exists "companies_update_admin" on public.companies;
drop policy if exists "companies_delete_admin" on public.companies;
drop policy if exists "projects_select_admin" on public.projects;
drop policy if exists "projects_insert_admin" on public.projects;
drop policy if exists "projects_update_admin" on public.projects;
drop policy if exists "projects_delete_admin" on public.projects;
drop policy if exists "tasks_select_admin" on public.tasks;
drop policy if exists "tasks_insert_admin" on public.tasks;
drop policy if exists "tasks_update_admin" on public.tasks;
drop policy if exists "tasks_delete_admin" on public.tasks;
drop policy if exists "user_companies_select_admin" on public.user_companies;
drop policy if exists "user_companies_insert_admin" on public.user_companies;
drop policy if exists "user_companies_update_admin" on public.user_companies;
drop policy if exists "user_companies_delete_admin" on public.user_companies;

-- Create new non-recursive policies using auth.jwt() claims
-- First, create a function to check if user is admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles policies (non-recursive)
create policy "profiles_select_all"
  on public.profiles for select
  using (true); -- Allow all authenticated users to read profiles

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- Companies policies
create policy "companies_all_admin"
  on public.companies for all
  using (public.is_admin())
  with check (public.is_admin());

-- User companies policies  
create policy "user_companies_all_admin"
  on public.user_companies for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "user_companies_select_own"
  on public.user_companies for select
  using (user_id = auth.uid());

-- Projects policies
create policy "projects_all_admin"
  on public.projects for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "projects_select_client"
  on public.projects for select
  using (
    exists (
      select 1 from public.user_companies uc
      where uc.company_id = company_id and uc.user_id = auth.uid()
    )
  );

-- Tasks policies
create policy "tasks_all_admin"
  on public.tasks for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "tasks_select_client"
  on public.tasks for select
  using (
    exists (
      select 1 from public.projects p
      join public.user_companies uc on uc.company_id = p.company_id
      where p.id = project_id and uc.user_id = auth.uid()
    )
  );

create policy "tasks_update_assigned"
  on public.tasks for update
  using (assigned_to = auth.uid());

-- Add missing columns to projects table for the requirements
alter table public.projects 
add column if not exists project_type text check (project_type in ('Web', 'Mobile', 'Bot', 'RPA')),
add column if not exists contracted_hours decimal(8,2) default 0,
add column if not exists consumed_hours decimal(8,2) default 0,
add column if not exists technical_responsible uuid references auth.users(id),
add column if not exists key_user uuid references auth.users(id),
add column if not exists detailed_status text default 'Pré-Planning' check (detailed_status in (
  'Pré-Planning', 'Revisão do Escopo', 'Desenho Funcional', 
  'Envio do Desenho Funcional', 'Aguardar Validação', 
  'Arquitetura e Estrutura', 'Desenvolvimento', 
  'Homologação com Usuário', 'Aprovação do Usuário', 
  'Preparação para Deploy', 'Solicitar Aprovação para Deploy', 
  'Deploy em Produção', 'Operação Assistida'
)),
add column if not exists completion_percentage decimal(5,2) default 0 check (completion_percentage >= 0 and completion_percentage <= 100);

-- Update existing projects to have default values
update public.projects 
set 
  project_type = 'Web',
  contracted_hours = 40,
  consumed_hours = 0,
  detailed_status = 'Pré-Planning',
  completion_percentage = 0
where project_type is null;
