#!/usr/bin/env pwsh
# Script para diagnosticar e corrigir API em produção

$ErrorActionPreference = "Continue"
$instanceId = "i-0f73ae1ae2361763e"
$region = "sa-east-1"
$ecrUri = "320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api"

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   DIAGNÓSTICO E CORREÇÃO DA API" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Função para enviar comando e obter resultado
function Invoke-SSMCommand {
    param([string]$Command)
    
    $cmdId = aws ssm send-command `
        --instance-ids $instanceId `
        --document-name "AWS-RunShellScript" `
        --parameters "commands=['$Command']" `
        --region $region `
        --query "Command.CommandId" `
        --output text 2>&1
    
    if ($cmdId -and $cmdId -notlike "*error*") {
        Start-Sleep -Seconds 3
        $output = aws ssm get-command-invocation `
            --command-id $cmdId `
            --instance-id $instanceId `
            --region $region `
            --query "StandardOutputContent" `
            --output text 2>&1
        return $output
    }
    return $null
}

# Passo 1: Verificar containers atuais
Write-Host "1. Verificando containers..." -ForegroundColor Yellow
$containers = Invoke-SSMCommand "docker ps -a"
Write-Host $containers
Write-Host ""

# Passo 2: Parar e remover containers antigos
Write-Host "2. Limpando containers antigos..." -ForegroundColor Yellow
Invoke-SSMCommand "docker stop `$(docker ps -q) 2>/dev/null; docker rm `$(docker ps -aq) 2>/dev/null" | Out-Null
Write-Host "✓ Containers removidos"
Write-Host ""

# Passo 3: Criar arquivo .env com todas as variáveis
Write-Host "3. Criando configuração..." -ForegroundColor Yellow
$envConfig = @"
NODE_ENV=production
PORT=3000
DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=SigeoNewPass123!
DB_NAME=sigeo
JWT_SECRET=a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede
JWT_REFRESH_SECRET=657c436814463e82fba56e0767166c75420ee3c8ee070f80f514fa7fb3fa07e5
CORS_ORIGIN=https://sigeo.advances.com.br,https://main.da1hucc7ed5a9.amplifyapp.com
"@

$createEnvCmd = "echo '$envConfig' > /tmp/sigeo.env"
Invoke-SSMCommand $createEnvCmd | Out-Null
Write-Host "✓ Configuração criada"
Write-Host ""

# Passo 4: Iniciar novo container
Write-Host "4. Iniciando novo container..." -ForegroundColor Yellow
$dockerCmd = "docker run -d --restart always --name sigeo-api --env-file /tmp/sigeo.env -p 3000:3000 $ecrUri`:latest"
$result = Invoke-SSMCommand $dockerCmd
Write-Host "Container ID: $result"
Write-Host ""

# Passo 5: Aguardar inicialização
Write-Host "5. Aguardando inicialização (15 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Passo 6: Verificar logs
Write-Host "6. Verificando logs..." -ForegroundColor Yellow
$logs = Invoke-SSMCommand "docker logs sigeo-api 2>&1 | tail -20"
Write-Host $logs
Write-Host ""

# Passo 7: Testar API
Write-Host "7. Testando API..." -ForegroundColor Yellow
Write-Host ""

for ($i = 1; $i -le 3; $i++) {
    Write-Host "  Tentativa $i/3..."
    
    try {
        $response = Invoke-WebRequest `
            -Uri "http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/auth/login" `
            -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body '{"email":"admin@empresa.com","password":"admin123"}' `
            -UseBasicParsing `
            -TimeoutSec 10 `
            -ErrorAction Stop
        
        $content = $response.Content | ConvertFrom-Json
        
        if ($content.accessToken -or $content.token) {
            Write-Host ""
            Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
            Write-Host "   ✓ SUCESSO! API FUNCIONANDO CORRETAMENTE" -ForegroundColor Green
            Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
            Write-Host ""
            Write-Host "Token recebido!" -ForegroundColor Green
            Write-Host "Acesse: https://sigeo.advances.com.br" -ForegroundColor Cyan
            Write-Host "Email: admin@empresa.com" -ForegroundColor Cyan
            Write-Host "Senha: admin123" -ForegroundColor Cyan
            exit 0
        }
    } catch {
        Write-Host "  Erro: $($_.Exception.Message)" -ForegroundColor Gray
    }
    
    if ($i -lt 3) {
        Start-Sleep -Seconds 5
    }
}

Write-Host ""
Write-Host "⚠️  API ainda apresentando erros." -ForegroundColor Yellow
Write-Host "Verifique os logs acima para mais detalhes." -ForegroundColor Yellow
