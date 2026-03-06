# Quick seed via Docker PostgreSQL client

param(
    [string]$DBPassword = $null
)

$DB_HOST = "sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"
$DB_NAME = "sigeo"
$DB_USER = "postgres"
$DB_PORT = 5432

if (!$DBPassword) {
    $credential = Get-Credential -Message "RDS Connection" -UserName $DB_USER
    if (!$credential) {
        Write-Host "Cancelled"
        exit 1
    }
    $DBPassword = $credential.GetNetworkCredential().Password
}

Write-Host "📚 SISGEO Production Database Seeding"
Write-Host "Host: $DB_HOST"
Write-Host "Database: $DB_NAME"
Write-Host ""

# Create SQL file
$SQL_CONTENT = @'
-- Seed production users
INSERT INTO users (id, name, email, role, password_hash, created_at, updated_at) VALUES
('0cde5dbd-7e3a-47c6-a4ec-f14fceb1fa7b', 'Admin Super', 'admin@empresa.com', 'Super Admin', '$2a$10$M/szOyaSbVqzawO92qNUoeLzl66d.rw6cmQnsRz2GfnGRsg0Kd6FW', NOW(), NOW()),
('6a411dd7-e16e-4a0e-844e-151e30992385', 'João Silva', 'joao.ti@empresa.com', 'Gestor', '$2a$10$D2u9lTXERlquV5FGKr1/p.T004qEVb0xuqE3oNphH8U6Yd1NXxi2i', NOW(), NOW()),
('b681c766-abaf-439f-8fb4-3c515decf6dd', 'Maria Santos', 'maria.vendas@empresa.com', 'Gestor', '$2a$10$MaBfvm4ocTqQ9M7T9qqdmeiA8F48QIRU2pzPsD95Oy79h4JXXs3Em', NOW(), NOW()),
('24aabcd2-bbe6-4501-8a61-b7113c9c83ae', 'Carlos Funcionário', 'carlos.funcionario@empresa.com', 'Funcionário', '$2a$10$0T1Gb61LmTDqqe.cTvoAtu6mZqwNOdy0bSevb.w4QA3eNux8tO0/S', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

SELECT '✅ Users inserted' AS result;
SELECT COUNT(*) as total_users FROM users;
SELECT email, role FROM users ORDER BY created_at;
'@

$SQL_FILE = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.sql'
$SQL_CONTENT | Out-File -FilePath $SQL_FILE -Encoding UTF8

Write-Host "Executing seed via Docker..."
Write-Host ""

# Run Docker container with postgresql client
docker run --rm `
  -e PGPASSWORD="$DBPassword" `
  -v "$SQL_FILE`:C:/tmp/seed.sql" `
  postgres:15-alpine `
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -f '/tmp/seed.sql'

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================================"
    Write-Host "✅ Database seeded successfully!"
    Write-Host "================================================================"
    Write-Host ""
    Write-Host "✨ You can now login to https://sigeo.advances.com.br with:"
    Write-Host ""
    Write-Host "  📧 Email:    admin@empresa.com"
    Write-Host "  🔑 Password: admin123"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Error seeding database"
    Write-Host "Check:"
    Write-Host "  1. RDS password is correct"
    Write-Host "  2. RDS instance is accessible (check security group)"
    Write-Host "  3. Docker is running"
}

# Cleanup
Remove-Item -Path $SQL_FILE -Force -ErrorAction SilentlyContinue
