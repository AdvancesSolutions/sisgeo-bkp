# Executa a migração add-user-employee-id no banco RDS
# Uso: .\scripts\run-migration-employee-id.ps1
# Requer: psql no PATH ou DB_HOST, DB_USER, DB_PASSWORD, DB_NAME em .env

param(
    [string]$EnvFile = ".env"
)

$Root = Split-Path -Parent $PSScriptRoot
$MigrationPath = Join-Path $Root "apps\api\src\db\migrations\add-user-employee-id.sql"

if (-not (Test-Path $MigrationPath)) {
    Write-Error "Arquivo de migração não encontrado: $MigrationPath"
    exit 1
}

# Carregar .env se existir
$envPath = Join-Path $Root $EnvFile
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$host = $env:DB_HOST
$port = $env:DB_PORT ?? "5432"
$user = $env:DB_USER ?? "postgres"
$db = $env:DB_NAME ?? "sigeo"
$password = $env:DB_PASSWORD

if (-not $host) {
    Write-Host "Defina DB_HOST (ou use .env)" -ForegroundColor Red
    exit 1
}

$env:PGPASSWORD = $password
$uri = "postgresql://${user}:${password}@${host}:${port}/${db}"
Write-Host "Executando migração em $host..." -ForegroundColor Cyan
& psql -h $host -p $port -U $user -d $db -f $MigrationPath
$env:PGPASSWORD = $null
Write-Host "Migração concluída." -ForegroundColor Green
