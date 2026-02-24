-- Digital Twin: Planta Baixa e Zonas para mapa de calor
-- Permite upload de imagem por local e mapeamento de áreas (setores) com coordenadas

CREATE TABLE IF NOT EXISTS plantas_baixa (
  id uuid PRIMARY KEY,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  floor_number int DEFAULT 1,
  image_url varchar(1024) NOT NULL,
  image_key varchar(512) NULL,
  width int NULL,
  height int NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(location_id, floor_number)
);

CREATE INDEX IF NOT EXISTS idx_plantas_baixa_location ON plantas_baixa(location_id);

CREATE TABLE IF NOT EXISTS area_zones (
  id uuid PRIMARY KEY,
  area_id uuid NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  planta_baixa_id uuid NOT NULL REFERENCES plantas_baixa(id) ON DELETE CASCADE,
  polygon jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(area_id, planta_baixa_id)
);

CREATE INDEX IF NOT EXISTS idx_area_zones_area ON area_zones(area_id);
CREATE INDEX IF NOT EXISTS idx_area_zones_planta ON area_zones(planta_baixa_id);
