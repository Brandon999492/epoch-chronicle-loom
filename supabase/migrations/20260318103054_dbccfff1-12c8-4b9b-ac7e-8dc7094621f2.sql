
-- Learned events tracking
CREATE TABLE public.learned_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id text NOT NULL,
  event_title text,
  category text,
  learned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.learned_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learned events" ON public.learned_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own learned events" ON public.learned_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own learned events" ON public.learned_events FOR DELETE USING (auth.uid() = user_id);

-- Event notes
CREATE TABLE public.event_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event notes" ON public.event_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own event notes" ON public.event_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own event notes" ON public.event_notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own event notes" ON public.event_notes FOR DELETE USING (auth.uid() = user_id);

-- Bookmark folders
CREATE TABLE public.bookmark_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bookmark_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders" ON public.bookmark_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own folders" ON public.bookmark_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own folders" ON public.bookmark_folders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own folders" ON public.bookmark_folders FOR DELETE USING (auth.uid() = user_id);

-- Add folder_id to bookmarks
ALTER TABLE public.bookmarks ADD COLUMN folder_id uuid REFERENCES public.bookmark_folders(id) ON DELETE SET NULL;

-- Recently viewed events
CREATE TABLE public.recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id text NOT NULL,
  event_title text,
  category text,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recently viewed" ON public.recently_viewed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recently viewed" ON public.recently_viewed FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recently viewed" ON public.recently_viewed FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recently viewed" ON public.recently_viewed FOR DELETE USING (auth.uid() = user_id);
