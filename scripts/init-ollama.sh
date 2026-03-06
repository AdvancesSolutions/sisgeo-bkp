#!/bin/sh
set -e

OLLAMA_HOST="${OLLAMA_HOST:-http://ollama:11434}"
export OLLAMA_HOST

echo "[init-ollama] Aguardando serviço Ollama em $OLLAMA_HOST..."

# Poll até o Ollama responder (ollama list conecta à API)
for i in $(seq 1 60); do
  if ollama list 2>/dev/null; then
    echo "[init-ollama] Ollama online."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "[init-ollama] Timeout: Ollama não respondeu em 120s."
    exit 1
  fi
  sleep 2
done

echo "[init-ollama] Baixando modelo llava..."
ollama pull llava

echo "[init-ollama] Modelo llava instalado com sucesso."
