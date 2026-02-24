#!/bin/bash

# Seed production PostgreSQL database using Docker

echo "================================"
echo "SISGEO Production Database Seed"
echo "================================"
echo ""

DB_HOST="sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"
DB_NAME="sigeo"
DB_USER="postgres"
DB_PORT="5432"

# Read password
read -sp "PostgreSQL password para '$DB_USER': " DB_PASSWORD
echo ""
echo ""

# Create seed SQL
cat > /tmp/seed-users.sql << 'EOF'
-- Seed production users
INSERT INTO users (id, name, email, role, password_hash, created_at, updated_at) VALUES
('0cde5dbd-7e3a-47c6-a4ec-f14fceb1fa7b', 'Admin Super', 'admin@empresa.com', 'Super Admin', '$2a$10$M/szOyaSbVqzawO92qNUoeLzl66d.rw6cmQnsRz2GfnGRsg0Kd6FW', NOW(), NOW()),
('6a411dd7-e16e-4a0e-844e-151e30992385', 'João Silva', 'joao.ti@empresa.com', 'Gestor', '$2a$10$D2u9lTXERlquV5FGKr1/p.T004qEVb0xuqE3oNphH8U6Yd1NXxi2i', NOW(), NOW()),
('b681c766-abaf-439f-8fb4-3c515decf6dd', 'Maria Santos', 'maria.vendas@empresa.com', 'Gestor', '$2a$10$MaBfvm4ocTqQ9M7T9qqdmeiA8F48QIRU2pzPsD95Oy79h4JXXs3Em', NOW(), NOW()),
('24aabcd2-bbe6-4501-8a61-b7113c9c83ae', 'Carlos Funcionário', 'carlos.funcionario@empresa.com', 'Funcionário', '$2a$10$0T1Gb61LmTDqqe.cTvoAtu6mZqwNOdy0bSevb.w4QA3eNux8tO0/S', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

SELECT email, role FROM users ORDER BY created_at;
EOF

echo "Executing seed script via Docker..."
echo ""

docker run --rm \
  -e PGPASSWORD="$DB_PASSWORD" \
  -v /tmp/seed-users.sql:/tmp/seed-users.sql \
  postgres:15 \
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -f /tmp/seed-users.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Production database seeded successfully!"
  echo ""
  echo "You can now login with:"
  echo "  Email: admin@empresa.com"
  echo "  Password: admin123"
else
  echo ""
  echo "❌ Error seeding database"
  echo ""
  echo "Make sure:"
  echo "  1. Docker is running"
  echo "  2. PostgreSQL password is correct"
  echo "  3. RDS instance is accessible"
fi

# Cleanup
rm -f /tmp/seed-users.sql
