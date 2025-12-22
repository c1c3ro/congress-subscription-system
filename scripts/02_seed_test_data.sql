-- Seed test_guests with 40 sample entries
INSERT INTO test_guests (name, companion, attended) VALUES
  ('Maria Silva', 'João Silva', false),
  ('Pedro Santos', NULL, false),
  ('Ana Costa', 'Carlos Costa', false),
  ('Lucas Oliveira', NULL, false),
  ('Juliana Ferreira', 'Rafael Ferreira', false),
  ('Bruno Almeida', NULL, true),
  ('Carla Rodrigues', 'Paulo Rodrigues', false),
  ('Diego Souza', NULL, false),
  ('Fernanda Lima', 'Marcelo Lima', false),
  ('Gabriel Martins', NULL, false),
  ('Helena Pereira', NULL, false),
  ('Igor Nascimento', 'Letícia Nascimento', false),
  ('Júlia Araújo', NULL, false),
  ('Kevin Barbosa', NULL, false),
  ('Laura Dias', 'Thiago Dias', false),
  ('Mateus Cardoso', NULL, false),
  ('Natália Gomes', NULL, true),
  ('Otávio Ribeiro', 'Patrícia Ribeiro', false),
  ('Paula Monteiro', NULL, false),
  ('Ricardo Teixeira', NULL, false),
  ('Sabrina Vieira', 'André Vieira', false),
  ('Tiago Castro', NULL, false),
  ('Úrsula Moreira', NULL, false),
  ('Victor Freitas', 'Yara Freitas', false),
  ('Wanda Correia', NULL, false),
  ('Xavier Pinto', NULL, false),
  ('Yasmin Carvalho', 'Zeca Carvalho', false),
  ('Zilda Barros', NULL, false),
  ('Alberto Melo', NULL, true),
  ('Beatriz Nunes', 'Caio Nunes', false),
  ('Cláudio Rocha', NULL, false),
  ('Daniela Cunha', NULL, false),
  ('Eduardo Mendes', 'Flávia Mendes', false),
  ('Gabriela Azevedo', NULL, false),
  ('Henrique Farias', NULL, false),
  ('Isabela Moura', 'José Moura', false),
  ('Leonardo Campos', NULL, false),
  ('Mariana Pires', NULL, false),
  ('Nicolas Soares', 'Olivia Soares', false),
  ('Priscila Duarte', NULL, false);

-- Seed test_confirmations with sample data
-- Some guests have confirmed, some declined, some pending
INSERT INTO test_confirmations (guest_id, guest_name, status, confirmed_at)
SELECT 
  id::text,
  name,
  CASE 
    WHEN random() < 0.6 THEN 'confirmed'
    WHEN random() < 0.8 THEN 'declined'
    ELSE 'pending'
  END,
  CASE 
    WHEN random() < 0.7 THEN NOW() - INTERVAL '1 day' * (random() * 7)::int
    ELSE NULL
  END
FROM test_guests
WHERE random() < 0.75; -- About 75% of guests have a confirmation record
