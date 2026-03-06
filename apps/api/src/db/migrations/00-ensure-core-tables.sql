-- Migração inicial: cria tabelas base se não existirem (para DB vazio)
-- Ordem: users, locations -> areas, employees -> tasks, task_photos

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  role varchar(50) NOT NULL,
  password_hash varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  address text NOT NULL,
  lat float NULL,
  lng float NULL,
  radius float NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  cpf varchar(255) NULL,
  role varchar(50) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  unit_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS areas (
  id uuid PRIMARY KEY,
  location_id uuid NOT NULL,
  name varchar(255) NOT NULL,
  risk_classification varchar(20) NULL,
  cleaning_frequency varchar(50) NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY,
  area_id uuid NOT NULL,
  employee_id uuid NULL,
  scheduled_date date NOT NULL,
  scheduled_time varchar(5) NULL,
  status varchar(50) NOT NULL DEFAULT 'PENDING',
  title varchar(500) NULL,
  description text NULL,
  rejected_comment text NULL,
  rejected_at timestamptz NULL,
  rejected_by uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_photos (
  id uuid PRIMARY KEY,
  task_id uuid NOT NULL,
  type varchar(16) NOT NULL,
  url varchar(1024) NOT NULL,
  key varchar(512) NOT NULL,
  created_at timestamptz DEFAULT now()
);
