# Auditoria Técnica – SISGEO (Produção AWS)

**Data:** 2025-02-04  
**Objetivo:** Verificar prontidão para produção na AWS e completude das funcionalidades inovadoras.

---

## 1. Verificação de Tech Stack

| Componente | Solicitado | Implementado | Status |
|------------|------------|--------------|--------|
| **Backend** | Node.js/TypeScript (Clean Architecture) + BullMQ | NestJS 11 + TypeORM + BullMQ | ✅ |
| **Frontend Web** | React (Next.js) + shadcn/ui + Tailwind | Vite 7 + MUI 7 + Tailwind 4 | ⚠️ Diferente |
| **Mobile** | React Native (Expo) + SQLite Offline-First | Expo 54 + AsyncStorage + fila JSON | ⚠️ Sem SQLite |
| **Banco de Dados** | PostgreSQL (Prisma ORM) + Migrations + Seeds | PostgreSQL 15 + TypeORM + SQL migrations + bootstrap | ⚠️ TypeORM, não Prisma |
| **Infraestrutura** | Docker Compose + Ollama/LLaVA GPU | docker-compose.yml + docker-compose.gpu.yml | ✅ |
| **IA Local** | Ollama Vision AI + Voice Assistant | Ollama LLaVA + llama3.2, BullMQ, circuit breaker | ✅ |

### Observações

- **Frontend:** O projeto usa Vite + MUI (não Next.js + shadcn). A stack atual é estável e adequada para produção.
- **Mobile Offline:** Usa AsyncStorage + fila de ações pendentes. SQLite pode ser adicionado futuramente para cache de tarefas.
- **ORM:** A API usa TypeORM; `packages/database` contém schema Prisma legado não integrado. Recomenda-se manter TypeORM como padrão.

---

## 2. Mapa de Arquivos e Diretórios

### Estrutura Real

```
apps/
├── api/src/
│   ├── common/           # Guards, decorators, filters, interceptors
│   ├── config/           # database.ts
│   ├── db/               # bootstrap, seed, run-migrations, migrations/*.sql
│   ├── entities/         # ~50 entidades TypeORM
│   ├── modules/
│   │   ├── vision/       # VisionService (Ollama LLaVA)
│   │   ├── voice/        # VoiceService (Ollama llama3.2)
│   │   ├── suprimentos/  # SuprimentosService (Smart Procurement)
│   │   ├── ativos/       # AtivosService
│   │   ├── auth, audit, areas, checklist, dashboard, digital-twin,
│   │   │   findme-score, incidents, procedimentos, risco-colaborador,
│   │   │   time-clock, upload, ai-vision, admin...
│   └── services/         # visionAI.service.ts (fila BullMQ)
├── web/src/
│   ├── components/       # DigitalTwinMap, layout, ui
│   ├── pages/            # Dashboard, Suprimentos, DigitalTwin, etc.
│   └── ...
└── mobile/src/
    ├── screens/          # HomeScreen, TasksScreen, ARNavigationScreen
    ├── features/         # tasks, timeclock, offline, checklist, voice
    ├── services/         # apiClient, voiceAssistantService, visionService
    └── components/       # ar/ARNavigation, voice/VoiceAssistant

packages/
├── shared/               # schemas Zod, types, utils
└── database/             # Prisma schema (legado, não usado pela API)

scripts/
├── docker-up.ps1        # docker compose up -d
├── init-ollama.sh       # pull llava
├── run-migrations-prod.ps1
└── deploy-aws-full.ps1
```

### Serviços Principais

| Serviço | Localização | Função |
|---------|-------------|--------|
| VisionService | `modules/vision/vision.service.ts` | Análise de fotos via Ollama LLaVA |
| VoiceService | `modules/voice/voice.service.ts` | Parse de intenções via Ollama |
| SuprimentosService | `modules/suprimentos/suprimentos.service.ts` | Smart Procurement, estoque, pedidos |
| AtivosService | `modules/ativos/ativos.service.ts` | Gestão de ativos/CMMS |

