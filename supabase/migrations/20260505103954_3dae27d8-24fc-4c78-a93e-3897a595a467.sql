create or replace function public.submit_contribution(
  _type text,
  _venue_id uuid,
  _data jsonb,
  _is_confirm boolean default false,
  _new_venue jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _user uuid := auth.uid();
  _award int := 0;
  _venue uuid := _venue_id;
  _contrib uuid;
  _new_points int;
  _slug text;
begin
  if _user is null then
    raise exception 'not authenticated';
  end if;

  if _type not in ('sun_report','beer_price','photo','venue_add') then
    raise exception 'invalid contribution type';
  end if;

  -- award table
  _award := case _type
    when 'sun_report' then 5
    when 'beer_price' then case when _is_confirm then 3 else 10 end
    when 'photo' then 15
    when 'venue_add' then 25
  end;

  if _type = 'venue_add' then
    if _new_venue is null
       or coalesce(trim(_new_venue->>'name'), '') = ''
       or _new_venue->>'category' not in ('bar','cafe','restaurant')
       or (_new_venue->>'lat') is null
       or (_new_venue->>'lng') is null then
      raise exception 'invalid venue payload';
    end if;
    _slug := lower(regexp_replace(
      regexp_replace(_new_venue->>'name', '[^a-zA-Z0-9]+', '-', 'g'),
      '(^-|-$)', '', 'g'
    )) || '-' || substr(md5(random()::text), 1, 6);

    insert into public.venues (name, category, lat, lng, image_url, slug, tags, last_activity_at)
    values (
      _new_venue->>'name',
      _new_venue->>'category',
      (_new_venue->>'lat')::numeric,
      (_new_venue->>'lng')::numeric,
      nullif(_new_venue->>'image_url',''),
      _slug,
      '{}',
      now()
    )
    returning id into _venue;
  else
    if _venue is null then
      raise exception 'venue_id required';
    end if;

    -- per-type payload validation
    if _type = 'beer_price' then
      if (_data->>'price') is null
         or (_data->>'price')::numeric <= 0
         or (_data->>'price')::numeric > 1000 then
        raise exception 'invalid beer price';
      end if;
    elsif _type = 'sun_report' then
      if (_data->>'status') not in ('sun','shade') then
        raise exception 'invalid sun status';
      end if;
    elsif _type = 'photo' then
      if coalesce(_data->>'image_url','') = '' then
        raise exception 'image_url required';
      end if;
    end if;
  end if;

  insert into public.contributions (user_id, venue_id, type, data, points_awarded, status)
  values (_user, _venue, _type, _data, _award, 'active')
  returning id into _contrib;

  insert into public.point_events (user_id, source_type, source_id, delta)
  values (_user, 'contribution_create', _contrib, _award);

  update public.profiles
    set points = coalesce(points, 0) + _award
    where id = _user
    returning points into _new_points;

  update public.venues set last_activity_at = now() where id = _venue;

  return jsonb_build_object(
    'contribution_id', _contrib,
    'venue_id', _venue,
    'awarded_points', _award,
    'new_points', _new_points
  );
end;
$$;

revoke all on function public.submit_contribution(text, uuid, jsonb, boolean, jsonb) from public;
grant execute on function public.submit_contribution(text, uuid, jsonb, boolean, jsonb) to authenticated;
