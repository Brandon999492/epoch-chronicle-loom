
-- Drop dependent indexes first, then move extension, then recreate indexes
DROP INDEX IF EXISTS idx_events_title_trgm;
DROP INDEX IF EXISTS idx_figures_name_trgm;
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Recreate the indexes using the extensions schema operator class
CREATE INDEX idx_events_title_trgm ON public.historical_events USING gin (title extensions.gin_trgm_ops);
CREATE INDEX idx_figures_name_trgm ON public.historical_figures USING gin (name extensions.gin_trgm_ops);
