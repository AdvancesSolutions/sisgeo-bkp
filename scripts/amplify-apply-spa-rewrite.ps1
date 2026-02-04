# Aplica a regra SPA (rewrite /* -> /index.html 200) no Amplify
# Corrige 404 ao dar refresh em rotas como /dashboard, /tasks, etc.
# Uso: .\scripts\amplify-apply-spa-rewrite.ps1 [-AppId d4eu378gsc65t]

param(
    [string]$AppId = "d4eu378gsc65t",
    [string]$Region = "sa-east-1"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$RulesFile = Join-Path $Root "scripts\amplify-custom-rules.json"

if (-not (Test-Path $RulesFile)) {
    Write-Host "ERRO: $RulesFile nao encontrado." -ForegroundColor Red
    exit 1
}

Write-Host "Aplicando regra SPA no Amplify (app $AppId)..." -ForegroundColor Cyan
$rulesPath = (Resolve-Path $RulesFile).Path -replace '\\', '/'
$fileUri = "file:///$rulesPath"

& aws amplify update-app --app-id $AppId --custom-rules $fileUri --region $Region 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha. Verifique se AWS esta configurado e o app-id esta correto." -ForegroundColor Red
    exit 1
}

Write-Host "OK. Regra SPA aplicada. Teste: acesse /dashboard e pressione F5." -ForegroundColor Green
