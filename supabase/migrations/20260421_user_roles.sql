-- Migration: Add user_roles table for role-based access control
-- Roles: 'admin' | 'user'

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'user')) default 'user',
  created_at timestamptz default now(),
  unique (user_id)
);

-- Allow users to read their own role
alter table public.user_roles enable row level security;

create policy "Users can read own role"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Only allow inserts from service role (or directly in Supabase dashboard)
-- To grant admin to a user, run in Supabase SQL editor:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('<uuid>', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Auto-assign 'user' role on new signup via a trigger
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_role on auth.users;
create trigger on_auth_user_created_role
  after insert on auth.users
  for each row execute procedure public.handle_new_user_role();
