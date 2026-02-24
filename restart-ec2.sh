#!/bin/bash
echo "Parando containers..."
docker stop $(docker ps -q) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null

echo "Iniciando novo container..."
docker run -d --name sigeo-api --restart always -p 3000:3000 \
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

sleep 5
docker ps
docker logs sigeo-api 2>&1 | tail -10
