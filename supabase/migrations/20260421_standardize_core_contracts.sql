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

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'category'
  ) then
    alter table public.places add column category text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'image_url'
  ) then
    alter table public.places add column image_url text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'review_count'
  ) then
    alter table public.places add column review_count integer not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'distance_km'
  ) then
    alter table public.places add column distance_km double precision;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'price_range'
  ) then
    alter table public.places add column price_range text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'hours'
  ) then
    alter table public.places add column hours text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'address'
  ) then
    alter table public.places add column address text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'description'
  ) then
    alter table public.places add column description text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'updated_at'
  ) then
    alter table public.places add column updated_at timestamptz not null default timezone('utc', now());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'username'
  ) then
    alter table public.reviews add column username text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'avatar_url'
  ) then
    alter table public.reviews add column avatar_url text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'photo_urls'
  ) then
    alter table public.reviews add column photo_urls text[] not null default '{}';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'upvote_count'
  ) then
    alter table public.reviews add column upvote_count integer not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'place_name'
  ) then
    alter table public.reviews add column place_name text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'updated_at'
  ) then
    alter table public.reviews add column updated_at timestamptz not null default timezone('utc', now());
  end if;
end
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'type'
  ) then
    execute $sql$
      update public.places
      set category = coalesce(nullif(category, ''), nullif(type, ''), 'venue')
      where category is null or trim(category) = ''
    $sql$;
  else
    execute $sql$
      update public.places
      set category = coalesce(nullif(category, ''), 'venue')
      where category is null or trim(category) = ''
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'image'
  ) then
    execute $sql$
      update public.places
      set image_url = coalesce(nullif(image_url, ''), nullif(image, ''))
      where image_url is null or trim(image_url) = ''
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'place_id'
  ) then
    execute $sql$
      update public.reviews r
      set place_name = p.name
      from public.places p
      where (r.place_name is null or trim(r.place_name) = '')
        and p.id::text = r.place_id::text
    $sql$;
  end if;
end
$$;

create index if not exists idx_places_category
  on public.places(category);

create index if not exists idx_places_avg_rating
  on public.places(avg_rating desc);

create index if not exists idx_reviews_place_id
  on public.reviews(place_id);

create index if not exists idx_reviews_created_at
  on public.reviews(created_at desc);

drop trigger if exists set_places_updated_at on public.places;
create trigger set_places_updated_at
before update on public.places
for each row
execute function public.set_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
before update on public.reviews
for each row
execute function public.set_updated_at();

create or replace function public.sync_place_review_stats()
returns trigger
language plpgsql
as $$
declare
  affected_place_id_text text;
begin
  affected_place_id_text := coalesce(new.place_id::text, old.place_id::text);

  update public.places p
  set
    review_count = coalesce(stats.review_count, 0),
    avg_rating = coalesce(stats.avg_rating, 0)
  from (
    select
      r.place_id::text as place_id_text,
      count(*)::integer as review_count,
      round(avg(coalesce(r.rating, 0))::numeric, 2)::double precision as avg_rating
    from public.reviews r
    where r.place_id::text = affected_place_id_text
    group by r.place_id::text
  ) stats
  where p.id::text = stats.place_id_text;

  update public.places
  set
    review_count = 0,
    avg_rating = 0
  where id::text = affected_place_id_text
    and not exists (
      select 1
      from public.reviews r
      where r.place_id::text = affected_place_id_text
    );

  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_place_review_stats_after_insert on public.reviews;
create trigger sync_place_review_stats_after_insert
after insert on public.reviews
for each row
execute function public.sync_place_review_stats();

drop trigger if exists sync_place_review_stats_after_update on public.reviews;
create trigger sync_place_review_stats_after_update
after update of rating, place_id on public.reviews
for each row
execute function public.sync_place_review_stats();

drop trigger if exists sync_place_review_stats_after_delete on public.reviews;
create trigger sync_place_review_stats_after_delete
after delete on public.reviews
for each row
execute function public.sync_place_review_stats();

update public.places p
set
  review_count = stats.review_count,
  avg_rating = stats.avg_rating
from (
  select
    r.place_id::text as place_id_text,
    count(*)::integer as review_count,
    round(avg(coalesce(r.rating, 0))::numeric, 2)::double precision as avg_rating
  from public.reviews r
  group by r.place_id::text
) stats
where p.id::text = stats.place_id_text;

update public.places p
set
  review_count = 0,
  avg_rating = 0
where not exists (
  select 1
  from public.reviews r
  where r.place_id::text = p.id::text
);

create or replace view public.app_places as
select
  p.id::text as id,
  p.name,
  coalesce(nullif(p.category, ''), 'venue') as category,
  p.image_url,
  coalesce(p.avg_rating, 0)::double precision as avg_rating,
  coalesce(p.review_count, 0)::integer as review_count,
  p.distance_km,
  p.price_range,
  p.hours,
  p.address,
  p.description,
  p.lat,
  p.lng
from public.places p;

create or replace view public.app_reviews as
select
  r.id::text as id,
  r.place_id::text as place_id,
  r.user_id::text as user_id,
  coalesce(nullif(r.username, ''), 'anon') as username,
  r.avatar_url,
  coalesce(r.rating, 0)::integer as rating,
  coalesce(r.comment, '') as comment,
  coalesce(r.photo_urls, '{}') as photo_urls,
  coalesce(r.upvote_count, 0)::integer as upvote_count,
  r.created_at,
  coalesce(nullif(r.place_name, ''), p.name, 'Tempat') as place_name
from public.reviews r
left join public.places p on p.id::text = r.place_id::text;

comment on view public.app_places is 'Normalized compatibility view for frontend place contract.';
comment on view public.app_reviews is 'Normalized compatibility view for frontend review contract.';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'type'
  ) then
    execute $sql$
      create or replace view public.app_places as
      select
        p.id::text as id,
        p.name,
        coalesce(nullif(p.category, ''), nullif(p.type, ''), 'venue') as category,
        p.image_url,
        coalesce(p.avg_rating, 0)::double precision as avg_rating,
        coalesce(p.review_count, 0)::integer as review_count,
        p.distance_km,
        p.price_range,
        p.hours,
        p.address,
        p.description,
        p.lat,
        p.lng
      from public.places p
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'image'
  ) then
    execute $sql$
      create or replace view public.app_places as
      select
        p.id::text as id,
        p.name,
        coalesce(nullif(p.category, ''), 'venue') as category,
        coalesce(nullif(p.image_url, ''), nullif(p.image, '')) as image_url,
        coalesce(p.avg_rating, 0)::double precision as avg_rating,
        coalesce(p.review_count, 0)::integer as review_count,
        p.distance_km,
        p.price_range,
        p.hours,
        p.address,
        p.description,
        p.lat,
        p.lng
      from public.places p
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'type'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'image'
  ) then
    execute $sql$
      create or replace view public.app_places as
      select
        p.id::text as id,
        p.name,
        coalesce(nullif(p.category, ''), nullif(p.type, ''), 'venue') as category,
        coalesce(nullif(p.image_url, ''), nullif(p.image, '')) as image_url,
        coalesce(p.avg_rating, 0)::double precision as avg_rating,
        coalesce(p.review_count, 0)::integer as review_count,
        p.distance_km,
        p.price_range,
        p.hours,
        p.address,
        p.description,
        p.lat,
        p.lng
      from public.places p
    $sql$;
  end if;
end
$$;

commit;
