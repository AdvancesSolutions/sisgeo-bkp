# Sobe Postgres (Docker) e inicia API + Web. Rode `pnpm run db:seed` uma vez apos o primeiro start da API.
Set-Location $PSScriptRoot\..

$pg = docker compose ps -q db 2>$null
if (-not $pg) {
    Write-Host "Subindo Postgres (db)..."
    docker compose up -d db redis
    Start-Sleep -Seconds 5
}

Write-Host "Iniciando API e Web..."
pnpm run dev
