#!/bin/bash
# Script para aplicar a infraestrutura Terraform
# Uso: ./infra/scripts/deploy-infra.sh [plan|apply|destroy]

set -e
cd "$(dirname "$0")/../terraform"

ACTION="${1:-plan}"

if [[ "$ACTION" == "apply" ]]; then
  echo "Aplicando infraestrutura..."
  terraform apply -var-file=terraform.tfvars -auto-approve
elif [[ "$ACTION" == "destroy" ]]; then
  echo "Destruindo infraestrutura..."
  terraform destroy -var-file=terraform.tfvars -auto-approve
else
  echo "Planejando alterações..."
  terraform plan -var-file=terraform.tfvars
fi
