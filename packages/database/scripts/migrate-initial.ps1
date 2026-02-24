# Migração inicial Prisma
# Uso: .\scripts\migrate-initial.ps1
# Requer: DATABASE_URL no .env ou variável de ambiente

$ErrorActionPreference = "Stop"

Write-Host ">>> Gerando cliente Prisma..." -ForegroundColor Cyan
pnpm --filter @sigeo/database generate

Write-Host ">>> Criando migração inicial..." -ForegroundColor Cyan
Set-Location packages/database
npx prisma migrate dev --name init
Set-Location ../..

Write-Host ">>> Migração concluída." -ForegroundColor Green
