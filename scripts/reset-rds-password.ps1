# Reseta senha do RDS PostgreSQL

param(
    [string]$NewPassword = $null
)

$ErrorActionPreference = "Stop"
$DB_INSTANCE = "sigeo-db"

Write-Host "Reset de Senha RDS PostgreSQL" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Gerar senha se nao fornecida
if (!$NewPassword) {
    $NewPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 16 | ForEach-Object {[char]$_})
    $NewPassword += "!@#"
    Write-Host "Senha gerada automaticamente" -ForegroundColor Yellow
}

Write-Host "Nova senha: $NewPassword" -ForegroundColor White
Write-Host ""
Write-Host "ATENCAO: Isso ira resetar a senha do RDS em producao!" -ForegroundColor Red
$confirm = Read-Host "Digite 'SIM' para confirmar"

if ($confirm -ne "SIM") {
    Write-Host "Cancelado" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Modificando senha do RDS..." -ForegroundColor Yellow

aws rds modify-db-instance `
    --db-instance-identifier $DB_INSTANCE `
    --master-user-password "$NewPassword" `
    --apply-immediately

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "Senha resetada com sucesso!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Salve estas informacoes:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Host:     sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com" -ForegroundColor White
    Write-Host "  Database: sigeo" -ForegroundColor White
    Write-Host "  User:     postgres" -ForegroundColor White
    Write-Host "  Password: $NewPassword" -ForegroundColor White
    Write-Host ""
    
    # Copiar para clipboard
    try {
        $NewPassword | Set-Clipboard
        Write-Host "Senha copiada para area de transferencia" -ForegroundColor Green
    } catch {}
    
    Write-Host ""
    Write-Host "Aguarde 2-3 minutos para a senha ser aplicada" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Aguardar aplicacao da senha" -ForegroundColor White
    Write-Host "  2. Atualizar variaveis de ambiente da API em producao" -ForegroundColor White
    Write-Host "  3. Reiniciar API (App Runner/ECS)" -ForegroundColor White
    Write-Host "  4. Testar sincronizacao: .\sync-aws-to-local.ps1" -ForegroundColor White
    Write-Host ""
    
    # Salvar em arquivo
    $credFile = Join-Path $PSScriptRoot "..\backups\rds-credentials.txt"
    $credContent = @"
RDS Credentials - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
================================================
Host:     sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com
Database: sigeo
User:     postgres
Password: $NewPassword
"@
    $credContent | Out-File -FilePath $credFile -Encoding UTF8
    
    Write-Host "Credenciais salvas em: backups\rds-credentials.txt" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "Erro ao resetar senha" -ForegroundColor Red
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "  - AWS CLI configurado (aws configure)" -ForegroundColor White
    Write-Host "  - Permissoes IAM (rds:ModifyDBInstance)" -ForegroundColor White
    Write-Host "  - Nome da instancia: $DB_INSTANCE" -ForegroundColor White
    exit 1
}
