# Script para criar usuário de teste no SISGEO
# Requisito: API do SISGEO rodando em localhost:3000

$apiUrl = "http://localhost:3000"
$email = "admin@empresa.com"
$password = "Admin@123"
$nome = "Super Admin"

Write-Host "=== Criar Usuário de Teste ===" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Tentar fazer login para verificar se existe
Write-Host "1️⃣ Verificando se usuário existe..." -ForegroundColor Yellow
$loginUrl = "$apiUrl/auth/login"
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri $loginUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing
    
    Write-Host "✅ Usuário já existe e login funcionou!" -ForegroundColor Green
    $result = $loginResponse.Content | ConvertFrom-Json
    Write-Host "Token: $($result.accessToken.Substring(0, 50))..." -ForegroundColor Gray
    exit 0
} catch {
    $status = $_.Exception.Response.StatusCode.Value__
    if ($status -eq 401) {
        Write-Host "⚠️ Usuário existe mas senha está incorreta" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "ℹ️ Usuário não encontrado ou servidor não está respondendo" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Próximas etapas:" -ForegroundColor Cyan
Write-Host "1. Certifique-se de que: pnpm dev:api está rodando em localhost:3000"
Write-Host "2. Verifique o banco de dados do SISGEO"
Write-Host "3. Crie o usuário manualmente via API ou admin panel"
Write-Host ""
Write-Host "💡 Para testar com a nova API de tarefas (localhost:3001):" -ForegroundColor Green
Write-Host "   Use: admin@empresa.com / admin123"
Write-Host ""
