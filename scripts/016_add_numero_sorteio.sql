-- Adicionar coluna numero_sorteio na tabela inscricoes
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS numero_sorteio INTEGER;

-- Criar índice único para garantir que não há números duplicados dentro do mesmo congresso
CREATE UNIQUE INDEX IF NOT EXISTS idx_inscricoes_numero_sorteio_congresso 
ON inscricoes (numero_sorteio, congresso) 
WHERE numero_sorteio IS NOT NULL;

-- Atribuir números aos inscritos já confirmados (que já escolheram workshops, por ordem de created_at)
-- UTI: 1 a 200
WITH uti_numerados AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as num
  FROM inscricoes
  WHERE congresso = 'uti' 
    AND workshops_escolhidos IS NOT NULL 
    AND array_length(workshops_escolhidos, 1) > 0
    AND numero_sorteio IS NULL
)
UPDATE inscricoes
SET numero_sorteio = uti_numerados.num
FROM uti_numerados
WHERE inscricoes.id = uti_numerados.id;

-- UTI Ped/Neo: 201 a 400
WITH pedneo_numerados AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) + 200 as num
  FROM inscricoes
  WHERE congresso = 'utipedneo' 
    AND workshops_escolhidos IS NOT NULL 
    AND array_length(workshops_escolhidos, 1) > 0
    AND numero_sorteio IS NULL
)
UPDATE inscricoes
SET numero_sorteio = pedneo_numerados.num
FROM pedneo_numerados
WHERE inscricoes.id = pedneo_numerados.id;
