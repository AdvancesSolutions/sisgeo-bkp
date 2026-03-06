# Executa APENAS o bootstrap no banco de producao (RDS).
# Cria admin@sigeo.local / admin123, local e area padrao se nao existirem.
# Requer: AWS CLI configurado e permissao para ler SSM.
#
# Uso: .\scripts\run-bootstrap-prod.ps1

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
  exit 1
}

$env:NODE_ENV = "production"
$env:DB_HOST = "sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"
$env:DB_PORT = "5432"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = $dbPassword
$env:DB_NAME = "sigeo"

Write-Host "Executando bootstrap..." -ForegroundColor Cyan
$usePnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if ($usePnpm) {
  & pnpm --filter @sigeo/api run db:bootstrap
} else {
  & npx pnpm --filter @sigeo/api run db:bootstrap
}

if ($LASTEXITCODE -eq 0) {
  Write-Host "Bootstrap concluido." -ForegroundColor Green
} else {
  Write-Host "Bootstrap falhou. Veja a mensagem acima ([bootstrap] Erro: ...)." -ForegroundColor Yellow
  exit 1
}
