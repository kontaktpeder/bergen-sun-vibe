create index if not exists venues_city_idx on public.venues(city);
create index if not exists venues_city_area_idx on public.venues(city, area);
create index if not exists venues_tags_gin_idx on public.venues using gin(tags);
create index if not exists venues_slug_idx on public.venues(slug);