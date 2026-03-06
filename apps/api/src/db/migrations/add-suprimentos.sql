-- Módulo de Suprimentos: Insumos, Estoque, Fornecedores, Pedidos de Compra
-- Integração com checklist (abate automático) e predição de compra

CREATE TABLE IF NOT EXISTS fornecedores (
  id uuid PRIMARY KEY,
  nome varchar(255) NOT NULL,
  cnpj varchar(18) NULL,
  email varchar(255) NULL,
  telefone varchar(32) NULL,
  contato varchar(255) NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insumos (
  id uuid PRIMARY KEY,
  nome varchar(255) NOT NULL,
  unidade_medida varchar(32) NOT NULL,
  estoque_minimo float NOT NULL DEFAULT 0,
  preco_medio decimal(12,2) NULL,
  fornecedor_preferencial_id uuid NULL REFERENCES fornecedores(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insumos_fornecedor ON insumos(fornecedor_preferencial_id);

CREATE TABLE IF NOT EXISTS estoque (
  id uuid PRIMARY KEY,
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  quantidade float NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(insumo_id, area_id)
);

CREATE INDEX IF NOT EXISTS idx_estoque_insumo ON estoque(insumo_id);
CREATE INDEX IF NOT EXISTS idx_estoque_area ON estoque(area_id);

CREATE TABLE IF NOT EXISTS consumo_registro (
  id uuid PRIMARY KEY,
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  task_id uuid NULL REFERENCES tasks(id) ON DELETE SET NULL,
  quantidade float NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumo_insumo ON consumo_registro(insumo_id);
CREATE INDEX IF NOT EXISTS idx_consumo_area ON consumo_registro(area_id);
CREATE INDEX IF NOT EXISTS idx_consumo_created ON consumo_registro(created_at);

CREATE TABLE IF NOT EXISTS pedidos_compra (
  id uuid PRIMARY KEY,
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
  area_id uuid NULL REFERENCES areas(id) ON DELETE SET NULL,
  fornecedor_id uuid NULL REFERENCES fornecedores(id) ON DELETE SET NULL,
  quantidade float NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'RASCUNHO',
  preco_unitario decimal(12,2) NULL,
  preco_total decimal(12,2) NULL,
  data_prevista_entrega date NULL,
  data_recebimento timestamptz NULL,
  nf_codigo varchar(64) NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_insumo ON pedidos_compra(insumo_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos_compra(status);

ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS insumo_id uuid NULL REFERENCES insumos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_checklist_items_insumo ON checklist_items(insumo_id);
