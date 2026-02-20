# Executar o deploy AWS agora

## Migração: employee_id em users (Acessos dos Funcionários)

**Opção 1 – Script Node (recomendado):**

Crie `apps/api/.env.production` com os dados do RDS:
```
DB_HOST=seu-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=sigeo
```

Depois execute:
```powershell
cd d:\SERVIDOR\SISGEO
$env:NODE_ENV="production"
pnpm --filter @sigeo/api run db:migrate:employee-id
```

**Opção 2 – SQL direto no RDS Query Editor:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id uuid NULL;
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
```

---

Siga **nesta ordem**. O que já foi feito: Git init, build da imagem Docker da API, script `deploy-aws.ps1`.

---

## 1. Configurar AWS CLI

No PowerShell:

```powershell
aws configure
```

- **Access Key ID** e **Secret Access Key**: IAM → Users → seu user → Security credentials → Create access key.
- **Default region**: `sa-east-1` (São Paulo).
- **Default output**: `json` (ou deixar em branco).

---

## 2. ECR + Build + Push da API

```powershell
cd d:\SERVIDOR\SISGEO
.\scripts\deploy-aws.ps1
```

Isso cria o repositório ECR `sigeo-api` na região **sa-east-1**, faz build da imagem e push. Anote a **URI da imagem** (ex.: `123456789012.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest`).

---

## 3. Criar repositório no GitHub e dar push

1. GitHub → **New repository** (ex.: `sigeo`), **sem** README.
2. No projeto:

```powershell
cd d:\SERVIDOR\SISGEO
git remote add origin https://github.com/SEU_USUARIO/sigeo.git
git push -u origin main
```

(Substitua `SEU_USUARIO/sigeo` pelo seu repo.)

---

## 4. RDS (PostgreSQL)

- **AWS Console** → **RDS** → **Create database** → PostgreSQL 16.
- Anotar **endpoint**, **port** (5432), **master user** e **senha**.
- Criar o banco `sigeo` (via `psql` ou no passo de criação, se a UI permitir).
- **Security group**: liberar porta **5432** para o App Runner (via VPC connector) ou para o IP que for usar no seed.

---

## 5. App Runner (API)

**Se aparecer "SubscriptionRequiredException" ou "needs a subscription"**: acesse **AWS Console** → **App Runner** → **Get started** (ou "Introdução") para habilitar o serviço na conta.

- **AWS Console** → **App Runner** → **Create service**.
- **Source**: Container registry → ECR → imagem `sigeo-api:latest`.
- **Port**: `3000`.
- **Env vars**:

  | Nome | Valor |
  |------|--------|
  | `NODE_ENV` | `production` |
  | `PORT` | `3000` |
  | `DB_HOST` | endpoint do RDS |
  | `DB_PORT` | `5432` |
  | `DB_USER` | user mestre |
  | `DB_PASSWORD` | senha mestre |
  | `DB_NAME` | `sigeo` |
  | `JWT_SECRET` | `openssl rand -hex 32` |
  | `JWT_REFRESH_SECRET` | outro `openssl rand -hex 32` |
  | `CORS_ORIGIN` | `https://main.xxxxx.amplifyapp.com` (atualizar depois do Amplify) |

- **VPC**: se o RDS estiver na VPC, configurar **VPC connector** para o App Runner.
- Anotar **Default domain** do App Runner (ex.: `https://….awsapprunner.com`).

---

## 6. Amplify (Web)

- **AWS Console** → **Amplify** → **New app** → **Host web app** → **GitHub** → escolher o repo e a branch `main`.
- **Build**: usar o `amplify.yml` na raiz (monorepo).
- **Env var**: `VITE_API_URL` = **URL do App Runner** (ex.: `https://….awsapprunner.com`).
- **Rewrites (obrigatório para a página abrir)**: regra SPA para servir `index.html` em todas as rotas. No Console: **Hosting** → **Rewrites and redirects** → **Manage redirects** e use o JSON de `scripts/amplify-custom-rules.json`, ou rode:
  ```powershell
  .\scripts\amplify-spa-redirect.ps1 -AwsRegion sa-east-1
  ```
- **Env var**: `VITE_API_URL` = URL do App Runner (ex.: `https://….awsapprunner.com`).
- Anotar a **URL do app** (ex.: `https://main.xxxxx.amplifyapp.com`).

Depois, voltar ao **App Runner** e ajustar `CORS_ORIGIN` para essa URL do Amplify.

---

## 7. GitHub Secrets (deploy contínuo da API)

No **GitHub** → repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Nome | Valor |
|------|--------|
| `AWS_ACCESS_KEY_ID` | access key do IAM user |
| `AWS_SECRET_ACCESS_KEY` | secret key |
| `AWS_REGION` | `sa-east-1` |
| `ECR_REPO` | `sigeo-api` |
| `APP_RUNNER_SERVICE_ARN` | ARN do serviço App Runner |

O workflow `.github/workflows/api-deploy.yml` usa esses secrets para build, push no ECR e deploy no App Runner.

---

## 8. Seed do admin

Com o RDS acessível (ex.: público temporário ou via bastion):

```powershell
cd d:\SERVIDOR\SISGEO
$env:DB_HOST = "ENDPOINT_RDS"
$env:DB_PORT = "5432"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "SUA_SENHA"
$env:DB_NAME = "sigeo"
pnpm run db:seed
```

Ou rodar o seed de dentro da VPC (EC2/bastion). Login: **admin@sigeo.local** / **admin123**.

---

## Resumo do que já foi executado

- Git init, add, commit.
- Build da imagem Docker da API (`sigeo-api:latest`).
- Script `scripts/deploy-aws.ps1` (ECR + build + push).
- `.dockerignore` e Dockerfile ajustados para o monorepo.

## O que você precisa fazer

1. `aws configure` e depois `.\scripts\deploy-aws.ps1`.
2. Criar repo no GitHub e `git push`.
3. Criar RDS, App Runner, Amplify e GitHub Secrets conforme acima.
4. Rodar o seed e testar o login.
