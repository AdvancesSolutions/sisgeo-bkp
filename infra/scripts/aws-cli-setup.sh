#!/bin/bash
# Script alternativo: provisiona infraestrutura via AWS CLI
# Use quando Terraform não for opção. Requer: aws cli, jq
# Região: sa-east-1

set -e
REGION="sa-east-1"
PROJECT="sigeo"
ENV="prod"

echo "=== Criando bucket S3 ==="
BUCKET="${PROJECT}-${ENV}-evidencias"
aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" 2>/dev/null || true
aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "=== Criando parâmetro SSM (db-password) ==="
aws ssm put-parameter --name "/${PROJECT}/db-password" --type SecureString --value "ALTERE_SUA_SENHA" --overwrite 2>/dev/null || true

echo "=== Concluído ==="
echo "Bucket: $BUCKET"
echo "Configure VPC, RDS e ECS manualmente ou use Terraform para o restante."
