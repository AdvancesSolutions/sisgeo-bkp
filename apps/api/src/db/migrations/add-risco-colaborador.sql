-- Migração: RH-SIGHT - Score de Risco de Evasão de Colaboradores
-- Worker processa toda madrugada

CREATE TABLE IF NOT EXISTS risco_colaborador (
  id uuid PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  organization_id uuid NULL,
  score float NOT NULL,
  nivel varchar(16) NOT NULL,
  motivos jsonb NULL,
  acoes_sugeridas jsonb NULL,
  detalhes jsonb NULL,
  reference_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, reference_date)
);

CREATE INDEX IF NOT EXISTS idx_risco_colaborador_employee ON risco_colaborador(employee_id);
CREATE INDEX IF NOT EXISTS idx_risco_colaborador_org ON risco_colaborador(organization_id);
CREATE INDEX IF NOT EXISTS idx_risco_colaborador_date ON risco_colaborador(reference_date);
CREATE INDEX IF NOT EXISTS idx_risco_colaborador_nivel ON risco_colaborador(nivel);
