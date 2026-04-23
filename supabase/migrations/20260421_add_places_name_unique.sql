-- Add unique constraint to places name to support ON CONFLICT seeding
begin;

-- First, ensure there are no duplicates that would block the constraint
delete from public.places a using public.places b
where a.id < b.id and lower(trim(a.name)) = lower(trim(b.name));

-- Add the unique constraint
alter table public.places add constraint places_name_unique unique (name);

commit;
