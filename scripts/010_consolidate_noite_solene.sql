-- Consolidar múltiplos registros em um único
DELETE FROM noite_solene_counter WHERE id != (SELECT id FROM noite_solene_counter ORDER BY created_at ASC LIMIT 1);

-- Garantir que temos um único registro com valores corretos
DELETE FROM noite_solene_counter;

INSERT INTO noite_solene_counter (total_confirmados, limite_vagas) 
VALUES (0, 150);

-- Resetar coluna de Noite Solene nos inscritos
UPDATE inscricoes SET participa_noite_solene = FALSE;
