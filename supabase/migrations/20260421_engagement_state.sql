begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.user_place_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  place_name text,
  plan_status text not null check (plan_status in ('wishlist', 'this_week', 'visited')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, place_id)
);

create index if not exists idx_user_place_states_user_id
  on public.user_place_states(user_id);

create index if not exists idx_user_place_states_plan_status
  on public.user_place_states(user_id, plan_status);

drop trigger if exists set_user_place_states_updated_at on public.user_place_states;
create trigger set_user_place_states_updated_at
before update on public.user_place_states
for each row
execute function public.set_updated_at();

create table if not exists public.review_appreciations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  review_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, review_id)
);

create index if not exists idx_review_appreciations_user_id
  on public.review_appreciations(user_id);

create index if not exists idx_review_appreciations_place_id
  on public.review_appreciations(place_id);

drop trigger if exists set_review_appreciations_updated_at on public.review_appreciations;
create trigger set_review_appreciations_updated_at
before update on public.review_appreciations
for each row
execute function public.set_updated_at();

alter table public.user_place_states enable row level security;
alter table public.review_appreciations enable row level security;

drop policy if exists "user_place_states_select_own" on public.user_place_states;
create policy "user_place_states_select_own"
on public.user_place_states
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_place_states_insert_own" on public.user_place_states;
create policy "user_place_states_insert_own"
on public.user_place_states
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_place_states_update_own" on public.user_place_states;
create policy "user_place_states_update_own"
on public.user_place_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_place_states_delete_own" on public.user_place_states;
create policy "user_place_states_delete_own"
on public.user_place_states
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "review_appreciations_select_own" on public.review_appreciations;
create policy "review_appreciations_select_own"
on public.review_appreciations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "review_appreciations_insert_own" on public.review_appreciations;
create policy "review_appreciations_insert_own"
on public.review_appreciations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "review_appreciations_delete_own" on public.review_appreciations;
create policy "review_appreciations_delete_own"
on public.review_appreciations
for delete
to authenticated
using (auth.uid() = user_id);

commit;
