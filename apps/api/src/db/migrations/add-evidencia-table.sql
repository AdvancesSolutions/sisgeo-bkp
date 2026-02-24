-- Tabela evidencias: auditoria automática de fotos (Ollama/LLaVA)
CREATE TABLE IF NOT EXISTS evidencias (
  id uuid PRIMARY KEY,
  task_photo_id uuid NOT NULL REFERENCES task_photos(id) ON DELETE CASCADE,
  limpo boolean NULL,
  confianca integer NULL,
  detalhes text NULL,
  anomalia_detectada boolean DEFAULT false,
  status varchar(32) NOT NULL,
  provider varchar(32) NOT NULL,
  raw_response jsonb NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidencias_task_photo ON evidencias(task_photo_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_status ON evidencias(status);
