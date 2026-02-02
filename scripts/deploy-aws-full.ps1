# Deploy completo SIGEO: RDS + App Runner + Amplify + GitHub Secrets + Bootstrap DB
# Requer: AWS configurado, Docker, gh auth login, imagem ECR já em push (rode deploy-aws.ps1 antes)
# Uso: .\scripts\deploy-aws-full.ps1 [-AwsRegion sa-east-1] [-GhRepo AdvancesSolutions/sisgeo]

param(
    [string]$AwsRegion = "sa-east-1",
    [string]$EcrRepo = "sigeo-api",
    [string]$GhRepo = "AdvancesSolutions/sisgeo",
    [switch]$SkipBootstrap,
    [string]$DbPassword  # use quando RDS ja existe e a senha nao esta em SSM (ex.: apos redefinir no Console)
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Awsexe = "aws"

# Evitar que stderr do AWS/Docker quebre o script
$PrevErr = $ErrorActionPreference
$ErrorActionPreference = "Continue"

function Invoke-Aws {
    param([string[]]$Args)
    & $Awsexe @Args 2>$null
    if ($LASTEXITCODE -ne 0) { throw "AWS CLI failed: $Args" }
}

function Ensure-Aws {
    $id = & $Awsexe sts get-caller-identity --query Account --output text 2>$null
    if (-not $id) { throw "AWS nao configurado. Execute aws configure." }
    $script:AccountId = $id.Trim()
    Write-Host "[OK] AWS Account $AccountId, Region $AwsRegion" -ForegroundColor Green
}

function New-RandomPassword {
    $bytes = New-Object byte[] 24
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    [Convert]::ToBase64String($bytes) -replace '[+/=]', '' | ForEach-Object { $_.Substring(0, [Math]::Min(24, $_.Length)) }
}

function New-RandomHex { [BitConverter]::ToString((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]]) -replace '-' }

Write-Host "=== Deploy completo SIGEO (RDS + App Runner + Amplify) ===" -ForegroundColor Cyan
Write-Host ""

Ensure-Aws
$ImageUri = "${AccountId}.dkr.ecr.${AwsRegion}.amazonaws.com/${EcrRepo}:latest"

# --- 1. IAM role App Runner ECR ---
$RoleName = "sigeo-apprunner-ecr-access"
$RoleArn = "arn:aws:iam::${AccountId}:role/${RoleName}"
$roleExists = $false
try {
    $null = & $Awsexe iam get-role --role-name $RoleName 2>$null
    if ($LASTEXITCODE -eq 0) { $roleExists = $true }
} catch {}

if (-not $roleExists) {
    Write-Host "[1/8] Criando IAM role $RoleName..." -ForegroundColor Cyan
    $trustFile = Join-Path $Root "scripts\trust-apprunner-ecr.json"
    if (-not (Test-Path $trustFile)) {
        @'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"build.apprunner.amazonaws.com"},"Action":"sts:AssumeRole"}]}
'@ | Set-Content $trustFile -Encoding UTF8
    }
    $trustPath = (Resolve-Path $trustFile).Path -replace '\\', '/'
    & $Awsexe iam create-role --role-name $RoleName --assume-role-policy-document "file://$trustPath" 2>$null | Out-Null
    & $Awsexe iam attach-role-policy --role-name $RoleName --policy-arn "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess" 2>$null | Out-Null
    Write-Host "      OK." -ForegroundColor Green
} else {
    Write-Host "[1/8] IAM role $RoleName ja existe." -ForegroundColor Green
}

# --- 2. RDS: subnet group + SG + instance ---
Write-Host ""
Write-Host "[2/8] RDS PostgreSQL..." -ForegroundColor Cyan
$VpcId = & $Awsexe ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text 2>$null
if (-not $VpcId -or $VpcId -eq "None") { throw "Nenhuma VPC default encontrada." }
$VpcId = $VpcId.Trim()

$DbSubnetName = "sigeo-db-subnets"
$null = & $Awsexe rds describe-db-subnet-groups --db-subnet-group-name default --region $AwsRegion 2>$null
$hasDefault = ($LASTEXITCODE -eq 0)
$useSubnet = "default"
if (-not $hasDefault) {
    $null = & $Awsexe rds describe-db-subnet-groups --db-subnet-group-name $DbSubnetName --region $AwsRegion 2>$null
    if ($LASTEXITCODE -ne 0) {
        $subIds = ((& $Awsexe ec2 describe-subnets --filters "Name=vpc-id,Values=$VpcId" --query "Subnets[0:2].SubnetId" --output text --region $AwsRegion 2>$null) -split '\s+') | Where-Object { $_ }
        if ($subIds -and $subIds.Count -ge 2) {
            & $Awsexe rds create-db-subnet-group --db-subnet-group-name $DbSubnetName --db-subnet-group-description "SIGEO RDS" --subnet-ids $subIds[0] $subIds[1] --region $AwsRegion 2>$null | Out-Null
        }
    }
    $useSubnet = $DbSubnetName
}

