# Secrets do GitHub para Deploy Automático (Backend)

O workflow **Deploy Backend** (`.github/workflows/deploy-backend.yml`) roda em todo **push na branch `main`**. Ele executa, em ordem:

1. **Migrações** — obtém a senha do RDS no SSM, roda `db:migrate` e `db:bootstrap`.
2. **Build & Deploy** — build da imagem Docker, push para ECR, atualização do serviço ECS (force new deployment).

O **frontend** é implantado pelo **AWS Amplify** sempre que há push no branch conectado (ex.: `main`). O build é definido em `amplify.yml` (pnpm install, build shared, build web).

**Nota:** Se você já usava o workflow `.github/workflows/api-deploy.yml`, pode desativá-lo ou removê-lo para evitar dois pipelines no mesmo push (o `deploy-backend.yml` já cobre build + push ECR + ECS).

---

## Secrets obrigatórios no GitHub

Configure em **GitHub → Repositório → Settings → Secrets and variables → Actions**.

**Sincronização automática:** se você tem um arquivo `.env.production` na raiz com as chaves preenchidas, use o script para configurar todos os secrets de uma vez.

### Como rodar o sync de forma segura

1. **Certifique-se de estar no repositório correto** (o `gh` usa o remoto `origin`):
   ```powershell
   git remote -v
   ```

2. **Autentique o gh CLI** (se ainda não fez):
   ```powershell
   gh auth login
   ```

3. **Simule antes** (opcional — só mostra o que seria enviado):
   ```powershell
   cd d:\SERVIDOR\SISGEO
   .\scripts\sync-env-to-github-secrets.ps1 -DryRun
   ```

4. **Execute o sync** (envia cada variável via `gh secret set`; os valores passam por stdin, não aparecem no log):
   ```powershell
   .\scripts\sync-env-to-github-secrets.ps1
   ```

5. **Se usar outro arquivo** (ex.: `apps/api/.env.production`):
   ```powershell
   .\scripts\sync-env-to-github-secrets.ps1 -EnvFile "apps\api\.env.production"
   ```

