REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
CREATE POLICY "service_role_job_state" ON public.job_state FOR ALL TO service_role USING (true) WITH CHECK (true);