# Configuração AWS EC2 para SIGEO com Ollama (GPU)

Guia para preparar uma instância EC2 com GPU (família G4ad ou G5) e NVIDIA Container Toolkit, permitindo que o Docker utilize aceleração de hardware para o Ollama/LLaVA.

---

## 1. Escolha da Instância

| Família | Exemplo | GPU | Uso |
|---------|---------|-----|-----|
| **G4ad** | g4ad.xlarge | AMD Radeon Pro V520 | Melhor custo/benefício |
| **G4dn** | g4dn.xlarge | NVIDIA T4 | Boa compatibilidade |
| **G5** | g5.xlarge | NVIDIA A10G | Maior performance |

- **Região:** Verifique disponibilidade de instâncias GPU (ex: `us-east-1`, `sa-east-1`).
- **AMI:** Use Amazon Linux 2023 ou Ubuntu 22.04 LTS.

---

## 2. Configurar Security Group

- **SSH (22):** Sua IP (para administração).
- **HTTP (80) / HTTPS (443):** Para o load balancer ou CloudFront.
- **5432, 6379, 11434:** Apenas rede interna (VPC) – não exponha à internet.

---

## 3. Instalar Docker

### Amazon Linux 2023

```bash
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
# Faça logout/login para aplicar o grupo
```

### Ubuntu 22.04

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture)] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

---

## 4. Instalar NVIDIA Container Toolkit

O NVIDIA Container Toolkit permite que o Docker utilize a GPU dentro dos containers.

### Ubuntu 22.04

```bash
# Adicionar repositório NVIDIA
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Configurar o runtime
sudo nvidia-ctk runtime configure --runtime=docker

# Reiniciar Docker
sudo systemctl restart docker
```

### Amazon Linux 2023

```bash
# Instalar drivers NVIDIA (geralmente já presentes em AMIs GPU)
# Verificar: nvidia-smi

# Adicionar repositório
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.repo | sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo

sudo dnf install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

---

## 5. Verificar GPU

```bash
# Na máquina host (fora do Docker)
nvidia-smi

# Dentro de um container
docker run --rm --gpus all nvidia/cuda:12.0-base-ubuntu22.04 nvidia-smi
```

Se `nvidia-smi` listar a GPU, o ambiente está pronto.

---

## 6. Subir o Stack SIGEO com GPU

```bash
# Clonar o repositório (ou fazer deploy do código)
cd /opt/sigeo  # ou seu diretório

# Usar o override de GPU
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d

# Aguardar init-ollama baixar o modelo llava (primeira execução)
docker compose logs -f init-ollama
```

---

## 7. Variáveis de Ambiente (Produção)

Crie `.env` na raiz do projeto:

```env
JWT_SECRET=<seu-secret-forte>
JWT_REFRESH_SECRET=<outro-secret-forte>
DB_PASSWORD=<senha-postgres-segura>
```

Para RDS/ElastiCache externos:

```env
DB_HOST=<rds-endpoint>
REDIS_URL=redis://<elasticache-endpoint>:6379
```

---

## 8. Dicas de Infraestrutura

- **EBS:** Use gp3 com pelo menos 100 GB para o volume do Ollama (modelos são grandes).
- **Swap:** Considere 8–16 GB de swap em instâncias menores.
- **Logs:** Configure CloudWatch para logs do Docker.
- **Backup:** Faça snapshot do volume `ollama_storage` periodicamente se quiser cachear modelos.

---

## 9. Troubleshooting

| Problema | Solução |
|---------|---------|
| `could not select device driver "" with capabilities: [[gpu]]` | Instale o NVIDIA Container Toolkit e reinicie o Docker. |
| `nvidia-smi` não encontrado | Use uma AMI com drivers NVIDIA pré-instalados (ex: "Deep Learning AMI"). |
| Ollama lento sem GPU | Verifique `docker compose -f docker-compose.gpu.yml config` e confirme o bloco `deploy.resources`. |
| init-ollama falha | Verifique `docker compose logs init-ollama`. O Ollama precisa estar healthy antes. |
