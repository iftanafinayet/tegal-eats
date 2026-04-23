begin;

drop policy if exists "places_update_admin" on public.places;
create policy "places_update_admin"
on public.places
for update
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists "places_delete_admin" on public.places;
create policy "places_delete_admin"
on public.places
for delete
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

commit;
