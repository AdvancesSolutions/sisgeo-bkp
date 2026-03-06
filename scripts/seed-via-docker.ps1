# PowerShell script to run seed via Docker from the built image

$DB_PASSWORD = "postgres"  # Default password - change if different

Write-Host "========================================="
Write-Host "SISGEO Production Database Seed via Docker"
Write-Host "========================================="
Write-Host ""

$ImageName = "sigeo-api:latest"

# Check if image exists
Write-Host "Checking Docker image..."
$imageExists = docker images --format "table {{.Repository}}:{{.Tag}}" | Select-String $ImageName

if (!$imageExists) {
    Write-Host "❌ Docker image not found: $ImageName"
    Write-Host ""
    Write-Host "Build it first:"
    Write-Host "  cd d:\SERVIDOR\SISGEO"
    Write-Host " docker build -f apps/api/Dockerfile -t sigeo-api:latest . "
    exit 1
}

Write-Host "✅ Image found: $ImageName"
Write-Host ""

Write-Host "Running seed container..."
Write-Host ""

# Run the seed script in container
docker run --rm `
  -e DB_HOST="sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com" `
  -e DB_NAME="sigeo" `
  -e DB_USER="postgres" `
  -e DB_PASSWORD="$DB_PASSWORD" `
  -e DB_PORT="5432" `
  -e NODE_ENV="production" `
  $ImageName `
  npm run db:seed

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================="
    Write-Host "✅ Database seeded successfully!"
    Write-Host "========================================="
    Write-Host ""
    Write-Host "You can now login at: https://sigeo.advances.com.br"
    Write-Host ""
    Write-Host "Credentials:"
    Write-Host "  Email: admin@empresa.com"
    Write-Host "  Password: admin123"
} else {
    Write-Host ""
    Write-Host "❌ Seed failed"
    Write-Host ""
    Write-Host "Debug:"
    Write-Host "  1. Check RDS is accessible"
    Write-Host "  2. Verify DB_PASSWORD is correct"
    Write-Host "  3. Check Docker logs above"
}
