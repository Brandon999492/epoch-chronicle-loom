
-- User-submitted custom historical events
CREATE TABLE public.custom_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  year_label TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  era TEXT,
  image_url TEXT,
  video_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom events" ON public.custom_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert custom events" ON public.custom_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own custom events" ON public.custom_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own custom events" ON public.custom_events FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_custom_events_updated_at BEFORE UPDATE ON public.custom_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
