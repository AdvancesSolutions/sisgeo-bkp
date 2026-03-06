-- Migração: FindMe - Ocorrências Emergenciais, Scores Diários, Troca de Turno
-- Executada por: pnpm --filter @sigeo/api run db:migrate

-- Regiões (hierarquia multi-tenant: Região > Cliente/Org > Unidade > Setor)
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  code varchar(50) NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ocorrências emergenciais (Pânico, Inatividade/Sempre Alerta)
CREATE TABLE IF NOT EXISTS ocorrencias_emergenciais (
  id uuid PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type varchar(32) NOT NULL,
  lat double precision NULL,
  lng double precision NULL,
  resolved_at timestamptz NULL,
  organization_id uuid NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_emergenciais_created ON ocorrencias_emergenciais(created_at);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_emergenciais_type ON ocorrencias_emergenciais(type);

-- Scores diários (FindMe Score por setor/área)
CREATE TABLE IF NOT EXISTS scores_diarios (
  id uuid PRIMARY KEY,
  reference_date date NOT NULL,
  area_id uuid NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  organization_id uuid NULL,
  score_total integer NOT NULL,
  score_pontualidade integer NOT NULL,
  score_conformidade integer NOT NULL,
  score_ocorrencias integer NOT NULL,
  tasks_total integer DEFAULT 0,
  tasks_done integer DEFAULT 0,
  tasks_on_time integer DEFAULT 0,
  ocorrencias_abertas integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reference_date, area_id)
);

CREATE INDEX IF NOT EXISTS idx_scores_diarios_ref_date ON scores_diarios(reference_date);
CREATE INDEX IF NOT EXISTS idx_scores_diarios_org ON scores_diarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_scores_diarios_location ON scores_diarios(location_id);

-- Troca de turno (Livro Ata Digital)
CREATE TABLE IF NOT EXISTS troca_turno (
  id uuid PRIMARY KEY,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  employee_saida_id uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  employee_entrada_id uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  data_troca date NOT NULL,
  observacoes_saida text NULL,
  observacoes_entrada text NULL,
  validado_entrada boolean DEFAULT false,
  organization_id uuid NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_troca_turno_data ON troca_turno(data_troca);
CREATE INDEX IF NOT EXISTS idx_troca_turno_location ON troca_turno(location_id);

-- Fotos obrigatórias na troca de turno
CREATE TABLE IF NOT EXISTS troca_turno_fotos (
  id uuid PRIMARY KEY,
  troca_turno_id uuid NOT NULL REFERENCES troca_turno(id) ON DELETE CASCADE,
  type varchar(16) NOT NULL,
  url varchar(1024) NOT NULL,
  key varchar(512) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_troca_turno_fotos_troca ON troca_turno_fotos(troca_turno_id);
