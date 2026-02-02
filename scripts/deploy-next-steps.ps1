# Executa os proximos passos do deploy: ECR+push, depois GitHub Secrets (se gh logado).
# Requer: AWS configurado (aws configure) OU env AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
# Para secrets: gh auth login (repo scope)

param(
    [string]$AwsRegion = "sa-east-1",
    [string]$EcrRepo = "sigeo-api",
    [string]$GhRepo = "AdvancesSolutions/sisgeo",
    [switch]$SecretsOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

# Atualizar PATH para gh
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "=== Proximos passos - Deploy SIGEO ===" -ForegroundColor Cyan
Write-Host ""

# 1. AWS: persistir env em aws configure se fornecidos
if ($env:AWS_ACCESS_KEY_ID -and $env:AWS_SECRET_ACCESS_KEY) {
    Write-Host "[1] Configurando AWS a partir de env..." -ForegroundColor Cyan
    & aws configure set aws_access_key_id $env:AWS_ACCESS_KEY_ID 2>$null
    & aws configure set aws_secret_access_key $env:AWS_SECRET_ACCESS_KEY 2>$null
    if ($env:AWS_REGION) { & aws configure set region $env:AWS_REGION 2>$null }
    else { & aws configure set region $AwsRegion 2>$null }
    Write-Host "    OK." -ForegroundColor Green
} else {
    Write-Host "[1] AWS: use env AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION ou 'aws configure'." -ForegroundColor Yellow
}

# 2. ECR + build + push (pular com -SecretsOnly)
if (-not $SecretsOnly) {
    Write-Host ""
    & "$PSScriptRoot\deploy-aws.ps1" -AwsRegion $AwsRegion -EcrRepo $EcrRepo
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Configure AWS e execute novamente." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[2] Deploy ignorado (-SecretsOnly)." -ForegroundColor Gray
}

# 3. GitHub Secrets (gh)
Write-Host ""
Write-Host "[3] GitHub Secrets (repo $GhRepo)..." -ForegroundColor Cyan
$ghOk = $false
try { $null = & gh auth status 2>&1; $ghOk = $LASTEXITCODE -eq 0 } catch {}
if (-not $ghOk) {
    Write-Host "    gh nao logado. Execute: gh auth login" -ForegroundColor Yellow
    Write-Host "    Depois adicione os secrets manualmente em:" -ForegroundColor Gray
    Write-Host "    https://github.com/$GhRepo/settings/secrets/actions" -ForegroundColor Gray
    Write-Host "    Ou rode este script apos gh auth login." -ForegroundColor Gray
    exit 0
}

$prevErr = $ErrorActionPreference
$ErrorActionPreference = "Continue"

$accountId = (& aws sts get-caller-identity --query Account --output text 2>$null)
$registry = "$accountId.dkr.ecr.$AwsRegion.amazonaws.com"
$svcArn = $null
try {
    $svcArn = (& aws apprunner list-services --region $AwsRegion --query "ServiceSummaryList[?ServiceName=='sigeo-api'].ServiceArn" --output text 2>$null)
} catch { }

$secrets = @{
    AWS_REGION = $AwsRegion
    ECR_REPO = $EcrRepo
}
if ($svcArn) { $secrets["APP_RUNNER_SERVICE_ARN"] = $svcArn }

if ($env:AWS_ACCESS_KEY_ID) { $secrets["AWS_ACCESS_KEY_ID"] = $env:AWS_ACCESS_KEY_ID }
else {
    $ak = (& aws configure get aws_access_key_id 2>$null)
    if ($ak) { $secrets["AWS_ACCESS_KEY_ID"] = $ak }
}
if ($env:AWS_SECRET_ACCESS_KEY) { $secrets["AWS_SECRET_ACCESS_KEY"] = $env:AWS_SECRET_ACCESS_KEY }
else {
    $sk = (& aws configure get aws_secret_access_key 2>$null)
    if ($sk) { $secrets["AWS_SECRET_ACCESS_KEY"] = $sk }
}

$ErrorActionPreference = $prevErr

Write-Host "    Definindo secrets..." -ForegroundColor Gray
foreach ($k in $secrets.Keys) {
    $v = $secrets[$k]
    if ($v) {
        $v | & gh secret set $k --repo $GhRepo 2>$null
        if ($LASTEXITCODE -eq 0) { Write-Host "      $k OK" -ForegroundColor Green }
    }
}

Write-Host ""
Write-Host "=== Concluido ===" -ForegroundColor Green
Write-Host "Proximo: criar RDS, App Runner e Amplify no Console AWS." -ForegroundColor Gray
if (-not $svcArn) {
    Write-Host "Depois de criar o App Runner, adicione o secret APP_RUNNER_SERVICE_ARN em:" -ForegroundColor Yellow
    Write-Host "  https://github.com/$GhRepo/settings/secrets/actions" -ForegroundColor Gray
}
