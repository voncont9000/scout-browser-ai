GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
CREATE POLICY "dealers_read_listing_images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'listing-images');
CREATE POLICY "admins_add_listing_images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-images' AND public.is_admin());
CREATE POLICY "admins_update_listing_images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'listing-images' AND public.is_admin()) WITH CHECK (bucket_id = 'listing-images' AND public.is_admin());
CREATE POLICY "admins_delete_listing_images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listing-images' AND public.is_admin());