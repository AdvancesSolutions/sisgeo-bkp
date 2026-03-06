-- Migração: IA Vision, Gamificação, IoT, ESG, Estoque
-- Executada por: pnpm --filter @sigeo/api run db:migrate

-- Medalhas (gamificação)
CREATE TABLE IF NOT EXISTS medalhas (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  description varchar(255) NULL,
  icon varchar(64) NOT NULL,
  pontos_requeridos integer DEFAULT 0,
  score_minimo integer NULL,
  category varchar(32) NOT NULL,
  organization_id uuid NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Medalhas conquistadas por colaborador
CREATE TABLE IF NOT EXISTS employee_medalhas (
  id uuid PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  medalha_id uuid NOT NULL REFERENCES medalhas(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL,
  period_start date NULL,
  period_end date NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_medalhas_employee ON employee_medalhas(employee_id);

-- Pontos por colaborador (troca por benefícios)
CREATE TABLE IF NOT EXISTS employee_pontos (
  id uuid PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pontos integer DEFAULT 0,
  periodo varchar(7) NOT NULL,
  organization_id uuid NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_pontos_employee ON employee_pontos(employee_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_pontos_emp_period ON employee_pontos(employee_id, periodo);

-- Sensores IoT
CREATE TABLE IF NOT EXISTS sensores (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  type varchar(64) NOT NULL,
  area_id uuid NULL REFERENCES areas(id) ON DELETE SET NULL,
  location_id uuid NULL REFERENCES locations(id) ON DELETE SET NULL,
  device_id varchar(128) NOT NULL,
  threshold_pessoas integer NULL,
  material_id uuid NULL,
  organization_id uuid NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Eventos de sensores
CREATE TABLE IF NOT EXISTS sensor_eventos (
  id uuid PRIMARY KEY,
  sensor_id uuid NOT NULL REFERENCES sensores(id) ON DELETE CASCADE,
  event_type varchar(32) NOT NULL,
  payload jsonb NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sensor_eventos_sensor ON sensor_eventos(sensor_id);

-- Produtos químicos (ESG)
CREATE TABLE IF NOT EXISTS produtos_quimicos (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  categoria varchar(64) NULL,
  litros_por_uso float NULL,
  pegada_hidrica_por_litro float NULL,
  residuo_kg_por_uso float NULL,
  organization_id uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Movimentações de estoque (QR Code)
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id uuid PRIMARY KEY,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  tipo varchar(32) NOT NULL,
  quantidade integer NOT NULL,
  employee_id uuid NULL REFERENCES employees(id) ON DELETE SET NULL,
  qr_code varchar(128) NULL,
  area_id uuid NULL,
  organization_id uuid NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estoque_mov_material ON estoque_movimentacoes(material_id);

-- Resultado validação IA em fotos
CREATE TABLE IF NOT EXISTS ai_check_results (
  id uuid PRIMARY KEY,
  task_photo_id uuid NOT NULL REFERENCES task_photos(id) ON DELETE CASCADE,
  provider varchar(32) NOT NULL,
  status varchar(32) NOT NULL,
  confidence float NULL,
  details jsonb NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_check_task_photo ON ai_check_results(task_photo_id);

-- Feed de boas práticas
CREATE TABLE IF NOT EXISTS boas_praticas (
  id uuid PRIMARY KEY,
  task_photo_id uuid NOT NULL REFERENCES task_photos(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  caption text NULL,
  likes_count integer DEFAULT 0,
  organization_id uuid NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boas_praticas_org ON boas_praticas(organization_id);

-- Materials: QR Code e location para inventário
ALTER TABLE materials ADD COLUMN IF NOT EXISTS qr_code varchar(128) NULL;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS location_id uuid NULL REFERENCES locations(id) ON DELETE SET NULL;

-- Incidents: area_id para manutenção preditiva
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS area_id uuid NULL REFERENCES areas(id) ON DELETE SET NULL;
