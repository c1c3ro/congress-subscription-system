-- Remover colunas antigas se existirem
ALTER TABLE inscricoes DROP COLUMN IF EXISTS pagamento_adicional;
ALTER TABLE workshops DROP COLUMN IF EXISTS eh_premium;

-- Adicionar coluna para classificar workshops como 'inclusos' ou 'adicionais'
ALTER TABLE workshops ADD COLUMN tipo TEXT NOT NULL DEFAULT 'inclusos' CHECK (tipo IN ('inclusos', 'adicionais'));

-- Adicionar coluna de quantidade de workshops selecionados na tabela inscricoes (1, 2 ou 3)
ALTER TABLE inscricoes ADD COLUMN quantidade_workshops INTEGER DEFAULT 1 CHECK (quantidade_workshops IN (1, 2, 3));

-- Criar índices para melhor performance
CREATE INDEX idx_workshops_tipo ON workshops(tipo);
CREATE INDEX idx_inscricoes_quantidade_workshops ON inscricoes(quantidade_workshops);
