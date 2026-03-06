-- Migração: recuperação de senha (token e expiração)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token varchar(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires timestamp NULL;
