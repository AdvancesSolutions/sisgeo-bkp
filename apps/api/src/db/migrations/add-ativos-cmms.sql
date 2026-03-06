-- Migração: CMMS - Ativos e Histórico de Manutenção
-- Executada por: pnpm --filter @sigeo/api run db:migrate

-- Tabela de ativos (equipamentos)
CREATE TABLE IF NOT EXISTS ativos (
  id uuid PRIMARY KEY,
  nome varchar(255) NOT NULL,
  modelo varchar(255) NULL,
  data_compra date NULL,
  numero_serie varchar(128) NULL,
  horas_uso_total float DEFAULT 0,
  limite_manutencao_horas float NULL,
  status varchar(32) DEFAULT 'OPERACIONAL',
  qr_code varchar(128) NULL,
  location_id uuid NULL REFERENCES locations(id) ON DELETE SET NULL,
  organization_id uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ativos_status ON ativos(status);
CREATE INDEX IF NOT EXISTS idx_ativos_location ON ativos(location_id);

-- Histórico de manutenção
CREATE TABLE IF NOT EXISTS ativo_manutencoes (
  id uuid PRIMARY KEY,
  ativo_id uuid NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
  tipo varchar(32) NOT NULL,
  data_inicio timestamptz NOT NULL,
  data_fim timestamptz NULL,
  observacoes text NULL,
  task_id uuid NULL REFERENCES tasks(id) ON DELETE SET NULL,
  organization_id uuid NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ativo_manutencoes_ativo ON ativo_manutencoes(ativo_id);

-- Tasks: vínculo com ativo
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ativo_id uuid NULL REFERENCES ativos(id) ON DELETE SET NULL;
