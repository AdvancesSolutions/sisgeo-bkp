# CORREÇÃO RÁPIDA - Execute no EC2 via SSH ou Session Manager

Write-Host "=== SCRIPT DE CORREÇÃO SIGEO API ===" -ForegroundColor Cyan
Write-Host ""

# Opção 1: SSH Automático (se tiver chave)
Write-Host "OPÇÃO 1: SSH (SE TIVER CHAVE PEM)" -ForegroundColor Yellow
Write-Host "  ssh -i sua-chave.pem ec2-user@18.228.206.86"
Write-Host ""

# Opção 2: Session Manager via Console
Write-Host "OPÇÃO 2: AWS SESSION MANAGER (RECOMENDADO)" -ForegroundColor Green
Write-Host "  1. Abra: https://sa-east-1.console.aws.amazon.com/ec2/v2/home?region=sa-east-1#Instances:instanceId=i-0f73ae1ae2361763e"
Write-Host "  2. Clique em 'Connect' > 'Session Manager' > 'Connect'"
Write-Host "  3. Cole o comando abaixo:"  
Write-Host ""

$comando = @'
docker stop $(docker ps -q) 2>/dev/null
docker run -d --name sigeo-api --restart always -p 3000:3000 \
  -e DB_PASSWORD=SigeoNewPass123! \
  -e DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com \
  -e DB_USER=postgres -e DB_NAME=sigeo -e DB_PORT=5432 \
  -e NODE_ENV=production -e PORT=3000 \
  -e JWT_SECRET=a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede \
  -e JWT_REFRESH_SECRET=657c436814463e82fba56e0767166c75420ee3c8ee070f80f514fa7fb3fa07e5 \
  -e CORS_ORIGIN=https://sigeo.advances.com.br \
  320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest && \
sleep 5 && docker ps && dockerlogs sigeo-api | tail -20
'@

Write-Host $comando -ForegroundColor White
Write-Host ""
Write-Host "=== AFTER 10 SECONDS, TEST: ===" -ForegroundColor Cyan
Write-Host "curl -X POST http://localhost:3000/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@empresa.com\",\"password\":\"admin123\"}'"
Write-Host ""

# Tentar via Session Manager CLI
Write-Host "OPÇÃO 3: TENTANDO VIA AWS CLI SESSION MANAGER..." -ForegroundColor Yellow

try {
    $startSession = aws ssm start-session --target i-0f73ae1ae2361763e --region sa-east-1 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Session Manager não disponível via CLI" -ForegroundColor Red
        Write-Host "  Use a OPÇÃO 2 (Console Web)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Erro ao iniciar sessão" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== AGUARDANDO SUA AÇÃO ===" -ForegroundColor Red
Write-Host "Pressione qualquer tecla após executar o comando no EC2..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Testando API..." -ForegroundColor Cyan
$result = curl.exe -s -X POST "http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@empresa.com","password":"admin123"}' 2>&1

if ($result -match "accessToken") {
    Write-Host "✓✓✓ FUNCIONANDO! Login retornou token!" -ForegroundColor Green
    $result | ConvertFrom-Json | ConvertTo-Json -Depth 3
} else {
    Write-Host "✗ Ainda com erro:" -ForegroundColor Red  
    Write-Host $result
}