$SgName = "sigeo-rds-sg"
$SgId = & $Awsexe ec2 describe-security-groups --filters "Name=group-name,Values=$SgName" "Name=vpc-id,Values=$VpcId" --query "SecurityGroups[0].GroupId" --output text 2>$null
if (-not $SgId -or $SgId -eq "None") {
    $SgId = (& $Awsexe ec2 create-security-group --group-name $SgName --description "SIGEO RDS" --vpc-id $VpcId --query "GroupId" --output text 2>$null).Trim()
    & $Awsexe ec2 authorize-security-group-ingress --group-id $SgId --protocol tcp --port 5432 --cidr 0.0.0.0/0 2>$null | Out-Null
}
$DbIdentifier = "sigeo-db"
$exists = & $Awsexe rds describe-db-instances --db-instance-identifier $DbIdentifier --query "DBInstances[0].DBInstanceIdentifier" --output text --region $AwsRegion 2>$null
if ($exists -and $exists -ne "None") {
    if (-not $DbPassword) {
        $DbPassword = (& $Awsexe ssm get-parameter --name /sigeo/db-password --with-decryption --query "Parameter.Value" --output text --region $AwsRegion 2>$null)
    }
    if (-not $DbPassword) {
        throw "RDS $DbIdentifier existe. Execute com a nova senha: .\scripts\deploy-aws-full.ps1 -DbPassword 'SUA_NOVA_SENHA' (a senha sera aplicada no RDS e salva no SSM)."
    }
    # Aplicar senha no RDS se passada por parametro (permite redefinir sem usar Console)
    if ($DbPassword -and $PSBoundParameters.ContainsKey('DbPassword')) {
        Write-Host "      Aplicando nova senha no RDS..." -ForegroundColor Gray
        & $Awsexe rds modify-db-instance --db-instance-identifier $DbIdentifier --master-user-password $DbPassword --apply-immediately --region $AwsRegion 2>$null | Out-Null
        Start-Sleep -Seconds 30
    }
    & $Awsexe ssm put-parameter --name /sigeo/db-password --value $DbPassword --type SecureString --overwrite --region $AwsRegion 2>$null | Out-Null
} else {
    if (-not $DbPassword) { $DbPassword = New-RandomPassword }
}
if (-not $exists -or $exists -eq "None") {
    Write-Host "      Criando instancia $DbIdentifier (aguarde ~5 min)..." -ForegroundColor Gray
    & $Awsexe rds create-db-instance `
        --db-instance-identifier $DbIdentifier `
        --db-instance-class db.t3.micro `
        --engine postgres `
        --engine-version 16 `
        --master-username postgres `
        --master-user-password $DbPassword `
        --allocated-storage 20 `
        --vpc-security-group-ids $SgId `
        --db-subnet-group-name $useSubnet `
        --publicly-accessible `
        --no-multi-az `
        --region $AwsRegion 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Falha ao criar RDS. Verifique subnet group, SG e limites." }
    & $Awsexe rds wait db-instance-available --db-instance-identifier $DbIdentifier --region $AwsRegion 2>$null
    if ($LASTEXITCODE -ne 0) { throw "RDS wait falhou." }
    & $Awsexe ssm put-parameter --name /sigeo/db-password --value $DbPassword --type SecureString --overwrite --region $AwsRegion 2>$null | Out-Null
}
$ep = & $Awsexe rds describe-db-instances --db-instance-identifier $DbIdentifier --query "DBInstances[0].Endpoint.Address" --output text --region $AwsRegion 2>$null
$DbEndpoint = if ($ep) { $ep.Trim() } else { $null }
if (-not $DbEndpoint) { throw "RDS endpoint nao obtido." }
Write-Host "      Endpoint: $DbEndpoint" -ForegroundColor Green

# --- 3. DB sigeo ---
Write-Host ""
Write-Host "[3/8] Criando database sigeo..." -ForegroundColor Cyan
docker run --rm -e "PGPASSWORD=$DbPassword" postgres:16-alpine psql -h $DbEndpoint -U postgres -d postgres -c "CREATE DATABASE sigeo;" 2>$null | Out-Null
# ignorar erro se ja existir
Write-Host "      OK." -ForegroundColor Green

