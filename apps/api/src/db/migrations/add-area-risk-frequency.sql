-- Migração: classificação de risco e frequência de limpeza em áreas (setores)
ALTER TABLE areas ADD COLUMN IF NOT EXISTS risk_classification varchar(20) NULL;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS cleaning_frequency varchar(50) NULL;
