# Secrets do GitHub para Deploy Automático (Backend)

O workflow **Deploy Backend** (`.github/workflows/deploy-backend.yml`) roda em todo **push na branch `main`**. Ele executa, em ordem:

1. **Migrações** — obtém a senha do RDS no SSM, roda `db:migrate` e `db:bootstrap`.
2. **Build & Deploy** — build da imagem Docker, push para ECR, atualização do serviço ECS (force new deployment).

O **frontend** é implantado pelo **AWS Amplify** sempre que há push no branch conectado (ex.: `main`). O build é definido em `amplify.yml` (pnpm install, build shared, build web).

**Nota:** Se você já usava o workflow `.github/workflows/api-deploy.yml`, pode desativá-lo ou removê-lo para evitar dois pipelines no mesmo push (o `deploy-backend.yml` já cobre build + push ECR + ECS).

---

## Secrets obrigatórios no GitHub

Configure em **GitHub → Repositório → Settings → Secrets and variables → Actions**.

**Sincronização automática:** se você tem um arquivo `.env.production` na raiz com as chaves preenchidas, use o script para configurar todos os secrets de uma vez:

```powershell
.\scripts\sync-env-to-github-secrets.ps1
```

Ou em Linux/macOS:

```bash
./scripts/sync-env-to-github-secrets.sh
```

Requer [gh CLI](https://cli.github.com/) instalado e autenticado (`gh auth login`). O script ignora linhas vazias, comentários e variáveis sem valor.

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

## Permissões IAM mínimas para o usuário do GitHub Actions

O usuário IAM cujas credenciais estão em `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` precisa de:

- **ECR:** `GetAuthorizationToken`; e no repositório: `BatchGetImage`, `GetDownloadUrlForLayer`, `PutImage`, `InitiateLayerUpload`, `UploadLayerPart`, `CompleteLayerUpload`, `BatchCheckLayerAvailability`.
- **ECS:** `UpdateService`, `DescribeServices`, `DescribeTasks`, `ListTasks` (e permissões de leitura para cluster/service/task definition).
- **SSM:** `GetParameter` (no parâmetro da senha) e **KMS:** `Decrypt` (se o parâmetro for do tipo SecureString).

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
