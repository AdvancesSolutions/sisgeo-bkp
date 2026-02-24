-- Migração: Checklist dinâmico por tipo de limpeza
-- Executada por: pnpm --filter @sigeo/api run db:migrate

ALTER TABLE areas ADD COLUMN IF NOT EXISTS cleaning_type_id uuid NULL;

CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY,
  cleaning_type_id uuid NOT NULL,
  label varchar(500) NOT NULL,
  input_type varchar(20) NOT NULL,
  is_required boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_checklist_responses (
  id uuid PRIMARY KEY,
  task_id uuid NOT NULL,
  checklist_item_id uuid NOT NULL,
  value_text text NULL,
  value_bool boolean NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, checklist_item_id)
);
