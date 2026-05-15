CREATE OR REPLACE FUNCTION public.admin_update_venue(
  _venue_id uuid,
  _description text,
  _tags text[],
  _hours text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  _admin uuid := auth.uid();
begin
  if _admin is null then
    raise exception 'not authenticated';
  end if;
  if not public.has_role(_admin, 'admin') then
    raise exception 'not authorized';
  end if;

  update public.venues
  set description = coalesce(_description, ''),
      tags = coalesce(_tags, '{}'::text[]),
      hours = nullif(trim(coalesce(_hours, '')), '')
  where id = _venue_id;

  if not found then
    raise exception 'venue not found';
  end if;

  return jsonb_build_object('venue_id', _venue_id);
end;
$$;