-- Migração: tabela cleaning_types (tipos de limpeza)
CREATE TABLE IF NOT EXISTS cleaning_types (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
