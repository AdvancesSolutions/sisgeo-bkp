# Como subir o SIGEO para a AWS

Guia passo a passo para colocar **Web** (Amplify), **API** (App Runner) e **Banco** (RDS) no ar. No fim, o front faz login na API na AWS e usa o sistema.

---

## Resumo em 6 passos

1. **RDS** – Criar PostgreSQL, anotar endpoint/senha, criar DB `sigeo`.
2. **ECR** – Criar repositório `sigeo-api`; build local da API e `docker push`.
3. **App Runner** – Criar serviço a partir da imagem ECR, porta 3000, env vars (`DB_*`, `JWT_*`, `CORS_ORIGIN`), VPC connector se precisar falar com RDS.
4. **Amplify** – Conectar repo GitHub, usar `amplify.yml` na raiz, definir `VITE_API_URL` = URL do App Runner, rewrites SPA.
5. **GitHub Secrets** – `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `ECR_REPO`, `APP_RUNNER_SERVICE_ARN`; workflow faz deploy da API a cada push.
6. **Seed** – Rodar seed (local com `DB_*` apontando ao RDS, ou por um job na VPC) para criar o usuário admin.

---

## Pré-requisitos

- Conta AWS
- Repositório **GitHub** com o código do SIGEO (monorepo na raiz)
- AWS CLI instalado (opcional; dá para fazer tudo pelo Console)
- Git: branch `main` ou `master` atualizada

---

## Visão geral

| Componente | Serviço AWS | URL final |
|------------|-------------|-----------|
| Frontend   | Amplify     | `https://main.xxxxx.amplifyapp.com` |
| API        | App Runner  | `https://xxxxx.us-east-1.awsapprunner.com` |
| Banco      | RDS Postgres| acessível só pela VPC (API) |
| Fotos      | S3 (opcional)| bucket próprio |

O front chama a API via `VITE_API_URL`. A API usa RDS para os dados.

---

## Parte 1 – Banco (RDS PostgreSQL)

1. **AWS Console** → **RDS** → **Create database**.
2. **Engine**: PostgreSQL 16.
3. **Templates**: **Free tier** (ou Dev/Test) se disponível.
4. **Config**:
   - **DB instance**: `sigeo-db` (ou outro nome).
   - **Master username**: `postgres` (ou outro).
   - **Master password**: crie uma senha forte e **guarde**.
5. **Instance**: `db.t3.micro` (free tier) ou maior.
6. **Storage**: 20 GB (ou o mínimo).
7. **Connectivity**:
   - **VPC**: default (ou a que você usar para App Runner).
   - **Public access**: **No** (mais seguro).
   - Crie um **security group** ou use um existente.

8. **Criar**.

9. Anotar:
   - **Endpoint** (ex.: `sigeo-db.xxxxx.us-east-1.rds.amazonaws.com`).
   - **Port**: `5432`.
   - **Master username** e **Master password**.

### Liberar o App Runner para acessar o RDS

- O App Runner usa uma **VPC connector** para falar com a VPC onde está o RDS.
- RDS e App Runner precisam estar na **mesma VPC** (ou VPCs com peering).
- No **security group do RDS**:
  - **Inbound**: abrir **porta 5432** para o security group do **VPC connector** usado pelo App Runner  
  - Ou, em cenário simples de teste, para o CIDR da sub-rede onde o App Runner injeta os tasks (o próprio SG do connector).

Guarde esses dados; vamos usar como `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

---

## Parte 2 – API: ECR + App Runner

### 2.1 ECR (repositório da imagem Docker)

1. **AWS Console** → **ECR** → **Create repository**.
2. **Name**: `sigeo-api`.
3. **Create**.
4. Anotar:
   - **URI** (ex.: `123456789012.dkr.ecr.us-east-1.amazonaws.com/sigeo-api`).
   - **Region** (ex.: `us-east-1`).

### 2.2 Build e push da imagem (primeira vez)

No seu PC (com Docker rodando):

```powershell
cd d:\SERVIDOR\SISGEO

# Login no ECR (troque REGION e ACCOUNT_ID)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build e tag
docker build -f apps/api/Dockerfile -t sigeo-api:latest .

# Tag para o ECR
docker tag sigeo-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/sigeo-api:latest