---

## 3. Checklist de Funcionalidades Disruptivas

| Funcionalidade | Status | Detalhes |
|----------------|--------|----------|
| **FindMe Score** | ✅ | Algoritmo ponderado (Pontualidade 40%, Conformidade 40%, Ocorrências 20%). Endpoints `/dashboard/findme-score/calculate`. |
| **SLA & Alertas** | ✅ | Scheduler a cada 5 min, alerta 15 min após horário em setor crítico. E-mail via SMTP. Campo `sla_alerted_at`. |
| **Vision AI (Ollama)** | ✅ | Fila BullMQ assíncrona, LLaVA, circuit breaker, WebSocket para alertas de baixa confiança. |
| **Smart Procurement** | ✅ | Abate automático ao marcar checklist com insumo. Geração de pedido ao atingir estoque mínimo. Página Suprimentos. |
| **Digital Twin** | ✅ | Planta baixa, zonas por área, status de higiene, WebSocket tempo real, FindMe Score por zona. |
| **Voice Assistant** | ✅ | Ollama llama3.2 para intenções (REPORT_INCIDENT, CHECK_ITEM, etc.). Fallback regex. |

---

## 4. Segurança e Deploy

### Variáveis de Ambiente

- **Template:** `apps/api/env.production.example` (completo com placeholders AWS)
- **Arquivo real:** `.env.production` (gitignored, não commitado)

### RBAC

- `RolesGuard` + `@Roles('ADMIN','SUPERVISOR','AUXILIAR')`
- Rotas sensíveis (Suprimentos, RH Preditivo, Auditoria) protegidas por `AdminOrSupervisorOnly`
- Sem permissões granulares por recurso (apenas roles)

### Compressão de Imagens

- **Backend:** Sharp (1920x1920, JPEG 85%, mozjpeg) antes do upload
- **Mobile:** expo-image-manipulator antes do envio
- **Web:** Não há compressão client-side; considerar `browser-image-compression` para uploads do dashboard

### Pontos de Atenção

1. **JWT:** Fallback para secret de dev em produção — usar AWS Secrets Manager ou SSM
2. **CSP:** Helmet com `contentSecurityPolicy: false` — reativar com política mínima
3. **Health:** Expandir `/health` com checagem de Redis, Ollama e S3

---

## 5. Comando para Rodar o Ambiente Completo

### Via Docker (produção local / staging)

```powershell
# Subir todos os serviços (db, redis, ollama, api)
cd d:\SERVIDOR\SISGEO
.\scripts\docker-up.ps1

# Com MinIO (S3 local)
.\scripts\docker-up.ps1 -Minio

# Com GPU (EC2 G4ad/G5)
.\scripts\docker-up.ps1 -Gpu
```

Ou diretamente:

```bash
# Ambiente padrão
docker compose up -d

# Com GPU
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d

# Com MinIO
docker compose --profile minio up -d
```

### Desenvolvimento local (API + Web)

```powershell
# Sobe Postgres e Redis, depois API + Web
.\scripts\dev-local.ps1
```

### Migrações em produção

```powershell
cd apps\api
$env:NODE_ENV = "production"
# Carregue .env.production (ou use dotenv)
pnpm run db:migrate
```

---

## 6. Resumo Executivo

O SISGEO está **pronto para produção na AWS** com as seguintes ressalvas:

- **Funcionalidades:** FindMe Score, SLA, Vision AI, Smart Procurement, Digital Twin e Voice Assistant estão implementadas e integradas.
- **Stack:** NestJS + TypeORM + BullMQ + Vite + MUI + Expo. Diferente do solicitado em alguns pontos (Next.js, Prisma, SQLite), mas adequada e estável.
- **Segurança:** RBAC por roles ativo; reforçar secrets em produção e CSP.
- **Deploy:** Docker Compose funcional; scripts de deploy AWS documentados em `docs/`.
