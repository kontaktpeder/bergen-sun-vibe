CREATE POLICY "Public can view contribution images"
ON storage.objects FOR SELECT
USING (bucket_id = 'contribution-images');