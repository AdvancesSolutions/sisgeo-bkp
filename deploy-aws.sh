#!/bin/bash
# Deploy SISGEO para AWS - AppRunner

set -e

AWS_REGION="${1:-sa-east-1}"
ECR_REPO="sigeo-api"

echo "=== DEPLOY SISGEO para AWS ==="
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Account: $ACCOUNT_ID | Region: $AWS_REGION | Repo: $ECR_REPO"
echo ""

# 1. ECR Repository
echo "[1/5] Configurando ECR Repository..."
if aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION 2>/dev/null | grep -q repositoryArn; then
    echo "      OK - Repositorio ja existe"
else
    echo "      Criando repositorio..."
    aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION --image-scan-on-push
    echo "      OK - Repositorio criado"
fi

# 2. ECR Login
echo ""
echo "[2/5] Login ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
echo "      OK - Login realizado"

# 3. Build
echo ""
echo "[3/5] Build Docker..."
REGISTRY="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
IMAGE_URI="$REGISTRY/$ECR_REPO:latest"
cd task-management-api
docker build -t $ECR_REPO:latest .
echo "      OK - Build concluido"

# 4. Tag
echo ""
echo "[4/5] Tagging..."
docker tag $ECR_REPO:latest $IMAGE_URI
echo "      OK - Tag: $IMAGE_URI"

# 5. Push
echo ""
echo "[5/5] Push ECR..."
docker push $IMAGE_URI
echo "      OK - Push concluido"

echo ""
echo "=== Deploy preparado com sucesso! ==="
echo ""
echo "Proximas acoes:"
echo "1. Criar App Runner Service"
echo "2. Deploy Frontend"
echo ""
echo "Image URI: $IMAGE_URI"
echo ""

cd ..
