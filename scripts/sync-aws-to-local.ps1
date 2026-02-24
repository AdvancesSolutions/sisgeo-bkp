# Sincroniza ambiente local com AWS (produção)
# Baixa dados do RDS para PostgreSQL local

param(
    [switch]$SkipBackup,
    [switch]$SkipEnvUpdate,
    [string]$RDSPassword = $null
)

$ErrorActionPreference = "Stop"

# Configurações AWS
$RDS_HOST = "sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"
$RDS_DB = "sigeo"
$RDS_USER = "postgres"
$RDS_PORT = 5432

# Configurações Local
$LOCAL_HOST = "localhost"
$LOCAL_DB = "sigeo"
$LOCAL_USER = "postgres"
$LOCAL_PASSWORD = "postgres"
$LOCAL_PORT = 5432

Write-Host "🔄 SISGEO - Sincronização AWS → Local" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Docker
Write-Host "1️⃣  Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker não está rodando. Inicie o Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker OK" -ForegroundColor Green
Write-Host ""

# 2. Verificar PostgreSQL local
Write-Host "2️⃣  Verificando PostgreSQL local..." -ForegroundColor Yellow
$pgContainer = docker ps --filter "name=postgres" --format "{{.Names}}" 2>$null
if (!$pgContainer) {
    Write-Host "⚠️  PostgreSQL local não encontrado. Iniciando..." -ForegroundColor Yellow
    Push-Location (Join-Path $PSScriptRoot "..")
    docker compose up -d postgres
    Pop-Location
    Write-Host "⏳ Aguardando PostgreSQL iniciar..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    $pgContainer = "postgres"
}
Write-Host "✅ PostgreSQL local OK" -ForegroundColor Green
Write-Host ""

# 3. Obter senha RDS
if (!$RDSPassword) {
    Write-Host "3️⃣  Credenciais RDS..." -ForegroundColor Yellow
    $credential = Get-Credential -Message "RDS Production Password" -UserName $RDS_USER
    if (!$credential) {
        Write-Host "❌ Cancelado" -ForegroundColor Red
        exit 1
    }
    $RDSPassword = $credential.GetNetworkCredential().Password
}
Write-Host "✅ Credenciais OK" -ForegroundColor Green
Write-Host ""

