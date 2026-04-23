begin;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'review_appreciations') then
    truncate table public.review_appreciations restart identity;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_place_states') then
    truncate table public.user_place_states restart identity;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'favorites') then
    truncate table public.favorites restart identity;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'reviews') then
    truncate table public.reviews restart identity cascade;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'places') then
    truncate table public.places restart identity cascade;
  end if;
end
$$;

commit;
