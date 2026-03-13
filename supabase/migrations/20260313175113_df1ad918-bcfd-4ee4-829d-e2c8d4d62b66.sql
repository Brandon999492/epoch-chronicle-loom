
-- Create is_admin() helper function (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop any existing permissive INSERT/UPDATE policies on all 11 historical tables
DO $$
DECLARE
  tbl TEXT;
  pol RECORD;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'locations','time_periods','civilizations','dynasties',
    'historical_figures','historical_events','media_assets',
    'event_figures','event_media','figure_media','figure_relationships'
  ])
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
        AND cmd IN ('INSERT','UPDATE','DELETE')
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;

-- Create admin-only INSERT/UPDATE policies on all 11 tables
CREATE POLICY "Admin insert locations" ON public.locations FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update locations" ON public.locations FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin insert time_periods" ON public.time_periods FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update time_periods" ON public.time_periods FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin insert civilizations" ON public.civilizations FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update civilizations" ON public.civilizations FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin insert dynasties" ON public.dynasties FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update dynasties" ON public.dynasties FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin insert historical_figures" ON public.historical_figures FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update historical_figures" ON public.historical_figures FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin insert historical_events" ON public.historical_events FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update historical_events" ON public.historical_events FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin insert media_assets" ON public.media_assets FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update media_assets" ON public.media_assets FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin insert event_figures" ON public.event_figures FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update event_figures" ON public.event_figures FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin insert event_media" ON public.event_media FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update event_media" ON public.event_media FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin insert figure_media" ON public.figure_media FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update figure_media" ON public.figure_media FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin insert figure_relationships" ON public.figure_relationships FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update figure_relationships" ON public.figure_relationships FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
