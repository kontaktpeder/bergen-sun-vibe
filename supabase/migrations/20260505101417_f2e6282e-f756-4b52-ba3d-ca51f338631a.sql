-- Extensions
create extension if not exists pgcrypto;

-- 1) profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- 2) venues
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  description text not null default '',
  image_url text,
  area text,
  hours text,
  lat numeric not null,
  lng numeric not null,
  price_level smallint not null default 2,
  rating numeric not null default 0,
  reviews integer not null default 0,
  sun_score smallint not null default 0,
  sun_status text not null default 'shade',
  sun_until text,
  deal_text text,
  family_friendly boolean not null default false,
  trending boolean not null default false,
  tags text[] not null default '{}',
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index venues_last_activity_idx on public.venues(last_activity_at desc);
create index venues_slug_idx on public.venues(slug);

alter table public.venues enable row level security;

create policy "Venues are viewable by everyone"
  on public.venues for select using (true);

create policy "Authenticated users can add venues"
  on public.venues for insert to authenticated with check (true);

-- 3) contributions
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete set null,
  type text not null check (type in ('sun_report','beer_price','photo','venue_add')),
  data jsonb not null default '{}'::jsonb,
  points_awarded integer not null default 0,
  status text not null default 'active' check (status in ('active','flagged','removed')),
  created_at timestamptz not null default now()
);

create index contributions_venue_created_idx on public.contributions(venue_id, created_at desc);
create index contributions_user_created_idx on public.contributions(user_id, created_at desc);
create index contributions_status_idx on public.contributions(status);

alter table public.contributions enable row level security;

create policy "Active contributions are viewable by everyone"
  on public.contributions for select using (status = 'active' or auth.uid() = user_id);

create policy "Users can insert own contributions"
  on public.contributions for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own contributions"
  on public.contributions for update using (auth.uid() = user_id);

-- 4) reports
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles(id) on delete cascade,
  contribution_id uuid not null references public.contributions(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (reporter_user_id, contribution_id)
);

create index reports_contribution_idx on public.reports(contribution_id);

alter table public.reports enable row level security;

create policy "Users can view own reports"
  on public.reports for select using (auth.uid() = reporter_user_id);

create policy "Users can create own reports"
  on public.reports for insert to authenticated with check (auth.uid() = reporter_user_id);

-- 5) point_events
create table public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  delta integer not null,
  created_at timestamptz not null default now()
);

create index point_events_user_created_idx on public.point_events(user_id, created_at desc);

alter table public.point_events enable row level security;

create policy "Users can view own point events"
  on public.point_events for select using (auth.uid() = user_id);

-- Auto profile creation on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();