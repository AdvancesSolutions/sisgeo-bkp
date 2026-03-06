# Sobe db, redis, ollama, api. Use --minio para MinIO. Use --gpu em EC2 com NVIDIA.
param([switch]$Minio, [switch]$Gpu)
$env:COMPOSE_PROFILES = if ($Minio) { "minio" } else { "" }
$composeArgs = @("up", "-d")
if ($Gpu) { $composeArgs = @("-f", "docker-compose.yml", "-f", "docker-compose.gpu.yml") + $composeArgs }
& docker compose @composeArgs
Write-Host "Postgres: localhost:5432 | Redis: localhost:6379 | Ollama: localhost:11434 | API: http://localhost:3000"
