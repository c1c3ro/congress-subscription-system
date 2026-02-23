-- Adicionar coluna "order" para ordenar workshops
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Remover constraint único que permite apenas 1 workshop por inscrito
-- Precisamos permitir múltiplos workshops por inscrito
ALTER TABLE escolhas_inscrito DROP CONSTRAINT IF EXISTS escolhas_inscrito_inscrito_id_key;

-- Adicionar coluna para identificar qual grupo de horário o workshop pertence
-- Isso será calculado automaticamente: workshop.order / 3
-- Mas podemos deixar como comentário na aplicação

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_workshops_order ON workshops("order");
CREATE INDEX IF NOT EXISTS idx_escolhas_inscrito_inscrito ON escolhas_inscrito(inscrito_id);
