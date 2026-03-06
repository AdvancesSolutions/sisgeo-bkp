Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SOLUCAO FINAL - 3 CLIQUES" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Preparar o comando
$comando = "docker stop `$(docker ps -q) && docker run -d --name sigeo-api --restart always -p 3000:3000 -e DB_PASSWORD=SigeoNewPass123! -e DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -e DB_USER=postgres -e DB_NAME=sigeo -e DB_PORT=5432 -e NODE_ENV=production -e PORT=3000 -e JWT_SECRET=a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede -e JWT_REFRESH_SECRET=657c436814463e82fba56e0767166c75420ee3c8ee070f80f514fa7fb3fa07e5 -e CORS_ORIGIN=https://sigeo.advances.com.br 320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest"

# Copiar para clipboard
$comando | Set-Clipboard

Write-Host "[OK] Comando copiado!" -ForegroundColor Green
Write-Host ""
Write-Host "Abrindo AWS Console..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# Abrir console
Start-Process "https://sa-east-1.console.aws.amazon.com/ec2/home?region=sa-east-1#ConnectToInstance:instanceId=i-0f73ae1ae2361763e"

Write-Host ""
Write-Host "========================" -ForegroundColor Yellow
Write-Host "  FACA ESTES 3 PASSOS:" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Na pagina que abriu, clique na aba [Session Manager]" -ForegroundColor White
Write-Host ""
Write-Host "2. Clique no botao laranja [Connect]" -ForegroundColor White
Write-Host ""
Write-Host "3. Cole o comando (Ctrl+V) e pressione [Enter]" -ForegroundColor White
Write-Host ""
Write-Host "Aguarde 10 segundos e pressione Enter aqui..." -ForegroundColor Cyan
Read-Host

Write-Host ""
Write-Host "Testando..." -ForegroundColor Cyan

$maxTentativas = 5
for ($i = 1; $i -le $maxTentativas; $i++) {
    Write-Host "  Tentativa $i/$maxTentativas..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body '{"email":"admin@empresa.com","password":"admin123"}' `
            -ErrorAction Stop
        
        Write-Host ""
        Write-Host "===========================================" -ForegroundColor Green
        Write-Host "  FUNCIONANDO!!! LOGIN OK!!!" -ForegroundColor Green
        Write-Host "===========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Token: $($response.accessToken.Substring(0,40))..." -ForegroundColor Green
        Write-Host "Usuario: $($response.user.email)" -ForegroundColor Green
        Write-Host "Papel: $($response.user.role)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Acesse agora: https://sigeo.advances.com.br" -ForegroundColor Cyan
        Write-Host "Login: admin@empresa.com" -ForegroundColor Cyan
        Write-Host "Senha: admin123" -ForegroundColor Cyan
        Write-Host ""
        exit 0
        
    } catch {
        if ($i -lt $maxTentativas) {
            Write-Host "    Ainda nao funcionou, aguardando 8s..." -ForegroundColor Yellow
            Start-Sleep -Seconds 8
        }
    }
}

Write-Host ""
Write-Host "[X] Ainda com erro." -ForegroundColor Red
Write-Host ""
Write-Host "Verifique se executou o comando no console." -ForegroundColor Yellow
Write-Host "Se o Session Manager nao abriu, tente:" -ForegroundColor Yellow
Write-Host "  - Fazer login na AWS Console primeiro" -ForegroundColor Cyan
Write-Host "  - Usar outro navegador" -ForegroundColor Cyan
Write-Host "  - Me avisar qual erro aparece" -ForegroundColor Cyan
Write-Host ""
