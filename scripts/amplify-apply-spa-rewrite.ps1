# Aplica a regra SPA (rewrite /* -> /index.html 200) no Amplify
# Corrige 404 ao dar refresh em rotas como /dashboard, /tasks, etc.
# Uso: .\scripts\amplify-apply-spa-rewrite.ps1 [-AppId da1hucc7ed5a9]

param(
    [string]$AppId = "da1hucc7ed5a9",
    [string]$Region = "sa-east-1"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$inputFile = Join-Path $Root "scripts\amplify-update-input.json"
if (-not (Test-Path $inputFile)) {
    Write-Host "ERRO: $inputFile nao encontrado." -ForegroundColor Red
    exit 1
}
# Substitui appId no JSON se diferente do padrao
$inputContent = (Get-Content $inputFile -Raw) -replace '"appId":"[^"]*"', "`"appId`":`"$AppId`""
$tempFile = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tempFile, $inputContent, [System.Text.UTF8Encoding]::new($false))
# Windows: file://D:/path (2 slashes para AWS CLI)
$fileUri = "file://" + ((Resolve-Path $tempFile).Path -replace '\\', '/')

try {
    Write-Host "Aplicando regra SPA no Amplify (app $AppId)..." -ForegroundColor Cyan
    aws amplify update-app --cli-input-json $fileUri --region $Region 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Falha. Verifique se AWS esta configurado e o app-id esta correto." -ForegroundColor Red
        exit 1
    }
    Write-Host "OK. Regra SPA aplicada. Teste: https://sigeo.advances.com.br/employees/ e pressione F5." -ForegroundColor Green
} finally {
    Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
}
