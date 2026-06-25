CREATE TABLE IF NOT EXISTS public.flyer_names (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  storage_path text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.flyer_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_flyer_names" ON public.flyer_names FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_flyer_names" ON public.flyer_names FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_flyer_names" ON public.flyer_names FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_flyer_names" ON public.flyer_names FOR DELETE TO anon, authenticated USING (true);