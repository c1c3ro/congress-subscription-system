-- Tabela de workshops
CREATE TABLE IF NOT EXISTS workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  congresso TEXT NOT NULL CHECK (congresso IN ('uti', 'utipedneo')),
  titulo TEXT NOT NULL,
  vagas_total INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Temas Livres (controle de vagas por congresso)
CREATE TABLE IF NOT EXISTS temas_livres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  congresso TEXT NOT NULL UNIQUE CHECK (congresso IN ('uti', 'utipedneo')),
  vagas_total INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de escolhas dos inscritos
CREATE TABLE IF NOT EXISTS escolhas_inscrito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscrito_id UUID NOT NULL REFERENCES inscricoes(id) ON DELETE CASCADE,
  workshop_id UUID REFERENCES workshops(id) ON DELETE SET NULL,
  participa_temas_livres BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inscrito_id)
);

-- Habilitar RLS
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE temas_livres ENABLE ROW LEVEL SECURITY;
ALTER TABLE escolhas_inscrito ENABLE ROW LEVEL SECURITY;

-- Políticas para workshops
CREATE POLICY "Permitir leitura pública de workshops" ON workshops FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de workshops" ON workshops FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de workshops" ON workshops FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de workshops" ON workshops FOR DELETE USING (true);

-- Políticas para temas_livres
CREATE POLICY "Permitir leitura pública de temas_livres" ON temas_livres FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de temas_livres" ON temas_livres FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de temas_livres" ON temas_livres FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de temas_livres" ON temas_livres FOR DELETE USING (true);

-- Políticas para escolhas_inscrito
CREATE POLICY "Permitir leitura pública de escolhas" ON escolhas_inscrito FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de escolhas" ON escolhas_inscrito FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de escolhas" ON escolhas_inscrito FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de escolhas" ON escolhas_inscrito FOR DELETE USING (true);

-- Inserir workshops fictícios para UTI
INSERT INTO workshops (congresso, titulo, vagas_total) VALUES
  ('uti', 'Ventilação Mecânica Avançada', 3),
  ('uti', 'Monitorização Hemodinâmica', 3),
  ('uti', 'Sedação e Analgesia em UTI', 3),
  ('uti', 'Ultrassom à Beira do Leito', 3);

-- Inserir workshops fictícios para UTI Pediátrica e Neonatal
INSERT INTO workshops (congresso, titulo, vagas_total) VALUES
  ('utipedneo', 'Reanimação Neonatal', 3),
  ('utipedneo', 'Ventilação em Pediatria', 3),
  ('utipedneo', 'Acesso Vascular Pediátrico', 3),
  ('utipedneo', 'Nutrição Enteral Neonatal', 3);

-- Inserir controle de vagas para Temas Livres
INSERT INTO temas_livres (congresso, vagas_total) VALUES
  ('uti', 3),
  ('utipedneo', 3);
