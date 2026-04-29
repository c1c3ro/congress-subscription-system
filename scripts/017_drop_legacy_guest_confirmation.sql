-- Remove tabelas legadas do projeto antigo (confirmação de convidados)
-- ATENÇÃO: isto apaga definitivamente essas tabelas/dados.

BEGIN;

-- Drop tables (if they exist)
DROP TABLE IF EXISTS public.confirmations;
DROP TABLE IF EXISTS public.guests;

COMMIT;