# --- 4. Amplify app + branch ---
Write-Host ""
Write-Host "[4/8] Amplify (app + branch main)..." -ForegroundColor Cyan
$GhToken = & gh auth token 2>$null
if (-not $GhToken) { throw "gh nao logado. Execute gh auth login." }
$RepoUrl = "https://github.com/$GhRepo"
$BuildSpecContent = Get-Content (Join-Path $Root "amplify.yml") -Raw
$RulesJson = '[{"source":"/*","status":"200","target":"/index.html"}]'
$AppId = $null
$apps = & $Awsexe amplify list-apps --region $AwsRegion --query "apps[?name=='sigeo'].appId" --output text 2>$null
if ($apps) { $AppId = ($apps -split '\s+')[0].Trim() }
if (-not $AppId) {
    $bsFile = Join-Path $Env:TEMP "sigeo-amplify-buildspec.yml"
    $BuildSpecContent | Set-Content -Path $bsFile -NoNewline -Encoding UTF8
    $bsPath = (Resolve-Path $bsFile).Path -replace '\\', '/'
    $buildSpecArg = "file:///$bsPath"
    $out = & $Awsexe amplify create-app --name sigeo --platform WEB --repository $RepoUrl --access-token $GhToken --build-spec $buildSpecArg --enable-branch-auto-build --region $AwsRegion --output json 2>&1
    Remove-Item $bsFile -Force -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        $out = & $Awsexe amplify create-app --name sigeo --platform WEB --repository $RepoUrl --access-token $GhToken --enable-branch-auto-build --region $AwsRegion --output json 2>&1
    }
    if ($LASTEXITCODE -ne 0) { Write-Host $out; throw "Falha ao criar app Amplify." }
    $AppId = ($out | ConvertFrom-Json).app.appId
}
$branchExists = $false
$branches = & $Awsexe amplify list-branches --app-id $AppId --region $AwsRegion --query "branches[?branchName=='main'].branchName" --output text 2>$null
if ($branches -and $branches.Trim() -eq "main") { $branchExists = $true }
if (-not $branchExists) {
    & $Awsexe amplify create-branch --app-id $AppId --branch-name main --stage PRODUCTION --enable-auto-build --region $AwsRegion 2>$null | Out-Null
}
$AmplifyUrl = "https://main.$AppId.amplifyapp.com"
Write-Host "      App $AppId, URL $AmplifyUrl" -ForegroundColor Green

# --- 5. App Runner ---
Write-Host ""
Write-Host "[5/8] App Runner (sigeo-api)..." -ForegroundColor Cyan
$JwtSecret = New-RandomHex
$JwtRefresh = New-RandomHex
$EnvVars = @{
    NODE_ENV = "production"
    PORT = "3000"
    DB_HOST = $DbEndpoint
    DB_PORT = "5432"
    DB_USER = "postgres"
    DB_PASSWORD = $DbPassword
    DB_NAME = "sigeo"
    JWT_SECRET = $JwtSecret
    JWT_REFRESH_SECRET = $JwtRefresh
    CORS_ORIGIN = $AmplifyUrl
}
$ServiceName = "sigeo-api"
$svc = & $Awsexe apprunner list-services --region $AwsRegion --query "ServiceSummaryList[?ServiceName=='$ServiceName']" --output json 2>$null | ConvertFrom-Json
$SvcArn = $null
if ($svc -and $svc.Count -gt 0) {
    $SvcArn = $svc[0].ServiceArn
    Write-Host "      Servico ja existe. Atualizando imagem e env..." -ForegroundColor Gray
    $cfg = @{
        SourceConfiguration = @{
            AuthenticationConfiguration = @{ AccessRoleArn = $RoleArn }
            ImageRepository = @{
                ImageIdentifier = $ImageUri
                ImageRepositoryType = "ECR"
                ImageConfiguration = @{
                    Port = "3000"
                    RuntimeEnvironmentVariables = $EnvVars
                }
            }
        }
    }
    $cfgFile = Join-Path $Env:TEMP "sigeo-apprunner-update-$(Get-Random).json"
    $cfg | ConvertTo-Json -Depth 10 | Set-Content -Path $cfgFile -Encoding UTF8 -NoNewline
    $cfgPath = (Resolve-Path $cfgFile).Path -replace '\\', '/'
    & $Awsexe apprunner update-service --service-arn $SvcArn --source-configuration "file:///$cfgPath" --region $AwsRegion 2>$null | Out-Null
    Remove-Item $cfgFile -Force -ErrorAction SilentlyContinue
} else {
    $cfg = @{
        ServiceName = $ServiceName
        SourceConfiguration = @{
            AuthenticationConfiguration = @{ AccessRoleArn = $RoleArn }
            ImageRepository = @{
                ImageIdentifier = $ImageUri
                ImageRepositoryType = "ECR"
                ImageConfiguration = @{
                    Port = "3000"
                    RuntimeEnvironmentVariables = $EnvVars
                }
            }
        }
        InstanceConfiguration = @{ Cpu = "1024"; Memory = "2048" }
    }
    $cfgFile = Join-Path $Root "scripts\ar-create.json"
    $jsonStr = $cfg | ConvertTo-Json -Depth 10 -Compress
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($cfgFile, $jsonStr, $utf8NoBom)
    $cfgPath = "file://" + ($cfgFile -replace '\\', '/')
    $out = & $Awsexe apprunner create-service --cli-input-json $cfgPath --region $AwsRegion --output json 2>&1
    Remove-Item $cfgFile -Force -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        Write-Host $out
        if ($out -match "SubscriptionRequiredException") {
            throw "App Runner exige assinatura/habilitacao na conta. No Console AWS: App Runner > Get started (ou habilite o servico)."
        }
        throw "Falha ao criar App Runner. Verifique se a imagem ECR existe (rode deploy-aws.ps1)."
    }
    $SvcArn = ($out | ConvertFrom-Json).Service.ServiceArn
}
Write-Host "      Aguardando deploy (~3 min)..." -ForegroundColor Gray
$max = 40
$n = 0
do {
    Start-Sleep -Seconds 15
    $s = & $Awsexe apprunner describe-service --service-arn $SvcArn --region $AwsRegion --query "Service.Status" --output text 2>$null
    $n++
    if ($s -eq "RUNNING") { break }
    if ($s -eq "CREATE_FAILED" -or $s -eq "OPERATION_IN_PROGRESS") { }
} while ($n -lt $max)
$SvcUrl = (& $Awsexe apprunner describe-service --service-arn $SvcArn --region $AwsRegion --query "Service.ServiceUrl" --output text 2>$null).Trim()
$AppRunnerUrl = "https://$SvcUrl"
Write-Host "      URL: $AppRunnerUrl" -ForegroundColor Green

