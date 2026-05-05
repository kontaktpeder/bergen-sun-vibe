revoke execute on function public.similarity_or_zero(text, text) from anon, authenticated, public;
revoke execute on function public.submit_contribution(text, uuid, jsonb, boolean, jsonb) from anon, public;
grant execute on function public.submit_contribution(text, uuid, jsonb, boolean, jsonb) to authenticated;