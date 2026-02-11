# Força novo deploy do serviço ECS (puxa imagem :latest do ECR)
# Use quando o GitHub Actions build+push ok mas o step Deploy falha (ex: Cluster not found)
# Requer: aws configure com credenciais da conta que tem o cluster

param(
    [string]$Cluster = "sigeo-cluster",
    [string]$Service = "sigeo-api",
    [string]$Region = "sa-east-1"
)

$ErrorActionPreference = "Stop"
Write-Host "Forcando novo deploy: cluster=$Cluster service=$Service region=$Region" -ForegroundColor Cyan
aws ecs update-service --cluster $Cluster --service $Service --force-new-deployment --region $Region
Write-Host "Deploy acionado. Aguarde 1-2 min para o rolling update completar." -ForegroundColor Green
