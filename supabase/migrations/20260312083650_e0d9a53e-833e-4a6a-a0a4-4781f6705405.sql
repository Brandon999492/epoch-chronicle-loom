
-- Drop all permissive INSERT policies on shared content tables
DROP POLICY IF EXISTS "Auth insert locations" ON public.locations;
DROP POLICY IF EXISTS "Auth insert time_periods" ON public.time_periods;
DROP POLICY IF EXISTS "Auth insert civilizations" ON public.civilizations;
DROP POLICY IF EXISTS "Auth insert dynasties" ON public.dynasties;
DROP POLICY IF EXISTS "Auth insert historical_figures" ON public.historical_figures;
DROP POLICY IF EXISTS "Auth insert historical_events" ON public.historical_events;
DROP POLICY IF EXISTS "Auth insert media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "Auth insert event_figures" ON public.event_figures;
DROP POLICY IF EXISTS "Auth insert event_media" ON public.event_media;
DROP POLICY IF EXISTS "Auth insert figure_media" ON public.figure_media;
DROP POLICY IF EXISTS "Auth insert figure_relationships" ON public.figure_relationships;

-- Drop all permissive UPDATE policies on shared content tables
DROP POLICY IF EXISTS "Auth update locations" ON public.locations;
DROP POLICY IF EXISTS "Auth update time_periods" ON public.time_periods;
DROP POLICY IF EXISTS "Auth update civilizations" ON public.civilizations;
DROP POLICY IF EXISTS "Auth update dynasties" ON public.dynasties;
DROP POLICY IF EXISTS "Auth update historical_figures" ON public.historical_figures;
DROP POLICY IF EXISTS "Auth update historical_events" ON public.historical_events;
DROP POLICY IF EXISTS "Auth update own media" ON public.media_assets;
