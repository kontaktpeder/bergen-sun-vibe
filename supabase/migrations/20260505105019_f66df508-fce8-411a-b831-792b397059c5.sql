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
set search_path to 'public'
as $function$
declare
  _user uuid := auth.uid();
  _award int := 0;
  _venue uuid := _venue_id;
  _contrib uuid;
  _new_points int;
  _slug text;
  _recent_count int;
  _dup_count int;
  _new_lat numeric;
  _new_lng numeric;
  _new_name text;
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

    _new_name := trim(_new_venue->>'name');
    _new_lat := (_new_venue->>'lat')::numeric;
    _new_lng := (_new_venue->>'lng')::numeric;

    -- duplicate detection: similar name within ~80m
    -- 1 deg lat ~ 111km; 80m ~ 0.00072 deg
    -- lng compensation by cos(lat)
    select count(*) into _dup_count
    from public.venues v
    where (
        lower(v.name) = lower(_new_name)
        or public.similarity_or_zero(lower(v.name), lower(_new_name)) > 0.7
      )
      and (
        -- bounding box ~80m
        abs(v.lat - _new_lat) < 0.00072
        and abs(v.lng - _new_lng) < (0.00072 / greatest(cos(radians(_new_lat)), 0.01))
      );

    if _dup_count > 0 then
      raise exception 'duplicate_venue: et lignende sted finnes allerede i nærheten';
    end if;

    _slug := lower(regexp_replace(
      regexp_replace(_new_name, '[^a-zA-Z0-9]+', '-', 'g'),
      '(^-|-$)', '', 'g'
    )) || '-' || substr(md5(random()::text), 1, 6);

    insert into public.venues (name, category, lat, lng, image_url, slug, tags, last_activity_at)
    values (
      _new_name,
      _new_venue->>'category',
      _new_lat,
      _new_lng,
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

    -- general cooldown: same user+venue+type within 10 minutes
    select count(*) into _recent_count
    from public.contributions c
    where c.user_id = _user
      and c.venue_id = _venue
      and c.type = _type
      and c.status = 'active'
      and c.created_at > now() - interval '10 minutes';

    if _recent_count > 0 then
      raise exception 'cooldown: vent litt før du sender samme type bidrag igjen';
    end if;

    -- beer_price: same exact price within 24h => block
    if _type = 'beer_price' then
      select count(*) into _dup_count
      from public.contributions c
      where c.user_id = _user
        and c.venue_id = _venue
        and c.type = 'beer_price'
        and c.status = 'active'
        and c.created_at > now() - interval '24 hours'
        and (c.data->>'price')::numeric = (_data->>'price')::numeric;

      if _dup_count > 0 then
        raise exception 'duplicate_price: du har allerede registrert samme pris her i dag';
      end if;
    end if;

    -- photo: max 3 per user per venue per 24h
    if _type = 'photo' then
      select count(*) into _dup_count
      from public.contributions c
      where c.user_id = _user
        and c.venue_id = _venue
        and c.type = 'photo'
        and c.status = 'active'
        and c.created_at > now() - interval '24 hours';

      if _dup_count >= 3 then
        raise exception 'photo_limit: maks 3 bilder per sted per døgn';
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
$function$;

-- helper: similarity that returns 0 if pg_trgm extension is not available
create or replace function public.similarity_or_zero(a text, b text)
returns real
language plpgsql
immutable
set search_path to 'public'
as $$
declare
  _r real := 0;
begin
  -- simple Levenshtein-ish heuristic without extension:
  -- exact prefix match >= 6 chars => 0.8, otherwise 0
  if a is null or b is null then return 0; end if;
  if length(a) >= 6 and length(b) >= 6 and (left(a,6) = left(b,6)) then
    return 0.8;
  end if;
  return 0;
end;
$$;