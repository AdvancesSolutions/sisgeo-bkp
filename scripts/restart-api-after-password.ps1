# Reinicia a API em producao para carregar a nova senha do SSM.
# Rode DEPOIS de .\scripts\change-db-password.ps1
#
# Uso: .\scripts\restart-api-after-password.ps1
#      .\scripts\restart-api-after-password.ps1 -Target ECS   # so ECS
#      .\scripts\restart-api-after-password.ps1 -Target EC2   # so EC2 via SSM

param(
    [ValidateSet("ECS", "EC2", "AppRunner", "Auto")]
    [string]$Target = "Auto",
    [string]$Region = "sa-east-1"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$restarted = $false

# --- ECS: force new deployment (novas tasks leem secrets do SSM ao subir)
function Restart-ECS {
    $cluster = "sigeo-cluster"
    $service = "sigeo-api"
    Write-Host "Reiniciando ECS: cluster=$cluster service=$service..." -ForegroundColor Cyan
    $out = aws ecs update-service --cluster $cluster --service $service --force-new-deployment --region $Region 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  AVISO: $out" -ForegroundColor Yellow
        return $false
    }
    Write-Host "  Deploy acionado. Aguarde 1-2 min." -ForegroundColor Green
    return $true
}

# --- EC2: envia comando para a propria instancia buscar senha no SSM e reiniciar o container
function Restart-EC2 {
    $instanceId = "i-0f73ae1ae2361763e"
    $ecrUri = "320674390105.dkr.ecr.$Region.amazonaws.com/sigeo-api"
    $dbHost = "sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"
    # A instancia EC2 precisa de IAM role com ssm:GetParameter para ler a senha
    $paramsJson = @{
        commands = @(
            "DB_PASSWORD=$(aws ssm get-parameter --name /sigeo/db-password --with-decryption --query Parameter.Value --output text --region $Region)",
            "docker ps -q -f name=sigeo-api | xargs -r docker stop || true",
            "sleep 3",
            "docker pull $ecrUri`:latest",
            "docker run -d --restart always --name sigeo-api -p 3000:3000 -e NODE_ENV=production -e PORT=3000 -e DB_HOST=$dbHost -e DB_PORT=5432 -e DB_USER=postgres -e DB_NAME=sigeo -e DB_PASSWORD=`$DB_PASSWORD $ecrUri`:latest"
        )
    } | ConvertTo-Json -Depth 2 -Compress
    Write-Host "Enviando comando SSM para EC2 $instanceId..." -ForegroundColor Cyan
    aws ssm send-command --document-name "AWS-RunShellScript" --instance-ids $instanceId --region $Region --parameters $paramsJson --output text --query "Command.CommandId" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Falha ao enviar comando. Verifique instance-id e IAM role da EC2 (acesso SSM)." -ForegroundColor Yellow
        return $false
    }
    Write-Host "  Comando enviado. Aguarde ~30 s para o container subir." -ForegroundColor Green
    return $true
}

# --- App Runner: e preciso atualizar o servico com as env vars de novo (incluindo DB do SSM)
function Restart-AppRunner {
    $passParam = "/sigeo/db-password"
    $dbPass = aws ssm get-parameter --name $passParam --with-decryption --query "Parameter.Value" --output text --region $Region 2>$null
    if (-not $dbPass) {
        Write-Host "  Nao foi possivel ler $passParam. Rode deploy-aws-full.ps1 com -DbPassword (senha atual) para atualizar o App Runner." -ForegroundColor Yellow
        return $false
    }
    Write-Host "App Runner: para aplicar a nova senha, atualize o servico com as env vars." -ForegroundColor Cyan
    Write-Host "  Opcao: .\scripts\deploy-aws-full.ps1 -DbPassword (senha_atual_do_SSM)" -ForegroundColor White
    Write-Host "  Ou no Console AWS: App Runner > sigeo-api > Modify > Environment variables > DB_PASSWORD." -ForegroundColor White
    return $false
}

# --- Detecta ou executa o alvo
if ($Target -eq "Auto") {
    $ecs = aws ecs describe-services --cluster sigeo-cluster --services sigeo-api --region $Region --query "services[0].serviceName" --output text 2>$null
    if ($ecs -eq "sigeo-api") {
        $restarted = Restart-ECS
    } else {
        $ar = aws apprunner list-services --region $Region --query "ServiceSummaryList[?ServiceName=='sigeo-api'].ServiceName" --output text 2>$null
        if ($ar -eq "sigeo-api") {
            Restart-AppRunner
        } else {
            Write-Host "Tentando ECS..." -ForegroundColor Gray
            $restarted = Restart-ECS
            if (-not $restarted) {
                Write-Host "Tentando EC2..." -ForegroundColor Gray
                $restarted = Restart-EC2
            }
        }
    }
} elseif ($Target -eq "ECS") {
    $restarted = Restart-ECS
} elseif ($Target -eq "EC2") {
    $restarted = Restart-EC2
} elseif ($Target -eq "AppRunner") {
    Restart-AppRunner
}

if ($restarted) {
    Write-Host ""
    Write-Host "Concluido. Teste: https://sigeo.advances.com.br ou endpoint /health da API." -ForegroundColor Green
}
