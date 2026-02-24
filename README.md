# SIGEO – Gestão Operacional

Web Admin para gestão operacional (funcionários, locais, áreas, tarefas, validação por foto, materiais, ponto, auditoria). Preparado para deploy na AWS (Amplify + App Runner, evolução para ECS).

## Stack

- **Monorepo**: pnpm workspaces
- **Web**: React, Vite, Tailwind, React Router (`apps/web`)
- **API**: NestJS, TypeORM, PostgreSQL (`apps/api`)
- **Shared**: types, schemas Zod, utils (`packages/shared`)

## Visão geral e arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Web       │     │   API       │     │  PostgreSQL  │
│  (Vite)     │────▶│  (NestJS)   │────▶│  (Docker)    │
│  :5173      │     │  :3000      │     │  :5432       │
└─────────────┘     └─────────────┘     └──────────────┘
                           │
                    ┌──────┴──────┐
                    │ S3 / MinIO  │  (fotos, opcional)
                    └─────────────┘
```

- **Auth**: JWT + Refresh Token
- **Auditoria**: middleware registra ações (CREATE/UPDATE/DELETE) com user, entity, payload (sanitizado)
- **Upload**: multipart → local `./uploads` ou S3 conforme env

## Passo a passo – criação e execução local

### 1. Pré-requisitos

- Node 18+
- pnpm (`npm install -g pnpm`)
- Docker e Docker Compose (para Postgres)

### 2. Clonar e instalar

```bash
cd d:\SERVIDOR\SISGEO
pnpm install
```

**Comandos exatos (copiar e colar):**

```powershell
cd d:\SERVIDOR\SISGEO
pnpm install
copy apps\web\env.example apps\web\.env
copy apps\api\env.example apps\api\.env
docker compose up -d postgres
pnpm run dev
```

Após a primeira subida da API, em outro terminal:

```powershell
pnpm run db:seed
```

Login: **admin@sigeo.local** / **admin123**

### 3. Variáveis de ambiente

**Web**

```bash
# opcional; padrão dev usa /api (proxy Vite)
cp apps/web/env.example apps/web/.env
# Editar .env: VITE_API_URL=http://localhost:3000 (ou deixar vazio para proxy)
```

**API**

```bash
cp apps/api/env.example apps/api/.env
# Ajustar DB_* se necessário (padrão: postgres/postgres/sigeo)
```

### 4. Postgres

Requer **Docker** em execução (Docker Desktop no Windows).

```bash
docker compose up -d postgres
```

Aguarde o healthcheck. Em seguida:

```bash
pnpm run dev
```

Isso sobe **API** e **Web** em paralelo. Na primeira subida, a API cria as tabelas (`synchronize` em dev).

### 5. Seed (usuário admin)

Depois da primeira execução da API:

```bash
pnpm run db:seed
```

Login: **admin@sigeo.local** / **admin123**

### 6. Acessar

- Web: http://localhost:5173  
- API: http://localhost:3000  
- Swagger: http://localhost:3000/api-docs  

### 7. Scripts úteis

```bash
pnpm run dev          # API + Web
pnpm run dev:web      # Só web
pnpm run dev:api      # Só API
pnpm run build        # Build tudo
pnpm run docker:up    # Postgres + API (compose)
pnpm run docker:down  # Para containers
pnpm run db:seed      # Cria admin
```

### 8. Sincronização com AWS

Para trabalhar com dados de produção localmente:

```powershell
cd scripts
.\sync-environment.ps1
```

Menu interativo com opções:
- **AWS → Local**: Baixa dados de produção para desenvolvimento
- **Local → AWS**: Envia dados locais para produção (⚠️ cuidado!)
- **Status**: Mostra estado dos ambientes

Ou use diretamente:

```powershell
# Baixar dados de produção
.\sync-aws-to-local.ps1

# Enviar para produção (requer confirmação)
.\sync-local-to-aws.ps1
```

**Documentação completa**: [docs/SYNC-ENVIRONMENTS.md](./docs/SYNC-ENVIRONMENTS.md)

### 9. Docker completo (Postgres + API)

```bash
pnpm run docker:up
```

API sobe em http://localhost:3000. Web continua rodando local (`pnpm run dev:web`) apontando para a API.

## Estrutura de pastas

```
SISGEO/
├── apps/
│   ├── web/                 # React + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   ├── lib/
│   │   │   ├── pages/
│   │   │   └── ...
│   │   ├── env.example
│   │   └── vite.config.ts
│   └── api/                 # NestJS
│       ├── src/
│       │   ├── common/      # guards, decorators, interceptors
│       │   ├── config/
│       │   ├── entities/
│       │   ├── modules/     # auth, employees, locations, ...
│       │   └── main.ts
│       ├── Dockerfile
│       └── env.example
├── packages/
│   └── shared/              # types, zod schemas, utils
├── scripts/
│   ├── dev-local.ps1
│   ├── docker-up.ps1
│   └── docker-down.ps1
├── .github/workflows/
│   └── api-deploy.yml       # CI/CD API → ECR + App Runner
├── amplify.yml              # Build Amplify (web)
├── docker-compose.yml
├── DEPLOY-CHECKLIST.md
└── README.md
```

## Principais arquivos de configuração

- **Tailwind**: `apps/web` usa `@tailwindcss/vite`; `src/index.css` tem `@import 'tailwindcss'`.
- **Vite**: `apps/web/vite.config.ts` – plugin React, Tailwind, alias `@/`, proxy `/api` → API.
- **TypeScript**: `tsconfig.json` em cada app; `paths` em `tsconfig.app.json` (web) para `@/*`.
- **Env**: `apps/web/env.example`, `apps/api/env.example`; criar `.env` a partir deles.

## AWS e CI/CD

- **Web**: deploy via **Amplify** (build a partir de `amplify.yml`).
- **API**: **App Runner** (imagem Docker); build/push **ECR** e deploy via **GitHub Actions** (`api-deploy.yml`).
- **Como subir para AWS (passo a passo):** [docs/DEPLOY-AWS-PASSO-A-PASSO.md](./docs/DEPLOY-AWS-PASSO-A-PASSO.md).
- **Checklist** resumido: [DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md).

### Secrets no GitHub (Actions)

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `ECR_REPO` (ex.: `sigeo-api`)
- `APP_RUNNER_SERVICE_ARN`

## Segurança e boas práticas

- CORS configurável por env.
- Helmet habilitado.
- Rate limit (Throttler) básico.
- Validação com Zod (shared) e class-validator onde aplicável.
- Auditoria sem dados sensíveis (passwords, tokens sanitizados).

## Próximos passos

- Migrar API do App Runner para **ECS Fargate** + ALB + ACM.
- RDS para Postgres em produção.
- ElastiCache Redis (cache/fila) quando necessário.
