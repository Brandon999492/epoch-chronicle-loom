
-- Learning paths table (predefined topics)
CREATE TABLE public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  description text,
  category text DEFAULT 'general',
  icon text DEFAULT 'book',
  lesson_count integer DEFAULT 0,
  difficulty text DEFAULT 'beginner',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read learning_paths" ON public.learning_paths FOR SELECT TO public USING (true);
CREATE POLICY "Admin insert learning_paths" ON public.learning_paths FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admin update learning_paths" ON public.learning_paths FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- User lesson progress
CREATE TABLE public.user_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  path_id uuid REFERENCES public.learning_paths(id) ON DELETE CASCADE NOT NULL,
  lesson_index integer NOT NULL DEFAULT 0,
  lesson_title text,
  lesson_content text,
  status text NOT NULL DEFAULT 'in_progress',
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.user_lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON public.user_lesson_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Quiz results
CREATE TABLE public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  path_id uuid REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  lesson_index integer,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  answers jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quiz results" ON public.quiz_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz results" ON public.quiz_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Seed default learning paths
INSERT INTO public.learning_paths (title, slug, description, category, icon, lesson_count, difficulty) VALUES
  ('Ancient Civilizations', 'ancient-civilizations', 'Explore the rise and fall of the world''s earliest civilizations including Mesopotamia, Egypt, Greece, and Rome.', 'ancient', 'landmark', 5, 'beginner'),
  ('Medieval History', 'medieval-history', 'Journey through the Middle Ages — feudalism, crusades, the Black Death, and the foundations of modern Europe.', 'medieval', 'castle', 5, 'intermediate'),
  ('World Wars', 'world-wars', 'Understand the causes, key battles, and lasting impact of World War I and World War II.', 'modern', 'swords', 5, 'intermediate'),
  ('British History', 'british-history', 'From Anglo-Saxon kings to the modern monarchy — the story of Britain through the ages.', 'british', 'crown', 5, 'beginner'),
  ('Scientific Discoveries', 'scientific-discoveries', 'Trace the breakthroughs that changed the world — from ancient astronomy to the atomic age.', 'science', 'flask-conical', 5, 'beginner'),
  ('The Age of Exploration', 'age-of-exploration', 'Discover how European explorers mapped the globe, established trade routes, and changed civilizations forever.', 'exploration', 'ship', 5, 'intermediate');
