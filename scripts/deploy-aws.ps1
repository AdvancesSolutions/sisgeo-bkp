# Deploy SIGEO para AWS - ECR + Build + Push da API
# Pré-requisito: aws configure (ou AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)

param(
    [string]$AwsRegion = "sa-east-1",
    [string]$EcrRepo = "sigeo-api",
    [switch]$SkipBuild,
    [switch]$SkipPush
)

$ErrorActionPreference = "Stop"
$Awsexe = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
$Root = Split-Path -Parent $PSScriptRoot

function Test-Aws {
    try {
        $null = & $Awsexe sts get-caller-identity 2>&1
        return $LASTEXITCODE -eq 0
    } catch { return $false }
}

function Get-AccountId {
    $r = & $Awsexe sts get-caller-identity --output json 2>&1
    if ($LASTEXITCODE -ne 0) { return $null }
    ($r | ConvertFrom-Json).Account
}

Write-Host "=== Deploy SIGEO (ECR + API image) ===" -ForegroundColor Cyan
Write-Host ""

# 1. AWS credentials
if (-not (Test-Aws)) {
    Write-Host "ERRO: AWS nao configurado." -ForegroundColor Red
    Write-Host "Execute: aws configure" -ForegroundColor Yellow
    Write-Host "  - Access Key ID" -ForegroundColor Gray
    Write-Host "  - Secret Access Key" -ForegroundColor Gray
    Write-Host "  - Default region: sa-east-1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ou defina: `$env:AWS_ACCESS_KEY_ID, `$env:AWS_SECRET_ACCESS_KEY, `$env:AWS_REGION" -ForegroundColor Yellow
    exit 1
}

$AccountId = Get-AccountId
if (-not $AccountId) { exit 1 }

$Registry = "$AccountId.dkr.ecr.$AwsRegion.amazonaws.com"
$ImageUri = "$Registry/${EcrRepo}:latest"

Write-Host "[OK] AWS: Account $AccountId, Region $AwsRegion" -ForegroundColor Green

# 2. ECR repo
Write-Host ""
Write-Host "[2/4] ECR repository $EcrRepo..." -ForegroundColor Cyan
$ecrExists = $false
try {
    $null = & $Awsexe ecr describe-repositories --repository-names $EcrRepo --region $AwsRegion 2>$null
    if ($LASTEXITCODE -eq 0) { $ecrExists = $true }
} catch { }
if (-not $ecrExists) {
    & $Awsexe ecr create-repository --repository-name $EcrRepo --region $AwsRegion 2>$null | Out-Null
    Write-Host "      Criado." -ForegroundColor Green
} else {
    Write-Host "      Ja existe." -ForegroundColor Green
}

# 3. Docker login ECR
Write-Host ""
Write-Host "[3/4] Docker login ECR..." -ForegroundColor Cyan
$pwd = & $Awsexe ecr get-login-password --region $AwsRegion 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host $pwd; exit 1 }
$pwd | docker login --username AWS --password-stdin $Registry 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "Falha login ECR"; exit 1 }
Write-Host "      OK." -ForegroundColor Green

# 4. Build + Push
$prevErrPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
    if (-not $SkipBuild) {
        Write-Host ""
        Write-Host "[4/4] Docker build..." -ForegroundColor Cyan
        Push-Location $Root
        docker build -f apps/api/Dockerfile -t "${EcrRepo}:latest" -t $ImageUri .
        $buildOk = $LASTEXITCODE -eq 0
        Pop-Location
        if (-not $buildOk) { Write-Host "Falha build"; exit 1 }
        Write-Host "      OK." -ForegroundColor Green
    } else {
        Write-Host "[4/4] Build ignorado (--SkipBuild)." -ForegroundColor Gray
    }

    if (-not $SkipPush) {
        Write-Host ""
        Write-Host "      Docker push $ImageUri..." -ForegroundColor Cyan
        docker push $ImageUri
        if ($LASTEXITCODE -ne 0) { Write-Host "Falha push"; exit 1 }
        Write-Host "      OK." -ForegroundColor Green
    } else {
        Write-Host "      Push ignorado (--SkipPush)." -ForegroundColor Gray
    }
} finally {
    $ErrorActionPreference = $prevErrPref
}

Write-Host ""
Write-Host "=== Concluido ===" -ForegroundColor Green
Write-Host "Imagem: $ImageUri" -ForegroundColor White
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. RDS: criar PostgreSQL, DB sigeo, anotar endpoint/senha." -ForegroundColor Gray
Write-Host "  2. App Runner: criar servico com imagem $ImageUri, porta 3000, env DB_* e JWT_*." -ForegroundColor Gray
Write-Host "  3. Amplify: conectar repo GitHub, VITE_API_URL = URL do App Runner." -ForegroundColor Gray
Write-Host "  4. GitHub Secrets: AWS_*, ECR_REPO=$EcrRepo, APP_RUNNER_SERVICE_ARN." -ForegroundColor Gray
Write-Host ""