# 4. Backup local (opcional)
if (!$SkipBackup) {
    Write-Host "4️⃣  Backup do banco local..." -ForegroundColor Yellow
    $backupFile = "backup-local-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
    $backupPath = Join-Path $PSScriptRoot "..\backups"
    if (!(Test-Path $backupPath)) {
        New-Item -ItemType Directory -Path $backupPath | Out-Null
    }
    $fullBackupPath = Join-Path $backupPath $backupFile
    
    # Verificar se banco existe
    $dbExists = docker exec -e PGPASSWORD=$LOCAL_PASSWORD $pgContainer psql -h localhost -U $LOCAL_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$LOCAL_DB';" 2>$null
    if ($dbExists -and $dbExists.Trim() -eq "1") {
        docker exec -e PGPASSWORD=$LOCAL_PASSWORD $pgContainer pg_dump -h localhost -U $LOCAL_USER -d $LOCAL_DB -F p > $fullBackupPath 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backup salvo: $backupFile" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Backup falhou" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Banco local não existe (será criado)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# 5. Dump do RDS
Write-Host "5️⃣  Baixando dados do RDS..." -ForegroundColor Yellow
$dumpFile = "rds-dump-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
$dumpPath = Join-Path $PSScriptRoot "..\backups"
if (!(Test-Path $dumpPath)) {
    New-Item -ItemType Directory -Path $dumpPath | Out-Null
}
$fullDumpPath = Join-Path $dumpPath $dumpFile

docker run --rm `
    -e PGPASSWORD="$RDSPassword" `
    postgres:15-alpine `
    pg_dump -h "$RDS_HOST" -U "$RDS_USER" -d "$RDS_DB" -p "$RDS_PORT" -F p -f "/tmp/dump.sql" `
    > $fullDumpPath 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao baixar dados do RDS" -ForegroundColor Red
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "  - Senha RDS correta" -ForegroundColor Yellow
    Write-Host "  - Security Group permite seu IP" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Dump baixado: $dumpFile" -ForegroundColor Green
Write-Host ""

# 6. Limpar banco local
Write-Host "6️⃣  Limpando banco local..." -ForegroundColor Yellow
docker exec -e PGPASSWORD=$LOCAL_PASSWORD $pgContainer psql -h localhost -U $LOCAL_USER -d postgres -c "DROP DATABASE IF EXISTS $LOCAL_DB;" 2>$null
docker exec -e PGPASSWORD=$LOCAL_PASSWORD $pgContainer psql -h localhost -U $LOCAL_USER -d postgres -c "CREATE DATABASE $LOCAL_DB;" 2>$null
Write-Host "✅ Banco local recriado" -ForegroundColor Green
Write-Host ""

# 7. Restaurar dump
Write-Host "7️⃣  Restaurando dados no banco local..." -ForegroundColor Yellow
Get-Content $fullDumpPath | docker exec -i -e PGPASSWORD=$LOCAL_PASSWORD $pgContainer psql -h localhost -U $LOCAL_USER -d $LOCAL_DB 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dados restaurados com sucesso" -ForegroundColor Green
} else {
    Write-Host "⚠️  Restauração com avisos (verifique o log)" -ForegroundColor Yellow
}
Write-Host ""

# 8. Atualizar .env local (opcional)
if (!$SkipEnvUpdate) {
    Write-Host "8️⃣  Atualizando .env local..." -ForegroundColor Yellow
    
    $apiEnvPath = Join-Path $PSScriptRoot "..\apps\api\.env"
    $webEnvPath = Join-Path $PSScriptRoot "..\apps\web\.env"
    
    # API .env
    $apiEnv = @"
# DB Local (sincronizado com AWS)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sigeo

# JWT (use os mesmos da produção para testar tokens)
JWT_SECRET=sigeo-dev-secret-change-in-prod
JWT_REFRESH_SECRET=sigeo-refresh-dev-change-in-prod
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# S3 (desabilitado em dev)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=sa-east-1
# S3_BUCKET=
"@
    
    $apiEnv | Out-File -FilePath $apiEnvPath -Encoding UTF8 -Force
    
    # Web .env
    $webEnv = "VITE_API_URL=http://localhost:3000"
    $webEnv | Out-File -FilePath $webEnvPath -Encoding UTF8 -Force
    
    Write-Host "✅ Arquivos .env atualizados" -ForegroundColor Green
    Write-Host ""
}

# 9. Verificar dados
Write-Host "9️⃣  Verificando dados sincronizados..." -ForegroundColor Yellow
$result = docker exec -e PGPASSWORD=$LOCAL_PASSWORD $pgContainer psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT COUNT(*) FROM users;" 2>$null
if ($LASTEXITCODE -eq 0) {
    $userCount = $result.Trim()
    Write-Host "✅ Usuários no banco local: $userCount" -ForegroundColor Green
} else {
    Write-Host "⚠️  Não foi possível verificar dados" -ForegroundColor Yellow
}
Write-Host ""

# Resumo
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "✅ Sincronização concluída!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Arquivos salvos em: backups/" -ForegroundColor White
Write-Host "   - Backup local: $backupFile" -ForegroundColor Gray
Write-Host "   - Dump RDS: $dumpFile" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor White
Write-Host "   1. cd d:\SERVIDOR\SISGEO" -ForegroundColor Gray
Write-Host "   2. pnpm run dev" -ForegroundColor Gray
Write-Host "   3. Acesse http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "🔑 Use as credenciais de produção para login" -ForegroundColor White
Write-Host "   (ex: admin@empresa.com / admin123)" -ForegroundColor Gray
Write-Host ""
