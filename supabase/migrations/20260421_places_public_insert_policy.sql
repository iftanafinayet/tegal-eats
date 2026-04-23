begin;

alter table public.places enable row level security;

drop policy if exists "places_select_all" on public.places;
create policy "places_select_all"
on public.places
for select
using (true);

drop policy if exists "places_insert_public" on public.places;
create policy "places_insert_public"
on public.places
for insert
with check (true);

commit;
