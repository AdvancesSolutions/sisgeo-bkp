#!/usr/bin/env bash
# Sincroniza variáveis de um arquivo .env para GitHub Secrets via gh CLI.
#
# Uso:
#   ./scripts/sync-env-to-github-secrets.sh
#   ./scripts/sync-env-to-github-secrets.sh .env.production
#
# Requer: gh CLI instalado e autenticado (gh auth login)
# O arquivo .env.production deve existir e conter chaves no formato KEY=valor

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${1:-.env.production}"
ENV_PATH="$ROOT_DIR/$ENV_FILE"

if [[ ! -f "$ENV_PATH" ]]; then
  echo "Erro: arquivo não encontrado: $ENV_PATH"
  echo "Crie o arquivo a partir de env.production.example e preencha os valores."
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "Erro: gh CLI não encontrado. Instale em https://cli.github.com/"
  exit 1
fi

count=0
failed=()

while IFS= read -r line; do
  line="${line%%#*}"
  line="${line%"${line##*[![:space:]]}"}"
  [[ -z "$line" ]] && continue
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    value="${value#\"}"
    value="${value%\"}"
    value="${value#\'}"
    value="${value%\'}"
    [[ -z "$value" ]] && continue
    if printf '%s' "$value" | gh secret set "$key" 2>/dev/null; then
      echo "  [OK] $key"
      ((count++))
    else
      failed+=("$key")
    fi
  fi
done < "$ENV_PATH"

echo ""
if [[ ${#failed[@]} -gt 0 ]]; then
  echo "Falhas: ${failed[*]}"
  exit 1
else
  echo "Concluído: $count secrets configurados no GitHub."
fi
