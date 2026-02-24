#!/bin/bash
# Deploy da API para AWS (ECR + ECS)
# Uso: ./scripts/deploy.sh
# Requer: AWS CLI, Docker, variáveis de ambiente ou aws configure

set -e
cd "$(dirname "$0")/.."

REGION="${AWS_REGION:-sa-east-1}"
ECR_REPO="${ECR_REPO:-sigeo-api}"
CLUSTER="${ECS_CLUSTER:-sigeo-cluster}"
SERVICE="${ECS_SERVICE:-sigeo-api}"

echo "=== Build da imagem ==="
docker build -f apps/api/Dockerfile -t "$ECR_REPO:latest" .

echo "=== Login ECR ==="
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_URI"

echo "=== Tag e push ==="
docker tag "$ECR_REPO:latest" "$ECR_URI:latest"
docker push "$ECR_URI:latest"

echo "=== Force new deployment ECS ==="
aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" --force-new-deployment --region "$REGION"

echo "=== Deploy concluído ==="
