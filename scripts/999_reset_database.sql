-- Script para limpar todas as tabelas
-- ATENÇÃO: Este script apaga todos os dados!

-- Ordem importa por conta de chaves estrangeiras

-- Remover escolhas (dependem de inscricoes/workshops)
DELETE FROM escolhas_inscrito;

-- Remover workshops/temas livres
DELETE FROM workshops;
DELETE FROM temas_livres;

-- Remover inscrições
DELETE FROM inscricoes;

-- Remover contador da Noite Solene
DELETE FROM noite_solene_counter;

-- Se necessário, adicione aqui reset de sequences/contadores
