# Deploy SISGEO para AWS - Full Setup
# Inclui: ECR + Docker Build + Push + AppRunner + RDS

param(
    [string]$AwsRegion = "sa-east-1",
    [string]$EcrRepo = "sigeo-api"
)

$ErrorActionPreference = "Stop"
$Root = Get-Location
$AccountId = (aws sts get-caller-identity --query Account --output text).Trim()

Write-Host "=== DEPLOY SISGEO para AWS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Account: $AccountId | Region: $AwsRegion | Repo: $EcrRepo" -ForegroundColor Green
Write-Host ""

# 1. Criar ECR Repository
Write-Host "[1/6] Verificando ECR Repository..." -ForegroundColor Cyan
$repoExists = aws ecr describe-repositories --repository-names $EcrRepo --region $AwsRegion 2>&1 | Select-String "repositoryArn"
if (-not $repoExists) {
    Write-Host "      Criando repositório $EcrRepo..." -ForegroundColor Yellow
    aws ecr create-repository --repository-name $EcrRepo --region $AwsRegion --image-scan-on-push | Out-Null
    Write-Host "      ✓ Repositório criado." -ForegroundColor Green
} else {
    Write-Host "      ✓ Repositório $EcrRepo já existe." -ForegroundColor Green
}

# 2. Login no ECR
Write-Host ""
Write-Host "[2/6] Fazendo login no ECR..." -ForegroundColor Cyan
$loginToken = aws ecr get-authorization-token --region $AwsRegion --query 'authorizationData[0].authorizationToken' --output text
if (-not $loginToken) { throw "Falha ao obter token ECR" }
$decodedToken = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($loginToken))
$username, $password = $decodedToken -split ':'
$Registry = "$AccountId.dkr.ecr.$AwsRegion.amazonaws.com"
echo $password | docker login --username $username --password-stdin $Registry | Out-Null
Write-Host "      ✓ Login ECR OK." -ForegroundColor Green

# 3. Build da imagem Docker
Write-Host ""
Write-Host "[3/6] Build da imagem Docker..." -ForegroundColor Cyan
$ImageUri = "$Registry/${EcrRepo}:latest"
Set-Location "task-management-api"
docker build -t $EcrRepo:latest .
if ($LASTEXITCODE -ne 0) { throw "Falha no build Docker" }
Write-Host "      ✓ Build concluído." -ForegroundColor Green

# 4. Tag para ECR
Write-Host ""
Write-Host "[4/6] Tagging para ECR..." -ForegroundColor Cyan
docker tag ${EcrRepo}:latest $ImageUri
Write-Host "      ✓ Tag criada: $ImageUri" -ForegroundColor Green

# 5. Push para ECR
Write-Host ""
Write-Host "[5/6] Fazendo push para ECR..." -ForegroundColor Cyan
docker push $ImageUri
if ($LASTEXITCODE -ne 0) { throw "Falha no push Docker" }
Write-Host "      ✓ Push concluído." -ForegroundColor Green

# 6. Info para próximos passos
Write-Host ""
Write-Host "[6/6] Próximos passos..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximas acoes:" -ForegroundColor Yellow
Write-Host "  1. Criar RDS PostgreSQL (opcional)" -ForegroundColor Gray
Write-Host "  2. Criar App Runner Service com:" -ForegroundColor Gray
Write-Host "     - Image URI: $ImageUri" -ForegroundColor Gray
Write-Host "     - Port: 3000" -ForegroundColor Gray
Write-Host "     - IAM Role: arn:aws:iam::${AccountId}:role/sigeo-apprunner-ecr-access" -ForegroundColor Gray
Write-Host "  3. Deploy Frontend no Amplify" -ForegroundColor Gray
Write-Host ""
Write-Host "Deploy preparado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "URL da imagem ECR:" -ForegroundColor Cyan
Write-Host "$ImageUri" -ForegroundColor White
Write-Host ""
Set-Location $Root
