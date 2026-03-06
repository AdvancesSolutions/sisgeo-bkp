-- Garante que tasks e locations tenham todas as colunas usadas pela API.
-- Execute se GET /tasks/:id retornar 500 (coluna inexistente).
-- Todas as alterações são idempotentes (IF NOT EXISTS).

-- Tasks: colunas adicionadas em migrações posteriores ao 00-ensure-core-tables
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at timestamptz NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_minutes integer NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checkin_lat double precision NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checkin_lng double precision NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checkout_lat double precision NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checkout_lng double precision NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sla_alerted_at timestamptz NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id uuid NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ativo_id uuid NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ativo_horas_somadas boolean DEFAULT false;

-- Locations: organization_id (usado na relação area.location)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS organization_id uuid NULL;
