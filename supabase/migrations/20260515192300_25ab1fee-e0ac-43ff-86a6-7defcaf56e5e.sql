create table public.user_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, venue_id)
);

create index user_favorites_user_idx on public.user_favorites(user_id, created_at desc);

alter table public.user_favorites enable row level security;

create policy "Users can view own favorites"
  on public.user_favorites for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on public.user_favorites for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.user_favorites for delete to authenticated
  using (auth.uid() = user_id);