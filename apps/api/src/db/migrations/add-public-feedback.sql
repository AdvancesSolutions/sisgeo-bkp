-- Migração: Feedback público (QR Code - no auth)
-- Canal de comunicação usuário final <-> equipe de limpeza

CREATE TABLE IF NOT EXISTS public_feedback (
  id uuid PRIMARY KEY,
  area_id uuid NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  alert_type varchar(64) NULL,
  photo_url varchar(1024) NULL,
  task_id uuid NULL REFERENCES tasks(id) ON DELETE SET NULL,
  organization_id uuid NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_public_feedback_area ON public_feedback(area_id);
CREATE INDEX IF NOT EXISTS idx_public_feedback_task ON public_feedback(task_id);
CREATE INDEX IF NOT EXISTS idx_public_feedback_created ON public_feedback(created_at);
