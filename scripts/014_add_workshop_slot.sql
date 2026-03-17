-- Adicionar coluna "slot" para especificar qual horário o workshop pertence
-- Slot 0: Primeiro horário
-- Slot 1: Segundo horário
-- Slot 2: Terceiro horário
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS slot INTEGER DEFAULT 0;

-- Migrar dados existentes: atualizar slots baseado em order
-- Para manter compatibilidade com sistema anterior (order / 3)
UPDATE workshops 
SET slot = FLOOR("order" / 3)::INTEGER;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_workshops_slot ON workshops(slot);
