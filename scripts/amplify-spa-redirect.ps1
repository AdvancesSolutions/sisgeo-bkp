# Aplica regra de rewrite SPA no Amplify (rotas como /employees/ servem index.html)
# Requer: aws configure
param(
    [string]$AwsRegion = "sa-east-1",
    [string]$AppName = "sigeo"
)

$ErrorActionPreference = "Stop"
$Awsexe = "aws"

# Regra SPA: rewrite 200 para index.html (wildcard Amplify = <<*>>). Use condition "" (nao null) para a API.
$RulesFile = Join-Path (Split-Path -Parent $PSScriptRoot) "scripts\amplify-custom-rules.json"
$RulesPath = (Resolve-Path $RulesFile).Path -replace '\\', '/'
$FileArg = "file:///$RulesPath"

$AppId = (& $Awsexe amplify list-apps --region $AwsRegion --query "apps[?name=='$AppName'].appId" --output text 2>$null)
if (-not $AppId -or $AppId -eq "None") {
    Write-Host "ERRO: App Amplify '$AppName' nao encontrado na regiao $AwsRegion." -ForegroundColor Red
    exit 1
}
$AppId = $AppId.Trim()

Write-Host "Aplicando SPA rewrite no Amplify app $AppId..." -ForegroundColor Cyan
& $Awsexe amplify update-app --app-id $AppId --custom-rules $FileArg --region $AwsRegion 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao atualizar custom rules." -ForegroundColor Red
    exit 1
}
Write-Host "OK. Teste: https://main.$AppId.amplifyapp.com/employees/" -ForegroundColor Green
