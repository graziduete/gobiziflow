-- Notifications and Settings schema for in-app bell notifications

-- SETTINGS TABLE (single-row)
create table if not exists public.settings (
  id int primary key default 1,
  notify_project_created boolean default true,
  notify_status_changed boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.settings (id)
values (1)
on conflict (id) do nothing;

alter table public.settings enable row level security;

-- Admins can view/update settings
create policy if not exists "settings_select_admin"
  on public.settings for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy if not exists "settings_update_admin"
  on public.settings for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  type text not null check (type in ('project_created','status_changed')),
  title text not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

-- Users can see their own notifications
create policy if not exists "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_company_id on public.notifications(company_id);
create index if not exists idx_notifications_project_id on public.notifications(project_id);

-- Allow users to mark their own notifications as read
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications for update
  using (user_id = auth.uid());

-- FUNCTIONS/TRIGGERS

-- Project created -> notify company users when enabled
create or replace function public.notify_on_project_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  should_notify boolean;
begin
  select s.notify_project_created into should_notify from public.settings s where s.id = 1;
  if should_notify then
    insert into public.notifications (user_id, company_id, project_id, type, title, message, created_at)
    select uc.user_id,
           new.company_id,
           new.id,
           'project_created',
           'Novo projeto criado — ' || new.name,
           'Projeto criado para a empresa',
           new.created_at
    from public.user_companies uc
    left join public.user_notification_prefs up on up.user_id = uc.user_id
    where uc.company_id = new.company_id
      and coalesce(up.project_created, true) = true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_project_created_notifications on public.projects;
create trigger trg_project_created_notifications
  after insert on public.projects
  for each row execute function public.notify_on_project_created();

-- Project status changed -> notify when enabled
create or replace function public.notify_on_project_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  should_notify boolean;
begin
  if new.status is distinct from old.status then
    select s.notify_status_changed into should_notify from public.settings s where s.id = 1;
    if should_notify then
      insert into public.notifications (user_id, company_id, project_id, type, title, message, created_at)
      select uc.user_id,
             new.company_id,
             new.id,
             'status_changed',
             'Status Projeto Alterado — ' || new.name,
             'De: ' || old.status || ' Para: ' || new.status,
             new.updated_at
      from public.user_companies uc
      left join public.user_notification_prefs up on up.user_id = uc.user_id
      where uc.company_id = new.company_id
        and coalesce(up.status_changed, true) = true;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_project_status_changed_notifications on public.projects;
create trigger trg_project_status_changed_notifications
  after update on public.projects
  for each row execute function public.notify_on_project_status_changed();

