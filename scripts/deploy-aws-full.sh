#!/bin/bash
# Deploy completo AWS: Terraform + API + Migrations
# Uso: ./scripts/deploy-aws-full.sh [apply|plan|destroy]

set -e
ACTION="${1:-apply}"

echo "=== SGO Deploy AWS ==="
echo "Ação: $ACTION"

# 1. Terraform
if [ "$ACTION" = "apply" ] || [ "$ACTION" = "plan" ]; then
  echo ">>> Terraform $ACTION..."
  cd infra/terraform
  terraform init
  terraform $ACTION -auto-approve
  cd ../..
fi

# 2. Migrations (se apply)
if [ "$ACTION" = "apply" ]; then
  echo ">>> Executando migrations..."
  pnpm --filter @sigeo/api db:bootstrap || true
fi

# 3. Build e push API (se apply)
if [ "$ACTION" = "apply" ]; then
  echo ">>> Build e push da API..."
  ECR_URI=$(terraform -chdir=infra/terraform output -raw ecr_repository_url 2>/dev/null || echo "")
  if [ -n "$ECR_URI" ]; then
    docker build -f apps/api/Dockerfile -t "$ECR_URI:latest" .
    docker push "$ECR_URI:latest"
    aws ecs update-service --cluster sigeo-cluster --service sigeo-api --force-new-deployment --region sa-east-1
  fi
fi

echo "=== Concluído ==="
