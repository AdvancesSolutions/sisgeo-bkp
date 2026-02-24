Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TESTE RAPIDO - Status da API" -ForegroundColor Yellow  
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1] Testando Health..." -ForegroundColor Cyan
$health = curl.exe -s -m 5 "http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/health" 2>&1
Write-Host "  Resposta: $health"
Write-Host ""

Write-Host "[2] Testando Login..." -ForegroundColor Cyan
try {
    $body = @{ 
        email = "admin@empresa.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/auth/login" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
    
    Write-Host ""
    Write-Host ">>> FUNCIONANDO!!!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Token: $($response.accessToken.Substring(0,50))..." -ForegroundColor Green
    Write-Host "Usuario: $($response.user.email) - $($response.user.role)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Acesse: https://sigeo.advances.com.br" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    $errorDetail = $_.Exception.Message
    if ($errorDetail -match "500") {
        Write-Host ""
        Write-Host "[X] ERRO 500 - Container ainda com senha antiga!" -ForegroundColor Red
        Write-Host ""
        Write-Host "SOLUCAO: Execute este comando no EC2:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "docker stop `$(docker ps -q); docker run -d --name sigeo-api --restart always -p 3000:3000 -e DB_PASSWORD=SigeoNewPass123! -e DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -e DB_USER=postgres -e DB_NAME=sigeo -e DB_PORT=5432 -e NODE_ENV=production -e PORT=3000 -e JWT_SECRET=a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede -e JWT_REFRESH_SECRET=657c436814463e82fba56e0767166c75420ee3c8ee070f80f514fa7fb3fa07e5 -e CORS_ORIGIN=https://sigeo.advances.com.br 320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest" -ForegroundColor White
        Write-Host ""
        Write-Host "Acesse o EC2:" -ForegroundColor Yellow
        Write-Host "https://sa-east-1.console.aws.amazon.com/ec2/v2/home?region=sa-east-1#Instances:instanceId=i-0f73ae1ae2361763e" -ForegroundColor Cyan
        Write-Host "Clique 'Connect' > 'Session Manager' > 'Connect' e cole o comando" -ForegroundColor Cyan
    } else {
        Write-Host "[X] Erro: $errorDetail" -ForegroundColor Red
    }
}

Write-Host ""