# Push
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/sigeo-api:latest
```

(Substitua `123456789012` e `us-east-1` pelos seus.)

### 2.3 App Runner – criar o serviço da API

1. **AWS Console** → **App Runner** → **Create service**.
2. **Source**:
   - **Container registry** → **Amazon ECR**.
   - **Image URI**: `123456789012.dkr.ecr.us-east-1.amazonaws.com/sigeo-api:latest`.
   - **ECR access**: use **default** (ou uma IAM role com acesso ao ECR).
3. **Service name**: `sigeo-api`.
4. **Port**: `3000`.
5. **CPU / Memory**: ex. 1 vCPU, 2 GB.
6. **Environment variables** – adicionar:

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `DB_HOST` | endpoint do RDS |
   | `DB_PORT` | `5432` |
   | `DB_USER` | usuário mestre do RDS |
   | `DB_PASSWORD` | senha mestre do RDS |
   | `DB_NAME` | `sigeo` (criar o DB no RDS se não existir) |
   | `JWT_SECRET` | string longa e aleatória (ex. `openssl rand -hex 32`) |
   | `JWT_REFRESH_SECRET` | outra string longa e aleatória |
   | `CORS_ORIGIN` | `https://main.xxxxx.amplifyapp.com` (você ajusta depois que criar o Amplify) |

7. **VPC** (importante para RDS):
   - Se o RDS está numa VPC, configure **VPC connector** para o App Runner usar essa VPC.  
   - Assim a API consegue alcançar o RDS.

8. **Create & deploy**.

9. Quando o deploy acabar, anotar:
   - **Default domain** (ex.: `https://xxxxx.us-east-1.awsapprunner.com`).

### Criar o banco `sigeo` no RDS

Se você não criou o DB `sigeo` na criação do RDS:

- Conecte ao RDS (por ex. via bastion, ou temporariamente com “public access” **Yes** só para criar o DB).
- `CREATE DATABASE sigeo;`
- Depois pode desligar o acesso público de novo.

A API usa `DB_NAME=sigeo`. Em produção o TypeORM está com `synchronize: false` (código atual). Para o **primeiro deploy** você precisa ter as tabelas no RDS. Opções:

- **A)** Rodar a API uma vez em **dev** contra o RDS (env `DB_HOST` = endpoint do RDS, etc.) com `NODE_ENV=development`; o `synchronize` cria as tabelas. Depois volte `NODE_ENV=production` no App Runner.
- **B)** Usar migrations (gerar e rodar via TypeORM CLI contra o RDS).
- **C)** Exportar o schema do Postgres local (após rodar a API com sync) e importar no RDS.

---

## Parte 3 – Frontend (Amplify)

1. **AWS Console** → **Amplify** → **New app** → **Host web app**.
2. **GitHub** → autorize e escolha o **repositório** e a **branch** (`main` ou `master`).
3. **Build settings**:
   - Amplify deve detectar o `amplify.yml` na **raiz** do repositório.
   - Se não detectar, em **Build settings** use **monorepo** e aponte para a raiz; ou copie o conteúdo do `amplify.yml` do projeto.
4. **Advanced settings** → **Environment variables**:
   - `VITE_API_URL` = **URL do App Runner** (ex.: `https://xxxxx.us-east-1.awsapprunner.com`).
5. **Save and deploy**.

### Rewrites (SPA)

- Em **App settings** → **Rewrites and redirects**:
  - **Source**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
  - **Target**: `/index.html`
  - **Type**: `200 (Rewrite)`  
- Ou use a opção **Single-page app (SPA)** se o Amplify tiver.

6. Anotar a URL do app (ex.: `https://main.xxxxx.amplifyapp.com`).

### Atualizar CORS na API

- No **App Runner** → seu serviço → **Configuration** → **Environment variables**:
  - Ajuste `CORS_ORIGIN` para a URL **exata** do Amplify (ex.: `https://main.xxxxx.amplifyapp.com`).
- **Deploy** de novo (ou “Deploy” no App Runner) para aplicar.

---

## Parte 4 – Deploy contínuo da API (GitHub Actions)

Assim, cada push na `main` (em `apps/api` ou `packages/shared`) dispara build da imagem, push para o ECR e novo deploy no App Runner.

### 4.1 IAM user para o GitHub

