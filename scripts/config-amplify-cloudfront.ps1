# Configurar VITE_API_URL no Amplify e (opcional) criar Origin Request Policy no CloudFront
# Uso: .\scripts\config-amplify-cloudfront.ps1
# Requer: AWS CLI configurado (aws configure)

param(
    [string]$AmplifyAppId = "",
    [string]$AmplifyBranch = "main",
    [string]$ViteApiUrl = "https://dapotha14ic3h.cloudfront.net",
    [string]$Region = "sa-east-1",
    [switch]$AmplifyOnly,
    [switch]$CloudFrontOnly
)

$ErrorActionPreference = "Stop"

# --- Amplify: definir VITE_API_URL ---
function Set-AmplifyViteApiUrl {
    if (-not $AmplifyAppId) {
        Write-Host "Amplify: informe o App ID (ex.: da1hucc7ed5a9). Obtenha em: Amplify > app sigeo > App settings > General." -ForegroundColor Yellow
        Write-Host "Uso: .\config-amplify-cloudfront.ps1 -AmplifyAppId da1hucc7ed5a9 -ViteApiUrl https://dapotha14ic3h.cloudfront.net" -ForegroundColor Gray
        return
    }

    Write-Host "Obtendo variáveis atuais do branch $AmplifyBranch..." -ForegroundColor Cyan
    $branch = aws amplify get-branch --app-id $AmplifyAppId --branch-name $AmplifyBranch --region $Region 2>$null | ConvertFrom-Json
    if (-not $branch) {
        Write-Host "Erro: não foi possível obter o branch. Verifique App ID e branch." -ForegroundColor Red
        return
    }

    $envVars = @{}
    if ($branch.branch.environmentVariables) {
        $branch.branch.environmentVariables.PSObject.Properties | ForEach-Object { $envVars[$_.Name] = $_.Value }
    }
    $envVars["VITE_API_URL"] = $ViteApiUrl

    $envJson = "{"
    $first = $true
    foreach ($k in $envVars.Keys) {
        if (-not $first) { $envJson += "," }
        $v = $envVars[$k] -replace '\\', '\\\\' -replace '"', '\"'
        $envJson += "`"$k`":`"$v`""
        $first = $false
    }
    $envJson += "}"
    Write-Host "Atualizando variáveis (VITE_API_URL=$ViteApiUrl)..." -ForegroundColor Cyan
    & aws amplify update-branch --app-id $AmplifyAppId --branch-name $AmplifyBranch --environment-variables $envJson --region $Region
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Amplify: VITE_API_URL definido. Rode um novo build (Hosting > Run build) ou faça push para aplicar." -ForegroundColor Green
    } else {
        Write-Host "Falha ao atualizar branch. Verifique o AWS CLI e permissões." -ForegroundColor Red
    }
}

# --- CloudFront: usar políticas gerenciadas (Authorization encaminhado) ---
# Nota: política custom com header "Authorization" não é permitida; use Managed-AllViewerExceptHostHeader.
function Show-CloudFrontInfo {
    Write-Host "CloudFront: a distribuição da API já foi configurada com:" -ForegroundColor Cyan
    Write-Host "  - Cache Policy: Managed-CachingDisabled (4135ea2d-6df8-44a3-9df3-4b5a84be39ad)" -ForegroundColor Gray
    Write-Host "  - Origin Request Policy: Managed-AllViewerExceptHostHeader (encaminha todos os headers exceto Host, incluindo Authorization)" -ForegroundColor Gray
    Write-Host "Para aplicar em outra distribuição: Console CloudFront > Behaviors > Default (*) > Cache policy = CachingDisabled, Origin request policy = AllViewerExceptHostHeader." -ForegroundColor Yellow
}

# --- Execução ---
if (-not $CloudFrontOnly) {
    Set-AmplifyViteApiUrl
}
if (-not $AmplifyOnly) {
    Show-CloudFrontInfo
}

Write-Host ""
Write-Host "Documentação: docs/CONFIGURAR-CLOUDFRONT-E-AMPLIFY.md" -ForegroundColor Gray
