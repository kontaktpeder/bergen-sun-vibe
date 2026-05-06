
CREATE OR REPLACE FUNCTION public.submit_contribution(_type text, _venue_id uuid, _data jsonb, _is_confirm boolean DEFAULT false, _new_venue jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  _new_city text;
  _venue_slug text;
  _sun_status text;
  _google_place_id text;
  _google_maps_url text;
  _address text;
  _google_rating numeric;
  _google_user_rating_count int;
  _source text;
  _existing_venue_id uuid;
  _existing_venue_slug text;
  _existing_venue_name text;
  _confirm_distinct boolean;
  _close_lat numeric := 0.0027;     -- ~300 m latitude
  _close_lng numeric;               -- ~300 m longitude (depends on lat)
  _far_lat numeric := 0.018;        -- ~2 km bounding box for "similar name elsewhere in city"
  _far_lng numeric;
begin
  if _user is null then
    raise exception 'not authenticated';
  end if;
  if _type not in ('sun_report','beer_price','photo','venue_add') then
    raise exception 'invalid contribution type';
  end if;

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
       or (_new_venue->>'lng') is null
       or _new_venue->>'city' not in ('Bergen','Oslo') then
      raise exception 'invalid venue payload';
    end if;

    _new_name := trim(_new_venue->>'name');
    _new_lat := (_new_venue->>'lat')::numeric;
    _new_lng := (_new_venue->>'lng')::numeric;
    _new_city := _new_venue->>'city';
    _confirm_distinct := coalesce((_new_venue->>'confirm_distinct')::boolean, false);

    _close_lng := _close_lat / greatest(cos(radians(_new_lat)), 0.01);
    _far_lng   := _far_lat   / greatest(cos(radians(_new_lat)), 0.01);

    _google_place_id := nullif(trim(coalesce(_new_venue->>'google_place_id','')), '');
    _google_maps_url := nullif(trim(coalesce(_new_venue->>'google_maps_url','')), '');
    _address := nullif(trim(coalesce(_new_venue->>'address','')), '');
    _google_rating := nullif(_new_venue->>'google_rating','')::numeric;
    _google_user_rating_count := nullif(_new_venue->>'google_user_rating_count','')::int;
    _source := coalesce(nullif(_new_venue->>'source',''), 'manual');

    -- Hard dedupe on google_place_id
    if _google_place_id is not null then
      select v.id, v.slug
        into _existing_venue_id, _existing_venue_slug
      from public.venues v
      where v.google_place_id = _google_place_id
        and v.status = 'published'
      limit 1;

      if _existing_venue_id is not null then
        raise exception 'duplicate_google_place:%', _existing_venue_slug;
      end if;
    end if;

    -- HARD BLOCK: any venue within ~300 m with similar name in same city
    select v.id, v.slug, v.name
      into _existing_venue_id, _existing_venue_slug, _existing_venue_name
    from public.venues v
    where v.status = 'published'
      and v.city = _new_city
      and abs(v.lat - _new_lat) < _close_lat
      and abs(v.lng - _new_lng) < _close_lng
      and (
        lower(v.name) = lower(_new_name)
        or public.similarity_or_zero(lower(v.name), lower(_new_name)) > 0.7
      )
    limit 1;

    if _existing_venue_id is not null then
      raise exception 'duplicate_venue_close:%:%', _existing_venue_slug, _existing_venue_name;
    end if;

    -- SOFT WARN: similar name in same city, farther away → require confirm_distinct
    if not _confirm_distinct then
      select v.id, v.slug, v.name
        into _existing_venue_id, _existing_venue_slug, _existing_venue_name
      from public.venues v
      where v.status = 'published'
        and v.city = _new_city
        and abs(v.lat - _new_lat) < _far_lat
        and abs(v.lng - _new_lng) < _far_lng
        and (
          lower(v.name) = lower(_new_name)
          or public.similarity_or_zero(lower(v.name), lower(_new_name)) > 0.7
        )
      limit 1;

      if _existing_venue_id is not null then
        raise exception 'confirm_distinct_required:%:%', _existing_venue_slug, _existing_venue_name;
      end if;
    end if;

    _slug := lower(regexp_replace(
      regexp_replace(_new_name, '[^a-zA-Z0-9]+', '-', 'g'),
      '(^-|-$)', '', 'g'
    )) || '-' || substr(md5(random()::text), 1, 6);

    insert into public.venues (
      name, category, lat, lng, image_url, slug, tags, last_activity_at, city,
      address, google_place_id, google_maps_url, google_rating, google_user_rating_count, source
    )
    values (
      _new_name, _new_venue->>'category', _new_lat, _new_lng,
      nullif(_new_venue->>'image_url',''), _slug, '{}', now(), _new_city,
      _address, _google_place_id, _google_maps_url, _google_rating, _google_user_rating_count, _source
    )
    returning id into _venue;
  else
    if _venue is null then
      raise exception 'venue_id required';
    end if;

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

    select count(*) into _recent_count
    from public.contributions c
    where c.user_id = _user and c.venue_id = _venue and c.type = _type
      and c.status = 'active' and c.created_at > now() - interval '10 minutes';
    if _recent_count > 0 then
      raise exception 'cooldown: vent litt før du sender samme type bidrag igjen';
    end if;

    if _type = 'beer_price' then
      select count(*) into _dup_count
      from public.contributions c
      where c.user_id = _user and c.venue_id = _venue and c.type = 'beer_price'
        and c.status = 'active' and c.created_at > now() - interval '24 hours'
        and (c.data->>'price')::numeric = (_data->>'price')::numeric;
      if _dup_count > 0 then
        raise exception 'duplicate_price: du har allerede registrert samme pris her i dag';
      end if;
    end if;

    if _type = 'photo' then
      select count(*) into _dup_count
      from public.contributions c
      where c.user_id = _user and c.venue_id = _venue and c.type = 'photo'
        and c.status = 'active' and c.created_at > now() - interval '24 hours';
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

  if _type = 'sun_report' then
    _sun_status := case when _data->>'status' = 'sun' then 'sun-now' else 'shade' end;
    update public.venues
    set sun_status = _sun_status,
        last_activity_at = now()
    where id = _venue;
  else
    update public.venues
    set last_activity_at = now()
    where id = _venue;
  end if;

  select slug into _venue_slug from public.venues where id = _venue;

  return jsonb_build_object(
    'contribution_id', _contrib,
    'venue_id', _venue,
    'venue_slug', _venue_slug,
    'awarded_points', _award,
    'new_points', _new_points
  );
end;
$function$;