O script ignora linhas vazias, comentários e variáveis sem valor. Requer [gh CLI](https://cli.github.com/) instalado.

Para o deploy automático, inclua no `.env.production` também as chaves específicas do workflow: `ECR_REPO`, `CLUSTER_NAME`, `SERVICE_NAME`, `SSM_DB_PASSWORD_PARAM` (veja tabela abaixo).

| Secret | Descrição | Exemplo |
|--------|-----------|--------|
| `AWS_ACCESS_KEY_ID` | Access Key de um usuário IAM com permissão para ECR, ECS e SSM | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Secret Key do mesmo usuário IAM | — |
| `AWS_REGION` | Região onde estão ECR, ECS e RDS | `sa-east-1` |
| `ECR_REPO` | Nome do repositório na ECR (só o nome, sem URI) | `sigeo-api` |
| `CLUSTER_NAME` | Nome do cluster ECS | `sigeo-cluster` |
| `SERVICE_NAME` | Nome do serviço ECS da API | `sigeo-api` |
| `SSM_DB_PASSWORD_PARAM` | Nome do parâmetro SSM com a senha do RDS | `/sigeo/db-password` |
| `DB_HOST` | Host do RDS (endpoint) | `sigeo-db.xxxx.sa-east-1.rds.amazonaws.com` |
| `DB_USER` | Usuário do banco | `postgres` |
| `DB_NAME` | Nome do banco | `sigeo` |
| `DB_PORT` | (Opcional) Porta do PostgreSQL; padrão `5432` | `5432` |

---

## Mapeamento: obter nomes exatos do ECS (evitar erros de digitação)

Rode os comandos abaixo no terminal (ajuste `--region` se necessário) para copiar os nomes exatos para `CLUSTER_NAME` e `SERVICE_NAME`:

```powershell
# 1. Listar clusters ECS (copie o nome depois da última barra)
aws ecs list-clusters --region sa-east-1 --output table

# 2. Listar serviços de um cluster (substitua NOME_DO_CLUSTER pelo resultado do passo 1)
aws ecs list-services --cluster NOME_DO_CLUSTER --region sa-east-1 --output table
```

Para ver os nomes completos em formato JSON (fácil de copiar):

```powershell
# Clusters
aws ecs list-clusters --region sa-east-1 --query "clusterArns[]" --output text

# Serviços (substitua sigeo-cluster pelo nome do seu cluster)
aws ecs list-services --cluster sigeo-cluster --region sa-east-1 --query "serviceArns[]" --output text
```

Os ARNs retornam como `arn:aws:ecs:sa-east-1:123456789:cluster/nome-do-cluster`. O nome a usar no secret é apenas **`nome-do-cluster`** (a parte após a última `/`).

---

## Secrets críticos para evitar o erro 254 (build-and-deploy)

O **exit code 254** no job `build-and-deploy` costuma indicar:

- **Credenciais inválidas ou ausentes** — `AWS_ACCESS_KEY_ID` ou `AWS_SECRET_ACCESS_KEY` vazios/incorretos
- **Cluster ou serviço inexistente** — `CLUSTER_NAME` ou `SERVICE_NAME` errados
- **Permissões IAM insuficientes** — falta `ecs:UpdateService`, `ecs:DescribeServices`, etc.

**Secrets essenciais para o job build-and-deploy (se qualquer um estiver vazio, o erro 254 é provável):**

| Secret | Criticidade | Efeito se vazio |
|--------|-------------|------------------|
| `AWS_ACCESS_KEY_ID` | **Crítico** | Falha na autenticação AWS |
| `AWS_SECRET_ACCESS_KEY` | **Crítico** | Falha na autenticação AWS |
| `ECR_REPO` | **Crítico** | Tag Docker inválida; push falha |
| `CLUSTER_NAME` | **Crítico** | `ClusterNotFoundException` → exit 254 |
| `SERVICE_NAME` | **Crítico** | `ServiceNotFoundException` → exit 254 |
| `AWS_REGION` | Médio | Tem default `sa-east-1`; se incorreto, cluster não é encontrado |

**Pré-validação:** o workflow inclui um step "Pre-flight Check" que falha antes do build se algum desses secrets estiver ausente. Rode localmente antes de commitar:

```bash
./scripts/check-deploy-secrets.sh
```

Ou valide o `.env.production` antes de sincronizar com `sync-env-to-github-secrets`.

---

## Permissões IAM mínimas para o usuário do GitHub Actions

O usuário IAM cujas credenciais estão em `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` precisa de:

- **ECR:** `GetAuthorizationToken`; e no repositório: `BatchGetImage`, `GetDownloadUrlForLayer`, `PutImage`, `InitiateLayerUpload`, `UploadLayerPart`, `CompleteLayerUpload`, `BatchCheckLayerAvailability`.
- **ECS:** `UpdateService`, `DescribeClusters`, `DescribeServices`, `DescribeTasks`, `ListTasks` (e permissões de leitura para cluster/service/task definition).
- **SSM:** `GetParameter` (no parâmetro da senha) e **KMS:** `Decrypt` (se o parâmetro for do tipo SecureString).

> **Incluído para os steps de verificação:** `ecs:DescribeClusters` e `ecs:DescribeServices` são usados pelo Pre-flight no workflow para validar cluster e serviço antes do deploy.

**Política Inline (exemplo) para ECS:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeClusters",
        "ecs:DescribeServices",
        "ecs:DescribeTasks",
        "ecs:ListTasks"
      ],
      "Resource": "*"
    }
  ]
}
```

Pode usar uma política customizada ou anexar as managed policies:  
`AmazonEC2ContainerRegistryPowerUser`, `AmazonECS_FullAccess` (ou uma política mais restrita só para o cluster/serviço) e uma política que permita `ssm:GetParameter` + `kms:Decrypt` no parâmetro usado em `SSM_DB_PASSWORD_PARAM`.

---

## Integração das migrações no pipeline

- O job **migrate** roda **antes** do build e do deploy da API.
- A senha do banco é lida do **AWS SSM Parameter Store** (parâmetro em `SSM_DB_PASSWORD_PARAM`), equivalente ao que o script `scripts/run-migrations-prod.ps1` faz localmente.
- Em seguida são executados:
  - `pnpm --filter @sigeo/api run db:migrate` — aplica os arquivos em `apps/api/src/db/migrations/*.sql`.
  - `pnpm --filter @sigeo/api run db:bootstrap` — cria usuário admin, local e área padrão se não existirem (`continue-on-error: true` para não falhar o pipeline se já existirem).

Assim, o banco é atualizado **antes** da nova imagem da API subir no ECS.

---

## Executar migrações manualmente (local)

Continue usando o script em PowerShell quando quiser rodar migrações a partir da sua máquina:

```powershell
.\scripts\run-migrations-prod.ps1
```

Requer AWS CLI configurado e permissão para ler o parâmetro SSM da senha do RDS.

---

## Verificação: variáveis de ambiente (workflow vs scripts)

O workflow do GitHub e os scripts locais usam exatamente as mesmas variáveis esperadas por `db:migrate` e `db:bootstrap`:

| Variável | run-migrations-prod.ps1 | deploy-backend.yml | run-migrations.ts / bootstrap.ts |
|----------|--------------------------|---------------------|----------------------------------|
| `NODE_ENV` | `production` | `production` | — |
| `DB_HOST` | Hardcoded no script | Secret `DB_HOST` | `process.env.DB_HOST` |
| `DB_PORT` | `5432` | Secret `DB_PORT` (ou `5432`) | `process.env.DB_PORT` |
| `DB_USER` | `postgres` | Secret `DB_USER` | `process.env.DB_USER` |
| `DB_PASSWORD` | SSM `/sigeo/db-password` | SSM via `SSM_DB_PASSWORD_PARAM` → `$GITHUB_ENV` | `process.env.DB_PASSWORD` |
| `DB_NAME` | `sigeo` | Secret `DB_NAME` | `process.env.DB_NAME` |

O `db:migrate` (`run-migrations.ts`) e o `db:bootstrap` (`bootstrap.ts`) leem essas variáveis diretamente de `process.env`. O workflow injeta todas via `env` dos steps e `$GITHUB_ENV` (DB_PASSWORD).
