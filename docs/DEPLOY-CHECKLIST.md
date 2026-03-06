# Checklist de Deploy AWS – SIGEO

## 1. Amplify (Web)

1. **Criar app Amplify**  
   - AWS Console → Amplify → New app → Host web app → Conectar repositório (GitHub).

2. **Configuração do build**  
   - App monorepo na raiz.  
   - Build spec: usar o `amplify.yml` na raiz (detectado automaticamente).  
   - Ou em "Build settings" colar o conteúdo de `amplify.yml`.

3. **Variáveis de ambiente**  
   - `VITE_API_URL` = URL da API (ex.: `https://xxxxx.us-east-1.awsapprunner.com`).

4. **Rewrites and redirects (SPA)**  
   - Adicionar regra: Source `/*`, Target `/index.html`, Type `200 (Rewrite)`.  
   - Ou usar a opção **Single-page app** / **SPA** no Amplify, que já aplica esse rewrite.

5. **Deploy**  
   - Push em `main`/`master` dispara build e deploy automático.

---

## 2. ECR + App Runner (API)

1. **ECR**  
   - Criar repositório: `sigeo-api` (ou outro nome).  
   - Anotar: `AWS_REGION`, `AWS_ACCOUNT_ID`, nome do repo.  
   - Ex.: `123456789012.dkr.ecr.us-east-1.amazonaws.com/sigeo-api`.

2. **App Runner – Criar serviço**  
   - Source: **Container registry** → ECR.  
   - Imagem: `sigeo-api:latest`.  
   - Configurar:
     - Porta: `3000`.  
     - CPU / Memória conforme necessidade.

3. **Variáveis de ambiente (App Runner)**  
   - `NODE_ENV` = `production`  
   - `PORT` = `3000`  
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (RDS ou outro Postgres).  
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` (valores fortes e únicos).  
   - `CORS_ORIGIN` = URL do front (ex.: `https://main.xxx.amplifyapp.com`).  
   - Opcional (S3): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`.

4. **Secrets (SSM Parameter Store)**  
   - Guardar senhas e tokens em SSM (SecureString).  
   - No App Runner, apontar variáveis para esses parâmetros quando suportado.

5. **Anotar**  
   - **App Runner Service ARN** (ex.: `arn:aws:apprunner:us-east-1:123456789012:service/xxx`).

---

## 3. S3 (Fotos)

1. Criar bucket (ex.: `sigeo-photos-ACCOUNT-ID`).  
2. Política mínima para a API (role do App Runner / ECS) fazer upload:
   - `s3:PutObject`, `s3:GetObject` no bucket (prefixo `photos/` se quiser restringir).  
3. Configurar na API: `S3_BUCKET`, `AWS_REGION` e credenciais (via role ou env).

---

## 4. GitHub Actions – API

1. **Secrets no repositório**  
   - `AWS_ACCESS_KEY_ID`  
   - `AWS_SECRET_ACCESS_KEY`  
   - `AWS_REGION` (ex.: `us-east-1`)  
   - `ECR_REPO` = nome do repositório ECR (ex.: `sigeo-api`)  
   - `APP_RUNNER_SERVICE_ARN` = ARN do serviço App Runner

2. **Workflow**  
   - O arquivo `.github/workflows/api-deploy.yml` faz:
     - Build da imagem Docker da API.  
     - Push para ECR.  
     - Deploy no App Runner (`start-deployment`).

3. **Disparo**  
   - Push em `main`/`master` (ou alterações em `apps/api`, `packages/shared`) dispara o workflow.

---

## 5. RDS (Produção)

- Criar instância PostgreSQL.  
- Configurar security group (liberar porta 5432 para o App Runner / ECS).  
- Usar `DB_*` no App Runner (ou ECS) conforme acima.

---

## 6. IAM (mínimo)

- **GitHub Actions**: usuário IAM com permissões para ECR (push) e App Runner (start-deployment).  
- **App Runner (ou ECS)**: role com permissão para ler secrets no SSM (se usar) e S3 (PutObject/GetObject no bucket de fotos).

---

## Ordem sugerida

1. ECR → build local da API → push manual da imagem → criar serviço App Runner.  
2. Configurar env vars + DB (RDS ou Postgres acessível).  
3. Amplify (web) + `VITE_API_URL` = URL do App Runner.  
4. Rewrites SPA no Amplify.  
5. S3 + IAM para fotos.  
6. GitHub Actions (secrets) → deploy contínuo da API.

---

## 7. Próximos passos (ECS Fargate)

- Migrar API do App Runner para **ECS Fargate** + ALB.  
- **ALB**: HTTP(S) na 443, target group apontando para o serviço ECS (porta 3000).  
- **ACM**: certificado SSL no ALB para o domínio da API.  
- **ECR**: manter a mesma imagem; o workflow de deploy passará a atualizar o serviço ECS em vez do App Runner.  
- Manter **RDS**, **S3** e **Amplify** como estão; apenas trocar o destino do deploy da API (novo workflow ou alterar o existente para ECS).
