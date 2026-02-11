# Build, push e deploy da API localmente (quando GitHub Actions falha no ECS)
# Requer: docker, aws configure com conta correta (320674390105)
# Uso: .\scripts\api-deploy-local.ps1

param(
    [string]$Region = "sa-east-1",
    [string]$EcrRepo = "sigeo-api"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Registry = "320674390105.dkr.ecr.$Region.amazonaws.com"
$Image = "$Registry/${EcrRepo}:latest"

Write-Host "[1/4] Login ECR..." -ForegroundColor Cyan
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $Registry

Write-Host "[2/4] Build Docker..." -ForegroundColor Cyan
$buildDate = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mmZ")
Push-Location $Root
docker build -f apps/api/Dockerfile --build-arg BUILD_DATE=$buildDate -t $Image .
Pop-Location

Write-Host "[3/4] Push ECR..." -ForegroundColor Cyan
docker push $Image

Write-Host "[4/4] Deploy ECS..." -ForegroundColor Cyan
& $PSScriptRoot\ecs-force-deploy.ps1 -Region $Region

Write-Host "`nDeploy concluido. Aguarde 1-2 min e teste:" -ForegroundColor Green
Write-Host "  https://dapotha14ic3h.cloudfront.net/version" -ForegroundColor Gray
Write-Host "  https://sigeo.advances.com.br/employee-access (como ADMIN)" -ForegroundColor Gray
