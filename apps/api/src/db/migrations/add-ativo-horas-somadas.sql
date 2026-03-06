-- Migração: flag para evitar soma duplicada de horas de uso do ativo
-- A soma ocorre no check-out (IN_REVIEW) ou na aprovação (DONE)

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ativo_horas_somadas boolean DEFAULT false;
