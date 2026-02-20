# Aplica regra de rewrite SPA no Amplify (rotas como /employees/ servem index.html)
# Requer: aws configure
param(
    [string]$AwsRegion = "sa-east-1",
    [string]$AppName = "sigeo"
)

$ErrorActionPreference = "Stop"
$Awsexe = "aws"

$AppId = (& $Awsexe amplify list-apps --region $AwsRegion --query "apps[?name=='$AppName'].appId" --output text 2>$null)
if (-not $AppId -or $AppId -eq "None") {
    Write-Host "ERRO: App Amplify '$AppName' nao encontrado na regiao $AwsRegion." -ForegroundColor Red
    exit 1
}
$AppId = $AppId.Trim()

Write-Host "Aplicando SPA rewrite no Amplify app $AppId..." -ForegroundColor Cyan
# Usa --cli-input-json (file:// nao funciona em --custom-rules no Windows)
$InputFile = Join-Path (Split-Path -Parent $PSScriptRoot) "scripts\amplify-update-input.json"
$inputContent = (Get-Content $InputFile -Raw) -replace '"appId":"[^"]*"', "`"appId`":`"$AppId`""
$tempFile = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tempFile, $inputContent, [System.Text.UTF8Encoding]::new($false))
$fileUri = "file://" + ((Resolve-Path $tempFile).Path -replace '\\', '/')
try {
    & $Awsexe amplify update-app --cli-input-json $fileUri --region $AwsRegion 2>&1
} finally {
    Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao atualizar custom rules." -ForegroundColor Red
    exit 1
}
Write-Host "OK. Teste: https://sigeo.advances.com.br/employees/ e pressione F5." -ForegroundColor Green
