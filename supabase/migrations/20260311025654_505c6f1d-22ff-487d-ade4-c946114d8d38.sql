
-- =============================================
-- PHASE 1: CORE RELATIONAL SCHEMA
-- =============================================

-- 1. Locations
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  alternate_names text[] DEFAULT '{}',
  latitude double precision,
  longitude double precision,
  region text,
  country text,
  continent text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Auth insert locations" ON public.locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update locations" ON public.locations FOR UPDATE TO authenticated USING (true);

-- 2. Time Periods (hierarchical with parent)
CREATE TABLE public.time_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  start_year bigint,
  end_year bigint,
  start_label text,
  end_label text,
  description text,
  parent_period_id uuid REFERENCES public.time_periods(id),
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.time_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read time_periods" ON public.time_periods FOR SELECT USING (true);
CREATE POLICY "Auth insert time_periods" ON public.time_periods FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update time_periods" ON public.time_periods FOR UPDATE TO authenticated USING (true);

-- 3. Civilizations
CREATE TABLE public.civilizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  start_year bigint,
  end_year bigint,
  start_label text,
  end_label text,
  description text,
  location_id uuid REFERENCES public.locations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.civilizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read civilizations" ON public.civilizations FOR SELECT USING (true);
CREATE POLICY "Auth insert civilizations" ON public.civilizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update civilizations" ON public.civilizations FOR UPDATE TO authenticated USING (true);

-- 4. Dynasties
CREATE TABLE public.dynasties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  start_year integer,
  end_year integer,
  start_label text,
  end_label text,
  description text,
  civilization_id uuid REFERENCES public.civilizations(id),
  location_id uuid REFERENCES public.locations(id),
  coat_of_arms_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dynasties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dynasties" ON public.dynasties FOR SELECT USING (true);
CREATE POLICY "Auth insert dynasties" ON public.dynasties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update dynasties" ON public.dynasties FOR UPDATE TO authenticated USING (true);

-- 5. Historical Figures
CREATE TABLE public.historical_figures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  birth_year integer,
  death_year integer,
  birth_label text,
  death_label text,
  title text,
  biography text,
  dynasty_id uuid REFERENCES public.dynasties(id),
  birth_location_id uuid REFERENCES public.locations(id),
  death_location_id uuid REFERENCES public.locations(id),
  image_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.historical_figures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read historical_figures" ON public.historical_figures FOR SELECT USING (true);
CREATE POLICY "Auth insert historical_figures" ON public.historical_figures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update historical_figures" ON public.historical_figures FOR UPDATE TO authenticated USING (true);

-- 6. Historical Events
CREATE TABLE public.historical_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  year bigint,
  year_label text,
  exact_date date,
  end_year bigint,
  end_year_label text,
  description text,
  detailed_description text,
  category text DEFAULT 'general',
  significance integer DEFAULT 5,
  location_id uuid REFERENCES public.locations(id),
  time_period_id uuid REFERENCES public.time_periods(id),
  civilization_id uuid REFERENCES public.civilizations(id),
  image_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.historical_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read historical_events" ON public.historical_events FOR SELECT USING (true);
CREATE POLICY "Auth insert historical_events" ON public.historical_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update historical_events" ON public.historical_events FOR UPDATE TO authenticated USING (true);

-- 7. Media Assets
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  thumbnail_url text,
  media_type text NOT NULL DEFAULT 'image',
  title text,
  description text,
  source text,
  source_url text,
  license text,
  width integer,
  height integer,
  file_size bigint,
  metadata jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read media_assets" ON public.media_assets FOR SELECT USING (true);
CREATE POLICY "Auth insert media_assets" ON public.media_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update own media" ON public.media_assets FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by);

-- Junction Tables
CREATE TABLE public.event_figures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.historical_events(id) ON DELETE CASCADE,
  figure_id uuid NOT NULL REFERENCES public.historical_figures(id) ON DELETE CASCADE,
  role text,
  UNIQUE(event_id, figure_id)
);
ALTER TABLE public.event_figures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read event_figures" ON public.event_figures FOR SELECT USING (true);
CREATE POLICY "Auth insert event_figures" ON public.event_figures FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.event_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.historical_events(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  UNIQUE(event_id, media_id)
);
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read event_media" ON public.event_media FOR SELECT USING (true);
CREATE POLICY "Auth insert event_media" ON public.event_media FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.figure_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id uuid NOT NULL REFERENCES public.historical_figures(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  UNIQUE(figure_id, media_id)
);
ALTER TABLE public.figure_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read figure_media" ON public.figure_media FOR SELECT USING (true);
CREATE POLICY "Auth insert figure_media" ON public.figure_media FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.figure_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id uuid NOT NULL REFERENCES public.historical_figures(id) ON DELETE CASCADE,
  related_figure_id uuid NOT NULL REFERENCES public.historical_figures(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  UNIQUE(figure_id, related_figure_id, relationship_type)
);
ALTER TABLE public.figure_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read figure_relationships" ON public.figure_relationships FOR SELECT USING (true);
CREATE POLICY "Auth insert figure_relationships" ON public.figure_relationships FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX idx_events_year ON public.historical_events(year);
CREATE INDEX idx_events_category ON public.historical_events(category);
CREATE INDEX idx_events_time_period ON public.historical_events(time_period_id);
CREATE INDEX idx_events_location ON public.historical_events(location_id);
CREATE INDEX idx_events_tags ON public.historical_events USING GIN(tags);
CREATE INDEX idx_figures_dynasty ON public.historical_figures(dynasty_id);
CREATE INDEX idx_figures_tags ON public.historical_figures USING GIN(tags);
CREATE INDEX idx_dynasties_civilization ON public.dynasties(civilization_id);
CREATE INDEX idx_media_type ON public.media_assets(media_type);
CREATE INDEX idx_media_tags ON public.media_assets USING GIN(tags);
CREATE INDEX idx_time_periods_years ON public.time_periods(start_year, end_year);
CREATE INDEX idx_civilizations_years ON public.civilizations(start_year, end_year);

-- Updated_at triggers
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_periods_updated_at BEFORE UPDATE ON public.time_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_civilizations_updated_at BEFORE UPDATE ON public.civilizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dynasties_updated_at BEFORE UPDATE ON public.dynasties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_figures_updated_at BEFORE UPDATE ON public.historical_figures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.historical_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
