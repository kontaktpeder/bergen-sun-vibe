
CREATE OR REPLACE FUNCTION public.admin_delete_venue(_venue_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  _admin uuid := auth.uid();
  _deleted_contribs int := 0;
begin
  if _admin is null then
    raise exception 'not authenticated';
  end if;
  if not public.has_role(_admin, 'admin') then
    raise exception 'not authorized';
  end if;

  -- Remove reports tied to contributions for this venue
  delete from public.reports r
  using public.contributions c
  where r.contribution_id = c.id
    and c.venue_id = _venue_id;

  -- Delete contributions for this venue
  with deleted as (
    delete from public.contributions
    where venue_id = _venue_id
    returning 1
  )
  select count(*) into _deleted_contribs from deleted;

  delete from public.venues where id = _venue_id;

  return jsonb_build_object(
    'venue_id', _venue_id,
    'deleted_contributions', _deleted_contribs
  );
end;
$function$;
