# Altera a senha do banco RDS e atualiza o SSM para migrações e API.
# Requer: AWS CLI configurado e permissões para RDS + SSM.
#
# Uso: .\scripts\change-db-password.ps1
#      .\scripts\change-db-password.ps1 -NewPassword "SuaSenhaSegura123!"

param(
    [string]$NewPassword = "",
    [string]$DbInstanceId = "sigeo-db",
    [string]$Region = "sa-east-1",
    [string]$SsmParamName = "/sigeo/db-password"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not $NewPassword) {
    $sec = Read-Host "Nova senha do postgres (RDS)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    try {
        $NewPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    } finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    }
}

if ([string]::IsNullOrWhiteSpace($NewPassword)) {
    Write-Host "Senha vazia. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host "Instancia RDS: $DbInstanceId | Regiao: $Region" -ForegroundColor Cyan
Write-Host ""

# 1) Alterar senha no RDS (master user postgres)
Write-Host "1/2 Alterando senha no RDS..." -ForegroundColor Cyan
try {
    aws rds modify-db-instance `
        --db-instance-identifier $DbInstanceId `
        --master-user-password $NewPassword `
        --apply-immediately `
        --region $Region 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "aws rds modify-db-instance falhou"
    }
    Write-Host "    RDS: senha alterada. Pode levar 1-2 min para aplicar." -ForegroundColor Green
} catch {
    Write-Host "    AVISO: Nao foi possivel alterar no RDS. Verifique o identifier (ex: $DbInstanceId) e permissoes." -ForegroundColor Yellow
    Write-Host "    Voce pode alterar manualmente no Console AWS: RDS > Instancia > Modify > Master password." -ForegroundColor Yellow
}

# 2) Atualizar SSM (para run-migrations-prod.ps1 e API)
Write-Host "2/2 Atualizando SSM ($SsmParamName)..." -ForegroundColor Cyan
try {
    aws ssm put-parameter `
        --name $SsmParamName `
        --value $NewPassword `
        --type SecureString `
        --overwrite `
        --region $Region | Out-Null
    Write-Host "    SSM: parametro atualizado." -ForegroundColor Green
} catch {
    Write-Host "    Erro ao atualizar SSM: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Concluido." -ForegroundColor Green
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "  1. Se alterou no RDS: aguarde 1-2 min e rode: .\scripts\run-migrations-prod.ps1" -ForegroundColor White
Write-Host "  2. Reiniciar API para usar a nova senha: .\scripts\restart-api-after-password.ps1" -ForegroundColor White
