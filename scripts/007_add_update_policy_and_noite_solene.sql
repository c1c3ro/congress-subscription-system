-- Adicionar política de UPDATE para status_pagamento
CREATE POLICY "Permitir atualização de inscrições"
ON inscricoes
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Adicionar coluna para rastrear confirmação da Noite Solene
ALTER TABLE inscricoes 
ADD COLUMN IF NOT EXISTS confirmacao_finalizada BOOLEAN DEFAULT FALSE;

-- Criar tabela de controle da Noite Solene
CREATE TABLE IF NOT EXISTS noite_solene_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_confirmados INTEGER DEFAULT 0,
  limite_vagas INTEGER DEFAULT 150,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política de leitura para noite_solene_counter
CREATE POLICY "Permitir leitura pública de noite_solene_counter"
ON noite_solene_counter
FOR SELECT
USING (true);

-- Inserir registro inicial
INSERT INTO noite_solene_counter (total_confirmados, limite_vagas)
SELECT 0, 150
WHERE NOT EXISTS (SELECT 1 FROM noite_solene_counter);
