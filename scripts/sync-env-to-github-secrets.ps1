# Sincroniza variáveis de um arquivo .env para GitHub Secrets via gh CLI.
#
# Uso:
#   .\scripts\sync-env-to-github-secrets.ps1
#   .\scripts\sync-env-to-github-secrets.ps1 -EnvFile .env.production
#   .\scripts\sync-env-to-github-secrets.ps1 -EnvFile apps\api\.env.production
#
# Requer: gh CLI instalado e autenticado (gh auth login)
# O arquivo .env.production deve existir e conter chaves no formato KEY=valor

param(
    [string]$EnvFile = ".env.production",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path (Join-Path $scriptDir "..")
$envPath = Join-Path $rootDir $EnvFile

if (-not (Test-Path $envPath)) {
    Write-Host "Erro: arquivo nao encontrado: $envPath" -ForegroundColor Red
    Write-Host "Crie o arquivo a partir de env.production.example e preencha os valores." -ForegroundColor Yellow
    exit 1
}

# Verificar gh CLI
$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
    Write-Host "Erro: gh CLI nao encontrado. Instale em https://cli.github.com/" -ForegroundColor Red
    exit 1
}

$lines = Get-Content $envPath -Encoding UTF8
$count = 0
$failed = @()

foreach ($line in $lines) {
    $line = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
        continue
    }
    if ($line -notmatch "^([A-Za-z_][A-Za-z0-9_]*)=(.*)$") {
        continue
    }
    $key = $Matches[1]
    $value = $Matches[2].Trim()
    # Remover aspas externas se existirem
    if ($value.Length -ge 2) {
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2).Replace('\"', '"').Replace("\'", "'")
        }
    }
    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "  [PULADO] $key (valor vazio)" -ForegroundColor DarkGray
        continue
    }
    if ($DryRun) {
        Write-Host "  [DRY-RUN] $key = ***" -ForegroundColor Cyan
        $count++
        continue
    }
    try {
        $value | gh secret set $key 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] $key" -ForegroundColor Green
            $count++
        } else {
            $failed += $key
        }
    } catch {
        $failed += $key
        Write-Host "  [ERRO] $key - $_" -ForegroundColor Red
    }
}

Write-Host ""
if ($DryRun) {
    Write-Host "Dry-run: $count variaveis seriam configuradas." -ForegroundColor Cyan
} elseif ($failed.Count -gt 0) {
    Write-Host "Falhas: $($failed -join ', ')" -ForegroundColor Red
    exit 1
} else {
    Write-Host "Concluido: $count secrets configurados no GitHub." -ForegroundColor Green
}
