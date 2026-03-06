-- Migração: adicionar employee_id na tabela users (vínculo funcionário ↔ acesso ao app)
-- Execute manualmente em produção se NODE_ENV=production (synchronize: false)

ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id uuid NULL;
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
