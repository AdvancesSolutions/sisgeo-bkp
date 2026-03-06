# SISGEO - Sincronização de Ambientes
# Menu interativo para sincronizar Local ↔ AWS

param(
    [ValidateSet("aws-to-local", "local-to-aws", "status", "")]
    [string]$Action = ""
)

$ErrorActionPreference = "Stop"

function Show-Menu {
    Clear-Host
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║         SISGEO - Sincronização de Ambientes               ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. 📥 AWS → Local    (Baixar dados de produção)" -ForegroundColor Green
    Write-Host "  2. 📤 Local → AWS    (Enviar dados para produção)" -ForegroundColor Yellow
    Write-Host "  3. 📊 Status         (Comparar ambientes)" -ForegroundColor Blue
    Write-Host "  4. ❌ Sair" -ForegroundColor Gray
    Write-Host ""
}

function Get-DatabaseStats {
    param(
        [string]$Host,
        [string]$User,
        [string]$Database,
        [string]$Password,
        [int]$Port = 5432,
        [bool]$IsLocal = $false
    )
    
    try {
        if ($IsLocal) {
            $pgContainer = docker ps --filter "name=postgres" --format "{{.Names}}" 2>$null
            if (!$pgContainer) { return "Parado" }
            $result = docker exec -e PGPASSWORD=$Password $pgContainer psql -h localhost -U $User -d $Database -t -c "SELECT COUNT(*) FROM users;" 2>$null
        } else {
            $result = docker run --rm -e PGPASSWORD="$Password" postgres:15-alpine psql -h "$Host" -U "$User" -d "$Database" -p "$Port" -t -c "SELECT COUNT(*) FROM users;" 2>$null
        }
        
        if ($LASTEXITCODE -eq 0) {
            return $result.Trim()
        }
        return "N/A"
    } catch {
        return "Erro"
    }
}

function Show-Status {
    Write-Host ""
    Write-Host "📊 Status dos Ambientes" -ForegroundColor Cyan
    Write-Host "═══════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Local
    Write-Host "🏠 Local (PostgreSQL Docker):" -ForegroundColor Green
    $localRunning = docker ps --filter "name=postgres" --format "{{.Names}}" 2>$null
    if ($localRunning) {
        Write-Host "   Status: ✅ Rodando" -ForegroundColor Green
        $localUsers = Get-DatabaseStats -Host "localhost" -User "postgres" -Database "sigeo" -Password "postgres" -IsLocal $true
        Write-Host "   Usuários: $localUsers" -ForegroundColor White
    } else {
        Write-Host "   Status: ❌ Parado" -ForegroundColor Red
    }
    Write-Host ""
    
    # AWS
    Write-Host "☁️  AWS (RDS PostgreSQL):" -ForegroundColor Blue
    Write-Host "   Host: sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com" -ForegroundColor White
    Write-Host "   Status: Requer senha para verificar" -ForegroundColor Yellow
    Write-Host ""
    
    # Backups
    $backupPath = Join-Path $PSScriptRoot "..\backups"
    if (Test-Path $backupPath) {
        $backups = Get-ChildItem $backupPath -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 5
        if ($backups) {
            Write-Host "💾 Últimos backups:" -ForegroundColor Magenta
            foreach ($backup in $backups) {
                $size = [math]::Round($backup.Length / 1MB, 2)
                Write-Host "   - $($backup.Name) ($size MB) - $($backup.LastWriteTime)" -ForegroundColor Gray
            }
        }
    }
    Write-Host ""
}

# Menu principal
if ($Action -eq "") {
    while ($true) {
        Show-Menu
        $choice = Read-Host "Escolha uma opção"
        
        switch ($choice) {
            "1" {
                Write-Host ""
                & "$PSScriptRoot\sync-aws-to-local.ps1"
                Write-Host ""
                Read-Host "Pressione Enter para continuar"
            }
            "2" {
                Write-Host ""
                Write-Host "⚠️  ATENÇÃO: Isso irá sobrescrever dados de PRODUÇÃO!" -ForegroundColor Red
                $confirm = Read-Host "Tem certeza? (s/N)"
                if ($confirm -eq "s" -or $confirm -eq "S") {
                    & "$PSScriptRoot\sync-local-to-aws.ps1"
                } else {
                    Write-Host "❌ Cancelado" -ForegroundColor Yellow
                }
                Write-Host ""
                Read-Host "Pressione Enter para continuar"
            }
            "3" {
                Show-Status
                Read-Host "Pressione Enter para continuar"
            }
            "4" {
                Write-Host ""
                Write-Host "👋 Até logo!" -ForegroundColor Cyan
                exit 0
            }
            default {
                Write-Host ""
                Write-Host "❌ Opção inválida" -ForegroundColor Red
                Start-Sleep -Seconds 1
            }
        }
    }
} else {
    # Modo direto (via parâmetro)
    switch ($Action) {
        "aws-to-local" {
            & "$PSScriptRoot\sync-aws-to-local.ps1"
        }
        "local-to-aws" {
            & "$PSScriptRoot\sync-local-to-aws.ps1"
        }
        "status" {
            Show-Status
        }
    }
}
