-- 1. Roller
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

revoke execute on function public.has_role(uuid, app_role) from public;
grant execute on function public.has_role(uuid, app_role) to authenticated, anon;

create policy "Users can view own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 2. Utvid policies på reports/contributions slik at admins får oversikt
create policy "Admins can view all reports"
on public.reports for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all contributions"
on public.contributions for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 3. Modererings-RPC
create or replace function public.moderate_report(
  _report_id uuid,
  _action text  -- 'ignore' | 'remove'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _admin uuid := auth.uid();
  _contrib_id uuid;
  _user_id uuid;
  _points int;
  _status text;
  _new_points int;
begin
  if _admin is null then
    raise exception 'not authenticated';
  end if;
  if not public.has_role(_admin, 'admin') then
    raise exception 'not authorized';
  end if;
  if _action not in ('ignore','remove') then
    raise exception 'invalid action';
  end if;

  select contribution_id into _contrib_id
  from public.reports where id = _report_id;
  if _contrib_id is null then
    raise exception 'report not found';
  end if;

  if _action = 'ignore' then
    delete from public.reports where id = _report_id;
    return jsonb_build_object('action','ignore','report_id', _report_id);
  end if;

  -- remove
  select user_id, points_awarded, status
    into _user_id, _points, _status
  from public.contributions where id = _contrib_id;

  if _status <> 'removed' then
    update public.contributions set status = 'removed' where id = _contrib_id;

    insert into public.point_events (user_id, source_type, source_id, delta)
    values (_user_id, 'contribution_remove', _contrib_id, -_points);

    update public.profiles
      set points = greatest(0, coalesce(points,0) - _points)
      where id = _user_id
      returning points into _new_points;
  end if;

  delete from public.reports where contribution_id = _contrib_id;

  return jsonb_build_object(
    'action','remove',
    'contribution_id', _contrib_id,
    'user_id', _user_id,
    'deducted', _points
  );
end;
$$;

revoke execute on function public.moderate_report(uuid, text) from public, anon;
grant execute on function public.moderate_report(uuid, text) to authenticated;