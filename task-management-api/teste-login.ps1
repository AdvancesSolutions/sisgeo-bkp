# Script de teste de login - PowerShell
# Execute este script para testar a API

$url = "http://localhost:3001/auth/login"
$body = @{
    email = "admin@empresa.com"
    senha = "admin123"
} | ConvertTo-Json

Write-Host "🧪 Testando login na API..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host "Body: $body" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing
    
    $resultado = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Login bem-sucedido!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Token:" -ForegroundColor Yellow
    Write-Host $resultado.token -ForegroundColor White
    Write-Host ""
    Write-Host "Usuário:" -ForegroundColor Yellow
    Write-Host ($resultado.usuario | ConvertTo-Json) -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro na requisição:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Resposta do servidor:" -ForegroundColor Yellow
        Write-Host $errorBody -ForegroundColor White
    }
}
