
CREATE TABLE public.user_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Video',
  prompt text,
  script text,
  scenes jsonb DEFAULT '[]'::jsonb,
  style text DEFAULT 'documentary',
  duration_seconds integer DEFAULT 30,
  resolution text DEFAULT '1080p',
  status text DEFAULT 'draft',
  video_url text,
  thumbnail_url text,
  era text,
  category text DEFAULT 'general',
  linked_event_id text,
  is_favorite boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own videos" ON public.user_videos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own videos" ON public.user_videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own videos" ON public.user_videos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own videos" ON public.user_videos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_videos_updated_at BEFORE UPDATE ON public.user_videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
