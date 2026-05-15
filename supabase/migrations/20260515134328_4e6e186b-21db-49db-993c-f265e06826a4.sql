CREATE OR REPLACE FUNCTION public.admin_delete_contribution(_contribution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  _admin uuid := auth.uid();
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

  select user_id, points_awarded, status
    into _user_id, _points, _status
  from public.contributions where id = _contribution_id;

  if _user_id is null then
    raise exception 'contribution not found';
  end if;

  if _status <> 'removed' then
    update public.contributions set status = 'removed' where id = _contribution_id;

    insert into public.point_events (user_id, source_type, source_id, delta)
    values (_user_id, 'contribution_remove', _contribution_id, -_points);

    update public.profiles
      set points = greatest(0, coalesce(points,0) - _points)
      where id = _user_id
      returning points into _new_points;
  end if;

  delete from public.reports where contribution_id = _contribution_id;

  return jsonb_build_object(
    'contribution_id', _contribution_id,
    'user_id', _user_id,
    'deducted', _points
  );
end;
$$;