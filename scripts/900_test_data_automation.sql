-- Script de teste automatizado para o fluxo completo de inscrição
-- Este script popula dados de teste para validar todo o sistema

-- Limpar dados de teste anteriores (opcional - comentado por segurança)
-- DELETE FROM escolhas_inscrito WHERE inscrito_id IN (SELECT id FROM inscricoes WHERE cpf LIKE '999%');
-- DELETE FROM inscricoes WHERE cpf LIKE '999%';

-- TESTE 1: Criar inscritos para Workshop UTI (26 pessoas para testar limite de 25)
INSERT INTO inscricoes (congresso, nome_completo, cpf, email, telefone, tipo_aluno, area, modalidade, status_pagamento, confirmacao_finalizada)
SELECT
  'uti' as congresso,
  'Teste UTI Workshop ' || i as nome_completo,
  '999' || LPAD(i::text, 8, '0') || '00' as cpf,
  'teste' || i || '@test.com' as email,
  '88999999' || LPAD(i::text, 3, '0') as telefone,
  'nao' as tipo_aluno,
  'medicina' as area,
  'estudante' as modalidade,
  'pago' as status_pagamento,
  CASE WHEN i <= 25 THEN true ELSE false END as confirmacao_finalizada
FROM generate_series(1, 26) AS t(i)
WHERE NOT EXISTS (SELECT 1 FROM inscricoes WHERE cpf = '999' || LPAD((1)::text, 8, '0') || '00');

-- TESTE 2: Criar inscritos para Temas Livres UTI (26 pessoas para testar limite de 25)
INSERT INTO inscricoes (congresso, nome_completo, cpf, email, telefone, tipo_aluno, area, modalidade, status_pagamento, confirmacao_finalizada)
SELECT
  'uti' as congresso,
  'Teste UTI Temas Livres ' || i as nome_completo,
  '998' || LPAD(i::text, 8, '0') || '00' as cpf,
  'temas' || i || '@test.com' as email,
  '88988888' || LPAD(i::text, 3, '0') as telefone,
  'nao' as tipo_aluno,
  'enfermagem' as area,
  'profissional' as modalidade,
  'pago' as status_pagamento,
  CASE WHEN i <= 25 THEN true ELSE false END as confirmacao_finalizada
FROM generate_series(1, 26) AS t(i)
WHERE NOT EXISTS (SELECT 1 FROM inscricoes WHERE cpf = '998' || LPAD((1)::text, 8, '0') || '00');

-- TESTE 3: Criar inscritos para Noite Solene (155 pessoas para testar limite de 150)
INSERT INTO inscricoes (congresso, nome_completo, cpf, email, telefone, tipo_aluno, area, modalidade, status_pagamento, confirmacao_finalizada)
SELECT
  CASE WHEN i <= 100 THEN 'uti' ELSE 'utipedneo' END as congresso,
  'Teste Noite Solene ' || i as nome_completo,
  '997' || LPAD(i::text, 8, '0') || '00' as cpf,
  'solene' || i || '@test.com' as email,
  '88977777' || LPAD(i::text, 3, '0') as telefone,
  'nao' as tipo_aluno,
  'medicina' as area,
  'estudante' as modalidade,
  'pago' as status_pagamento,
  CASE WHEN i <= 155 THEN true ELSE false END as confirmacao_finalizada
FROM generate_series(1, 160) AS t(i)
WHERE NOT EXISTS (SELECT 1 FROM inscricoes WHERE cpf = '997' || LPAD((1)::text, 8, '0') || '00');

-- TESTE 4: Associar workshops aos inscritos de teste (Workshop UTI)
INSERT INTO escolhas_inscrito (inscrito_id, workshop_id, participa_temas_livres)
SELECT 
  i.id,
  w.id,
  false as participa_temas_livres
FROM inscricoes i
JOIN workshops w ON w.congresso = i.congresso AND w.titulo = 'Ventilação Mecânica Avançada'
WHERE i.cpf LIKE '999%' AND i.confirmacao_finalizada = true
LIMIT 25
ON CONFLICT (inscrito_id) DO NOTHING;

-- TESTE 5: Associar Temas Livres aos inscritos de teste
UPDATE inscricoes
SET confirmacao_finalizada = true
WHERE cpf LIKE '998%' AND confirmacao_finalizada = false;

INSERT INTO escolhas_inscrito (inscrito_id, workshop_id, participa_temas_livres)
SELECT 
  i.id,
  (SELECT id FROM workshops WHERE congresso = i.congresso LIMIT 1),
  true as participa_temas_livres
FROM inscricoes i
WHERE i.cpf LIKE '998%' AND i.confirmacao_finalizada = true
LIMIT 25
ON CONFLICT (inscrito_id) DO NOTHING;

-- TESTE 6: Marcar primeiros 150 inscritos como participantes da Noite Solene
UPDATE inscricoes
SET participa_noite_solene = true
WHERE id IN (
  SELECT id FROM inscricoes 
  WHERE cpf LIKE '997%' AND confirmacao_finalizada = true
  ORDER BY created_at ASC
  LIMIT 150
);

-- TESTE 7: Atualizar contador da Noite Solene
INSERT INTO noite_solene_counter (total_confirmados, limite_vagas) 
VALUES (150, 150)
ON CONFLICT (id) DO UPDATE SET total_confirmados = 150;

-- Resultado dos testes
SELECT 
  'Teste 1: Workshop UTI' as teste,
  COUNT(*) as total_inscritos,
  SUM(CASE WHEN e.workshop_id IS NOT NULL THEN 1 ELSE 0 END) as com_workshop,
  MAX(CASE WHEN e.workshop_id IS NOT NULL THEN 1 ELSE 0 END) * 25 as limite_esperado
FROM inscricoes i
LEFT JOIN escolhas_inscrito e ON i.id = e.inscrito_id
WHERE i.cpf LIKE '999%'
UNION ALL
SELECT 
  'Teste 2: Temas Livres UTI',
  COUNT(*),
  SUM(CASE WHEN e.participa_temas_livres = true THEN 1 ELSE 0 END),
  25
FROM inscricoes i
LEFT JOIN escolhas_inscrito e ON i.id = e.inscrito_id
WHERE i.cpf LIKE '998%'
UNION ALL
SELECT 
  'Teste 3: Noite Solene',
  COUNT(*),
  SUM(CASE WHEN i.participa_noite_solene = true THEN 1 ELSE 0 END),
  150
FROM inscricoes i
WHERE i.cpf LIKE '997%';
