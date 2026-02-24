# Sincroniza ambiente local → AWS (produção)
# CUIDADO: Sobrescreve dados de produção!

param(
    [switch]$Force,
    [string]$RDSPassword = $null
)

$ErrorActionPreference = "Stop"

# Configurações
$RDS_HOST = "sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"
$RDS_DB = "sigeo"
$RDS_USER = "postgres"
$RDS_PORT = 5432
$LOCAL_HOST = "localhost"
$LOCAL_DB = "sigeo"
$LOCAL_USER = "postgres"
$LOCAL_PASSWORD = "postgres"

Write-Host "⚠️  SISGEO - Sincronização Local → AWS" -ForegroundColor Red
Write-Host "======================================" -ForegroundColor Red
Write-Host ""
Write-Host "ATENÇÃO: Este script irá SOBRESCREVER dados de PRODUÇÃO!" -ForegroundColor Red
Write-Host ""

if (!$Force) {
    $confirm = Read-Host "Digite 'CONFIRMO' para continuar"
    if ($confirm -ne "CONFIRMO") {
        Write-Host "❌ Cancelado" -ForegroundColor Yellow
        exit 0
    }
}

# 1. Verificar Docker
Write-Host "1️⃣  Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker não está rodando" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker OK" -ForegroundColor Green
Write-Host ""

# 2. Obter senha RDS
if (!$RDSPassword) {
    Write-Host "2️⃣  Credenciais RDS..." -ForegroundColor Yellow
    $credential = Get-Credential -Message "RDS Production Password" -UserName $RDS_USER
    if (!$credential) {
        Write-Host "❌ Cancelado" -ForegroundColor Red
        exit 1
    }
    $RDSPassword = $credential.GetNetworkCredential().Password
}
Write-Host "✅ Credenciais OK" -ForegroundColor Green
Write-Host ""

# 3. Backup RDS
Write-Host "3️⃣  Backup do RDS (segurança)..." -ForegroundColor Yellow
$backupFile = "rds-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
$backupPath = Join-Path $PSScriptRoot "..\backups"
if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath | Out-Null
}
$fullBackupPath = Join-Path $backupPath $backupFile

docker run --rm `
    -e PGPASSWORD="$RDSPassword" `
    postgres:15-alpine `
    pg_dump -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -p "$RDS_PORT" -F p `
    > $fullBackupPath 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup RDS salvo: $backupFile" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao fazer backup do RDS" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 4. Dump local
Write-Host "4️⃣  Exportando banco local..." -ForegroundColor Yellow
$dumpFile = "local-dump-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
$fullDumpPath = Join-Path $backupPath $dumpFile

docker exec -e PGPASSWORD=$LOCAL_PASSWORD postgres pg_dump -h localhost -U $LOCAL_USER -d $LOCAL_DB -F p > $fullDumpPath 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao exportar banco local" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dump local criado: $dumpFile" -ForegroundColor Green
Write-Host ""

# 5. Limpar RDS
Write-Host "5️⃣  Limpando banco RDS..." -ForegroundColor Yellow
$dropSQL = @"
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
"@

$dropSQL | docker run --rm -i `
    -e PGPASSWORD="$RDSPassword" `
    postgres:15-alpine `
    psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -p "$RDS_PORT" 2>&1

Write-Host "✅ RDS limpo" -ForegroundColor Green
Write-Host ""

# 6. Restaurar no RDS
Write-Host "6️⃣  Restaurando dados no RDS..." -ForegroundColor Yellow
Get-Content $fullDumpPath | docker run --rm -i `
    -e PGPASSWORD="$RDSPassword" `
    postgres:15-alpine `
    psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -p "$RDS_PORT" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dados restaurados no RDS" -ForegroundColor Green
} else {
    Write-Host "⚠️  Restauração com avisos" -ForegroundColor Yellow
}
Write-Host ""

# 7. Verificar
Write-Host "7️⃣  Verificando dados no RDS..." -ForegroundColor Yellow
$result = docker run --rm `
    -e PGPASSWORD="$RDSPassword" `
    postgres:15-alpine `
    psql -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -p "$RDS_PORT" -t -c "SELECT COUNT(*) FROM users;" 2>&1

if ($LASTEXITCODE -eq 0) {
    $userCount = $result.Trim()
    Write-Host "✅ Usuários no RDS: $userCount" -ForegroundColor Green
} else {
    Write-Host "⚠️  Não foi possível verificar" -ForegroundColor Yellow
}
Write-Host ""

# Resumo
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "✅ Sincronização Local → AWS concluída!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Backups salvos em: backups/" -ForegroundColor White
Write-Host "   - Backup RDS: $backupFile" -ForegroundColor Gray
Write-Host "   - Dump Local: $dumpFile" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Reinicie a API em produção para aplicar mudanças" -ForegroundColor Yellow
Write-Host ""
