# Executa migrações no banco de produção (RDS).
# Requer: AWS CLI configurado e permissão para ler SSM Parameter Store.
#
# Uso: .\scripts\run-migrations-prod.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Obtendo senha do banco (SSM)..." -ForegroundColor Cyan
$dbPassword = aws ssm get-parameter `
  --name "/sigeo/db-password" `
  --with-decryption `
  --query "Parameter.Value" `
  --output text `
  --region sa-east-1

if (-not $dbPassword) {
  Write-Host "Erro: nao foi possivel obter DB_PASSWORD do SSM." -ForegroundColor Red
  Write-Host "Verifique se a AWS CLI esta configurada e se voce tem permissao." -ForegroundColor Yellow
  exit 1
}

$env:NODE_ENV = "production"
$env:DB_HOST = "sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"
$env:DB_PORT = "5432"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = $dbPassword
$env:DB_NAME = "sigeo"

# Usa pnpm se estiver no PATH; senao npx pnpm (node_modules ou corepack)
$usePnpm = Get-Command pnpm -ErrorAction SilentlyContinue
$migrateArgs = @("--filter", "@sigeo/api", "run", "db:migrate")
$bootstrapArgs = @("--filter", "@sigeo/api", "run", "db:bootstrap")

Write-Host "Executando migracoes..." -ForegroundColor Cyan
if ($usePnpm) {
  & pnpm @migrateArgs
} else {
  & npx pnpm @migrateArgs
}

if ($LASTEXITCODE -ne 0) {
  Write-Host "Erro ao executar migracoes." -ForegroundColor Red
  exit 1
}
Write-Host "Migracoes concluidas." -ForegroundColor Green

Write-Host "Executando bootstrap (usuario admin, local e area padrao se vazio)..." -ForegroundColor Cyan
if ($usePnpm) {
  & pnpm @bootstrapArgs
} else {
  & npx pnpm @bootstrapArgs
}

if ($LASTEXITCODE -eq 0) {
  Write-Host "Concluido. Acesse a aplicacao e teste Tarefas/Servicos." -ForegroundColor Green
} else {
  Write-Host "Bootstrap falhou (pode ser normal se ja existir dados)." -ForegroundColor Yellow
}
