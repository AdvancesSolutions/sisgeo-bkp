# Registra nova revisao da task definition com DB_PASSWORD como env var (contorno quando secret SSM nao e injetado).
# Uso: .\scripts\ecs-register-task-with-db-password.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$Region = "sa-east-1"
$dbPass = aws ssm get-parameter --name "/sigeo/db-password" --with-decryption --query "Parameter.Value" --output text --region $Region
if (-not $dbPass) { Write-Host "Falha ao ler senha do SSM." -ForegroundColor Red; exit 1 }

$taskDef = @'
{
  "family": "sigeo-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::320674390105:role/ecsTaskExecutionRole",
  "containerDefinitions": [{
    "name": "api",
    "image": "320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest",
    "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
    "essential": true,
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "PORT", "value": "3000"},
      {"name": "DB_HOST", "value": "sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"},
      {"name": "DB_PORT", "value": "5432"},
      {"name": "DB_USER", "value": "postgres"},
      {"name": "DB_NAME", "value": "sigeo"},
      {"name": "DB_PASSWORD", "value": "REPLACE_ME"},
      {"name": "JWT_SECRET", "value": "a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede"},
      {"name": "JWT_REFRESH_SECRET", "value": "657c436814463e82fba56e0767166c75420ee3c8ee070f80f514fa7fb3fa07e5"},
      {"name": "CORS_ORIGIN", "value": "https://sigeo.advances.com.br,https://main.da1hucc7ed5a9.amplifyapp.com"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/sigeo-api",
        "awslogs-region": "sa-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
'@

$escaped = $dbPass.Replace('\', '\\').Replace('"', '\"')
$taskDef = $taskDef.Replace('REPLACE_ME', $escaped)
$tmpFile = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tmpFile, $taskDef, [System.Text.UTF8Encoding]::new($false))

$rev = aws ecs register-task-definition --cli-input-json "file://$tmpFile" --region $Region --query "taskDefinition.revision" --output text
Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue

Write-Host "Task definition registrada: sigeo-api:$rev" -ForegroundColor Green
aws ecs update-service --cluster sigeo-cluster --service sigeo-api --task-definition "sigeo-api:$rev" --force-new-deployment --region $Region --query "service.taskDefinition" --output text | Out-Null
Write-Host "Servico atualizado. Aguarde 2-3 min para a nova task subir." -ForegroundColor Cyan
