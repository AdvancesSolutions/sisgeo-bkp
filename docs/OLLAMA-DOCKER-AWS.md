# Ollama com LLaVA na AWS (Docker)

## 1. Instância EC2

Para rodar o modelo LLaVA com performance aceitável:

- **GPU:** Use instâncias **G4dn** (ex: `g4dn.xlarge`) ou **G4ad** para melhor custo/benefício
- **CPU:** Mínimo `t3.medium` (sem GPU, mais lento)

## 2. Docker Compose (Ollama)

Crie `docker-compose.ollama.yml`:

```yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

volumes:
  ollama_data:
```

Para instâncias **sem GPU**, remova o bloco `deploy.resources`.

## 3. Script de inicialização

```bash
#!/bin/bash
# setup-ollama.sh - Executar na EC2

# Instalar Docker (se necessário)
# sudo yum install -y docker
# sudo systemctl start docker
# sudo usermod -aG docker $USER

# Instalar NVIDIA Container Toolkit (apenas para GPU)
# https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html

docker pull ollama/ollama:latest
docker run -d --name ollama -p 11434:11434 -v ollama_data:/root/.ollama ollama/ollama

# Aguardar serviço subir
sleep 5

# Pull do modelo LLaVA
docker exec ollama ollama pull llava

echo "Ollama pronto em http://localhost:11434"
```

## 4. Variáveis de ambiente (API SIGEO)

Na API, configure:

```env
OLLAMA_URL=http://localhost:11434
# Se Ollama estiver em outro host:
# OLLAMA_URL=http://ip-da-ec2:11434
```

## 5. Segurança

- Restrinja a porta 11434 apenas à rede interna (Security Group)
- Não exponha Ollama diretamente à internet
- A API deve estar na mesma VPC ou ter acesso à EC2 do Ollama
