#!/bin/bash
# Migração inicial Prisma
# Uso: ./scripts/migrate-initial.sh
# Requer: DATABASE_URL no .env ou variável de ambiente

set -e

echo ">>> Gerando cliente Prisma..."
pnpm --filter @sigeo/database generate

echo ">>> Criando migração inicial..."
cd packages/database
npx prisma migrate dev --name init
cd ../..

echo ">>> Migração concluída."
