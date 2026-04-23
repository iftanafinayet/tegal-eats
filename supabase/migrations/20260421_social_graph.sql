begin;

create extension if not exists pgcrypto;

create table if not exists public.public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists idx_user_follows_follower_id
  on public.user_follows(follower_id);

create index if not exists idx_user_follows_following_id
  on public.user_follows(following_id);

drop trigger if exists set_public_profiles_updated_at on public.public_profiles;
create trigger set_public_profiles_updated_at
before update on public.public_profiles
for each row
execute function public.set_updated_at();

alter table public.public_profiles enable row level security;
alter table public.user_follows enable row level security;

drop policy if exists "public_profiles_select_all" on public.public_profiles;
create policy "public_profiles_select_all"
on public.public_profiles
for select
to public
using (true);

drop policy if exists "public_profiles_insert_own" on public.public_profiles;
create policy "public_profiles_insert_own"
on public.public_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "public_profiles_update_own" on public.public_profiles;
create policy "public_profiles_update_own"
on public.public_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_follows_select_all" on public.user_follows;
create policy "user_follows_select_all"
on public.user_follows
for select
to public
using (true);

drop policy if exists "user_follows_insert_own" on public.user_follows;
create policy "user_follows_insert_own"
on public.user_follows
for insert
to authenticated
with check (auth.uid() = follower_id);

drop policy if exists "user_follows_delete_own" on public.user_follows;
create policy "user_follows_delete_own"
on public.user_follows
for delete
to authenticated
using (auth.uid() = follower_id);

commit;
