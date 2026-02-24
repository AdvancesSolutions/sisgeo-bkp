# Recupera senha do RDS do AWS Parameter Store ou Secrets Manager

$ErrorActionPreference = "Stop"

Write-Host "🔐 Recuperando senha do RDS..." -ForegroundColor Cyan
Write-Host ""

# Tentar Parameter Store
Write-Host "Tentando AWS Systems Manager Parameter Store..." -ForegroundColor Yellow
$paramNames = @(
    "/sigeo/db/password",
    "/sigeo/rds/password",
    "/sigeo/database/password",
    "sigeo-db-password"
)

foreach ($paramName in $paramNames) {
    try {
        $password = aws ssm get-parameter --name $paramName --with-decryption --query Parameter.Value --output text 2>$null
        if ($LASTEXITCODE -eq 0 -and $password) {
            Write-Host "✅ Senha encontrada em Parameter Store: $paramName" -ForegroundColor Green
            Write-Host ""
            Write-Host "Senha: $password" -ForegroundColor White
            Write-Host ""
            
            # Copiar para clipboard se disponível
            try {
                $password | Set-Clipboard
                Write-Host "📋 Senha copiada para área de transferência" -ForegroundColor Green
            } catch {
                # Clipboard não disponível
            }
            
            exit 0
        }
    } catch {
        # Continuar tentando
    }
}

# Tentar Secrets Manager
Write-Host "Tentando AWS Secrets Manager..." -ForegroundColor Yellow
$secretNames = @(
    "sigeo/db",
    "sigeo-db-credentials",
    "rds/sigeo"
)

foreach ($secretName in $secretNames) {
    try {
        $secret = aws secretsmanager get-secret-value --secret-id $secretName --query SecretString --output text 2>$null
        if ($LASTEXITCODE -eq 0 -and $secret) {
            Write-Host "✅ Credenciais encontradas em Secrets Manager: $secretName" -ForegroundColor Green
            Write-Host ""
            
            # Parse JSON
            $secretObj = $secret | ConvertFrom-Json
            if ($secretObj.password) {
                Write-Host "Senha: $($secretObj.password)" -ForegroundColor White
                Write-Host ""
                
                try {
                    $secretObj.password | Set-Clipboard
                    Write-Host "📋 Senha copiada para área de transferência" -ForegroundColor Green
                } catch {}
                
                exit 0
            }
        }
    } catch {
        # Continuar tentando
    }
}

# Não encontrou
Write-Host ""
Write-Host "❌ Senha não encontrada automaticamente" -ForegroundColor Red
Write-Host ""
Write-Host "Opções:" -ForegroundColor Yellow
Write-Host "  1. Verificar AWS Console > RDS > sigeo-db" -ForegroundColor White
Write-Host "  2. Verificar AWS Console > Systems Manager > Parameter Store" -ForegroundColor White
Write-Host "  3. Verificar AWS Console > Secrets Manager" -ForegroundColor White
Write-Host "  4. Resetar senha do RDS (se necessário)" -ForegroundColor White
Write-Host ""
Write-Host "Para resetar senha:" -ForegroundColor Yellow
Write-Host "  aws rds modify-db-instance --db-instance-identifier sigeo-db --master-user-password NOVA_SENHA --apply-immediately" -ForegroundColor Gray
Write-Host ""

exit 1
