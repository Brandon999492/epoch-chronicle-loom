
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_events_title_trgm ON public.historical_events USING GIN(title gin_trgm_ops);
CREATE INDEX idx_figures_name_trgm ON public.historical_figures USING GIN(name gin_trgm_ops);
