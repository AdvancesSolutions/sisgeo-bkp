#!/bin/bash

# Seed production PostgreSQL database with users

DB_HOST="sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"
DB_NAME="sigeo"
DB_USER="postgres"
DB_PORT="5432"

# Get password from environment (should be set in ECS task)
if [ -z "$DB_PASSWORD" ]; then
    echo "ERROR: DB_PASSWORD not set"
    exit 1
fi

# Install PostgreSQL client
apt-get update && apt-get install -y postgresql-client

# Create SQL file with seed data
cat > /tmp/seed.sql << 'EOF'
INSERT INTO users (id, name, email, role, password_hash, created_at, updated_at) VALUES
('0cde5dbd-7e3a-47c6-a4ec-f14fceb1fa7b', 'Admin Super', 'admin@empresa.com', 'Super Admin', '$2a$10$M/szOyaSbVqzawO92qNUoeLzl66d.rw6cmQnsRz2GfnGRsg0Kd6FW', '2026-02-24T02:16:52.844Z', '2026-02-24T02:16:52.844Z'),
('6a411dd7-e16e-4a0e-844e-151e30992385', 'João Silva', 'joao.ti@empresa.com', 'Gestor', '$2a$10$D2u9lTXERlquV5FGKr1/p.T004qEVb0xuqE3oNphH8U6Yd1NXxi2i', '2026-02-24T02:16:52.902Z', '2026-02-24T02:16:52.902Z'),
('b681c766-abaf-439f-8fb4-3c515decf6dd', 'Maria Santos', 'maria.vendas@empresa.com', 'Gestor', '$2a$10$MaBfvm4ocTqQ9M7T9qqdmeiA8F48QIRU2pzPsD95Oy79h4JXXs3Em', '2026-02-24T02:16:52.959Z', '2026-02-24T02:16:52.959Z'),
('24aabcd2-bbe6-4501-8a61-b7113c9c83ae', 'Carlos Funcionário', 'carlos.funcionario@empresa.com', 'Funcionário', '$2a$10$0T1Gb61LmTDqqe.cTvoAtu6mZqwNOdy0bSevb.w4QA3eNux8tO0/S', '2026-02-24T02:16:53.016Z', '2026-02-24T02:16:53.016Z')
ON CONFLICT (email) DO NOTHING;
EOF

# Execute SQL
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -f /tmp/seed.sql

echo "Database seeded successfully!"
