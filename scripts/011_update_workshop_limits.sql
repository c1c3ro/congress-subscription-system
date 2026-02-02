-- Atualizar limites de workshops para 25
UPDATE workshops SET vagas_total = 25 WHERE vagas_total = 3;

-- Atualizar limites de temas livres para 25
UPDATE temas_livres SET vagas_total = 25 WHERE vagas_total = 3;

-- Verificar valores atualizados
SELECT 'Workshops' as tipo, congresso, titulo, vagas_total FROM workshops
UNION ALL
SELECT 'Temas Livres' as tipo, congresso, 'Temas Livres' as titulo, vagas_total FROM temas_livres;
