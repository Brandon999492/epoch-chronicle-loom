
CREATE TABLE public.knowledge_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Note',
  content text DEFAULT '',
  html_content text DEFAULT '',
  category text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  color_theme text DEFAULT 'default',
  linked_year integer,
  linked_era text,
  linked_event_id text,
  media_urls text[] DEFAULT '{}',
  word_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own knowledge notes" ON public.knowledge_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own knowledge notes" ON public.knowledge_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own knowledge notes" ON public.knowledge_notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own knowledge notes" ON public.knowledge_notes FOR DELETE USING (auth.uid() = user_id);
