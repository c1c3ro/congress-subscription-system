-- Adicionar coluna congresso à tabela noite_solene_counter
ALTER TABLE noite_solene_counter ADD COLUMN IF NOT EXISTS congresso TEXT;

-- Limpar registros antigos
DELETE FROM noite_solene_counter;

-- Criar um registro para cada congresso com limite de 75 vagas cada
INSERT INTO noite_solene_counter (congresso, total_confirmados, limite_vagas) 
VALUES ('uti', 0, 75);

INSERT INTO noite_solene_counter (congresso, total_confirmados, limite_vagas) 
VALUES ('utipedneo', 0, 75);

-- Contar quantos inscritos já confirmaram por congresso e atualizar os contadores
UPDATE noite_solene_counter 
SET total_confirmados = (
  SELECT COUNT(*) 
  FROM inscricoes 
  WHERE inscricoes.congresso = noite_solene_counter.congresso 
    AND inscricoes.participa_noite_solene = TRUE
);