# --- 6. Amplify env VITE_API_URL ---
Write-Host ""
Write-Host "[6/8] Amplify env VITE_API_URL..." -ForegroundColor Cyan
& $Awsexe amplify update-branch --app-id $AppId --branch-name main --environment-variables "VITE_API_URL=$AppRunnerUrl" --region $AwsRegion 2>$null | Out-Null
Write-Host "      OK." -ForegroundColor Green

# --- 7. GitHub secret APP_RUNNER_SERVICE_ARN ---
Write-Host ""
Write-Host "[7/8] GitHub secret APP_RUNNER_SERVICE_ARN..." -ForegroundColor Cyan
$SvcArn | & gh secret set APP_RUNNER_SERVICE_ARN --repo $GhRepo 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "      OK." -ForegroundColor Green } else { Write-Host "      Falha (gh). Configure manualmente." -ForegroundColor Yellow }

# --- 8. Bootstrap DB (sync + seed) ---
if (-not $SkipBootstrap) {
    Write-Host ""
    Write-Host "[8/8] Bootstrap RDS (sync + seed)..." -ForegroundColor Cyan
    $env:DB_HOST = $DbEndpoint
    $env:DB_PORT = "5432"
    $env:DB_USER = "postgres"
    $env:DB_PASSWORD = $DbPassword
    $env:DB_NAME = "sigeo"
    Push-Location $Root
    pnpm --filter @sigeo/api db:bootstrap 2>$null
    $bootOk = $LASTEXITCODE -eq 0
    Pop-Location
    if ($bootOk) { Write-Host "      OK." -ForegroundColor Green } else { Write-Host "      Falha. Rode: `$env:DB_HOST='$DbEndpoint'; `$env:DB_PASSWORD='...'; pnpm --filter @sigeo/api db:bootstrap" -ForegroundColor Yellow }
} else {
    Write-Host ""
    Write-Host "[8/8] Bootstrap ignorado (-SkipBootstrap)." -ForegroundColor Gray
}

$ErrorActionPreference = $PrevErr

Write-Host ""
Write-Host "=== Concluido ===" -ForegroundColor Green
Write-Host "Amplify:  $AmplifyUrl" -ForegroundColor White
Write-Host "API:      $AppRunnerUrl" -ForegroundColor White
Write-Host "RDS:      $DbEndpoint (user postgres, DB sigeo)" -ForegroundColor White
Write-Host "Login:    admin@sigeo.local / admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "Proximo: trigger deploy Amplify (push em main ou Redeploy no console) para aplicar VITE_API_URL." -ForegroundColor Gray
