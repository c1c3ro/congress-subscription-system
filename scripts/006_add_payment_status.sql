-- Adicionar coluna de status de pagamento na tabela inscricoes
ALTER TABLE inscricoes 
ADD COLUMN IF NOT EXISTS status_pagamento text DEFAULT NULL;
