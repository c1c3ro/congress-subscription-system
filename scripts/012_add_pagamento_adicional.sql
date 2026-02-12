-- Adicionar coluna de pagamento adicional na tabela inscricoes
ALTER TABLE inscricoes ADD COLUMN pagamento_adicional BOOLEAN DEFAULT FALSE;

-- Adicionar coluna para marcar workshops como premium
ALTER TABLE workshops ADD COLUMN eh_premium BOOLEAN DEFAULT FALSE;

-- Criar índice para melhor performance
CREATE INDEX idx_inscricoes_pagamento_adicional ON inscricoes(pagamento_adicional);
CREATE INDEX idx_workshops_eh_premium ON workshops(eh_premium);
