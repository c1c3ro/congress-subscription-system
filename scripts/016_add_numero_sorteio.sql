-- Adicionar coluna numero_sorteio na tabela inscricoes
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS numero_sorteio INTEGER;

-- Criar índice único para garantir que não há números duplicados dentro do mesmo congresso
CREATE UNIQUE INDEX IF NOT EXISTS idx_inscricoes_numero_sorteio_congresso 
ON inscricoes (numero_sorteio, congresso) 
WHERE numero_sorteio IS NOT NULL;

-- Atribuir números aos inscritos já confirmados (que já escolheram workshops, por ordem de created_at)
-- UTI: 1 a 200
WITH uti_com_workshops AS (
  SELECT DISTINCT i.id, i.created_at
  FROM inscricoes i
  INNER JOIN escolhas_inscrito ei ON i.id = ei.inscrito_id
  WHERE i.congresso = 'uti' AND i.numero_sorteio IS NULL
),
uti_numerados AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as num
  FROM uti_com_workshops
)
UPDATE inscricoes
SET numero_sorteio = uti_numerados.num
FROM uti_numerados
WHERE inscricoes.id = uti_numerados.id;

-- UTI Ped/Neo: 201 a 400
WITH pedneo_com_workshops AS (
  SELECT DISTINCT i.id, i.created_at
  FROM inscricoes i
  INNER JOIN escolhas_inscrito ei ON i.id = ei.inscrito_id
  WHERE i.congresso = 'utipedneo' AND i.numero_sorteio IS NULL
),
pedneo_numerados AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) + 200 as num
  FROM pedneo_com_workshops
)
UPDATE inscricoes
SET numero_sorteio = pedneo_numerados.num
FROM pedneo_numerados
WHERE inscricoes.id = pedneo_numerados.id;
