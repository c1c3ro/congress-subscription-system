-- Remover colunas antigas se existirem
ALTER TABLE inscricoes DROP COLUMN IF EXISTS pagamento_adicional;
ALTER TABLE workshops DROP COLUMN IF EXISTS eh_premium;

-- Adicionar coluna para classificar workshops como 'inclusos' ou 'adicionais'
ALTER TABLE workshops ADD COLUMN tipo TEXT NOT NULL DEFAULT 'inclusos' CHECK (tipo IN ('inclusos', 'adicionais'));

-- Adicionar coluna de workshops adicionais selecionados na tabela inscricoes (0, 1 ou 2)
ALTER TABLE inscricoes ADD COLUMN workshops_adicionais INTEGER DEFAULT 0 CHECK (workshops_adicionais IN (0, 1, 2));

-- Criar índices para melhor performance
CREATE INDEX idx_workshops_tipo ON workshops(tipo);
CREATE INDEX idx_inscricoes_workshops_adicionais ON inscricoes(workshops_adicionais);
