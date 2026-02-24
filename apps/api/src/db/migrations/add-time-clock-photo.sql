-- Migração: foto obrigatória no ponto (check-in/check-out)
ALTER TABLE time_clocks ADD COLUMN IF NOT EXISTS photo_url varchar(1024) NULL;
ALTER TABLE time_clocks ADD COLUMN IF NOT EXISTS photo_key varchar(512) NULL;
