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
