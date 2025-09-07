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
