-- User-level notification preferences (Option B)

create table if not exists public.user_notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  project_created boolean default true,
  status_changed boolean default true,
  due_reminder boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_notification_prefs enable row level security;

-- The user can read/update only their own preferences
drop policy if exists user_notif_prefs_select_own on public.user_notification_prefs;
create policy user_notif_prefs_select_own
  on public.user_notification_prefs for select
  using (user_id = auth.uid());

drop policy if exists user_notif_prefs_upsert_own on public.user_notification_prefs;
create policy user_notif_prefs_upsert_own
  on public.user_notification_prefs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Helpful index
create index if not exists idx_user_notification_prefs_user_id on public.user_notification_prefs(user_id);

