-- Script para limpar todas as tabelas
-- ATENÇÃO: Este script apaga todos os dados!

-- Remover todas as confirmações
DELETE FROM confirmations;

-- Remover todos os convidados
DELETE FROM guests;

-- Resetar contadores (opcional)
-- Se necessário, você pode adicionar comandos para resetar sequences
