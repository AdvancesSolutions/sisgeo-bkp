-- Procedimentos de treinamento Just-in-Time
CREATE TABLE IF NOT EXISTS procedimentos (
  id uuid PRIMARY KEY,
  area_id uuid NULL REFERENCES areas(id) ON DELETE CASCADE,
  cleaning_type_id uuid NULL REFERENCES cleaning_types(id) ON DELETE CASCADE,
  titulo varchar(255) NOT NULL,
  video_url_s3 varchar(1024) NULL,
  manual_pdf_url varchar(1024) NULL,
  thumbnail_url varchar(1024) NULL,
  duracao_segundos int NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT procedimento_area_or_cleaning CHECK (area_id IS NOT NULL OR cleaning_type_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_procedimentos_area ON procedimentos(area_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_cleaning_type ON procedimentos(cleaning_type_id);

-- Log de treinamentos assistidos
CREATE TABLE IF NOT EXISTS colaborador_treinamentos (
  id uuid PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  procedimento_id uuid NOT NULL REFERENCES procedimentos(id) ON DELETE CASCADE,
  watched_at timestamptz NOT NULL,
  percentual_assistido int NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, procedimento_id)  -- uma entrada por colaborador+procedimento (atualiza watched_at ao reassistir)
);

CREATE INDEX IF NOT EXISTS idx_colab_trein_employee ON colaborador_treinamentos(employee_id);
CREATE INDEX IF NOT EXISTS idx_colab_trein_procedimento ON colaborador_treinamentos(procedimento_id);

-- Link opcional de procedimento a item de checklist (vídeo específico por item)
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS procedimento_id uuid NULL REFERENCES procedimentos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_checklist_items_procedimento ON checklist_items(procedimento_id);
