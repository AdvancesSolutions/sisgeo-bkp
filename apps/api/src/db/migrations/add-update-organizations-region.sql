-- Adiciona region_id em organizations (executada após add-sla-organization-incidents)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS region_id uuid NULL REFERENCES regions(id);