1. **IAM** → **Users** → **Create user** (ex.: `github-sigeo-deploy`).
2. **Attach policies directly** → **Create policy** (JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:us-east-1:123456789012:repository/sigeo-api"
    },
    {
      "Effect": "Allow",
      "Action": [
        "apprunner:StartDeployment",
        "apprunner:DescribeService",
        "apprunner:DescribeDeployment"
      ],
      "Resource": "arn:aws:apprunner:us-east-1:123456789012:service/*"
    }
  ]
}
```

(Substitua `123456789012` e `us-east-1` pelos seus.)

3. Attach essa policy ao user.
4. **Security credentials** → **Create access key** → **CLI** → anotar **Access key** e **Secret key**.

### 4.2 Secrets no GitHub

No **repositório** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Name | Value |
|------|--------|
| `AWS_ACCESS_KEY_ID` | access key do user IAM |
| `AWS_SECRET_ACCESS_KEY` | secret key do user IAM |
| `AWS_REGION` | `us-east-1` (ou sua região) |
| `ECR_REPO` | `sigeo-api` |
| `APP_RUNNER_SERVICE_ARN` | ARN do serviço App Runner (ex.: `arn:aws:apprunner:us-east-1:123456789012:service/sigeo-api/xxxx`) |

O workflow `.github/workflows/api-deploy.yml` já usa esses secrets.

### 4.3 Disparar o deploy

- **Opção A**: Push para `main` em `apps/api` ou `packages/shared` (o workflow roda sozinho).
- **Opção B**: **Actions** → **API Build & Deploy (App Runner)** → **Run workflow**.

---

## Parte 5 – S3 (fotos) – opcional

1. **S3** → **Create bucket** (ex.: `sigeo-photos-123456789012`).
2. **Block Public Access**: manter bloqueado; a API acessa via IAM.
3. **Bucket policy** ou **IAM role do App Runner**: permitir `s3:PutObject` e `s3:GetObject` nesse bucket (ex.: prefixo `photos/`).
4. No App Runner, env vars da API:
   - `S3_BUCKET` = nome do bucket.
   - `AWS_REGION` = mesma região.
   - Se a API não usar a role do App Runner para S3, configurar `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` de um user com acesso ao bucket (menos ideal que role).

---

## Checklist rápido

- [ ] RDS Postgres criado; security group liberando 5432 para o App Runner / VPC connector.
- [ ] DB `sigeo` criado no RDS.
- [ ] ECR `sigeo-api` criado; imagem da API no ECR.
- [ ] App Runner criado (imagem ECR, porta 3000, env vars, VPC se precisar).
- [ ] Amplify apontando para o repo, `amplify.yml` na raiz, `VITE_API_URL` = URL do App Runner.
- [ ] Rewrites SPA no Amplify.
- [ ] `CORS_ORIGIN` na API = URL do Amplify.
- [ ] Secrets do GitHub preenchidos; workflow da API rodando (manual ou por push).
- [ ] (Opcional) S3 + permissões para fotos.

---

## Depois do deploy

1. **Seed do admin**  
   A API na AWS não roda o seed automático. Opções:
   - **RDS com acesso público (só para setup):** No PC, configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` no `.env` da API apontando para o RDS e rode `pnpm run db:seed`. Depois desligue o acesso público do RDS.
   - **RDS só na VPC:** Rode o seed de dentro da VPC (bastion, EC2, ou job temporário) com as mesmas env vars.
   - **Endpoint /seed (temporário):** Crie um route protegido por `SEED_SECRET` que cria o admin; chame uma vez (ex.: `curl`) e depois remova.

2. **Testar**  
   - Abrir a URL do Amplify.  
   - Login: `admin@sigeo.local` / `admin123` (se o seed tiver sido aplicado).

3. **Logs**  
   - **App Runner** → seu serviço → **Logs** (CloudWatch).  
   - **Amplify** → **Build** ou **Deploy** para ver logs de build.

---

## Resumo de URLs e env

| Onde | Variável | Exemplo |
|------|----------|---------|
| Amplify | `VITE_API_URL` | `https://xxxxx.us-east-1.awsapprunner.com` |
| App Runner | `CORS_ORIGIN` | `https://main.xxxxx.amplifyapp.com` |
| App Runner | `DB_*` | RDS endpoint, user, password, `sigeo` |

Com isso, o SIGEO fica no ar na AWS (Web + API + RDS) e o deploy da API automatizado via GitHub Actions.
