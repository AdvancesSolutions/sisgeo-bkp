# PowerShell script to seed production PostgreSQL database

$DB_HOST = "sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"
$DB_NAME = "sigeo"
$DB_USER = "postgres"
$DB_PORT = 5432

# Get password from user
$cred = Get-Credential -Message "Conectar ao RDS PostgreSQL" -UserName $DB_USER
if (!$cred) {
    Write-Host "Cancelled"
    exit 1
}

$DB_PASSWORD = $cred.GetNetworkCredential().Password

Write-Host "Tentando conectar ao banco PostgreSQL..."
Write-Host "Host: $DB_HOST"
Write-Host "Database: $DB_NAME"
Write-Host ""

# Create seed SQL
$seedSQL = @"
-- Seed production users
INSERT INTO users (id, name, email, role, password_hash, created_at, updated_at) VALUES
('0cde5dbd-7e3a-47c6-a4ec-f14fceb1fa7b', 'Admin Super', 'admin@empresa.com', 'Super Admin', '\$2a\$10\$M/szOyaSbVqzawO92qNUoeLzl66d.rw6cmQnsRz2GfnGRsg0Kd6FW', NOW(), NOW()),
('6a411dd7-e16e-4a0e-844e-151e30992385', 'João Silva', 'joao.ti@empresa.com', 'Gestor', '\$2a\$10\$D2u9lTXERlquV5FGKr1/p.T004qEVb0xuqE3oNphH8U6Yd1NXxi2i', NOW(), NOW()),
('b681c766-abaf-439f-8fb4-3c515decf6dd', 'Maria Santos', 'maria.vendas@empresa.com', 'Gestor', '\$2a\$10\$MaBfvm4ocTqQ9M7T9qqdmeiA8F48QIRU2pzPsD95Oy79h4JXXs3Em', NOW(), NOW()),
('24aabcd2-bbe6-4501-8a61-b7113c9c83ae', 'Carlos Funcionário', 'carlos.funcionario@empresa.com', 'Funcionário', '\$2a\$10\$0T1Gb61LmTDqqe.cTvoAtu6mZqwNOdy0bSevb.w4QA3eNux8tO0/S', NOW(), NOW())
ON CONFLICT DO NOTHING;

SELECT COUNT(*) as user_count FROM users;
"@

# Save SQL to temp file
$tempSQLFile = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "seed-$(Get-Random).sql")
$seedSQL | Out-File -FilePath $tempSQLFile -Encoding UTF8

Write-Host "Arquivo SQL criado: $tempSQLFile"
Write-Host ""

# Try connection via ODBC (if PostgreSQL ODBC driver is installed) or via Docker
Write-Host "Tentando executar via psql..."

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlPath) {
    Write-Host "PostgreSQL client encontrado!"
    Write-Host ""
    
    # Set environment variable for password
    $env:PGPASSWORD = $DB_PASSWORD
    
    &psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -f $tempSQLFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Banco seeded com sucesso!"
    } else {
        Write-Host "❌ Erro ao executar SQL"
    }
    
    # Clear password from environment
    $env:PGPASSWORD = $null
} else {
    Write-Host "⚠️ psql não encontrado. Alternativas:"
    Write-Host ""
    Write-Host "1. Instale PostgreSQL Cliente:"
    Write-Host "   https://www.postgresql.org/download/windows/"
    Write-Host ""
    Write-Host "2. Ou use um container Docker:"
    Write-Host "   docker run --rm -v ${tempSQLFile}:/tmp/seed.sql -e PGPASSWORD='$DB_PASSWORD' \" + 
             "`    postgres:15 psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -f /tmp/seed.sql"
    Write-Host ""
    Write-Host "3. SQL salvo em: $tempSQLFile"
}

# Cleanup
Remove-Item -Path $tempSQLFile -Force -ErrorAction SilentlyContinue
