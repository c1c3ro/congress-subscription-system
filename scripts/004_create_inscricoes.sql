-- Criar tabela de inscrições para os congressos
CREATE TABLE IF NOT EXISTS inscricoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  congresso TEXT NOT NULL CHECK (congresso IN ('uti', 'utipedneo')),
  nome_completo TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  tipo_aluno TEXT NOT NULL CHECK (tipo_aluno IN ('nao', 'nad', 'sao_camilo')),
  cidade_sao_camilo TEXT,
  area TEXT NOT NULL,
  area_outro TEXT,
  modalidade TEXT NOT NULL CHECK (modalidade IN ('estudante', 'profissional', 'parceiro')),
  hospital_parceiro TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice único para evitar duplicatas de CPF por congresso
  UNIQUE(congresso, cpf)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_inscricoes_congresso ON inscricoes(congresso);
CREATE INDEX IF NOT EXISTS idx_inscricoes_cpf ON inscricoes(cpf);
CREATE INDEX IF NOT EXISTS idx_inscricoes_created_at ON inscricoes(created_at DESC);

-- Habilitar RLS
ALTER TABLE inscricoes ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública (inscrições)
CREATE POLICY "Permitir inserção pública de inscrições" ON inscricoes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política para permitir leitura pública (admin dashboard)
CREATE POLICY "Permitir leitura pública de inscrições" ON inscricoes
  FOR SELECT
  TO anon
  USING (true);

-- Política para permitir deleção (admin)
CREATE POLICY "Permitir deleção pública de inscrições" ON inscricoes
  FOR DELETE
  TO anon
  USING (true);
