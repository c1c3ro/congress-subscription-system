-- Adicionar coluna para rastrear participação na Noite Solene
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS participa_noite_solene BOOLEAN DEFAULT FALSE;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_inscricoes_participa_noite_solene ON inscricoes(participa_noite_solene);
CREATE INDEX IF NOT EXISTS idx_inscricoes_confirmacao_finalizada ON inscricoes(confirmacao_finalizada);
