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

-- Allow clients to view their own company
create policy "companies_select_client"
  on public.companies for select
  using (
    exists (
      select 1 from public.user_companies uc
      where uc.company_id = id and uc.user_id = auth.uid()
    )
  );
