insert into storage.buckets (id, name, public)
values ('contribution-images', 'contribution-images', true)
on conflict (id) do nothing;

create policy "Public can read contribution images"
on storage.objects for select
to public
using (bucket_id = 'contribution-images');

create policy "Authenticated can upload contribution images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'contribution-images');
