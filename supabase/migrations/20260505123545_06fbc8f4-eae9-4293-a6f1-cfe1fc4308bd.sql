alter table public.venues
  add column if not exists google_place_id text,
  add column if not exists google_maps_url text,
  add column if not exists website_url text,
  add column if not exists google_rating numeric,
  add column if not exists google_user_rating_count int,
  add column if not exists google_types text[],
  add column if not exists google_photo_name text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists source text not null default 'manual',
  add column if not exists status text not null default 'published';

create unique index if not exists venues_google_place_id_key
  on public.venues (google_place_id)
  where google_place_id is not null;

create index if not exists venues_city_idx on public.venues (city);
create index if not exists venues_source_idx on public.venues (source);
create index if not exists venues_status_idx on public.venues (status);