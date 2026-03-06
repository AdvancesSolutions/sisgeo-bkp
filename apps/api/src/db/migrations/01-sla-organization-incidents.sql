-- Migração: Multi-tenancy, SLA, Incidentes e Relatório de Visita
-- Executada por: pnpm --filter @sigeo/api run db:migrate

-- Tabela organizations (multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  slug varchar(255) NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela incidents (ocorrências: falta material, equipamento quebrado)
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY,
  employee_id uuid NOT NULL,
  supervisor_id uuid NULL,
  type varchar(64) NOT NULL,
  description text NOT NULL,
  status varchar(32) DEFAULT 'ABERTO',
  organization_id uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela sla_alerts (registro de alertas de SLA enviados)
CREATE TABLE IF NOT EXISTS sla_alerts (
  id uuid PRIMARY KEY,
  task_id uuid NOT NULL,
  alert_type varchar(32) NOT NULL,
  minutes_late integer NOT NULL,
  notification_sent boolean DEFAULT false,
  notification_channel varchar(32) NULL,
  created_at timestamptz DEFAULT now()
);

-- Tasks: campos para Relatório de Visita e SLA
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at timestamptz NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_minutes integer NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checkin_lat double precision NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checkin_lng double precision NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checkout_lat double precision NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checkout_lng double precision NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sla_alerted_at timestamptz NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id uuid NULL;

-- Multi-tenancy em outras tabelas
ALTER TABLE locations ADD COLUMN IF NOT EXISTS organization_id uuid NULL;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS organization_id uuid NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id uuid NULL;
