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
