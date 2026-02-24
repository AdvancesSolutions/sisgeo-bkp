-- Migração: raio_permitido em areas, tempo_estimado em cleaning_types
ALTER TABLE areas ADD COLUMN IF NOT EXISTS raio_permitido DOUBLE PRECISION NULL;
ALTER TABLE cleaning_types ADD COLUMN IF NOT EXISTS tempo_estimado INTEGER NULL;
