CREATE TABLE public.sim_temas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  foto_inspiracao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.sim_pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'Decoracao',
  foto_png text NOT NULL DEFAULT '',
  camada_z smallint NOT NULL DEFAULT 3,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sim_temas, public.sim_pecas TO anon, authenticated;
GRANT ALL ON public.sim_temas, public.sim_pecas TO service_role;
ALTER TABLE public.sim_temas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read temas" ON public.sim_temas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read pecas" ON public.sim_pecas FOR SELECT TO anon, authenticated USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.sim_temas, public.sim_pecas;