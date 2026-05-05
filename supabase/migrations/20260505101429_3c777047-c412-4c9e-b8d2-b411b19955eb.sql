-- Lock down the trigger function
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Remove permissive venue insert policy for now (will be reintroduced via contribution flow)
drop policy if exists "Authenticated users can add venues" on public.venues;