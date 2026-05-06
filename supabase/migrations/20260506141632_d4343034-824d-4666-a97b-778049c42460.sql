create unique index if not exists venues_google_place_id_unique
on public.venues (google_place_id)
where google_place_id is not null;