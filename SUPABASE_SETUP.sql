-- ICT Club of NJBS — Supabase setup
-- Run this file in the SQL editor of the Supabase project connected to this app.
-- It creates the tables used by the application and the required RLS policies.

create extension if not exists pgcrypto;

-- OAuth setup is configured in Supabase Authentication > Providers:
-- enable Google and GitHub, then add this app's deployed URL to the provider redirect allowlist.
-- Required redirect URL format: https://YOUR-VERCEL-DOMAIN.vercel.app/
-- The visitor auth UI calls signInWithOAuth; member logins continue using email/password.

create table if not exists public.admin_allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

insert into public.admin_allowlist (email)
values ('njbsictclub@gmail.com')
on conflict (email) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'visitor' check (role in ('visitor', 'member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  member_id text not null unique,
  display_name text not null default '',
  org_url text,
  website text,
  created_at timestamptz not null default now()
);

alter table public.admin_allowlist enable row level security;
alter table public.profiles enable row level security;
alter table public.member_profiles enable row level security;

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select to authenticated using (auth.uid() = id);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists member_profiles_public_read on public.member_profiles;
create policy member_profiles_public_read on public.member_profiles for select to anon, authenticated using (true);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when lower(coalesce(new.email, '')) = 'njbsictclub@gmail.com' then 'admin' else coalesce(new.raw_user_meta_data ->> 'role', 'visitor') end
  )
  on conflict (id) do update set full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

update public.profiles
set role = 'admin', updated_at = now()
where id in (select id from auth.users where lower(email) = 'njbsictclub@gmail.com');

create table if not exists public.app_data (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submissions_kind_created_at_idx
  on public.submissions (kind, created_at desc);

alter table public.app_data enable row level security;
alter table public.submissions enable row level security;
alter table public.integrations enable row level security;

drop policy if exists app_data_public_read on public.app_data;
create policy app_data_public_read on public.app_data
  for select using (true);

drop policy if exists app_data_authenticated_write on public.app_data;
create policy app_data_authenticated_write on public.app_data
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists submissions_public_insert on public.submissions;
create policy submissions_public_insert on public.submissions
  for insert to anon, authenticated
  with check (true);

drop policy if exists submissions_authenticated_read on public.submissions;
create policy submissions_authenticated_read on public.submissions
  for select to authenticated
  using (auth.uid() is not null);

drop policy if exists submissions_authenticated_delete on public.submissions;
create policy submissions_authenticated_delete on public.submissions
  for delete to authenticated
  using (auth.uid() is not null);

drop policy if exists integrations_authenticated_all on public.integrations;
create policy integrations_authenticated_all on public.integrations
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_data_set_updated_at on public.app_data;
create trigger app_data_set_updated_at
before update on public.app_data
for each row execute function public.set_updated_at();

drop trigger if exists integrations_set_updated_at on public.integrations;
create trigger integrations_set_updated_at
before update on public.integrations
for each row execute function public.set_updated_at();

alter table public.app_data replica identity full;
alter table public.submissions replica identity full;

-- Realtime is needed for shared admin edits to appear for visitors.
do $$
begin
  alter publication supabase_realtime add table public.app_data;
exception when duplicate_object then
  null;
end $$;

-- Member logins are created by the server-side admin functions through
-- Supabase Auth. Do not insert into auth.users manually.
-- Their internal email is username@njbsict.club.

-- Team member GitHub organization and website URLs are stored in the JSON
-- value for the `team` row, for example:
-- {"orgUrl":"https://github.com/your-org","website":"https://example.com"}

-- Verification:
-- select key, updated_at from public.app_data order by key;
-- select kind, count(*) from public.submissions group by kind;
-- select tablename, policyname from pg_policies
-- where tablename in ('app_data','submissions','integrations');

-- Keep any service-role key server-side only.
