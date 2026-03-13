
CREATE TABLE public.draft_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL DEFAULT 'event',
  status TEXT NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  generated_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  topic TEXT,
  category TEXT,
  created_by UUID NOT NULL,
  reviewed_by UUID,
  review_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.draft_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with drafts"
  ON public.draft_entries
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can read drafts"
  ON public.draft_entries
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
