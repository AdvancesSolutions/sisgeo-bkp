-- =============================================================================
-- SGO - Schema Completo do Banco de Dados (PostgreSQL)
-- Índices de performance para buscas por data e setor
-- =============================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -----------------------------------------------------------------------------
-- USUÁRIOS E AUTENTICAÇÃO
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(32) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  employee_id UUID,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);

-- -----------------------------------------------------------------------------
-- LOCAIS E ÁREAS (Geofencing)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);

CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  risk_classification VARCHAR(20),
  cleaning_frequency VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_areas_location_id ON areas(location_id);
CREATE INDEX IF NOT EXISTS idx_areas_cleaning_frequency ON areas(cleaning_frequency);
CREATE UNIQUE INDEX IF NOT EXISTS idx_areas_location_name ON areas(location_id, name);

-- -----------------------------------------------------------------------------
-- FUNCIONÁRIOS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  role VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  unit_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_unit_id ON employees(unit_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_cpf ON employees(REPLACE(REPLACE(cpf, '.', ''), '-', '')) WHERE cpf IS NOT NULL;

-- -----------------------------------------------------------------------------
-- TAREFAS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time VARCHAR(5),
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  title VARCHAR(500),
  description TEXT,
  estimated_minutes INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rejected_comment TEXT,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de performance: buscas por data e setor
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_area_id ON tasks(area_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_area_date ON tasks(area_id, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_employee_date ON tasks(employee_id, scheduled_date DESC) WHERE employee_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- FOTOS DE TAREFA (Evidências S3)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS task_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type VARCHAR(16) NOT NULL,
  url VARCHAR(1024) NOT NULL,
  key VARCHAR(512) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_photos_task_id ON task_photos(task_id);
CREATE INDEX IF NOT EXISTS idx_task_photos_task_type ON task_photos(task_id, type);

-- -----------------------------------------------------------------------------
-- PONTO (TimeClock)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS time_clocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_url VARCHAR(1024),
  photo_key VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_clocks_employee_id ON time_clocks(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_clocks_created_at ON time_clocks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_clocks_employee_date ON time_clocks(employee_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- MATERIAIS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(32) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_comments_material_id ON material_comments(material_id);

-- -----------------------------------------------------------------------------
-- AUDITORIA
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(64) NOT NULL,
  entity VARCHAR(64) NOT NULL,
  entity_id VARCHAR(255),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Audit Trail: alterações de status com IP e User-Agent
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  entity VARCHAR(64) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  action VARCHAR(64) NOT NULL,
  previous_status VARCHAR(64),
  new_status VARCHAR(64),
  ip_address VARCHAR(45),
  user_agent TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);

-- -----------------------------------------------------------------------------
-- COMENTÁRIOS
-- -----------------------------------------------------------------------------

COMMENT ON TABLE audit_trail IS 'Registro de alterações de status com IP e User-Agent para auditoria';
COMMENT ON COLUMN areas.cleaning_frequency IS 'Frequência de limpeza: DIARIO, SEMANAL, 2X_DIA, etc.';
COMMENT ON COLUMN tasks.estimated_minutes IS 'Tempo estimado em minutos para cálculo de produtividade';
