#!/usr/bin/env bash
# Pre-flight check: valida se todas as variáveis necessárias para o deploy estão definidas.
# Uso: ./scripts/check-deploy-secrets.sh
# Ou com arquivo: ENV_FILE=.env.production ./scripts/check-deploy-secrets.sh

set -e

ENV_FILE="${ENV_FILE:-.env.production}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_PATH="$ROOT_DIR/$ENV_FILE"

# Secrets críticos para o job build-and-deploy (erro 254 se ausentes)
REQUIRED_BUILD_DEPLOY=(
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  AWS_REGION
  ECR_REPO
  CLUSTER_NAME
  SERVICE_NAME
)

# Secrets para o job migrate
REQUIRED_MIGRATE=(
  SSM_DB_PASSWORD_PARAM
  DB_HOST
  DB_USER
  DB_NAME
)

get_var() {
  local key="$1"
  if [[ -f "$ENV_PATH" ]]; then
    grep -E "^${key}=" "$ENV_PATH" 2>/dev/null | cut -d= -f2- | tr -d '"'"'"' | xargs || true
  else
    echo ""
  fi
}

missing=()
if [[ -f "$ENV_PATH" ]]; then
  echo "Validando $ENV_FILE..."
  for key in "${REQUIRED_BUILD_DEPLOY[@]}" "${REQUIRED_MIGRATE[@]}"; do
    val=$(get_var "$key")
    if [[ -z "$val" ]]; then
      missing+=("$key")
    fi
  done
else
  echo "Arquivo $ENV_PATH não encontrado."
  echo "Crie a partir de env.production.example e preencha os valores."
  exit 1
fi

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Variáveis ausentes ou vazias: ${missing[*]}"
  echo "Adicione ao $ENV_FILE e rode sync-env-to-github-secrets para configurar no GitHub."
  exit 1
fi

echo "✓ Todas as variáveis obrigatórias estão definidas em $ENV_FILE"
