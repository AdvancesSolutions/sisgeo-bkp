Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "     CORRECAO AUTOMATICA - SIGEO API (Senha do Banco Correta)" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[!] SSM NAO DISPONIVEL - Preciso que voce faca isso manualmente" -ForegroundColor Red
Write-Host ""

# Preparar comando
$comando = @'
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true  
docker pull 320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest 2>/dev/null || true
docker run -d --name sigeo-api --restart always -p 3000:3000 -e NODE_ENV=production -e PORT=3000 -e DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -e DB_PORT=5432 -e DB_USER=postgres -e DB_PASSWORD=SigeoNewPass123! -e DB_NAME=sigeo -e JWT_SECRET=a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede -e JWT_REFRESH_SECRET=657c436814463e82fba56e0767166c75420ee3c8ee070f80f514fa7fb3fa07e5 -e CORS_ORIGIN=https://sigeo.advances.com.br 320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest
sleep 5 && docker ps
'@

# Copiar comando para clipboard
$comando | Set-Clipboard
Write-Host "[OK] Comando copiado para area de transferencia!" -ForegroundColor Green
Write-Host ""

Write-Host "PASSO A PASSO:" -ForegroundColor Yellow
Write-Host ""  
Write-Host "1. Vou abrir o AWS Console para você em 3 segundos..."
Write-Host "2. Na página que abrir, clique no botão laranja 'Connect'"
Write-Host "3. Na aba 'Session Manager', clique em 'Connect' novamente"
Write-Host "4. Cole o comando (Ctrl+V) e pressione Enter"
Write-Host "5. Aguarde ~10 segundos e volte aqui"
Write-Host ""

Write-Host "Abrindo AWS Console em 3..." -ForegroundColor Cyan
Start-Sleep -Seconds 1
Write-Host "2..." -ForegroundColor Cyan
Start-Sleep -Seconds 1
Write-Host "1..." -ForegroundColor Cyan
Start-Sleep -Seconds 1

# Abrir console
$url = "https://sa-east-1.console.aws.amazon.com/ec2/v2/home?region=sa-east-1#Instances:instanceId=i-0f73ae1ae2361763e"
Start-Process $url

Write-Host ""
Write-Host "[OK] Console aberto!" -ForegroundColor Green
Write-Host ""
Write-Host "===== COMANDO (já está copiado - Ctrl+V) =====" -ForegroundColor Yellow
Write-Host $comando -ForegroundColor White
Write-Host "==============================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Após executar no console, pressione ENTER aqui para testar..." -ForegroundColor Cyan
Read-Host

Write-Host ""
Write-Host "Testando a API..." -ForegroundColor Cyan

for ($i = 1; $i -le 3; $i++) {
    Write-Host "  Tentativa $i/3..." -ForegroundColor Yellow
    
    $result = curl.exe -s -m 5 -X POST "http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/auth/login" `
      -H "Content-Type: application/json" `
      -d '{"email":"admin@empresa.com","password":"admin123"}' 2>&1
    
    if ($result -match "accessToken") {
        Write-Host ""
        Write-Host ">>> SUCESSO!!! LOGIN FUNCIONANDO!!!" -ForegroundColor Green
        Write-Host ""
        $json = $result | ConvertFrom-Json
        Write-Host "Token recebido: $($json.accessToken.Substring(0,50))..." -ForegroundColor Green
        Write-Host "Usuario: $($json.user.name) ($($json.user.role))" -ForegroundColor Green
        Write-Host ""
        Write-Host "Acesse: https://sigeo.advances.com.br" -ForegroundColor Cyan
        Write-Host "Login: admin@empresa.com" -ForegroundColor Cyan
        Write-Host "Senha: admin123" -ForegroundColor Cyan
        exit 0
    }
    
    if ($i -lt 3) {
        Write-Host "  Ainda não funcionou, tentando novamente em 10s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
}

Write-Host ""
Write-Host "[X] Ainda com erro. Resposta da API:" -ForegroundColor Red
Write-Host $result
Write-Host ""
Write-Host "Verifique se o comando foi executado corretamente no console." -ForegroundColor Yellow
Write-Host "Ou veja os logs no EC2" -ForegroundColor Yellow
