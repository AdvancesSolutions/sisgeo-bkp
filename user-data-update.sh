#!/bin/bash
# User Data Script - Atualização de container SIGEO

# Log de execução
exec > >(tee /var/log/user-data-update.log)
exec 2>&1

echo "=== Iniciando atualização do container SIGEO - $(date) ==="

# Parar containers existentes
echo "Parando containers..."
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Login no ECR
echo "Fazendo login no ECR..."
aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin 320674390105.dkr.ecr.sa-east-1.amazonaws.com

# Pull da imagem mais recente
echo "Baixando imagem..."
docker pull 320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest

# Iniciar container com credenciais corretas
echo "Iniciando container..."
docker run -d \
  --name sigeo-api \
  --restart always \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=SigeoNewPass123! \
  -e DB_NAME=sigeo \
  -e JWT_SECRET=a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede \
  -e JWT_REFRESH_SECRET=657c436814463e82fba56e0767166c75420ee3c8ee070f80f514fa7fb3fa07e5 \
  -e CORS_ORIGIN=https://sigeo.advances.com.br \
  320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest

# Aguardar inicialização
sleep 10

# Verificação
echo "Verificando status..."
docker ps
docker logs sigeo-api 2>&1 | tail -30

echo "=== Atualização concluída - $(date) ==="
