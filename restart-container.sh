#!/bin/bash
# Script para reiniciar container SIGEO API no EC2
# Execute este script DENTRO da instância EC2 via SSH

echo "╔════════════════════════════════════════════════════════╗"
echo "║  REINICIANDO SIGEO API COM CONFIGURAÇÃO CORRETA       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Parar e remover containers antigos
echo "1. Parando containers antigos..."
docker stop $(docker ps -q) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null
echo "   ✓ Containers removidos"
echo ""

# Pull da imagem mais recente
echo "2. Baixando imagem atualizada..."
aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin 320674390105.dkr.ecr.sa-east-1.amazonaws.com
docker pull 320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest
echo "   ✓ Imagem baixada"
echo ""

# Iniciar novo container
echo "3. Iniciando novo container..."
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
  -e CORS_ORIGIN=https://sigeo.advances.com.br,https://main.da1hucc7ed5a9.amplifyapp.com \
  320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest

CONTAINER_ID=$(docker ps -q -f name=sigeo-api)
echo "   ✓ Container iniciado: $CONTAINER_ID"
echo ""

# Aguardar inicialização
echo "4. Aguardando inicialização (10 segundos)..."
sleep 10
echo ""

# Verificar status
echo "5. Status do container:"
docker ps -f name=sigeo-api
echo ""

# Mostrar logs
echo "6. Últimas linhas do log:"
docker logs sigeo-api 2>&1 | tail -20
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CONTAINER REINICIADO!                                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Teste em: https://sigeo.advances.com.br"
echo "Email: admin@empresa.com"
echo "Senha: admin123"
